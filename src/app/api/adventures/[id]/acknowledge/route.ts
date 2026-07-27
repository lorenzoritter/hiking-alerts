import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { acknowledgeSchema } from "@/lib/adventures/acknowledge";
import { parseLocalDateTime } from "@/lib/adventures/time";
import { prisma } from "@/lib/prisma";

type AcknowledgeRouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: AcknowledgeRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = acknowledgeSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid new return time" }, { status: 400 });

  const adventure = await prisma.adventure.findFirst({ where: { id, userId: user.id, status: "HIKER_PINGED" }, select: { timezone: true, expectedReturnAt: true } });
  if (!adventure) return NextResponse.json({ error: "Adventure is not awaiting acknowledgement" }, { status: 409 });
  const expectedReturnAt = parseLocalDateTime(parsed.data.expectedReturnAtLocal, adventure.timezone);
  if (!expectedReturnAt || expectedReturnAt <= new Date()) return NextResponse.json({ error: "New return time must be a valid future time" }, { status: 400 });

  const result = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.adventure.updateMany({ where: { id, userId: user.id, status: "HIKER_PINGED" }, data: { status: "ACTIVE", expectedReturnAt } });
    if (updated.count !== 1) return false;
    await transaction.alertEvent.create({ data: { adventureId: id, type: "ACKNOWLEDGED_EXTENDED", metadata: { oldExpectedReturnAt: adventure.expectedReturnAt.toISOString(), newExpectedReturnAt: expectedReturnAt.toISOString() } } });
    return true;
  });
  if (!result) return NextResponse.json({ error: "Adventure changed while acknowledging" }, { status: 409 });
  return NextResponse.json({ status: "ACTIVE", expectedReturnAt });
}
