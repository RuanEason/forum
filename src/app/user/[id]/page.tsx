import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import UserPostList from "@/components/UserPostList";
import { Metadata } from "next";

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

export async function generateMetadata({ params }: UserProfileProps): Promise<Metadata> {
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
  const description = user.bio || `查看 ${user.name || "匿名用户"} 在同学论坛发布的帖子和动态。`;

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

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-4 sm:px-0">
          {/* User Info Card */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex items-center">
                <Avatar src={user.avatar} name={user.name} size="xl" />
                <div className="ml-4 sm:ml-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name || "匿名用户"}</h1>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    加入于 {format(new Date(user.createdAt), "yyyy年MM月dd日")}
                  </p>
                  {user.bio && (
                    <p className="mt-2 sm:mt-4 text-sm sm:text-base text-gray-700">{user.bio}</p>
                  )}
                </div>
              </div>
              {session?.user?.id && session.user.id === user.id && (
                <div className="mt-4 sm:mt-0 flex justify-end">
                  <Link
                    href="/settings"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    编辑资料
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* User Posts */}
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 px-2 sm:px-0">发布的帖子 ({user.posts.length})</h2>
          <UserPostList initialPosts={user.posts as any} />
        </div>
      </div>
    </div>
  );
}