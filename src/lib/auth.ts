import CredentialsProvider from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserLevel, rewardDailyLoginExperience } from "@/lib/experience";
import { findGitHubLinkedLoginUser } from "@/lib/github-auth";
import type { GitHubIdentity } from "@/lib/github";
import {
  clearLoginFailureCounters,
  getClientIpFromHeaders,
  getLoginRateLimitState,
  normalizeEmail,
  recordLoginFailure,
} from "@/lib/account-security";

type AuthUserPayload = {
  id?: string;
  email?: string | null;
  role: string;
  banned: boolean;
  sessionVersion: number;
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
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string"
          ? normalizeEmail(credentials.email)
          : "";
        const password = typeof credentials?.password === "string"
          ? credentials.password
          : "";
        const ip = getClientIpFromHeaders(request.headers);

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        const rateLimit = await getLoginRateLimitState({
          email,
          userId: user?.id,
          ip,
        });
        if (!rateLimit.allowed) {
          return null;
        }

        if (!user || !user.password) {
          try {
            await recordLoginFailure({ email, userId: user?.id, ip });
          } catch (error) {
            console.error("Record login failure failed:", error);
          }
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          try {
            await recordLoginFailure({ email, userId: user.id, ip });
          } catch (error) {
            console.error("Record login failure failed:", error);
          }
          return null;
        }

        if (user.banned || user.deletionRequestedAt) {
          // Use generic error message to avoid revealing user existence
          throw new Error("Invalid credentials");
        }

        try {
          await clearLoginFailureCounters({ email, userId: user.id, ip });
        } catch (error) {
          console.error("Clear login failure counters failed:", error);
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
          banned: user.banned,
          sessionVersion: user.sessionVersion,
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
          banned: user.banned,
          sessionVersion: user.sessionVersion,
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
    async jwt({ token, user, trigger }: JwtCallbackParams) {
      if (user) {
        token.role = user.role;
        token.banned = user.banned;
        token.sessionVersion = user.sessionVersion;
        token.sessionInvalid = false;
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
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            banned: true,
            sessionVersion: true,
            deletionRequestedAt: true,
            deletionScheduledAt: true,
            avatar: true,
            postViewMode: true,
            showUserData: true,
            coverImage: true,
            experience: true,
          },
        });

        if (!existingUser) {
          token.sessionInvalid = true;
        } else {
          if (trigger === "update") {
            token.sessionVersion = existingUser.sessionVersion;
            token.sessionInvalid = false;
          } else if (token.sessionVersion === undefined) {
            token.sessionVersion = existingUser.sessionVersion;
          } else if (token.sessionVersion !== existingUser.sessionVersion) {
            token.sessionInvalid = true;
          }

          token.email = existingUser.email ?? undefined;
          token.name = existingUser.name ?? undefined;
          token.role = existingUser.role;
          token.banned = existingUser.banned;
          token.avatar = existingUser.avatar;
          token.postViewMode = existingUser.postViewMode;
          token.showUserData = existingUser.showUserData;
          token.coverImage = existingUser.coverImage;
          token.experience = existingUser.experience;
          token.level = getUserLevel(existingUser.experience);
        }
      }

      return token;
    },
    async session({ session, token }: SessionCallbackParams) {
      if (token?.sessionInvalid || !token?.sub) {
        return null;
      }

      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.banned = token.banned as boolean;
        session.user.sessionVersion = token.sessionVersion as number;
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
