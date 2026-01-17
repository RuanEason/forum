import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
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

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          postViewMode: user.postViewMode,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.avatar = user.avatar;
        token.postViewMode = user.postViewMode;
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.avatar = session.user.avatar;
        if (session.user.postViewMode) {
          token.postViewMode = session.user.postViewMode;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string;
        session.user.postViewMode = token.postViewMode as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup", // Redirect new users to signup if needed, or just remove signUp if not used by NextAuth logic directly
  }
};