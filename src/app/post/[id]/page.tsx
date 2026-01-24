import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPostById } from "@/lib/post";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import Link from "next/link";
import { format } from "date-fns";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import PostComments, { CommentProps } from "@/components/PostComments";
import Avatar from "@/components/Avatar";
import PostImages from "@/components/PostImages";
import BackButton from "@/components/BackButton";
import PostSidebar from "@/components/PostSidebar";
import { extractHeadings } from "@/lib/markdown";
import { Metadata } from "next";
import { Eye } from "lucide-react";
import ViewTracker from "@/components/ViewTracker";
import remarkBreaks from 'remark-breaks';

interface AuthorProps {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface PostDetailProps {
  id: string;
  title: string | null;
  content: string;
  author: AuthorProps;
  createdAt: Date;
  viewCount: number;
  likes: { userId: string }[];
  reposts: { userId: string }[];
  comments: CommentProps[];
  images: { url: string }[];
  topic?: { id: string; name: string } | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = (await getPostById(id)) as unknown as PostDetailProps | null;

  if (!post) {
    return {
      title: "帖子未找到",
    };
  }

  const title = post.title
    ? `${post.title} - ${post.author.name || "匿名用户"}`
    : `${post.author.name || "匿名用户"} 的帖子`;
  const description =
    post.content.slice(0, 150) + (post.content.length > 150 ? "..." : "");
  const images = post.images.map((img) => img.url);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: new Date(post.createdAt).toISOString(),
      authors: [post.author.name || "匿名用户"],
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.length > 0 ? images : undefined,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as any;
  const postId = id;
  const post = (await getPostById(postId)) as unknown as PostDetailProps | null;

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">帖子未找到</h1>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: `${post.author.name || "匿名用户"} 的帖子`,
    datePublished: new Date(post.createdAt).toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name || "匿名用户",
      url: `/user/${post.author.id}`,
    },
    articleBody: post.content,
    image: post.images.map((img) => img.url),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: post.likes.length,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: post.comments.length,
      },
    ],
  };

  // 提取标题用于生成目录
  const headings = extractHeadings(post.content);
  const hasToc = headings.length > 0;
  const hasComments = post.comments.length > 0;
  // 只要有目录或评论就显示侧边栏
  const hasSidebar = hasToc || hasComments;

  // 将评论转换为时间轴需要的格式（只取顶级评论）
  const commentsForTimeline = post.comments.map((comment) => ({
    id: comment.id,
    authorName: comment.author.name || "匿名用户",
    createdAt: comment.createdAt,
    isReply: false,
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      {/* 阅读量追踪组件 - 使用 Cookie 防刷机制 */}
      <ViewTracker postId={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 三栏布局容器 */}
      <div
        className={
          hasSidebar
            ? "post-detail-layout"
            : "max-w-4xl mx-auto sm:px-6 lg:px-8 py-6"
        }
      >
        {/* 左侧占位（大屏幕） */}
        {hasSidebar && <div className="post-detail-spacer hidden lg:block" />}

        {/* 主内容区域 */}
        <div className={hasSidebar ? "post-detail-main" : "px-0"}>
          <div className={hasSidebar ? "" : "px-0"}>
            {/* Post Content */}
            <div className="bg-white shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="sm:hidden mb-4">
                  <BackButton href="/" />
                </div>
                <div className="flex items-center relative">
                  <div className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 pr-6">
                    <BackButton href="/" />
                  </div>
                  <Avatar
                    src={post.author.avatar}
                    name={post.author.name}
                    size="md"
                  />
                  <div className="ml-4">
                    <Link
                      href={`/user/${post.author.id}`}
                      className="text-sm font-bold text-gray-900 hover:underline"
                    >
                      {post.author.name || "匿名用户"}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {format(
                          new Date(post.createdAt),
                          "yyyy年MM月dd日 HH:mm"
                        )}
                      </span>
                      {post.topic && (
                        <Link
                          href={`/topic/${post.topic.id}`}
                          className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          #{post.topic.name}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {post.title || ""}
                  </h1>
                </div>

                <div className="mt-4">
                  <div className="prose prose-sm sm:prose-base max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeSlug]}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>
                  {post.images && post.images.length > 0 && (
                    <PostImages
                      images={post.images.map((img) => img.url)}
                      isDetail={true}
                    />
                  )}
                </div>
                <div className="mt-4 flex items-center space-x-8 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1 text-gray-500 p-2">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {post.viewCount}
                    </span>
                  </div>
                  <LikeButton
                    targetType="post"
                    targetId={post.id}
                    initialLikesCount={post.likes.length}
                    initialLikedByUser={
                      session?.user?.id
                        ? post.likes.some(
                            (like) => like.userId === session.user.id
                          )
                        : false
                    }
                  />
                  <RepostButton postId={post.id} />
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <PostComments comments={post.comments} postId={post.id} />
          </div>
        </div>

        {/* 右侧智能侧边栏（大屏幕显示） */}
        {hasSidebar && (
          <aside className="post-detail-toc">
            <PostSidebar headings={headings} comments={commentsForTimeline} />
          </aside>
        )}
      </div>
    </div>
  );
}
