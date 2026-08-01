ALTER TABLE "notification_logs" ADD COLUMN "destination" TEXT;
ALTER TABLE "notification_logs" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "notification_logs" ADD COLUMN "lastAttemptAt" TIMESTAMP(3);
ALTER TYPE "NotificationStatus" ADD VALUE 'PROCESSING';
UPDATE "notification_logs"
SET "status" = 'FAILED', "errorMessage" = 'Legacy notification has no delivery destination'
WHERE "destination" IS NULL AND "status" = 'PENDING';
