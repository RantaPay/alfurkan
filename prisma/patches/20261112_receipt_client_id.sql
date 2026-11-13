-- Additive only. Do not run this until the school has approved it.
-- Existing receipt rows stay unchanged. Nulls are allowed, so old receipts are valid.
-- A second insert of the same offline receipt is rejected by the unique index.

ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "clientReceiptId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_clientReceiptId_key" ON "Receipt" ("clientReceiptId");
