-- Ensure all existing links are backfilled before enforcing the contract.
UPDATE "adventure_contacts"
SET "accessTokenExpiresAt" = "createdAt" + INTERVAL '30 days'
WHERE "accessTokenExpiresAt" IS NULL;

ALTER TABLE "adventure_contacts" ALTER COLUMN "accessTokenExpiresAt" SET NOT NULL;
