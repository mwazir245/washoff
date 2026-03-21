-- DropForeignKey
ALTER TABLE "assignment_history" DROP CONSTRAINT "assignment_history_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "assignment_history" DROP CONSTRAINT "assignment_history_order_id_fkey";

-- DropForeignKey
ALTER TABLE "assignment_history" DROP CONSTRAINT "assignment_history_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_hotel_id_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "matching_logs" DROP CONSTRAINT "matching_logs_order_id_fkey";

-- DropForeignKey
ALTER TABLE "matching_logs" DROP CONSTRAINT "matching_logs_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_service_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_hotel_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "provider_capabilities" DROP CONSTRAINT "provider_capabilities_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "provider_capabilities" DROP CONSTRAINT "provider_capabilities_service_id_fkey";

-- DropForeignKey
ALTER TABLE "provider_capacity" DROP CONSTRAINT "provider_capacity_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "provider_performance_stats" DROP CONSTRAINT "provider_performance_stats_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "reassignment_events" DROP CONSTRAINT "reassignment_events_next_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "reassignment_events" DROP CONSTRAINT "reassignment_events_order_id_fkey";

-- DropForeignKey
ALTER TABLE "reassignment_events" DROP CONSTRAINT "reassignment_events_previous_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "reassignment_events" DROP CONSTRAINT "reassignment_events_previous_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "settlement_line_items" DROP CONSTRAINT "settlement_line_items_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "settlement_line_items" DROP CONSTRAINT "settlement_line_items_settlement_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_hotel_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_order_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "sla_history" DROP CONSTRAINT "sla_history_order_id_fkey";

-- DropIndex
DROP INDEX "idx_assignments_order_id";

-- DropIndex
DROP INDEX "idx_assignments_provider_id";

-- DropIndex
DROP INDEX "hotels_onboarding_status_idx";

-- DropIndex
DROP INDEX "idx_matching_logs_order_id";

-- DropIndex
DROP INDEX "idx_matching_logs_provider_id";

-- DropIndex
DROP INDEX "idx_orders_hotel_id";

-- DropIndex
DROP INDEX "idx_orders_provider_id";

-- DropIndex
DROP INDEX "idx_orders_status";

-- DropIndex
DROP INDEX "providers_onboarding_status_idx";

-- DropIndex
DROP INDEX "idx_reassignment_events_order_id";

-- AlterTable
ALTER TABLE "account_sessions" ADD COLUMN     "revoked_by_account_id" TEXT,
ADD COLUMN     "revoked_by_role" TEXT,
ADD COLUMN     "revoked_reason_ar" TEXT;

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "activation_token_issued_at" TIMESTAMPTZ(6),
ADD COLUMN     "activation_token_used_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_issued_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_requested_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_state" TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN     "password_reset_token_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_token_hash" TEXT,
ADD COLUMN     "password_reset_token_used_at" TIMESTAMPTZ(6),
ADD COLUMN     "reactivated_at" TIMESTAMPTZ(6),
ADD COLUMN     "reactivated_by_account_id" TEXT,
ADD COLUMN     "reactivated_by_role" TEXT,
ADD COLUMN     "reactivation_reason_ar" TEXT,
ADD COLUMN     "suspended_at" TIMESTAMPTZ(6),
ADD COLUMN     "suspended_by_account_id" TEXT,
ADD COLUMN     "suspended_by_role" TEXT,
ADD COLUMN     "suspension_reason_ar" TEXT;

-- AlterTable
ALTER TABLE "hotels" ALTER COLUMN "onboarding_status" SET DATA TYPE TEXT,
ALTER COLUMN "reviewed_by_role" SET DATA TYPE TEXT,
ALTER COLUMN "reviewed_by_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "providers" ALTER COLUMN "onboarding_status" SET DATA TYPE TEXT,
ALTER COLUMN "reviewed_by_role" SET DATA TYPE TEXT,
ALTER COLUMN "reviewed_by_id" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "identity_audit_events" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "session_id" TEXT,
    "event_type" TEXT NOT NULL,
    "actor_account_id" TEXT,
    "actor_role" TEXT,
    "linked_entity_type" TEXT,
    "linked_entity_id" TEXT,
    "details_ar" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "identity_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_audit_events_account_id_created_at_idx" ON "identity_audit_events"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "identity_audit_events_event_type_created_at_idx" ON "identity_audit_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "accounts_activation_token_hash_idx" ON "accounts"("activation_token_hash");

-- CreateIndex
CREATE INDEX "accounts_password_reset_token_hash_idx" ON "accounts"("password_reset_token_hash");
