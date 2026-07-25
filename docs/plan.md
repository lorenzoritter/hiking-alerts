# Build plan

This is the working execution plan for Hiking Alerts. See the [README](../README.md)
for the product overview and core flow.

The project is built incrementally: each step below is done on its own
feature branch and merged into `main` via a pull request (never committed
directly to `main`). Check items off as they land, and feel free to add new
items as scope evolves.

## Phase 1 — Core MVP loop

- [x] **1. Project scaffold** — Next.js (App Router, TypeScript, Tailwind
      CSS, ESLint), base folder structure, README with setup instructions.
- [x] **2. Database schema** — Prisma schema for the Phase 1 data model
      (`User`, `EmergencyContact`, `Hike`, `Adventure`, `AdventureContact`,
      `AlertEvent`, `AlertComment`, `NotificationLog`), initial migration,
      local dev DB setup (`docker-compose.yml` for Postgres + Redis).
- [x] **3. Auth** — Sign up / log in, encrypted cookie session handling,
      server-side session verification, protected dashboard/profile pages,
      and logout.
- [ ] **4. Emergency contacts CRUD** — Profile UI + API routes to add,
      edit, and remove default emergency contacts.
- [ ] **5. Hike creation** — CRUD for free-text hikes (title/description),
      list/detail views.
- [ ] **6. Adventure creation** — Form to link a hike, set expected return
      date/time + timezone, choose contacts (default or ad hoc), set
      ping/alert grace periods; API routes + DB writes.
- [ ] **7. Adventure sharing** — Generate signed per-contact tokens, send
      SMS/email with a no-login link; build the contact-facing status page
      (view adventure info + alert state).
- [ ] **8. Checkout flow** — "Check out" action, updates adventure
      status/timestamp; notifies contacts with a stand-down notice if it
      happens after they were already alerted.
- [ ] **9. Worker service scaffold** — Separate Node worker package,
      BullMQ + Redis wiring, repeating job skeleton polling every 1–2 min.
- [ ] **10. Escalation logic** — Implement the state machine in the
      worker: overdue → hiker pinged → (acknowledge-and-extend, which
      requires the hiker to submit a new expected return time) or →
      contacts alerted; logging to `AlertEvent` / `NotificationLog`.
- [ ] **11. Alert comments + hiker dashboard** — Contacts can comment on
      an alert; hiker dashboard listing active/past adventures with
      status.
- [ ] **12. Deployment config** — Env var docs, hosting config for the web
      app and the worker, managed Postgres/Redis, final README pass.

## Phase 2 — Quality of life

- [ ] Extend/edit expected return time while active (if hiker has signal).
- [ ] Reminder notification before deadline (e.g. "1 hour left, don't
      forget to check out").
- [ ] Structured location field (trailhead/park name) even without full
      mapping.
- [ ] Notification delivery status/retries visible to the user.

## Phase 3 — Richer planning & sharing

- [ ] Route import (Komoot/Strava).
- [ ] Full mapping/route planner.
- [ ] Photos/comments on completed hikes shared with friends.
- [ ] Optional contact accounts for saved preferences/history.

## Key design decisions

- **Emergency contacts don't need accounts.** They're identified by
  name/phone/email and access an adventure's status via a signed, expiring
  link — reduces friction for people being asked to be someone's safety
  contact.
- **Two-stage escalation.** Overdue → hiker is pinged first → only after a
  second grace period with no response are emergency contacts alerted.
  This avoids false alarms from minor delays or connectivity gaps.
- **Acknowledging a ping requires picking a new expected return time.**
  There's no passive "snooze" — the hiker must commit to a concrete new
  deadline, which is logged as an `acknowledged_extended` event.
- **No special handling for lack of wilderness connectivity in the MVP.**
  Hikers are expected to check out as soon as they regain signal, even if
  late; satellite-communicator integration (Garmin inReach/Zoleo) is a
  possible future enhancement, not part of the current plan.
