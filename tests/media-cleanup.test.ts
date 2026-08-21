import assert from "node:assert/strict";
import test from "node:test";

import {
  MEDIA_CLEANUP_WINDOW_MS,
  createMediaCleanupDedupeKey,
  extractCOSObjectKey,
  getCOSOrphanAuditPrefixes,
} from "../src/lib/media-cleanup";

test("media cleanup keeps a 24-hour recovery window", () => {
  assert.equal(MEDIA_CLEANUP_WINDOW_MS, 24 * 60 * 60 * 1000);
});

test("media cleanup extracts only configured CDN object keys", () => {
  const previousCdn = process.env.NEXT_PUBLIC_CDN_DOMAIN;
  const previousBucket = process.env.TENCENT_COS_BUCKET;
  process.env.NEXT_PUBLIC_CDN_DOMAIN = "https://cdn.example.com";
  process.env.TENCENT_COS_BUCKET = "forum-1250000000";

  try {
    assert.equal(
      extractCOSObjectKey("https://cdn.example.com/images/a%20b.webp?x=1"),
      "images/a b.webp",
    );
    assert.equal(extractCOSObjectKey("attachments/user/file.zip"), "attachments/user/file.zip");
    assert.equal(extractCOSObjectKey("https://other.example.com/file.webp"), null);
    assert.equal(extractCOSObjectKey("https://cdn.example.com/api/uploads/local.jpg"), null);
  } finally {
    if (previousCdn === undefined) delete process.env.NEXT_PUBLIC_CDN_DOMAIN;
    else process.env.NEXT_PUBLIC_CDN_DOMAIN = previousCdn;
    if (previousBucket === undefined) delete process.env.TENCENT_COS_BUCKET;
    else process.env.TENCENT_COS_BUCKET = previousBucket;
  }
});

test("media cleanup dedupe keys are stable and resource-specific", () => {
  const imageKey = createMediaCleanupDedupeKey("POST_IMAGE", "images/post.webp");
  assert.equal(imageKey, createMediaCleanupDedupeKey("POST_IMAGE", "images/post.webp"));
  assert.notEqual(imageKey, createMediaCleanupDedupeKey("USER_AVATAR", "images/post.webp"));
});

test("orphan audit uses bounded, explicit prefixes by default", () => {
  const previous = process.env.COS_ORPHAN_AUDIT_PREFIXES;
  delete process.env.COS_ORPHAN_AUDIT_PREFIXES;

  try {
    assert.deepEqual(getCOSOrphanAuditPrefixes(), [
      "images/",
      "attachments/",
      "videos/",
      "backgrounds/",
      "editor-pool/",
      "emoji/",
    ]);
  } finally {
    if (previous === undefined) delete process.env.COS_ORPHAN_AUDIT_PREFIXES;
    else process.env.COS_ORPHAN_AUDIT_PREFIXES = previous;
  }
});
