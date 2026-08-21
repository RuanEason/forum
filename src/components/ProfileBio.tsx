"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { CUSTOM_EMOJI_RENDER_SIZE, isCustomEmojiUrl } from "@/lib/emoji";
import { createMarkdownComponents } from "@/lib/markdown-components";
import { cn } from "@/lib/utils";

const profileBioMarkdownComponents: Components = {
  ...createMarkdownComponents(),
  img: ({ src, alt, title }) => {
    if (typeof src !== "string" || !isCustomEmojiUrl(src)) {
      return null;
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || "自定义表情"}
        title={title}
        data-custom-emoji="true"
        className="custom-emoji inline-block align-middle object-contain"
        style={{ width: CUSTOM_EMOJI_RENDER_SIZE, height: CUSTOM_EMOJI_RENDER_SIZE }}
        loading="lazy"
      />
    );
  },
};

export default function ProfileBio({ bio, className }: { bio: string; className?: string }) {
  return (
    <div className={cn("break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={profileBioMarkdownComponents}
      >
        {bio}
      </ReactMarkdown>
    </div>
  );
}
