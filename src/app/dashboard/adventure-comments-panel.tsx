"use client";

import { useState } from "react";

type Comment = { id: string; body: string; createdAt: string; authorUser: { name: string } | null; authorContact: { name: string } | null };

export function AdventureCommentsPanel({ adventureId, initialComments }: { adventureId: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/adventures/${adventureId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to add comment.");
      else { setComments((current) => [...current, { ...result.comment, authorUser: { name: "You" }, authorContact: null }]); setBody(""); }
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setPending(false);
    }
  }

  return <section className="mt-4 border-t border-slate-100 pt-4"><h4 className="text-sm font-semibold text-slate-950">Coordination comments</h4><div className="mt-3 space-y-2">{comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}{comments.map((comment) => <div className="rounded-lg bg-slate-50 p-3" key={comment.id}><p className="text-xs font-semibold text-slate-700">{comment.authorUser?.name ?? comment.authorContact?.name ?? "Contact"}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.body}</p></div>)}</div><form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={submit}><textarea aria-label="Add a coordination comment" className="min-h-16 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Add a note" value={body} onChange={(event) => setBody(event.target.value)} required /><button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Posting..." : "Post comment"}</button></form>{error && <p aria-live="polite" className="mt-2 text-sm text-red-700" role="alert">{error}</p>}</section>;
}
