import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { contactUpdateSchema } from "@/lib/contacts/definitions";

type ContactRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: ContactRouteContext) {
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

  const parsed = contactUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid contact", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.emergencyContact.findFirst({
    where: { id, ownerUserId: user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { name, phone, email, isDefault } = parsed.data;
  const contact = await prisma.$transaction(async (transaction) => {
    if (isDefault) {
      await transaction.emergencyContact.updateMany({
        where: { ownerUserId: user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return transaction.emergencyContact.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email ? email.toLowerCase() : null }),
        ...(isDefault !== undefined && { isDefault }),
      },
      select: { id: true, name: true, phone: true, email: true, isDefault: true },
    });
  });

  return NextResponse.json({ contact });
}

export async function DELETE(_request: Request, context: ContactRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  const activeAdventureLink = await prisma.adventureContact.findFirst({
    where: {
      contactId: id,
      adventure: { userId: user.id, status: { notIn: ["CHECKED_OUT", "RESOLVED_LATE"] } },
    },
    select: { id: true },
  });
  if (activeAdventureLink) {
    return NextResponse.json({ error: "This contact cannot be removed while linked to an active adventure." }, { status: 409 });
  }
  const deleted = await prisma.emergencyContact.deleteMany({
    where: { id, ownerUserId: user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
