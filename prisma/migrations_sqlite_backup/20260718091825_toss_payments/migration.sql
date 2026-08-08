/*
  Warnings:

  - You are about to drop the `StripeEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `User` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StripeEvent";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT,
    "tossCustomerKey" TEXT,
    "tossBillingKey" TEXT,
    "currentPeriodEnd" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "plan", "subscriptionStatus") SELECT "createdAt", "email", "id", "name", "passwordHash", "plan", "subscriptionStatus" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_tossCustomerKey_key" ON "User"("tossCustomerKey");
CREATE UNIQUE INDEX "User_tossBillingKey_key" ON "User"("tossBillingKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
