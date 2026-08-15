import assert from "node:assert/strict";
import test from "node:test";
import { parseMarkdownHeadingPaste } from "../src/lib/rich-text/paste";

test("converts pasted Markdown headings into rich-text blocks", () => {
  assert.deepEqual(
    parseMarkdownHeadingPaste("### 3.3 钓鱼邮件与Web威胁检测\n正文\n## 下一节 ##"),
    [
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "3.3 钓鱼邮件与Web威胁检测" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "正文" }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "下一节" }],
      },
    ],
  );
});

test("keeps ordinary text and fenced heading-looking text unchanged", () => {
  assert.equal(parseMarkdownHeadingPaste("ordinary text"), null);
  assert.deepEqual(
    parseMarkdownHeadingPaste("```md\n### code\n```\n### actual"),
    [
      { type: "paragraph", content: [{ type: "text", text: "```md" }] },
      { type: "paragraph", content: [{ type: "text", text: "### code" }] },
      { type: "paragraph", content: [{ type: "text", text: "```" }] },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "actual" }],
      },
    ],
  );
});
