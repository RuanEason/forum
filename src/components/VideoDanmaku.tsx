"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useSession } from "next-auth/react";
import { Send, Settings2 } from "lucide-react";

type DanmakuItem = {
  id: string;
  postId: string;
  userId: string | null;
  anonId: string | null;
  content: string;
  timeMs: number;
  type: "SCROLL";
  color: string;
  fontSize: number;
  createdAt: string;
};

type DanmakuGetResponse = {
  items?: DanmakuItem[];
};

type DanmakuPostResponse = {
  danmaku?: DanmakuItem;
};

type DensityOption = "LOW" | "MEDIUM" | "HIGH";
type AreaOption = "ONE_THIRD" | "ONE_HALF" | "TWO_THIRDS" | "FULL";

interface VideoDanmakuProps {
  postId: string;
  currentTime: number;
  duration: number;
  containerRef: RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  isPlaying: boolean;
  controlsVisible: boolean;
  composerOpen: boolean;
}

const DANMAKU_DURATION_MS = 7_600;
const POLL_INTERVAL_MS = 2_500;
const PREFETCH_AHEAD_MS = 90_000;
const LOOKBACK_MS = 30_000;
const SEEK_SYNC_THRESHOLD_MS = 1_200;
const SPAWN_AHEAD_MS = 220;
const DEFAULT_DANMAKU_COLOR = "#FFFFFF";
const DEFAULT_FONT_SIZE = 24;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 36;
const DEFAULT_LANE_HEIGHT = 32;
const MOBILE_INLINE_LANE_HEIGHT = 26;
const MOBILE_INLINE_PLAYER_MAX_WIDTH_PX = 640;
const MOBILE_INLINE_FONT_SCALE_BASE_WIDTH = 540;
const MOBILE_INLINE_FONT_SCALE_MIN = 0.62;
const MOBILE_INLINE_FONT_SCALE_MAX = 0.78;
const MOBILE_INLINE_MIN_FONT_SIZE = 12;
const MOBILE_INLINE_MAX_FONT_SIZE = 24;

const densityMultiplierMap: Record<DensityOption, number> = {
  LOW: 0.6,
  MEDIUM: 1,
  HIGH: 1.5,
};

const areaRatioMap: Record<AreaOption, number> = {
  ONE_THIRD: 1 / 3,
  ONE_HALF: 1 / 2,
  TWO_THIRDS: 2 / 3,
  FULL: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashToPositiveInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mergeDanmakus(base: DanmakuItem[], incoming: DanmakuItem[]): DanmakuItem[] {
  const map = new Map<string, DanmakuItem>();

  for (const item of base) {
    map.set(item.id, item);
  }

  for (const item of incoming) {
    map.set(item.id, item);
  }

  return [...map.values()].sort((a, b) => {
    if (a.timeMs !== b.timeMs) {
      return a.timeMs - b.timeMs;
    }

    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);
    return aTime - bTime;
  });
}

type ActiveDanmaku = DanmakuItem & {
  top: number;
  fontSizePx: number;
  travelDistancePx: number;
  elapsedMs: number;
  colorValue: string;
};

function formatDanmakuCount(value: number): string {
  if (value < 10_000) return `${value}`;
  return `${(value / 10_000).toFixed(1).replace(/\.0$/, "")}万`;
}

export default function VideoDanmaku({
  postId,
  currentTime,
  duration,
  containerRef,
  isFullscreen,
  isPlaying,
  controlsVisible,
  composerOpen,
}: VideoDanmakuProps) {
  const { data: session } = useSession();
  const isLoggedIn = Boolean((session?.user as { id?: string } | undefined)?.id);

  const [enabled, setEnabled] = useState(true);
  const [density, setDensity] = useState<DensityOption>("MEDIUM");
  const [area, setArea] = useState<AreaOption>("ONE_THIRD");
  const [color, setColor] = useState(DEFAULT_DANMAKU_COLOR);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [items, setItems] = useState<DanmakuItem[]>([]);
  const [activeDanmakus, setActiveDanmakus] = useState<ActiveDanmaku[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const currentTimeMsRef = useRef(0);
  const pollLockedRef = useRef(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const emittedIdsRef = useRef<Set<string>>(new Set());
  const lastNowMsRef = useRef(0);

  useEffect(() => {
    currentTimeMsRef.current = Math.max(0, Math.round(currentTime * 1000));
  }, [currentTime]);

  useEffect(() => {
    setItems([]);
    setActiveDanmakus([]);
    emittedIdsRef.current.clear();
    lastNowMsRef.current = 0;
  }, [postId]);

  useEffect(() => {
    if (isLoggedIn) return;
    setColor(DEFAULT_DANMAKU_COLOR);
  }, [isLoggedIn]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;

    const syncSize = () => {
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  useEffect(() => {
    if (!settingsOpen) return undefined;

    const closeOnOutside = (event: PointerEvent) => {
      if (!settingsRef.current || settingsRef.current.contains(event.target as Node)) return;
      setSettingsOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutside);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutside);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (isFullscreen && composerOpen) return;
    setSettingsOpen(false);
  }, [composerOpen, isFullscreen]);

  const fetchDanmakus = useCallback(async () => {
    if (pollLockedRef.current) return;
    pollLockedRef.current = true;

    try {
      const currentMs = currentTimeMsRef.current;
      const fromMs = Math.max(0, currentMs - LOOKBACK_MS);
      const durationMs = duration > 0 ? Math.round(duration * 1000) : currentMs + PREFETCH_AHEAD_MS;
      const toMs = Math.min(durationMs + LOOKBACK_MS, currentMs + PREFETCH_AHEAD_MS);
      const targetToMs = Math.max(fromMs + 1_000, toMs);

      const query = new URLSearchParams({
        fromMs: String(fromMs),
        toMs: String(targetToMs),
        limit: "500",
      });

      const response = await fetch(`/api/post/${postId}/danmaku?${query.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = (await response.json()) as DanmakuGetResponse;
      if (!Array.isArray(data.items) || data.items.length === 0) return;

      setItems((previous) => mergeDanmakus(previous, data.items || []));
    } catch (error) {
      console.error("Danmaku polling error:", error);
    } finally {
      pollLockedRef.current = false;
    }
  }, [duration, postId]);

  useEffect(() => {
    void fetchDanmakus();
    const timer = setInterval(() => {
      void fetchDanmakus();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [fetchDanmakus]);

  const nowMs = Math.max(0, Math.round(currentTime * 1000));
  const areaRatio = areaRatioMap[area];
  const layerHeight = containerSize.height * areaRatio;
  const isCompactInlinePlayer = !isFullscreen
    && containerSize.width > 0
    && containerSize.width <= MOBILE_INLINE_PLAYER_MAX_WIDTH_PX;
  const compactFontScale = isCompactInlinePlayer
    ? clamp(
      containerSize.width / MOBILE_INLINE_FONT_SCALE_BASE_WIDTH,
      MOBILE_INLINE_FONT_SCALE_MIN,
      MOBILE_INLINE_FONT_SCALE_MAX,
    )
    : 1;
  const laneHeight = isCompactInlinePlayer ? MOBILE_INLINE_LANE_HEIGHT : DEFAULT_LANE_HEIGHT;
  const laneCount = Math.max(1, Math.floor(layerHeight / laneHeight));
  const densityMultiplier = densityMultiplierMap[density];
  const maxVisible = Math.max(6, Math.floor(laneCount * 2 * densityMultiplier));

  const createActiveDanmaku = useCallback((item: DanmakuItem, elapsedMs: number): ActiveDanmaku => {
    const baseFontSize = clamp(item.fontSize || DEFAULT_FONT_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE);
    const fontSize = isCompactInlinePlayer
      ? clamp(
        Math.round(baseFontSize * compactFontScale),
        MOBILE_INLINE_MIN_FONT_SIZE,
        MOBILE_INLINE_MAX_FONT_SIZE,
      )
      : baseFontSize;
    const laneIndex = hashToPositiveInt(item.id) % laneCount;
    const top = laneIndex * laneHeight + 4;
    const approxWidth = Math.max(120, item.content.length * fontSize * 0.7 + 40);
    const travelDistancePx = containerSize.width + approxWidth + 24;

    return {
      ...item,
      top,
      fontSizePx: fontSize,
      travelDistancePx,
      elapsedMs: clamp(Math.round(elapsedMs), 0, DANMAKU_DURATION_MS),
      colorValue: item.color || DEFAULT_DANMAKU_COLOR,
    };
  }, [compactFontScale, containerSize.width, isCompactInlinePlayer, laneCount, laneHeight]);

  useEffect(() => {
    if (!enabled || containerSize.width <= 0 || layerHeight <= 0) {
      emittedIdsRef.current.clear();
      setActiveDanmakus([]);
      lastNowMsRef.current = nowMs;
      return;
    }

    const previousNowMs = lastNowMsRef.current;
    const deltaMs = nowMs - previousNowMs;
    const isSeeking = previousNowMs > 0 && (deltaMs < -200 || Math.abs(deltaMs) > SEEK_SYNC_THRESHOLD_MS);

    if (isSeeking) {
      emittedIdsRef.current.clear();
      const synced = items
        .filter((item) => nowMs >= item.timeMs && nowMs <= item.timeMs + DANMAKU_DURATION_MS)
        .sort((a, b) => a.timeMs - b.timeMs)
        .slice(-maxVisible)
        .map((item) => {
          emittedIdsRef.current.add(item.id);
          return createActiveDanmaku(item, nowMs - item.timeMs);
        });

      setActiveDanmakus(synced);
      lastNowMsRef.current = nowMs;
      return;
    }

    const previousWindowStart = previousNowMs > 0 ? previousNowMs - 120 : nowMs - 220;
    const dueItems = items
      .filter((item) => {
        if (emittedIdsRef.current.has(item.id)) return false;
        if (nowMs < item.timeMs || nowMs > item.timeMs + DANMAKU_DURATION_MS) return false;
        return item.timeMs <= nowMs + SPAWN_AHEAD_MS && item.timeMs >= previousWindowStart - LOOKBACK_MS;
      })
      .sort((a, b) => a.timeMs - b.timeMs);

    setActiveDanmakus((previous) => {
      const keep = previous.filter((item) => nowMs <= item.timeMs + DANMAKU_DURATION_MS);
      const next = [...keep];

      for (const item of dueItems) {
        emittedIdsRef.current.add(item.id);
        next.push(createActiveDanmaku(item, nowMs - item.timeMs));
      }

      next.sort((a, b) => a.timeMs - b.timeMs);
      if (next.length <= maxVisible) return next;
      return next.slice(-maxVisible);
    });

    lastNowMsRef.current = nowMs;
  }, [createActiveDanmaku, enabled, items, layerHeight, maxVisible, nowMs, containerSize.width]);

  const visibleDanmakus = useMemo(() => {
    if (!enabled || containerSize.width <= 0 || layerHeight <= 0) {
      return [] as Array<ActiveDanmaku & { style: CSSProperties }>;
    }

    return activeDanmakus.map((item) => {
      const style = {
        top: `${item.top}px`,
        left: `${containerSize.width}px`,
        color: item.colorValue,
        fontSize: `${item.fontSizePx}px`,
        animationName: "danmaku-scroll",
        animationDuration: `${DANMAKU_DURATION_MS}ms`,
        animationTimingFunction: "linear",
        animationFillMode: "forwards",
        animationDelay: `-${item.elapsedMs}ms`,
        animationPlayState: isPlaying ? "running" : "paused",
        transform: "translate3d(0, 0, 0)",
        willChange: "transform",
        "--danmaku-distance": `${item.travelDistancePx}px`,
      } as CSSProperties;

      return { ...item, style };
    });
  }, [activeDanmakus, containerSize.width, enabled, isPlaying, layerHeight]);

  const sendDanmaku = useCallback(async () => {
    const normalizedContent = inputValue.trim();
    if (!normalizedContent || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const response = await fetch(`/api/post/${postId}/danmaku`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: normalizedContent,
          timeMs: nowMs,
          type: "SCROLL",
          color: isLoggedIn ? color : DEFAULT_DANMAKU_COLOR,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setSendError("发送过快，请等待 3 秒后再试");
          return;
        }

        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSendError(errorPayload?.error || "发送失败，请稍后重试");
        return;
      }

      const data = (await response.json()) as DanmakuPostResponse;
      if (data.danmaku) {
        setItems((previous) => mergeDanmakus(previous, [data.danmaku as DanmakuItem]));
      }
      setInputValue("");
    } catch (error) {
      console.error("Send danmaku error:", error);
      setSendError("发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  }, [color, inputValue, isLoggedIn, nowMs, postId, sending]);

  const panelVisible = !isFullscreen || (controlsVisible && composerOpen);
  const wrapperClass = isFullscreen
    ? `absolute inset-x-3 bottom-[92px] z-40 transition-all duration-200 ${panelVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`
    : "absolute inset-x-0 -bottom-[78px] z-40";
  const panelClass = isFullscreen
    ? "rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-white backdrop-blur-md"
    : "rounded-xl border border-gray-200 bg-zinc-100/95 px-3 py-2 text-gray-800 shadow-sm";
  const subTextClass = isFullscreen ? "text-white/70" : "text-gray-500";
  const inputClass = isFullscreen
    ? "h-9 min-w-0 flex-1 rounded-md border border-white/25 bg-white/10 px-3 text-sm text-white placeholder:text-white/60 outline-none transition focus:border-cyan-300"
    : "h-9 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-cyan-500";
  const settingsPanelClass = isFullscreen
    ? "absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-white/20 bg-black/85 p-3 text-xs text-white shadow-xl backdrop-blur-md"
    : "absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg";
  const selectClass = isFullscreen
    ? "h-8 rounded-md border border-white/25 bg-black/30 px-2 text-xs text-white outline-none"
    : "h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-800 outline-none";

  return (
    <>
      <div
        className="pointer-events-none absolute left-0 top-0 z-20 w-full overflow-hidden"
        style={{ height: `${layerHeight}px` }}
      >
        {visibleDanmakus.map((item) => (
          <p
            key={item.id}
            className="absolute whitespace-nowrap font-semibold leading-none [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]"
            style={item.style}
          >
            {item.content}
          </p>
        ))}
      </div>

      <div
        className={wrapperClass}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={panelClass}>
          <div className="flex items-center gap-2">
            <span className={`hidden text-xs md:inline ${subTextClass}`}>
              {formatDanmakuCount(items.length)} 条弹幕
            </span>

            <button
              type="button"
              onClick={() => setEnabled((value) => !value)}
              className={`h-8 shrink-0 rounded-md px-2 text-xs font-medium transition ${
                enabled
                  ? "bg-cyan-500 text-white hover:bg-cyan-400"
                  : isFullscreen
                    ? "bg-white/15 text-white/85 hover:bg-white/25"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {enabled ? "弹幕开" : "弹幕关"}
            </button>

            <div ref={settingsRef} className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((value) => !value)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                  isFullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                aria-label="弹幕设置"
                title="弹幕设置"
              >
                <Settings2 className="h-4 w-4" />
              </button>

              {settingsOpen && (
                <div className={settingsPanelClass}>
                  <p className={`mb-2 text-[11px] ${subTextClass}`}>弹幕设置</p>

                  <label className="mb-2 flex items-center justify-between gap-3">
                    <span>密度</span>
                    <select
                      value={density}
                      onChange={(event) => setDensity(event.currentTarget.value as DensityOption)}
                      className={selectClass}
                    >
                      <option value="LOW">稀疏</option>
                      <option value="MEDIUM">标准</option>
                      <option value="HIGH">密集</option>
                    </select>
                  </label>

                  <label className="mb-2 flex items-center justify-between gap-3">
                    <span>区域</span>
                    <select
                      value={area}
                      onChange={(event) => setArea(event.currentTarget.value as AreaOption)}
                      className={selectClass}
                    >
                      <option value="ONE_THIRD">1/3 屏</option>
                      <option value="ONE_HALF">1/2 屏</option>
                      <option value="TWO_THIRDS">2/3 屏</option>
                      <option value="FULL">全屏</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between gap-3">
                    <span className={!isLoggedIn ? "opacity-70" : ""}>颜色</span>
                    <input
                      type="color"
                      value={isLoggedIn ? color : DEFAULT_DANMAKU_COLOR}
                      onChange={(event) => setColor(event.currentTarget.value.toUpperCase())}
                      disabled={!isLoggedIn}
                      title={isLoggedIn ? "弹幕颜色" : "游客仅可发送白色弹幕"}
                      className="h-8 w-10 cursor-pointer rounded border border-white/25 bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </label>
                </div>
              )}
            </div>

            <input
              type="text"
              value={inputValue}
              onChange={(event) => {
                if (event.currentTarget.value.length <= 50) {
                  setInputValue(event.currentTarget.value);
                }
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                void sendDanmaku();
              }}
              placeholder="发个友善的弹幕吧我(～﹃～)~zZ"
              className={inputClass}
            />

            <button
              type="button"
              disabled={sending || inputValue.trim().length === 0}
              onClick={() => {
                void sendDanmaku();
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md bg-cyan-500 px-3 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              发送
            </button>
          </div>

          {!isLoggedIn && (
            <p className={`mt-1 text-[11px] ${subTextClass}`}>游客仅支持发送白色滚动弹幕</p>
          )}
          {sendError && (
            <p className={`mt-1 text-[11px] ${isFullscreen ? "text-rose-300" : "text-rose-600"}`}>
              {sendError}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes danmaku-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(calc(var(--danmaku-distance) * -1), 0, 0);
          }
        }
      `}</style>
    </>
  );
}
