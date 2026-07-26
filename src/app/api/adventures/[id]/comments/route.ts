import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { commentSchema } from "@/lib/comments/definitions";
import { prisma } from "@/lib/prisma";

type CommentsRouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: CommentsRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  const adventure = await prisma.adventure.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!adventure) return NextResponse.json({ error: "Adventure not found" }, { status: 404 });
  const comments = await prisma.alertComment.findMany({ where: { adventureId: id }, orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, authorUser: { select: { name: true } }, authorContact: { select: { name: true } } } });
  return NextResponse.json({ comments });
}

export async function POST(request: Request, context: CommentsRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  const adventure = await prisma.adventure.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!adventure) return NextResponse.json({ error: "Adventure not found" }, { status: 404 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = commentSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Comment must be between 1 and 2,000 characters" }, { status: 400 });
  const comment = await prisma.alertComment.create({ data: { adventureId: id, authorUserId: user.id, body: parsed.data.body }, select: { id: true, body: true, createdAt: true } });
  return NextResponse.json({ comment }, { status: 201 });
}
