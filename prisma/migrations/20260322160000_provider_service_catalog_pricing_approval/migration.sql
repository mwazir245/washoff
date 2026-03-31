CREATE TABLE "platform_products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_products_code_key" ON "platform_products"("code");

ALTER TABLE "services"
ADD COLUMN "product_id" TEXT,
ADD COLUMN "service_type" TEXT,
ADD COLUMN "pricing_unit" TEXT,
ADD COLUMN "suggested_price_sar" DECIMAL(12, 2),
ADD COLUMN "is_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "created_at" TIMESTAMPTZ(6),
ADD COLUMN "updated_at" TIMESTAMPTZ(6);

UPDATE "services"
SET "created_at" = NOW(),
    "updated_at" = NOW()
WHERE "created_at" IS NULL
   OR "updated_at" IS NULL;

ALTER TABLE "services"
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

CREATE INDEX "services_product_id_service_type_idx" ON "services"("product_id", "service_type");

ALTER TABLE "services"
ADD CONSTRAINT "services_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "platform_products"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "provider_capabilities"
ADD COLUMN "current_approved_price_sar" DECIMAL(12, 2),
ADD COLUMN "current_status" TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN "proposed_price_sar" DECIMAL(12, 2),
ADD COLUMN "proposed_status" TEXT,
ADD COLUMN "proposed_submitted_at" TIMESTAMPTZ(6),
ADD COLUMN "approved_at" TIMESTAMPTZ(6),
ADD COLUMN "approved_by_account_id" TEXT,
ADD COLUMN "approved_by_role" TEXT,
ADD COLUMN "rejection_reason_ar" TEXT,
ADD COLUMN "active_matrix" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "available_matrix" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "created_at" TIMESTAMPTZ(6),
ADD COLUMN "updated_at" TIMESTAMPTZ(6);

UPDATE "provider_capabilities"
SET "current_approved_price_sar" = CASE
        WHEN "active" THEN "unit_price_sar"
        ELSE NULL
    END,
    "current_status" = CASE
        WHEN "active" THEN 'active'
        ELSE 'inactive'
    END,
    "active_matrix" = COALESCE("active_matrix", true),
    "available_matrix" = COALESCE("available_matrix", true),
    "created_at" = COALESCE("created_at", NOW()),
    "updated_at" = COALESCE("updated_at", NOW());

ALTER TABLE "provider_capabilities"
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;
