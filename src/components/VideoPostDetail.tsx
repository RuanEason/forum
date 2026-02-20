import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Eye } from "lucide-react";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import LikeButton from "@/components/LikeButton";
import PinButton from "@/components/PinButton";
import RepostButton from "@/components/RepostButton";
import PostAttachments from "@/components/PostAttachments";
import PostComments, { CommentProps } from "@/components/PostComments";
import VideoPlayer from "@/components/VideoPlayer";

type VideoStatus = "INIT" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | "DELETED";

interface VideoPostDetailProps {
  post: {
    id: string;
    title: string | null;
    content: string;
    createdAt: Date;
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

  return (
    <>
      <div className="bg-white shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="sm:hidden mb-4">
            <BackButton href="/" />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center min-w-0">
              <div className="hidden sm:flex items-center mr-3 shrink-0">
                <BackButton href="/" />
              </div>
              <Avatar src={post.author.avatar} name={post.author.name} size="md" />
              <div className="ml-4 min-w-0">
                <Link
                  href={`/user/${post.author.id}`}
                  className="text-sm font-bold text-gray-900 hover:underline"
                >
                  {post.author.name || "匿名用户"}
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{format(new Date(post.createdAt), "yyyy-MM-dd HH:mm")}</span>
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

            {post.title && (
              <h1 className="hidden sm:block max-w-[52%] text-right text-xl font-bold text-gray-900 line-clamp-2">
                {post.title}
              </h1>
            )}
          </div>

          {post.title && (
            <h1 className="sm:hidden mt-4 text-2xl font-bold text-gray-900">
              {post.title}
            </h1>
          )}

          <div className="mt-4">
            {canPlayVideo ? (
              <VideoPlayer
                src={playbackSrc}
                poster={post.video?.coverUrl}
                title={post.title}
              />
            ) : (
              <div className="relative overflow-hidden rounded-lg bg-black aspect-video border border-gray-200">
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/80">
                  {videoMessage}
                </div>
              </div>
            )}
          </div>

          {hasDescription && (
            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="prose prose-sm sm:prose-base max-w-none break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center space-x-8 pt-4 border-t border-gray-100">
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
            <RepostButton postId={post.id} />
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
