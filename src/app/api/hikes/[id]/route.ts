import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { hikeUpdateSchema } from "@/lib/hikes/definitions";

type HikeRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: HikeRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = hikeUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid hike", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.hike.updateMany({
    where: { id, userId: user.id },
    data: parsed.data,
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Hike not found" }, { status: 404 });
  }

  const hike = await prisma.hike.findUniqueOrThrow({
    where: { id },
     select: { id: true, title: true, description: true, location: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ hike });
}

export async function DELETE(_request: Request, context: HikeRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const deleted = await prisma.hike.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Hike not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json(
      { error: "This hike cannot be deleted while it is used by an adventure." },
      { status: 409 },
    );
  }

  return new Response(null, { status: 204 });
}
