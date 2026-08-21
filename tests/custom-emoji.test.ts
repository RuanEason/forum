import assert from "node:assert/strict";
import test from "node:test";
import {
  customEmojiToMarkdown,
  isCustomEmojiUrl,
} from "../src/lib/emoji";
import {
  getCustomEmojiPrefix,
  isCustomEmojiObjectKeyForUser,
} from "../src/lib/custom-emoji";
import {
  CUSTOM_EMOJI_MAX_FILE_SIZE,
  CUSTOM_EMOJI_RENDER_SIZE,
} from "../src/types/emoji";

process.env.NEXT_PUBLIC_CDN_DOMAIN = "https://cdn.example.com";

test("custom emoji URLs stay within the configured CDN emoji prefix", () => {
  assert.equal(isCustomEmojiUrl("https://cdn.example.com/emoji/happy.png"), true);
  assert.equal(isCustomEmojiUrl("https://cdn.example.com/images/photo.png"), false);
  assert.equal(isCustomEmojiUrl("https://evil.example/emoji/happy.png"), false);
  assert.equal(isCustomEmojiUrl("/emoji/happy.png"), false);
});

test("custom emoji insertion produces safe Markdown image syntax", () => {
  assert.equal(
    customEmojiToMarkdown({
      name: "开心 [测试]",
      url: "https://cdn.example.com/emoji/happy.png",
    }),
    "![开心  测试](<https://cdn.example.com/emoji/happy.png>)",
  );
});

test("custom emoji objects are isolated by user prefix", () => {
  const key = "emoji/user-1/2026/08/emoji__happy.png";

  assert.equal(getCustomEmojiPrefix("user-1"), "emoji/user-1/");
  assert.equal(isCustomEmojiObjectKeyForUser(key, "user-1"), true);
  assert.equal(isCustomEmojiObjectKeyForUser(key, "user-2"), false);
  assert.equal(isCustomEmojiObjectKeyForUser("emoji/user-1/../user-2/happy.png", "user-1"), false);
});

test("custom emoji limits use a 20 MiB file and fixed 80px render size", () => {
  assert.equal(CUSTOM_EMOJI_MAX_FILE_SIZE, 20 * 1024 * 1024);
  assert.equal(CUSTOM_EMOJI_RENDER_SIZE, 80);
});
