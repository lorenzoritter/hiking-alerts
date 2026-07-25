import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/contacts/definitions";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const contacts = await prisma.emergencyContact.findMany({
    where: { ownerUserId: user.id },
    select: { id: true, name: true, phone: true, email: true, isDefault: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ contacts });
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

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid contact", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, phone, email, isDefault } = parsed.data;
  const contact = await prisma.$transaction(async (transaction) => {
    if (isDefault) {
      await transaction.emergencyContact.updateMany({
        where: { ownerUserId: user.id },
        data: { isDefault: false },
      });
    }

    return transaction.emergencyContact.create({
      data: {
        ownerUserId: user.id,
        name,
        phone: phone || null,
        email: email?.toLowerCase() || null,
        isDefault,
      },
      select: { id: true, name: true, phone: true, email: true, isDefault: true },
    });
  });

  return NextResponse.json({ contact }, { status: 201 });
}
