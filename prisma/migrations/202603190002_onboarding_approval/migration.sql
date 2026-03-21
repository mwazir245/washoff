ALTER TABLE "hotels"
  ADD COLUMN "onboarding_status" VARCHAR(32),
  ADD COLUMN "submitted_at" TIMESTAMPTZ(6),
  ADD COLUMN "reviewed_at" TIMESTAMPTZ(6),
  ADD COLUMN "reviewed_by_role" VARCHAR(32),
  ADD COLUMN "reviewed_by_id" VARCHAR(128),
  ADD COLUMN "review_notes_ar" TEXT;

UPDATE "hotels"
SET
  "onboarding_status" = 'approved',
  "submitted_at" = "created_at",
  "reviewed_at" = "updated_at",
  "reviewed_by_role" = 'admin',
  "reviewed_by_id" = 'seed-admin',
  "review_notes_ar" = COALESCE("review_notes_ar", 'جهة تشغيلية معتمدة ضمن بيانات WashOff الأساسية.')
WHERE "onboarding_status" IS NULL OR "submitted_at" IS NULL;

ALTER TABLE "hotels"
  ALTER COLUMN "onboarding_status" SET NOT NULL,
  ALTER COLUMN "submitted_at" SET NOT NULL,
  ALTER COLUMN "onboarding_status" SET DEFAULT 'approved';

ALTER TABLE "providers"
  ADD COLUMN "notes_ar" TEXT,
  ADD COLUMN "onboarding_status" VARCHAR(32),
  ADD COLUMN "submitted_at" TIMESTAMPTZ(6),
  ADD COLUMN "reviewed_at" TIMESTAMPTZ(6),
  ADD COLUMN "reviewed_by_role" VARCHAR(32),
  ADD COLUMN "reviewed_by_id" VARCHAR(128),
  ADD COLUMN "review_notes_ar" TEXT;

UPDATE "providers"
SET
  "onboarding_status" = 'approved',
  "submitted_at" = "created_at",
  "reviewed_at" = "updated_at",
  "reviewed_by_role" = 'admin',
  "reviewed_by_id" = 'seed-admin',
  "review_notes_ar" = COALESCE("review_notes_ar", 'جهة تشغيلية معتمدة ضمن بيانات WashOff الأساسية.')
WHERE "onboarding_status" IS NULL OR "submitted_at" IS NULL;

ALTER TABLE "providers"
  ALTER COLUMN "onboarding_status" SET NOT NULL,
  ALTER COLUMN "submitted_at" SET NOT NULL,
  ALTER COLUMN "onboarding_status" SET DEFAULT 'approved';

CREATE INDEX "hotels_onboarding_status_idx" ON "hotels" ("onboarding_status");
CREATE INDEX "providers_onboarding_status_idx" ON "providers" ("onboarding_status");
