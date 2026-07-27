"use client";

import { useState } from "react";

type Hike = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type HikesPanelProps = { initialHikes: Hike[] };

export function HikesPanel({ initialHikes }: HikesPanelProps) {
  const [hikes, setHikes] = useState(initialHikes);
  const [form, setForm] = useState({ title: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveHike(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const url = editingId ? `/api/hikes/${editingId}` : "/api/hikes";
    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setError(body?.error ?? "Unable to save hike.");
    } else if (editingId) {
      setHikes((current) => current.map((hike) => (hike.id === editingId ? body.hike : hike)));
      setEditingId(null);
      setForm({ title: "", description: "" });
    } else {
      setHikes((current) => [body.hike, ...current]);
      setForm({ title: "", description: "" });
    }
    setPending(false);
  }

  async function deleteHike(id: string) {
    setError(null);
    const response = await fetch(`/api/hikes/${id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error ?? "Unable to delete hike.");
      return;
    }
    setHikes((current) => current.filter((hike) => hike.id !== id));
  }

  function beginEdit(hike: Hike) {
    setEditingId(hike.id);
    setForm({ title: hike.title, description: hike.description });
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Your plans</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Hikes</h2>
      <p className="mt-2 text-sm text-slate-600">Keep simple text descriptions ready to share as adventures.</p>
      <div className="mt-6 space-y-3">
        {hikes.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">No hikes planned yet.</p>}
        {hikes.map((hike) => (
          <article className="rounded-xl border border-slate-200 p-4" key={hike.id}>
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="font-semibold text-slate-950">{hike.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{hike.description}</p></div>
              <div className="flex shrink-0 gap-3 text-sm font-semibold"><button className="text-emerald-700 hover:text-emerald-800" onClick={() => beginEdit(hike)} type="button">Edit</button><button className="text-red-700 hover:text-red-800" onClick={() => deleteHike(hike.id)} type="button">Delete</button></div>
            </div>
          </article>
        ))}
      </div>
      <form className="mt-7 space-y-4 border-t border-slate-100 pt-6" onSubmit={saveHike}>
        <input className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="Hike title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        <textarea className="block min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="Describe the route, terrain, and anything your contacts should know." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        <div className="flex gap-3"><button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving..." : editingId ? "Update hike" : "Save hike"}</button>{editingId && <button className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700" onClick={() => { setEditingId(null); setForm({ title: "", description: "" }); }} type="button">Cancel</button>}</div>
      </form>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </section>
  );
}
