import { createHash } from "node:crypto";

type NotificationPurpose = "HIKER_PING" | "CONTACT_ALERT";
type Recipient = { adventureId: string; phone: string | null; email: string | null };

function maskDestination(destination: string, channel: "SMS" | "EMAIL") {
  if (channel === "SMS") return `***${destination.slice(-4)}`;
  const [localPart, domain] = destination.split("@", 2);
  return `${localPart?.slice(0, 1) ?? "*"}***@${domain ?? "unknown"}`;
}

function deliveryKey(adventureId: string, purpose: NotificationPurpose, channel: string, destination: string) {
  return createHash("sha256").update(`${adventureId}:${purpose}:${channel}:${destination}`).digest("hex");
}

export function buildNotificationRecords(recipients: Recipient[], purpose: NotificationPurpose) {
  return recipients.flatMap((recipient) => {
    const channels = [];
    if (recipient.phone) channels.push({ channel: "SMS" as const, destination: recipient.phone });
    if (recipient.email) channels.push({ channel: "EMAIL" as const, destination: recipient.email });
    return channels.map(({ channel, destination }) => ({
      adventureId: recipient.adventureId,
      channel,
      recipient: maskDestination(destination, channel),
      purpose,
      status: "PENDING" as const,
      deliveryKey: deliveryKey(recipient.adventureId, purpose, channel, destination),
    }));
  });
}
