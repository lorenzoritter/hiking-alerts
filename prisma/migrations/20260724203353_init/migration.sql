-- CreateEnum
CREATE TYPE "AdventureStatus" AS ENUM ('DRAFT', 'ACTIVE', 'HIKER_PINGED', 'CONTACTS_ALERTED', 'CHECKED_OUT', 'RESOLVED_LATE');

-- CreateEnum
CREATE TYPE "AlertEventType" AS ENUM ('HIKER_PINGED', 'ACKNOWLEDGED_EXTENDED', 'CONTACTS_ALERTED', 'CHECKED_OUT', 'RESOLVED_LATE_STAND_DOWN');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hikes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hikes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adventures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hikeId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "expectedReturnAt" TIMESTAMP(3) NOT NULL,
    "pingGraceMinutes" INTEGER NOT NULL DEFAULT 30,
    "alertGraceMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" "AdventureStatus" NOT NULL DEFAULT 'ACTIVE',
    "checkedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adventures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adventure_contacts" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adventure_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "type" "AlertEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_comments" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorContactId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "emergency_contacts_ownerUserId_idx" ON "emergency_contacts"("ownerUserId");

-- CreateIndex
CREATE INDEX "hikes_userId_idx" ON "hikes"("userId");

-- CreateIndex
CREATE INDEX "adventures_userId_idx" ON "adventures"("userId");

-- CreateIndex
CREATE INDEX "adventures_status_idx" ON "adventures"("status");

-- CreateIndex
CREATE UNIQUE INDEX "adventure_contacts_accessToken_key" ON "adventure_contacts"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "adventure_contacts_adventureId_contactId_key" ON "adventure_contacts"("adventureId", "contactId");

-- CreateIndex
CREATE INDEX "alert_events_adventureId_idx" ON "alert_events"("adventureId");

-- CreateIndex
CREATE INDEX "alert_comments_adventureId_idx" ON "alert_comments"("adventureId");

-- CreateIndex
CREATE INDEX "notification_logs_adventureId_idx" ON "notification_logs"("adventureId");

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hikes" ADD CONSTRAINT "hikes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventures" ADD CONSTRAINT "adventures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventures" ADD CONSTRAINT "adventures_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "hikes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventure_contacts" ADD CONSTRAINT "adventure_contacts_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventure_contacts" ADD CONSTRAINT "adventure_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "emergency_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_comments" ADD CONSTRAINT "alert_comments_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_comments" ADD CONSTRAINT "alert_comments_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_comments" ADD CONSTRAINT "alert_comments_authorContactId_fkey" FOREIGN KEY ("authorContactId") REFERENCES "emergency_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
