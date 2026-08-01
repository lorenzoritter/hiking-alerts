import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
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
    select: { id: true, title: true, description: true, createdAt: true, updatedAt: true },
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "This hike cannot be deleted while it is used by an adventure." },
        { status: 409 },
      );
    }
    console.error("Hike deletion failed", { type: error instanceof Error ? error.name : typeof error });
    return NextResponse.json({ error: "Unable to delete hike right now." }, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
