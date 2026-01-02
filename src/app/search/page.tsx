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
import Link from "next/link";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">搜索帖子</h1>
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

  // 构建搜索条件
  // 注意：MySQL 的大小写敏感性取决于表的 collation 设置
  // 如果使用 utf8mb4_unicode_ci 或类似的 collation，搜索默认就是大小写不敏感的
  const whereCondition = {
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

  // 调试信息：输出查询条件
  console.log(
    "Prisma Where Condition:",
    JSON.stringify(whereCondition, null, 2)
  );

  // 查询帖子
  const posts = await prisma.post.findMany({
    where: whereCondition,
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
  });

  // 调试信息：输出查询结果数量
  console.log("Search Results Count:", posts.length);

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
              共找到 {posts.length} 条相关帖子
            </p>
          </div>

          {/* 搜索结果 */}
          {posts.length === 0 ? (
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
                未找到与 &ldquo;{query}&rdquo; 相关的帖子
              </p>
              <p className="text-gray-400 text-sm mt-2">
                试试其他关键词，或者检查一下拼写
              </p>
            </div>
          ) : (
            <HomeContent
              initialPosts={serializedPosts}
              hideCreateButton={true}
            />
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
      title: "搜索帖子",
      description: "在论坛中搜索帖子",
    };
  }

  return {
    title: `"${query}" 的搜索结果`,
    description: `搜索与 "${query}" 相关的帖子`,
  };
}
