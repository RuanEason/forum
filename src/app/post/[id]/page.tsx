import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPostById } from "@/lib/post";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cache, isValidElement, type ReactNode } from "react";

import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import PinButton from "@/components/PinButton";
import PostComments, { CommentProps } from "@/components/PostComments";
import Avatar from "@/components/Avatar";
import PostMoreMenu from "@/components/PostMoreMenu";
import PostImages from "@/components/PostImages";
import { Metadata } from "next";
import { Eye } from "lucide-react";
import ViewTracker from "@/components/ViewTracker";
import remarkBreaks from "remark-breaks";
import PostAttachments from "@/components/PostAttachments";
import MobileArticleCatalog from "@/components/MobileArticleCatalog";
import CatalogSidebar from "@/components/CatalogSidebar";
import VideoPostDetail from "@/components/VideoPostDetail";
import {
  createHeadingIdGenerator,
  extractMarkdownHeadings,
} from "@/lib/markdown";
import { markdownHeadingsToCatalogItems } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/datetime";

interface AuthorProps {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface PostDetailProps {
  id: string;
  title: string | null;
  content: string;
  postType: "TEXT" | "VIDEO";
  visibility: "PUBLIC" | "UNLISTED";
  author: AuthorProps;
  createdAt: Date;
  viewCount: number;
  pinned?: boolean;
  pinnedAt?: Date | null;
  likes: { userId: string }[];
  reposts: { userId: string }[];
  comments: CommentProps[];
  images: { url: string }[];
  attachments: Array<{
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    downloadCount: number;
  }>;
  topic?: { id: string; name: string } | null;
  video: {
    id: string;
    status: "INIT" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | "DELETED";
    hlsMasterUrl: string | null;
    coverUrl: string | null;
    durationSec: number | null;
    width: number | null;
    height: number | null;
  } | null;
}

const getPostByIdCached = cache(
  async (id: string): Promise<PostDetailProps | null> =>
    (await getPostById(id)) as unknown as PostDetailProps | null
);

function getTextFromReactNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getTextFromReactNode(child)).join("");
  }

  if (isValidElement(node)) {
    return getTextFromReactNode((node.props as { children?: ReactNode }).children);
  }

  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostByIdCached(id);

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
  if (post.postType === "VIDEO" && post.video?.coverUrl) {
    images.unshift(post.video.coverUrl);
  }

  return {
    title,
    description,
    robots: post.visibility === "UNLISTED" ? { index: false, follow: false } : undefined,
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
  const session = (await getServerSession(authOptions)) as {
    user?: { id?: string; role?: string };
  } | null;
  const postId = id;
  const post = await getPostByIdCached(postId);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">帖子未找到</h1>
      </div>
    );
  }

  const isVideoPost = post.postType === "VIDEO";
  const canEditPost = Boolean(
    session?.user?.id
      && (session.user.id === post.author.id || session.user.role === "admin"),
  );
  const editablePost = {
    id: post.id,
    title: post.title,
    content: post.content,
    postType: post.postType,
    visibility: post.visibility,
    images: post.images,
    attachments: post.attachments,
  };
  const previewImages = post.images.map((img) => img.url);
  if (isVideoPost && post.video?.coverUrl) {
    previewImages.unshift(post.video.coverUrl);
  }

  const markdownHeadings = isVideoPost ? [] : extractMarkdownHeadings(post.content);
  const showToc = !isVideoPost && markdownHeadings.length > 0;
  const catalogItems = markdownHeadingsToCatalogItems(markdownHeadings);
  const generateHeadingId = createHeadingIdGenerator();
  const markdownComponents: Components = {
    a: ({ href, children, ...props }) => {
      const isAnchorLink = typeof href === "string" && href.startsWith("#");

      if (isAnchorLink) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        );
      }

      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    h1: ({ children, className, ...props }) => {
      const headingText = getTextFromReactNode(children);
      const headingId = generateHeadingId(headingText);

      return (
        <h1 id={headingId} className={cn("scroll-mt-24", className)} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, className, ...props }) => {
      const headingText = getTextFromReactNode(children);
      const headingId = generateHeadingId(headingText);

      return (
        <h2 id={headingId} className={cn("scroll-mt-24", className)} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, className, ...props }) => {
      const headingText = getTextFromReactNode(children);
      const headingId = generateHeadingId(headingText);

      return (
        <h3 id={headingId} className={cn("scroll-mt-24", className)} {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, className, ...props }) => {
      const headingText = getTextFromReactNode(children);
      const headingId = generateHeadingId(headingText);

      return (
        <h4 id={headingId} className={cn("scroll-mt-24", className)} {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ children, className, ...props }) => {
      const headingText = getTextFromReactNode(children);
      const headingId = generateHeadingId(headingText);

      return (
        <h5 id={headingId} className={cn("scroll-mt-24", className)} {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ children, className, ...props }) => {
      const headingText = getTextFromReactNode(children);
      const headingId = generateHeadingId(headingText);

      return (
        <h6 id={headingId} className={cn("scroll-mt-24", className)} {...props}>
          {children}
        </h6>
      );
    },
  };

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
    image: previewImages,
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
    hasPart: post.attachments.map((att) => ({
      "@type": "MediaObject",
      name: att.fileName,
      contentUrl: att.url,
      fileSize: att.fileSize,
      encodingFormat: att.mimeType,
    })),
  };

  if (isVideoPost) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
        <ViewTracker postId={post.id} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6 px-0">
          <VideoPostDetail post={post} sessionUser={session?.user} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      {/* 阅读量追踪组件 - 使用 Cookie 防刷机制 */}
      <ViewTracker postId={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {showToc && <MobileArticleCatalog items={catalogItems} />}

      <div
        className={
          showToc
            ? "post-detail-layout"
            : "max-w-4xl mx-auto sm:px-6 lg:px-8 py-6 px-0"
        }
      >
        <div className={showToc ? "post-detail-main px-0" : "px-0"}>
            {/* Post Content */}
            <div className="bg-white shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {post.title || ""}
                  </h1>
                </div>
                <div className="flex items-center justify-between">
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
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDateTime(post.createdAt, { style: "cn" })}</span>
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
                  <PostMoreMenu post={editablePost} canEdit={canEditPost} />
                </div>


                <div className="mt-4">
                  <div className="prose prose-sm sm:prose-base max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={markdownComponents}
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
                  {(post.attachments && post.attachments.length > 0) && (
                    <PostAttachments
                      attachments={post.attachments}
                      postId={post.id}
                      authorId={post.author.id}
                    />
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-8">
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
                              (like) => like.userId === (session.user?.id ?? "")
                            )
                          : false
                      }
                    />
                    <RepostButton
                      postId={post.id}
                      title={post.title}
                      authorName={post.author.name}
                      content={post.content}
                      createdAt={post.createdAt}
                    />
                    {/* 置顶按钮 - 仅管理员可见 */}
                    {session?.user?.role === "admin" && (
                      <PinButton postId={post.id} isPinned={post.pinned || false} />
                    )}
                  </div>
                  {post.visibility === "UNLISTED" && (
                    <div className="text-gray-400" aria-label="Unlisted post">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path
                          fill="currentColor"
                          d="M6 22q-.825 0-1.412-.587T4 20V10q0-.825.588-1.412T6 8h1V6q0-2.075 1.463-3.537T12 1t3.538 1.463T17 6v2h1q.825 0 1.413.588T20 10v10q0 .825-.587 1.413T18 22zm0-2h12V10H6zm7.413-3.588Q14 15.826 14 15t-.587-1.412T12 13t-1.412.588T10 15t.588 1.413T12 17t1.413-.587M9 8h6V6q0-1.25-.875-2.125T12 3t-2.125.875T9 6zM6 20V10z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <PostComments comments={post.comments} postId={post.id} postAuthorId={post.author.id} />
        </div>
        {showToc && (
          <div className="post-detail-toc">
            <CatalogSidebar items={catalogItems} />
          </div>
        )}
      </div>
    </div>
  );
}

