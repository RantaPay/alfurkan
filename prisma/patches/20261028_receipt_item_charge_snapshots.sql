-- Add immutable fee-category balance snapshots to receipt line items.
-- This patch is additive and does not rewrite existing payment or student data.
ALTER TABLE "ReceiptItem"
ADD COLUMN IF NOT EXISTS "chargeAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "chargeBalance" DOUBLE PRECISION;
