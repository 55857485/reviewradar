-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'ADVANCED', 'MAX', 'LIFETIME');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "SubscriptionPlan",
ADD COLUMN     "reportsLeft" INTEGER,
ADD COLUMN     "reportsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planPurchasedAt" TIMESTAMP(3);
