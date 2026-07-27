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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateInput(date: string) {
  const [year, month, day] = date.split("-");
  return `${day} ${monthNames[Number(month) - 1]} ${year}`;
}

function parseDateInput(value: string) {
  const match = /^(\d{2}) ([A-Za-z]{3}) (\d{4})$/.exec(value);
  if (!match) return null;
  const month = monthNames.indexOf(match[2]);
  const day = Number(match[1]);
  const year = Number(match[3]);
  if (month < 0 || day < 1 || day > new Date(Date.UTC(year, month + 1, 0)).getUTCDate()) return null;
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function AdventuresPanel({ hikes, contacts, initialAdventures, timezone }: AdventuresPanelProps) {
  const [adventures, setAdventures] = useState(initialAdventures);
  const [hikeId, setHikeId] = useState(hikes[0]?.id ?? "");
  const [hikeOpen, setHikeOpen] = useState(false);
  const initialStart = dateTimeParts(1);
  const initialReturn = dateTimeParts(5);
  const [startDate, setStartDate] = useState(formatDateInput(initialStart.date));
  const [startTime, setStartTime] = useState(initialStart.time);
  const [returnDate, setReturnDate] = useState(formatDateInput(initialReturn.date));
  const [returnTime, setReturnTime] = useState(initialReturn.time);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(contacts.filter((contact) => contact.isDefault).map((contact) => contact.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  async function createAdventure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const startDateIso = parseDateInput(startDate);
    const returnDateIso = parseDateInput(returnDate);
    if (!startDateIso || !returnDateIso || !isValidTime(startTime) || !isValidTime(returnTime)) {
      setError("Use dates like 15 Aug 2026 and times like 18:30.");
      setPending(false);
      return;
    }
    const response = await fetch("/api/adventures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hikeId, startAtLocal: `${startDateIso}T${startTime}`, expectedReturnAtLocal: `${returnDateIso}T${returnTime}`, timezone, contactIds: selectedContacts, pingGraceMinutes: 30, alertGraceMinutes: 30 }),
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
        <div className="relative text-sm font-medium text-slate-700"><span>Hike</span><button aria-expanded={hikeOpen} aria-haspopup="listbox" className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left font-normal text-slate-950" onClick={() => setHikeOpen((open) => !open)} type="button">{hikes.find((hike) => hike.id === hikeId)?.title ?? "Choose a hike"}<span aria-hidden="true">⌄</span></button>{hikeOpen && <ul className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-300 bg-white p-1 text-slate-950 shadow-lg" role="listbox">{hikes.map((hike) => <li key={hike.id} role="option" aria-selected={hike.id === hikeId}><button className={`w-full rounded-lg px-3 py-2 text-left ${hike.id === hikeId ? "bg-emerald-50 font-semibold text-emerald-800" : "hover:bg-slate-50"}`} onClick={() => { setHikeId(hike.id); setHikeOpen(false); }} type="button">{hike.title}</button></li>)}</ul>}</div>
        <div className="grid gap-4 sm:grid-cols-2"><fieldset className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-medium text-slate-700">Departure</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Departure date" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" inputMode="numeric" placeholder="15 Aug 2026" type="text" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /><input aria-label="Departure time (24-hour)" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" inputMode="numeric" maxLength={5} placeholder="18:30" type="text" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></div></fieldset><fieldset className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-medium text-slate-700">Expected return</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Expected return date" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" inputMode="numeric" placeholder="15 Aug 2026" type="text" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} required /><input aria-label="Expected return time (24-hour)" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" inputMode="numeric" maxLength={5} placeholder="18:30" type="text" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} required /></div></fieldset></div>
        <p className="text-xs text-slate-500">Times use {timezone}. Hiker ping: 30 minutes late. Contact alert: 30 minutes after the ping.</p>
        <fieldset><legend className="text-sm font-medium text-slate-700">Emergency contacts</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{contacts.map((contact) => <label className="flex items-center gap-2 text-sm text-slate-700" key={contact.id}><input checked={selectedContacts.includes(contact.id)} onChange={(event) => setSelectedContacts((current) => event.target.checked ? [...current, contact.id] : current.filter((id) => id !== contact.id))} type="checkbox" />{contact.name}</label>)}</div></fieldset>
        <button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating..." : "Create adventure"}</button>
      </form>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {adventures.length > 0 && <div className="mt-8 border-t border-slate-100 pt-6"><h3 className="font-semibold text-slate-950">Your adventures</h3><div className="mt-3 space-y-3">{adventures.map((adventure) => <article className="rounded-xl border border-slate-200 p-4" key={adventure.id}><div className="flex items-center justify-between gap-4"><p className="font-semibold text-slate-950">{adventure.hike.title}</p><span className="text-xs font-semibold uppercase text-emerald-700">{adventure.status}</span></div><p className="mt-1 text-sm text-slate-600">Return {new Date(adventure.expectedReturnAt).toLocaleString()} · {adventure.contacts.map((item) => item.contact.name).join(", ")}</p><p className="mt-2 text-xs text-slate-500">Timeline: {adventure.events.map((event) => event.type.replaceAll("_", " ")).join(" → ") || "created"}</p><div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold"><a className="text-emerald-700" href={`/adventures/${adventure.id}/share`}>Share with contacts →</a>{adventure.status === "HIKER_PINGED" && <a className="text-amber-700" href={`/adventures/${adventure.id}/acknowledge`}>Acknowledge & extend →</a>}{!["CHECKED_OUT", "RESOLVED_LATE"].includes(adventure.status) && <button className="text-slate-700 disabled:opacity-50" disabled={checkingOut !== null} onClick={() => checkoutAdventure(adventure.id)} type="button">{checkingOut === adventure.id ? "Checking out..." : "Check out"}</button>}</div></article>)}</div></div>}
    </section>
  );
}
