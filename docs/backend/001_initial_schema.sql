CREATE TABLE hotels (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name_ar TEXT NOT NULL,
  display_name_en TEXT,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  line_1 TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contracted_service_ids_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  category TEXT NOT NULL,
  billing_unit TEXT NOT NULL,
  default_unit_price_sar NUMERIC(12, 2) NOT NULL,
  default_turnaround_hours INTEGER NOT NULL,
  supports_rush BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  legal_name_ar TEXT NOT NULL,
  legal_name_en TEXT,
  display_name_ar TEXT NOT NULL,
  display_name_en TEXT,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  line_1 TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  service_area_cities_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE provider_capabilities (
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id),
  service_name_ar TEXT NOT NULL,
  service_name_en TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  unit_price_sar NUMERIC(12, 2) NOT NULL,
  max_daily_kg NUMERIC(12, 2) NOT NULL,
  max_single_order_kg NUMERIC(12, 2) NOT NULL,
  rush_supported BOOLEAN NOT NULL DEFAULT FALSE,
  supported_city_codes_json JSONB NOT NULL,
  default_turnaround_hours INTEGER NOT NULL,
  minimum_pickup_lead_hours INTEGER NOT NULL,
  pickup_window_start_hour INTEGER NOT NULL,
  pickup_window_end_hour INTEGER NOT NULL,
  PRIMARY KEY (provider_id, service_id)
);

CREATE TABLE provider_capacity (
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  capacity_date DATE NOT NULL,
  total_kg NUMERIC(12, 2) NOT NULL,
  committed_kg NUMERIC(12, 2) NOT NULL,
  reserved_kg NUMERIC(12, 2) NOT NULL,
  available_kg NUMERIC(12, 2) NOT NULL,
  utilization_ratio NUMERIC(6, 4) NOT NULL,
  status TEXT NOT NULL,
  cutoff_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (provider_id, capacity_date)
);

CREATE TABLE provider_performance_stats (
  provider_id TEXT PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  rating NUMERIC(4, 2) NOT NULL,
  acceptance_rate NUMERIC(6, 4) NOT NULL,
  on_time_pickup_rate NUMERIC(6, 4) NOT NULL,
  on_time_delivery_rate NUMERIC(6, 4) NOT NULL,
  quality_score NUMERIC(8, 2) NOT NULL,
  dispute_rate NUMERIC(6, 4) NOT NULL,
  reassignment_rate NUMERIC(6, 4) NOT NULL,
  completed_orders INTEGER NOT NULL,
  cancelled_orders INTEGER NOT NULL,
  last_evaluated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id),
  provider_id TEXT REFERENCES providers(id),
  hotel_snapshot_json JSONB NOT NULL,
  provider_snapshot_json JSONB,
  assignment_mode TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  currency TEXT NOT NULL,
  estimated_subtotal_sar NUMERIC(12, 2) NOT NULL,
  total_item_count NUMERIC(12, 2) NOT NULL,
  pickup_at TIMESTAMPTZ NOT NULL,
  notes_ar TEXT,
  status_updated_at TIMESTAMPTZ NOT NULL,
  progress_percent NUMERIC(5, 2),
  active_assignment_id TEXT,
  sla_window_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id),
  service_name_ar TEXT NOT NULL,
  service_name_en TEXT,
  quantity NUMERIC(12, 2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price_sar NUMERIC(12, 2) NOT NULL,
  estimated_line_total_sar NUMERIC(12, 2) NOT NULL,
  notes_ar TEXT
);

CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  hotel_id TEXT NOT NULL REFERENCES hotels(id),
  provider_id TEXT NOT NULL REFERENCES providers(id),
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL,
  response_due_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  score_breakdown_json JSONB NOT NULL,
  eligibility_result_json JSONB NOT NULL
);

CREATE TABLE assignment_history (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  attempt_number INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  actor_role TEXT NOT NULL,
  reason_ar TEXT
);

CREATE TABLE matching_logs (
  id TEXT PRIMARY KEY,
  matching_run_id TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  decision TEXT NOT NULL,
  eligibility_result_json JSONB NOT NULL,
  score_breakdown_json JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  notes_ar TEXT
);

CREATE TABLE reassignment_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_assignment_id TEXT REFERENCES assignments(id),
  previous_provider_id TEXT REFERENCES providers(id),
  next_provider_id TEXT REFERENCES providers(id),
  reason TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  notes_ar TEXT
);

CREATE TABLE sla_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  checkpoint TEXT NOT NULL,
  target_at TIMESTAMPTZ NOT NULL,
  actual_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  notes_ar TEXT
);

CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  hotel_id TEXT NOT NULL REFERENCES hotels(id),
  provider_id TEXT NOT NULL REFERENCES providers(id),
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  subtotal_sar NUMERIC(12, 2) NOT NULL,
  platform_fee_sar NUMERIC(12, 2) NOT NULL,
  adjustments_sar NUMERIC(12, 2) NOT NULL,
  total_sar NUMERIC(12, 2) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE TABLE settlement_line_items (
  id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  order_item_id TEXT REFERENCES order_items(id),
  description_ar TEXT NOT NULL,
  description_en TEXT,
  quantity NUMERIC(12, 2) NOT NULL,
  unit_price_sar NUMERIC(12, 2) NOT NULL,
  total_sar NUMERIC(12, 2) NOT NULL
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  recipient_role TEXT NOT NULL,
  recipient_entity_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  body_ar TEXT NOT NULL,
  body_en TEXT,
  order_id TEXT REFERENCES orders(id),
  assignment_id TEXT REFERENCES assignments(id),
  created_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);
