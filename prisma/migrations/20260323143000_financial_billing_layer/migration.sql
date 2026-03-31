ALTER TABLE "orders"
  ADD COLUMN "hotel_financial_snapshot_json" JSONB,
  ADD COLUMN "provider_financial_snapshot_json" JSONB,
  ADD COLUMN "hotel_invoice_id" TEXT,
  ADD COLUMN "provider_statement_id" TEXT,
  ADD COLUMN "billed_at" TIMESTAMPTZ(6),
  ADD COLUMN "settled_at" TIMESTAMPTZ(6);

CREATE TABLE "hotel_invoices" (
  "id" TEXT NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "hotel_id" TEXT NOT NULL,
  "invoice_date" VARCHAR(10) NOT NULL,
  "currency_code" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "order_count" INTEGER NOT NULL,
  "subtotal_ex_vat_sar" DECIMAL(12,2) NOT NULL,
  "vat_amount_sar" DECIMAL(12,2) NOT NULL,
  "total_inc_vat_sar" DECIMAL(12,2) NOT NULL,
  "seller_json" JSONB NOT NULL,
  "buyer_json" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "issued_at" TIMESTAMPTZ(6) NOT NULL,
  "collected_at" TIMESTAMPTZ(6),
  "collected_by_account_id" TEXT,
  "collected_by_role" TEXT,
  CONSTRAINT "hotel_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hotel_invoices_invoice_number_key" ON "hotel_invoices"("invoice_number");
CREATE INDEX "hotel_invoices_hotel_id_invoice_date_idx" ON "hotel_invoices"("hotel_id", "invoice_date");

CREATE TABLE "hotel_invoice_order_lines" (
  "id" TEXT NOT NULL,
  "invoice_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "room_number" TEXT,
  "order_subtotal_ex_vat_sar" DECIMAL(12,2) NOT NULL,
  "order_vat_amount_sar" DECIMAL(12,2) NOT NULL,
  "order_total_inc_vat_sar" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "hotel_invoice_order_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hotel_invoice_order_lines_order_id_key" ON "hotel_invoice_order_lines"("order_id");
CREATE INDEX "hotel_invoice_order_lines_invoice_id_idx" ON "hotel_invoice_order_lines"("invoice_id");

CREATE TABLE "provider_statements" (
  "id" TEXT NOT NULL,
  "statement_number" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "statement_date" VARCHAR(10) NOT NULL,
  "currency_code" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "order_count" INTEGER NOT NULL,
  "subtotal_ex_vat_sar" DECIMAL(12,2) NOT NULL,
  "vat_amount_sar" DECIMAL(12,2) NOT NULL,
  "total_inc_vat_sar" DECIMAL(12,2) NOT NULL,
  "provider_json" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "paid_at" TIMESTAMPTZ(6),
  "paid_by_account_id" TEXT,
  "paid_by_role" TEXT,
  CONSTRAINT "provider_statements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provider_statements_statement_number_key" ON "provider_statements"("statement_number");
CREATE INDEX "provider_statements_provider_id_statement_date_idx" ON "provider_statements"("provider_id", "statement_date");

CREATE TABLE "provider_statement_order_lines" (
  "id" TEXT NOT NULL,
  "statement_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "room_number" TEXT,
  "provider_subtotal_ex_vat_sar" DECIMAL(12,2) NOT NULL,
  "provider_vat_amount_sar" DECIMAL(12,2) NOT NULL,
  "provider_total_inc_vat_sar" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "provider_statement_order_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provider_statement_order_lines_order_id_key" ON "provider_statement_order_lines"("order_id");
CREATE INDEX "provider_statement_order_lines_statement_id_idx" ON "provider_statement_order_lines"("statement_id");
