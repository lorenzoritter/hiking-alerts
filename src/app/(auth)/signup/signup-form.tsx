"use client";

import { useActionState } from "react";

import { signup } from "@/lib/auth/actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-800" htmlFor="name">
          Your name
        </label>
        <input
          className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
        />
        {state?.errors?.name?.map((error) => (
          <p className="mt-1 text-sm text-red-700" key={error}>{error}</p>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-800" htmlFor="email">
          Email
        </label>
        <input
          className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state?.errors?.email?.map((error) => (
          <p className="mt-1 text-sm text-red-700" key={error}>{error}</p>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-800" htmlFor="password">
          Password
        </label>
        <input
          className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="mt-2 text-xs text-slate-500">
          Use at least 8 characters with a letter, number, and special character.
        </p>
        {state?.errors?.password?.map((error) => (
          <p className="mt-1 text-sm text-red-700" key={error}>{error}</p>
        ))}
      </div>
      {state?.message && <p className="text-sm text-red-700">{state.message}</p>}
      <button
        className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
