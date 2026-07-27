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
- [x] **4. Emergency contacts CRUD** — Profile UI + owner-scoped API routes
      to add and remove contacts, validate notification channels, and
      maintain a default contact.
- [x] **5. Hike creation** — Owner-scoped CRUD APIs and dashboard UI for
      free-text hikes (title/description).
- [x] **6. Adventure creation** — Timezone-aware form and owner-scoped API
      route to link a hike, choose contacts, set expected return time, and
      configure ping/contact grace periods.
- [x] **7. Adventure sharing** — Generate expiring opaque per-contact bearer
      tokens, queue masked notification records, provide share links, and add the
      no-login contact-facing status page.
- [x] **8. Checkout flow** — Guarded transactional checkout endpoint and
      dashboard action, audit events, and durable queued late stand-down
      notifications after contacts were alerted.
- [x] **9. Worker service scaffold** — Separate Node worker package,
      BullMQ + Redis wiring, graceful shutdown, and a repeating 60-second
      scan skeleton.
- [x] **10. Escalation logic** — Implement the worker state machine:
      overdue → hiker pinged → acknowledge-and-extend (requires a new
      expected return time) or contacts alerted, with guarded transitions
      and `AlertEvent` / `NotificationLog` records.
- [x] **11. Alert comments + hiker dashboard** — Token-authorized contacts
      and authenticated hikers can comment; dashboard lists adventure status
      and the event timeline.
- [x] **12. Deployment config** — Environment and safety docs, Vercel and
      Railway/Docker configuration, managed Postgres/Redis deployment notes,
      worker runtime instructions, and final README pass.

## Phase 2 — Quality of life

- [x] Adventure form layout — align the hike selector with the other
      adventure fields and give it a clear `Hike` label.
- [x] Adventure date/time UX — make departure optional, present dates in a
      consistent human-readable format such as `15 Aug 2026, 22:30`, and
      provide a reliable date-and-time picker across browsers instead of
      relying on inconsistent native `datetime-local` rendering.
- [x] Emergency contact channel copy — clarify that at least one phone or
      email channel is currently required, or change validation if contacts
      without a notification channel should be allowed; labels and errors
      must match the chosen rule.
- [x] Extend/edit expected return time while active (if hiker has signal).
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
