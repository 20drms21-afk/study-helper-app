-- CreateTable
CREATE TABLE "PdfTranslation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "originalStoredPath" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "translatedPageCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfTranslationPage" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "translatedImagePath" TEXT NOT NULL,

    CONSTRAINT "PdfTranslationPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PdfTranslation_userId_idx" ON "PdfTranslation"("userId");

-- CreateIndex
CREATE INDEX "PdfTranslationPage_translationId_idx" ON "PdfTranslationPage"("translationId");

-- CreateIndex
CREATE UNIQUE INDEX "PdfTranslationPage_translationId_pageNumber_key" ON "PdfTranslationPage"("translationId", "pageNumber");

-- AddForeignKey
ALTER TABLE "PdfTranslation" ADD CONSTRAINT "PdfTranslation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfTranslationPage" ADD CONSTRAINT "PdfTranslationPage_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "PdfTranslation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
