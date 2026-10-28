-- Preserve payment coverage on individual fee lines. Existing data is unchanged.
ALTER TABLE "ReceiptItem" ADD COLUMN IF NOT EXISTS "paymentTerm" TEXT;
