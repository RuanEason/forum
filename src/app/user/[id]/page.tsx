import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import UserProfileClient from "./UserProfileClient";

interface UserProfileProps {
  params: Promise<{ id: string }>;
}

async function getUserProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          reposts: {
            select: {
              userId: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          images: {
            select: {
              url: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: UserProfileProps): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, bio: true, avatar: true },
  });

  if (!user) {
    return {
      title: "用户未找到",
    };
  }

  const title = `${user.name || "匿名用户"} 的个人主页`;
  const description =
    user.bio || `查看 ${user.name || "匿名用户"} 在同学论坛发布的帖子和动态。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: user.avatar ? [user.avatar] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: user.avatar ? [user.avatar] : undefined,
    },
  };
}

export default async function UserProfile({ params }: UserProfileProps) {
  const { id } = await params;
  const userId = id;
  const session = await getServerSession(authOptions);
  const user = await getUserProfile(userId);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">用户未找到</h1>
      </div>
    );
  }

  const isCurrentUser = session?.user?.id === user.id;

  return <UserProfileClient user={user} isCurrentUser={isCurrentUser} />;
}
