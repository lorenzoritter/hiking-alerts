import Link from "next/link";

import { logout } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { HikesPanel } from "@/app/dashboard/hikes-panel";
import { AdventuresPanel } from "@/app/dashboard/adventures-panel";

export default async function DashboardPage() {
  const user = await requireUser();
  const hikes = await prisma.hike.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, description: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const [contacts, adventures] = await Promise.all([
    prisma.emergencyContact.findMany({ where: { ownerUserId: user.id }, select: { id: true, name: true, isDefault: true }, orderBy: { name: "asc" } }),
    prisma.adventure.findMany({ where: { userId: user.id }, select: { id: true, timezone: true, startAt: true, expectedReturnAt: true, status: true, hike: { select: { id: true, title: true } }, contacts: { select: { contact: { select: { id: true, name: true } } } }, events: { select: { id: true, type: true, createdAt: true }, orderBy: { createdAt: "asc" } } }, orderBy: { expectedReturnAt: "asc" } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Hiking Alerts
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Good to see you, {user.name}
            </h1>
            <p className="mt-3 text-slate-600">
              Your safety dashboard will live here. Start by setting up your profile and contacts.
            </p>
          </div>
          <form action={logout}>
            <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950" type="submit">
              Sign out
            </button>
          </form>
        </header>
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <Link className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300" href="/profile">
            <p className="text-sm font-semibold text-emerald-700">Profile</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Your account details</h2>
            <p className="mt-2 text-sm text-slate-600">Update your name, phone number, and timezone.</p>
          </Link>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
            <p className="text-sm font-semibold text-slate-500">Coming next</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Emergency contacts</h2>
            <p className="mt-2 text-sm text-slate-600">Add the people who should receive an alert if you do not check out.</p>
          </div>
        </section>
        <HikesPanel initialHikes={hikes.map((hike) => ({ ...hike, createdAt: hike.createdAt.toISOString(), updatedAt: hike.updatedAt.toISOString() }))} />
        <AdventuresPanel hikes={hikes.map((hike) => ({ id: hike.id, title: hike.title }))} contacts={contacts} initialAdventures={adventures.map((adventure) => ({ ...adventure, startAt: adventure.startAt.toISOString(), expectedReturnAt: adventure.expectedReturnAt.toISOString(), events: adventure.events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })) }))} timezone={user.timezone} />
      </div>
    </main>
  );
}
