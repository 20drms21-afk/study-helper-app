-- DropForeignKey
ALTER TABLE "PdfTranslationPage" DROP CONSTRAINT "PdfTranslationPage_translationId_fkey";

-- AlterTable
ALTER TABLE "PdfTranslation" ADD COLUMN     "translatedStoredPath" TEXT;

-- DropTable
DROP TABLE "PdfTranslationPage";

