import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

type ShareRecipient = {
  adventureId: string;
  name: string;
  phone: string | null;
  email: string | null;
  url: string;
};

type ContactRecipient = {
  adventureId: string;
  phone: string | null;
  email: string | null;
};

export type NotificationPurpose = "SHARE" | "STAND_DOWN";

export function maskDestination(destination: string, channel: "SMS" | "EMAIL") {
  if (channel === "SMS") {
    return `***${destination.slice(-4)}`;
  }

  const [localPart, domain] = destination.split("@", 2);
  return `${localPart?.slice(0, 1) ?? "*"}***@${domain ?? "unknown"}`;
}

function deliveryKey(adventureId: string, channel: "SMS" | "EMAIL", destination: string, purpose: NotificationPurpose) {
  return createHash("sha256")
    .update(`${adventureId}:${purpose}:${channel}:${destination}`)
    .digest("hex");
}

export function buildNotificationRecords(recipients: ContactRecipient[], purpose: NotificationPurpose) {
  return recipients.flatMap((recipient) => {
      const channels = [];
      if (recipient.phone) channels.push({ channel: "SMS" as const, recipient: recipient.phone });
      if (recipient.email) channels.push({ channel: "EMAIL" as const, recipient: recipient.email });
      return channels.map(({ channel, recipient: destination }) => ({
        adventureId: recipient.adventureId,
        channel,
        recipient: maskDestination(destination, channel),
        purpose,
        status: "PENDING" as const,
        deliveryKey: deliveryKey(recipient.adventureId, channel, destination, purpose),
      }));
    });
}

export async function queueContactNotifications(recipients: ContactRecipient[], purpose: NotificationPurpose = "SHARE") {
  await prisma.notificationLog.createMany({
    data: buildNotificationRecords(recipients, purpose),
    skipDuplicates: true,
  });
}

export async function queueShareNotifications(recipients: ShareRecipient[]) {
  return queueContactNotifications(recipients);
}
