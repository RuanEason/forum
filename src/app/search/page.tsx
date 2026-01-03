import { prisma } from "@/lib/prisma";
import type {
  Post,
  User,
  PostLike,
  Repost,
  Comment,
  PostImage,
  Topic,
} from "@/generated";
import HomeContent from "@/components/HomeContent";
import Avatar from "@/components/Avatar";
import Link from "next/link";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

// 用户搜索结果类型
type UserSearchResult = {
  id: string;
  name: string | null;
  avatar: string | null;
  _count: {
    posts: number;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  // 调试信息：在服务端终端输出接收到的搜索参数
  console.log("Search Query:", params.q);

  const query = params.q?.trim();

  // 调试信息：输出处理后的查询字符串
  console.log("Trimmed Query:", query, "| Length:", query?.length ?? 0);

  // 无参数状态：提示用户输入关键词
  if (!query || query.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
        <main className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
          <div className="px-4 sm:px-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">搜索</h1>
            <div className="text-center py-12 bg-white sm:rounded-lg shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <p className="text-gray-500 text-lg">请输入关键词进行搜索</p>
              <p className="text-gray-400 text-sm mt-2">
                使用顶部搜索框输入您想要查找的内容
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 构建帖子搜索条件
  const postWhereCondition = {
    OR: [
      {
        title: {
          contains: query,
        },
      },
      {
        content: {
          contains: query,
        },
      },
    ],
  };

  // 构建用户搜索条件
  const userWhereCondition = {
    name: {
      contains: query,
    },
    banned: false, // 排除被封禁的用户
  };

  // 调试信息：输出查询条件
  console.log(
    "Prisma Post Where Condition:",
    JSON.stringify(postWhereCondition, null, 2)
  );
  console.log(
    "Prisma User Where Condition:",
    JSON.stringify(userWhereCondition, null, 2)
  );

  // 使用 Promise.all 并行执行查询
  const [posts, users] = await Promise.all([
    // 查询 1: 帖子搜索
    prisma.post.findMany({
      where: postWhereCondition,
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
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    // 查询 2: 用户搜索
    prisma.user.findMany({
      where: userWhereCondition,
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      take: 10, // 限制用户搜索结果数量
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  // 调试信息：输出查询结果数量
  console.log("Posts Search Results Count:", posts.length);
  console.log("Users Search Results Count:", users.length);

  // 定义帖子类型
  type PostWithRelations = Post & {
    author: Pick<User, "id" | "name" | "avatar">;
    likes: Pick<PostLike, "userId">[];
    reposts: Pick<Repost, "userId">[];
    comments: Pick<Comment, "id">[];
    images: Pick<PostImage, "url">[];
    topic: Pick<Topic, "id" | "name"> | null;
  };

  // 序列化帖子数据（将 Date 对象转换为字符串）
  const serializedPosts = posts.map((post: PostWithRelations) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  const hasUsers = users.length > 0;
  const hasPosts = posts.length > 0;

  // 计算总结果数
  const totalResults = users.length + posts.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <main className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-4 sm:px-0">
          {/* 页面标题 */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回首页
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              &ldquo;{query}&rdquo; 的搜索结果
            </h1>
            <p className="text-gray-500 mt-1">
              {totalResults === 0 ? (
                "未找到相关内容"
              ) : (
                <>
                  共找到 {users.length > 0 && `${users.length} 位用户`}
                  {users.length > 0 && posts.length > 0 && "、"}
                  {posts.length > 0 && `${posts.length} 条帖子`}
                </>
              )}
            </p>
          </div>

          {/* 无结果状态 */}
          {!hasUsers && !hasPosts && (
            <div className="text-center py-12 bg-white sm:rounded-lg shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">
                未找到与 &ldquo;{query}&rdquo; 相关的内容
              </p>
              <p className="text-gray-400 text-sm mt-2">
                试试其他关键词，或者检查一下拼写
              </p>
            </div>
          )}

          {/* 相关用户区块 */}
          {hasUsers && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                相关用户
              </h2>
              <div className="bg-white sm:rounded-lg shadow-sm p-4">
                <div className="flex flex-wrap gap-4">
                  {users.map((user: UserSearchResult) => (
                    <Link
                      key={user.id}
                      href={`/user/${user.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200"
                    >
                      <Avatar src={user.avatar} name={user.name} size="md" />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 hover:text-blue-600">
                          {user.name || "未命名用户"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user._count.posts} 篇帖子
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 相关帖子区块 */}
          {hasPosts && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                相关帖子
              </h2>
              <HomeContent
                initialPosts={serializedPosts}
                hideCreateButton={true}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// 生成页面元数据
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();

  if (!query) {
    return {
      title: "搜索",
      description: "在论坛中搜索帖子和用户",
    };
  }

  return {
    title: `"${query}" 的搜索结果`,
    description: `搜索与 "${query}" 相关的帖子和用户`,
  };
}
