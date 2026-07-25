import Link from "next/link";

import { logout } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ContactsPanel } from "@/app/profile/contacts-panel";

export default async function ProfilePage() {
  const user = await requireUser();
  const contacts = await prisma.emergencyContact.findMany({
    where: { ownerUserId: user.id },
    select: { id: true, name: true, phone: true, email: true, isDefault: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/dashboard">
            ← Dashboard
          </Link>
          <form action={logout}>
            <button className="text-sm font-semibold text-slate-600 hover:text-slate-950" type="submit">Sign out</button>
          </form>
        </div>
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Your account</h1>
          <dl className="mt-8 divide-y divide-slate-100">
            <div className="grid gap-1 py-4 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">Name</dt><dd className="text-sm text-slate-950 sm:col-span-2">{user.name}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">Email</dt><dd className="text-sm text-slate-950 sm:col-span-2">{user.email}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">Phone</dt><dd className="text-sm text-slate-950 sm:col-span-2">{user.phone ?? "Not set"}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">Timezone</dt><dd className="text-sm text-slate-950 sm:col-span-2">{user.timezone}</dd></div>
          </dl>
          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Profile editing will be added in a later step. Emergency contacts are ready to use below.</p>
        </div>
        <ContactsPanel initialContacts={contacts} />
      </div>
    </main>
  );
}
