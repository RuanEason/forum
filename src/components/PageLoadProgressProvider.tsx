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
import { AlertTriangle, RotateCw, X } from "lucide-react";
import {
  cancelNavigation,
  isNavigationAllowed,
  issueNavigationTicket,
  markNavigationCommitted,
  NAVIGATION_CANCELLED_EVENT,
  readLoadingState,
  writeLoadingCookie,
} from "@/lib/navigation";

type EndTask = () => void;

export interface PageLoadProgressContextValue {
  visible: boolean;
  progress: number;
  pendingCount: number;
  startTask: (label?: string) => EndTask;
  trackPromise: <T>(promise: Promise<T>, label?: string) => Promise<T>;
  startInitialRouteDataTask: () => EndTask;
  /** 开始一次导航：拉起遮罩并启动超时倒计时。 */
  beginNavigationIntent: (href: string | URL | null | undefined) => void;
  /** 目标页面开始拉首屏数据（记录目标地址并保持遮罩）。 */
  onRouteDataStart: (href: string) => void;
  /** 页面首屏数据请求结束（成功或失败）后调用，用于收起遮罩。 */
  endInitialRouteData: () => void;
  /** 执行一次程序化跳转：受加载锁约束，超时后自动放弃。 */
  push: (href: string) => void;
  /** 执行一次程序化跳转（replace 版）。 */
  replace: (href: string) => void;
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

/**
 * 需要用全屏遮罩接管交互的任务类型。
 *
 * 这是一个刻意设计的交互保护层，有两个目的：
 * 1. 给用户即时反馈——点击后立刻有可见响应，而不是毫无动静地等待；
 * 2. 在加载完成前挡住后续点击，避免用户连点两个入口，
 *    导致两个导航并发竞争、页面来回跳转。
 *
 * 只对「用户主动触发」的任务生效（首屏渲染、文档加载、站内导航）。
 * 普通的后台 fetch（通知数、session 等）不在此列，
 * 否则用户什么都没点，页面却会被遮罩锁住。
 *
 * 例外是 "route-data"：路由切换后，新页面为拿到数据而发起的第一个请求。
 * 这类任务由页面主动声明（startTask("route-data")），
 * 用来把「已到达新路由但数据还没到」的中间态继续留在遮罩后面，
 * 避免用户先看到一屏用默认值渲染的错误数据。它同样要求当次已在遮罩中
 * （见 startInitialRouteDataTask），所以不会把没点任何东西的用户锁住。
 */
const FULLSCREEN_TASK_LABELS = new Set(["initial-screen", "document", "navigation", "route-data"]);

/**
 * 导航任务的最长存活时间（同时也是遮罩的最长展示时间）。
 *
 * 超过该时间仍未切换到新路由，就认定这次换页失败：
 * 立即收起遮罩、弹出「加载失败，请重试」，并撤销这次导航。
 * 之所以要撤销而不是继续等：Next 的跳转一旦发起就收不回来，
 * 如果只是收起遮罩，用户稍后会毫无预兆地跳到那个页面，体验非常奇怪。
 * 撤销后浏览器会直接丢弃迟到的 RSC 响应，页面保持原样。
 */
const NAVIGATION_TIMEOUT_MS = 12000;

/**
 * 「路由首屏数据」任务的最长存活时间。
 * 数据请求万一悬挂（网络长时间无响应），遮罩不能一直挡着内容，
 * 超时后自动放行，让页面自己显示错误态。
 */
const ROUTE_DATA_FAILSAFE_MS = 12000;

/**
 * 超时之后的「硬拦截」窗口。
 *
 * 遮罩收起之后，那些已经被 Next 排进队列、来不及撤销的跳转可能仍在路上，
 * 这段时间内一律拒绝新的导航意图，避免页面在用户点了别的东西之后才突然跳走。
 * 窗口结束后自动解除（用户刷新、继续浏览都不受影响），
 * 因此点击被吞掉时，最多只会影响这 60 秒。
 */
export const NAVIGATION_BLOCK_WINDOW_MS = 60000;

/** 超时提示的状态。 */
type NavigationNotice =
  | { phase: "idle" }
  | { phase: "timed-out"; href: string };

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

function isCrossDocumentRoute(rawUrl: string | URL | null | undefined): boolean {
  if (!rawUrl) {
    return false;
  }

  try {
    return new URL(String(rawUrl), window.location.href).pathname === "/auth/signin";
  } catch {
    return false;
  }
}

function normalizeHref(rawUrl: string | URL): URL {
  return new URL(String(rawUrl), window.location.href);
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
  const [notice, setNotice] = useState<NavigationNotice>({ phase: "idle" });

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
  const navigationTokenRef = useRef<string | null>(null);
  const navigationTargetRef = useRef<string | null>(null);
  const routeDataTaskRef = useRef<EndTask | null>(null);
  const routeDataTimeoutRef = useRef<number | null>(null);
  /** 超时后的硬拦截定时器：到点自动解锁，避免用户被长时间卡在不响应的状态里。 */
  const blockWindowTimerRef = useRef<number | null>(null);
  // 供 startInitialRouteDataTask 同步判断「此刻是否已在遮罩中」。
  // 不能直接读 state：页面是在 effect 里发起首次请求的，
  // 此时闭包里的 fullscreenVisible 可能还没跟上最新的遮罩状态。
  const fullscreenVisibleRef = useRef(true);

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

    fullscreenVisibleRef.current = true;

    if (!fullscreenVisible) {
      fullScreenShownAtRef.current = window.performance.now();
      setFullscreenVisible(true);
    }
  }, [fullscreenVisible]);

  const clearNavigationTimeout = useCallback(() => {
    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  /**
   * 收掉当前导航任务。
   * @param reason - "completed" 等新页面绘制一帧后再收；"dropped" 立即收（导航被顶替或作废）
   */
  const releaseNavigationTask = useCallback((reason: "completed" | "dropped") => {
    clearNavigationTimeout();
    const task = navigationTaskRef.current;
    navigationTaskRef.current = null;
    navigationTokenRef.current = null;
    navigationTargetRef.current = null;
    if (!task) {
      return;
    }
    if (reason === "dropped") {
      task();
      return;
    }
    // 只等一帧，让新路由的首次绘制先落屏，避免进度条抢在内容之前消失。
    // 原先的双重 rAF 会把「导航任务仍占位」的窗口拉长到两帧以上，
    // 在高延迟环境下足以让用户的下一次点击撞进旧的导航任务。
    window.requestAnimationFrame(() => {
      task();
    });
  }, [clearNavigationTimeout]);

  /**
   * 超时作废当前这次导航：撤掉遮罩、丢弃迟到的路由切换、弹出失败提示。
   *
   * 这是「加载动画消失的那一刻就必须停止切页」的落点：
   * - cancelNavigation 会让还没执行的 router.push 变成空操作；
   * - 已经在路上的 RSC 响应因为对应的路由已被取消，也不会再把页面切过去；
   * - 之后的新点击一律拒绝，避免遮罩消失后页面又自己跳走。
   */
  const abortNavigation = useCallback(() => {
    const token = navigationTokenRef.current;
    const href = navigationTargetRef.current ?? "";

    if (navigationStartTimerRef.current !== null) {
      window.clearTimeout(navigationStartTimerRef.current);
      navigationStartTimerRef.current = null;
    }

    releaseNavigationTask("dropped");
    cancelNavigation(token);

    // 这次路由切换已经作废，不必再等新页面的首屏数据。
    const releaseRouteData = routeDataTaskRef.current;
    routeDataTaskRef.current = null;
    if (routeDataTimeoutRef.current !== null) {
      window.clearTimeout(routeDataTimeoutRef.current);
      routeDataTimeoutRef.current = null;
    }
    releaseRouteData?.();

    // 遮罩立刻收起，不再等待任何其它任务。
    if (fullScreenHideTimerRef.current !== null) {
      window.clearTimeout(fullScreenHideTimerRef.current);
      fullScreenHideTimerRef.current = null;
    }
    fullscreenVisibleRef.current = false;
    setFullscreenVisible(false);

    // 进入「硬拦截」窗口：这段时间内的点击一律不触发换页。
    writeLoadingCookie("hard");
    setNotice({ phase: "timed-out", href });
    if (blockWindowTimerRef.current !== null) {
      window.clearTimeout(blockWindowTimerRef.current);
    }
    blockWindowTimerRef.current = window.setTimeout(() => {
      blockWindowTimerRef.current = null;
      writeLoadingCookie("idle");
      setNotice((current) => (current.phase === "timed-out" ? { phase: "idle" } : current));
    }, NAVIGATION_BLOCK_WINDOW_MS);
  }, [releaseNavigationTask]);

  const beginNavigationTask = useCallback((href: string) => {
    // 站内跳转同样拉起全屏遮罩，作为「已响应」的反馈，
    // 并在跳转完成前挡住后续点击，防止连点导致并发导航。
    revealFullScreenOverlay();
    navigationTaskRef.current = startTask("navigation");
    navigationTargetRef.current = href;
    clearNavigationTimeout();
    navigationTimeoutRef.current = window.setTimeout(() => {
      navigationTimeoutRef.current = null;
      abortNavigation();
    }, NAVIGATION_TIMEOUT_MS);
  }, [abortNavigation, clearNavigationTimeout, revealFullScreenOverlay, startTask]);

  /**
   * 登记一次导航意图（点击链接、程序化跳转），由延迟回调统一拉起遮罩。
   *
   * 注意：本函数会被 history.pushState / replaceState 同步调用，
   * 而 Next 的 App Router 会在 useInsertionEffect 阶段同步调用 pushState。
   * 因此这里绝对不能同步触碰 React state（否则触发
   * "useInsertionEffect must not schedule updates"）。
   * 所有 startTask / 收尾动作都必须推迟到 setTimeout 回调里执行。
   */
  const scheduleNavigationTaskStart = useCallback((rawUrl?: string | URL | null) => {
    if (isCreatePostRoute(rawUrl) || isCrossDocumentRoute(rawUrl)) {
      return;
    }

    if (navigationStartTimerRef.current !== null) {
      window.clearTimeout(navigationStartTimerRef.current);
      navigationStartTimerRef.current = null;
    }

    navigationStartTimerRef.current = window.setTimeout(() => {
      navigationStartTimerRef.current = null;

      // 加载锁生效时（已经超时过一次），这次导航不允许落地，
      // 否则用户会看到遮罩消失之后页面又自己跳走。
      if (readLoadingState() === "hard") {
        return;
      }

      // 重复点击 / 连续跳转时，新的导航意图必须能够顶替旧的，
      // 否则旧的导航任务会一直占位，而用户的后一次点击照样被 Next 执行，
      // 最终表现为「URL 已经变了但页面还是旧页面」以及来回跳转。
      if (navigationTaskRef.current) {
        releaseNavigationTask("dropped");
      }

      beginNavigationTask(rawUrl ? String(rawUrl) : "");
    }, 0);
  }, [beginNavigationTask, releaseNavigationTask]);

  const finishNavigationTask = useCallback(() => {
    if (navigationStartTimerRef.current !== null) {
      window.clearTimeout(navigationStartTimerRef.current);
      navigationStartTimerRef.current = null;
    }

    if (!navigationTaskRef.current) {
      return;
    }
    releaseNavigationTask("completed");
  }, [releaseNavigationTask]);

  /**
   * 路由切换后，为新页面的「首屏数据请求」申请一个全屏任务。
   *
   * 动机：App Router 在路由段就绪时就会把新页面挂载出来，
   * 而页面自己拉数据的请求是随后才发起的。这两者之间的空档
   * 会让用户先看到一屏「用默认值渲染出来的、错误的数据」，
   * 接着请求发出、遮罩再次拉起，于是出现「闪一下 → 白屏 → 才是真数据」。
   *
   * 因此由页面在首次数据请求前主动声明这个任务，把中间态留在遮罩后面：
   * 只有当前确实处于全屏遮罩中（刚做完站内导航或首屏渲染）才会真正占位，
   * 后台刷新、数据补拉等场景不会把界面锁住。
   */
  const startInitialRouteDataTask = useCallback((): EndTask => {
    if (!fullscreenVisibleRef.current) {
      return () => {};
    }
    if (routeDataTaskRef.current) {
      return routeDataTaskRef.current;
    }

    const task = startTask("route-data");
    const release: EndTask = () => {
      if (routeDataTaskRef.current !== release) {
        return;
      }
      routeDataTaskRef.current = null;
      if (routeDataTimeoutRef.current !== null) {
        window.clearTimeout(routeDataTimeoutRef.current);
        routeDataTimeoutRef.current = null;
      }
      task();
    };

    routeDataTaskRef.current = release;
    if (routeDataTimeoutRef.current !== null) {
      window.clearTimeout(routeDataTimeoutRef.current);
    }
    routeDataTimeoutRef.current = window.setTimeout(() => {
      routeDataTimeoutRef.current = null;
      release();
    }, ROUTE_DATA_FAILSAFE_MS);

    return release;
  }, [startTask]);

  /**
   * 登记一次「用户主动点击的站内跳转」，拉起遮罩并启动超时计时。
   *
   * 由全局捕获阶段点击守卫和站内链接的 onClick 调用；
   * 重复登记会被忽略，保证一次点击只对应一个导航任务。
   */
  const beginNavigationIntent = useCallback((rawUrl: string | URL | null | undefined) => {
    if (!rawUrl) {
      return;
    }
    try {
      const url = normalizeHref(rawUrl);
      if (url.origin !== window.location.origin || isSamePath(url)) {
        return;
      }
      if (isCreatePostRoute(url) || isCrossDocumentRoute(url)) {
        return;
      }
    } catch {
      return;
    }
    if (readLoadingState() === "hard") {
      return;
    }
    if (navigationTaskRef.current || navigationStartTimerRef.current !== null) {
      return;
    }
    scheduleNavigationTaskStart(rawUrl);
  }, [scheduleNavigationTaskStart]);

  const onRouteDataStart = useCallback((href: string) => {
    if (href) {
      navigationTargetRef.current = href;
    }
    startInitialRouteDataTask();
  }, [startInitialRouteDataTask]);

  /**
   * 页面数据请求完成后调用：结束「路由首屏数据」任务。
   */
  const endInitialRouteData = useCallback(() => {
    routeDataTaskRef.current?.();
  }, []);

  /**
   * 真正执行一次程序化跳转。
   *
   * 与 Next 的软导航等价（地址栏先更新、再由客户端路由渲染），
   * 但多了一层准入：超时作废过的导航、以及票据被撤销的导航都不会落地。
   * 页面里的 router.push 统一被拦截到 `dsh:route-change` 事件上处理，
   * 这样即使调用方是个延时回调，也不会出现「遮罩已经消失才跳走」。
   */
  const runProgrammaticNavigation = useCallback((href: string, mode: "push" | "replace") => {
    if (readLoadingState() === "hard") {
      // 上一次导航已经超时作废，不再允许在用户不知情的情况下跳走。
      return;
    }
    const token = issueNavigationTicket();
    beginNavigationIntent(href);
    if (navigationTaskRef.current) {
      navigationTokenRef.current = token;
    }
    markNavigationCommitted(token);

    if (!isNavigationAllowed(token)) {
      return;
    }

    if (mode === "replace") {
      window.history.replaceState(null, "", href);
    } else {
      window.history.pushState(null, "", href);
    }
  }, [beginNavigationIntent]);

  const push = useCallback((href: string) => runProgrammaticNavigation(href, "push"), [runProgrammaticNavigation]);
  const replace = useCallback((href: string) => runProgrammaticNavigation(href, "replace"), [runProgrammaticNavigation]);

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

  /**
   * 同步加载锁 Cookie：遮罩可见 = 正在加载；遮罩收起后再根据是否处于硬拦截窗口决定。
   * 注意不能直接写 idle，否则会把超时后的 hard 锁覆盖掉。
   */
  useEffect(() => {
    if (fullscreenVisible) {
      writeLoadingCookie("loading");
      return;
    }
    if (notice.phase === "timed-out") {
      writeLoadingCookie("hard");
    }
  }, [fullscreenVisible, notice.phase]);

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
        scheduleNavigationTaskStart(url);
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

    const handleCancelled = () => {
      // 导航被撤销时顺手把遮罩收起，避免出现「已失败但还在转圈」。
      window.setTimeout(() => {
        if (navigationTaskRef.current) {
          releaseNavigationTask("dropped");
        }
      }, 0);
    };

    window.history.pushState = wrappedPushState;
    window.history.replaceState = wrappedReplaceState;
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener(NAVIGATION_CANCELLED_EVENT, handleCancelled as EventListener);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(NAVIGATION_CANCELLED_EVENT, handleCancelled as EventListener);
    };
  }, [releaseNavigationTask, routeKey, scheduleNavigationTaskStart]);

  useEffect(() => {
    finishNavigationTask();
  }, [finishNavigationTask, routeKey]);

  // 路由真的变了，说明换页成功，超时提示应当解除，加载锁也随之放开。
  useEffect(() => {
    setNotice((current) => (current.phase === "idle" ? current : { phase: "idle" }));
    if (blockWindowTimerRef.current !== null) {
      window.clearTimeout(blockWindowTimerRef.current);
      blockWindowTimerRef.current = null;
    }
    if (!fullscreenVisibleRef.current) {
      writeLoadingCookie("idle");
    }
  }, [routeKey]);

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
    if (notice.phase === "timed-out") {
      // 超时后遮罩要立即收起，交给下面的硬拦截状态接管。
      fullscreenVisibleRef.current = false;
      setFullscreenVisible(false);
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
      fullscreenVisibleRef.current = false;
      setFullscreenVisible(false);
      fullScreenHideTimerRef.current = null;
    }, Math.max(0, waitMs));
  }, [fullscreenPendingCount, fullscreenVisible, isHydrated, notice.phase, revealFullScreenOverlay]);

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
      if (routeDataTimeoutRef.current !== null) {
        window.clearTimeout(routeDataTimeoutRef.current);
      }
      if (blockWindowTimerRef.current !== null) {
        window.clearTimeout(blockWindowTimerRef.current);
      }
      if (initialScreenTaskRef.current) {
        const finishTask = initialScreenTaskRef.current;
        initialScreenTaskRef.current = null;
        finishTask();
      }
      navigationTaskRef.current = null;
      routeDataTaskRef.current = null;
    };
  }, []);

  const dismissNotice = useCallback(() => {
    setNotice({ phase: "idle" });
    if (blockWindowTimerRef.current !== null) {
      window.clearTimeout(blockWindowTimerRef.current);
      blockWindowTimerRef.current = null;
    }
    // 解除硬拦截，但保持当前页面不动；用户想再试可以刷新或重新点击。
    writeLoadingCookie("idle");
  }, []);

  const contextValue = useMemo<PageLoadProgressContextValue>(
    () => ({
      visible,
      progress,
      pendingCount,
      startTask,
      trackPromise,
      startInitialRouteDataTask,
      beginNavigationIntent,
      onRouteDataStart,
      push,
      replace,
      endInitialRouteData,
    }),
    [
      beginNavigationIntent,
      endInitialRouteData,
      onRouteDataStart,
      pendingCount,
      progress,
      push,
      replace,
      startInitialRouteDataTask,
      startTask,
      trackPromise,
      visible,
    ]
  );

  const handleRetry = useCallback(() => {
    if (notice.phase !== "timed-out") {
      return;
    }
    // 重新发起这次换页：先解除加载锁，再走一次完整的「遮罩 + 导航」流程。
    // 页面本身没有问题，用软导航重来比整页刷新体验更好。
    writeLoadingCookie("idle");
    const href = notice.href;
    setNotice({ phase: "idle" });
    if (!href) {
      window.location.reload();
      return;
    }
    runProgrammaticNavigation(href, "push");
  }, [notice, runProgrammaticNavigation]);

  return (
    <PageLoadProgressContext.Provider value={contextValue}>
      {children}
      <PageFullscreenLoadingOverlay
        visible={fullscreenVisible}
        notice={notice}
        onRetry={handleRetry}
        onDismiss={dismissNotice}
      />
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


const LOADER_SVG = (
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

function ThreeDotsLoader() {
  return LOADER_SVG;
}

/**
 * 全屏加载遮罩。
 *
 * 两种状态互斥出现：
 * - 加载中：转圈动画，接管指针事件；
 * - 加载失败：同样铺满全屏，明确告诉用户「这次没有跳过去」，
 *   并提供重试 / 关闭两个出口。
 *
 * 遮罩出现时主动接管指针事件（pointer-events-auto），这是有意的交互设计：
 * - 让用户看到「已点击、正在处理」的即时反馈；
 * - 在加载结束前拦截其余点击，避免连点造成并发导航与页面乱跳。
 * 因此不要把它改成 pointer-events-none，否则会重新引入连点竞争。
 */
function PageFullscreenLoadingOverlay({
  visible,
  notice,
  onRetry,
  onDismiss,
}: {
  visible: boolean;
  notice: NavigationNotice;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const timedOut = notice.phase === "timed-out";
  const active = visible || timedOut;

  return (
    <div
      role={timedOut ? "alertdialog" : undefined}
      aria-modal={timedOut ? true : undefined}
      aria-label={timedOut ? "加载失败" : undefined}
      aria-hidden={timedOut ? undefined : !visible}
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-white transition-opacity duration-200 ${
        active ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {timedOut ? (
        <div className="w-[min(92vw,26rem)] rounded-2xl border border-slate-200/80 bg-white px-7 py-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">加载失败，请重试</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            网络似乎不太稳定，页面没有加载出来。
            <br />
            这次跳转已经取消，页面停在原处。
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              关闭
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              重试
            </button>
          </div>
        </div>
      ) : (
        <div className="text-indigo-600">
          <ThreeDotsLoader />
        </div>
      )}
    </div>
  );
}
