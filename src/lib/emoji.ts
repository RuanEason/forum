import type { CustomEmoji } from "@/types/emoji";

export const CUSTOM_EMOJI_PREFIX = "emoji/";
export { CUSTOM_EMOJI_RENDER_SIZE } from "@/types/emoji";

export function isCustomEmojiUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) {
    return false;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const configuredCdn = process.env.NEXT_PUBLIC_CDN_DOMAIN;
    if (configuredCdn) {
      const cdnUrl = new URL(configuredCdn);
      if (url.host !== cdnUrl.host) {
        return false;
      }
    }

    const path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    return path.startsWith(CUSTOM_EMOJI_PREFIX)
      && path.length > CUSTOM_EMOJI_PREFIX.length
      && !path.includes("..");
  } catch {
    return false;
  }
}

function escapeImageAlt(value: string): string {
  return value.replace(/[\\[\]]/g, " ").trim().slice(0, 120) || "custom emoji";
}

export function customEmojiToMarkdown(emoji: Pick<CustomEmoji, "name" | "url">): string {
  return `![${escapeImageAlt(emoji.name)}](<${emoji.url}>)`;
}
