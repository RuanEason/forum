"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type EndTask = () => void;

interface PageLoadProgressContextValue {
  visible: boolean;
  progress: number;
  pendingCount: number;
  startTask: (label?: string) => EndTask;
  trackPromise: <T>(promise: Promise<T>, label?: string) => Promise<T>;
}

const DISPLAY_DELAY_MS = 20;
const HIDE_DELAY_MS = 220;
const MAX_PROGRESS_WHILE_LOADING = 93;
const FULLSCREEN_MIN_VISIBLE_MS = 300;
const INITIAL_LOADING_MIN_VISIBLE_MS = 420;
const SKIP_HEADER = "x-skip-global-loading";
const PREFETCH_HEADER_KEYS = [
  "purpose",
  "sec-purpose",
  "next-router-prefetch",
  "x-middleware-prefetch",
] as const;
const FULLSCREEN_TASK_LABELS = new Set(["initial-screen", "document", "navigation"]);

const PageLoadProgressContext = createContext<PageLoadProgressContextValue | null>(null);

function getHeaderValue(headers: HeadersInit | undefined, key: string): string | null {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(key);
  }

  const normalizedKey = key.toLowerCase();

  if (Array.isArray(headers)) {
    for (const [headerKey, headerValue] of headers) {
      if (headerKey.toLowerCase() === normalizedKey) {
        return headerValue;
      }
    }
    return null;
  }

  for (const [headerKey, headerValue] of Object.entries(headers)) {
    if (headerKey.toLowerCase() === normalizedKey) {
      if (Array.isArray(headerValue)) {
        return headerValue.join(",");
      }
      return String(headerValue);
    }
  }

  return null;
}

function getRequestUrl(input: RequestInfo | URL): string | null {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function shouldTrackFetch(input: RequestInfo | URL, init?: RequestInit): boolean {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (method === "HEAD" || method === "OPTIONS") {
    return false;
  }

  const skipByInit = getHeaderValue(init?.headers, SKIP_HEADER);
  const skipByRequest = input instanceof Request ? input.headers.get(SKIP_HEADER) : null;
  const skipFlag = (skipByInit ?? skipByRequest)?.toLowerCase();
  if (skipFlag === "1" || skipFlag === "true" || skipFlag === "yes") {
    return false;
  }

  const mergedHeaders = [
    ...(input instanceof Request ? Array.from(input.headers.entries()) : []),
    ...(init?.headers instanceof Headers ? Array.from(init.headers.entries()) : []),
    ...(Array.isArray(init?.headers) ? init.headers : []),
    ...(
      init?.headers && !Array.isArray(init.headers) && !(init.headers instanceof Headers)
        ? Object.entries(init.headers)
        : []
    ),
  ];

  for (const headerKey of PREFETCH_HEADER_KEYS) {
    const headerFromInit = getHeaderValue(init?.headers, headerKey);
    const headerFromRequest = input instanceof Request ? input.headers.get(headerKey) : null;
    const headerFromMerged = mergedHeaders.find(
      ([currentKey]) => currentKey.toLowerCase() === headerKey
    )?.[1] ?? null;
    const headerValue = (headerFromInit ?? headerFromRequest ?? headerFromMerged)?.toLowerCase();
    if (headerValue?.includes("prefetch")) {
      return false;
    }
  }

  const rawUrl = getRequestUrl(input);
  if (!rawUrl) {
    return true;
  }

  try {
    const url = new URL(rawUrl, window.location.href);
    if (url.origin !== window.location.origin) {
      return false;
    }
    if (url.pathname.startsWith("/_next/")) {
      return false;
    }
  } catch {
    return true;
  }

  return true;
}

function isSamePath(url: URL): boolean {
  return (
    url.origin === window.location.origin
    && url.pathname === window.location.pathname
  );
}

function isCreatePostRoute(rawUrl: string | URL | null | undefined): boolean {
  if (!rawUrl) {
    return false;
  }

  try {
    return new URL(String(rawUrl), window.location.href).pathname === "/post/create";
  } catch {
    return false;
  }
}

function isSignInRoute(rawUrl: string | URL | null | undefined): boolean {
  if (!rawUrl) {
    return false;
  }

  try {
    return new URL(String(rawUrl), window.location.href).pathname === "/auth/signin";
  } catch {
    return false;
  }
}

function countFullScreenTasks(tasks: Map<number, string>): number {
  let count = 0;
  for (const label of tasks.values()) {
    if (FULLSCREEN_TASK_LABELS.has(label)) {
      count += 1;
    }
  }
  return count;
}

export function PageLoadProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routeKey = pathname ?? "";

  const [pendingCount, setPendingCount] = useState(0);
  const [fullscreenPendingCount, setFullscreenPendingCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const taskIdRef = useRef(0);
  const tasksRef = useRef<Map<number, string>>(new Map());
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const trickleTimerRef = useRef<number | null>(null);
  const fullScreenHideTimerRef = useRef<number | null>(null);
  const fullScreenShownAtRef = useRef<number>(typeof window !== "undefined" ? window.performance.now() : 0);
  const initialScreenTaskRef = useRef<EndTask | null>(null);
  const initialScreenFinishedRef = useRef(false);
  const navigationStartTimerRef = useRef<number | null>(null);
  const navigationTimeoutRef = useRef<number | null>(null);
  const navigationTaskRef = useRef<EndTask | null>(null);

  const syncPendingCount = useCallback(() => {
    const tasks = tasksRef.current;
    setPendingCount(tasks.size);
    setFullscreenPendingCount(countFullScreenTasks(tasks));
  }, []);

  const finishTaskById = useCallback((taskId: number) => {
    if (!tasksRef.current.delete(taskId)) {
      return;
    }
    syncPendingCount();
  }, [syncPendingCount]);

  const startTask = useCallback((label = "task"): EndTask => {
    const taskId = ++taskIdRef.current;
    tasksRef.current.set(taskId, label);
    syncPendingCount();

    let finished = false;
    return () => {
      if (finished) {
        return;
      }
      finished = true;
      finishTaskById(taskId);
    };
  }, [finishTaskById, syncPendingCount]);

  const trackPromise = useCallback(
    async <T,>(promise: Promise<T>, label = "task"): Promise<T> => {
      const finishTask = startTask(label);
      try {
        return await promise;
      } finally {
        finishTask();
      }
    },
    [startTask]
  );

  const revealFullScreenOverlay = useCallback(() => {
    if (fullScreenHideTimerRef.current !== null) {
      window.clearTimeout(fullScreenHideTimerRef.current);
      fullScreenHideTimerRef.current = null;
    }

    if (!fullscreenVisible) {
      fullScreenShownAtRef.current = window.performance.now();
      setFullscreenVisible(true);
    }
  }, [fullscreenVisible]);

  const startNavigationTask = useCallback(() => {
    if (navigationTaskRef.current) {
      return;
    }
    revealFullScreenOverlay();
    navigationTaskRef.current = startTask("navigation");
    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
    }
    // Failsafe: avoid a stuck bar if a navigation gets interrupted.
    navigationTimeoutRef.current = window.setTimeout(() => {
      if (navigationTaskRef.current) {
        const completeTask = navigationTaskRef.current;
        navigationTaskRef.current = null;
        completeTask();
      }
      navigationTimeoutRef.current = null;
    }, 10000);
  }, [revealFullScreenOverlay, startTask]);

  const scheduleNavigationTaskStart = useCallback((rawUrl?: string | URL | null, trackSignInPage = false) => {
    if (isCreatePostRoute(rawUrl) || (isSignInRoute(rawUrl) && !trackSignInPage)) {
      return;
    }

    if (navigationTaskRef.current || navigationStartTimerRef.current !== null) {
      return;
    }

    navigationStartTimerRef.current = window.setTimeout(() => {
      navigationStartTimerRef.current = null;
      startNavigationTask();
    }, 0);
  }, [startNavigationTask]);

  const finishNavigationTask = useCallback(() => {
    if (navigationStartTimerRef.current !== null) {
      window.clearTimeout(navigationStartTimerRef.current);
      navigationStartTimerRef.current = null;
    }

    if (!navigationTaskRef.current) {
      return;
    }
    const completeTask = navigationTaskRef.current;
    navigationTaskRef.current = null;
    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        completeTask();
      });
    });
  }, []);

  useEffect(() => {
    setIsHydrated(true);
    initialScreenTaskRef.current = startTask("initial-screen");
    return () => {
      if (initialScreenTaskRef.current) {
        const finishTask = initialScreenTaskRef.current;
        initialScreenTaskRef.current = null;
        finishTask();
      }
    };
  }, [startTask]);

  useEffect(() => {
    if (!isHydrated || initialScreenFinishedRef.current || !initialScreenTaskRef.current) {
      return;
    }
    if (document.readyState !== "complete") {
      return;
    }

    const elapsed = window.performance.now() - fullScreenShownAtRef.current;
    const remain = Math.max(0, INITIAL_LOADING_MIN_VISIBLE_MS - elapsed);
    const timer = window.setTimeout(() => {
      if (initialScreenTaskRef.current) {
        const finishTask = initialScreenTaskRef.current;
        initialScreenTaskRef.current = null;
        finishTask();
      }
      initialScreenFinishedRef.current = true;
    }, remain);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isHydrated, pendingCount]);

  useEffect(() => {
    if (document.readyState === "complete") {
      return;
    }

    const finishTask = startTask("document");
    const handleLoad = () => {
      finishTask();
      window.removeEventListener("load", handleLoad);
    };

    window.addEventListener("load", handleLoad);
    return () => {
      window.removeEventListener("load", handleLoad);
      finishTask();
    };
  }, [startTask]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    const wrappedFetch: typeof window.fetch = async (input, init) => {
      if (!shouldTrackFetch(input, init)) {
        return originalFetch(input, init);
      }

      const finishTask = startTask("fetch");
      try {
        return await originalFetch(input, init);
      } finally {
        finishTask();
      }
    };

    window.fetch = wrappedFetch;
    return () => {
      window.fetch = originalFetch;
    };
  }, [startTask]);

  useEffect(() => {
    const maybeStartNavigationByHistoryUrl = (rawUrl: string | URL | null | undefined) => {
      if (!rawUrl) {
        return;
      }

      try {
        const nextUrl = new URL(String(rawUrl), window.location.href);
        if (isSamePath(nextUrl)) {
          return;
        }
        scheduleNavigationTaskStart(nextUrl);
      } catch {
        // Ignore malformed URLs.
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") {
        return;
      }
      if (anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin || isSamePath(url)) {
          return;
        }
        scheduleNavigationTaskStart(url, anchor.dataset.trackGlobalLoading === "true");
      } catch {
        // Ignore malformed URLs.
      }
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    const wrappedPushState: History["pushState"] = (...args) => {
      maybeStartNavigationByHistoryUrl(args[2]);
      return originalPushState(...args);
    };

    const wrappedReplaceState: History["replaceState"] = (...args) => {
      maybeStartNavigationByHistoryUrl(args[2]);
      return originalReplaceState(...args);
    };

    const handlePopState = () => {
      const nextRouteKey = window.location.pathname;
      if (nextRouteKey === routeKey) {
        return;
      }
      if (routeKey === "/auth/signin") {
        return;
      }
      scheduleNavigationTaskStart(nextRouteKey);
    };

    window.history.pushState = wrappedPushState;
    window.history.replaceState = wrappedReplaceState;
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [routeKey, scheduleNavigationTaskStart]);

  useEffect(() => {
    finishNavigationTask();
  }, [finishNavigationTask, routeKey]);

  useEffect(() => {
    if (pendingCount > 0) {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      if (!visible && showTimerRef.current === null) {
        showTimerRef.current = window.setTimeout(() => {
          showTimerRef.current = null;
          setVisible(true);
          setProgress((current) => (current > 8 ? current : 8));
        }, DISPLAY_DELAY_MS);
      } else if (visible) {
        setProgress((current) => (current > 8 ? current : 8));
      }
      return;
    }

    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (!visible) {
      setProgress(0);
      return;
    }

    setProgress(100);
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);
  }, [pendingCount, visible]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (fullscreenPendingCount > 0) {
      revealFullScreenOverlay();
      return;
    }

    if (!fullscreenVisible) {
      return;
    }

    if (fullScreenHideTimerRef.current !== null) {
      window.clearTimeout(fullScreenHideTimerRef.current);
    }

    const elapsed = window.performance.now() - fullScreenShownAtRef.current;
    const waitMs = Math.max(HIDE_DELAY_MS, FULLSCREEN_MIN_VISIBLE_MS - elapsed);
    fullScreenHideTimerRef.current = window.setTimeout(() => {
      setFullscreenVisible(false);
      fullScreenHideTimerRef.current = null;
    }, Math.max(0, waitMs));
  }, [fullscreenPendingCount, fullscreenVisible, isHydrated, revealFullScreenOverlay]);

  useEffect(() => {
    if (!visible || pendingCount === 0) {
      if (trickleTimerRef.current !== null) {
        window.clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;
      }
      return;
    }

    trickleTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= MAX_PROGRESS_WHILE_LOADING) {
          return current;
        }
        const remaining = MAX_PROGRESS_WHILE_LOADING - current;
        const increment = Math.max(0.5, remaining * 0.08);
        return Math.min(MAX_PROGRESS_WHILE_LOADING, current + increment);
      });
    }, 180);

    return () => {
      if (trickleTimerRef.current !== null) {
        window.clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;
      }
    };
  }, [pendingCount, visible]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current !== null) {
        window.clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
      if (trickleTimerRef.current !== null) {
        window.clearInterval(trickleTimerRef.current);
      }
      if (fullScreenHideTimerRef.current !== null) {
        window.clearTimeout(fullScreenHideTimerRef.current);
      }
      if (navigationStartTimerRef.current !== null) {
        window.clearTimeout(navigationStartTimerRef.current);
      }
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
      if (initialScreenTaskRef.current) {
        const finishTask = initialScreenTaskRef.current;
        initialScreenTaskRef.current = null;
        finishTask();
      }
      navigationTaskRef.current = null;
    };
  }, []);

  const contextValue = useMemo<PageLoadProgressContextValue>(
    () => ({
      visible,
      progress,
      pendingCount,
      startTask,
      trackPromise,
    }),
    [pendingCount, progress, startTask, trackPromise, visible]
  );

  return (
    <PageLoadProgressContext.Provider value={contextValue}>
      {children}
      <PageFullscreenLoadingOverlay visible={fullscreenVisible} />
    </PageLoadProgressContext.Provider>
  );
}

export function usePageLoadProgress() {
  const context = useContext(PageLoadProgressContext);
  if (!context) {
    throw new Error("usePageLoadProgress must be used within PageLoadProgressProvider");
  }
  return context;
}

export function PageTopProgressBar() {
  const { visible, progress } = usePageLoadProgress();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] h-[2px] overflow-hidden">
      <div
        className={`h-full bg-indigo-500 transition-[width,opacity] duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function PageFullscreenLoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-white transition-opacity duration-200 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div className="text-indigo-600">
        <ThreeDotsLoader />
      </div>
    </div>
  );
}

function ThreeDotsLoader() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none" />
      <rect width="7.33" height="7.33" x="1" y="1" fill="currentColor">
        <animate id="page-loader-dot-1" attributeName="x" begin="0;page-loader-dot-9.end+0.2s" dur="0.6s" values="1;4;1" />
        <animate attributeName="y" begin="0;page-loader-dot-9.end+0.2s" dur="0.6s" values="1;4;1" />
        <animate attributeName="width" begin="0;page-loader-dot-9.end+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="0;page-loader-dot-9.end+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="8.33" y="1" fill="currentColor">
        <animate attributeName="x" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="1;4;1" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="1" y="8.33" fill="currentColor">
        <animate attributeName="x" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="1;4;1" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="15.66" y="1" fill="currentColor">
        <animate attributeName="x" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="1;4;1" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="8.33" y="8.33" fill="currentColor">
        <animate attributeName="x" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="1" y="15.66" fill="currentColor">
        <animate attributeName="x" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="1;4;1" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="15.66" y="8.33" fill="currentColor">
        <animate attributeName="x" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="8.33" y="15.66" fill="currentColor">
        <animate attributeName="x" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="15.66" y="15.66" fill="currentColor">
        <animate id="page-loader-dot-9" attributeName="x" begin="page-loader-dot-1.begin+0.4s" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="y" begin="page-loader-dot-1.begin+0.4s" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="width" begin="page-loader-dot-1.begin+0.4s" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" begin="page-loader-dot-1.begin+0.4s" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
    </svg>
  );
}
