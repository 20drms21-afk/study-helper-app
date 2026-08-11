-- CreateEnum
CREATE TYPE "AiUsageFeature" AS ENUM ('NOTE_SUMMARY', 'NOTE_EXPLANATION', 'EXAM_BLUEPRINT', 'EXAM_GENERATE', 'EXAM_GRADE', 'TUTOR_CHAT', 'PDF_TRANSLATE', 'SCHOLARSHIP_MATCH');

-- CreateEnum
CREATE TYPE "AiUsageStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "feature" "AiUsageFeature" NOT NULL,
    "operationId" TEXT NOT NULL,
    "status" "AiUsageStatus" NOT NULL DEFAULT 'SUCCESS',
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheCreationInputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadInputTokens" INTEGER NOT NULL DEFAULT 0,
    "apiCallCount" INTEGER NOT NULL DEFAULT 1,
    "estimatedInputCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "estimatedOutputCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "estimatedCacheCreationCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "estimatedCacheReadCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "estimatedTotalCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageEvent_userId_createdAt_idx" ON "AiUsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_operationId_idx" ON "AiUsageEvent"("operationId");

-- CreateIndex
CREATE INDEX "AiUsageEvent_feature_createdAt_idx" ON "AiUsageEvent"("feature", "createdAt");

-- AddForeignKey
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
