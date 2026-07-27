"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SharePageProps = { params: Promise<{ id: string }> };

export default function ShareAdventurePage({ params }: SharePageProps) {
  const [id, setId] = useState<string | null>(null);
  const [links, setLinks] = useState<{ name: string; phone: string | null; email: string | null; url: string }[]>([]);
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
        })
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setPending(false));
    });
  }, [params]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10"><div className="mx-auto max-w-2xl"><Link className="text-sm font-semibold text-emerald-700" href="/dashboard">← Dashboard</Link><h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:mt-8 sm:text-4xl">Share your adventure</h1><p className="mt-3 text-slate-600">Send each contact their private status link. The links expire after 30 days.</p>{pending && <p className="mt-8 text-slate-600">Preparing links...</p>}{error && <p className="mt-8 text-red-700">{error}</p>}<div className="mt-8 space-y-4">{links.map((link) => <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" key={link.url}><p className="font-semibold text-slate-950">{link.name}</p><p className="mt-1 break-all text-xs text-slate-500">{link.phone ?? link.email ?? "No notification destination configured"}</p><input aria-label={`Share link for ${link.name}`} className="mt-4 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" readOnly value={link.url} /></div>)}</div>{id && <p className="mt-8 text-sm text-slate-500">Notification delivery is recorded for follow-up. Configure SMS/email providers before relying on automated delivery.</p>}</div></main>
  );
}
