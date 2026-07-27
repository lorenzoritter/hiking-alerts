"use client";

import { useState } from "react";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
};

type ContactsPanelProps = { initialContacts: Contact[] };

export function ContactsPanel({ initialContacts }: ContactsPanelProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [form, setForm] = useState({ name: "", phone: "", email: "", isDefault: true });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function addContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? "Unable to add contact.");
      } else {
        setContacts((current) => [
          body.contact,
          ...current.map((contact) => ({ ...contact, isDefault: form.isDefault ? false : contact.isDefault })),
        ]);
        setForm({ name: "", phone: "", email: "", isDefault: true });
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function removeContact(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Unable to remove contact.");
        return;
      }
      setContacts((current) => current.filter((contact) => contact.id !== id));
    } catch {
      setError("Unable to reach the server. Please try again.");
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Safety network</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Emergency contacts</h2>
      <p className="mt-2 text-sm text-slate-600">These people can be selected when you share an adventure.</p>
      <div className="mt-6 space-y-3">
        {contacts.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">No contacts added yet.</p>}
        {contacts.map((contact) => (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3" key={contact.id}>
            <div>
              <p className="font-semibold text-slate-950">{contact.name}{contact.isDefault && <span className="ml-2 text-xs font-medium text-emerald-700">Default</span>}</p>
              <p className="text-sm text-slate-500">{contact.phone ?? contact.email}</p>
            </div>
            <button className="text-sm font-semibold text-red-700 hover:text-red-800" onClick={() => removeContact(contact.id)} type="button">Remove</button>
          </div>
        ))}
      </div>
      <form className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2" onSubmit={addContact}>
        <input className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <p className="text-sm text-slate-600 sm:col-span-2">Add at least one way to reach this contact: phone or email.</p>
        <input aria-label="Phone number (optional if email is provided)" className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="Phone number" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input aria-label="Email address (optional if phone is provided)" className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-700"><input checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} type="checkbox" /> Make default contact</label>
        <button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 sm:col-span-2" disabled={pending} type="submit">{pending ? "Adding..." : "Add emergency contact"}</button>
      </form>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </section>
  );
}
