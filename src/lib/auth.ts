import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserLevel, rewardDailyLoginExperience } from "@/lib/experience";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        if (user.banned) {
          // Use generic error message to avoid revealing user existence
          throw new Error("Invalid credentials");
        }

        let currentExperience = user.experience;

        try {
          const loginRewardResult = await rewardDailyLoginExperience(user.id);
          if (loginRewardResult.awarded && typeof loginRewardResult.experience === "number") {
            currentExperience = loginRewardResult.experience;
          }
        } catch (error) {
          console.error("Failed to reward daily login experience:", error);
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          postViewMode: user.postViewMode,
          experience: currentExperience,
          level: getUserLevel(currentExperience),
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
    
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.role = user.role;
        token.avatar = user.avatar;
        token.postViewMode = user.postViewMode;
        token.experience = user.experience;
        token.level = user.level;
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.avatar = session.user.avatar;
        // 确保 postViewMode 被更新，即使它是 undefined
        if ('postViewMode' in session.user) {
          token.postViewMode = session.user.postViewMode;
        }
        if ('showUserData' in session.user) {
          token.showUserData = session.user.showUserData;
        }
        if ('coverImage' in session.user) {
          token.coverImage = session.user.coverImage;
        }
        if ('experience' in session.user) {
          token.experience = session.user.experience;
        }
        if ('level' in session.user) {
          token.level = session.user.level;
        }
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string;
        session.user.postViewMode = token.postViewMode as string;
        session.user.showUserData = token.showUserData as boolean;
        session.user.coverImage = token.coverImage as string;
        session.user.experience = token.experience as number;
        session.user.level = token.level as number;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup", // Redirect new users to signup if needed, or just remove signUp if not used by NextAuth logic directly
  }
};
