"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPickerReact, {
  EmojiStyle,
  Theme,
  type EmojiClickData,
} from "emoji-picker-react";
import emojiData from "emoji-picker-react/dist/data/emojis-zh.js";
import { ImagePlus, Loader2, Smile, Trash2, Upload } from "lucide-react";
import { customEmojiToMarkdown } from "@/lib/emoji";
import type { CustomEmoji } from "@/types/emoji";
import { CUSTOM_EMOJI_MAX_FILE_SIZE } from "@/types/emoji";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface EmojiPageResponse {
  emojis?: CustomEmoji[];
  nextCursor?: string | null;
  error?: string;
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onSelectCustomEmoji?: (emoji: CustomEmoji) => void;
  disabled?: boolean;
  placement?: "top" | "bottom";
  buttonClassName?: string;
  showCustomEmojis?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function EmojiPicker({
  onSelect,
  onSelectCustomEmoji,
  disabled = false,
  placement = "bottom",
  buttonClassName,
  showCustomEmojis = true,
  onOpenChange,
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"native" | "custom">("native");
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [customEmojiCursor, setCustomEmojiCursor] = useState<string | null>(null);
  const [customEmojiLoaded, setCustomEmojiLoaded] = useState(false);
  const [customEmojiLoading, setCustomEmojiLoading] = useState(false);
  const [customEmojiUploading, setCustomEmojiUploading] = useState(false);
  const [customEmojiDeleting, setCustomEmojiDeleting] = useState<string | null>(null);
  const [customEmojiError, setCustomEmojiError] = useState("");
  const toast = useToast();

  const closePicker = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        closePicker();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePicker();
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePicker, open]);

  const loadCustomEmojis = useCallback(async (options?: { cursor?: string; append?: boolean }) => {
    if (customEmojiLoading) {
      return;
    }

    setCustomEmojiLoading(true);
    setCustomEmojiError("");

    try {
      const query = options?.cursor ? `?cursor=${encodeURIComponent(options.cursor)}` : "";
      const response = await fetch(`/api/emoji${query}`, { cache: "no-store" });
      const data = await response.json() as EmojiPageResponse;
      if (!response.ok) {
        throw new Error(data.error || "加载自定义表情失败");
      }

      const page = Array.isArray(data.emojis) ? data.emojis : [];
      setCustomEmojis((current) => {
        if (!options?.append) {
          return page;
        }

        const known = new Set(current.map((emoji) => emoji.key));
        return [...current, ...page.filter((emoji) => !known.has(emoji.key))];
      });
      setCustomEmojiCursor(data.nextCursor ?? null);
      setCustomEmojiLoaded(true);
    } catch (error) {
      setCustomEmojiError(error instanceof Error ? error.message : "加载自定义表情失败");
    } finally {
      setCustomEmojiLoading(false);
    }
  }, [customEmojiLoading]);

  useEffect(() => {
    if (open && showCustomEmojis && activeTab === "custom" && !customEmojiLoaded) {
      void loadCustomEmojis();
    }
  }, [activeTab, customEmojiLoaded, loadCustomEmojis, open, showCustomEmojis]);

  const handleEmojiClick = (emoji: EmojiClickData) => {
    onSelect(emoji.emoji);
    closePicker();
  };

  const handleCustomEmojiClick = (emoji: CustomEmoji) => {
    if (onSelectCustomEmoji) {
      onSelectCustomEmoji(emoji);
    } else {
      onSelect(customEmojiToMarkdown(emoji));
    }
    closePicker();
  };

  const handleTabChange = (tab: "native" | "custom") => {
    setActiveTab(tab);
    if (tab === "custom" && !customEmojiLoaded) {
      setCustomEmojiError("");
    }
  };

  const uploadEmoji = async (file: File) => {
    if (file.size <= 0 || file.size > CUSTOM_EMOJI_MAX_FILE_SIZE) {
      throw new Error(`表情图片必须在 1 字节到 ${formatFileSize(CUSTOM_EMOJI_MAX_FILE_SIZE)} 之间`);
    }

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/emoji", { method: "POST", body: formData });
    const data = await response.json() as { emoji?: CustomEmoji; error?: string };
    if (!response.ok || !data.emoji) {
      throw new Error(data.error || "上传自定义表情失败");
    }

    return data.emoji;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0 || customEmojiUploading) {
      return;
    }

    setCustomEmojiUploading(true);
    setCustomEmojiError("");
    const errors: string[] = [];
    for (const file of files) {
      try {
        const emoji = await uploadEmoji(file);
        setCustomEmojis((current) => [emoji, ...current]);
        setCustomEmojiLoaded(true);
      } catch (error) {
        errors.push(error instanceof Error ? `${file.name}: ${error.message}` : `${file.name}: 上传自定义表情失败`);
      }
    }
    if (errors.length > 0) {
      setCustomEmojiError(errors.join("；"));
    }
    setCustomEmojiUploading(false);
  };

  const handleDelete = async (emoji: CustomEmoji) => {
    if (customEmojiDeleting) {
      return;
    }

    setCustomEmojiDeleting(emoji.key);
    setCustomEmojiError("");
    try {
      const response = await fetch("/api/emoji", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: emoji.key }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "删除自定义表情失败");
      }
      setCustomEmojis((current) => current.filter((item) => item.key !== emoji.key));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除自定义表情失败");
    } finally {
      setCustomEmojiDeleting(null);
    }
  };

  return (
    <div
      ref={pickerRef}
      data-emoji-picker="true"
      className="relative shrink-0"
    >
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (!disabled) {
            const nextOpen = !open;
            setOpen(nextOpen);
            onOpenChange?.(nextOpen);
            setActiveTab("native");
          }
        }}
        disabled={disabled}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-45",
          open && "bg-blue-50 text-blue-700",
          buttonClassName,
        )}
        title="插入表情"
        aria-label="插入表情"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Smile className="h-4 w-4" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="表情选择器"
          data-emoji-picker="true"
          className={cn(
            "absolute left-0 z-[70] w-[min(352px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {showCustomEmojis ? (
            <div className="flex border-b border-slate-200 px-2 pt-2" role="tablist" aria-label="表情分类">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "native"}
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleTabChange("native");
                }}
                onClick={() => handleTabChange("native")}
                className={cn(
                  "flex-1 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                  activeTab === "native"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                系统表情
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "custom"}
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleTabChange("custom");
                }}
                onClick={() => handleTabChange("custom")}
                className={cn(
                  "flex-1 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                  activeTab === "custom"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                我的表情
              </button>
            </div>
          ) : null}

          {activeTab === "native" || !showCustomEmojis ? (
            <EmojiPickerReact
              emojiData={emojiData}
              emojiStyle={EmojiStyle.TWITTER}
              theme={Theme.LIGHT}
              lazyLoadEmojis
              autoFocusSearch
              searchPlaceholder="搜索表情"
              searchClearButtonLabel="清空搜索"
              previewConfig={{ showPreview: false }}
              width="100%"
              height={380}
              onEmojiClick={handleEmojiClick}
            />
          ) : (
            <div className="flex h-[380px] flex-col p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">单张最大 {formatFileSize(CUSTOM_EMOJI_MAX_FILE_SIZE)}</span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={customEmojiUploading || customEmojiDeleting !== null}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {customEmojiUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  上传
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(event) => void handleFileChange(event)}
                />
              </div>

              {customEmojiError ? (
                <div className="mb-2 flex items-start gap-2 rounded-md bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-700">
                  <span className="min-w-0 flex-1">{customEmojiError}</span>
                  {!customEmojiLoaded ? (
                    <button type="button" className="shrink-0 font-medium underline" onClick={() => void loadCustomEmojis()}>
                      重试
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto">
                {customEmojiLoading && customEmojis.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在加载
                  </div>
                ) : customEmojis.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400">
                    <ImagePlus className="h-7 w-7 text-slate-300" />
                    <span>还没有上传表情</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {customEmojis.map((emoji) => (
                      <div key={emoji.key} className="group relative min-w-0">
                        <button
                          type="button"
                          onClick={() => handleCustomEmojiClick(emoji)}
                          className="flex aspect-square w-full min-w-0 items-center justify-center rounded-lg border border-transparent p-1 transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                          title={`${emoji.name}${emoji.size ? ` (${formatFileSize(emoji.size)})` : ""}`}
                          aria-label={`插入自定义表情 ${emoji.name}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={emoji.url} alt={emoji.name} loading="lazy" className="max-h-14 max-w-full object-contain" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(emoji)}
                          disabled={customEmojiDeleting !== null || customEmojiUploading}
                          className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-white/95 text-red-600 opacity-0 shadow-sm transition-opacity hover:bg-red-50 group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="删除表情"
                          aria-label={`删除自定义表情 ${emoji.name}`}
                        >
                          {customEmojiDeleting === emoji.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {customEmojiCursor ? (
                <button
                  type="button"
                  onClick={() => void loadCustomEmojis({ cursor: customEmojiCursor, append: true })}
                  disabled={customEmojiLoading}
                  className="mt-2 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {customEmojiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  加载更多
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
