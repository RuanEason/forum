"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Plus, Bell, Settings } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, []);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  // Auto focus when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        closeSearch();
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, closeSearch]);

  // Handle Escape key to close search
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSearchOpen, closeSearch]);

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      closeSearch();
    }
  }, [searchQuery, router, closeSearch]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  // Don't show navbar on auth pages if desired, or keep it simple.
  // For now, let's keep it everywhere as it provides a way back home.
  // If specific pages need to be excluded, we can add logic here.
  // const isAuthPage = pathname?.startsWith("/auth/");

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Logo - hidden when search is open on mobile */}
          <Link
            href="/"
            className={`flex items-center space-x-2 group transition-all duration-300 ${
              isSearchOpen
                ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto"
                : "opacity-100"
            }`}
          >
            <div className="relative w-8 h-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              同学论坛
            </span>
          </Link>

          {/* Search Overlay */}
          <div
            ref={searchContainerRef}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
              isSearchOpen
                ? "opacity-100 visible"
                : "opacity-0 invisible pointer-events-none"
            }`}
          >
            {/* Search input container */}
            <div
              className={`flex items-center bg-white border border-gray-200 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
                isSearchOpen
                  ? "w-full sm:w-[80%] md:w-[70%] lg:w-[60%] scale-100"
                  : "w-0 scale-95"
              }`}
            >
              {/* Search icon inside input */}
              <div className="pl-4 text-gray-400">
                <Search className="h-5 w-5" />
              </div>

              {/* Input field */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索帖子、用户..."
                className="flex-1 px-3 py-2.5 text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 text-sm sm:text-base"
              />

              {/* Close button */}
              <button
                onClick={closeSearch}
                className="p-2 mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="关闭搜索"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`flex items-center space-x-4 transition-all duration-300 ${
              isSearchOpen
                ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto"
                : "opacity-100"
            }`}
          >
            {status === "authenticated" ? (
              <div className="flex items-center space-x-3 sm:space-x-4">
                {pathname !== "/" && (
                  <Link
                    href="/post/create"
                    className="hidden sm:inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    发帖
                  </Link>
                )}

                {/* Search Button */}
                <button
                  onClick={openSearch}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="搜索"
                >
                  <Search className="h-5 w-5" />
                </button>

                <Link
                  href="/notifications"
                  className="relative p-1 text-gray-500 hover:text-indigo-600 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                {(session.user as any)?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">管理面板</span>
                    <span className="sm:hidden">管理</span>
                  </Link>
                )}
                <Link
                  href={`/user/${(session.user as any).id}`}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 group"
                >
                  <Avatar
                    src={(session.user as any).avatar}
                    name={(session.user as any).name}
                    size="sm"
                    className="ring-2 ring-transparent group-hover:ring-indigo-100 transition-all"
                  />
                  <span className="hidden sm:inline text-sm font-medium group-hover:text-indigo-600 transition-colors">
                    {(session.user as any).name || "我"}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Search Button for non-authenticated users */}
                <button
                  onClick={openSearch}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="搜索"
                >
                  <Search className="h-5 w-5" />
                </button>

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
