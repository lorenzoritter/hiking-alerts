import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.NOTIFICATION_WEBHOOK_URL = "https://notifications.test/deliver";
const { deliverPendingNotifications } = await import("./delivery.js");

function fakeDatabase(notification: Record<string, unknown>, claimCount = 1) {
  const updates: Record<string, unknown>[] = [];
  const manyUpdates: { where: Record<string, unknown>; data: Record<string, unknown> }[] = [];
  const database = {
    notificationLog: {
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => { manyUpdates.push({ where, data }); return { count: manyUpdates.length === 1 ? 1 : claimCount }; },
      findMany: async () => [notification],
      update: async ({ data }: { data: Record<string, unknown> }) => { updates.push(data); return notification; },
    },
  };
  return { database: database as never, updates, manyUpdates };
}

const baseNotification = { id: "n1", adventureId: "a1", channel: "EMAIL", destination: "hiker@example.com", purpose: "REMINDER", attempts: 0, deliveryKey: "key-1" };

test("delivers a pending notification with an idempotency key", async () => {
  const { database, updates } = fakeDatabase(baseNotification);
  let requestInit: RequestInit | undefined;
  const result = await deliverPendingNotifications(database, async (_url, init) => { requestInit = init; return new Response(null, { status: 204 }); });
  assert.deepEqual(result, { delivered: 1, failed: 0, inspected: 1 });
  assert.equal((requestInit?.headers as Record<string, string>)["Idempotency-Key"], "key-1");
  assert.equal(updates.at(-1)?.status, "SENT");
});

test("reuses the same idempotency key for repeated delivery attempts", async () => {
  const keys: string[] = [];
  for (let index = 0; index < 2; index += 1) {
    const { database } = fakeDatabase(baseNotification);
    await deliverPendingNotifications(database, async (_url, init) => { keys.push((init?.headers as Record<string, string>)["Idempotency-Key"]); return new Response(null, { status: 204 }); });
  }
  assert.deepEqual(keys, ["key-1", "key-1"]);
});

test("keeps failed delivery pending before the retry limit", async () => {
  const { database, updates } = fakeDatabase(baseNotification);
  const result = await deliverPendingNotifications(database, async () => { throw new Error("offline"); });
  assert.deepEqual(result, { delivered: 0, failed: 1, inspected: 1 });
  assert.equal(updates.at(-1)?.status, "PENDING");
  assert.equal(updates.at(-1)?.attempts, 1);
});

test("retries a non-successful provider response", async () => {
  const { database, updates } = fakeDatabase(baseNotification);
  await deliverPendingNotifications(database, async () => new Response(null, { status: 503 }));
  assert.equal(updates.at(-1)?.status, "PENDING");
  assert.match(String(updates.at(-1)?.errorMessage), /503/);
});

test("fails immediately when no provider is configured", async () => {
  const previous = process.env.NOTIFICATION_WEBHOOK_URL;
  delete process.env.NOTIFICATION_WEBHOOK_URL;
  const { database, updates } = fakeDatabase(baseNotification);
  const result = await deliverPendingNotifications(database);
  assert.deepEqual(result, { delivered: 0, failed: 1, inspected: 1 });
  assert.equal(updates.at(-1)?.status, "FAILED");
  if (previous) process.env.NOTIFICATION_WEBHOOK_URL = previous;
});

test("marks a notification failed after its third attempt", async () => {
  const { database, updates } = fakeDatabase({ ...baseNotification, attempts: 2 });
  const result = await deliverPendingNotifications(database, async () => { throw new Error("offline"); });
  assert.deepEqual(result, { delivered: 0, failed: 1, inspected: 1 });
  assert.equal(updates.at(-1)?.status, "FAILED");
  assert.equal(updates.at(-1)?.attempts, 3);
});

test("does not duplicate a notification another worker claimed", async () => {
  const { database, updates } = fakeDatabase(baseNotification, 0);
  const result = await deliverPendingNotifications(database, async () => new Response(null, { status: 204 }));
  assert.deepEqual(result, { delivered: 0, failed: 0, inspected: 1 });
  assert.equal(updates.length, 0);
});

test("recovers stale processing rows before claiming pending work", async () => {
  let status = "PROCESSING";
  const staleNotification = { ...baseNotification, status, lastAttemptAt: new Date(Date.now() - 5 * 60 * 1000) };
  const updates: Record<string, unknown>[] = [];
  const database = { notificationLog: {
    updateMany: async ({ where }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      if (where.status === "PROCESSING") { status = "PENDING"; return { count: 1 }; }
      if (where.status === "PENDING") { status = "PROCESSING"; return { count: 1 }; }
      return { count: 0 };
    },
    findMany: async () => [{ ...staleNotification, status }],
    update: async ({ data }: { data: Record<string, unknown> }) => { status = String(data.status); updates.push(data); return staleNotification; },
  } } as never;
  await deliverPendingNotifications(database, async () => new Response(null, { status: 204 }));
  assert.equal(status, "SENT");
  assert.equal(updates.at(-1)?.status, "SENT");
});
