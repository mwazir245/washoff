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
  city: string;
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

export interface ProviderRecord {
  id: string;
  code: string;
  legal_name_ar: string;
  legal_name_en?: string;
  display_name_ar: string;
  display_name_en?: string;
  country_code: string;
  city: string;
  district?: string;
  line_1?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
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
}

export interface OrderRecord {
  id: string;
  hotel_id: string;
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
  status_updated_at: string;
  progress_percent?: number;
  active_assignment_id?: string;
  sla_window_json: JsonString;
  created_at: string;
  updated_at: string;
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
  services: ServiceRecord[];
  providers: ProviderAggregateRecordSet[];
  orders: OrderAggregateRecordSet[];
  notifications: NotificationRecord[];
}
