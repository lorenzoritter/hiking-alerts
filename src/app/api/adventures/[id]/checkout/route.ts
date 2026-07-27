import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { buildNotificationRecords } from "@/lib/sharing/notifications";

type CheckoutRouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: CheckoutRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await prisma.$transaction(async (transaction) => {
    const adventure = await transaction.adventure.findFirst({
      where: { id, userId: user.id, status: { in: ["ACTIVE", "HIKER_PINGED", "CONTACTS_ALERTED"] } },
      select: { status: true, contacts: { select: { contact: { select: { phone: true, email: true } } } } },
    });
    if (!adventure) return null;

    const resolvedLate = adventure.status === "CONTACTS_ALERTED";
    const status = resolvedLate ? "RESOLVED_LATE" : "CHECKED_OUT";
    const eventType = resolvedLate ? "RESOLVED_LATE_STAND_DOWN" : "CHECKED_OUT";
    const updated = await transaction.adventure.updateMany({
      where: { id, userId: user.id, status: adventure.status },
      data: { status, checkedOutAt: new Date() },
    });
    if (updated.count !== 1) return null;

    await transaction.alertEvent.create({ data: { adventureId: id, type: eventType } });
    if (resolvedLate) {
      await transaction.notificationLog.createMany({
        data: buildNotificationRecords(
          adventure.contacts.map((contact) => ({ adventureId: id, phone: contact.contact.phone, email: contact.contact.email })),
          "STAND_DOWN",
        ),
        skipDuplicates: true,
      });
    }
    return { status, standDownQueued: resolvedLate };
  });

  if (!result) {
    return NextResponse.json({ error: "Adventure is missing or no longer active" }, { status: 409 });
  }

  return NextResponse.json(result);
}
