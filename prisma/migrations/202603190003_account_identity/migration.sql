CREATE TABLE "accounts" (
  "id" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "password_salt" TEXT,
  "password_hash" TEXT,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "linked_entity_type" TEXT,
  "linked_hotel_id" TEXT,
  "linked_provider_id" TEXT,
  "activation_state" TEXT NOT NULL,
  "activation_token_hash" TEXT,
  "activation_token_expires_at" TIMESTAMPTZ(6),
  "activation_eligible_at" TIMESTAMPTZ(6),
  "activated_at" TIMESTAMPTZ(6),
  "last_login_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

CREATE TABLE "account_sessions" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "linked_entity_type" TEXT,
  "linked_entity_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "last_seen_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),

  CONSTRAINT "account_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_sessions_account_id_idx" ON "account_sessions"("account_id");
CREATE INDEX "account_sessions_token_hash_idx" ON "account_sessions"("token_hash");
