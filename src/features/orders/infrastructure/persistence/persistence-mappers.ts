import {
  AccountActivationState,
  AccountRole,
  AccountStatus,
  LinkedEntityType,
  IdentityAuditEventType,
  PasswordResetState,
  type IdentityAuditEvent,
  type AccountProfile,
  type AccountSessionProfile,
  type StoredAccount,
  type StoredAccountSession,
} from "@/features/auth/model";
import type {
  PlatformContentAuditEntry,
  PlatformContentEntry,
} from "@/features/content/model/platform-content";
import {
  AssignmentStatus,
  NotificationChannel,
  NotificationStatus,
  OnboardingStatus,
  OrderAssignmentMode,
  OrderPriority,
  OrderStatus,
  ProviderCapacityStatus,
  ServiceBillingUnit,
  ServiceCategory,
  SettlementStatus,
  SLACheckpoint,
  SLAStatus,
} from "@/features/orders/model";
import type {
  PlatformSettings,
  PlatformSettingsAuditEntry,
} from "@/features/platform-settings/model/platform-settings";
import type {
  Assignment,
  AssignmentHistory,
  HotelProfile,
  LaundryOrder,
  MatchingLog,
  Notification,
  ProviderCapacity,
  ProviderPerformanceStats,
  ProviderProfile,
  ReassignmentEvent,
  ServiceCatalogItem,
  Settlement,
  SLAHistory,
} from "@/features/orders/model";
import { buildHotelDocumentDownloadPath } from "@/features/orders/model";
import type {
  OrderItem,
  OrderPartySnapshot,
  OrderSlaWindow,
  OrderStatusHistoryEntry,
} from "@/features/orders/model/order";
import type { SettlementLineItem } from "@/features/orders/model/settlement";
import type {
  AccountRecord,
  AccountSessionRecord,
  IdentityAuditEventRecord,
  PlatformContentAuditRecord,
  PlatformContentEntryRecord,
  PlatformSettingsAuditRecord,
  PlatformSettingsRecord,
  AssignmentHistoryRecord,
  AssignmentRecord,
  HotelRecord,
  MatchingLogRecord,
  NotificationRecord,
  OrderAggregateRecordSet,
  OrderItemRecord,
  OrderRecord,
  PlatformPersistenceSnapshot,
  ProviderAggregateRecordSet,
  ProviderCapabilityRecord,
  ProviderCapacityRecord,
  ProviderPerformanceStatsRecord,
  ProviderRecord,
  ReassignmentEventRecord,
  ServiceRecord,
  SettlementLineItemRecord,
  SettlementRecord,
  SLAHistoryRecord,
} from "@/features/orders/infrastructure/persistence/persistence-records";

const serialize = (value: unknown) => JSON.stringify(value);
const deserialize = <Value,>(value: string | undefined, fallback: Value): Value => {
  if (!value) {
    return fallback;
  }

  return JSON.parse(value) as Value;
};

const mapPartySnapshot = (snapshot: OrderPartySnapshot) => serialize(snapshot);
const mapLocalizedText = (ar: string, en?: string) => ({ ar, en });

export const toAccountRecord = (account: StoredAccount): AccountRecord => ({
  id: account.id,
  full_name: account.fullName,
  email: account.email,
  phone: account.phone,
  password_salt: account.passwordSalt,
  password_hash: account.passwordHash,
  role: account.role,
  status: account.status,
  linked_entity_type: account.linkedEntityType,
  linked_hotel_id: account.linkedHotelId,
  linked_provider_id: account.linkedProviderId,
  activation_state: account.activation.state,
  activation_token_hash: account.activationTokenHash,
  activation_token_issued_at: account.activation.issuedAt,
  activation_token_expires_at: account.activation.tokenExpiresAt,
  activation_token_used_at: account.activation.usedAt,
  activation_eligible_at: account.activation.eligibleAt,
  activated_at: account.activation.activatedAt,
  password_reset_state: account.passwordReset.state,
  password_reset_token_hash: account.passwordResetTokenHash,
  password_reset_requested_at: account.passwordReset.requestedAt,
  password_reset_issued_at: account.passwordReset.issuedAt,
  password_reset_token_expires_at: account.passwordReset.tokenExpiresAt,
  password_reset_token_used_at: account.passwordReset.usedAt,
  password_reset_completed_at: account.passwordReset.completedAt,
  suspended_at: account.suspension.suspendedAt,
  suspended_by_account_id: account.suspension.suspendedByAccountId,
  suspended_by_role: account.suspension.suspendedByRole,
  suspension_reason_ar: account.suspension.suspensionReasonAr,
  reactivated_at: account.suspension.reactivatedAt,
  reactivated_by_account_id: account.suspension.reactivatedByAccountId,
  reactivated_by_role: account.suspension.reactivatedByRole,
  reactivation_reason_ar: account.suspension.reactivationReasonAr,
  last_login_at: account.lastLoginAt,
  created_at: account.createdAt,
  updated_at: account.updatedAt,
});

export const toAccountSessionRecord = (session: StoredAccountSession): AccountSessionRecord => ({
  id: session.id,
  account_id: session.accountId,
  token_hash: session.tokenHash,
  role: session.role,
  linked_entity_type: session.linkedEntityType,
  linked_entity_id: session.linkedEntityId,
  created_at: session.createdAt,
  expires_at: session.expiresAt,
  last_seen_at: session.lastSeenAt,
  revoked_at: session.revokedAt,
  revoked_reason_ar: session.revokedReasonAr,
  revoked_by_account_id: session.revokedByAccountId,
  revoked_by_role: session.revokedByRole,
});

export const toIdentityAuditEventRecord = (event: IdentityAuditEvent): IdentityAuditEventRecord => ({
  id: event.id,
  account_id: event.accountId,
  session_id: event.sessionId,
  event_type: event.type,
  actor_account_id: event.actorAccountId,
  actor_role: event.actorRole,
  linked_entity_type: event.linkedEntityType,
  linked_entity_id: event.linkedEntityId,
  details_ar: event.detailsAr,
  metadata_json: event.metadata ? serialize(event.metadata) : undefined,
  created_at: event.createdAt,
});

export const toPlatformSettingsRecord = (
  settings: PlatformSettings,
): PlatformSettingsRecord => ({
  id: settings.id,
  site_name_ar: settings.siteNameAr,
  site_name_en: settings.siteNameEn,
  site_tagline_ar: settings.siteTaglineAr,
  site_tagline_en: settings.siteTaglineEn,
  mail_from_name_ar: settings.mailFromNameAr,
  mail_from_email: settings.mailFromEmail,
  support_email: settings.supportEmail,
  support_phone: settings.supportPhone,
  registration_enabled: settings.registrationEnabled,
  hotel_registration_enabled: settings.hotelRegistrationEnabled,
  provider_registration_enabled: settings.providerRegistrationEnabled,
  require_admin_approval_for_hotels: settings.requireAdminApprovalForHotels,
  require_admin_approval_for_providers: settings.requireAdminApprovalForProviders,
  updated_at: settings.updatedAt,
  updated_by_account_id: settings.updatedByAccountId,
});

export const toPlatformSettingsAuditRecord = (
  audit: PlatformSettingsAuditEntry,
): PlatformSettingsAuditRecord => ({
  id: audit.id,
  settings_key: audit.settingsKey,
  old_value_json: audit.oldValueJson,
  new_value_json: audit.newValueJson,
  changed_by_account_id: audit.changedByAccountId,
  changed_by_role: audit.changedByRole,
  changed_at: audit.changedAt,
  notes_ar: audit.notesAr,
});

export const toPlatformContentEntryRecord = (
  entry: PlatformContentEntry,
): PlatformContentEntryRecord => ({
  id: entry.id,
  page_key: entry.pageKey,
  section_key: entry.sectionKey,
  content_key: entry.contentKey,
  composite_key: entry.compositeKey,
  content_type: entry.contentType,
  label_ar: entry.labelAr,
  label_en: entry.labelEn,
  value_ar: entry.valueAr,
  value_en: entry.valueEn,
  description_ar: entry.descriptionAr,
  description_en: entry.descriptionEn,
  active: entry.active,
  sort_order: entry.sortOrder,
  updated_at: entry.updatedAt,
  updated_by_account_id: entry.updatedByAccountId,
});

export const toPlatformContentAuditRecord = (
  audit: PlatformContentAuditEntry,
): PlatformContentAuditRecord => ({
  id: audit.id,
  content_entry_id: audit.contentEntryId,
  page_key: audit.pageKey,
  section_key: audit.sectionKey,
  content_key: audit.contentKey,
  old_value_ar: audit.oldValueAr,
  old_value_en: audit.oldValueEn,
  new_value_ar: audit.newValueAr,
  new_value_en: audit.newValueEn,
  changed_by_account_id: audit.changedByAccountId,
  changed_by_role: audit.changedByRole,
  changed_at: audit.changedAt,
  notes_ar: audit.notesAr,
});

export const toHotelRecord = (hotel: HotelProfile): HotelRecord => ({
  id: hotel.id,
  code: hotel.code,
  display_name_ar: hotel.displayName.ar,
  display_name_en: hotel.displayName.en,
  legal_entity_name: hotel.legalEntityName,
  hotel_classification: hotel.classification,
  room_count: hotel.roomCount,
  country_code: hotel.address.countryCode,
  city: hotel.address.city,
  district: hotel.address.district,
  line_1: hotel.address.line1,
  postal_code: hotel.address.postalCode,
  latitude: hotel.address.latitude,
  longitude: hotel.address.longitude,
  timezone: hotel.timezone,
  contact_name: hotel.contact.name,
  contact_phone: hotel.contact.phone,
  contact_email: hotel.contact.email,
  service_level: hotel.operationalProfile.serviceLevel,
  operating_hours: hotel.operationalProfile.operatingHours,
  requires_daily_pickup: hotel.operationalProfile.requiresDailyPickup,
  address_text: hotel.logistics.addressText,
  pickup_location: hotel.logistics.pickupLocation,
  has_loading_area: hotel.logistics.hasLoadingArea,
  access_notes: hotel.logistics.accessNotes,
  tax_registration_number: hotel.compliance.taxRegistrationNumber,
  commercial_registration_number: hotel.compliance.commercialRegistrationNumber,
  commercial_registration_file_json: serialize(hotel.compliance.commercialRegistrationFile),
  delegation_letter_file_json: hotel.compliance.delegationLetterFile
    ? serialize(hotel.compliance.delegationLetterFile)
    : undefined,
  delegation_status: hotel.compliance.delegationStatus,
  contracted_service_ids_json: serialize(hotel.contractedServiceIds),
  active: hotel.active,
  notes_ar: hotel.notesAr,
  onboarding_status: hotel.onboarding.status,
  submitted_at: hotel.onboarding.submittedAt,
  reviewed_at: hotel.onboarding.reviewedAt,
  reviewed_by_role: hotel.onboarding.reviewedByRole,
  reviewed_by_id: hotel.onboarding.reviewedById,
  review_notes_ar: hotel.onboarding.reviewNotesAr,
  created_at: hotel.createdAt,
  updated_at: hotel.updatedAt,
});

export const toServiceRecord = (service: ServiceCatalogItem): ServiceRecord => ({
  id: service.id,
  code: service.code,
  name_ar: service.name.ar,
  name_en: service.name.en,
  description_ar: service.description?.ar,
  description_en: service.description?.en,
  category: service.category,
  billing_unit: service.billingUnit,
  default_unit_price_sar: service.defaultUnitPriceSar,
  default_turnaround_hours: service.defaultTurnaroundHours,
  supports_rush: service.supportsRush,
  active: service.active,
});

export const toProviderRecord = (provider: ProviderProfile): ProviderRecord => ({
  id: provider.id,
  code: provider.code,
  legal_name_ar: provider.legalName.ar,
  legal_name_en: provider.legalName.en,
  display_name_ar: provider.displayName.ar,
  display_name_en: provider.displayName.en,
  country_code: provider.address.countryCode,
  city: provider.address.city,
  district: provider.address.district,
  line_1: provider.address.line1,
  postal_code: provider.address.postalCode,
  latitude: provider.address.latitude,
  longitude: provider.address.longitude,
  timezone: provider.timezone,
  contact_name: provider.contact.name,
  contact_phone: provider.contact.phone,
  contact_email: provider.contact.email,
  service_area_cities_json: serialize(provider.serviceAreaCities),
  active: provider.active,
  notes_ar: provider.notesAr,
  onboarding_status: provider.onboarding.status,
  submitted_at: provider.onboarding.submittedAt,
  reviewed_at: provider.onboarding.reviewedAt,
  reviewed_by_role: provider.onboarding.reviewedByRole,
  reviewed_by_id: provider.onboarding.reviewedById,
  review_notes_ar: provider.onboarding.reviewNotesAr,
  created_at: provider.createdAt,
  updated_at: provider.updatedAt,
});

export const toProviderCapabilityRecords = (provider: ProviderProfile): ProviderCapabilityRecord[] =>
  provider.capabilities.map((capability) => ({
    provider_id: provider.id,
    service_id: capability.serviceId,
    service_name_ar: capability.serviceName.ar,
    service_name_en: capability.serviceName.en,
    active: capability.active,
    unit_price_sar: capability.unitPriceSar,
    max_daily_kg: capability.maxDailyKg,
    max_single_order_kg: capability.maxSingleOrderKg,
    rush_supported: capability.rushSupported,
    supported_city_codes_json: serialize(capability.supportedCityCodes),
    default_turnaround_hours: capability.defaultTurnaroundHours,
    minimum_pickup_lead_hours: capability.minimumPickupLeadHours,
    pickup_window_start_hour: capability.pickupWindow.startHour,
    pickup_window_end_hour: capability.pickupWindow.endHour,
  }));

export const toProviderCapacityRecord = (capacity: ProviderCapacity): ProviderCapacityRecord => ({
  provider_id: capacity.providerId,
  capacity_date: capacity.date,
  total_kg: capacity.totalKg,
  committed_kg: capacity.committedKg,
  reserved_kg: capacity.reservedKg,
  available_kg: capacity.availableKg,
  utilization_ratio: capacity.utilizationRatio,
  status: capacity.status,
  cutoff_at: capacity.cutoffAt,
  created_at: capacity.createdAt,
  updated_at: capacity.updatedAt,
});

export const toProviderPerformanceStatsRecord = (
  performance: ProviderPerformanceStats,
): ProviderPerformanceStatsRecord => ({
  provider_id: performance.providerId,
  rating: performance.rating,
  acceptance_rate: performance.acceptanceRate,
  on_time_pickup_rate: performance.onTimePickupRate,
  on_time_delivery_rate: performance.onTimeDeliveryRate,
  quality_score: performance.qualityScore,
  dispute_rate: performance.disputeRate,
  reassignment_rate: performance.reassignmentRate,
  completed_orders: performance.completedOrders,
  cancelled_orders: performance.cancelledOrders,
  last_evaluated_at: performance.lastEvaluatedAt,
});

export const toProviderAggregateRecordSet = (provider: ProviderProfile): ProviderAggregateRecordSet => ({
  provider: toProviderRecord(provider),
  capabilities: toProviderCapabilityRecords(provider),
  capacity: toProviderCapacityRecord(provider.currentCapacity),
  performance: toProviderPerformanceStatsRecord(provider.performance),
});

export const toOrderRecord = (order: LaundryOrder): OrderRecord => ({
  id: order.id,
  hotel_id: order.hotelId,
  provider_id: order.providerId,
  hotel_snapshot_json: mapPartySnapshot(order.hotelSnapshot),
  provider_snapshot_json: order.providerSnapshot ? mapPartySnapshot(order.providerSnapshot) : undefined,
  status_history_json: order.statusHistory ? serialize(order.statusHistory) : undefined,
  assignment_mode: order.assignmentMode,
  status: order.status,
  priority: order.priority,
  currency: order.currency,
  estimated_subtotal_sar: order.estimatedSubtotalSar,
  total_item_count: order.totalItemCount,
  pickup_at: order.pickupAt,
  notes_ar: order.notesAr,
  status_updated_at: order.statusUpdatedAt,
  progress_percent: order.progressPercent,
  active_assignment_id: order.activeAssignmentId,
  sla_window_json: serialize(order.slaWindow),
  created_at: order.createdAt,
  updated_at: order.updatedAt,
});

export const toOrderItemRecord = (orderId: string, item: OrderItem): OrderItemRecord => ({
  id: item.id,
  order_id: orderId,
  service_id: item.serviceId,
  service_name_ar: item.serviceName.ar,
  service_name_en: item.serviceName.en,
  quantity: item.quantity,
  unit: item.unit,
  unit_price_sar: item.unitPriceSar,
  estimated_line_total_sar: item.estimatedLineTotalSar,
  notes_ar: item.notesAr,
});

export const toAssignmentRecord = (assignment: Assignment): AssignmentRecord => ({
  id: assignment.id,
  order_id: assignment.orderId,
  hotel_id: assignment.hotelId,
  provider_id: assignment.providerId,
  attempt_number: assignment.attemptNumber,
  status: assignment.status,
  assigned_at: assignment.assignedAt,
  response_due_at: assignment.responseDueAt,
  responded_at: assignment.respondedAt,
  accepted_at: assignment.acceptedAt,
  score_breakdown_json: serialize(assignment.scoreBreakdown),
  eligibility_result_json: serialize(assignment.eligibilityResult),
});

export const toAssignmentHistoryRecord = (
  history: AssignmentHistory,
): AssignmentHistoryRecord => ({
  id: history.id,
  assignment_id: history.assignmentId,
  order_id: history.orderId,
  provider_id: history.providerId,
  attempt_number: history.attemptNumber,
  from_status: history.fromStatus,
  to_status: history.toStatus,
  changed_at: history.changedAt,
  actor_role: history.actorRole,
  reason_ar: history.reasonAr,
});

export const toMatchingLogRecord = (log: MatchingLog): MatchingLogRecord => ({
  id: log.id,
  matching_run_id: log.matchingRunId,
  order_id: log.orderId,
  provider_id: log.providerId,
  decision: log.decision,
  eligibility_result_json: serialize(log.eligibilityResult),
  score_breakdown_json: serialize(log.scoreBreakdown),
  evaluated_at: log.evaluatedAt,
  notes_ar: log.notesAr,
});

export const toReassignmentEventRecord = (
  event: ReassignmentEvent,
): ReassignmentEventRecord => ({
  id: event.id,
  order_id: event.orderId,
  previous_assignment_id: event.previousAssignmentId,
  previous_provider_id: event.previousProviderId,
  next_provider_id: event.nextProviderId,
  reason: event.reason,
  actor_role: event.actorRole,
  created_at: event.createdAt,
  notes_ar: event.notesAr,
});

export const toSLAHistoryRecord = (history: SLAHistory): SLAHistoryRecord => ({
  id: history.id,
  order_id: history.orderId,
  checkpoint: history.checkpoint,
  target_at: history.targetAt,
  actual_at: history.actualAt,
  status: history.status,
  recorded_at: history.recordedAt,
  notes_ar: history.notesAr,
});

export const toSettlementRecord = (settlement: Settlement): SettlementRecord => ({
  id: settlement.id,
  order_id: settlement.orderId,
  hotel_id: settlement.hotelId,
  provider_id: settlement.providerId,
  currency: settlement.currency,
  status: settlement.status,
  subtotal_sar: settlement.subtotalSar,
  platform_fee_sar: settlement.platformFeeSar,
  adjustments_sar: settlement.adjustmentsSar,
  total_sar: settlement.totalSar,
  generated_at: settlement.generatedAt,
  due_at: settlement.dueAt,
  paid_at: settlement.paidAt,
});

export const toSettlementLineItemRecord = (
  settlementId: string,
  item: SettlementLineItem,
): SettlementLineItemRecord => ({
  id: item.id,
  settlement_id: settlementId,
  order_item_id: item.orderItemId,
  description_ar: item.description.ar,
  description_en: item.description.en,
  quantity: item.quantity,
  unit_price_sar: item.unitPriceSar,
  total_sar: item.totalSar,
});

export const toNotificationRecord = (notification: Notification): NotificationRecord => ({
  id: notification.id,
  recipient_role: notification.recipientRole,
  recipient_entity_id: notification.recipientEntityId,
  channel: notification.channel,
  status: notification.status,
  title_ar: notification.title.ar,
  title_en: notification.title.en,
  body_ar: notification.body.ar,
  body_en: notification.body.en,
  order_id: notification.orderId,
  assignment_id: notification.assignmentId,
  created_at: notification.createdAt,
  sent_at: notification.sentAt,
  read_at: notification.readAt,
});

export const toOrderAggregateRecordSet = (order: LaundryOrder): OrderAggregateRecordSet => ({
  order: toOrderRecord(order),
  items: order.items.map((item) => toOrderItemRecord(order.id, item)),
  assignments: order.activeAssignment ? [toAssignmentRecord(order.activeAssignment)] : [],
  assignment_history: order.assignmentHistory.map((history) => toAssignmentHistoryRecord(history)),
  matching_logs: order.matchingLogs.map((log) => toMatchingLogRecord(log)),
  reassignment_events: order.reassignmentEvents.map((event) => toReassignmentEventRecord(event)),
  sla_history: order.slaHistory.map((history) => toSLAHistoryRecord(history)),
  settlements: order.settlement ? [toSettlementRecord(order.settlement)] : [],
  settlement_line_items: order.settlement
    ? order.settlement.lineItems.map((item) => toSettlementLineItemRecord(order.settlement!.id, item))
    : [],
});

export const buildPlatformPersistenceSnapshot = ({
  accounts = [],
  accountSessions = [],
  identityAuditEvents = [],
  platformSettings = [],
  platformSettingsAudit = [],
  platformContentEntries = [],
  platformContentAudit = [],
  hotels,
  providers,
  services,
  orders,
  notifications = [],
}: {
  accounts?: StoredAccount[];
  accountSessions?: StoredAccountSession[];
  identityAuditEvents?: IdentityAuditEvent[];
  platformSettings?: PlatformSettings[];
  platformSettingsAudit?: PlatformSettingsAuditEntry[];
  platformContentEntries?: PlatformContentEntry[];
  platformContentAudit?: PlatformContentAuditEntry[];
  hotels: HotelProfile[];
  providers: ProviderProfile[];
  services: ServiceCatalogItem[];
  orders: LaundryOrder[];
  notifications?: Notification[];
}): PlatformPersistenceSnapshot => ({
  accounts: accounts.map((account) => toAccountRecord(account)),
  account_sessions: accountSessions.map((session) => toAccountSessionRecord(session)),
  identity_audit_events: identityAuditEvents.map((event) => toIdentityAuditEventRecord(event)),
  platform_settings: platformSettings.map((entry) => toPlatformSettingsRecord(entry)),
  platform_settings_audit: platformSettingsAudit.map((entry) => toPlatformSettingsAuditRecord(entry)),
  platform_content_entries: platformContentEntries.map((entry) => toPlatformContentEntryRecord(entry)),
  platform_content_audit: platformContentAudit.map((entry) => toPlatformContentAuditRecord(entry)),
  hotels: hotels.map((hotel) => toHotelRecord(hotel)),
  services: services.map((service) => toServiceRecord(service)),
  providers: providers.map((provider) => toProviderAggregateRecordSet(provider)),
  orders: orders.map((order) => toOrderAggregateRecordSet(order)),
  notifications: notifications.map((notification) => toNotificationRecord(notification)),
});

export const fromHotelRecord = (record: HotelRecord): HotelProfile => ({
  id: record.id,
  code: record.code,
  displayName: mapLocalizedText(record.display_name_ar, record.display_name_en),
  legalEntityName: record.legal_entity_name,
  classification: record.hotel_classification as HotelProfile["classification"],
  roomCount: record.room_count,
  address: {
    countryCode: record.country_code,
    city: record.city,
    district: record.district,
    line1: record.line_1,
    postalCode: record.postal_code,
    latitude: record.latitude,
    longitude: record.longitude,
  },
  timezone: record.timezone,
  contact: {
    name: record.contact_name,
    phone: record.contact_phone,
    email: record.contact_email,
  },
  operationalProfile: {
    serviceLevel: record.service_level as HotelProfile["operationalProfile"]["serviceLevel"],
    operatingHours: record.operating_hours,
    requiresDailyPickup: record.requires_daily_pickup,
  },
  logistics: {
    addressText: record.address_text,
    pickupLocation: record.pickup_location,
    hasLoadingArea: record.has_loading_area,
    accessNotes: record.access_notes,
  },
  compliance: {
    taxRegistrationNumber:
      record.tax_registration_number || record.commercial_registration_number,
    commercialRegistrationNumber: record.commercial_registration_number,
    commercialRegistrationFile: {
      ...deserialize(record.commercial_registration_file_json, {
        kind: "commercial_registration",
        fileName: "",
        mimeType: "application/pdf",
        sizeBytes: 0,
        uploadedAt: record.created_at,
        storageKey: "",
      }),
        downloadPath: buildHotelDocumentDownloadPath(record.id, "commercial_registration"),
      },
    delegationLetterFile: record.delegation_letter_file_json
      ? {
          ...deserialize(record.delegation_letter_file_json, {
            kind: "delegation_letter",
            fileName: "",
            mimeType: "application/pdf",
            sizeBytes: 0,
            uploadedAt: record.created_at,
            storageKey: "",
          }),
          downloadPath: buildHotelDocumentDownloadPath(record.id, "delegation_letter"),
        }
      : undefined,
    delegationStatus: record.delegation_status as HotelProfile["compliance"]["delegationStatus"],
  },
  contractedServiceIds: deserialize<string[]>(record.contracted_service_ids_json, []),
  active: record.active,
  notesAr: record.notes_ar,
  onboarding: {
    status: (record.onboarding_status as OnboardingStatus | undefined) ?? OnboardingStatus.Approved,
    submittedAt: record.submitted_at ?? record.created_at,
    reviewedAt: record.reviewed_at,
    reviewedByRole: record.reviewed_by_role as HotelProfile["onboarding"]["reviewedByRole"],
    reviewedById: record.reviewed_by_id,
    reviewNotesAr: record.review_notes_ar,
  },
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const fromAccountRecord = (record: AccountRecord): StoredAccount => ({
  id: record.id,
  fullName: record.full_name,
  email: record.email,
  phone: record.phone,
  passwordSalt: record.password_salt,
  passwordHash: record.password_hash,
  role: (record.role as AccountRole | undefined) ?? AccountRole.Hotel,
  status: (record.status as AccountStatus | undefined) ?? AccountStatus.PendingActivation,
  linkedEntityType: record.linked_entity_type as LinkedEntityType | undefined,
  linkedHotelId: record.linked_hotel_id,
  linkedProviderId: record.linked_provider_id,
  activation: {
    state:
      (record.activation_state as AccountActivationState | undefined) ??
      AccountActivationState.AwaitingApproval,
    issuedAt: record.activation_token_issued_at,
    eligibleAt: record.activation_eligible_at,
    tokenExpiresAt: record.activation_token_expires_at,
    usedAt: record.activation_token_used_at,
    activatedAt: record.activated_at,
    activationPath:
      record.activation_token_hash && record.activation_state === AccountActivationState.Ready
        ? "/activate-account"
        : undefined,
  },
  passwordReset: {
    state: (record.password_reset_state as PasswordResetState | undefined) ?? PasswordResetState.Idle,
    requestedAt: record.password_reset_requested_at,
    issuedAt: record.password_reset_issued_at,
    tokenExpiresAt: record.password_reset_token_expires_at,
    usedAt: record.password_reset_token_used_at,
    completedAt: record.password_reset_completed_at,
    resetPath:
      record.password_reset_token_hash && record.password_reset_state === PasswordResetState.Ready
        ? "/reset-password"
        : undefined,
  },
  suspension: {
    suspendedAt: record.suspended_at,
    suspendedByAccountId: record.suspended_by_account_id,
    suspendedByRole: record.suspended_by_role as AccountRole | "system" | undefined,
    suspensionReasonAr: record.suspension_reason_ar,
    reactivatedAt: record.reactivated_at,
    reactivatedByAccountId: record.reactivated_by_account_id,
    reactivatedByRole: record.reactivated_by_role as AccountRole | "system" | undefined,
    reactivationReasonAr: record.reactivation_reason_ar,
  },
  activationTokenHash: record.activation_token_hash,
  passwordResetTokenHash: record.password_reset_token_hash,
  lastLoginAt: record.last_login_at,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const fromAccountSessionRecord = (record: AccountSessionRecord): StoredAccountSession => ({
  id: record.id,
  accountId: record.account_id,
  tokenHash: record.token_hash,
  role: (record.role as AccountRole | undefined) ?? AccountRole.Hotel,
  linkedEntityType: record.linked_entity_type as LinkedEntityType | undefined,
  linkedEntityId: record.linked_entity_id,
  createdAt: record.created_at,
  expiresAt: record.expires_at,
  lastSeenAt: record.last_seen_at,
  revokedAt: record.revoked_at,
  revokedReasonAr: record.revoked_reason_ar,
  revokedByAccountId: record.revoked_by_account_id,
  revokedByRole: record.revoked_by_role as AccountRole | "system" | undefined,
});

export const fromIdentityAuditEventRecord = (record: IdentityAuditEventRecord): IdentityAuditEvent => ({
  id: record.id,
  accountId: record.account_id,
  sessionId: record.session_id,
  type: (record.event_type as IdentityAuditEventType | undefined) ?? IdentityAuditEventType.AccountCreated,
  actorAccountId: record.actor_account_id,
  actorRole: record.actor_role as AccountRole | "system" | undefined,
  linkedEntityType: record.linked_entity_type as LinkedEntityType | undefined,
  linkedEntityId: record.linked_entity_id,
  detailsAr: record.details_ar,
  metadata: record.metadata_json ? deserialize(record.metadata_json, {}) : undefined,
  createdAt: record.created_at,
});

export const fromPlatformSettingsRecord = (
  record: PlatformSettingsRecord,
): PlatformSettings => ({
  id: record.id,
  siteNameAr: record.site_name_ar,
  siteNameEn: record.site_name_en,
  siteTaglineAr: record.site_tagline_ar,
  siteTaglineEn: record.site_tagline_en,
  mailFromNameAr: record.mail_from_name_ar,
  mailFromEmail: record.mail_from_email,
  supportEmail: record.support_email,
  supportPhone: record.support_phone,
  registrationEnabled: record.registration_enabled,
  hotelRegistrationEnabled: record.hotel_registration_enabled,
  providerRegistrationEnabled: record.provider_registration_enabled,
  requireAdminApprovalForHotels: record.require_admin_approval_for_hotels,
  requireAdminApprovalForProviders: record.require_admin_approval_for_providers,
  updatedAt: record.updated_at,
  updatedByAccountId: record.updated_by_account_id,
});

export const fromPlatformSettingsAuditRecord = (
  record: PlatformSettingsAuditRecord,
): PlatformSettingsAuditEntry => ({
  id: record.id,
  settingsKey: record.settings_key,
  oldValueJson: record.old_value_json,
  newValueJson: record.new_value_json,
  changedByAccountId: record.changed_by_account_id,
  changedByRole: record.changed_by_role as "admin" | "system" | undefined,
  changedAt: record.changed_at,
  notesAr: record.notes_ar,
});

export const fromPlatformContentEntryRecord = (
  record: PlatformContentEntryRecord,
): PlatformContentEntry => ({
  id: record.id,
  pageKey: record.page_key,
  sectionKey: record.section_key,
  contentKey: record.content_key,
  compositeKey: record.composite_key,
  contentType: record.content_type as PlatformContentEntry["contentType"],
  labelAr: record.label_ar,
  labelEn: record.label_en,
  valueAr: record.value_ar,
  valueEn: record.value_en,
  descriptionAr: record.description_ar,
  descriptionEn: record.description_en,
  active: record.active,
  sortOrder: record.sort_order,
  updatedAt: record.updated_at,
  updatedByAccountId: record.updated_by_account_id,
});

export const fromPlatformContentAuditRecord = (
  record: PlatformContentAuditRecord,
): PlatformContentAuditEntry => ({
  id: record.id,
  contentEntryId: record.content_entry_id,
  pageKey: record.page_key,
  sectionKey: record.section_key,
  contentKey: record.content_key,
  oldValueAr: record.old_value_ar,
  oldValueEn: record.old_value_en,
  newValueAr: record.new_value_ar,
  newValueEn: record.new_value_en,
  changedByAccountId: record.changed_by_account_id,
  changedByRole: record.changed_by_role as "admin" | "system" | undefined,
  changedAt: record.changed_at,
  notesAr: record.notes_ar,
});

export const fromServiceRecord = (record: ServiceRecord): ServiceCatalogItem => ({
  id: record.id,
  code: record.code,
  name: mapLocalizedText(record.name_ar, record.name_en),
  description:
    record.description_ar || record.description_en
      ? mapLocalizedText(record.description_ar ?? "", record.description_en)
      : undefined,
  category: record.category as ServiceCategory,
  billingUnit: record.billing_unit as ServiceBillingUnit,
  defaultUnitPriceSar: record.default_unit_price_sar,
  defaultTurnaroundHours: record.default_turnaround_hours,
  supportsRush: record.supports_rush,
  active: record.active,
});

export const fromProviderCapacityRecord = (record: ProviderCapacityRecord): ProviderCapacity => ({
  providerId: record.provider_id,
  date: record.capacity_date,
  totalKg: record.total_kg,
  committedKg: record.committed_kg,
  reservedKg: record.reserved_kg,
  availableKg: record.available_kg,
  utilizationRatio: record.utilization_ratio,
  status: record.status as ProviderCapacityStatus,
  cutoffAt: record.cutoff_at,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const fromProviderPerformanceStatsRecord = (
  record: ProviderPerformanceStatsRecord,
): ProviderPerformanceStats => ({
  providerId: record.provider_id,
  rating: record.rating,
  acceptanceRate: record.acceptance_rate,
  onTimePickupRate: record.on_time_pickup_rate,
  onTimeDeliveryRate: record.on_time_delivery_rate,
  qualityScore: record.quality_score,
  disputeRate: record.dispute_rate,
  reassignmentRate: record.reassignment_rate,
  completedOrders: record.completed_orders,
  cancelledOrders: record.cancelled_orders,
  lastEvaluatedAt: record.last_evaluated_at,
});

export const fromProviderAggregateRecordSet = (
  aggregate: ProviderAggregateRecordSet,
): ProviderProfile => ({
  id: aggregate.provider.id,
  code: aggregate.provider.code,
  legalName: mapLocalizedText(aggregate.provider.legal_name_ar, aggregate.provider.legal_name_en),
  displayName: mapLocalizedText(aggregate.provider.display_name_ar, aggregate.provider.display_name_en),
  address: {
    countryCode: aggregate.provider.country_code,
    city: aggregate.provider.city,
    district: aggregate.provider.district,
    line1: aggregate.provider.line_1,
    postalCode: aggregate.provider.postal_code,
    latitude: aggregate.provider.latitude,
    longitude: aggregate.provider.longitude,
  },
  timezone: aggregate.provider.timezone,
  contact: {
    name: aggregate.provider.contact_name,
    phone: aggregate.provider.contact_phone,
    email: aggregate.provider.contact_email,
  },
  serviceAreaCities: deserialize<string[]>(aggregate.provider.service_area_cities_json, []),
  capabilities: aggregate.capabilities.map((capability) => ({
    serviceId: capability.service_id,
    serviceName: mapLocalizedText(capability.service_name_ar, capability.service_name_en),
    active: capability.active,
    unitPriceSar: capability.unit_price_sar,
    maxDailyKg: capability.max_daily_kg,
    maxSingleOrderKg: capability.max_single_order_kg,
    rushSupported: capability.rush_supported,
    supportedCityCodes: deserialize<string[]>(capability.supported_city_codes_json, []),
    defaultTurnaroundHours: capability.default_turnaround_hours,
    minimumPickupLeadHours: capability.minimum_pickup_lead_hours,
    pickupWindow: {
      startHour: capability.pickup_window_start_hour,
      endHour: capability.pickup_window_end_hour,
    },
  })),
  currentCapacity: fromProviderCapacityRecord(aggregate.capacity),
  performance: fromProviderPerformanceStatsRecord(aggregate.performance),
  active: aggregate.provider.active,
  notesAr: aggregate.provider.notes_ar,
  onboarding: {
    status: (aggregate.provider.onboarding_status as OnboardingStatus | undefined) ?? OnboardingStatus.Approved,
    submittedAt: aggregate.provider.submitted_at ?? aggregate.provider.created_at,
    reviewedAt: aggregate.provider.reviewed_at,
    reviewedByRole: aggregate.provider.reviewed_by_role as ProviderProfile["onboarding"]["reviewedByRole"],
    reviewedById: aggregate.provider.reviewed_by_id,
    reviewNotesAr: aggregate.provider.review_notes_ar,
  },
  createdAt: aggregate.provider.created_at,
  updatedAt: aggregate.provider.updated_at,
});

export const fromOrderItemRecord = (record: OrderItemRecord): OrderItem => ({
  id: record.id,
  serviceId: record.service_id,
  serviceName: mapLocalizedText(record.service_name_ar, record.service_name_en),
  quantity: record.quantity,
  unit: record.unit as ServiceBillingUnit,
  unitPriceSar: record.unit_price_sar,
  estimatedLineTotalSar: record.estimated_line_total_sar,
  notesAr: record.notes_ar,
});

export const fromAssignmentRecord = (record: AssignmentRecord): Assignment => ({
  id: record.id,
  orderId: record.order_id,
  hotelId: record.hotel_id,
  providerId: record.provider_id,
  attemptNumber: record.attempt_number,
  status: record.status as AssignmentStatus,
  assignedAt: record.assigned_at,
  responseDueAt: record.response_due_at,
  respondedAt: record.responded_at,
  acceptedAt: record.accepted_at,
  scoreBreakdown: deserialize(record.score_breakdown_json, {
    totalScore: 0,
    entries: [],
  }),
  eligibilityResult: deserialize(record.eligibility_result_json, {
    providerId: record.provider_id,
    orderId: record.order_id,
    eligible: false,
    reasonCodes: [],
    blockingReasonsAr: [],
    capabilityMatch: {
      providerId: record.provider_id,
      requestedServiceIds: [],
      matchedServiceIds: [],
      unsupportedServiceIds: [],
      sameCity: false,
      serviceAreaCovered: false,
      supportsRequestedQuantities: false,
      supportsRequestedPickupTime: false,
      capacityAvailable: false,
      isMatch: false,
      reasonsAr: [],
    },
    availableCapacityKg: 0,
    evaluatedAt: record.assigned_at,
  }),
});

export const fromAssignmentHistoryRecord = (
  record: AssignmentHistoryRecord,
): AssignmentHistory => ({
  id: record.id,
  assignmentId: record.assignment_id,
  orderId: record.order_id,
  providerId: record.provider_id,
  attemptNumber: record.attempt_number,
  fromStatus: record.from_status as AssignmentStatus | undefined,
  toStatus: record.to_status as AssignmentStatus,
  changedAt: record.changed_at,
  actorRole: record.actor_role as AssignmentHistory["actorRole"],
  reasonAr: record.reason_ar,
});

export const fromMatchingLogRecord = (record: MatchingLogRecord): MatchingLog => ({
  id: record.id,
  matchingRunId: record.matching_run_id,
  orderId: record.order_id,
  providerId: record.provider_id,
  decision: record.decision as MatchingLog["decision"],
  eligibilityResult: deserialize(record.eligibility_result_json, {
    providerId: record.provider_id,
    orderId: record.order_id,
    eligible: false,
    reasonCodes: [],
    blockingReasonsAr: [],
    capabilityMatch: {
      providerId: record.provider_id,
      requestedServiceIds: [],
      matchedServiceIds: [],
      unsupportedServiceIds: [],
      sameCity: false,
      serviceAreaCovered: false,
      supportsRequestedQuantities: false,
      supportsRequestedPickupTime: false,
      capacityAvailable: false,
      isMatch: false,
      reasonsAr: [],
    },
    availableCapacityKg: 0,
    evaluatedAt: record.evaluated_at,
  }),
  scoreBreakdown: deserialize(record.score_breakdown_json, {
    totalScore: 0,
    entries: [],
  }),
  evaluatedAt: record.evaluated_at,
  notesAr: record.notes_ar,
});

export const fromReassignmentEventRecord = (
  record: ReassignmentEventRecord,
): ReassignmentEvent => ({
  id: record.id,
  orderId: record.order_id,
  previousAssignmentId: record.previous_assignment_id,
  previousProviderId: record.previous_provider_id,
  nextProviderId: record.next_provider_id,
  reason: record.reason as ReassignmentEvent["reason"],
  actorRole: record.actor_role as ReassignmentEvent["actorRole"],
  createdAt: record.created_at,
  notesAr: record.notes_ar,
});

export const fromSLAHistoryRecord = (record: SLAHistoryRecord): SLAHistory => ({
  id: record.id,
  orderId: record.order_id,
  checkpoint: record.checkpoint as SLACheckpoint,
  targetAt: record.target_at,
  actualAt: record.actual_at,
  status: record.status as SLAStatus,
  recordedAt: record.recorded_at,
  notesAr: record.notes_ar,
});

export const fromSettlementRecord = (
  record: SettlementRecord,
  lineItems: SettlementLineItemRecord[],
): Settlement => ({
  id: record.id,
  orderId: record.order_id,
  hotelId: record.hotel_id,
  providerId: record.provider_id,
  currency: record.currency as Settlement["currency"],
  status: record.status as SettlementStatus,
  lineItems: lineItems.map<SettlementLineItem>((item) => ({
    id: item.id,
    orderItemId: item.order_item_id,
    description: mapLocalizedText(item.description_ar, item.description_en),
    quantity: item.quantity,
    unitPriceSar: item.unit_price_sar,
    totalSar: item.total_sar,
  })),
  subtotalSar: record.subtotal_sar,
  platformFeeSar: record.platform_fee_sar,
  adjustmentsSar: record.adjustments_sar,
  totalSar: record.total_sar,
  generatedAt: record.generated_at,
  dueAt: record.due_at,
  paidAt: record.paid_at,
});

export const fromNotificationRecord = (record: NotificationRecord): Notification => ({
  id: record.id,
  recipientRole: record.recipient_role as Notification["recipientRole"],
  recipientEntityId: record.recipient_entity_id,
  channel: record.channel as NotificationChannel,
  status: record.status as NotificationStatus,
  title: mapLocalizedText(record.title_ar, record.title_en),
  body: mapLocalizedText(record.body_ar, record.body_en),
  orderId: record.order_id,
  assignmentId: record.assignment_id,
  createdAt: record.created_at,
  sentAt: record.sent_at,
  readAt: record.read_at,
});

export const fromOrderAggregateRecordSet = (aggregate: OrderAggregateRecordSet): LaundryOrder => {
  const activeAssignment = aggregate.order.active_assignment_id
    ? aggregate.assignments.find((assignment) => assignment.id === aggregate.order.active_assignment_id)
    : aggregate.assignments[0];
  const settlementRecord = aggregate.settlements[0];
  const settlementLineItems = settlementRecord
    ? aggregate.settlement_line_items.filter((item) => item.settlement_id === settlementRecord.id)
    : [];

  return {
    id: aggregate.order.id,
    hotelId: aggregate.order.hotel_id,
    hotelSnapshot: deserialize<OrderPartySnapshot>(aggregate.order.hotel_snapshot_json, {
      id: aggregate.order.hotel_id,
      displayName: mapLocalizedText(""),
      city: "",
    }),
    providerId: aggregate.order.provider_id,
    providerSnapshot: aggregate.order.provider_snapshot_json
      ? deserialize<OrderPartySnapshot>(aggregate.order.provider_snapshot_json, {
          id: aggregate.order.provider_id ?? "",
          displayName: mapLocalizedText(""),
          city: "",
        })
      : undefined,
    assignmentMode: aggregate.order.assignment_mode as OrderAssignmentMode,
    status: aggregate.order.status as OrderStatus,
    priority: aggregate.order.priority as OrderPriority,
    items: aggregate.items.map((item) => fromOrderItemRecord(item)),
    totalItemCount: aggregate.order.total_item_count,
    currency: aggregate.order.currency as LaundryOrder["currency"],
    estimatedSubtotalSar: aggregate.order.estimated_subtotal_sar,
    pickupAt: aggregate.order.pickup_at,
    notesAr: aggregate.order.notes_ar,
    statusUpdatedAt: aggregate.order.status_updated_at,
    progressPercent: aggregate.order.progress_percent,
    activeAssignmentId: aggregate.order.active_assignment_id,
    activeAssignment: activeAssignment ? fromAssignmentRecord(activeAssignment) : undefined,
    assignmentHistory: aggregate.assignment_history.map((history) => fromAssignmentHistoryRecord(history)),
    statusHistory: deserialize<OrderStatusHistoryEntry[]>(aggregate.order.status_history_json, []),
    matchingLogs: aggregate.matching_logs.map((log) => fromMatchingLogRecord(log)),
    slaWindow: deserialize<OrderSlaWindow>(aggregate.order.sla_window_json, {}),
    slaHistory: aggregate.sla_history.map((history) => fromSLAHistoryRecord(history)),
    reassignmentEvents: aggregate.reassignment_events.map((event) => fromReassignmentEventRecord(event)),
    settlement: settlementRecord ? fromSettlementRecord(settlementRecord, settlementLineItems) : undefined,
    createdAt: aggregate.order.created_at,
    updatedAt: aggregate.order.updated_at,
  };
};

export const restorePlatformDomainSnapshot = (snapshot: PlatformPersistenceSnapshot) => ({
  accounts: snapshot.accounts.map((account) => fromAccountRecord(account)),
  accountSessions: snapshot.account_sessions.map((session) => fromAccountSessionRecord(session)),
  identityAuditEvents: snapshot.identity_audit_events.map((event) => fromIdentityAuditEventRecord(event)),
  platformSettings: snapshot.platform_settings.map((entry) => fromPlatformSettingsRecord(entry)),
  platformSettingsAudit: snapshot.platform_settings_audit.map((entry) =>
    fromPlatformSettingsAuditRecord(entry),
  ),
  platformContentEntries: snapshot.platform_content_entries.map((entry) =>
    fromPlatformContentEntryRecord(entry),
  ),
  platformContentAudit: snapshot.platform_content_audit.map((entry) =>
    fromPlatformContentAuditRecord(entry),
  ),
  hotels: snapshot.hotels.map((hotel) => fromHotelRecord(hotel)),
  services: snapshot.services.map((service) => fromServiceRecord(service)),
  providers: snapshot.providers.map((provider) => fromProviderAggregateRecordSet(provider)),
  orders: snapshot.orders.map((order) => fromOrderAggregateRecordSet(order)),
  notifications: snapshot.notifications.map((notification) => fromNotificationRecord(notification)),
});
