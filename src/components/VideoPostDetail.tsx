import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Eye } from "lucide-react";
import Avatar from "@/components/Avatar";
import LikeButton from "@/components/LikeButton";
import PinButton from "@/components/PinButton";
import RepostButton from "@/components/RepostButton";
import PostMoreMenu from "@/components/PostMoreMenu";
import PostAttachments from "@/components/PostAttachments";
import PostComments, { CommentProps } from "@/components/PostComments";
import VideoPlayer from "@/components/VideoPlayer";
import PostEditHistory from "@/components/PostEditHistory";
import { createMarkdownComponents } from "@/lib/markdown-components";
import PostContentImagePreview from "@/components/PostContentImagePreview";

type VideoStatus = "INIT" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | "DELETED";

interface VideoPostDetailProps {
  post: {
    id: string;
    title: string | null;
    content: string;
    postType: "TEXT" | "VIDEO";
    visibility: "PUBLIC" | "UNLISTED";
    styleConfig?: import("@/types/post-style").PostStyleConfig | null;
    styleCss?: string | null;
    createdAt: Date;
    editHistory: Array<{
      id: string;
      editorName: string;
      createdAt: Date;
    }>;
    viewCount: number;
    pinned?: boolean;
    author: {
      id: string;
      name: string | null;
      avatar: string | null;
    };
    topic?: {
      id: string;
      name: string;
    } | null;
    likes: { userId: string }[];
    comments: CommentProps[];
    attachments: Array<{
      id: string;
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      downloadCount: number;
    }>;
    video: {
      id: string;
      status: VideoStatus;
      hlsMasterUrl: string | null;
      coverUrl: string | null;
      durationSec: number | null;
      width: number | null;
      height: number | null;
    } | null;
  };
  sessionUser?: {
    id?: string;
    role?: string;
  };
}

function getVideoStatusMessage(status?: VideoStatus): string {
  switch (status) {
    case "INIT":
    case "UPLOADING":
    case "UPLOADED":
    case "PROCESSING":
      return "视频处理中，请稍后刷新页面";
    case "FAILED":
      return "视频处理失败，暂时无法播放";
    case "DELETED":
      return "视频资源已不可用";
    default:
      return "视频暂时不可播放";
  }
}

function toVideoProxyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "cdn.zyg2024.top") {
      return url;
    }
    return `/video-proxy${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export default function VideoPostDetail({ post, sessionUser }: VideoPostDetailProps) {
  const hasDescription = Boolean(post.content.trim());
  const canPlayVideo = Boolean(post.video?.hlsMasterUrl);
  const playbackSrc = post.video?.hlsMasterUrl ? toVideoProxyUrl(post.video.hlsMasterUrl) : "";
  const videoMessage = getVideoStatusMessage(post.video?.status);
  const canEditPost = Boolean(
    sessionUser?.id
      && (sessionUser.id === post.author.id || sessionUser.role === "admin"),
  );
  const editablePost = {
    id: post.id,
    title: post.title,
    content: post.content,
    postType: post.postType,
    visibility: post.visibility,
    styleConfig: post.styleConfig,
    styleCss: post.styleCss,
    images: [],
    attachments: post.attachments,
  };
  const markdownComponents = createMarkdownComponents();

  return (
    <>
      <div className="bg-white shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
        <div className="sm:p-6">
          {post.title && (
            <h1 className="mb-4 break-words px-4 text-2xl font-bold text-gray-900 sm:px-0">
              {post.title}
            </h1>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex px-2 pt-3 items-center min-w-0 sm:px-0 pt-0">
              <Avatar src={post.author.avatar} name={post.author.name} size="md" />
              <div className="ml-4 min-w-0">
                <Link
                  href={`/user/${post.author.id}`}
                  className="text-sm font-bold text-gray-900 hover:underline"
                >
                  {post.author.name || "匿名用户"}
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <PostEditHistory createdAt={post.createdAt} history={post.editHistory} />
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

            <div className="flex shrink-0 items-start">
              <PostMoreMenu post={editablePost} canEdit={canEditPost} />
            </div>
          </div>

          <div className="mt-4">
            {canPlayVideo ? (
              <VideoPlayer
                postId={post.id}
                src={playbackSrc}
                poster={post.video?.coverUrl}
                title={post.title}
              />
            ) : (
              <div className="relative overflow-hidden bg-black aspect-video border border-gray-200">
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/80">
                  {videoMessage}
                </div>
              </div>
            )}
          </div>

          {hasDescription && (
            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="prose prose-sm sm:prose-base max-w-none break-words">
                <PostContentImagePreview>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={markdownComponents}
                  >
                    {post.content}
                  </ReactMarkdown>
                </PostContentImagePreview>
              </div>
            </div>
          )}

          <div className="m-4 flex items-center space-x-8 pt-4 border-t border-gray-100 sm:m-0 mt-4">
            <div className="flex items-center space-x-1 text-gray-500 p-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">{post.viewCount}</span>
            </div>
            <LikeButton
              targetType="post"
              targetId={post.id}
              initialLikesCount={post.likes.length}
              initialLikedByUser={
                sessionUser?.id
                  ? post.likes.some((like) => like.userId === (sessionUser.id ?? ""))
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
            {sessionUser?.role === "admin" && (
              <PinButton postId={post.id} isPinned={post.pinned || false} />
            )}
          </div>

          {post.attachments && post.attachments.length > 0 && (
            <PostAttachments
              attachments={post.attachments}
              postId={post.id}
              authorId={post.author.id}
            />
          )}
        </div>
      </div>

      <PostComments comments={post.comments} postId={post.id} postAuthorId={post.author.id} />
    </>
  );
}
