-- AlterTable
ALTER TABLE "UploadedFile" ADD COLUMN     "subjectId" TEXT;

-- CreateIndex
CREATE INDEX "UploadedFile_subjectId_idx" ON "UploadedFile"("subjectId");

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
