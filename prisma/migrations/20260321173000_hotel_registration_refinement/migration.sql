ALTER TABLE "hotels"
ADD COLUMN IF NOT EXISTS "tax_registration_number" TEXT NOT NULL DEFAULT '';

UPDATE "hotels"
SET "tax_registration_number" = COALESCE(NULLIF("commercial_registration_number", ''), "code")
WHERE "tax_registration_number" = '';

ALTER TABLE "hotels"
ALTER COLUMN "tax_registration_number" DROP DEFAULT;

ALTER TABLE "hotels"
DROP COLUMN IF EXISTS "average_daily_load_kg",
DROP COLUMN IF EXISTS "peak_hours",
DROP COLUMN IF EXISTS "commercial_registration_expiry_date",
DROP COLUMN IF EXISTS "delegation_letter_purpose_ar";
