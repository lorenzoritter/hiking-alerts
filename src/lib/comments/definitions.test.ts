import assert from "node:assert/strict";
import test from "node:test";

import { commentSchema } from "@/lib/comments/definitions";

test("accepts trimmed comments within the limit", () => {
  const result = commentSchema.safeParse({ body: "  I am heading back now.  " });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.body, "I am heading back now.");
});

test("rejects empty and oversized comments", () => {
  assert.equal(commentSchema.safeParse({ body: "   " }).success, false);
  assert.equal(commentSchema.safeParse({ body: "x".repeat(2001) }).success, false);
});
