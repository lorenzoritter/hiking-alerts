import Link from "next/link";

import { SignupForm } from "@/app/(auth)/signup/signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Hiking Alerts
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
        Plan with confidence
      </h1>
      <p className="mt-3 text-slate-600">
        Create an account to share your plans and keep your emergency contacts close.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
