"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type TrackInfo = {
  title: string;
  artist: string;
  cover: string;
};

type RandomTrack = {
  index: number;
  extension: "flac" | "mp3";
  url: string;
};

type MetadataResponse = {
  title?: string;
  artist?: string;
  cover?: string;
};

const MUSIC_BASE_URL = "https://cdn.zyg2024.top/music";

const DEFAULT_TRACK_INFO: TrackInfo = {
  title: "Qingming Spring Echo",
  artist: "Slept Music Project",
  cover: "https://cdn.zyg2024.top/act/musicback.png",
};

function pickRandomTrack(): RandomTrack {
  const index = Math.floor(Math.random() * 4) + 1;
  const extension = index === 1 || index === 3 ? "flac" : "mp3";

  return {
    index,
    extension,
    url: `${MUSIC_BASE_URL}/${index}.${extension}`,
  };
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";

  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = total % 60;

  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [trackInfo, setTrackInfo] = useState<TrackInfo>(DEFAULT_TRACK_INFO);
  const [randomTrackInfo, setRandomTrackInfo] = useState<RandomTrack | null>(
    null
  );
  const [musicSrc, setMusicSrc] = useState("");
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isPlay, setIsPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekValue, setSeekValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const displayedTime = isSeeking ? seekValue : currentTime;
  const progressPercent =
    duration > 0 ? Math.min((displayedTime / duration) * 100, 100) : 0;

  useEffect(() => {
    const nextTrack = pickRandomTrack();
    setRandomTrackInfo(nextTrack);
    setMusicSrc(nextTrack.url);
    setCurrentTime(0);
    setSeekValue(0);
    setDuration(0);
  }, []);

  useEffect(() => {
    if (!randomTrackInfo) return;

    let isCancelled = false;
    const fallbackTitle = `Track ${randomTrackInfo.index}`;

    const loadTrackMetadata = async () => {
      setIsMetaLoading(true);

      try {
        const response = await fetch(
          `/api/music/metadata?index=${randomTrackInfo.index}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`metadata api failed: ${response.status}`);
        }

        const data = (await response.json()) as MetadataResponse;
        if (isCancelled) return;

        setTrackInfo({
          title: data.title?.trim() || fallbackTitle,
          artist: data.artist?.trim() || DEFAULT_TRACK_INFO.artist,
          cover: data.cover || DEFAULT_TRACK_INFO.cover,
        });
      } catch {
        if (isCancelled) return;

        setTrackInfo({
          title: fallbackTitle,
          artist: DEFAULT_TRACK_INFO.artist,
          cover: DEFAULT_TRACK_INFO.cover,
        });
      } finally {
        if (!isCancelled) {
          setIsMetaLoading(false);
        }
      }
    };

    void loadTrackMetadata();

    return () => {
      isCancelled = true;
    };
  }, [randomTrackInfo]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !musicSrc) return;

    if (isPlay) {
      audio.pause();
      setIsPlay(false);
      return;
    }

    try {
      await audio.play();
      setIsPlay(true);
    } catch {
      setIsPlay(false);
    }
  };

  const handleSeekChange = (value: number) => {
    setSeekValue(value);
    setIsSeeking(true);
  };

  const handleSeekCommit = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value;
    setCurrentTime(value);
    setSeekValue(value);
    setIsSeeking(false);
  };

  return (
    <section className="w-full px-4 py-8 sm:px-8">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_25px_65px_-30px_rgba(2,6,23,0.9)]">
        <Image
          src={DEFAULT_TRACK_INFO.cover}
          alt="Player background"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 960px"
        />
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(9,12,28,0.86)_0%,rgba(13,48,40,0.76)_42%,rgba(40,19,8,0.68)_100%)]" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

        <div className="relative grid gap-6 p-6 sm:grid-cols-[170px_1fr] sm:gap-8 sm:p-8 md:grid-cols-[220px_1fr] md:p-10">
          <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-3xl border border-white/30 shadow-2xl md:w-52">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${trackInfo.cover})` }}
              aria-label="Track cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_40%,rgba(255,255,255,0.24)_100%)]" />
          </div>

          <div className="space-y-5 text-white">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">
                Qingming Player
              </p>
              <h2 className="font-[family-name:'Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-2xl font-semibold tracking-tight sm:text-3xl">
                {trackInfo.title}
              </h2>
              <p className="text-sm text-white/75">{trackInfo.artist}</p>
              <p className="text-xs text-white/65">
                {randomTrackInfo
                  ? `Source: ${randomTrackInfo.index}.${randomTrackInfo.extension}${isMetaLoading ? " - reading metadata..." : ""}`
                  : "Selecting random source..."}
              </p>
            </div>

            <audio
              ref={audioRef}
              src={musicSrc || undefined}
              onPlay={() => setIsPlay(true)}
              onPause={() => setIsPlay(false)}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                setCurrentTime(t);
                if (!isSeeking) setSeekValue(t);
              }}
              onLoadedMetadata={(e) => {
                const total = e.currentTarget.duration || 0;
                setDuration(total);
              }}
              onEnded={() => setIsPlay(false)}
            />

            <div className="space-y-2">
              <div className="relative">
                <div
                  className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-300"
                  style={{ width: `${progressPercent}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={displayedTime}
                  onChange={(e) => handleSeekChange(Number(e.target.value))}
                  onMouseUp={(e) => handleSeekCommit(Number(e.currentTarget.value))}
                  onTouchEnd={(e) => handleSeekCommit(Number(e.currentTarget.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-emerald-300"
                />
              </div>

              <div className="flex items-center justify-between text-xs tabular-nums text-white/75">
                <span>{formatTime(displayedTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                disabled={!musicSrc}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-xl transition hover:scale-[1.03] hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={isPlay ? "Pause playback" : "Start playback"}
              >
                {isPlay ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5h3v14H8zm5 0h3v14h-3z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="rounded-full border border-white/25 bg-black/15 px-4 py-2 text-xs tracking-[0.2em] text-emerald-100/85">
                STEREO
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
