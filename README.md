# Hiking Alerts

A web app that lets hikers share their hiking plans with friends/family so
they get alerted automatically if the hiker doesn't check out by their
expected return time.

## Core flow

1. **Plan a hike** – describe a hike in plain text (route imports and full
   mapping are planned for later).
2. **Share an adventure** – pair a hike with an expected return date/time and
   a set of emergency contacts (defaults can be set on your profile).
   Contacts receive a link (no account required) to view the adventure and
   its status.
3. **Check out** – mark the adventure as completed, ideally before the
   expected return time.
4. **Alert** – if the adventure isn't checked out by the expected return
   time, the hiker is pinged first. If there's no response within the grace
   period, emergency contacts are alerted and can comment to coordinate.

See `docs/plan.md` (if present) or project discussion for the full phased
roadmap.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- PostgreSQL + [Prisma](https://www.prisma.io) (v7 – uses the `prisma-client`
  generator with the `@prisma/adapter-pg` driver adapter; see
  `prisma/schema.prisma`)
- A dedicated background worker (BullMQ + Redis) for the overdue-adventure
  escalation logic (added in a later step)
- Twilio (SMS) + Resend/SendGrid (email) for notifications (added in a later
  step)

## Getting started

### Prerequisites

This project requires **Node.js 24**. If you don't already have Node
installed, and don't want to install Homebrew/nvm, you can use
[conda](https://docs.conda.io/) (already required for this setup):

```bash
conda create -n hiking-alerts -c conda-forge nodejs=24
conda activate hiking-alerts
```

Make sure to run `conda activate hiking-alerts` in any new shell before
working on this project.

### Install dependencies

```bash
npm install
```

This also runs `prisma generate` automatically (via `postinstall`), which
generates the Prisma Client into `src/generated/prisma`.

### Database setup

You need a local PostgreSQL instance. Two options:

**Option A: Docker (recommended if you have it)**

```bash
docker compose up -d postgres
```

This starts Postgres on `localhost:5432` with credentials matching
`.env.example` (user/password/db: `hiking`/`hiking`/`hiking_alerts`).
`docker-compose.yml` also defines a `redis` service, used starting from the
background-worker step.

**Option B: `prisma dev` (no Docker required)**

```bash
npx prisma dev
```

This starts a local Prisma-managed Postgres instance and prints a
`DATABASE_URL` to use — copy it into your `.env`.

> Note: at the time of writing, `prisma migrate dev` can fail against a
> `prisma dev` instance with a `P1017` connection error from the schema
> engine's shadow-database diagnostics. If you hit this, use a real local
> Postgres (Docker, or `initdb`/`pg_ctl` directly) instead.

Once you have a running Postgres instance:

```bash
cp .env.example .env   # adjust DATABASE_URL if needed
npm run db:migrate      # applies migrations (prompts for a name on new changes)
npm run db:generate     # regenerate the Prisma Client after schema changes
npm run db:studio       # optional: browse the DB with Prisma Studio
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint     # lint the codebase
```

## Project status

This repository is being built incrementally, one feature per commit. See
git history for progress. Current step: database schema (Prisma models for
users, emergency contacts, hikes, adventures, and the alert/notification
tables).
