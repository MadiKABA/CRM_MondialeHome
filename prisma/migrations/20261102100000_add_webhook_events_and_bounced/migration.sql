-- AlterEnum
ALTER TYPE "MessageStatus" ADD VALUE IF NOT EXISTS 'COMPLAINED';

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "totalBounced" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "svixId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "resendId" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_svixId_key" ON "webhook_events"("svixId");
CREATE INDEX "webhook_events_resendId_idx" ON "webhook_events"("resendId");
CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");
