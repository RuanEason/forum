import CredentialsProvider from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserLevel, rewardDailyLoginExperience } from "@/lib/experience";
import { findGitHubLinkedLoginUser } from "@/lib/github-auth";
import type { GitHubIdentity } from "@/lib/github";

type AuthUserPayload = {
  email?: string | null;
  role: string;
  avatar?: string | null;
  postViewMode?: string;
  showUserData?: boolean;
  coverImage?: string | null;
  experience?: number;
  level?: number;
};

type JwtCallbackParams = {
  token: JWT;
  user?: AuthUserPayload;
  trigger?: "signIn" | "signUp" | "update";
  session?: Session;
};

type SessionCallbackParams = {
  session: Session;
  token: JWT;
};

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
          email: user.email ?? null,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          postViewMode: user.postViewMode,
          showUserData: user.showUserData,
          coverImage: user.coverImage,
          experience: currentExperience,
          level: getUserLevel(currentExperience),
        };
      }
    }),
    CredentialsProvider({
      id: "github",
      name: "GitHub",
      credentials: {
        identity: { label: "Identity", type: "text" },
      },
      async authorize(credentials) {
        const rawIdentity = credentials?.identity;

        if (typeof rawIdentity !== "string" || !rawIdentity.trim()) {
          return null;
        }

        let identity: GitHubIdentity;

        try {
          identity = JSON.parse(rawIdentity) as GitHubIdentity;
        } catch {
          throw new Error("Invalid GitHub identity payload");
        }

        const user = await findGitHubLinkedLoginUser(identity);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email ?? null,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          postViewMode: user.postViewMode,
          showUserData: user.showUserData,
          coverImage: user.coverImage,
          experience: user.experience,
          level: user.level,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
    
  callbacks: {
    async jwt({ token, user, trigger, session }: JwtCallbackParams) {
      if (user) {
        token.role = user.role;
        token.avatar = user.avatar;
        token.postViewMode = user.postViewMode;
        token.showUserData = user.showUserData;
        token.coverImage = user.coverImage;
        token.experience = user.experience;
        token.level = user.level;
      }

      if (!user && token.sub) {
        const existingUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true },
        });

        if (!existingUser) {
          throw new Error("Session user no longer exists");
        }
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
    async session({ session, token }: SessionCallbackParams) {
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
