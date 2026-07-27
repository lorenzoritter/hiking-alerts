import assert from "node:assert/strict";
import test from "node:test";

import { getEscalationTransition, isReminderDue } from "./state.js";

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

test("reminder is due only during the pre-deadline window", () => {
  assert.equal(isReminderDue(expectedReturnAt, new Date("2026-01-01T10:59:59.999Z")), false);
  assert.equal(isReminderDue(expectedReturnAt, new Date("2026-01-01T11:00:00.000Z")), true);
  assert.equal(isReminderDue(expectedReturnAt, expectedReturnAt), false);
});
