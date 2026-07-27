import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { queueShareNotifications } from "@/lib/sharing/notifications";

type ShareRouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: ShareRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  const adventure = await prisma.adventure.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
    contacts: {
        select: {
          accessToken: true,
          accessTokenExpiresAt: true,
          contact: { select: { name: true, phone: true, email: true } },
        },
      },
    },
  });

  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found" }, { status: 404 });
  }

  const configuredOrigin = process.env.PUBLIC_APP_URL;
  if (!configuredOrigin || !/^https?:\/\//.test(configuredOrigin)) {
    return NextResponse.json({ error: "PUBLIC_APP_URL is not configured" }, { status: 503 });
  }
  const origin = configuredOrigin.replace(/\/$/, "");
  const recipients = adventure.contacts.map((link) => ({
    adventureId: adventure.id,
    name: link.contact.name,
    phone: link.contact.phone,
    email: link.contact.email,
    url: `${origin}/contact/adventures/${link.accessToken}`,
  }));
  await queueShareNotifications(recipients);
  const notifications = await prisma.notificationLog.findMany({
    where: { adventureId: id, purpose: "SHARE" },
    select: { id: true, channel: true, recipient: true, status: true, errorMessage: true, sentAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    links: recipients.map(({ name, phone, email, url }, index) => ({
      name,
      phone,
      email,
      url,
      expiresAt: adventure.contacts[index]?.accessTokenExpiresAt,
    })),
    notificationStatus: "queued",
    notifications,
  });
}
