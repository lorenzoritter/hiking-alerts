"use client";

import { useState } from "react";

type Hike = { id: string; title: string };
type Contact = { id: string; name: string; isDefault: boolean };
type Adventure = {
  id: string;
  timezone: string;
  startAt: string | null;
  expectedReturnAt: string;
  status: string;
  hike: Hike;
  contacts: { contact: { id: string; name: string } }[];
  events: { id: string; type: string; createdAt: string }[];
};

type AdventuresPanelProps = { hikes: Hike[]; contacts: Contact[]; initialAdventures: Adventure[]; timezone: string };

function localDateTime(offsetHours: number) {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateTimeParts(offsetHours: number) {
  const value = localDateTime(offsetHours);
  const [date, time] = value.split("T");
  return { date, time };
}

function formatPreview(date: string, time: string) {
  if (!date || !time) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(`${date}T${time}:00Z`));
}

export function AdventuresPanel({ hikes, contacts, initialAdventures, timezone }: AdventuresPanelProps) {
  const [adventures, setAdventures] = useState(initialAdventures);
  const [hikeId, setHikeId] = useState(hikes[0]?.id ?? "");
  const initialStart = dateTimeParts(1);
  const initialReturn = dateTimeParts(5);
  const [startDate, setStartDate] = useState(initialStart.date);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [returnDate, setReturnDate] = useState(initialReturn.date);
  const [returnTime, setReturnTime] = useState(initialReturn.time);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(contacts.filter((contact) => contact.isDefault).map((contact) => contact.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  async function createAdventure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/adventures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hikeId, startAtLocal: startDate && startTime ? `${startDate}T${startTime}` : undefined, expectedReturnAtLocal: `${returnDate}T${returnTime}`, timezone, contactIds: selectedContacts, pingGraceMinutes: 30, alertGraceMinutes: 30 }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error ?? "Unable to create adventure.");
    } else {
      setAdventures((current) => [{ ...body.adventure, events: [], contacts: selectedContacts.map((id) => ({ contact: { id, name: contacts.find((contact) => contact.id === id)?.name ?? "Contact" } })) }, ...current]);
    }
    setPending(false);
  }

  async function checkoutAdventure(id: string) {
    setError(null);
    setCheckingOut(id);
    try {
      const response = await fetch(`/api/adventures/${id}/checkout`, { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "Unable to check out.");
        return;
      }
      setAdventures((current) => current.map((adventure) => adventure.id === id ? { ...adventure, status: body.status } : adventure));
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Share an adventure</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Set a return time</h2>
      {hikes.length === 0 || contacts.length === 0 ? <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Create a hike and at least one emergency contact before sharing an adventure.</p> : <form className="mt-6 space-y-4" onSubmit={createAdventure}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Hike<select className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950" value={hikeId} onChange={(event) => setHikeId(event.target.value)} required><option value="">Choose a hike</option>{hikes.map((hike) => <option key={hike.id} value={hike.id}>{hike.title}</option>)}</select></label><fieldset className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-medium text-slate-700">Departure <span className="font-normal text-slate-500">(optional)</span></legend><div className="grid grid-cols-2 gap-2"><input aria-label="Departure date" className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><input aria-label="Departure time" className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></div><p className="mt-2 text-xs text-slate-500">{formatPreview(startDate, startTime)}</p></fieldset><fieldset className="rounded-xl border border-slate-200 p-3 sm:col-span-2"><legend className="px-1 text-sm font-medium text-slate-700">Expected return</legend><div className="grid gap-2 sm:grid-cols-2"><input aria-label="Expected return date" className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} required /><input aria-label="Expected return time" className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" type="time" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} required /></div><p className="mt-2 text-xs text-slate-500">{formatPreview(returnDate, returnTime)}</p></fieldset></div>
        <p className="text-xs text-slate-500">Times use {timezone}. Hiker ping: 30 minutes late. Contact alert: 30 minutes after the ping.</p>
        <fieldset><legend className="text-sm font-medium text-slate-700">Emergency contacts</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{contacts.map((contact) => <label className="flex items-center gap-2 text-sm text-slate-700" key={contact.id}><input checked={selectedContacts.includes(contact.id)} onChange={(event) => setSelectedContacts((current) => event.target.checked ? [...current, contact.id] : current.filter((id) => id !== contact.id))} type="checkbox" />{contact.name}</label>)}</div></fieldset>
        <button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating..." : "Create adventure"}</button>
      </form>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {adventures.length > 0 && <div className="mt-8 border-t border-slate-100 pt-6"><h3 className="font-semibold text-slate-950">Your adventures</h3><div className="mt-3 space-y-3">{adventures.map((adventure) => <article className="rounded-xl border border-slate-200 p-4" key={adventure.id}><div className="flex items-center justify-between gap-4"><p className="font-semibold text-slate-950">{adventure.hike.title}</p><span className="text-xs font-semibold uppercase text-emerald-700">{adventure.status}</span></div><p className="mt-1 text-sm text-slate-600">Return {new Date(adventure.expectedReturnAt).toLocaleString()} · {adventure.contacts.map((item) => item.contact.name).join(", ")}</p><p className="mt-2 text-xs text-slate-500">Timeline: {adventure.events.map((event) => event.type.replaceAll("_", " ")).join(" → ") || "created"}</p><div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold"><a className="text-emerald-700" href={`/adventures/${adventure.id}/share`}>Share with contacts →</a>{adventure.status === "HIKER_PINGED" && <a className="text-amber-700" href={`/adventures/${adventure.id}/acknowledge`}>Acknowledge & extend →</a>}{!["CHECKED_OUT", "RESOLVED_LATE"].includes(adventure.status) && <button className="text-slate-700 disabled:opacity-50" disabled={checkingOut !== null} onClick={() => checkoutAdventure(adventure.id)} type="button">{checkingOut === adventure.id ? "Checking out..." : "Check out"}</button>}</div></article>)}</div></div>}
    </section>
  );
}
