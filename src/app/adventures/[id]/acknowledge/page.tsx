import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { AcknowledgeForm } from "@/app/adventures/[id]/acknowledge/acknowledge-form";

type AcknowledgePageProps = { params: Promise<{ id: string }> };

export default async function AcknowledgePage({ params }: AcknowledgePageProps) {
  const user = await requireUser();
  const { id } = await params;
  const adventure = await prisma.adventure.findFirst({ where: { id, userId: user.id, status: "HIKER_PINGED" }, select: { id: true, timezone: true, hike: { select: { title: true } } } });
  if (!adventure) notFound();
  return <AcknowledgeForm adventureId={adventure.id} hikeTitle={adventure.hike.title} timezone={adventure.timezone} />;
}
