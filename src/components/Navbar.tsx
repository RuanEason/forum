"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't show navbar on auth pages if desired, or keep it simple.
  // For now, let's keep it everywhere as it provides a way back home.
  // If specific pages need to be excluded, we can add logic here.
  const isAuthPage = pathname?.startsWith("/auth/");

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
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
