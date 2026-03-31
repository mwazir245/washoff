-- AlterTable
ALTER TABLE "hotel_invoices" ADD COLUMN     "pdf_object_id" TEXT;

-- AlterTable
ALTER TABLE "hotels" ALTER COLUMN "tax_registration_number" SET DEFAULT '';

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "seller_address_ar" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seller_city_ar" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seller_legal_name_ar" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seller_vat_number" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "provider_statements" ADD COLUMN     "pdf_object_id" TEXT;

UPDATE "providers"
SET "tax_registration_number" = ''
WHERE "tax_registration_number" IS NULL;

-- AlterTable
ALTER TABLE "providers" ALTER COLUMN "tax_registration_number" SET NOT NULL,
ALTER COLUMN "tax_registration_number" SET DEFAULT '';

-- CreateTable
CREATE TABLE "hotel_contract_prices" (
    "hotel_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "unit_price_sar" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotel_contract_prices_pkey" PRIMARY KEY ("hotel_id","service_id")
);

-- CreateTable
CREATE TABLE "stored_objects" (
    "id" TEXT NOT NULL,
    "storage_provider" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "logical_bucket" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    "content_bytes" BYTEA NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stored_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_audit_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_status" TEXT,
    "next_status" TEXT NOT NULL,
    "actor_account_id" TEXT,
    "actor_role" TEXT,
    "notes_ar" TEXT,
    "metadata_json" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "finance_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" TEXT NOT NULL,
    "queue_name" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "lock_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_run_at" TIMESTAMPTZ(6) NOT NULL,
    "locked_at" TIMESTAMPTZ(6),
    "lock_owner" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "last_error_ar" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hotel_contract_prices_hotel_id_active_idx" ON "hotel_contract_prices"("hotel_id", "active");

-- CreateIndex
CREATE INDEX "hotel_contract_prices_service_id_active_idx" ON "hotel_contract_prices"("service_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "stored_objects_storage_key_key" ON "stored_objects"("storage_key");

-- CreateIndex
CREATE INDEX "stored_objects_logical_bucket_created_at_idx" ON "stored_objects"("logical_bucket", "created_at");

-- CreateIndex
CREATE INDEX "finance_audit_events_entity_type_entity_id_occurred_at_idx" ON "finance_audit_events"("entity_type", "entity_id", "occurred_at");

-- CreateIndex
CREATE INDEX "finance_audit_events_action_occurred_at_idx" ON "finance_audit_events"("action", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "background_jobs_idempotency_key_key" ON "background_jobs"("idempotency_key");

-- CreateIndex
CREATE INDEX "background_jobs_queue_name_status_next_run_at_idx" ON "background_jobs"("queue_name", "status", "next_run_at");

-- CreateIndex
CREATE INDEX "background_jobs_lock_key_status_idx" ON "background_jobs"("lock_key", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_invoices_pdf_object_id_key" ON "hotel_invoices"("pdf_object_id");

-- CreateIndex
CREATE INDEX "hotel_invoices_hotel_id_status_invoice_date_idx" ON "hotel_invoices"("hotel_id", "status", "invoice_date");

-- CreateIndex
CREATE INDEX "hotel_invoices_status_invoice_date_idx" ON "hotel_invoices"("status", "invoice_date");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_invoices_hotel_id_invoice_date_key" ON "hotel_invoices"("hotel_id", "invoice_date");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_service_id_idx" ON "order_items"("service_id");

-- CreateIndex
CREATE INDEX "orders_hotel_id_created_at_idx" ON "orders"("hotel_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_provider_id_created_at_idx" ON "orders"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_hotel_id_status_created_at_idx" ON "orders"("hotel_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_provider_id_status_created_at_idx" ON "orders"("provider_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_hotel_invoice_id_idx" ON "orders"("hotel_invoice_id");

-- CreateIndex
CREATE INDEX "orders_provider_statement_id_idx" ON "orders"("provider_statement_id");

-- CreateIndex
CREATE INDEX "provider_capabilities_service_id_current_status_idx" ON "provider_capabilities"("service_id", "current_status");

-- CreateIndex
CREATE INDEX "provider_capabilities_provider_id_current_status_idx" ON "provider_capabilities"("provider_id", "current_status");

-- CreateIndex
CREATE UNIQUE INDEX "provider_statements_pdf_object_id_key" ON "provider_statements"("pdf_object_id");

-- CreateIndex
CREATE INDEX "provider_statements_provider_id_status_statement_date_idx" ON "provider_statements"("provider_id", "status", "statement_date");

-- CreateIndex
CREATE INDEX "provider_statements_status_statement_date_idx" ON "provider_statements"("status", "statement_date");

-- CreateIndex
CREATE UNIQUE INDEX "provider_statements_provider_id_statement_date_key" ON "provider_statements"("provider_id", "statement_date");

-- AddForeignKey
ALTER TABLE "provider_capabilities" ADD CONSTRAINT "provider_capabilities_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_capabilities" ADD CONSTRAINT "provider_capabilities_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_hotel_invoice_id_fkey" FOREIGN KEY ("hotel_invoice_id") REFERENCES "hotel_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_statement_id_fkey" FOREIGN KEY ("provider_statement_id") REFERENCES "provider_statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_invoices" ADD CONSTRAINT "hotel_invoices_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_invoices" ADD CONSTRAINT "hotel_invoices_pdf_object_id_fkey" FOREIGN KEY ("pdf_object_id") REFERENCES "stored_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_invoice_order_lines" ADD CONSTRAINT "hotel_invoice_order_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "hotel_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_invoice_order_lines" ADD CONSTRAINT "hotel_invoice_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_statements" ADD CONSTRAINT "provider_statements_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_statements" ADD CONSTRAINT "provider_statements_pdf_object_id_fkey" FOREIGN KEY ("pdf_object_id") REFERENCES "stored_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_statement_order_lines" ADD CONSTRAINT "provider_statement_order_lines_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "provider_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_statement_order_lines" ADD CONSTRAINT "provider_statement_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_contract_prices" ADD CONSTRAINT "hotel_contract_prices_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_contract_prices" ADD CONSTRAINT "hotel_contract_prices_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

