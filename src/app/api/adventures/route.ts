import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { adventureSchema } from "@/lib/adventures/definitions";
import { parseLocalDateTime, isValidTimeZone } from "@/lib/adventures/time";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const adventures = await prisma.adventure.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      timezone: true,
      startAt: true,
      expectedReturnAt: true,
      pingGraceMinutes: true,
      alertGraceMinutes: true,
      status: true,
      hike: { select: { id: true, title: true } },
      contacts: { select: { contact: { select: { id: true, name: true } } } },
    },
    orderBy: { expectedReturnAt: "asc" },
  });

  return NextResponse.json({ adventures });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adventureSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid adventure", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (!isValidTimeZone(data.timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  const startAt = data.startAtLocal ? parseLocalDateTime(data.startAtLocal, data.timezone) : null;
  const expectedReturnAt = parseLocalDateTime(data.expectedReturnAtLocal, data.timezone);
  if (!expectedReturnAt || (data.startAtLocal && !startAt)) {
    return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
  }
  if (startAt && startAt >= expectedReturnAt) {
    return NextResponse.json({ error: "Expected return must be after the start time" }, { status: 400 });
  }
  if (expectedReturnAt <= new Date()) {
    return NextResponse.json({ error: "Expected return must be in the future" }, { status: 400 });
  }

  const hike = await prisma.hike.findFirst({ where: { id: data.hikeId, userId: user.id }, select: { id: true } });
  if (!hike) {
    return NextResponse.json({ error: "Hike not found" }, { status: 404 });
  }

  const contacts = await prisma.emergencyContact.findMany({
    where: { id: { in: data.contactIds }, ownerUserId: user.id },
    select: { id: true },
  });
  if (contacts.length !== data.contactIds.length) {
    return NextResponse.json({ error: "One or more contacts were not found" }, { status: 400 });
  }

  const adventure = await prisma.adventure.create({
    data: {
      userId: user.id,
      hikeId: hike.id,
      timezone: data.timezone,
      ...(startAt ? { startAt } : {}),
      expectedReturnAt,
      pingGraceMinutes: data.pingGraceMinutes,
      alertGraceMinutes: data.alertGraceMinutes,
      contacts: {
        create: data.contactIds.map((contactId) => ({
          contactId,
          accessToken: crypto.randomUUID(),
          accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })),
      },
    },
    select: {
      id: true,
      status: true,
      startAt: true,
      expectedReturnAt: true,
      timezone: true,
      hike: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ adventure }, { status: 201 });
}
