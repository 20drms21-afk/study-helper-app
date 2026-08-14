-- AlterEnum
ALTER TYPE "AiUsageFeature" ADD VALUE 'ACTIVITY_FIELD_MATCH';

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "activityFieldTags" TEXT,
ADD COLUMN     "activityFieldTagsSource" TEXT;
