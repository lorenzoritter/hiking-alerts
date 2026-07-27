"use client";

import { useState } from "react";
import Link from "next/link";

export function AcknowledgeForm({ adventureId, hikeTitle, timezone }: { adventureId: string; hikeTitle: string; timezone: string }) {
  const [expectedReturnAtLocal, setExpectedReturnAtLocal] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(null);
    try {
      const response = await fetch(`/api/adventures/${adventureId}/acknowledge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedReturnAtLocal }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) setMessage(body?.error ?? "Unable to update the return time."); else setDone(true);
    } catch { setMessage("Unable to reach the server. Please try again."); } finally { setPending(false); }
  }
  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-white"><div className="mx-auto max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Hiking Alerts</p><div className="mt-8 rounded-2xl bg-white p-7 text-slate-950"><p className="text-sm font-semibold text-amber-700">Still hiking: {hikeTitle}</p><h1 className="mt-3 text-3xl font-semibold">Choose a new return time</h1><p className="mt-3 text-slate-600">Acknowledge the check-in by committing to a concrete new deadline. Timezone: {timezone}</p>{done ? <div className="mt-8"><p className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">Your return time was updated. Remember to check out when you are safe.</p><Link className="mt-6 inline-block font-semibold text-emerald-700" href="/dashboard">Return to dashboard →</Link></div> : <form className="mt-8 space-y-5" onSubmit={submit}><label className="block text-sm font-medium">New expected return time<input className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" type="datetime-local" value={expectedReturnAtLocal} onChange={(event) => setExpectedReturnAtLocal(event.target.value)} required /></label>{message && <p className="text-sm text-red-700">{message}</p>}<button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Updating..." : "Acknowledge & extend"}</button></form>}</div></div></main>;
}
