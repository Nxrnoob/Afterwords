-- CreateTable
CREATE TABLE "VaultItemContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultItemId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VaultItemContact_vaultItemId_fkey" FOREIGN KEY ("vaultItemId") REFERENCES "VaultItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VaultItemContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VaultItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "folderId" TEXT,
    "storageProvider" TEXT NOT NULL DEFAULT 'DATABASE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VaultItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VaultItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VaultItem" ("createdAt", "encryptedContent", "folderId", "id", "itemType", "recipientEmail", "title", "userId") SELECT "createdAt", "encryptedContent", "folderId", "id", "itemType", "recipientEmail", "title", "userId" FROM "VaultItem";
DROP TABLE "VaultItem";
ALTER TABLE "new_VaultItem" RENAME TO "VaultItem";
CREATE TABLE "new_VaultSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkinIntervalDays" INTEGER NOT NULL DEFAULT 30,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 14,
    "trustedContactEmail" TEXT,
    "scheduledReleaseDate" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "VaultSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VaultSetting" ("checkinIntervalDays", "gracePeriodDays", "id", "scheduledReleaseDate", "trustedContactEmail", "userId") SELECT "checkinIntervalDays", "gracePeriodDays", "id", "scheduledReleaseDate", "trustedContactEmail", "userId" FROM "VaultSetting";
DROP TABLE "VaultSetting";
ALTER TABLE "new_VaultSetting" RENAME TO "VaultSetting";
CREATE UNIQUE INDEX "VaultSetting_userId_key" ON "VaultSetting"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VaultItemContact_vaultItemId_contactId_key" ON "VaultItemContact"("vaultItemId", "contactId");
