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
import { usePathname, useSearchParams } from "next/navigation";

type EndTask = () => void;

interface PageLoadProgressContextValue {
  visible: boolean;
  progress: number;
  pendingCount: number;
  startTask: (label?: string) => EndTask;
  trackPromise: <T>(promise: Promise<T>, label?: string) => Promise<T>;
}

const DISPLAY_DELAY_MS = 90;
const HIDE_DELAY_MS = 220;
const MAX_PROGRESS_WHILE_LOADING = 93;
const SKIP_HEADER = "x-skip-global-loading";
const PREFETCH_HEADER_KEYS = [
  "purpose",
  "sec-purpose",
  "next-router-prefetch",
  "x-middleware-prefetch",
] as const;

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

function isSameRoute(url: URL): boolean {
  return (
    url.origin === window.location.origin
    && url.pathname === window.location.pathname
    && url.search === window.location.search
  );
}

export function PageLoadProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  const [pendingCount, setPendingCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const taskIdRef = useRef(0);
  const tasksRef = useRef<Map<number, string>>(new Map());
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const trickleTimerRef = useRef<number | null>(null);
  const navigationStartTimerRef = useRef<number | null>(null);
  const navigationTimeoutRef = useRef<number | null>(null);
  const navigationTaskRef = useRef<EndTask | null>(null);

  const syncPendingCount = useCallback(() => {
    setPendingCount(tasksRef.current.size);
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

  const startNavigationTask = useCallback(() => {
    if (navigationTaskRef.current) {
      return;
    }
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
  }, [startTask]);

  const scheduleNavigationTaskStart = useCallback(() => {
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
        if (isSameRoute(nextUrl)) {
          return;
        }
        scheduleNavigationTaskStart();
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
        if (url.origin !== window.location.origin || isSameRoute(url)) {
          return;
        }
        scheduleNavigationTaskStart();
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
      const nextRouteKey = `${window.location.pathname}?${window.location.search.slice(1)}`;
      if (nextRouteKey === routeKey) {
        return;
      }
      scheduleNavigationTaskStart();
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
      if (navigationStartTimerRef.current !== null) {
        window.clearTimeout(navigationStartTimerRef.current);
      }
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
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
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
      <div
        className={`h-full bg-indigo-500 transition-[width,opacity] duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
