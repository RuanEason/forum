import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  InvalidCursorError,
  decodeCursor,
  encodeCursor,
  getPageResult,
  parseListPageSize,
  parsePage,
} from "@/lib/pagination";

test("list page size is bounded to the shared contract", () => {
  assert.equal(parseListPageSize(null), DEFAULT_LIST_PAGE_SIZE);
  assert.equal(parseListPageSize("0"), 1);
  assert.equal(parseListPageSize("999"), MAX_LIST_PAGE_SIZE);
  assert.equal(parseListPageSize("not-a-number"), DEFAULT_LIST_PAGE_SIZE);
});

test("cursor encoding round-trips a stable record id", () => {
  const cursor = encodeCursor("post_123");
  assert.equal(decodeCursor(cursor), "post_123");
});

test("malformed cursors are rejected", () => {
  assert.throws(() => decodeCursor("invalid"), InvalidCursorError);
  assert.equal(decodeCursor(null), null);
});

test("page result reports bounded navigation metadata", () => {
  const result = getPageResult(["a", "b"], parsePage("2"), 2, 5);
  assert.deepEqual(result, {
    items: ["a", "b"],
    page: 2,
    pageSize: 2,
    total: 5,
    totalPages: 3,
    hasMore: true,
  });
});
