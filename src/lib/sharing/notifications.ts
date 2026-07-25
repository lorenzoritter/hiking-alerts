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

function maskDestination(destination: string, channel: "SMS" | "EMAIL") {
  if (channel === "SMS") {
    return `***${destination.slice(-4)}`;
  }

  const [localPart, domain] = destination.split("@", 2);
  return `${localPart?.slice(0, 1) ?? "*"}***@${domain ?? "unknown"}`;
}

function deliveryKey(adventureId: string, channel: "SMS" | "EMAIL", destination: string) {
  return createHash("sha256")
    .update(`${adventureId}:${channel}:${destination}`)
    .digest("hex");
}

export async function queueShareNotifications(recipients: ShareRecipient[]) {
  const pendingLogs = await prisma.notificationLog.findMany({
    where: { adventureId: recipients[0]?.adventureId, status: "PENDING" },
    select: { channel: true, recipient: true },
  });
  const pendingKeys = new Set(pendingLogs.map((log) => `${log.channel}:${log.recipient}`));

  await prisma.notificationLog.createMany({
    data: recipients.flatMap((recipient) => {
      const channels = [];
      if (recipient.phone) channels.push({ channel: "SMS" as const, recipient: recipient.phone });
      if (recipient.email) channels.push({ channel: "EMAIL" as const, recipient: recipient.email });
      return channels.filter(({ channel, recipient: destination }) => !pendingKeys.has(`${channel}:${maskDestination(destination, channel)}`)).map(({ channel, recipient: destination }) => ({
        adventureId: recipient.adventureId,
        channel,
        recipient: maskDestination(destination, channel),
        status: "PENDING" as const,
        deliveryKey: deliveryKey(recipient.adventureId, channel, destination),
      }));
    }),
  });
}
