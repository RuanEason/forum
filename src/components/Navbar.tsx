"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Menu, Plus, Search, Settings, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { PageTopProgressBar } from "@/components/PageLoadProgressProvider";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = session?.user;
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/unread-count");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    };

    fetchUnreadCount();
    const interval = window.setInterval(fetchUnreadCount, 60000);
    return () => window.clearInterval(interval);
  }, [status, pathname]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setSearchQuery("");
      closeTimerRef.current = null;
    }, 180);
  }, []);

  const openSearch = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsSearchOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (isSearchOpen) {
        closeSearch();
      }

      if (isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen, isMobileMenuOpen, closeSearch, closeMobileMenu]);

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
    [handleSearch],
  );

  const visibleUnreadCount = status === "authenticated" ? unreadCount : 0;
  const notificationBadge = visibleUnreadCount > 99 ? "99+" : visibleUnreadCount;

  return (
    <>
      <header className="relative border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <Link
            href="/"
            className={`group flex items-center space-x-2 transition-all duration-300 ${
              isSearchOpen
                ? "pointer-events-none opacity-0 sm:pointer-events-auto sm:opacity-100"
                : "opacity-100"
            }`}
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Slept论坛
            </span>
          </Link>

          <div
            ref={searchContainerRef}
            className={`pointer-events-none absolute inset-0 flex items-center justify-center px-2 transition-all duration-300 ease-in-out sm:px-4 ${
              isSearchOpen ? "visible opacity-100" : "invisible opacity-0"
            }`}
          >
            <div
              className={`pointer-events-auto flex items-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-lg transition-[opacity,transform] duration-200 ease-out ${
                isSearchOpen
                  ? "w-full max-w-sm scale-100 opacity-100 sm:max-w-md md:max-w-xl"
                  : "w-full max-w-sm scale-95 opacity-0 sm:max-w-md md:max-w-xl"
              }`}
            >
              <div className="pl-4 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索帖子、用户..."
                className="flex-1 border-none bg-transparent px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 sm:text-base"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="mr-1 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="关闭搜索"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav
            className={`flex items-center transition-all duration-300 ${
              isSearchOpen
                ? "pointer-events-none opacity-0 sm:pointer-events-auto sm:opacity-100"
                : "opacity-100"
            }`}
          >
            <div className="hidden items-center space-x-4 md:flex">
              {status === "loading" ? (
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                  <div className="h-9 w-20 animate-pulse rounded-full bg-gray-200" />
                </div>
              ) : status === "authenticated" ? (
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {pathname !== "/" && (
                    <Link
                      href="/post/create"
                      className="hidden items-center rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:inline-flex"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      发帖
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={openSearch}
                    className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                    aria-label="搜索"
                  >
                    <Search className="h-5 w-5" />
                  </button>

                  <Link
                    href="/notifications"
                    className="relative rounded-full p-1 text-gray-500 transition-colors hover:text-indigo-600"
                    aria-label="通知"
                  >
                    <Bell className="h-6 w-6" />
                    {visibleUnreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                        {notificationBadge}
                      </span>
                    )}
                  </Link>

                  {currentUser?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-1 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
                    >
                      <Settings className="h-4 w-4" />
                      <span>管理面板</span>
                    </Link>
                  )}

                  <Link
                    href={`/user/${currentUser?.id}`}
                    className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  >
                    <Avatar
                      src={currentUser?.avatar}
                      name={currentUser?.name}
                      size="sm"
                      className="ring-2 ring-transparent transition-all group-hover:ring-indigo-100"
                    />
                    <span className="hidden text-sm font-medium transition-colors group-hover:text-indigo-600 sm:inline">
                      {currentUser?.name || "用户"}
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={openSearch}
                    className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                    aria-label="搜索"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  <Link
                    href={`/auth/signin?redirect=${encodeURIComponent(pathname || "/")}`}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-indigo-600"
                  >
                    登录
                  </Link>
                  <Link
                    href={`/auth/signup?redirect=${encodeURIComponent(pathname || "/")}`}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={openSearch}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                aria-label="搜索"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600"
                aria-label={isMobileMenuOpen ? "关闭菜单" : "打开菜单"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>

    {currentUser?.banned && (
      <div
        className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-800"
        role="alert"
      >
        你的账号已被封禁，当前只能查看页面，无法执行发帖、评论、点赞、转发、关注或上传等操作。
      </div>
    )}

    {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={closeMobileMenu}
            aria-label="关闭菜单"
          />
          <aside
            id="mobile-navigation-drawer"
            className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="用户菜单"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <span className="text-base font-semibold text-gray-900">菜单</span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="关闭菜单"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {status === "loading" ? (
                <div className="space-y-3">
                  <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
                </div>
              ) : status === "authenticated" ? (
                <div className="space-y-2">
                  <Link
                    href={`/user/${currentUser?.id}`}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 transition-colors hover:bg-indigo-50"
                  >
                    <Avatar
                      src={currentUser?.avatar}
                      name={currentUser?.name}
                      size="md"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                      {currentUser?.name || "用户"}
                    </span>
                  </Link>

                  <Link
                    href="/notifications"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <span className="relative">
                      <Bell className="h-5 w-5" />
                      {visibleUnreadCount > 0 && (
                        <span className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
                          {notificationBadge}
                        </span>
                      )}
                    </span>
                    <span>通知</span>
                  </Link>

                  {pathname !== "/" && (
                    <Link
                      href="/post/create"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                    >
                      <Plus className="h-5 w-5" />
                      <span>发帖</span>
                    </Link>
                  )}

                  {currentUser?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                    >
                      <Settings className="h-5 w-5" />
                      <span>管理面板</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="px-1 text-sm text-gray-500">
                    登录后可以发布帖子、接收通知并管理个人资料。
                  </p>
                  <Link
                    href={`/auth/signin?redirect=${encodeURIComponent(pathname || "/")}`}
                    onClick={closeMobileMenu}
                    className="flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    登录
                  </Link>
                  <Link
                    href={`/auth/signup?redirect=${encodeURIComponent(pathname || "/")}`}
                    onClick={closeMobileMenu}
                    className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <PageTopProgressBar />
    </>
  );
}
