import { NextResponse } from "next/server";

import { commentSchema } from "@/lib/comments/definitions";
import { prisma } from "@/lib/prisma";

type ContactCommentsContext = { params: Promise<{ token: string }> };

async function getValidLink(token: string) {
  return prisma.adventureContact.findUnique({ where: { accessToken: token }, select: { contactId: true, adventureId: true, accessTokenExpiresAt: true } });
}

export async function GET(_request: Request, context: ContactCommentsContext) {
  const { token } = await context.params;
  const link = await getValidLink(token);
  if (!link || !link.accessTokenExpiresAt || link.accessTokenExpiresAt <= new Date()) return NextResponse.json({ error: "Link expired or not found" }, { status: 404 });
  const comments = await prisma.alertComment.findMany({ where: { adventureId: link.adventureId }, orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, authorUser: { select: { name: true } }, authorContact: { select: { name: true } } } });
  return NextResponse.json({ comments });
}

export async function POST(request: Request, context: ContactCommentsContext) {
  const { token } = await context.params;
  const link = await getValidLink(token);
  if (!link || !link.accessTokenExpiresAt || link.accessTokenExpiresAt <= new Date()) return NextResponse.json({ error: "Link expired or not found" }, { status: 404 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = commentSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Comment must be between 1 and 2,000 characters" }, { status: 400 });
  const comment = await prisma.alertComment.create({ data: { adventureId: link.adventureId, authorContactId: link.contactId, body: parsed.data.body }, select: { id: true, body: true, createdAt: true } });
  return NextResponse.json({ comment }, { status: 201 });
}
