export type JsonString = string;

export interface AccountRecord {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  password_salt?: string;
  password_hash?: string;
  role: string;
  status: string;
  linked_entity_type?: string;
  linked_hotel_id?: string;
  linked_provider_id?: string;
  activation_state: string;
  activation_token_hash?: string;
  activation_token_issued_at?: string;
  activation_token_expires_at?: string;
  activation_token_used_at?: string;
  activation_eligible_at?: string;
  activated_at?: string;
  password_reset_state?: string;
  password_reset_token_hash?: string;
  password_reset_requested_at?: string;
  password_reset_issued_at?: string;
  password_reset_token_expires_at?: string;
  password_reset_token_used_at?: string;
  password_reset_completed_at?: string;
  suspended_at?: string;
  suspended_by_account_id?: string;
  suspended_by_role?: string;
  suspension_reason_ar?: string;
  reactivated_at?: string;
  reactivated_by_account_id?: string;
  reactivated_by_role?: string;
  reactivation_reason_ar?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountSessionRecord {
  id: string;
  account_id: string;
  token_hash: string;
  role: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  created_at: string;
  expires_at: string;
  last_seen_at?: string;
  revoked_at?: string;
  revoked_reason_ar?: string;
  revoked_by_account_id?: string;
  revoked_by_role?: string;
}

export interface IdentityAuditEventRecord {
  id: string;
  account_id?: string;
  session_id?: string;
  event_type: string;
  actor_account_id?: string;
  actor_role?: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  details_ar?: string;
  metadata_json?: JsonString;
  created_at: string;
}

export interface PlatformSettingsRecord {
  id: string;
  site_name_ar: string;
  site_name_en: string;
  site_tagline_ar: string;
  site_tagline_en: string;
  seller_legal_name_ar: string;
  seller_vat_number: string;
  seller_address_ar: string;
  seller_city_ar: string;
  mail_from_name_ar: string;
  mail_from_email: string;
  support_email?: string;
  support_phone?: string;
  registration_enabled: boolean;
  hotel_registration_enabled: boolean;
  provider_registration_enabled: boolean;
  require_admin_approval_for_hotels: boolean;
  require_admin_approval_for_providers: boolean;
  updated_at: string;
  updated_by_account_id?: string;
}

export interface PlatformSettingsAuditRecord {
  id: string;
  settings_key: string;
  old_value_json?: JsonString;
  new_value_json: JsonString;
  changed_by_account_id?: string;
  changed_by_role?: string;
  changed_at: string;
  notes_ar?: string;
}

export interface PlatformContentEntryRecord {
  id: string;
  page_key: string;
  section_key: string;
  content_key: string;
  composite_key: string;
  content_type: string;
  label_ar: string;
  label_en: string;
  value_ar: string;
  value_en: string;
  description_ar?: string;
  description_en?: string;
  active: boolean;
  sort_order: number;
  updated_at: string;
  updated_by_account_id?: string;
}

export interface PlatformContentAuditRecord {
  id: string;
  content_entry_id: string;
  page_key: string;
  section_key: string;
  content_key: string;
  old_value_ar?: string;
  old_value_en?: string;
  new_value_ar: string;
  new_value_en: string;
  changed_by_account_id?: string;
  changed_by_role?: string;
  changed_at: string;
  notes_ar?: string;
}

export interface HotelRecord {
  id: string;
  code: string;
  display_name_ar: string;
  display_name_en?: string;
  legal_entity_name?: string;
  hotel_classification: string;
  room_count: number;
  country_code: string;
  city_id?: string;
  city: string;
  district_id?: string;
  district?: string;
  line_1?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  service_level: string;
  operating_hours: string;
  requires_daily_pickup: boolean;
  address_text: string;
  pickup_location?: string;
  has_loading_area: boolean;
  access_notes?: string;
  tax_registration_number: string;
  commercial_registration_number: string;
  commercial_registration_file_json: JsonString;
  delegation_letter_file_json?: JsonString;
  delegation_status: string;
  sla_profile_json?: JsonString;
  contracted_service_ids_json: JsonString;
  active: boolean;
  notes_ar?: string;
  onboarding_status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_role?: string;
  reviewed_by_id?: string;
  review_notes_ar?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformProductRecord {
  id: string;
  code: string;
  name_ar: string;
  name_en?: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderRecord {
  id: string;
  code: string;
  legal_name_ar: string;
  legal_name_en?: string;
  display_name_ar: string;
  display_name_en?: string;
  legal_entity_name?: string;
  country_code: string;
  city_id?: string;
  city: string;
  district_id?: string;
  district?: string;
  line_1?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  business_phone?: string;
  business_email?: string;
  address_text?: string;
  tax_registration_number?: string;
  commercial_registration_number?: string;
  commercial_registration_file_json?: JsonString;
  other_services_text?: string;
  acceptance_window_minutes?: number;
  pickup_lead_time_hours?: number;
  execution_time_hours?: number;
  delivery_time_hours?: number;
  coverage_type?: string;
  covered_district_ids_json?: JsonString;
  max_active_orders?: number;
  sla_profile_json?: JsonString;
  working_days_json?: JsonString;
  working_hours_from?: string;
  working_hours_to?: string;
  bank_name?: string;
  iban?: string;
  bank_account_holder_name?: string;
  account_setup_name?: string;
  account_setup_phone?: string;
  account_setup_email?: string;
  service_area_cities_json: JsonString;
  active: boolean;
  notes_ar?: string;
  onboarding_status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_role?: string;
  reviewed_by_id?: string;
  review_notes_ar?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderCapabilityRecord {
  provider_id: string;
  service_id: string;
  service_name_ar: string;
  service_name_en?: string;
  active: boolean;
  unit_price_sar: number;
  max_daily_kg: number;
  max_single_order_kg: number;
  rush_supported: boolean;
  supported_city_codes_json: JsonString;
  default_turnaround_hours: number;
  minimum_pickup_lead_hours: number;
  pickup_window_start_hour: number;
  pickup_window_end_hour: number;
  current_approved_price_sar?: number;
  current_status?: string;
  proposed_price_sar?: number;
  proposed_status?: string;
  proposed_submitted_at?: string;
  approved_at?: string;
  approved_by_account_id?: string;
  approved_by_role?: string;
  rejection_reason_ar?: string;
  active_matrix?: boolean;
  available_matrix?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderCapacityRecord {
  provider_id: string;
  capacity_date: string;
  total_kg: number;
  committed_kg: number;
  reserved_kg: number;
  available_kg: number;
  utilization_ratio: number;
  status: string;
  cutoff_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderPerformanceStatsRecord {
  provider_id: string;
  rating: number;
  acceptance_rate: number;
  on_time_pickup_rate: number;
  on_time_delivery_rate: number;
  quality_score: number;
  dispute_rate: number;
  reassignment_rate: number;
  completed_orders: number;
  cancelled_orders: number;
  total_tracked_orders?: number;
  on_time_pickups?: number;
  on_time_completions?: number;
  sla_compliance_rate?: number;
  average_delay_minutes?: number;
  last_evaluated_at: string;
}

export interface ServiceRecord {
  id: string;
  code: string;
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  category: string;
  billing_unit: string;
  default_unit_price_sar: number;
  default_turnaround_hours: number;
  supports_rush: boolean;
  active: boolean;
  product_id?: string;
  service_type?: string;
  pricing_unit?: string;
  suggested_price_sar?: number;
  is_available?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HotelContractPriceRecord {
  hotel_id: string;
  service_id: string;
  unit_price_sar: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  hotel_id: string;
  room_number?: string;
  provider_id?: string;
  hotel_snapshot_json: JsonString;
  provider_snapshot_json?: JsonString;
  status_history_json?: JsonString;
  assignment_mode: string;
  status: string;
  priority: string;
  currency: string;
  estimated_subtotal_sar: number;
  total_item_count: number;
  pickup_at: string;
  notes_ar?: string;
  hotel_financial_snapshot_json?: JsonString;
  provider_financial_snapshot_json?: JsonString;
  hotel_invoice_id?: string;
  provider_statement_id?: string;
  billed_at?: string;
  settled_at?: string;
  status_updated_at: string;
  progress_percent?: number;
  active_assignment_id?: string;
  sla_window_json: JsonString;
  created_at: string;
  updated_at: string;
}

export interface HotelInvoiceRecord {
  id: string;
  invoice_number: string;
  hotel_id: string;
  invoice_date: string;
  currency_code: string;
  status: string;
  order_count: number;
  subtotal_ex_vat_sar: number;
  vat_amount_sar: number;
  total_inc_vat_sar: number;
  seller_json: JsonString;
  buyer_json: JsonString;
  pdf_object_id?: string;
  created_at: string;
  updated_at: string;
  issued_at: string;
  collected_at?: string;
  collected_by_account_id?: string;
  collected_by_role?: string;
}

export interface HotelInvoiceOrderLineRecord {
  id: string;
  invoice_id: string;
  order_id: string;
  room_number?: string;
  order_subtotal_ex_vat_sar: number;
  order_vat_amount_sar: number;
  order_total_inc_vat_sar: number;
}

export interface ProviderStatementRecord {
  id: string;
  statement_number: string;
  provider_id: string;
  statement_date: string;
  currency_code: string;
  status: string;
  order_count: number;
  subtotal_ex_vat_sar: number;
  vat_amount_sar: number;
  total_inc_vat_sar: number;
  provider_json: JsonString;
  pdf_object_id?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  paid_by_account_id?: string;
  paid_by_role?: string;
}

export interface ProviderStatementOrderLineRecord {
  id: string;
  statement_id: string;
  order_id: string;
  room_number?: string;
  provider_subtotal_ex_vat_sar: number;
  provider_vat_amount_sar: number;
  provider_total_inc_vat_sar: number;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  service_id: string;
  service_name_ar: string;
  service_name_en?: string;
  quantity: number;
  unit: string;
  unit_price_sar: number;
  estimated_line_total_sar: number;
  notes_ar?: string;
}

export interface AssignmentRecord {
  id: string;
  order_id: string;
  hotel_id: string;
  provider_id: string;
  attempt_number: number;
  status: string;
  assigned_at: string;
  response_due_at?: string;
  responded_at?: string;
  accepted_at?: string;
  score_breakdown_json: JsonString;
  eligibility_result_json: JsonString;
}

export interface AssignmentHistoryRecord {
  id: string;
  assignment_id: string;
  order_id: string;
  provider_id: string;
  attempt_number: number;
  from_status?: string;
  to_status: string;
  changed_at: string;
  actor_role: string;
  reason_ar?: string;
}

export interface MatchingLogRecord {
  id: string;
  matching_run_id: string;
  order_id: string;
  provider_id: string;
  decision: string;
  eligibility_result_json: JsonString;
  score_breakdown_json: JsonString;
  evaluated_at: string;
  notes_ar?: string;
}

export interface ReassignmentEventRecord {
  id: string;
  order_id: string;
  previous_assignment_id?: string;
  previous_provider_id?: string;
  next_provider_id?: string;
  reason: string;
  actor_role: string;
  created_at: string;
  notes_ar?: string;
}

export interface SLAHistoryRecord {
  id: string;
  order_id: string;
  checkpoint: string;
  target_at: string;
  actual_at?: string;
  status: string;
  recorded_at: string;
  notes_ar?: string;
}

export interface SettlementRecord {
  id: string;
  order_id: string;
  hotel_id: string;
  provider_id: string;
  currency: string;
  status: string;
  subtotal_sar: number;
  platform_fee_sar: number;
  adjustments_sar: number;
  total_sar: number;
  generated_at: string;
  due_at?: string;
  paid_at?: string;
}

export interface SettlementLineItemRecord {
  id: string;
  settlement_id: string;
  order_item_id?: string;
  description_ar: string;
  description_en?: string;
  quantity: number;
  unit_price_sar: number;
  total_sar: number;
}

export interface NotificationRecord {
  id: string;
  recipient_role: string;
  recipient_entity_id: string;
  channel: string;
  status: string;
  title_ar: string;
  title_en?: string;
  body_ar: string;
  body_en?: string;
  order_id?: string;
  assignment_id?: string;
  created_at: string;
  sent_at?: string;
  read_at?: string;
}

export interface StoredObjectRecord {
  id: string;
  storage_provider: string;
  storage_key: string;
  logical_bucket: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256: string;
  content_base64: string;
  metadata_json?: JsonString;
  created_at: string;
  updated_at: string;
}

export interface FinanceAuditEventRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  previous_status?: string;
  next_status: string;
  actor_account_id?: string;
  actor_role?: string;
  notes_ar?: string;
  metadata_json?: JsonString;
  occurred_at: string;
}

export interface BackgroundJobRecord {
  id: string;
  queue_name: string;
  job_type: string;
  lock_key: string;
  status: string;
  payload_json: JsonString;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  locked_at?: string;
  lock_owner?: string;
  completed_at?: string;
  last_error_ar?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderAggregateRecordSet {
  order: OrderRecord;
  items: OrderItemRecord[];
  assignments: AssignmentRecord[];
  assignment_history: AssignmentHistoryRecord[];
  matching_logs: MatchingLogRecord[];
  reassignment_events: ReassignmentEventRecord[];
  sla_history: SLAHistoryRecord[];
  settlements: SettlementRecord[];
  settlement_line_items: SettlementLineItemRecord[];
}

export interface ProviderAggregateRecordSet {
  provider: ProviderRecord;
  capabilities: ProviderCapabilityRecord[];
  capacity: ProviderCapacityRecord;
  performance: ProviderPerformanceStatsRecord;
}

export interface PlatformPersistenceSnapshot {
  accounts: AccountRecord[];
  account_sessions: AccountSessionRecord[];
  identity_audit_events: IdentityAuditEventRecord[];
  platform_settings: PlatformSettingsRecord[];
  platform_settings_audit: PlatformSettingsAuditRecord[];
  platform_content_entries: PlatformContentEntryRecord[];
  platform_content_audit: PlatformContentAuditRecord[];
  hotels: HotelRecord[];
  platform_products: PlatformProductRecord[];
  services: ServiceRecord[];
  hotel_contract_prices: HotelContractPriceRecord[];
  providers: ProviderAggregateRecordSet[];
  orders: OrderAggregateRecordSet[];
  hotel_invoices: HotelInvoiceRecord[];
  hotel_invoice_order_lines: HotelInvoiceOrderLineRecord[];
  provider_statements: ProviderStatementRecord[];
  provider_statement_order_lines: ProviderStatementOrderLineRecord[];
  stored_objects: StoredObjectRecord[];
  finance_audit_events: FinanceAuditEventRecord[];
  background_jobs: BackgroundJobRecord[];
  notifications: NotificationRecord[];
}
