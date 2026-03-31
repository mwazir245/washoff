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
  HotelInvoiceStatus,
  NotificationChannel,
  NotificationStatus,
  OnboardingStatus,
  OrderAssignmentMode,
  OrderPriority,
  OrderStatus,
  PlatformServiceCurrentStatus,
  ProviderStatementStatus,
  ProviderCapacityStatus,
  ProviderServiceProposalStatus,
  ServiceBillingUnit,
  ServiceCategory,
  ServicePricingUnit,
  SettlementStatus,
  SLACheckpoint,
  SLAStatus,
  hotelInvoiceStatusLabelsAr,
  providerStatementStatusLabelsAr,
  getServiceTypeLabelAr,
  getServiceTypeLabelEn,
  providerServiceCurrentStatusLabelsAr,
  providerServiceProposalStatusLabelsAr,
} from "@/features/orders/model";
import type {
  PlatformSettings,
  PlatformSettingsAuditEntry,
} from "@/features/platform-settings/model/platform-settings";
import type {
  Assignment,
  HotelInvoice,
  AssignmentHistory,
  HotelProfile,
  LaundryOrder,
  MatchingLog,
  Notification,
  PlatformProduct,
  ProviderSettlementStatement,
  ProviderCapacity,
  ProviderPerformanceStats,
  ProviderProfile,
  ReassignmentEvent,
  ServiceCatalogItem,
  Settlement,
  SLAHistory,
} from "@/features/orders/model";
import type {
  FinancialDocumentPartySnapshot,
  HotelInvoiceOrderLine,
  OrderFinancialSnapshot,
  ProviderStatementOrderLine,
} from "@/features/orders/model/finance";
import {
  buildHotelDocumentDownloadPath,
  buildProviderDocumentDownloadPath,
} from "@/features/orders/model";
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
  HotelInvoiceOrderLineRecord,
  HotelInvoiceRecord,
  MatchingLogRecord,
  NotificationRecord,
  OrderAggregateRecordSet,
  OrderItemRecord,
  OrderRecord,
  PlatformProductRecord,
  PlatformPersistenceSnapshot,
  ProviderStatementOrderLineRecord,
  ProviderStatementRecord,
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
const mapFinancialPartySnapshot = (snapshot: FinancialDocumentPartySnapshot) => serialize(snapshot);

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
  seller_legal_name_ar: settings.sellerLegalNameAr,
  seller_vat_number: settings.sellerVatNumber,
  seller_address_ar: settings.sellerAddressAr,
  seller_city_ar: settings.sellerCityAr,
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

export const toPlatformProductRecord = (product: PlatformProduct): PlatformProductRecord => ({
  id: product.id,
  code: product.code,
  name_ar: product.name.ar,
  name_en: product.name.en,
  active: product.active,
  sort_order: product.sortOrder,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
});

export const toServiceRecord = (service: ServiceCatalogItem): ServiceRecord => {
  const matrixService = service as ServiceCatalogItem & {
    sortOrder?: number;
    createdAt?: string;
    updatedAt?: string;
  };

  return {
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
    product_id: service.productId,
    service_type: service.serviceType,
    pricing_unit: service.pricingUnit,
    suggested_price_sar: service.suggestedPriceSar,
    is_available: service.isAvailable,
    sort_order: matrixService.sortOrder,
    created_at: matrixService.createdAt,
    updated_at: matrixService.updatedAt,
  };
};

export const toProviderRecord = (provider: ProviderProfile): ProviderRecord => ({
  id: provider.id,
  code: provider.code,
  legal_name_ar: provider.legalName.ar,
  legal_name_en: provider.legalName.en,
  display_name_ar: provider.displayName.ar,
  display_name_en: provider.displayName.en,
  legal_entity_name: provider.businessProfile.legalEntityName,
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
  business_phone: provider.businessProfile.phone,
  business_email: provider.businessProfile.email,
  address_text: provider.locationProfile.addressText,
  tax_registration_number: provider.businessProfile.taxRegistrationNumber,
  commercial_registration_number: provider.businessProfile.commercialRegistrationNumber,
  commercial_registration_file_json: serialize(provider.businessProfile.commercialRegistrationFile),
  other_services_text: provider.operatingProfile.otherServicesText,
  pickup_lead_time_hours: provider.operatingProfile.pickupLeadTimeHours,
  execution_time_hours: provider.operatingProfile.executionTimeHours,
  delivery_time_hours: provider.operatingProfile.deliveryTimeHours,
  working_days_json: serialize(provider.operatingProfile.workingDays),
  working_hours_from: provider.operatingProfile.workingHoursFrom,
  working_hours_to: provider.operatingProfile.workingHoursTo,
  bank_name: provider.financialProfile.bankName,
  iban: provider.financialProfile.iban,
  bank_account_holder_name: provider.financialProfile.accountHolderName,
  account_setup_name: provider.accountSetupProfile.fullName,
  account_setup_phone: provider.accountSetupProfile.phone,
  account_setup_email: provider.accountSetupProfile.email,
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
  provider.capabilities.map((capability) => {
    const offering = provider.serviceOfferings.find((entry) => entry.serviceId === capability.serviceId);

    return {
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
      current_approved_price_sar: offering?.currentApprovedPriceSar,
      current_status: offering?.currentStatus ?? (capability.active ? PlatformServiceCurrentStatus.Active : PlatformServiceCurrentStatus.Inactive),
      proposed_price_sar: offering?.proposedPriceSar,
      proposed_status: offering?.proposedStatus,
      proposed_submitted_at: offering?.proposedSubmittedAt,
      approved_at: offering?.approvedAt,
      approved_by_account_id: offering?.approvedByAccountId,
      approved_by_role: offering?.approvedByRole,
      rejection_reason_ar: offering?.rejectionReasonAr,
      active_matrix: offering?.activeMatrix ?? true,
      available_matrix: offering?.availableMatrix ?? true,
      created_at: offering?.createdAt ?? provider.createdAt,
      updated_at: offering?.updatedAt ?? provider.updatedAt,
    };
  });

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
  room_number: order.roomNumber,
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
  hotel_financial_snapshot_json: order.hotelFinancialSnapshot
    ? serialize(order.hotelFinancialSnapshot)
    : undefined,
  provider_financial_snapshot_json: order.providerFinancialSnapshot
    ? serialize(order.providerFinancialSnapshot)
    : undefined,
  hotel_invoice_id: order.hotelInvoiceId,
  provider_statement_id: order.providerStatementId,
  billed_at: order.billedAt,
  settled_at: order.settledAt,
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
  platformProducts = [],
  hotelContractPrices = [],
  providers,
  services,
  orders,
  hotelInvoices = [],
  providerStatements = [],
  storedObjects = [],
  financeAuditEvents = [],
  backgroundJobs = [],
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
  platformProducts?: PlatformProduct[];
  hotelContractPrices?: Array<{
    hotelId: string;
    serviceId: string;
    unitPriceSar: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  providers: ProviderProfile[];
  services: ServiceCatalogItem[];
  orders: LaundryOrder[];
  hotelInvoices?: HotelInvoice[];
  providerStatements?: ProviderSettlementStatement[];
  storedObjects?: Array<{
    id: string;
    storageProvider: string;
    storageKey: string;
    logicalBucket: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    contentBase64: string;
    metadataJson?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  financeAuditEvents?: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    previousStatus?: string;
    nextStatus: string;
    actorAccountId?: string;
    actorRole?: string;
    notesAr?: string;
    metadataJson?: string;
    occurredAt: string;
  }>;
  backgroundJobs?: Array<{
    id: string;
    queueName: string;
    jobType: string;
    lockKey: string;
    status: string;
    payloadJson: string;
    attempts: number;
    maxAttempts: number;
    nextRunAt: string;
    lockedAt?: string;
    lockOwner?: string;
    completedAt?: string;
    lastErrorAr?: string;
    idempotencyKey?: string;
    createdAt: string;
    updatedAt: string;
  }>;
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
  platform_products: platformProducts.map((product) => toPlatformProductRecord(product)),
  services: services.map((service) => toServiceRecord(service)),
  hotel_contract_prices: hotelContractPrices.map((entry) => ({
    hotel_id: entry.hotelId,
    service_id: entry.serviceId,
    unit_price_sar: entry.unitPriceSar,
    active: entry.active,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  })),
  providers: providers.map((provider) => toProviderAggregateRecordSet(provider)),
  orders: orders.map((order) => toOrderAggregateRecordSet(order)),
  hotel_invoices: hotelInvoices.map((invoice) => toHotelInvoiceRecord(invoice)),
  hotel_invoice_order_lines: hotelInvoices.flatMap((invoice) =>
    invoice.lines.map((line) => toHotelInvoiceOrderLineRecord(line)),
  ),
  provider_statements: providerStatements.map((statement) => toProviderStatementRecord(statement)),
  provider_statement_order_lines: providerStatements.flatMap((statement) =>
    statement.lines.map((line) => toProviderStatementOrderLineRecord(line)),
  ),
  stored_objects: storedObjects.map((entry) => ({
    id: entry.id,
    storage_provider: entry.storageProvider,
    storage_key: entry.storageKey,
    logical_bucket: entry.logicalBucket,
    file_name: entry.fileName,
    mime_type: entry.mimeType,
    size_bytes: entry.sizeBytes,
    checksum_sha256: entry.checksumSha256,
    content_base64: entry.contentBase64,
    metadata_json: entry.metadataJson,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  })),
  finance_audit_events: financeAuditEvents.map((entry) => ({
    id: entry.id,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    previous_status: entry.previousStatus,
    next_status: entry.nextStatus,
    actor_account_id: entry.actorAccountId,
    actor_role: entry.actorRole,
    notes_ar: entry.notesAr,
    metadata_json: entry.metadataJson,
    occurred_at: entry.occurredAt,
  })),
  background_jobs: backgroundJobs.map((entry) => ({
    id: entry.id,
    queue_name: entry.queueName,
    job_type: entry.jobType,
    lock_key: entry.lockKey,
    status: entry.status,
    payload_json: entry.payloadJson,
    attempts: entry.attempts,
    max_attempts: entry.maxAttempts,
    next_run_at: entry.nextRunAt,
    locked_at: entry.lockedAt,
    lock_owner: entry.lockOwner,
    completed_at: entry.completedAt,
    last_error_ar: entry.lastErrorAr,
    idempotency_key: entry.idempotencyKey,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  })),
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
  sellerLegalNameAr: record.seller_legal_name_ar,
  sellerVatNumber: record.seller_vat_number,
  sellerAddressAr: record.seller_address_ar,
  sellerCityAr: record.seller_city_ar,
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

export const fromPlatformProductRecord = (
  record: PlatformProductRecord,
): PlatformProduct => ({
  id: record.id,
  code: record.code,
  name: mapLocalizedText(record.name_ar, record.name_en),
  active: record.active,
  sortOrder: record.sort_order,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const fromServiceRecord = (record: ServiceRecord): ServiceCatalogItem => {
  const service = {
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
    productId: record.product_id,
    serviceType: record.service_type as ServiceCatalogItem["serviceType"] | undefined,
    pricingUnit: record.pricing_unit as ServicePricingUnit | undefined,
    suggestedPriceSar: record.suggested_price_sar,
    isAvailable: record.is_available,
    sortOrder: record.sort_order,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  } satisfies ServiceCatalogItem & {
    sortOrder?: number;
    createdAt?: string;
    updatedAt?: string;
  };

  return service;
};

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
  serviceRecordsById: ReadonlyMap<string, ServiceRecord> = new Map(),
  productRecordsById: ReadonlyMap<string, PlatformProductRecord> = new Map(),
): ProviderProfile => {
  const serviceOfferings = aggregate.capabilities
    .map((capability) => {
      const serviceRecord = serviceRecordsById.get(capability.service_id);
      const productRecord = serviceRecord?.product_id
        ? productRecordsById.get(serviceRecord.product_id)
        : undefined;
      const serviceType = serviceRecord?.service_type as ProviderProfile["serviceOfferings"][number]["serviceType"] | undefined;
      const pricingUnit = serviceRecord?.pricing_unit as ServicePricingUnit | undefined;
      const currentStatus =
        (capability.current_status as PlatformServiceCurrentStatus | undefined) ??
        (capability.active ? PlatformServiceCurrentStatus.Active : PlatformServiceCurrentStatus.Inactive);
      const proposedStatus = capability.proposed_status as ProviderServiceProposalStatus | undefined;

      if (!serviceRecord || !productRecord || !serviceType || !pricingUnit) {
        return undefined;
      }

      return {
        id: `offering-${aggregate.provider.id}-${capability.service_id}`,
        providerId: aggregate.provider.id,
        serviceId: capability.service_id,
        productId: productRecord.id,
        productName: mapLocalizedText(productRecord.name_ar, productRecord.name_en),
        serviceType,
        serviceTypeName: {
          ar: getServiceTypeLabelAr(serviceType),
          en: getServiceTypeLabelEn(serviceType),
        },
        pricingUnit,
        currentApprovedPriceSar:
          capability.current_approved_price_sar ?? (capability.active ? capability.unit_price_sar : undefined),
        currentStatus,
        currentStatusLabelAr: providerServiceCurrentStatusLabelsAr[currentStatus],
        proposedPriceSar: capability.proposed_price_sar,
        proposedStatus,
        proposedStatusLabelAr: proposedStatus
          ? providerServiceProposalStatusLabelsAr[proposedStatus]
          : undefined,
        proposedSubmittedAt: capability.proposed_submitted_at,
        approvedAt: capability.approved_at,
        approvedByAccountId: capability.approved_by_account_id,
        approvedByRole: capability.approved_by_role,
        rejectionReasonAr: capability.rejection_reason_ar,
        suggestedPriceSar: serviceRecord.suggested_price_sar,
        activeMatrix: capability.active_matrix ?? serviceRecord.active,
        availableMatrix: capability.available_matrix ?? serviceRecord.is_available ?? true,
        createdAt: capability.created_at ?? aggregate.provider.created_at,
        updatedAt: capability.updated_at ?? aggregate.provider.updated_at,
      };
    })
    .filter((offering): offering is ProviderProfile["serviceOfferings"][number] => Boolean(offering));

  return {
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
  businessProfile: {
    legalEntityName: aggregate.provider.legal_entity_name,
    commercialRegistrationNumber: aggregate.provider.commercial_registration_number ?? "",
    taxRegistrationNumber: aggregate.provider.tax_registration_number ?? "",
    phone: aggregate.provider.business_phone ?? aggregate.provider.contact_phone ?? "",
    email: aggregate.provider.business_email ?? aggregate.provider.contact_email ?? "",
    commercialRegistrationFile: deserialize(
      aggregate.provider.commercial_registration_file_json,
      {
        kind: "commercial_registration",
        fileName: "commercial-registration.pdf",
        mimeType: "application/pdf",
        sizeBytes: 0,
        uploadedAt: aggregate.provider.submitted_at ?? aggregate.provider.created_at,
        storageKey: `legacy://providers/${aggregate.provider.id}/commercial-registration`,
        downloadPath: buildProviderDocumentDownloadPath(aggregate.provider.id),
      },
    ),
  },
  locationProfile: {
    addressText: aggregate.provider.address_text ?? aggregate.provider.line_1 ?? "",
  },
  operatingProfile: {
    otherServicesText: aggregate.provider.other_services_text,
    pickupLeadTimeHours: aggregate.provider.pickup_lead_time_hours ?? 2,
    executionTimeHours: aggregate.provider.execution_time_hours ?? 24,
    deliveryTimeHours: aggregate.provider.delivery_time_hours ?? 4,
    workingDays: deserialize(aggregate.provider.working_days_json, [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
    ]),
    workingHoursFrom: aggregate.provider.working_hours_from ?? "08:00",
    workingHoursTo: aggregate.provider.working_hours_to ?? "22:00",
  },
  financialProfile: {
    bankName: aggregate.provider.bank_name ?? "غير محدد",
    iban: aggregate.provider.iban ?? "",
    accountHolderName:
      aggregate.provider.bank_account_holder_name ?? aggregate.provider.legal_entity_name ?? aggregate.provider.legal_name_ar,
  },
  accountSetupProfile: {
    fullName: aggregate.provider.account_setup_name ?? aggregate.provider.contact_name ?? "",
    phone: aggregate.provider.account_setup_phone ?? aggregate.provider.contact_phone ?? "",
    email: aggregate.provider.account_setup_email ?? aggregate.provider.contact_email ?? "",
  },
  serviceOfferings,
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
  };
};

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

export const toHotelInvoiceRecord = (invoice: HotelInvoice): HotelInvoiceRecord => ({
  id: invoice.id,
  invoice_number: invoice.invoiceNumber,
  hotel_id: invoice.hotelId,
  invoice_date: invoice.invoiceDate,
  currency_code: invoice.currencyCode,
  status: invoice.status,
  order_count: invoice.orderCount,
  subtotal_ex_vat_sar: invoice.subtotalExVatSar,
  vat_amount_sar: invoice.vatAmountSar,
  total_inc_vat_sar: invoice.totalIncVatSar,
  seller_json: mapFinancialPartySnapshot(invoice.seller),
  buyer_json: mapFinancialPartySnapshot(invoice.buyer),
  pdf_object_id: invoice.pdf?.objectId,
  created_at: invoice.createdAt,
  updated_at: invoice.updatedAt,
  issued_at: invoice.issuedAt,
  collected_at: invoice.collectedAt,
  collected_by_account_id: invoice.collectedByAccountId,
  collected_by_role: invoice.collectedByRole,
});

export const toHotelInvoiceOrderLineRecord = (
  line: HotelInvoiceOrderLine,
): HotelInvoiceOrderLineRecord => ({
  id: line.id,
  invoice_id: line.invoiceId,
  order_id: line.orderId,
  room_number: line.roomNumber,
  order_subtotal_ex_vat_sar: line.orderSubtotalExVatSar,
  order_vat_amount_sar: line.orderVatAmountSar,
  order_total_inc_vat_sar: line.orderTotalIncVatSar,
});

export const fromHotelInvoiceRecord = (
  record: HotelInvoiceRecord,
  lines: HotelInvoiceOrderLineRecord[],
): HotelInvoice => ({
  id: record.id,
  invoiceNumber: record.invoice_number,
  hotelId: record.hotel_id,
  invoiceDate: record.invoice_date,
  currencyCode: record.currency_code as HotelInvoice["currencyCode"],
  status: record.status as HotelInvoiceStatus,
  statusLabelAr: hotelInvoiceStatusLabelsAr[record.status as HotelInvoiceStatus],
  orderCount: record.order_count,
  subtotalExVatSar: record.subtotal_ex_vat_sar,
  vatAmountSar: record.vat_amount_sar,
  totalIncVatSar: record.total_inc_vat_sar,
  seller: deserialize<FinancialDocumentPartySnapshot>(record.seller_json, {
    id: "",
    displayNameAr: "",
  }),
  buyer: deserialize<FinancialDocumentPartySnapshot>(record.buyer_json, {
    id: record.hotel_id,
    displayNameAr: "",
  }),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  issuedAt: record.issued_at,
  collectedAt: record.collected_at,
  collectedByAccountId: record.collected_by_account_id,
  collectedByRole: record.collected_by_role as HotelInvoice["collectedByRole"],
  pdf: record.pdf_object_id
    ? {
        objectId: record.pdf_object_id,
        downloadPath: "",
        generatedAt: record.updated_at,
        qrPayloadAr: "",
      }
    : undefined,
  lines: lines.map((line) => ({
    id: line.id,
    invoiceId: line.invoice_id,
    orderId: line.order_id,
    roomNumber: line.room_number,
    orderSubtotalExVatSar: line.order_subtotal_ex_vat_sar,
    orderVatAmountSar: line.order_vat_amount_sar,
    orderTotalIncVatSar: line.order_total_inc_vat_sar,
  })),
});

export const toProviderStatementRecord = (
  statement: ProviderSettlementStatement,
): ProviderStatementRecord => ({
  id: statement.id,
  statement_number: statement.statementNumber,
  provider_id: statement.providerId,
  statement_date: statement.statementDate,
  currency_code: statement.currencyCode,
  status: statement.status,
  order_count: statement.orderCount,
  subtotal_ex_vat_sar: statement.subtotalExVatSar,
  vat_amount_sar: statement.vatAmountSar,
  total_inc_vat_sar: statement.totalIncVatSar,
  provider_json: mapFinancialPartySnapshot(statement.provider),
  pdf_object_id: statement.pdf?.objectId,
  created_at: statement.createdAt,
  updated_at: statement.updatedAt,
  paid_at: statement.paidAt,
  paid_by_account_id: statement.paidByAccountId,
  paid_by_role: statement.paidByRole,
});

export const toProviderStatementOrderLineRecord = (
  line: ProviderStatementOrderLine,
): ProviderStatementOrderLineRecord => ({
  id: line.id,
  statement_id: line.statementId,
  order_id: line.orderId,
  room_number: line.roomNumber,
  provider_subtotal_ex_vat_sar: line.providerSubtotalExVatSar,
  provider_vat_amount_sar: line.providerVatAmountSar,
  provider_total_inc_vat_sar: line.providerTotalIncVatSar,
});

export const fromProviderStatementRecord = (
  record: ProviderStatementRecord,
  lines: ProviderStatementOrderLineRecord[],
): ProviderSettlementStatement => ({
  id: record.id,
  statementNumber: record.statement_number,
  providerId: record.provider_id,
  statementDate: record.statement_date,
  currencyCode: record.currency_code as ProviderSettlementStatement["currencyCode"],
  status: record.status as ProviderStatementStatus,
  statusLabelAr: providerStatementStatusLabelsAr[record.status as ProviderStatementStatus],
  orderCount: record.order_count,
  subtotalExVatSar: record.subtotal_ex_vat_sar,
  vatAmountSar: record.vat_amount_sar,
  totalIncVatSar: record.total_inc_vat_sar,
  provider: deserialize<FinancialDocumentPartySnapshot>(record.provider_json, {
    id: record.provider_id,
    displayNameAr: "",
  }),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  paidAt: record.paid_at,
  paidByAccountId: record.paid_by_account_id,
  paidByRole: record.paid_by_role as ProviderSettlementStatement["paidByRole"],
  pdf: record.pdf_object_id
    ? {
        objectId: record.pdf_object_id,
        downloadPath: "",
        generatedAt: record.updated_at,
        qrPayloadAr: "",
      }
    : undefined,
  lines: lines.map((line) => ({
    id: line.id,
    statementId: line.statement_id,
    orderId: line.order_id,
    roomNumber: line.room_number,
    providerSubtotalExVatSar: line.provider_subtotal_ex_vat_sar,
    providerVatAmountSar: line.provider_vat_amount_sar,
    providerTotalIncVatSar: line.provider_total_inc_vat_sar,
  })),
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
    roomNumber: aggregate.order.room_number,
    totalItemCount: aggregate.order.total_item_count,
    currency: aggregate.order.currency as LaundryOrder["currency"],
    estimatedSubtotalSar: aggregate.order.estimated_subtotal_sar,
    pickupAt: aggregate.order.pickup_at,
    notesAr: aggregate.order.notes_ar,
    hotelFinancialSnapshot: deserialize<OrderFinancialSnapshot | undefined>(
      aggregate.order.hotel_financial_snapshot_json,
      undefined,
    ),
    providerFinancialSnapshot: deserialize<OrderFinancialSnapshot | undefined>(
      aggregate.order.provider_financial_snapshot_json,
      undefined,
    ),
    hotelInvoiceId: aggregate.order.hotel_invoice_id,
    providerStatementId: aggregate.order.provider_statement_id,
    billedAt: aggregate.order.billed_at,
    settledAt: aggregate.order.settled_at,
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

export const restorePlatformDomainSnapshot = (snapshot: PlatformPersistenceSnapshot) => {
  const platformProducts = snapshot.platform_products.map((product) => fromPlatformProductRecord(product));
  const services = snapshot.services.map((service) => fromServiceRecord(service));
  const serviceRecordsById = new Map(snapshot.services.map((service) => [service.id, service]));
  const productRecordsById = new Map(snapshot.platform_products.map((product) => [product.id, product]));
  const hotelInvoiceLinesByInvoiceId = new Map<string, HotelInvoiceOrderLineRecord[]>();
  const providerStatementLinesByStatementId = new Map<string, ProviderStatementOrderLineRecord[]>();
  const hotelInvoices = snapshot.hotel_invoices ?? [];
  const hotelInvoiceLines = snapshot.hotel_invoice_order_lines ?? [];
  const providerStatements = snapshot.provider_statements ?? [];
  const providerStatementLines = snapshot.provider_statement_order_lines ?? [];

  hotelInvoiceLines.forEach((line) => {
    const collection = hotelInvoiceLinesByInvoiceId.get(line.invoice_id) ?? [];
    collection.push(line);
    hotelInvoiceLinesByInvoiceId.set(line.invoice_id, collection);
  });

  providerStatementLines.forEach((line) => {
    const collection = providerStatementLinesByStatementId.get(line.statement_id) ?? [];
    collection.push(line);
    providerStatementLinesByStatementId.set(line.statement_id, collection);
  });

  return {
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
    platformProducts,
    services,
    hotelContractPrices: snapshot.hotel_contract_prices.map((entry) => ({
      hotelId: entry.hotel_id,
      serviceId: entry.service_id,
      unitPriceSar: entry.unit_price_sar,
      active: entry.active,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    })),
    providers: snapshot.providers.map((provider) =>
      fromProviderAggregateRecordSet(provider, serviceRecordsById, productRecordsById),
    ),
    orders: snapshot.orders.map((order) => fromOrderAggregateRecordSet(order)),
    hotelInvoices: hotelInvoices.map((invoice) =>
      fromHotelInvoiceRecord(invoice, hotelInvoiceLinesByInvoiceId.get(invoice.id) ?? []),
    ),
    providerStatements: providerStatements.map((statement) =>
      fromProviderStatementRecord(statement, providerStatementLinesByStatementId.get(statement.id) ?? []),
    ),
    storedObjects: snapshot.stored_objects.map((entry) => ({
      id: entry.id,
      storageProvider: entry.storage_provider,
      storageKey: entry.storage_key,
      logicalBucket: entry.logical_bucket,
      fileName: entry.file_name,
      mimeType: entry.mime_type,
      sizeBytes: entry.size_bytes,
      checksumSha256: entry.checksum_sha256,
      contentBase64: entry.content_base64,
      metadataJson: entry.metadata_json,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    })),
    financeAuditEvents: snapshot.finance_audit_events.map((entry) => ({
      id: entry.id,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      action: entry.action,
      previousStatus: entry.previous_status,
      nextStatus: entry.next_status,
      actorAccountId: entry.actor_account_id,
      actorRole: entry.actor_role,
      notesAr: entry.notes_ar,
      metadataJson: entry.metadata_json,
      occurredAt: entry.occurred_at,
    })),
    backgroundJobs: snapshot.background_jobs.map((entry) => ({
      id: entry.id,
      queueName: entry.queue_name,
      jobType: entry.job_type,
      lockKey: entry.lock_key,
      status: entry.status,
      payloadJson: entry.payload_json,
      attempts: entry.attempts,
      maxAttempts: entry.max_attempts,
      nextRunAt: entry.next_run_at,
      lockedAt: entry.locked_at,
      lockOwner: entry.lock_owner,
      completedAt: entry.completed_at,
      lastErrorAr: entry.last_error_ar,
      idempotencyKey: entry.idempotency_key,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    })),
    notifications: snapshot.notifications.map((notification) => fromNotificationRecord(notification)),
  };
};
