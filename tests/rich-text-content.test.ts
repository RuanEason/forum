import assert from "node:assert/strict";
import test from "node:test";
import type { JSONContent } from "@tiptap/core";
import {
  isAllowedRichTextUrl,
  parseRichTextDocument,
} from "../src/lib/rich-text/content";

test("accepts mailto links generated from pasted email addresses", () => {
  const document: JSONContent = {
    type: "doc",
    content: [{
      type: "paragraph",
      content: [{
        type: "text",
        text: "email@web.com",
        marks: [{ type: "link", attrs: { href: "mailto:email@web.com" } }],
      }],
    }],
  };

  assert.equal(isAllowedRichTextUrl("mailto:email@web.com"), true);
  assert.deepEqual(parseRichTextDocument(document), document);
});

test("rejects empty rich-text link targets", () => {
  assert.equal(isAllowedRichTextUrl(""), false);
  assert.equal(isAllowedRichTextUrl("mailto:"), false);
  assert.equal(parseRichTextDocument({
    type: "doc",
    content: [{
      type: "paragraph",
      content: [{
        type: "text",
        text: "email@web.com",
        marks: [{ type: "link", attrs: { href: "" } }],
      }],
    }],
  }), null);
});
