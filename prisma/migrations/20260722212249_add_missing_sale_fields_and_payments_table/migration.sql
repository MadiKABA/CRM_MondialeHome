/*
  Warnings:

  - The values [DRAFT,COMPLETED,RETURNED] on the enum `SaleStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `notes` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `amountDue` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaid` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryAddress` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDate` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryRequired` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryStatus` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDetails` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAt` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `saleDate` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `lastComputedAt` on the `segments` table. All the data in the column will be lost.
  - You are about to drop the column `rules` on the `segments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[emailBatchId]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `articleName` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `articleRef` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmailBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "MessageStatus" ADD VALUE 'SKIPPED';

-- AlterEnum
BEGIN;
CREATE TYPE "SaleStatus_new" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'UNPAID', 'CANCELLED', 'REFUNDED');
ALTER TABLE "public"."sales" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sales" ALTER COLUMN "status" TYPE "SaleStatus_new" USING ("status"::text::"SaleStatus_new");
ALTER TYPE "SaleStatus" RENAME TO "SaleStatus_old";
ALTER TYPE "SaleStatus_new" RENAME TO "SaleStatus";
DROP TYPE "public"."SaleStatus_old";
ALTER TABLE "sales" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_articleId_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_clientId_fkey";

-- DropIndex
DROP INDEX "sales_invoiceNumber_key";

-- DropIndex
DROP INDEX "sales_saleDate_idx";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "bounceRate" DOUBLE PRECISION,
ADD COLUMN     "campaignData" JSONB,
ADD COLUMN     "clickRate" DOUBLE PRECISION,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryRate" DOUBLE PRECISION,
ADD COLUMN     "emailBatchId" TEXT,
ADD COLUMN     "openRate" DOUBLE PRECISION,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "rfmCalculatedAt" TIMESTAMP(3),
ADD COLUMN     "rfmFrequency" INTEGER,
ADD COLUMN     "rfmMonetary" INTEGER,
ADD COLUMN     "rfmRecency" INTEGER;

-- AlterTable
ALTER TABLE "sale_items" DROP COLUMN "notes",
DROP COLUMN "subtotal",
ADD COLUMN     "articleName" TEXT NOT NULL,
ADD COLUMN     "articleRef" TEXT NOT NULL,
ADD COLUMN     "totalPrice" DECIMAL(15,2) NOT NULL,
ALTER COLUMN "articleId" DROP NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "amountDue",
DROP COLUMN "amountPaid",
DROP COLUMN "cancelledAt",
DROP COLUMN "deliveryAddress",
DROP COLUMN "deliveryDate",
DROP COLUMN "deliveryRequired",
DROP COLUMN "deliveryStatus",
DROP COLUMN "discount",
DROP COLUMN "discountType",
DROP COLUMN "invoiceNumber",
DROP COLUMN "location",
DROP COLUMN "metadata",
DROP COLUMN "paymentDetails",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "refundedAt",
DROP COLUMN "saleDate",
DROP COLUMN "source",
DROP COLUMN "subtotal",
DROP COLUMN "tax",
DROP COLUMN "total",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountPercent" DOUBLE PRECISION,
ADD COLUMN     "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "clientId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "segment_members" ADD COLUMN     "addedBy" TEXT;

-- AlterTable
ALTER TABLE "segments" DROP COLUMN "lastComputedAt",
DROP COLUMN "rules",
ADD COLUMN     "autoRefresh" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "criteria" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "lastRefreshedAt" TIMESTAMP(3),
ALTER COLUMN "color" SET DEFAULT '#8B6914';

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "campaignType" TEXT,
ADD COLUMN     "conclusion" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'fr',
ADD COLUMN     "productCategory" TEXT,
ALTER COLUMN "content" DROP NOT NULL;

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_batches" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "segmentId" TEXT,
    "campaignData" JSONB NOT NULL,
    "status" "EmailBatchStatus" NOT NULL DEFAULT 'PENDING',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "templateId" TEXT NOT NULL,
    "clientId" TEXT,
    "email" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "resendId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_saleId_idx" ON "payments"("saleId");

-- CreateIndex
CREATE INDEX "email_batches_status_idx" ON "email_batches"("status");

-- CreateIndex
CREATE INDEX "email_batches_templateId_idx" ON "email_batches"("templateId");

-- CreateIndex
CREATE INDEX "email_batches_createdAt_idx" ON "email_batches"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_logs_resendId_key" ON "message_logs"("resendId");

-- CreateIndex
CREATE INDEX "message_logs_batchId_idx" ON "message_logs"("batchId");

-- CreateIndex
CREATE INDEX "message_logs_clientId_idx" ON "message_logs"("clientId");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "message_logs_resendId_idx" ON "message_logs"("resendId");

-- CreateIndex
CREATE INDEX "message_logs_email_idx" ON "message_logs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_emailBatchId_key" ON "campaigns"("emailBatchId");

-- CreateIndex
CREATE INDEX "campaigns_templateId_idx" ON "campaigns"("templateId");

-- CreateIndex
CREATE INDEX "campaigns_deletedAt_idx" ON "campaigns"("deletedAt");

-- CreateIndex
CREATE INDEX "clients_rfmScore_idx" ON "clients"("rfmScore");

-- CreateIndex
CREATE UNIQUE INDEX "sales_reference_key" ON "sales"("reference");

-- CreateIndex
CREATE INDEX "sales_soldAt_idx" ON "sales"("soldAt");

-- CreateIndex
CREATE INDEX "segments_type_idx" ON "segments"("type");

-- CreateIndex
CREATE INDEX "segments_isActive_idx" ON "segments"("isActive");

-- CreateIndex
CREATE INDEX "templates_campaignType_idx" ON "templates"("campaignType");

-- AddForeignKey
ALTER TABLE "segments" ADD CONSTRAINT "segments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_emailBatchId_fkey" FOREIGN KEY ("emailBatchId") REFERENCES "email_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_batches" ADD CONSTRAINT "email_batches_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_batches" ADD CONSTRAINT "email_batches_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_batches" ADD CONSTRAINT "email_batches_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "email_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
