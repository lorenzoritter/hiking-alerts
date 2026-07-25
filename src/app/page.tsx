import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Hiking Alerts</p>
          <div className="flex items-center gap-4 text-sm">
            <Link className="text-slate-300 hover:text-white" href="/login">Sign in</Link>
            <Link className="rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300" href="/signup">Get started</Link>
          </div>
        </header>
        <section className="max-w-3xl py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">A calmer way to share the plan</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-7xl">Enjoy the trail. Let someone know you&apos;re safe.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Share your hike, expected return time, and trusted contacts. If you do not check out, Hiking Alerts checks in with you before escalating to the people who care.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-300" href="/signup">Create your account</Link>
            <Link className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-white hover:border-slate-500" href="/login">I already have an account</Link>
          </div>
        </section>
        <div className="grid gap-4 border-t border-slate-800 pt-6 text-sm text-slate-400 sm:grid-cols-3">
          <p><span className="font-semibold text-white">01</span> Describe your hike</p>
          <p><span className="font-semibold text-white">02</span> Share the return time</p>
          <p><span className="font-semibold text-white">03</span> Check out when safe</p>
        </div>
        </div>
    </main>
  );
}
