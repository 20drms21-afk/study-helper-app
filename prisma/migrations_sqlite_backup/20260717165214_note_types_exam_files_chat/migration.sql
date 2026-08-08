/*
  Warnings:

  - You are about to drop the column `sourceNoteIdsJson` on the `ExamConfig` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `SummaryNote` table. All the data in the column will be lost.
  - Added the required column `sourceFileIdsJson` to the `ExamConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `SummaryNote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "UploadedFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mcqCount" INTEGER NOT NULL DEFAULT 0,
    "shortCount" INTEGER NOT NULL DEFAULT 0,
    "essayCount" INTEGER NOT NULL DEFAULT 0,
    "timeLimitMinutes" INTEGER NOT NULL,
    "professorNotes" TEXT,
    "sourceFileIdsJson" TEXT NOT NULL,
    "pastExamFileId" TEXT,
    "pastExamWeight" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExamConfig" ("createdAt", "essayCount", "id", "mcqCount", "professorNotes", "shortCount", "timeLimitMinutes", "title", "userId") SELECT "createdAt", "essayCount", "id", "mcqCount", "professorNotes", "shortCount", "timeLimitMinutes", "title", "userId" FROM "ExamConfig";
DROP TABLE "ExamConfig";
ALTER TABLE "new_ExamConfig" RENAME TO "ExamConfig";
CREATE INDEX "ExamConfig_userId_idx" ON "ExamConfig"("userId");
CREATE TABLE "new_SummaryNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceFileId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SummaryNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SummaryNote_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "UploadedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SummaryNote" ("contentJson", "createdAt", "id", "sourceFileId", "title", "updatedAt", "userId") SELECT "contentJson", "createdAt", "id", "sourceFileId", "title", "updatedAt", "userId" FROM "SummaryNote";
DROP TABLE "SummaryNote";
ALTER TABLE "new_SummaryNote" RENAME TO "SummaryNote";
CREATE INDEX "SummaryNote_userId_idx" ON "SummaryNote"("userId");
CREATE INDEX "SummaryNote_sourceFileId_type_idx" ON "SummaryNote"("sourceFileId", "type");
CREATE TABLE "new_UploadedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileKind" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "extractedText" TEXT,
    "needsVision" BOOLEAN NOT NULL DEFAULT false,
    "purpose" TEXT NOT NULL DEFAULT 'note',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UploadedFile" ("createdAt", "extractedText", "fileKind", "id", "mimeType", "needsVision", "originalName", "sizeBytes", "storedPath", "userId") SELECT "createdAt", "extractedText", "fileKind", "id", "mimeType", "needsVision", "originalName", "sizeBytes", "storedPath", "userId" FROM "UploadedFile";
DROP TABLE "UploadedFile";
ALTER TABLE "new_UploadedFile" RENAME TO "UploadedFile";
CREATE INDEX "UploadedFile_userId_idx" ON "UploadedFile"("userId");
CREATE INDEX "UploadedFile_userId_purpose_idx" ON "UploadedFile"("userId", "purpose");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ChatMessage_fileId_idx" ON "ChatMessage"("fileId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");
