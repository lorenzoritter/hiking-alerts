"use client";

import { useState } from "react";

type Hike = { id: string; title: string };
type Contact = { id: string; name: string; isDefault: boolean };
type Adventure = {
  id: string;
  timezone: string;
  startAt: string;
  expectedReturnAt: string;
  status: string;
  hike: Hike;
  contacts: { contact: { id: string; name: string } }[];
};

type AdventuresPanelProps = { hikes: Hike[]; contacts: Contact[]; initialAdventures: Adventure[]; timezone: string };

function localDateTime(offsetHours: number) {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdventuresPanel({ hikes, contacts, initialAdventures, timezone }: AdventuresPanelProps) {
  const [adventures, setAdventures] = useState(initialAdventures);
  const [hikeId, setHikeId] = useState(hikes[0]?.id ?? "");
  const [startAtLocal, setStartAtLocal] = useState(localDateTime(1));
  const [expectedReturnAtLocal, setExpectedReturnAtLocal] = useState(localDateTime(5));
  const [selectedContacts, setSelectedContacts] = useState<string[]>(contacts.filter((contact) => contact.isDefault).map((contact) => contact.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createAdventure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/adventures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hikeId, startAtLocal, expectedReturnAtLocal, timezone, contactIds: selectedContacts, pingGraceMinutes: 30, alertGraceMinutes: 30 }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error ?? "Unable to create adventure.");
    } else {
      setAdventures((current) => [{ ...body.adventure, contacts: selectedContacts.map((id) => ({ contact: { id, name: contacts.find((contact) => contact.id === id)?.name ?? "Contact" } })) }, ...current]);
    }
    setPending(false);
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Share an adventure</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Set a return time</h2>
      {hikes.length === 0 || contacts.length === 0 ? <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Create a hike and at least one emergency contact before sharing an adventure.</p> : <form className="mt-6 space-y-4" onSubmit={createAdventure}>
        <select className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" value={hikeId} onChange={(event) => setHikeId(event.target.value)}><option value="">Choose a hike</option>{hikes.map((hike) => <option key={hike.id} value={hike.id}>{hike.title}</option>)}</select>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Start time<input className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950" type="datetime-local" value={startAtLocal} onChange={(event) => setStartAtLocal(event.target.value)} required /></label><label className="text-sm font-medium text-slate-700">Expected return<input className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950" type="datetime-local" value={expectedReturnAtLocal} onChange={(event) => setExpectedReturnAtLocal(event.target.value)} required /></label></div>
        <p className="text-xs text-slate-500">Times use {timezone}. Hiker ping: 30 minutes late. Contact alert: 30 minutes after the ping.</p>
        <fieldset><legend className="text-sm font-medium text-slate-700">Emergency contacts</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{contacts.map((contact) => <label className="flex items-center gap-2 text-sm text-slate-700" key={contact.id}><input checked={selectedContacts.includes(contact.id)} onChange={(event) => setSelectedContacts((current) => event.target.checked ? [...current, contact.id] : current.filter((id) => id !== contact.id))} type="checkbox" />{contact.name}</label>)}</div></fieldset>
        <button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating..." : "Create adventure"}</button>
      </form>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {adventures.length > 0 && <div className="mt-8 border-t border-slate-100 pt-6"><h3 className="font-semibold text-slate-950">Your adventures</h3><div className="mt-3 space-y-3">{adventures.map((adventure) => <article className="rounded-xl border border-slate-200 p-4" key={adventure.id}><div className="flex items-center justify-between gap-4"><p className="font-semibold text-slate-950">{adventure.hike.title}</p><span className="text-xs font-semibold uppercase text-emerald-700">{adventure.status}</span></div><p className="mt-1 text-sm text-slate-600">Return {new Date(adventure.expectedReturnAt).toLocaleString()} · {adventure.contacts.map((item) => item.contact.name).join(", ")}</p></article>)}</div></div>}
    </section>
  );
}
