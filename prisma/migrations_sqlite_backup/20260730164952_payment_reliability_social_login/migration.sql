-- CreateTable
CREATE TABLE "SubscriptionCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "attemptSeq" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT,
    "tossCustomerKey" TEXT,
    "tossBillingKey" TEXT,
    "currentPeriodEnd" DATETIME,
    "nextChargeAt" DATETIME,
    "canceledAt" DATETIME,
    "suspendedAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "currentPeriodEnd", "email", "id", "name", "passwordHash", "plan", "subscriptionStatus", "tossBillingKey", "tossCustomerKey") SELECT "createdAt", "currentPeriodEnd", "email", "id", "name", "passwordHash", "plan", "subscriptionStatus", "tossBillingKey", "tossCustomerKey" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_tossCustomerKey_key" ON "User"("tossCustomerKey");
CREATE UNIQUE INDEX "User_tossBillingKey_key" ON "User"("tossBillingKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCharge_orderId_key" ON "SubscriptionCharge"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCharge_userId_periodKey_attemptSeq_key" ON "SubscriptionCharge"("userId", "periodKey", "attemptSeq");
