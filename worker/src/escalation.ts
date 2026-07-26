import { buildNotificationRecords } from "./notifications.js";
import { prisma } from "./prisma.js";
import { getEscalationTransition } from "./state.js";

export async function scanOverdueAdventures(now = new Date()) {
  const adventures = await prisma.adventure.findMany({
    where: { status: { in: ["ACTIVE", "HIKER_PINGED"] } },
    select: {
      id: true,
      status: true,
      expectedReturnAt: true,
      pingGraceMinutes: true,
      alertGraceMinutes: true,
      user: { select: { phone: true, email: true } },
      contacts: { select: { contact: { select: { phone: true, email: true } } } },
    },
  });
  let hikerPings = 0;
  let contactAlerts = 0;

  for (const adventure of adventures) {
    const transition = getEscalationTransition(adventure, now);
    if (transition?.status === "HIKER_PINGED") {
      const transitioned = await prisma.$transaction(async (transaction) => {
        const result = await transaction.adventure.updateMany({
          where: { id: adventure.id, status: "ACTIVE" },
          data: { status: "HIKER_PINGED" },
        });
        if (result.count !== 1) return false;
        await transaction.alertEvent.create({ data: { adventureId: adventure.id, type: "HIKER_PINGED", metadata: { effectiveDeadline: transition.effectiveDeadline.toISOString(), expectedReturnAt: adventure.expectedReturnAt.toISOString(), pingGraceMinutes: adventure.pingGraceMinutes, scannedAt: now.toISOString() } } });
        const records = buildNotificationRecords([{ adventureId: adventure.id, phone: adventure.user.phone, email: adventure.user.email }], "HIKER_PING");
        if (records.length > 0) await transaction.notificationLog.createMany({ data: records, skipDuplicates: true });
        return true;
      });
      if (transitioned) hikerPings += 1;
    }

    if (transition?.status === "CONTACTS_ALERTED") {
      const transitioned = await prisma.$transaction(async (transaction) => {
        const result = await transaction.adventure.updateMany({
          where: { id: adventure.id, status: "HIKER_PINGED" },
          data: { status: "CONTACTS_ALERTED" },
        });
        if (result.count !== 1) return false;
        await transaction.alertEvent.create({ data: { adventureId: adventure.id, type: "CONTACTS_ALERTED", metadata: { effectiveDeadline: transition.effectiveDeadline.toISOString(), expectedReturnAt: adventure.expectedReturnAt.toISOString(), pingGraceMinutes: adventure.pingGraceMinutes, alertGraceMinutes: adventure.alertGraceMinutes, scannedAt: now.toISOString() } } });
        const records = buildNotificationRecords(adventure.contacts.map((contact) => ({ adventureId: adventure.id, phone: contact.contact.phone, email: contact.contact.email })), "CONTACT_ALERT");
        if (records.length > 0) await transaction.notificationLog.createMany({ data: records, skipDuplicates: true });
        return true;
      });
      if (transitioned) contactAlerts += 1;
    }
  }

  return { scanned: adventures.length, hikerPings, contactAlerts };
}
