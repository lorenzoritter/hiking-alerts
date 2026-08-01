import "dotenv/config";

import { Worker } from "bullmq";

import { overdueQueue, redisConnection, scheduleOverdueScan } from "./queue.js";
import { scanOverdueAdventures } from "./escalation.js";
import { prisma } from "./prisma.js";
import { deliverPendingNotifications } from "./delivery.js";

const worker = new Worker(
  "hiking-alerts-overdue",
  async (job) => {
    if (job.name !== "scan-overdue-adventures") {
      return;
    }

    const result = await scanOverdueAdventures();
    const deliveries = await deliverPendingNotifications();
    console.log(`Overdue scan ${new Date().toISOString()}: ${JSON.stringify({ ...result, deliveries })}`);
  },
  { connection: redisConnection },
);

worker.on("failed", (job, error) => {
  console.error(`Worker job ${job?.id ?? "unknown"} failed: ${error.message}`);
});
worker.on("error", (error) => {
  console.error(`Worker error: ${error.message}`);
});
overdueQueue.on("error", (error) => {
  console.error(`Queue error: ${error.message}`);
});
redisConnection.on("error", (error) => {
  console.error(`Redis connection error: ${error.message}`);
});

let shutdownPromise: Promise<void> | undefined;
async function shutdown() {
  if (shutdownPromise) return shutdownPromise;
  shutdownPromise = (async () => {
    try {
      await worker.close().catch((error: unknown) => console.error(`Worker shutdown error: ${error instanceof Error ? error.message : "unknown error"}`));
      await overdueQueue.close().catch((error: unknown) => console.error(`Queue shutdown error: ${error instanceof Error ? error.message : "unknown error"}`));
      await prisma.$disconnect().catch((error: unknown) => console.error(`Database shutdown error: ${error instanceof Error ? error.message : "unknown error"}`));
    } finally {
      await redisConnection.quit().catch((error: unknown) => {
        console.error(`Redis shutdown error: ${error instanceof Error ? error.message : "unknown error"}`);
      });
    }
  })();
  return shutdownPromise;
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

try {
  await scheduleOverdueScan();
  console.log("Hiking Alerts worker started; scheduled scan runs every 60 seconds.");
} catch (error) {
  console.error(`Worker startup failed: ${error instanceof Error ? error.message : "unknown error"}`);
  await shutdown();
  process.exitCode = 1;
}
