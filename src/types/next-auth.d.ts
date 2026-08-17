import "next-auth";
import "next-auth/jwt";

export {};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
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
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role: string;
    banned: boolean;
    sessionVersion: number;
    avatar?: string | null;
    postViewMode?: string;
    showUserData?: boolean;
    coverImage?: string | null;
    experience?: number;
    level?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    banned?: boolean;
    sessionVersion?: number;
    sessionInvalid?: boolean;
    avatar?: string | null;
    postViewMode?: string;
    showUserData?: boolean;
    coverImage?: string | null;
    experience?: number;
    level?: number;
  }
}
