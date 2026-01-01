"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchUnreadCount = async () => {
        try {
          const res = await fetch("/api/notifications/unread-count");
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.count);
          }
        } catch (error) {
          console.error("Failed to fetch unread count", error);
        }
      };

      fetchUnreadCount();
      // Poll every minute
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [status, pathname]);

  // Don't show navbar on auth pages if desired, or keep it simple.
  // For now, let's keep it everywhere as it provides a way back home.
  // If specific pages need to be excluded, we can add logic here.
  const isAuthPage = pathname?.startsWith("/auth/");

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              同学论坛
            </span>
          </Link>

          <nav className="flex items-center space-x-4">
            {status === "authenticated" ? (
              <div className="flex items-center space-x-3 sm:space-x-4">
                {pathname !== "/" && (
                  <Link
                    href="/post/create"
                    className="hidden sm:inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    发帖
                  </Link>
                )}
                <Link
                  href="/notifications"
                  className="relative p-1 text-gray-500 hover:text-indigo-600 transition-colors mr-2"
                  aria-label="Notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                {session.user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    <span className="hidden sm:inline">管理面板</span>
                    <span className="sm:hidden">管理</span>
                  </Link>
                )}
                <Link
                  href={`/user/${session.user.id}`}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 group"
                >
                  <Avatar
                    src={session.user.avatar}
                    name={session.user.name}
                    size="sm"
                    className="ring-2 ring-transparent group-hover:ring-indigo-100 transition-all"
                  />
                  <span className="hidden sm:inline text-sm font-medium group-hover:text-indigo-600 transition-colors">
                    {session.user.name || "我"}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-all"
                >
                  登录
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 shadow-sm hover:shadow transition-all"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
