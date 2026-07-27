"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SharePageProps = { params: Promise<{ id: string }> };

export default function ShareAdventurePage({ params }: SharePageProps) {
  const [id, setId] = useState<string | null>(null);
  const [links, setLinks] = useState<{ name: string; phone: string | null; email: string | null; url: string }[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; channel: string; recipient: string; status: string; errorMessage: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    params.then(({ id: adventureId }) => {
      setId(adventureId);
      fetch(`/api/adventures/${adventureId}/share`, { method: "POST" })
        .then(async (response) => {
          const body = await response.json();
           if (!response.ok) throw new Error(body.error ?? "Unable to create share links.");
           setLinks(body.links);
           setNotifications(body.notifications);
        })
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setPending(false));
    });
  }, [params]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10"><div className="mx-auto max-w-2xl"><Link className="text-sm font-semibold text-emerald-700" href="/dashboard">← Dashboard</Link><h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Share your adventure</h1><p className="mt-3 text-slate-600">Send each contact their private status link. The links expire after 30 days.</p>{pending && <p className="mt-8 text-slate-600">Preparing links...</p>}{error && <p aria-live="assertive" className="mt-8 text-red-700" role="alert">{error}</p>}<div className="mt-8 space-y-4">{links.map((link) => <div className="rounded-2xl border border-slate-200 bg-white p-5" key={link.url}><p className="font-semibold text-slate-950">{link.name}</p><p className="mt-1 text-xs text-slate-500">{link.phone ?? link.email ?? "No notification destination configured"}</p><label className="sr-only" htmlFor={`share-url-${link.url}`}>Share link for {link.name}</label><input className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" id={`share-url-${link.url}`} readOnly value={link.url} /></div>)}</div>{notifications.length > 0 && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Notification delivery</h2><p className="mt-1 text-xs text-slate-500">Snapshot recorded when these links were prepared.</p><ul className="mt-3 space-y-2">{notifications.map((notification) => <li className="flex items-center justify-between gap-4 text-sm" key={notification.id}><span className="text-slate-600">{notification.channel} · {notification.recipient}</span><span className={notification.status === "FAILED" ? "font-semibold text-red-700" : notification.status === "SENT" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{notification.status === "PENDING" ? "queued" : notification.status.toLowerCase()}{notification.errorMessage ? `: ${notification.errorMessage}` : ""}</span></li>)}</ul></section>}{id && <p className="mt-8 text-sm text-slate-500">Delivery status is recorded for follow-up. Configure SMS/email providers before relying on automated delivery.</p>}</div></main>
  );
}
