import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type SessionShape = {
  user?: {
    id?: string;
    role?: string;
  };
} | null;

export type SessionUser = {
  id: string;
  role?: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = (await getServerSession(authOptions)) as SessionShape;
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    role: session.user?.role,
  };
}

