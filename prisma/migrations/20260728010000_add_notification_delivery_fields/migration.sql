ALTER TABLE "notification_logs" ADD COLUMN "destination" TEXT;
ALTER TABLE "notification_logs" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "notification_logs" ADD COLUMN "lastAttemptAt" TIMESTAMP(3);
