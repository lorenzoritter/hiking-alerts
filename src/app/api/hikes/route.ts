import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { hikeSchema } from "@/lib/hikes/definitions";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const hikes = await prisma.hike.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, description: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ hikes });
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

  const parsed = hikeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid hike", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const hike = await prisma.hike.create({
    data: { ...parsed.data, userId: user.id },
    select: { id: true, title: true, description: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ hike }, { status: 201 });
}
