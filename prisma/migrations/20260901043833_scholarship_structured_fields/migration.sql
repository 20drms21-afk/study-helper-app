-- AlterTable
ALTER TABLE "ScholarshipListing" ADD COLUMN     "departmentTags" TEXT,
ADD COLUMN     "gradOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gradeCriteriaText" TEXT,
ADD COLUMN     "incomeCriteriaText" TEXT,
ADD COLUMN     "maxIncomeBracket" INTEGER,
ADD COLUMN     "minGpa" DOUBLE PRECISION,
ADD COLUMN     "qualificationText" TEXT,
ADD COLUMN     "recommendationText" TEXT,
ADD COLUMN     "residencyText" TEXT,
ADD COLUMN     "restrictionText" TEXT,
ADD COLUMN     "universityTags" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "departmentField" TEXT;
