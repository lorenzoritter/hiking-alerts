-- Backfill legacy contact links before enforcing expiry for all links.
UPDATE "adventure_contacts"
SET "accessTokenExpiresAt" = "createdAt" + INTERVAL '30 days'
WHERE "accessTokenExpiresAt" IS NULL;

ALTER TABLE "adventure_contacts" ALTER COLUMN "accessTokenExpiresAt" SET NOT NULL;

-- Add a non-PII idempotency key for queued notification records.
ALTER TABLE "notification_logs" ADD COLUMN "deliveryKey" TEXT;
CREATE UNIQUE INDEX "notification_logs_deliveryKey_key" ON "notification_logs"("deliveryKey");
