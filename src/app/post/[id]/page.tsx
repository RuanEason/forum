import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPostById } from "@/lib/post";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { format } from "date-fns";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import PostComments, { CommentProps } from "@/components/PostComments";
import Avatar from "@/components/Avatar";
import PostImages from "@/components/PostImages";
import { Metadata } from "next";

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
  likes: { userId: string }[];
  reposts: { userId: string }[];
  comments: CommentProps[];
  images: { url: string }[];
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
  const session = await getServerSession(authOptions);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-4 sm:px-0">
          {/* Post Content */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
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
                  <div className="text-xs text-gray-500">
                    {format(new Date(post.createdAt), "yyyy年MM月dd日 HH:mm")}
                  </div>
                </div>
              </div>

              <div className="mt-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {post.title || "无标题"}
                </h1>
              </div>

              <div className="mt-4">
                <div className="prose prose-sm sm:prose-base max-w-none break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
                <RepostButton
                  postId={post.id}
                  initialRepostsCount={post.reposts.length}
                  initialRepostedByUser={
                    session?.user?.id
                      ? post.reposts.some(
                          (repost) => repost.userId === session.user.id
                        )
                      : false
                  }
                />
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <PostComments comments={post.comments} postId={post.id} />
        </div>
      </div>
    </div>
  );
}
