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
   its status; external notification delivery is not enabled yet.
3. **Check out** – mark the adventure as completed, ideally before the
   expected return time.
4. **Alert** – if the adventure isn't checked out by the expected return
   time, a hiker-ping notification record is queued first. If there's no
   response within the grace period, contact-alert records are queued and
   contacts can comment to coordinate. SMS/email provider delivery is a
   follow-up deployment task.

See [`docs/plan.md`](docs/plan.md) for the full phased build plan and
progress checklist.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- PostgreSQL + [Prisma](https://www.prisma.io) (v7 – uses the `prisma-client`
  generator with the `@prisma/adapter-pg` driver adapter; see
  `prisma/schema.prisma`)
- A dedicated worker package using BullMQ + Redis for overdue-adventure
  escalation (the state machine is implemented)
- Durable masked notification records; external SMS/email delivery remains a
  deployment follow-up and is documented in [`docs/deployment.md`](docs/deployment.md)

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

### Run the worker

Start Redis alongside Postgres:

```bash
docker compose up -d postgres redis
```

In a second terminal, run the worker:

```bash
npm run worker:dev
```

The worker runs the overdue-adventure state machine every 60 seconds. It
queues durable notification records; it does not yet send SMS/email.

### Authentication setup

Set `AUTH_SECRET` in `.env` to a random value of at least 32 characters.
The example file includes a placeholder; generate a value with:

```bash
openssl rand -base64 32
```

Authentication uses bcrypt password hashes and signed, HTTP-only cookie
sessions. Never commit `.env` or share the `AUTH_SECRET`. Login has a
best-effort in-memory rate limit for this single-instance MVP; use a shared
store such as Redis before deploying multiple web instances.

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
npm run worker:build  # compile the background worker
```

See [`docs/deployment.md`](docs/deployment.md) for Vercel, Railway, managed
Postgres/Redis, migration, worker, and safety configuration.

## Development tooling

This repo configures an [opencode](https://opencode.ai) `code-reviewer`
subagent (`.opencode/agent/code-reviewer.md`) that reviews diffs for
correctness, security, and best practices. Shell commands are allowed for
inspection and verification; file edits require confirmation. Invoke it
before finalizing a pull request.

## Project status

This repository is being built incrementally, one step per pull request.
See [`docs/plan.md`](docs/plan.md) for the checklist of steps and what's
done so far.
