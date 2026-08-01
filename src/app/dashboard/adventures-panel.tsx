"use client";

import { useEffect, useRef, useState } from "react";

import { AdventureCommentsPanel } from "@/app/dashboard/adventure-comments-panel";

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
  comments: { id: string; body: string; createdAt: string; authorUser: { name: string } | null; authorContact: { name: string } | null }[];
};

type AdventuresPanelProps = { hikes: Hike[]; contacts: Contact[]; initialAdventures: Adventure[]; timezone: string };

function localDateTime(offsetHours: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(Date.now() + offsetHours * 60 * 60 * 1000));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function dateTimeParts(offsetHours: number, timezone: string) {
  const value = localDateTime(offsetHours, timezone);
  const [date, time] = value.split("T");
  return { date, time };
}

function isValidTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function updateTime(setTime: (value: string) => void, value: string) {
  if (!/^\d{0,2}:?\d{0,2}$/.test(value)) return;
  const [hours = "", minutes = ""] = value.split(":");
  if ((hours.length === 2 && Number(hours) > 23) || (minutes.length === 2 && Number(minutes) > 59)) return;
  setTime(value);
}

export function AdventuresPanel({ hikes, contacts, initialAdventures, timezone }: AdventuresPanelProps) {
  const [adventures, setAdventures] = useState(initialAdventures);
  const [hikeId, setHikeId] = useState("");
  const [hikeOpen, setHikeOpen] = useState(false);
  const [activeHikeIndex, setActiveHikeIndex] = useState(0);
  const hikeOptions = useRef<(HTMLButtonElement | null)[]>([]);
  const initialReturn = dateTimeParts(5, timezone);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [returnDate, setReturnDate] = useState(initialReturn.date);
  const [returnTime, setReturnTime] = useState(initialReturn.time);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(contacts.filter((contact) => contact.isDefault).map((contact) => contact.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    if (hikeOpen) hikeOptions.current[activeHikeIndex]?.focus();
  }, [activeHikeIndex, hikeOpen]);

  async function createAdventure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    if (!hikeId || !returnDate || !isValidTime(returnTime) || (Boolean(startDate || startTime) && (!startDate || !isValidTime(startTime)))) {
      setError(!hikeId ? "Choose a hike before creating the adventure." : !returnDate || !isValidTime(returnTime) ? "Enter a valid expected return date and time." : "Enter a complete departure date and time, or leave both blank.");
      setPending(false);
      return;
    }
    try {
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
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
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
        <div className="relative text-sm font-medium text-slate-700"><span>Hike</span><button aria-controls="hike-options" aria-expanded={hikeOpen} aria-haspopup="listbox" className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left font-normal text-slate-950" onClick={() => { setActiveHikeIndex(Math.max(0, hikes.findIndex((hike) => hike.id === hikeId))); setHikeOpen((open) => !open); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setHikeOpen(true); } else if (event.key === "Escape") setHikeOpen(false); }} type="button">{hikes.find((hike) => hike.id === hikeId)?.title ?? "Choose a hike"}<span aria-hidden="true">⌄</span></button>{hikeOpen && <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-300 bg-white p-1 text-slate-950 shadow-lg" id="hike-options" role="listbox" aria-label="Choose a hike">{hikes.map((hike, index) => <button aria-selected={hike.id === hikeId} className={`block w-full rounded-lg px-3 py-2 text-left ${hike.id === hikeId ? "bg-emerald-50 font-semibold text-emerald-800" : "hover:bg-slate-50"}`} key={hike.id} onClick={() => { setHikeId(hike.id); setActiveHikeIndex(index); setHikeOpen(false); }} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); const next = (index + (event.key === "ArrowDown" ? 1 : -1) + hikes.length) % hikes.length; setActiveHikeIndex(next); hikeOptions.current[next]?.focus(); } else if (event.key === "Escape") setHikeOpen(false); }} ref={(element) => { hikeOptions.current[index] = element; }} role="option" type="button">{hike.title}</button>)}</div>}</div>
         <div className="grid gap-4 sm:grid-cols-2"><fieldset className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-medium text-slate-700">Departure <span className="font-normal text-slate-500">(optional)</span></legend><div className="grid grid-cols-2 gap-2"><input aria-label="Departure date" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><input aria-label="Departure time (24-hour)" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" inputMode="numeric" maxLength={5} placeholder="18:30" type="text" value={startTime} onChange={(event) => updateTime(setStartTime, event.target.value)} /></div></fieldset><fieldset className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-medium text-slate-700">Expected return</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Expected return date" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} required /><input aria-label="Expected return time (24-hour)" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-950" inputMode="numeric" maxLength={5} placeholder="18:30" type="text" value={returnTime} onChange={(event) => updateTime(setReturnTime, event.target.value)} required /></div></fieldset></div>
        <p className="text-xs text-slate-500">Times use {timezone}. Hiker ping: 30 minutes late. Contact alert: 30 minutes after the ping.</p>
        <fieldset><legend className="text-sm font-medium text-slate-700">Emergency contacts</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{contacts.map((contact) => <label className="flex items-center gap-2 text-sm text-slate-700" key={contact.id}><input checked={selectedContacts.includes(contact.id)} onChange={(event) => setSelectedContacts((current) => event.target.checked ? [...current, contact.id] : current.filter((id) => id !== contact.id))} type="checkbox" />{contact.name}</label>)}</div></fieldset>
         <button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Creating..." : "Create adventure"}</button>
      </form>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {adventures.length > 0 && <div className="mt-8 border-t border-slate-100 pt-6"><h3 className="font-semibold text-slate-950">Your adventures</h3><div className="mt-3 space-y-3">{adventures.map((adventure) => <article className="rounded-xl border border-slate-200 p-4" key={adventure.id}><div className="flex items-center justify-between gap-4"><p className="font-semibold text-slate-950">{adventure.hike.title}</p><span className="text-xs font-semibold uppercase text-emerald-700">{adventure.status}</span></div><p className="mt-1 text-sm text-slate-600">Return {new Date(adventure.expectedReturnAt).toLocaleString()} · {adventure.contacts.map((item) => item.contact.name).join(", ")}</p><p className="mt-2 text-xs text-slate-500">Timeline: {adventure.events.map((event) => event.type.replaceAll("_", " ")).join(" → ") || "created"}</p><div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold"><a className="text-emerald-700" href={`/adventures/${adventure.id}/share`}>Share with contacts →</a>{adventure.status === "ACTIVE" && <a className="text-sky-700" href={`/adventures/${adventure.id}/extend`}>Extend return time →</a>}{adventure.status === "HIKER_PINGED" && <a className="text-amber-700" href={`/adventures/${adventure.id}/acknowledge`}>Acknowledge & extend →</a>}{!["CHECKED_OUT", "RESOLVED_LATE"].includes(adventure.status) && <button className="text-slate-700 disabled:opacity-50" disabled={checkingOut !== null} onClick={() => checkoutAdventure(adventure.id)} type="button">{checkingOut === adventure.id ? "Checking out..." : "Check out"}</button>}</div><AdventureCommentsPanel adventureId={adventure.id} initialComments={adventure.comments} /></article>)}</div></div>}
    </section>
  );
}
