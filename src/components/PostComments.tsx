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
import {
  Ellipsis,
  ImagePlus,
  Loader2,
  MessageCircle,
  Pin,
  PinOff,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import LikeButton from "@/components/LikeButton";
import Avatar from "@/components/Avatar";
import ImagePreviewLightbox from "@/components/ImagePreviewLightbox";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { isInternalUserLink } from "@/lib/markdown";

interface AuthorProps {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface CommentProps {
  id: string;
  content: string;
  author: AuthorProps;
  createdAt: Date | string;
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
  likes?: { userId: string }[];
  likeCount?: number;
  likedByMe?: boolean;
  replies: ReplyComment[];
  replyCount?: number;
  repliesHasMore?: boolean;
  repliesNextCursor?: string | null;
  pinned?: boolean;
  pinnedAt?: Date | null;
}

type ReplyComment = Omit<CommentProps, "replies">;

interface PostCommentsProps {
  comments: CommentProps[];
  postId: string;
  postAuthorId: string;
  nextCursor?: string | null;
  hasMore?: boolean;
  total?: number;
}

export default function PostComments({
  comments,
  postId,
  postAuthorId,
  nextCursor: initialNextCursor = null,
  hasMore: initialHasMore = false,
  total = comments.length,
}: PostCommentsProps) {
  const { data: session } = useSession();
  const toast = useToast();
  const router = useRouter();
  const currentUserId = (session as Session | null)?.user?.id || null;
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteConfirmCommentId, setDeleteConfirmCommentId] = useState<string | null>(null);
  const [pinningCommentId, setPinningCommentId] = useState<string | null>(null);
  const [commentItems, setCommentItems] = useState<CommentProps[]>(comments);
  const [commentsNextCursor, setCommentsNextCursor] = useState<string | null>(initialNextCursor);
  const [commentsHasMore, setCommentsHasMore] = useState(initialHasMore);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [commentsLoadError, setCommentsLoadError] = useState<string | null>(null);

  useEffect(() => {
    setCommentItems(comments);
    setCommentsNextCursor(initialNextCursor);
    setCommentsHasMore(initialHasMore);
  }, [comments, initialHasMore, initialNextCursor]);

  const refreshComments = () => {
    router.refresh();
  };

  const loadMoreComments = async () => {
    if (!commentsHasMore || loadingMoreComments) return;

    setLoadingMoreComments(true);
    setCommentsLoadError(null);
    try {
      const params = new URLSearchParams({ postId, limit: "20" });
      if (commentsNextCursor) params.set("cursor", commentsNextCursor);
      const response = await fetch(`/api/comment?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json() as {
        items?: CommentProps[];
        nextCursor?: string | null;
        hasMore?: boolean;
        code?: string;
      };

      if (!response.ok) {
        if (data.code === "INVALID_CURSOR") {
          router.refresh();
          return;
        }
        throw new Error("Failed to load comments");
      }

      setCommentItems((current) => {
        const existingIds = new Set(current.map((comment) => comment.id));
        return [...current, ...(data.items ?? []).filter((comment) => !existingIds.has(comment.id))];
      });
      setCommentsNextCursor(data.nextCursor ?? null);
      setCommentsHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error("Failed to load more comments:", error);
      setCommentsLoadError("加载更多评论失败，请重试");
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const loadMoreReplies = async (commentId: string, cursor: string | null) => {
    const params = new URLSearchParams({ postId, parentId: commentId, limit: "20" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`/api/comment?${params.toString()}`, { cache: "no-store" });
    const data = await response.json() as {
      items?: ReplyComment[];
      nextCursor?: string | null;
      hasMore?: boolean;
    };
    if (!response.ok) {
      throw new Error("Failed to load replies");
    }

    setCommentItems((current) => current.map((comment) => {
      if (comment.id !== commentId) return comment;
      const existingIds = new Set((comment.replies ?? []).map((reply) => reply.id));
      return {
        ...comment,
        replies: [
          ...(comment.replies ?? []),
          ...(data.items ?? []).filter((reply) => !existingIds.has(reply.id)),
        ],
        repliesNextCursor: data.nextCursor ?? null,
        repliesHasMore: Boolean(data.hasMore),
      };
    }));
  };

  const requestDeleteComment = (commentId: string) => {
    if (deletingCommentId || deleteConfirmCommentId || pinningCommentId) {
      return;
    }

    setDeleteConfirmCommentId(commentId);
  };

  const handleDeleteComment = async () => {
    const commentId = deleteConfirmCommentId;
    if (!commentId || deletingCommentId || pinningCommentId) {
      return;
    }

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
        toast.success("评论删除成功");
        refreshComments();
      } else {
        const data = await response.json();
        toast.error(data.error || "删除失败");
      }
    } catch {
      toast.error("网络错误，删除失败");
    } finally {
      setDeletingCommentId(null);
      setDeleteConfirmCommentId(null);
    }
  };

  const handlePinComment = async (commentId: string, pinned: boolean) => {
    if (deletingCommentId || deleteConfirmCommentId || pinningCommentId) {
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
        toast.error(data.error || (pinned ? "置顶失败" : "取消置顶失败"));
      }
    } catch {
      toast.error("网络错误，操作失败");
    } finally {
      setPinningCommentId(null);
    }
  };

  // 排序评论：置顶的在前，然后按创建时间
  const sortedComments = [...commentItems].sort((a, b) => {
    // 置顶的评论排在前面
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // 同是置顶或同非置顶，按创建时间排序
    const pinnedAtDifference = (b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0)
      - (a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0);
    if (pinnedAtDifference !== 0) return pinnedAtDifference;
    const createdAtDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return createdAtDifference !== 0 ? createdAtDifference : b.id.localeCompare(a.id);
  });

  const activeDeleteCommentId = deletingCommentId ?? deleteConfirmCommentId;

  return (
    <>
      <div
        id="comments-section"
        className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-t border-gray-100"
      >
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            评论 ({total})
          </h2>
          {/* Comment Form */}
          <CommentForm postId={postId} onCommentPosted={refreshComments} />
          {commentItems.length === 0 ? (
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
                  onLoadReplies={loadMoreReplies}
                  onDeleteComment={requestDeleteComment}
                  onPinComment={handlePinComment}
                  deletingCommentId={activeDeleteCommentId}
                  pinningCommentId={pinningCommentId}
                />
              ))}
              {(commentsHasMore || commentsLoadError) && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  {commentsLoadError && <p className="text-sm text-red-500">{commentsLoadError}</p>}
                  <button
                    type="button"
                    onClick={() => void loadMoreComments()}
                    disabled={loadingMoreComments}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-60"
                  >
                    {loadingMoreComments ? "加载中..." : commentsLoadError ? "重试" : "加载更多评论"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={deleteConfirmCommentId !== null}
        onClose={() => {
          if (!deletingCommentId) {
            setDeleteConfirmCommentId(null);
          }
        }}
        title="删除评论"
        showCloseButton={!deletingCommentId}
        className="max-w-sm"
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-gray-600">
            确定要删除这条评论吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmCommentId(null)}
              disabled={Boolean(deletingCommentId)}
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteComment()}
              disabled={!deleteConfirmCommentId || Boolean(deletingCommentId)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingCommentId ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              删除评论
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface CommentFormProps {
  postId: string;
  parentId?: string;
  replyToId?: string;
  replyToName?: string | null;
  onCommentPosted?: () => void;
}

interface UploadedCommentImage {
  url: string;
  name: string;
}

const MAX_COMMENT_IMAGES = 9;

function CommentForm({ postId, parentId, replyToId, replyToName, onCommentPosted }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComposerActive, setIsComposerActive] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedCommentImage[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
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
        setUploadedImages((prev) => [...prev, { url: data.url, name: file.name }]);
        setIsComposerActive(true);
      }
    } catch {
      setError("图片上传失败，请稍后重试");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    if (files.length === 0) return;

    setError("");
    const availableSlots = MAX_COMMENT_IMAGES - uploadedImages.length;
    if (availableSlots <= 0) {
      setError(`最多上传 ${MAX_COMMENT_IMAGES} 张图片`);
      return;
    }

    if (files.length > availableSlots) {
      setError(`评论最多上传 ${MAX_COMMENT_IMAGES} 张图片`);
    }

    for (const file of files.slice(0, availableSlots)) {
      await uploadImage(file);
    }
  };

  const removeUploadedImage = (url: string) => {
    setUploadedImages((prev) => prev.filter((image) => image.url !== url));
    setIsComposerActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!(session as Session | null)?.user?.id) {
      setError("请先登录才能发表评论");
      return;
    }
    if (!content.trim() && uploadedImages.length === 0) {
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
        body: JSON.stringify({
          content,
          images: uploadedImages.map((image) => image.url),
          postId,
          parentId,
          replyToId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setContent("");
        setUploadedImages([]);
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
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1" aria-label="已上传图片">
              {uploadedImages.map((image, index) => (
                <div
                  key={image.url}
                  className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewImageIndex(index)}
                    className="h-full w-full cursor-zoom-in"
                    aria-label={`预览图片 ${image.name}`}
                    title="预览图片"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(image.url)}
                    disabled={isBusy}
                    className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`移除图片 ${image.name}`}
                    title="移除图片"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isBusy}
                />
              </div>

              <button
                type="submit"
                disabled={isBusy || (!content.trim() && uploadedImages.length === 0)}
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
      {previewImageIndex !== null && uploadedImages[previewImageIndex] && (
        <ImagePreviewLightbox
          images={uploadedImages.map((image) => ({ src: image.url, alt: image.name }))}
          currentIndex={previewImageIndex}
          onClose={() => setPreviewImageIndex(null)}
          onIndexChange={setPreviewImageIndex}
        />
      )}
    </div>
  );
}

interface CommentMoreMenuProps {
  canDelete: boolean;
  canPin: boolean;
  pinned: boolean;
  disabled: boolean;
  isDeleting: boolean;
  isPinning: boolean;
  onDelete?: () => void | Promise<void>;
  onPin?: () => void | Promise<void>;
}

function CommentMoreMenu({
  canDelete,
  canPin,
  pinned,
  disabled,
  isDeleting,
  isPinning,
  onDelete,
  onPin,
}: CommentMoreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!canDelete && !canPin) {
    return null;
  }

  const menuDisabled = disabled || isDeleting || isPinning;

  const runAction = async (action?: () => void | Promise<void>) => {
    if (!action || menuDisabled) return;

    await action();
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "bg-gray-100 text-gray-700"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        }`}
        aria-label="更多操作"
        aria-haspopup="menu"
        aria-expanded={open}
        title="更多操作"
      >
        <Ellipsis className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-50 mb-1 w-36 overflow-hidden rounded-lg border border-gray-100 bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
        >
          {canPin && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void runAction(onPin)}
              disabled={menuDisabled}
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPinning ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : pinned ? (
                <PinOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Pin className="h-4 w-4" aria-hidden="true" />
              )}
              {pinned ? "取消置顶" : "设置置顶"}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void runAction(onDelete)}
              disabled={menuDisabled}
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              删除评论
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReplyItem({
  reply,
  mounted,
  currentUserId,
  onReply,
  onJumpToReply,
  isHighlighted,
  onDeleteComment,
  onOpenImagePreview,
  deletingCommentId,
  pinningCommentId,
}: {
  reply: ReplyComment;
  mounted: boolean;
  currentUserId: string | null;
  onReply: (target: { id: string; name: string | null }) => void;
  onJumpToReply: (replyId: string) => void;
  isHighlighted: boolean;
  onDeleteComment: (id: string) => void | Promise<void>;
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

      if (isInternalUserLink(href)) {
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
    <div
      id={`comment-${reply.id}`}
      className={`border-t border-gray-100 pt-3 first:border-t-0 transition-colors duration-300 ${
        isHighlighted ? "rounded bg-blue-50 ring-2 ring-blue-200" : ""
      }`}
    >
      <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
        <Avatar
          src={reply.author.avatar}
          name={reply.author.name}
          size="md"
        />

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 leading-5">
            <Link
              href={`/user/${reply.author.id}`}
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              {reply.author.name || "匿名用户"}
            </Link>
            <span className="text-xs text-gray-400">
              {mounted ? format(new Date(reply.createdAt), "yyyy年MM月dd日 HH:mm") : ""}
            </span>
          </div>

          <div className="mt-2 min-w-0 text-gray-700 prose prose-sm prose-p:my-0 max-w-none break-words">
            {showReplyToPrefix && (
              <button
                type="button"
                onClick={() => onJumpToReply(reply.replyToId!)}
                className="mb-1 block text-left text-xs text-gray-500 not-prose hover:text-blue-500 hover:underline"
                title="跳转到被回复的评论"
              >
                对{reply.replyTo?.author.name || "匿名用户"}用户的回复：
              </button>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {reply.content}
            </ReactMarkdown>
          </div>

          <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LikeButton
                targetType="comment"
                targetId={reply.id}
                initialLikesCount={reply.likeCount ?? reply.likes?.length ?? 0}
                initialLikedByUser={reply.likedByMe ?? (
                  currentUserId
                    ? Boolean(reply.likes?.some((like) => like.userId === currentUserId))
                    : false
                )}
              />
              <button
                type="button"
                onClick={() => onReply({ id: reply.id, name: reply.author.name })}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-500"
                title="回复"
                aria-label="回复"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <CommentMoreMenu
              canDelete={currentUserId === reply.author.id}
              canPin={false}
              pinned={false}
              disabled={isMutating}
              isDeleting={isDeleting}
              isPinning={false}
              onDelete={() => onDeleteComment(reply.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  postAuthorId,
  onCommentPosted,
  onLoadReplies,
  onDeleteComment,
  onPinComment,
  deletingCommentId,
  pinningCommentId,
}: {
  comment: CommentProps;
  currentUserId: string | null;
  postAuthorId: string;
  onCommentPosted: () => void;
  onLoadReplies: (commentId: string, cursor: string | null) => Promise<void>;
  onDeleteComment: (id: string) => void | Promise<void>;
  onPinComment: (id: string, pinned: boolean) => void | Promise<void>;
  deletingCommentId: string | null;
  pinningCommentId: string | null;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    name: string | null;
  } | null>(null);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyIdToFocus, setReplyIdToFocus] = useState<string | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageAlt, setPreviewImageAlt] = useState("评论图片预览");
  const [mounted, setMounted] = useState(false);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayedReplies = showAllReplies
    ? comment.replies
    : comment.replies?.slice(0, 1);
  const replyCount = comment.replyCount ?? comment.replies?.length ?? 0;
  const remainingRepliesCount = Math.max(replyCount - (comment.replies?.length || 0), 0);

  const handleLoadReplies = async () => {
    if (loadingReplies || !comment.repliesHasMore) return;
    setLoadingReplies(true);
    try {
      await onLoadReplies(comment.id, comment.repliesNextCursor ?? null);
      setShowAllReplies(true);
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!replyIdToFocus) return;

    const frameId = requestAnimationFrame(() => {
      const target = document.getElementById(`comment-${replyIdToFocus}`);
      if (!target) {
        setReplyIdToFocus(null);
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedReplyId(replyIdToFocus);

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedReplyId(null);
        highlightTimeoutRef.current = null;
      }, 1000);
      setReplyIdToFocus(null);
    });

    return () => cancelAnimationFrame(frameId);
  }, [replyIdToFocus]);

  const openReplyForm = (target?: { id: string; name: string | null }) => {
    setReplyTarget(target || null);
    setShowReplyForm(true);
  };

  const jumpToReply = (replyId: string) => {
    setShowAllReplies(true);
    setReplyIdToFocus(replyId);
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

      if (isInternalUserLink(href)) {
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
    <div id={`comment-${comment.id}`} className="border-t border-gray-200 pt-4 first:border-t-0">
      <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
        <Avatar
          src={comment.author.avatar}
          name={comment.author.name}
          size="md"
        />

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 leading-5">
            <Link
              href={`/user/${comment.author.id}`}
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              {comment.author.name || "匿名用户"}
            </Link>
            <span className="text-xs text-gray-400">
              {mounted
                ? format(new Date(comment.createdAt), "yyyy年MM月dd日 HH:mm")
                : ""}
            </span>
            {comment.pinned && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                置顶
              </span>
            )}
          </div>

          <div
            className="mt-2 min-w-0 cursor-pointer text-gray-700 prose prose-sm prose-p:my-0 max-w-none break-words hover:bg-gray-50"
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

          <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LikeButton
                targetType="comment"
                targetId={comment.id}
                initialLikesCount={comment.likeCount ?? comment.likes?.length ?? 0}
                initialLikedByUser={comment.likedByMe ?? (
                  currentUserId
                    ? Boolean(comment.likes?.some((like) => like.userId === currentUserId))
                    : false
                )}
              />
              <button
                type="button"
                onClick={toggleRootReplyForm}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-500"
                title={showReplyForm ? "取消回复" : "回复"}
                aria-label={showReplyForm ? "取消回复" : "回复"}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <CommentMoreMenu
              canDelete={currentUserId === comment.author.id}
              canPin={isPostAuthor}
              pinned={Boolean(comment.pinned)}
              disabled={isMutating}
              isDeleting={isDeleting}
              isPinning={isPinning}
              onDelete={() => onDeleteComment(comment.id)}
              onPin={() => onPinComment(comment.id, !comment.pinned)}
            />
          </div>
        </div>
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

      {replyCount > 0 && (
        <div className="ml-8 mt-4 space-y-3">
          {displayedReplies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              mounted={mounted}
              currentUserId={currentUserId}
              onReply={openReplyForm}
              onJumpToReply={jumpToReply}
              isHighlighted={highlightedReplyId === reply.id}
              onDeleteComment={onDeleteComment}
              onOpenImagePreview={openImagePreview}
              deletingCommentId={deletingCommentId}
              pinningCommentId={pinningCommentId}
            />
          ))}
          {comment.repliesHasMore ? (
            <button
              type="button"
              onClick={() => void handleLoadReplies()}
              disabled={loadingReplies}
              className="text-sm text-blue-500 hover:underline disabled:opacity-60"
            >
              {loadingReplies
                ? "加载回复中..."
                : comment.replies.length === 0
                  ? `查看${replyCount}个回复`
                  : `加载更多回复（剩余${remainingRepliesCount}个）`}
            </button>
          ) : showAllReplies && comment.replies.length > 0 ? (
            <button
              type="button"
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
