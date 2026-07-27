"use client";

import { useState } from "react";
import Link from "next/link";

function localParts(value: string) {
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return { date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, time: `${pad(date.getHours())}:${pad(date.getMinutes())}` };
}

export function ExtendReturnTimeForm({ adventureId, hikeTitle, timezone, currentExpectedReturnAt }: { adventureId: string; hikeTitle: string; timezone: string; currentExpectedReturnAt: string }) {
  const current = localParts(currentExpectedReturnAt);
  const [date, setDate] = useState(current.date);
  const [time, setTime] = useState(current.time);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(null);
    try {
      const response = await fetch(`/api/adventures/${adventureId}/extend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedReturnAtLocal: `${date}T${time}` }) });
      const body = await response.json();
      if (!response.ok) setMessage(body.error ?? "Unable to update the return time."); else setDone(true);
    } catch { setMessage("Unable to reach the server."); } finally { setPending(false); }
  }
  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-white"><div className="mx-auto max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Hiking Alerts</p><div className="mt-8 rounded-2xl bg-white p-7 text-slate-950"><p className="text-sm font-semibold text-emerald-700">Update: {hikeTitle}</p><h1 className="mt-3 text-3xl font-semibold">Extend your return time</h1><p className="mt-3 text-slate-600">Current timezone: {timezone}. The new time must be later than the current deadline.</p>{done ? <div className="mt-8"><p className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">Your return time was updated.</p><Link className="mt-6 inline-block font-semibold text-emerald-700" href="/dashboard">Return to dashboard →</Link></div> : <form className="mt-8 space-y-5" onSubmit={submit}><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Date<input className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-950" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="text-sm font-medium">Time<input className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-950" type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label></div>{message && <p className="text-sm text-red-700">{message}</p>}<button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Updating..." : "Update return time"}</button></form>}</div></div></main>;
}
