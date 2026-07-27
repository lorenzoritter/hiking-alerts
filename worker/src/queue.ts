import { Queue } from "bullmq";
import Redis from "ioredis";

export const redisConnection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const overdueQueue = new Queue("hiking-alerts-overdue", {
  connection: redisConnection,
});

export async function scheduleOverdueScan() {
  await overdueQueue.upsertJobScheduler(
    "overdue-adventure-scan",
    { every: 60_000 },
    {
      name: "scan-overdue-adventures",
      opts: {
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 1000 },
      },
    },
  );
}
