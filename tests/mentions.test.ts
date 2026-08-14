import assert from "node:assert/strict";
import test from "node:test";
import type { JSONContent } from "@tiptap/core";
import {
  buildUniqueMentionTargetMap,
  collectMentionNamesFromMarkdown,
  collectMentionNamesFromRichText,
  transformMarkdownMentions,
  transformRichTextMentions,
  type MentionTargetMap,
} from "../src/lib/mentions";

const targets: MentionTargetMap = new Map([
  ["张三", { id: "user-1", name: "张三" }],
  ["alice_1", { id: "user-2", name: "alice_1" }],
]);

test("transforms only safe Markdown text nodes", () => {
  const source = [
    "@张三 @alice_1 @unknown",
    "foo@example.com",
    "`@张三`",
    "```",
    "@张三",
    "```",
    "[已有 @张三](https://example.com)",
    "![图片 @张三](https://example.com/image.png)",
  ].join("\n");

  const result = transformMarkdownMentions(source, targets);

  assert.equal(
    result,
    [
      "[@张三](/user/user-1) [@alice_1](/user/user-2) @unknown",
      "foo@example.com",
      "`@张三`",
      "```",
      "@张三",
      "```",
      "[已有 @张三](https://example.com)",
      "![图片 @张三](https://example.com/image.png)",
    ].join("\n"),
  );
  assert.deepEqual(
    [...collectMentionNamesFromMarkdown(source)],
    ["张三", "alice_1", "unknown"],
  );
});

test("transforms rich text while preserving existing marks", () => {
  const document: JSONContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "hello @张三 @unknown",
            marks: [{ type: "bold" }],
          },
        ],
      },
      {
        type: "codeBlock",
        content: [{ type: "text", text: "@张三" }],
      },
    ],
  };

  const result = transformRichTextMentions(document, targets);
  const paragraphContent = result.content?.[0]?.content;

  assert.deepEqual(paragraphContent, [
    {
      type: "text",
      text: "hello ",
      marks: [{ type: "bold" }],
    },
    {
      type: "text",
      text: "@张三",
      marks: [
        { type: "bold" },
        { type: "link", attrs: { href: "/user/user-1" } },
      ],
    },
    {
      type: "text",
      text: " @unknown",
      marks: [{ type: "bold" }],
    },
  ]);
  assert.equal(result.content?.[1]?.content?.[0]?.text, "@张三");
  assert.deepEqual([...collectMentionNamesFromRichText(document)], ["张三", "unknown"]);
});

test("mention conversion is idempotent", () => {
  const markdown = "@张三";
  const firstMarkdown = transformMarkdownMentions(markdown, targets);
  assert.equal(transformMarkdownMentions(firstMarkdown, targets), firstMarkdown);

  const richText: JSONContent = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "@张三" }] }],
  };
  const firstRichText = transformRichTextMentions(richText, targets);
  assert.deepEqual(transformRichTextMentions(firstRichText, targets), firstRichText);
});

test("duplicate names are excluded from the unique target map", () => {
  const uniqueTargets = buildUniqueMentionTargetMap([
    { id: "user-1", name: "张三" },
    { id: "user-2", name: "张三" },
    { id: "user-3", name: "alice_1" },
  ]);

  assert.equal(uniqueTargets.has("张三"), false);
  assert.deepEqual(uniqueTargets.get("alice_1"), { id: "user-3", name: "alice_1" });
});
