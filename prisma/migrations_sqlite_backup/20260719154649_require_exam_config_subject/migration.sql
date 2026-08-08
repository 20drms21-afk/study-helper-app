/*
  Warnings:

  - Made the column `subjectId` on table `ExamConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
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
    CONSTRAINT "ExamConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamConfig_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ExamConfig" ("createdAt", "essayCount", "id", "mcqCount", "pastExamFileId", "pastExamWeight", "professorNotes", "shortCount", "sourceFileIdsJson", "subjectId", "timeLimitMinutes", "title", "userId") SELECT "createdAt", "essayCount", "id", "mcqCount", "pastExamFileId", "pastExamWeight", "professorNotes", "shortCount", "sourceFileIdsJson", "subjectId", "timeLimitMinutes", "title", "userId" FROM "ExamConfig";
DROP TABLE "ExamConfig";
ALTER TABLE "new_ExamConfig" RENAME TO "ExamConfig";
CREATE INDEX "ExamConfig_userId_idx" ON "ExamConfig"("userId");
CREATE INDEX "ExamConfig_subjectId_idx" ON "ExamConfig"("subjectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
