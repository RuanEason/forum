"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageCircle,
  Send,
  Share2,
  Smartphone,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ShareTab = "link" | "image";
type ShareChannel = "copy" | "wechat" | "qq" | "system" | "poster" | "download_poster";

interface RepostButtonProps {
  postId: string;
  title?: string | null;
  authorName?: string | null;
  content?: string | null;
  createdAt?: string | Date | null;
}

type SharePayload = {
  url: string;
  title: string;
  text: string;
  channel: ShareChannel;
  shareSource: string;
  vdSource: string;
};

type SharePlatform = {
  channel: ShareChannel;
  label: string;
  description: string;
  icon: LucideIcon;
};

const SHARE_SOURCES: Record<ShareChannel, string> = {
  copy: "copy_web",
  wechat: "wechat_web",
  qq: "qq_web",
  system: "system_web",
  poster: "poster_web",
  download_poster: "download_poster_web",
};

const LINK_PLATFORMS: SharePlatform[] = [
  {
    channel: "wechat",
    label: "微信",
    description: "移动端唤起系统分享，桌面端复制内容",
    icon: MessageCircle,
  },
  {
    channel: "qq",
    label: "QQ",
    description: "移动端唤起系统分享，桌面端复制内容",
    icon: Send,
  },
  {
    channel: "system",
    label: "系统分享",
    description: "手机浏览器可直接调起分享面板",
    icon: Smartphone,
  },
  {
    channel: "copy",
    label: "复制链接",
    description: "复制标题和链接",
    icon: Copy,
  },
];

function getShareTitle(title?: string | null, authorName?: string | null) {
  const normalizedTitle = title?.trim();
  if (normalizedTitle) {
    return normalizedTitle;
  }

  return `${authorName?.trim() || "匿名用户"} 的帖子`;
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[>*+-]\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getPosterText(content?: string | null) {
  const text = stripMarkdown(content || "");
  if (!text) {
    return "打开链接查看完整帖子内容。";
  }

  return text.length > 520 ? `${text.slice(0, 520)}...` : text;
}

function formatPosterDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(navigator.userAgent);
}

function canUseNativeShare() {
  return (
    typeof navigator !== "undefined"
    && typeof navigator.share === "function"
    && isMobileDevice()
  );
}

function createRandomHex() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return Math.random().toString(16).slice(2).padEnd(32, "0").slice(0, 32);
}

function getClientVdSource() {
  if (typeof window === "undefined") {
    return createRandomHex();
  }

  const key = "slept_vd_source";
  const existing = window.localStorage.getItem(key);
  if (existing && /^[a-f0-9]{32,64}$/i.test(existing)) {
    return existing.toLowerCase();
  }

  const nextValue = createRandomHex();
  window.localStorage.setItem(key, nextValue);
  return nextValue;
}

function createFallbackSharePayload(
  postId: string,
  channel: ShareChannel,
  title: string,
): SharePayload {
  if (typeof window === "undefined") {
    throw new Error("Unable to build fallback share link on the server");
  }

  const url = new URL(`/post/${postId}`, window.location.origin);
  const vdSource = getClientVdSource();
  const shareSource = SHARE_SOURCES[channel];

  url.searchParams.set("share_source", shareSource);
  url.searchParams.set("vd_source", vdSource);

  return {
    url: url.toString(),
    title,
    text: `${title}\n${url.toString()}`,
    channel,
    shareSource,
    vdSource,
  };
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "0";
  textArea.style.top = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").slice(0, 48) || "share-poster";
}

async function waitForImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.onload = () => resolve();
              image.onerror = () => resolve();
            }),
    ),
  );
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function SharePoster({
  title,
  authorName,
  content,
  dateText,
  qrCode,
}: {
  title: string;
  authorName?: string | null;
  content: string;
  dateText: string;
  qrCode: string;
}) {
  return (
    <div className="w-[360px] min-h-[540px] overflow-hidden rounded-2xl bg-white text-gray-950 shadow-sm">
      <div className="flex min-h-[540px] flex-col border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-7">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-indigo-600">Slept论坛网</p>
            <p className="mt-1 truncate text-sm text-gray-500">
              {authorName?.trim() || "匿名用户"}
              {dateText ? ` · ${dateText}` : ""}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            分享
          </div>
        </div>

        <h2 className="mt-6 break-words text-[25px] font-bold leading-tight text-gray-950">
          {title}
        </h2>

        <div className="mt-5 max-h-[255px] overflow-hidden whitespace-pre-wrap break-words text-[16px] leading-7 text-gray-700">
          {content}
        </div>

        <div className="mt-auto flex items-end justify-between gap-5 pt-7">
          <div className="min-w-0 text-sm text-gray-500">
            <p className="font-medium text-gray-800">扫码查看原帖</p>
            <p className="mt-1 leading-5">标题、作者和正文已为分享海报整理。</p>
          </div>
          <div className="shrink-0 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="帖子二维码" className="h-24 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformButton({
  platform,
  loading,
  copied,
  onClick,
}: {
  platform: SharePlatform;
  loading: boolean;
  copied: boolean;
  onClick: () => void;
}) {
  const Icon = platform.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex min-h-[92px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-3 text-center transition-colors hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
      title={platform.description}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : copied ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </span>
      <span className="mt-2 text-sm font-medium text-gray-900">{platform.label}</span>
      <span className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500">
        {canUseNativeShare() && platform.channel !== "copy"
          ? "调起系统分享"
          : "复制分享内容"}
      </span>
    </button>
  );
}

export default function RepostButton({
  postId,
  title,
  authorName,
  content,
  createdAt,
}: RepostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ShareTab>("link");
  const [loadingChannel, setLoadingChannel] = useState<ShareChannel | null>(null);
  const [copiedChannel, setCopiedChannel] = useState<ShareChannel | null>(null);
  const [notice, setNotice] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [posterDataUrl, setPosterDataUrl] = useState("");
  const [posterLoading, setPosterLoading] = useState(false);
  const [posterError, setPosterError] = useState("");
  const posterRef = useRef<HTMLDivElement>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shareTitle = useMemo(() => getShareTitle(title, authorName), [title, authorName]);
  const posterText = useMemo(() => getPosterText(content), [content]);
  const dateText = useMemo(() => formatPosterDate(createdAt), [createdAt]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = setTimeout(() => {
      setNotice("");
    }, 2200);
  }, []);

  const requestSharePayload = useCallback(
    async (channel: ShareChannel): Promise<SharePayload> => {
      try {
        const response = await fetch("/api/share", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId, channel }),
        });

        if (!response.ok) {
          throw new Error("Share API failed");
        }

        return (await response.json()) as SharePayload;
      } catch (error) {
        console.error("Failed to create tracked share link:", error);
        return createFallbackSharePayload(postId, channel, shareTitle);
      }
    },
    [postId, shareTitle],
  );

  const generatePoster = useCallback(async () => {
    setPosterLoading(true);
    setPosterError("");

    try {
      const payload = await requestSharePayload("poster");
      const nextQrCode = await QRCode.toDataURL(payload.url, {
        width: 192,
        margin: 1,
        color: {
          dark: "#111827",
          light: "#ffffff",
        },
      });

      setQrCode(nextQrCode);
      await nextFrame();
      await nextFrame();

      if (!posterRef.current) {
        throw new Error("Poster node is not ready");
      }

      await waitForImages(posterRef.current);
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      setPosterDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error("Failed to generate share poster:", error);
      setPosterError("分享图片生成失败，请稍后重试。");
      return "";
    } finally {
      setPosterLoading(false);
    }
  }, [requestSharePayload]);

  const handleLinkShare = async (channel: ShareChannel) => {
    setLoadingChannel(channel);
    setCopiedChannel(null);

    try {
      const payload = await requestSharePayload(channel);
      const canShareNatively = channel !== "copy" && canUseNativeShare();

      if (canShareNatively) {
        try {
          await navigator.share({
            title: payload.title,
            text: payload.title,
            url: payload.url,
          });
          showNotice("已打开系统分享面板");
          setIsOpen(false);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            showNotice("已取消分享");
            return;
          }
        }
      }

      await copyText(payload.text);
      setCopiedChannel(channel);
      showNotice(channel === "copy" ? "已复制标题和链接" : "已复制分享内容");
    } catch (error) {
      console.error("Share action failed:", error);
      showNotice("分享失败，请重试");
    } finally {
      setLoadingChannel(null);
    }
  };

  const handleDownloadPoster = async () => {
    setLoadingChannel("download_poster");

    try {
      const dataUrl = posterDataUrl || (await generatePoster());
      if (!dataUrl) {
        return;
      }

      await requestSharePayload("download_poster");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${sanitizeFileName(shareTitle)}-分享图片.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotice("分享图片已开始下载");
    } finally {
      setLoadingChannel(null);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "image" && !posterDataUrl && !posterLoading) {
      void generatePoster();
    }
  }, [activeTab, generatePoster, isOpen, posterDataUrl, posterLoading]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(true);
        }}
        className="flex items-center rounded-full p-1 text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-500 sm:p-2"
        title="分享帖子"
        aria-label="分享帖子"
      >
        <Share2 className="h-[18px] w-[18px] transition-transform duration-200 hover:scale-110" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[90]"
          role="dialog"
          aria-modal="true"
          aria-label="分享帖子"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm animate-in fade-in" />
          <div
            className="sharebar-sheet absolute inset-x-0 bottom-0 mx-auto flex max-h-[88vh] max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">分享帖子</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  分享就是快乐！
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="关闭分享面板"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-100 px-4 pt-3 sm:px-5">
              <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("link")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === "link"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  <Link2 className="h-4 w-4" />
                  分享链接
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("image")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === "image"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  <ImageIcon className="h-4 w-4" />
                  分享图片
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {activeTab === "link" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {LINK_PLATFORMS.map((platform) => (
                    <PlatformButton
                      key={platform.channel}
                      platform={platform}
                      loading={loadingChannel === platform.channel}
                      copied={copiedChannel === platform.channel}
                      onClick={() => void handleLinkShare(platform.channel)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center rounded-xl border border-gray-200 bg-gray-50 p-3">
                    {posterDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={posterDataUrl}
                        alt="分享图片预览"
                        className="max-h-[56vh] w-auto rounded-xl border border-gray-200 bg-white shadow-sm"
                      />
                    ) : (
                      <div className="flex min-h-[360px] w-full max-w-[360px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">
                        {posterLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            正在生成分享图片
                          </span>
                        ) : (
                          "等待生成分享图片"
                        )}
                      </div>
                    )}
                  </div>

                  {posterError && (
                    <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {posterError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleDownloadPoster()}
                    disabled={posterLoading || loadingChannel === "download_poster"}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {posterLoading || loadingChannel === "download_poster" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    下载分享图片
                  </button>
                </div>
              )}
            </div>

            {notice && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-center text-sm text-gray-700">
                {notice}
              </div>
            )}
          </div>

          {activeTab === "image" && qrCode && (
            <div className="pointer-events-none fixed -left-[10000px] top-0">
              <div ref={posterRef}>
                <SharePoster
                  title={shareTitle}
                  authorName={authorName}
                  content={posterText}
                  dateText={dateText}
                  qrCode={qrCode}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
