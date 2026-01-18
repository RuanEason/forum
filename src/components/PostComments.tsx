"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeButton from "@/components/LikeButton";
import Avatar from "@/components/Avatar";

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
  postId: string;
  likes: { userId: string }[];
  replies: Omit<CommentProps, "replies">[];
}

interface PostCommentsProps {
  comments: CommentProps[];
  postId: string;
}

export default function PostComments({ comments, postId }: PostCommentsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const refreshComments = () => {
    router.refresh();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("确定要删除这条评论吗？")) return;

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
    }
  };

  return (
    <div
      id="comments-section"
      className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-t border-gray-100"
    >
      <div className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          评论 ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">
            还没有评论，快来发表第一条评论吧！
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={(session as any)?.user?.id || null}
                onCommentPosted={refreshComments}
                onDeleteComment={handleDeleteComment}
              />
            ))}
          </div>
        )}
        {/* Comment Form */}
        <CommentForm postId={postId} onCommentPosted={refreshComments} />
      </div>
    </div>
  );
}

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentPosted?: () => void;
}

function CommentForm({ postId, parentId, onCommentPosted }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!(session as any)?.user?.id) {
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
        body: JSON.stringify({ content, postId, parentId }),
      });

      const data = await response.json();

      if (response.ok) {
        setContent("");
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

  if (!session) {
    return (
      <p className="text-center text-gray-500 mt-4">
        <Link href="/auth/signin" className="text-blue-600 hover:underline">
          登录
        </Link>{" "}
        后发表评论
      </p>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-2">
        {parentId ? "回复" : "发表评论"}
      </h3>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          rows={parentId ? 2 : 4}
          placeholder={
            parentId
              ? "在这里输入你的回复..."
              : "在这里输入你的评论 (支持 Markdown)..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
        ></textarea>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          type="submit"
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading
            ? parentId
              ? "回复中..."
              : "评论中..."
            : parentId
            ? "回复"
            : "发表评论"}
        </button>
      </form>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onCommentPosted,
  onDeleteComment,
}: {
  comment: CommentProps;
  currentUserId: string | null;
  onCommentPosted: () => void;
  onDeleteComment: (id: string) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const displayedReplies = showAllReplies
    ? comment.replies
    : comment.replies?.slice(0, 1);
  const remainingRepliesCount = (comment.replies?.length || 0) - 1;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div id={`comment-${comment.id}`} className="border-t border-gray-200 pt-4">
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
      {comment.parentId ? (
        <div className="mt-2 text-sm text-gray-700 p-1 prose prose-sm max-w-none break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {comment.content}
          </ReactMarkdown>
        </div>
      ) : (
        <div
          className="mt-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded prose prose-sm max-w-none break-words"
          onClick={() => setShowReplyForm(!showReplyForm)}
          title="点击回复"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {comment.content}
          </ReactMarkdown>
        </div>
      )}
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
        {!comment.parentId && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 text-sm group"
            title="回复"
          >
            <span className="font-medium">
              {showReplyForm ? "取消回复" : "回复"}
            </span>
          </button>
        )}
        {currentUserId === comment.author.id && (
          <button
            onClick={() => onDeleteComment(comment.id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            删除
          </button>
        )}
      </div>
      {showReplyForm && (
        <div className="ml-8 mt-4">
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            onCommentPosted={() => {
              setShowReplyForm(false);
              onCommentPosted();
            }}
          />
        </div>
      )}
      {comment.replies?.length > 0 && (
        <div className="ml-8 mt-4 space-y-3">
          {displayedReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply as CommentProps}
              currentUserId={currentUserId}
              onCommentPosted={onCommentPosted}
              onDeleteComment={onDeleteComment}
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
    </div>
  );
}
