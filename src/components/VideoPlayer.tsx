"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings2,
  Volume2,
  VolumeX,
} from "lucide-react";

type QualityOption = {
  id: string;
  label: string;
  levelIndex?: number;
  url?: string;
  height?: number;
  bitrate?: number;
  isAuto?: boolean;
};

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  title?: string | null;
}

const FAST_FORWARD_SECONDS = 5;
const LONG_PRESS_MS = 220;
const BOOST_RATE = 2;

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";

  const seconds = Math.floor(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input"
    || tag === "textarea"
    || tag === "select"
    || target.isContentEditable
  );
}

function parseMasterPlaylist(content: string, masterUrl: string): QualityOption[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const options: QualityOption[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("#EXT-X-STREAM-INF:")) continue;

    const attrs = line.slice("#EXT-X-STREAM-INF:".length);
    const uri = lines[i + 1];
    if (!uri || uri.startsWith("#")) continue;

    const heightMatch = attrs.match(/RESOLUTION=\d+x(\d+)/i);
    const bitrateMatch = attrs.match(/BANDWIDTH=(\d+)/i);

    const height = heightMatch ? Number.parseInt(heightMatch[1], 10) : undefined;
    const bitrate = bitrateMatch ? Number.parseInt(bitrateMatch[1], 10) : undefined;
    const resolved = new URL(uri, masterUrl).toString();

    const labelParts = [];
    if (height) labelParts.push(`${height}p`);
    if (bitrate) labelParts.push(`${Math.round(bitrate / 1000)}kbps`);

    options.push({
      id: `native-${options.length}`,
      label: labelParts.join(" · ") || `清晰度 ${options.length + 1}`,
      url: resolved,
      height,
      bitrate,
    });
  }

  const uniqueByUrl = new Map<string, QualityOption>();
  for (const option of options) {
    if (!option.url) continue;
    if (!uniqueByUrl.has(option.url)) {
      uniqueByUrl.set(option.url, option);
    }
  }

  return [...uniqueByUrl.values()].sort(
    (a, b) => (b.height ?? 0) - (a.height ?? 0) || (b.bitrate ?? 0) - (a.bitrate ?? 0),
  );
}

const DEFAULT_QUALITY_OPTION: QualityOption = {
  id: "auto",
  label: "自动",
  isAuto: true,
};

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const rightKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightKeyPressedRef = useRef(false);
  const rightKeyLongPressRef = useRef(false);
  const touchBoostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchBoostingRef = useRef(false);
  const suppressNextClickRef = useRef(false);

  const boostingRef = useRef(false);
  const previousPlaybackRateRef = useRef(1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([DEFAULT_QUALITY_OPTION]);
  const [selectedQualityId, setSelectedQualityId] = useState(DEFAULT_QUALITY_OPTION.id);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);

  const selectedQualityLabel = useMemo(
    () => qualityOptions.find((option) => option.id === selectedQualityId)?.label ?? DEFAULT_QUALITY_OPTION.label,
    [qualityOptions, selectedQualityId],
  );

  const clearRightKeyTimer = useCallback(() => {
    if (!rightKeyTimerRef.current) return;
    clearTimeout(rightKeyTimerRef.current);
    rightKeyTimerRef.current = null;
  }, []);

  const clearTouchBoostTimer = useCallback(() => {
    if (!touchBoostTimerRef.current) return;
    clearTimeout(touchBoostTimerRef.current);
    touchBoostTimerRef.current = null;
  }, []);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;

    const clamped = Math.min(Math.max(time, 0), video.duration);
    video.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    seekTo(video.currentTime + delta);
  }, [seekTo]);

  const startBoost = useCallback(() => {
    const video = videoRef.current;
    if (!video || boostingRef.current) return;

    previousPlaybackRateRef.current = video.playbackRate || 1;
    video.playbackRate = BOOST_RATE;
    boostingRef.current = true;
    setIsBoosting(true);
  }, []);

  const stopBoost = useCallback(() => {
    const video = videoRef.current;
    if (!video || !boostingRef.current) return;

    video.playbackRate = previousPlaybackRateRef.current || 1;
    boostingRef.current = false;
    setIsBoosting(false);
  }, []);

  const endTouchBoost = useCallback(() => {
    clearTouchBoostTimer();
    if (!touchBoostingRef.current) return;

    touchBoostingRef.current = false;
    stopBoost();
  }, [clearTouchBoostTimer, stopBoost]);

  const releaseRightKey = useCallback((shouldSeekForward: boolean) => {
    clearRightKeyTimer();

    if (!rightKeyPressedRef.current) return;
    rightKeyPressedRef.current = false;

    if (rightKeyLongPressRef.current) {
      rightKeyLongPressRef.current = false;
      stopBoost();
      return;
    }

    if (shouldSeekForward) {
      seekBy(FAST_FORWARD_SECONDS);
    }
  }, [clearRightKeyTimer, seekBy, stopBoost]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((nextVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen().catch(() => undefined);
      return;
    }

    await document.exitFullscreen().catch(() => undefined);
  }, []);

  const applyQualityOption = useCallback((option: QualityOption) => {
    const video = videoRef.current;
    if (!video) return;

    const hls = hlsRef.current;
    if (hls) {
      if (option.isAuto) {
        hls.currentLevel = -1;
      } else if (typeof option.levelIndex === "number") {
        hls.currentLevel = option.levelIndex;
        hls.nextLevel = option.levelIndex;
      }

      setSelectedQualityId(option.id);
      setQualityMenuOpen(false);
      return;
    }

    const targetSrc = option.isAuto ? src : option.url;
    if (!targetSrc) return;

    const currentPosition = video.currentTime;
    const shouldResume = !video.paused;

    video.src = targetSrc;
    video.load();
    video.addEventListener(
      "loadedmetadata",
      () => {
        if (Number.isFinite(currentPosition)) {
          video.currentTime = currentPosition;
        }
        if (shouldResume) {
          void video.play().catch(() => undefined);
        }
      },
      { once: true },
    );

    setSelectedQualityId(option.id);
    setQualityMenuOpen(false);
  }, [src]);

  const loadNativeQualityOptions = useCallback(async (masterUrl: string) => {
    try {
      const response = await fetch(masterUrl, { cache: "no-store" });
      if (!response.ok) return;

      const manifest = await response.text();
      const options = parseMasterPlaylist(manifest, masterUrl);
      if (options.length === 0) return;

      setQualityOptions([DEFAULT_QUALITY_OPTION, ...options]);
    } catch {
      // Ignore parsing failures; playback can still continue with default source.
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setErrorText(null);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedTime(0);
    setQualityOptions([DEFAULT_QUALITY_OPTION]);
    setSelectedQualityId(DEFAULT_QUALITY_OPTION.id);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const options = hls.levels
          .map((level, levelIndex) => {
            const height = level.height || undefined;
            const bitrate = level.bitrate || undefined;
            const parts = [];
            if (height) parts.push(`${height}p`);
            if (bitrate) parts.push(`${Math.round(bitrate / 1000)}kbps`);

            return {
              id: `hls-${levelIndex}`,
              label: parts.join(" · ") || `清晰度 ${levelIndex + 1}`,
              levelIndex,
              height,
              bitrate,
            } satisfies QualityOption;
          })
          .sort(
            (a, b) => (b.height ?? 0) - (a.height ?? 0) || (b.bitrate ?? 0) - (a.bitrate ?? 0),
          );

        if (options.length > 0) {
          setQualityOptions([DEFAULT_QUALITY_OPTION, ...options]);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          const responseCode = typeof data.response?.code === "number" ? data.response.code : null;
          const networkDetails = String(data.details || "");
          const looksLikeCorsIssue = responseCode === 0
            || networkDetails.includes("manifestLoadError")
            || networkDetails.includes("levelLoadError")
            || networkDetails.includes("fragLoadError");

          if (looksLikeCorsIssue) {
            setErrorText("视频加载失败，可能是 CDN 跨域配置或播放地址异常");
            return;
          }

          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        setErrorText("视频加载失败，请刷新重试");
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      void loadNativeQualityOptions(src);
    } else {
      video.src = src;
      setErrorText("当前浏览器不支持该视频格式");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [loadNativeQualityOptions, src]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setCurrentTime(video.currentTime || 0);
    };
    const handleDurationChange = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };
    const handleProgress = () => {
      try {
        if (video.buffered.length === 0) return;
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      } catch {
        // Ignore buffered range access errors.
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlay = () => setIsReady(true);
    const handlePlaying = () => setIsReady(true);
    const handleWaiting = () => setIsReady(false);
    const handleVolume = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleError = () => {
      setErrorText("视频加载失败，请刷新重试");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("volumechange", handleVolume);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("volumechange", handleVolume);
      video.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;
      if (!videoRef.current) return;

      if (event.key === "ArrowLeft") {
        if (event.repeat) return;
        event.preventDefault();
        seekBy(-FAST_FORWARD_SECONDS);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (event.repeat || rightKeyPressedRef.current) return;

        rightKeyPressedRef.current = true;
        rightKeyLongPressRef.current = false;
        clearRightKeyTimer();

        rightKeyTimerRef.current = setTimeout(() => {
          rightKeyLongPressRef.current = true;
          startBoost();
        }, LONG_PRESS_MS);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight") return;
      event.preventDefault();
      releaseRightKey(true);
    };

    const handleWindowBlur = () => {
      releaseRightKey(false);
      endTouchBoost();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [clearRightKeyTimer, endTouchBoost, releaseRightKey, seekBy, startBoost]);

  useEffect(() => {
    if (!qualityMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!qualityMenuRef.current) return;
      if (qualityMenuRef.current.contains(event.target as Node)) return;
      setQualityMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [qualityMenuOpen]);

  useEffect(() => {
    return () => {
      clearRightKeyTimer();
      clearTouchBoostTimer();
      stopBoost();
    };
  }, [clearRightKeyTimer, clearTouchBoostTimer, stopBoost]);

  const playedPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPercent = duration > 0 ? Math.min(100, (bufferedTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg bg-black aspect-video border border-gray-200"
    >
      <div
        className="absolute inset-0 z-10"
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          if (!containerRef.current) return;

          const rect = containerRef.current.getBoundingClientRect();
          const onRightHalf = event.clientX >= rect.left + rect.width / 2;
          if (!onRightHalf) return;

          clearTouchBoostTimer();
          touchBoostTimerRef.current = setTimeout(() => {
            touchBoostingRef.current = true;
            suppressNextClickRef.current = true;
            startBoost();
          }, LONG_PRESS_MS);
        }}
        onPointerUp={endTouchBoost}
        onPointerCancel={endTouchBoost}
        onPointerLeave={endTouchBoost}
        onClick={() => {
          if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
          }
          togglePlay();
        }}
      />

      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        preload="metadata"
        poster={poster || undefined}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/50" />

      {isBoosting && (
        <div className="absolute right-3 top-3 z-30 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
          2x 倍速
        </div>
      )}

      {!isReady && !errorText && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-sm text-white/80">
          视频加载中...
        </div>
      )}

      {errorText && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4 text-center text-sm text-white/90">
          {errorText}
        </div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 pt-8 text-white"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-white/35"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-cyan-400"
            style={{ width: `${playedPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            onChange={(event) => {
              seekTo(Number(event.currentTarget.value));
            }}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent accent-cyan-400"
            aria-label="播放进度"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 transition-colors"
            aria-label={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <div className="text-sm tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-sm font-medium text-white/90">
              {title || "视频帖子"}
            </p>
          </div>

          <div ref={qualityMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setQualityMenuOpen((open) => !open)}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-black/35 px-2 text-xs hover:bg-black/55 transition-colors"
              aria-label="切换清晰度"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>{selectedQualityLabel}</span>
            </button>

            {qualityMenuOpen && (
              <div className="absolute bottom-10 right-0 min-w-[120px] overflow-hidden rounded-md border border-white/20 bg-black/85 py-1 backdrop-blur">
                {qualityOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyQualityOption(option)}
                    className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                      option.id === selectedQualityId
                        ? "bg-cyan-500/25 text-cyan-200"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 transition-colors"
            aria-label={isMuted ? "取消静音" : "静音"}
          >
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <div className="hidden w-20 md:block">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(event) => handleVolumeChange(Number(event.currentTarget.value))}
              className="h-1.5 w-full cursor-pointer accent-cyan-400"
              aria-label="音量"
            />
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 transition-colors"
            aria-label={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
