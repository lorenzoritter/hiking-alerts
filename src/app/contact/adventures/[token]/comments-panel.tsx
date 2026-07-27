"use client";

import { useState } from "react";

type Comment = { id: string; body: string; createdAt: string; authorUser: { name: string } | null; authorContact: { name: string } | null };

export function ContactCommentsPanel({ token, initialComments }: { token: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    try {
      const response = await fetch(`/api/contact/adventures/${token}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to add comment."); else { setComments((current) => [...current, { ...result.comment, authorUser: null, authorContact: { name: "You" } }]); setBody(""); }
    } catch { setError("Unable to reach the server."); } finally { setPending(false); }
  }
  return <section className="mt-6 border-t border-slate-100 pt-6"><h2 className="text-xl font-semibold">Coordination</h2><div className="mt-4 space-y-3">{comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}{comments.map((comment) => <div className="rounded-xl bg-slate-50 p-3" key={comment.id}><p className="text-sm font-semibold text-slate-800">{comment.authorUser?.name ?? comment.authorContact?.name ?? "Contact"}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p></div>)}</div><form className="mt-5 space-y-3" onSubmit={submit}><textarea className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Add a note for the hiker and other contacts" value={body} onChange={(event) => setBody(event.target.value)} required /><button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Posting..." : "Post comment"}</button>{error && <p className="text-sm text-red-700">{error}</p>}</form></section>;
}
