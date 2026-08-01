import { prisma } from "./prisma.js";

const MAX_ATTEMPTS = 3;

export async function deliverPendingNotifications() {
  const pending = await prisma.notificationLog.findMany({
    where: { status: "PENDING", destination: { not: null } },
    orderBy: { createdAt: "asc" },
    take: 25,
    select: { id: true, adventureId: true, channel: true, destination: true, purpose: true, attempts: true },
  });
  const webhook = process.env.NOTIFICATION_WEBHOOK_URL;
  let delivered = 0;
  let failed = 0;

  for (const notification of pending) {
    const attemptAt = new Date();
    const attempts = notification.attempts + 1;
    if (!webhook || !notification.destination) {
      await prisma.notificationLog.update({ where: { id: notification.id }, data: { attempts, lastAttemptAt: attemptAt, status: "FAILED", errorMessage: "Notification provider is not configured" } });
      failed += 1;
      continue;
    }

    try {
      const response = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.NOTIFICATION_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_SECRET}` } : {}) }, body: JSON.stringify({ adventureId: notification.adventureId, channel: notification.channel, destination: notification.destination, purpose: notification.purpose }) });
      if (!response.ok) throw new Error(`provider returned ${response.status}`);
      await prisma.notificationLog.update({ where: { id: notification.id }, data: { attempts, lastAttemptAt: attemptAt, status: "SENT", sentAt: new Date(), errorMessage: null } });
      delivered += 1;
    } catch (error) {
      await prisma.notificationLog.update({ where: { id: notification.id }, data: { attempts, lastAttemptAt: attemptAt, status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING", errorMessage: error instanceof Error ? error.message : "Notification delivery failed" } });
      failed += 1;
    }
  }

  return { delivered, failed, inspected: pending.length };
}
