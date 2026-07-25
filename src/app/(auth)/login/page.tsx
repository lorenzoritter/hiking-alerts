import Link from "next/link";

import { LoginForm } from "@/app/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Hiking Alerts
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
        Welcome back
      </h1>
      <p className="mt-3 text-slate-600">
        Sign in to manage your adventures and safety contacts.
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-slate-600">
        New to Hiking Alerts?{" "}
        <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/signup">
          Create an account
        </Link>
      </p>
    </main>
  );
}
