import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ContactCommentsPanel } from "@/app/contact/adventures/[token]/comments-panel";

type ContactAdventurePageProps = { params: Promise<{ token: string }> };

function formatInTimeZone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export default async function ContactAdventurePage({ params }: ContactAdventurePageProps) {
  const { token } = await params;
  const link = await prisma.adventureContact.findUnique({
    where: { accessToken: token },
    select: {
      accessTokenExpiresAt: true,
      contact: { select: { name: true } },
      adventure: {
        select: {
          id: true,
          status: true,
          startAt: true,
          expectedReturnAt: true,
          timezone: true,
          hike: { select: { title: true, description: true } },
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!link || !link.accessTokenExpiresAt || link.accessTokenExpiresAt <= new Date()) {
    notFound();
  }

  const adventure = link.adventure;
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Hiking Alerts</p>
        <div className="mt-8 rounded-2xl bg-white p-7 text-slate-950 shadow-xl">
          <p className="text-sm font-semibold text-emerald-700">Shared adventure for {link.contact.name}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{adventure.hike.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-slate-600">{adventure.hike.description}</p>
          <dl className="mt-8 divide-y divide-slate-100">
            <div className="grid gap-1 py-3 sm:grid-cols-2"><dt className="text-sm text-slate-500">Hiker</dt><dd className="font-medium">{adventure.user.name}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-2"><dt className="text-sm text-slate-500">Start</dt><dd className="font-medium">{formatInTimeZone(adventure.startAt, adventure.timezone)} ({adventure.timezone})</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-2"><dt className="text-sm text-slate-500">Expected return</dt><dd className="font-medium">{formatInTimeZone(adventure.expectedReturnAt, adventure.timezone)} ({adventure.timezone})</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-2"><dt className="text-sm text-slate-500">Status</dt><dd className="font-semibold uppercase text-emerald-700">{adventure.status}</dd></div>
          </dl>
          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">This page will show alert updates and coordination comments if the hiker does not check out.</p>
          <ContactCommentsPanel token={token} initialComments={(await prisma.alertComment.findMany({ where: { adventureId: adventure.id }, select: { id: true, body: true, createdAt: true, authorUser: { select: { name: true } }, authorContact: { select: { name: true } } }, orderBy: { createdAt: "asc" } })).map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() }))} />
        </div>
      </div>
    </main>
  );
}
