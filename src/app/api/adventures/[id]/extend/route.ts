import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { parseLocalDateTime } from "@/lib/adventures/time";
import { prisma } from "@/lib/prisma";

type ExtendRouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: ExtendRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const expectedReturnAtLocal = typeof payload === "object" && payload !== null && "expectedReturnAtLocal" in payload ? payload.expectedReturnAtLocal : null;
  if (typeof expectedReturnAtLocal !== "string") return NextResponse.json({ error: "Enter a new return time" }, { status: 400 });

  const adventure = await prisma.adventure.findFirst({ where: { id, userId: user.id, status: "ACTIVE" }, select: { timezone: true, expectedReturnAt: true } });
  if (!adventure) return NextResponse.json({ error: "Only active adventures can be extended" }, { status: 409 });
  const newExpectedReturnAt = parseLocalDateTime(expectedReturnAtLocal, adventure.timezone);
  if (!newExpectedReturnAt || newExpectedReturnAt <= adventure.expectedReturnAt || newExpectedReturnAt <= new Date()) return NextResponse.json({ error: "New return time must be later than the current return time and now" }, { status: 400 });

  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.adventure.updateMany({ where: { id, userId: user.id, status: "ACTIVE", expectedReturnAt: adventure.expectedReturnAt }, data: { expectedReturnAt: newExpectedReturnAt } });
    if (result.count !== 1) return false;
    await transaction.alertEvent.create({ data: { adventureId: id, type: "RETURN_TIME_EXTENDED", metadata: { oldExpectedReturnAt: adventure.expectedReturnAt.toISOString(), newExpectedReturnAt: newExpectedReturnAt.toISOString() } } });
    return true;
  });
  if (!updated) return NextResponse.json({ error: "Adventure changed while updating" }, { status: 409 });
  return NextResponse.json({ expectedReturnAt: newExpectedReturnAt });
}
