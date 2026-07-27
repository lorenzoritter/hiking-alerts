import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ExtendReturnTimeForm } from "@/app/adventures/[id]/extend/extend-return-time-form";

type ExtendPageProps = { params: Promise<{ id: string }> };

export default async function ExtendPage({ params }: ExtendPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const adventure = await prisma.adventure.findFirst({ where: { id, userId: user.id, status: "ACTIVE" }, select: { id: true, timezone: true, expectedReturnAt: true, hike: { select: { title: true } } } });
  if (!adventure) notFound();
  return <ExtendReturnTimeForm adventureId={adventure.id} hikeTitle={adventure.hike.title} timezone={adventure.timezone} currentExpectedReturnAt={adventure.expectedReturnAt.toISOString()} />;
}
