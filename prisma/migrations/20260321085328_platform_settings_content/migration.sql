-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "site_name_ar" TEXT NOT NULL,
    "site_name_en" TEXT NOT NULL,
    "site_tagline_ar" TEXT NOT NULL,
    "site_tagline_en" TEXT NOT NULL,
    "mail_from_name_ar" TEXT NOT NULL,
    "mail_from_email" TEXT NOT NULL,
    "support_email" TEXT,
    "support_phone" TEXT,
    "registration_enabled" BOOLEAN NOT NULL DEFAULT true,
    "hotel_registration_enabled" BOOLEAN NOT NULL DEFAULT true,
    "provider_registration_enabled" BOOLEAN NOT NULL DEFAULT true,
    "require_admin_approval_for_hotels" BOOLEAN NOT NULL DEFAULT true,
    "require_admin_approval_for_providers" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by_account_id" TEXT,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings_audit" (
    "id" TEXT NOT NULL,
    "settings_key" TEXT NOT NULL,
    "old_value_json" JSONB,
    "new_value_json" JSONB NOT NULL,
    "changed_by_account_id" TEXT,
    "changed_by_role" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL,
    "notes_ar" TEXT,

    CONSTRAINT "platform_settings_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_content_entries" (
    "id" TEXT NOT NULL,
    "page_key" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "content_key" TEXT NOT NULL,
    "composite_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "label_ar" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "value_ar" TEXT NOT NULL,
    "value_en" TEXT NOT NULL,
    "description_ar" TEXT,
    "description_en" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by_account_id" TEXT,

    CONSTRAINT "platform_content_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_content_audit" (
    "id" TEXT NOT NULL,
    "content_entry_id" TEXT NOT NULL,
    "page_key" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "content_key" TEXT NOT NULL,
    "old_value_ar" TEXT,
    "old_value_en" TEXT,
    "new_value_ar" TEXT NOT NULL,
    "new_value_en" TEXT NOT NULL,
    "changed_by_account_id" TEXT,
    "changed_by_role" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL,
    "notes_ar" TEXT,

    CONSTRAINT "platform_content_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_settings_audit_changed_at_idx" ON "platform_settings_audit"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "platform_content_entries_composite_key_key" ON "platform_content_entries"("composite_key");

-- CreateIndex
CREATE INDEX "platform_content_entries_page_key_sort_order_idx" ON "platform_content_entries"("page_key", "sort_order");

-- CreateIndex
CREATE INDEX "platform_content_audit_page_key_changed_at_idx" ON "platform_content_audit"("page_key", "changed_at");
