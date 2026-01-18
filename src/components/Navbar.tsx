"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";

// Search icon SVG component (defined outside to avoid recreating on each render)
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

// Close icon SVG component (defined outside to avoid recreating on each render)
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <SearchIcon />
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
                <CloseIcon />
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

                {/* Search Button */}
                <button
                  onClick={openSearch}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="搜索"
                >
                  <SearchIcon />
                </button>

                <Link
                  href="/notifications"
                  className="relative p-1 text-gray-500 hover:text-indigo-600 transition-colors"
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

                {(session.user as any)?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                  >
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
                  <SearchIcon />
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
