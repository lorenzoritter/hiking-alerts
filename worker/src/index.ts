import "dotenv/config";

import { Worker } from "bullmq";

import { overdueQueue, redisConnection, scheduleOverdueScan } from "./queue.js";

const worker = new Worker(
  "hiking-alerts-overdue",
  async (job) => {
    if (job.name !== "scan-overdue-adventures") {
      return;
    }

    // Step 10 replaces this heartbeat with the overdue state-machine scan.
    console.log(`Overdue scan scheduled at ${new Date().toISOString()}`);
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
      await worker.close();
      await overdueQueue.close();
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
