-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "systemAccount" TEXT,
ALTER COLUMN "walletId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");
