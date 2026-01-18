declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      avatar?: string | null;
      postViewMode?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    avatar?: string | null;
    postViewMode?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    avatar?: string | null;
    postViewMode?: string;
  }
}