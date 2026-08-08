-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "region" TEXT,
    "major" TEXT,
    "gradeLevel" INTEGER,
    "incomeBracket" INTEGER,
    "interests" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScholarshipListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT,
    "amountText" TEXT,
    "eligibilityText" TEXT NOT NULL,
    "applyPeriodText" TEXT,
    "applyUrl" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ActivityListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "organizer" TEXT,
    "category" TEXT NOT NULL,
    "fieldTags" TEXT NOT NULL,
    "targetInfo" TEXT,
    "deadlineText" TEXT,
    "deadlineDate" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "crossCheckedWith" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipListing_externalId_key" ON "ScholarshipListing"("externalId");

-- CreateIndex
CREATE INDEX "ScholarshipListing_fetchedAt_idx" ON "ScholarshipListing"("fetchedAt");

-- CreateIndex
CREATE INDEX "ActivityListing_deadlineDate_idx" ON "ActivityListing"("deadlineDate");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityListing_title_organizer_key" ON "ActivityListing"("title", "organizer");
