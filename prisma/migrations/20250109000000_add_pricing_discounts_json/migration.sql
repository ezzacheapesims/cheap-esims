-- AlterTable
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "discountsJson" JSONB;
ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "pricingJson" JSONB;



