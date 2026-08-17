import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FollowConnections from "./FollowConnections";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getUser(id: string) {
  return prisma.user.findFirst({
    where: { id, deletionRequestedAt: null },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
    },
  });
}

export default async function ConnectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "following" } = await searchParams;

  // 验证 tab 参数
  if (tab !== "following" && tab !== "followers") {
    return notFound();
  }

  const session = await getServerSession(authOptions) as Session | null;
  const user = await getUser(id);

  if (!user) {
    return notFound();
  }

  const isCurrentUser = session?.user?.id === id;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <FollowConnections
          user={user}
          type={tab as "following" | "followers"}
          isCurrentUser={isCurrentUser}
        />
      </div>
    </div>
  );
}
