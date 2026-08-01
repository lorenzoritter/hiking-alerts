WITH ranked_defaults AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "ownerUserId" ORDER BY "createdAt", "id") AS rank
  FROM "emergency_contacts"
  WHERE "isDefault" = true
)
UPDATE "emergency_contacts" AS contact
SET "isDefault" = false
FROM ranked_defaults
WHERE contact."id" = ranked_defaults."id" AND ranked_defaults.rank > 1;

CREATE UNIQUE INDEX "emergency_contacts_one_default_per_owner"
ON "emergency_contacts" ("ownerUserId")
WHERE "isDefault" = true;
