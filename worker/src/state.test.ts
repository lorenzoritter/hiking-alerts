import assert from "node:assert/strict";
import test from "node:test";

import { getEscalationTransition } from "./state.js";

const expectedReturnAt = new Date("2026-01-01T12:00:00.000Z");

test("does not ping before the hiker grace period expires", () => {
  const result = getEscalationTransition({ status: "ACTIVE", expectedReturnAt, pingGraceMinutes: 30, alertGraceMinutes: 30 }, new Date("2026-01-01T12:29:59.999Z"));
  assert.equal(result, null);
});

test("pings at the exact hiker deadline", () => {
  const result = getEscalationTransition({ status: "ACTIVE", expectedReturnAt, pingGraceMinutes: 30, alertGraceMinutes: 30 }, new Date("2026-01-01T12:30:00.000Z"));
  assert.equal(result?.status, "HIKER_PINGED");
});

test("alerts contacts only after the second grace period", () => {
  const result = getEscalationTransition({ status: "HIKER_PINGED", expectedReturnAt, pingGraceMinutes: 30, alertGraceMinutes: 30 }, new Date("2026-01-01T13:00:00.000Z"));
  assert.equal(result?.status, "CONTACTS_ALERTED");
});
