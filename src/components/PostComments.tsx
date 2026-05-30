"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImagePlus, Loader2, SendHorizontal } from "lucide-react";
import LikeButton from "@/components/LikeButton";
import Avatar from "@/components/Avatar";
import ImagePreviewLightbox from "@/components/ImagePreviewLightbox";

interface AuthorProps {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface CommentProps {
  id: string;
  content: string;
  author: AuthorProps;
  createdAt: Date;
  parentId: string | null;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    author: {
      id: string;
      name: string | null;
    };
  } | null;
  postId: string;
  likes: { userId: string }[];
  replies: ReplyComment[];
  pinned?: boolean;
  pinnedAt?: Date | null;
}

type ReplyComment = Omit<CommentProps, "replies">;

interface PostCommentsProps {
  comments: CommentProps[];
  postId: string;
  postAuthorId: string;
}

export default function PostComments({ comments, postId, postAuthorId }: PostCommentsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUserId = (session as Session | null)?.user?.id || null;
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [pinningCommentId, setPinningCommentId] = useState<string | null>(null);

  const refreshComments = () => {
    router.refresh();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId || pinningCommentId) {
      return;
    }
    if (!confirm("确定要删除这条评论吗？")) return;

    setDeletingCommentId(commentId);
    try {
      const response = await fetch("/api/comment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: commentId }),
      });

      if (response.ok) {
        refreshComments();
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误，删除失败");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handlePinComment = async (commentId: string, pinned: boolean) => {
    if (deletingCommentId || pinningCommentId) {
      return;
    }

    setPinningCommentId(commentId);
    try {
      const response = await fetch("/api/pin/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId, pinned }),
      });

      if (response.ok) {
        refreshComments();
      } else {
        const data = await response.json();
        alert(data.error || (pinned ? "置顶失败" : "取消置顶失败"));
      }
    } catch {
      alert("网络错误，操作失败");
    } finally {
      setPinningCommentId(null);
    }
  };

  // 排序评论：置顶的在前，然后按创建时间
  const sortedComments = [...comments].sort((a, b) => {
    // 置顶的评论排在前面
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // 同是置顶或同非置顶，按创建时间排序
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div
      id="comments-section"
      className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-t border-gray-100"
    >
      <div className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          评论 ({comments.length})
        </h2>
        {/* Comment Form */}
        <CommentForm postId={postId} onCommentPosted={refreshComments} />
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">
            还没有评论，快来发表第一条评论吧！
          </p>
        ) : (
          <div className="space-y-4">
            {sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                postAuthorId={postAuthorId}
                onCommentPosted={refreshComments}
                onDeleteComment={handleDeleteComment}
                onPinComment={handlePinComment}
                deletingCommentId={deletingCommentId}
                pinningCommentId={pinningCommentId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentFormProps {
  postId: string;
  parentId?: string;
  replyToId?: string;
  replyToName?: string | null;
  onCommentPosted?: () => void;
}

function CommentForm({ postId, parentId, replyToId, replyToName, onCommentPosted }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComposerActive, setIsComposerActive] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!isComposerActive) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!composerRef.current) return;

      if (composerRef.current.contains(event.target as Node)) {
        return;
      }

      setIsComposerActive(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isComposerActive]);

  const appendContent = (text: string) => {
    setContent((prev) => (prev.trim() ? `${prev}\n${text}` : text));
    setIsComposerActive(true);
  };

  const uploadImage = async (file: File) => {
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "上传失败，请稍后重试");
        return;
      }

      if (data.url) {
        appendContent(`![${file.name}](${data.url})`);
      }
    } catch {
      setError("图片上传失败，请稍后重试");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setError("");
    await uploadImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!(session as Session | null)?.user?.id) {
      setError("请先登录才能发表评论");
      return;
    }
    if (!content.trim()) {
      setError("评论内容不能为空");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, postId, parentId, replyToId }),
      });

      const data = await response.json();

      if (response.ok) {
        setContent("");
        setIsComposerActive(false);
        onCommentPosted?.();
      } else {
        setError(data.error || "发表评论失败");
      }
    } catch {
      setError("网络错误，发表评论失败");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const isBusy = loading || isUploadingImage;

  if (!session) {
    return (
      <p className="text-center text-gray-500 mt-4">
        <Link
          href={`/auth/signin?redirect=${encodeURIComponent(pathname || "/")}`}
          className="text-blue-600 hover:underline"
        >
          登录
        </Link>{" "}
        后发表评论
      </p>
    );
  }

  return (
    <div className={parentId ? "mt-6" : "mt-6 mb-8"}>
      {parentId && (
        <h3 className="text-lg font-bold mb-2">
          回复
        </h3>
      )}
      {replyToName && (
        <p className="text-sm text-gray-500 mb-2">
          对{replyToName}用户的回复：
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div
          ref={composerRef}
          className="space-y-2"
        >
          <textarea
            className="w-full px-4 py-2.5 bg-slate-100 rounded-lg text-xs sm:text-sm text-slate-700 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200 resize-none"
            rows={1}
            placeholder={
              parentId
                ? "在这里输入你的回复..."
                : "与其赞同别人的话语，不如自己畅所欲言。"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsComposerActive(true)}
            disabled={loading}
          ></textarea>
          {isComposerActive && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isBusy}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="上传图片"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isBusy}
                />
              </div>

              <button
                type="submit"
                disabled={isBusy || !content.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
                发送
              </button>
            </div>
          )}
        </div>
        {isUploadingImage && (
          <p className="text-xs text-gray-500 mt-1">
            图片上传中...
          </p>
        )}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
}

function ReplyItem({
  reply,
  mounted,
  currentUserId,
  onReply,
  onDeleteComment,
  onOpenImagePreview,
  deletingCommentId,
  pinningCommentId,
}: {
  reply: ReplyComment;
  mounted: boolean;
  currentUserId: string | null;
  onReply: (target: { id: string; name: string | null }) => void;
  onDeleteComment: (id: string) => void;
  onOpenImagePreview: (url: string, alt?: string) => void;
  deletingCommentId: string | null;
  pinningCommentId: string | null;
}) {
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
    img: ({ src, alt }) => {
      if (typeof src !== "string" || !src) return null;

      return (
        <button
          type="button"
          className="inline-block cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            onOpenImagePreview(src, alt);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || "评论图片"}
            className="max-h-72 w-auto rounded-md"
            loading="lazy"
          />
        </button>
      );
    },
  };

  const showReplyToPrefix = Boolean(
    reply.replyToId &&
      reply.parentId &&
      reply.replyToId !== reply.parentId &&
      reply.replyTo?.author,
  );
  const isMutating = Boolean(deletingCommentId || pinningCommentId);
  const isDeleting = deletingCommentId === reply.id;

  return (
    <div id={`comment-${reply.id}`} className="border-t border-gray-100 pt-3">
      <div className="flex items-center">
        <Avatar
          src={reply.author.avatar}
          name={reply.author.name}
          size="sm"
        />
        <div className="ml-3">
          <Link
            href={`/user/${reply.author.id}`}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            {reply.author.name || "匿名用户"}
          </Link>
          <div className="text-xs text-gray-500">
            {mounted ? format(new Date(reply.createdAt), "yyyy年MM月dd日 HH:mm") : ""}
          </div>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-700 p-1 prose prose-sm max-w-none break-words">
        {showReplyToPrefix && (
          <p className="mb-1 text-xs text-gray-500 not-prose">
            对{reply.replyTo?.author.name || "匿名用户"}用户的回复：
          </p>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {reply.content}
        </ReactMarkdown>
      </div>

      <div className="flex items-center space-x-4 mt-2">
        <LikeButton
          targetType="comment"
          targetId={reply.id}
          initialLikesCount={reply.likes.length}
          initialLikedByUser={
            currentUserId
              ? reply.likes.some((like) => like.userId === currentUserId)
              : false
          }
        />
        <button
          onClick={() => onReply({ id: reply.id, name: reply.author.name })}
          className="text-xs text-gray-500 hover:text-blue-500"
          title="回复"
        >
          回复
        </button>
        {currentUserId === reply.author.id && (
          <button
            disabled={isMutating}
            onClick={() => onDeleteComment(reply.id)}
            className="inline-flex items-center justify-center text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="删除评论"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zm3-4q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  postAuthorId,
  onCommentPosted,
  onDeleteComment,
  onPinComment,
  deletingCommentId,
  pinningCommentId,
}: {
  comment: CommentProps;
  currentUserId: string | null;
  postAuthorId: string;
  onCommentPosted: () => void;
  onDeleteComment: (id: string) => void;
  onPinComment: (id: string, pinned: boolean) => void;
  deletingCommentId: string | null;
  pinningCommentId: string | null;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    name: string | null;
  } | null>(null);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageAlt, setPreviewImageAlt] = useState("评论图片预览");
  const [mounted, setMounted] = useState(false);

  const displayedReplies = showAllReplies
    ? comment.replies
    : comment.replies?.slice(0, 1);
  const remainingRepliesCount = (comment.replies?.length || 0) - 1;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const openReplyForm = (target?: { id: string; name: string | null }) => {
    setReplyTarget(target || null);
    setShowReplyForm(true);
  };

  const toggleRootReplyForm = () => {
    if (showReplyForm && !replyTarget) {
      setShowReplyForm(false);
      return;
    }

    openReplyForm();
  };

  const closeReplyForm = () => {
    setShowReplyForm(false);
    setReplyTarget(null);
  };

  const openImagePreview = (url: string, alt?: string) => {
    setPreviewImageUrl(url);
    setPreviewImageAlt(alt || "评论图片预览");
  };

  const isPostAuthor = currentUserId === postAuthorId;
  const isMutating = Boolean(deletingCommentId || pinningCommentId);
  const isDeleting = deletingCommentId === comment.id;
  const isPinning = pinningCommentId === comment.id;

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
    img: ({ src, alt }) => {
      if (typeof src !== "string" || !src) return null;

      return (
        <button
          type="button"
          className="inline-block cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            openImagePreview(src, alt);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || "评论图片"}
            className="max-h-72 w-auto rounded-md"
            loading="lazy"
          />
        </button>
      );
    },
  };

  return (
    <div id={`comment-${comment.id}`} className="border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar
            src={comment.author.avatar}
            name={comment.author.name}
            size="sm"
          />
          <div className="ml-3">
            <Link
              href={`/user/${comment.author.id}`}
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              {comment.author.name || "匿名用户"}
            </Link>
            <div className="text-xs text-gray-500">
              {mounted
                ? format(new Date(comment.createdAt), "yyyy年MM月dd日 HH:mm")
                : ""}
            </div>
          </div>
        </div>
        {comment.pinned && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
              <path d="M7 20v-2h10v2zm4-4V7.825L8.4 10.4L7 9l5-5l5 5l-1.4 1.4L13 7.825V16z"/>
            </svg>
            置顶
          </span>
        )}
      </div>

      <div
        className="mt-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded prose prose-sm max-w-none break-words"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("img, a, button")) {
            return;
          }
          toggleRootReplyForm();
        }}
        title="点击回复"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {comment.content}
        </ReactMarkdown>
      </div>

      <div className="flex items-center space-x-4 mt-2">
        <LikeButton
          targetType="comment"
          targetId={comment.id}
          initialLikesCount={comment.likes.length}
          initialLikedByUser={
            currentUserId
              ? comment.likes.some((like) => like.userId === currentUserId)
              : false
          }
        />
        <button
          onClick={toggleRootReplyForm}
          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 text-sm group"
          title={showReplyForm ? "取消回复" : "回复"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        {isPostAuthor && (
          <button
            disabled={isMutating}
            onClick={() => onPinComment(comment.id, !comment.pinned)}
            className={`inline-flex items-center justify-center p-1 rounded-full hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${comment.pinned ? "text-yellow-600" : "text-gray-500 hover:text-yellow-600"}`}
            title={comment.pinned ? "取消置顶" : "置顶评论"}
          >
            {isPinning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 20v-2h10v2zm4-4V7.825L8.4 10.4L7 9l5-5l5 5l-1.4 1.4L13 7.825V16z"/>
              </svg>
            )}
          </button>
        )}
        {currentUserId === comment.author.id && (
          <button
            disabled={isMutating}
            onClick={() => onDeleteComment(comment.id)}
            className="inline-flex items-center justify-center text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="删除评论"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zm3-4q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="ml-8 mt-4">
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            replyToId={replyTarget?.id}
            replyToName={replyTarget?.name}
            onCommentPosted={() => {
              closeReplyForm();
              onCommentPosted();
            }}
          />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="ml-8 mt-4 space-y-3">
          {displayedReplies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              mounted={mounted}
              currentUserId={currentUserId}
              onReply={openReplyForm}
              onDeleteComment={onDeleteComment}
              onOpenImagePreview={openImagePreview}
              deletingCommentId={deletingCommentId}
              pinningCommentId={pinningCommentId}
            />
          ))}
          {!showAllReplies && remainingRepliesCount > 0 ? (
            <button
              onClick={() => setShowAllReplies(true)}
              className="text-sm text-blue-500 hover:underline"
            >
              点击以展开{remainingRepliesCount}个回复
            </button>
          ) : showAllReplies && remainingRepliesCount > 0 ? (
            <button
              onClick={() => setShowAllReplies(false)}
              className="text-sm text-blue-500 hover:underline"
            >
              收起回复
            </button>
          ) : null}
        </div>
      )}

      {previewImageUrl && (
        <ImagePreviewLightbox
          images={[{ src: previewImageUrl, alt: previewImageAlt }]}
          currentIndex={0}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}
    </div>
  );
}
