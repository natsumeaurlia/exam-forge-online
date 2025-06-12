/*
  Warnings:

  - You are about to drop the column `isActive` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `allowMultipleAttempts` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `averageScore` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `collectParticipantInfo` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `showAnswersAfterSubmit` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `totalResponses` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `participantEmail` on the `QuizResponse` table. All the data in the column will be lost.
  - You are about to drop the column `participantName` on the `QuizResponse` table. All the data in the column will be lost.
  - You are about to drop the column `timeTaken` on the `QuizResponse` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Quiz_isPublic_idx";

-- DropIndex
DROP INDEX "QuizResponse_participantEmail_idx";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "allowMultipleAttempts",
DROP COLUMN "averageScore",
DROP COLUMN "collectParticipantInfo",
DROP COLUMN "instructions",
DROP COLUMN "isPublic",
DROP COLUMN "showAnswersAfterSubmit",
DROP COLUMN "totalResponses";

-- AlterTable
ALTER TABLE "QuizResponse" DROP COLUMN "participantEmail",
DROP COLUMN "participantName",
DROP COLUMN "timeTaken";

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeEvent_stripeEventId_key" ON "StripeEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeEvent_stripeEventId_idx" ON "StripeEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeEvent_type_idx" ON "StripeEvent"("type");

-- CreateIndex
CREATE INDEX "StripeEvent_processed_idx" ON "StripeEvent"("processed");

-- CreateIndex
CREATE INDEX "StripeEvent_createdAt_idx" ON "StripeEvent"("createdAt");

-- CreateIndex
CREATE INDEX "RateLimitEntry_key_idx" ON "RateLimitEntry"("key");

-- CreateIndex
CREATE INDEX "RateLimitEntry_createdAt_idx" ON "RateLimitEntry"("createdAt");
