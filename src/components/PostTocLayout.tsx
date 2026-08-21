"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ListTree } from "lucide-react";

const POST_TOC_OPEN_STORAGE_KEY = "post-detail-toc-open";

interface PostTocContextValue {
  enabled: boolean;
  isOpen: boolean;
  toggle: () => void;
}

const PostTocContext = createContext<PostTocContextValue | null>(null);

function PostTocProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [preferenceReady, setPreferenceReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    try {
      const storedValue = window.localStorage.getItem(POST_TOC_OPEN_STORAGE_KEY);

      if (storedValue === "true" || storedValue === "false") {
        setIsOpen(storedValue === "true");
      }
    } catch {
      // localStorage may be unavailable in private browsing or restricted contexts.
    } finally {
      setPreferenceReady(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !preferenceReady) return;

    try {
      window.localStorage.setItem(POST_TOC_OPEN_STORAGE_KEY, String(isOpen));
    } catch {
      // Ignore storage failures so the layout remains usable.
    }
  }, [enabled, isOpen, preferenceReady]);

  const toggle = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  const value = useMemo(
    () => ({ enabled, isOpen, toggle }),
    [enabled, isOpen, toggle],
  );

  return <PostTocContext.Provider value={value}>{children}</PostTocContext.Provider>;
}

export function usePostToc(): PostTocContextValue {
  const context = useContext(PostTocContext);

  if (!context) {
    throw new Error("usePostToc must be used within PostTocLayout");
  }

  return context;
}

export function PostTocReopenButton() {
  const { enabled, isOpen, toggle } = usePostToc();

  if (!enabled) return null;

  return (
    <div className="post-toc-reopen-toggle" aria-hidden={isOpen}>
      <button
        type="button"
        onClick={toggle}
        disabled={isOpen}
        className="post-toc-reopen-button"
        aria-label="打开目录"
        title="打开目录"
      >
        <ListTree className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

interface PostTocLayoutProps {
  children: ReactNode;
  toc: ReactNode;
  enabled?: boolean;
}

export default function PostTocLayout({
  children,
  toc,
  enabled = true,
}: PostTocLayoutProps) {
  return (
    <PostTocProvider enabled={enabled}>
      <PostTocStateFrame enabled={enabled} toc={toc}>
        {children}
      </PostTocStateFrame>
    </PostTocProvider>
  );
}

function PostTocStateFrame({
  children,
  toc,
  enabled,
}: PostTocLayoutProps & { enabled: boolean }) {
  const { isOpen } = usePostToc();

  if (!enabled) {
    return (
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6 px-0">
        <div className="px-0">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`post-detail-layout${isOpen ? "" : " post-detail-layout--toc-collapsed"}`}
      data-toc-open={isOpen}
    >
      <div className="post-detail-main px-0">{children}</div>
      <div
        className="post-detail-toc"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        {toc}
      </div>
    </div>
  );
}
