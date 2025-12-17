-- Add refund-related columns to Order if they don't exist
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundAmountCents" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMPTZ;








