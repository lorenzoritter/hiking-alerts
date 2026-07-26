import assert from "node:assert/strict";
import test from "node:test";

import { parseLocalDateTime } from "@/lib/adventures/time";

test("rejects impossible calendar dates", () => {
  assert.equal(parseLocalDateTime("2026-02-30T12:00", "UTC"), null);
});

test("converts valid local times using the selected timezone", () => {
  const result = parseLocalDateTime("2026-07-01T12:00", "America/Denver");
  assert.equal(result?.toISOString(), "2026-07-01T18:00:00.000Z");
});

test("rejects ambiguous fall-back daylight-saving times", () => {
  assert.equal(parseLocalDateTime("2026-11-01T01:30", "America/Denver"), null);
});
