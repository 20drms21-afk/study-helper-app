-- AlterTable
ALTER TABLE "ScholarshipListing" ADD COLUMN     "applyEndDate" TEXT,
ADD COLUMN     "applyStartDate" TEXT;

-- CreateIndex
CREATE INDEX "ScholarshipListing_applyEndDate_idx" ON "ScholarshipListing"("applyEndDate");
