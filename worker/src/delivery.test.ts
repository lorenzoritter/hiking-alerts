import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.NOTIFICATION_WEBHOOK_URL = "https://notifications.test/deliver";
const { deliverPendingNotifications } = await import("./delivery.js");

function fakeDatabase(notification: Record<string, unknown>) {
  const updates: Record<string, unknown>[] = [];
  const database = {
    notificationLog: {
      updateMany: async () => ({ count: 1 }),
      findMany: async () => [notification],
      update: async ({ data }: { data: Record<string, unknown> }) => { updates.push(data); return notification; },
    },
  };
  return { database: database as never, updates };
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

test("keeps failed delivery pending before the retry limit", async () => {
  const { database, updates } = fakeDatabase(baseNotification);
  const result = await deliverPendingNotifications(database, async () => { throw new Error("offline"); });
  assert.deepEqual(result, { delivered: 0, failed: 1, inspected: 1 });
  assert.equal(updates.at(-1)?.status, "PENDING");
  assert.equal(updates.at(-1)?.attempts, 1);
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
