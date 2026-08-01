# Deployment

Phase 1 has two deployable processes:

- **Web app**: Next.js, deployed to Vercel or another Node.js host.
- **Worker**: BullMQ/Redis worker, deployed as an always-on process (Railway,
  Fly.io, or a similar service) using `worker/Dockerfile`.

## Required services

- Managed PostgreSQL
- Managed Redis
- A web host
- An always-on worker host

The web app and worker must use the same `DATABASE_URL` and `REDIS_URL`.

## Web deployment

1. Create a Vercel project linked to this repository.
2. Use the repository root as the project root. `vercel.json` supplies the
   install and build commands.
3. Configure these environment variables for every environment:

   - `DATABASE_URL`
   - `AUTH_SECRET` (at least 32 random characters)
   - `PUBLIC_APP_URL` (the public HTTPS web URL, without a trailing slash)
   - `REDIS_URL` (needed once the worker is enabled)

4. Deploy database migrations separately before enabling features that write
   new schema fields:

   ```bash
   npm run db:migrate:deploy
   ```

Never run `prisma migrate reset` against a hosted database.

## Migration deployment

Run database migrations as a dedicated release/job step against the shared
production database before deploying or restarting either application:

```bash
npm run db:migrate:deploy
```

The web and worker processes should only start after this succeeds. The
migration job is separate from the worker process.

## Worker deployment

The worker image is built from the repository root:

```bash
docker build -f worker/Dockerfile -t hiking-alerts-worker .
```

Run it with the same database and Redis environment variables:

```bash
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -e REDIS_URL="$REDIS_URL" \
  hiking-alerts-worker
```

Railway can use `railway.toml` and the included Dockerfile. The Railway
configuration runs `npm run db:migrate:deploy` as a pre-deploy command before
the service starts. Configure a restart policy because the worker is
responsible for time-based escalation.
Monitor worker logs and Redis connectivity; a web deployment alone does not
run the escalation scheduler.

## Notifications

The current Phase 1 implementation creates durable, masked notification-log
records with `PENDING` status. It does not claim delivery until an SMS/email
provider adapter is configured and a delivery process updates those records.
Do not treat a queued record as proof that a contact was notified. Provider
credentials, consent/compliance requirements, retry policy, and delivery
observability should be completed before real safety-critical use.

## Safety requirements

- Use HTTPS in production.
- Generate a unique `AUTH_SECRET` per environment.
- Restrict database and Redis network access to the web and worker services.
- Do not expose `DATABASE_URL`, `AUTH_SECRET`, or `REDIS_URL` to browser code.
- Test overdue transitions in a staging environment before production use.
- The app is not a substitute for a PLB, satellite communicator, or emergency
  services; delivery can fail or be delayed.
