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
- PostgreSQL + Prisma (added in a later step)
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
git history for progress. Current step: initial project scaffold.
