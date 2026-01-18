"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Notification {
  id: string;
  type: "REPLY_POST" | "REPLY_COMMENT" | "LIKE_POST" | "LIKE_COMMENT";
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  post: {
    id: string;
    title: string;
    content: string;
  } | null;
  comment: {
    id: string;
    content: string;
  } | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      // Update local state to reflect read status
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent navigation
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (!notification.post) return;

    let targetUrl = `/post/${notification.post.id}`;
    if (notification.comment?.id) {
      targetUrl += `#comment-${notification.comment.id}`;
    }

    router.push(targetUrl);
  };

  const renderNotificationContent = (notification: Notification) => {
    const { type, sender, post, comment } = notification;
    const senderName = sender.name || "Unknown User";
    let postTitle = post?.title;

    if (!postTitle && post?.content) {
      postTitle = post.content.substring(0, 3) + "...";
    } else if (!postTitle) {
      postTitle = "Unknown Post";
    }

    switch (type) {
      case "REPLY_POST":
        return (
          <div>
            <span className="font-bold text-gray-900">{senderName}</span>
            <span className="text-gray-600"> 回复了你的帖子 </span>
            <span className="font-medium text-indigo-600">
              {postTitle}
            </span>
          </div>
        );
      case "REPLY_COMMENT":
        return (
          <div>
            <span className="font-bold text-gray-900">{senderName}</span>
            <span className="text-gray-600"> 回复了你的评论 </span>
            <span className="font-medium text-indigo-600">
              {postTitle}
            </span>
            {comment && (
              <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                {comment.content.length > 100
                  ? comment.content.substring(0, 100) + "..."
                  : comment.content}
              </div>
            )}
          </div>
        );
      case "LIKE_POST":
        return (
          <div>
            <span className="font-bold text-gray-900">{senderName}</span>
            <span className="text-gray-600"> 赞了你的帖子 </span>
            <span className="font-medium text-indigo-600">
              {postTitle}
            </span>
          </div>
        );
      case "LIKE_COMMENT":
        return (
          <div>
            <span className="font-bold text-gray-900">{senderName}</span>
            <span className="text-gray-600"> 赞了你的评论 </span>
            <span className="font-medium text-indigo-600">
              {postTitle}
            </span>
            {comment && (
              <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                {comment.content.length > 100
                  ? comment.content.substring(0, 100) + "..."
                  : comment.content}
              </div>
            )}
          </div>
        );
      default:
        return <div>未知通知类型</div>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">消息通知</h1>
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
          <p>暂无新消息</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                group relative flex items-start space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200
                ${
                  notification.isRead
                    ? "bg-white hover:bg-gray-50"
                    : "bg-indigo-50 hover:bg-indigo-100/50"
                }
                border border-transparent hover:border-indigo-100 hover:shadow-sm
              `}
            >
              <div className="flex-shrink-0 mt-1">
                <Avatar
                  src={notification.sender.avatar}
                  name={notification.sender.name}
                  size="md"
                />
              </div>
              
              <div className="flex-1 min-w-0 pr-8">
                <div className="text-sm">
                  {renderNotificationContent(notification)}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
              </div>

              {/* Status Indicator or Actions */}
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                {!notification.isRead && (
                  <span className="block h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-white"></span>
                )}
                
                {/* Delete button shown on hover */}
                <button
                  onClick={(e) => deleteNotification(e, notification.id)}
                  className="hidden group-hover:flex items-center justify-center p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="删除通知"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
