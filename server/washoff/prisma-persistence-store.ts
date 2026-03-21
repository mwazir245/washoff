import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import {
  exportMockOrdersRepositoryPersistenceSnapshot,
  resetMockOrdersRepository,
} from "../../src/features/orders/data/mock-orders.repository";
import type {
  PlatformPersistenceSnapshot,
  ProviderAggregateRecordSet,
  OrderAggregateRecordSet,
} from "../../src/features/orders/infrastructure/persistence/persistence-records";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface PrismaPlatformPersistenceStore {
  ensureSeeded(): Promise<void>;
  loadSnapshot(tx: Prisma.TransactionClient): Promise<PlatformPersistenceSnapshot>;
  replaceSnapshot(tx: Prisma.TransactionClient, snapshot: PlatformPersistenceSnapshot): Promise<void>;
  withTransaction<Value>(operation: (tx: Prisma.TransactionClient) => Promise<Value>): Promise<Value>;
}

const createDecimal = (value: number | undefined | null) => {
  if (value === undefined || value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
};

const toNumber = (
  value: Prisma.Decimal | number | null | undefined,
): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return value instanceof Prisma.Decimal ? value.toNumber() : value;
};

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const parseJsonString = (value: string) => JSON.parse(value) as Prisma.InputJsonValue;
const stringifyJsonValue = (value: Prisma.JsonValue | null | undefined) => JSON.stringify(value ?? {});

const createManyIfAny = async <Input>(
  createMany: (input: { data: Input[] }) => Promise<unknown>,
  data: Input[],
) => {
  if (data.length === 0) {
    return;
  }

  await createMany({
    data,
  });
};

const flattenProviderRecords = (providers: ProviderAggregateRecordSet[]) => ({
  providerRows: providers.map((aggregate) => ({
    id: aggregate.provider.id,
    code: aggregate.provider.code,
    displayNameAr: aggregate.provider.display_name_ar,
    displayNameEn: aggregate.provider.display_name_en,
    legalNameAr: aggregate.provider.legal_name_ar,
    legalNameEn: aggregate.provider.legal_name_en,
    countryCode: aggregate.provider.country_code,
    city: aggregate.provider.city,
    district: aggregate.provider.district,
    line1: aggregate.provider.line_1,
    postalCode: aggregate.provider.postal_code,
    latitude: aggregate.provider.latitude,
    longitude: aggregate.provider.longitude,
    timezone: aggregate.provider.timezone,
    contactName: aggregate.provider.contact_name,
    contactPhone: aggregate.provider.contact_phone,
    contactEmail: aggregate.provider.contact_email,
    serviceAreaCitiesJson: parseJsonString(aggregate.provider.service_area_cities_json),
    active: aggregate.provider.active,
    notesAr: aggregate.provider.notes_ar,
    onboardingStatus: aggregate.provider.onboarding_status,
    submittedAt: new Date(aggregate.provider.submitted_at),
    reviewedAt: aggregate.provider.reviewed_at ? new Date(aggregate.provider.reviewed_at) : null,
    reviewedByRole: aggregate.provider.reviewed_by_role,
    reviewedById: aggregate.provider.reviewed_by_id,
    reviewNotesAr: aggregate.provider.review_notes_ar,
    createdAt: new Date(aggregate.provider.created_at),
    updatedAt: new Date(aggregate.provider.updated_at),
  })),
  capabilityRows: providers.flatMap((aggregate) =>
    aggregate.capabilities.map((capability) => ({
      providerId: capability.provider_id,
      serviceId: capability.service_id,
      serviceNameAr: capability.service_name_ar,
      serviceNameEn: capability.service_name_en,
      active: capability.active,
      unitPriceSar: createDecimal(capability.unit_price_sar),
      maxDailyKg: createDecimal(capability.max_daily_kg),
      maxSingleOrderKg: createDecimal(capability.max_single_order_kg),
      rushSupported: capability.rush_supported,
      supportedCityCodesJson: parseJsonString(capability.supported_city_codes_json),
      defaultTurnaroundHours: capability.default_turnaround_hours,
      minimumPickupLeadHours: capability.minimum_pickup_lead_hours,
      pickupWindowStartHour: capability.pickup_window_start_hour,
      pickupWindowEndHour: capability.pickup_window_end_hour,
    })),
  ),
  capacityRows: providers.map((aggregate) => ({
    providerId: aggregate.capacity.provider_id,
    capacityDate: aggregate.capacity.capacity_date,
    totalKg: createDecimal(aggregate.capacity.total_kg),
    committedKg: createDecimal(aggregate.capacity.committed_kg),
    reservedKg: createDecimal(aggregate.capacity.reserved_kg),
    availableKg: createDecimal(aggregate.capacity.available_kg),
    utilizationRatio: createDecimal(aggregate.capacity.utilization_ratio),
    status: aggregate.capacity.status,
    cutoffAt: aggregate.capacity.cutoff_at ? new Date(aggregate.capacity.cutoff_at) : null,
    createdAt: new Date(aggregate.capacity.created_at),
    updatedAt: new Date(aggregate.capacity.updated_at),
  })),
  performanceRows: providers.map((aggregate) => ({
    providerId: aggregate.performance.provider_id,
    rating: createDecimal(aggregate.performance.rating),
    acceptanceRate: createDecimal(aggregate.performance.acceptance_rate),
    onTimePickupRate: createDecimal(aggregate.performance.on_time_pickup_rate),
    onTimeDeliveryRate: createDecimal(aggregate.performance.on_time_delivery_rate),
    qualityScore: createDecimal(aggregate.performance.quality_score),
    disputeRate: createDecimal(aggregate.performance.dispute_rate),
    reassignmentRate: createDecimal(aggregate.performance.reassignment_rate),
    completedOrders: aggregate.performance.completed_orders,
    cancelledOrders: aggregate.performance.cancelled_orders,
    lastEvaluatedAt: new Date(aggregate.performance.last_evaluated_at),
  })),
});

const flattenOrderRecords = (orders: OrderAggregateRecordSet[]) => ({
  orderRows: orders.map((aggregate) => ({
    id: aggregate.order.id,
    hotelId: aggregate.order.hotel_id,
    providerId: aggregate.order.provider_id,
    hotelSnapshotJson: parseJsonString(aggregate.order.hotel_snapshot_json),
    providerSnapshotJson: aggregate.order.provider_snapshot_json
      ? parseJsonString(aggregate.order.provider_snapshot_json)
      : null,
    statusHistoryJson: aggregate.order.status_history_json
      ? parseJsonString(aggregate.order.status_history_json)
      : null,
    assignmentMode: aggregate.order.assignment_mode,
    status: aggregate.order.status,
    priority: aggregate.order.priority,
    currency: aggregate.order.currency,
    estimatedSubtotalSar: createDecimal(aggregate.order.estimated_subtotal_sar),
    totalItemCount: createDecimal(aggregate.order.total_item_count),
    pickupAt: new Date(aggregate.order.pickup_at),
    notesAr: aggregate.order.notes_ar,
    statusUpdatedAt: new Date(aggregate.order.status_updated_at),
    progressPercent: createDecimal(aggregate.order.progress_percent),
    activeAssignmentId: aggregate.order.active_assignment_id,
    slaWindowJson: parseJsonString(aggregate.order.sla_window_json),
    createdAt: new Date(aggregate.order.created_at),
    updatedAt: new Date(aggregate.order.updated_at),
  })),
  orderItemRows: orders.flatMap((aggregate) =>
    aggregate.items.map((item) => ({
      id: item.id,
      orderId: item.order_id,
      serviceId: item.service_id,
      serviceNameAr: item.service_name_ar,
      serviceNameEn: item.service_name_en,
      quantity: createDecimal(item.quantity),
      unit: item.unit,
      unitPriceSar: createDecimal(item.unit_price_sar),
      estimatedLineTotalSar: createDecimal(item.estimated_line_total_sar),
      notesAr: item.notes_ar,
    })),
  ),
  assignmentRows: orders.flatMap((aggregate) =>
    aggregate.assignments.map((assignment) => ({
      id: assignment.id,
      orderId: assignment.order_id,
      hotelId: assignment.hotel_id,
      providerId: assignment.provider_id,
      attemptNumber: assignment.attempt_number,
      status: assignment.status,
      assignedAt: new Date(assignment.assigned_at),
      responseDueAt: assignment.response_due_at ? new Date(assignment.response_due_at) : null,
      respondedAt: assignment.responded_at ? new Date(assignment.responded_at) : null,
      acceptedAt: assignment.accepted_at ? new Date(assignment.accepted_at) : null,
      scoreBreakdownJson: parseJsonString(assignment.score_breakdown_json),
      eligibilityResultJson: parseJsonString(assignment.eligibility_result_json),
    })),
  ),
  assignmentHistoryRows: orders.flatMap((aggregate) =>
    aggregate.assignment_history.map((history) => ({
      id: history.id,
      assignmentId: history.assignment_id,
      orderId: history.order_id,
      providerId: history.provider_id,
      attemptNumber: history.attempt_number,
      fromStatus: history.from_status,
      toStatus: history.to_status,
      changedAt: new Date(history.changed_at),
      actorRole: history.actor_role,
      reasonAr: history.reason_ar,
    })),
  ),
  matchingLogRows: orders.flatMap((aggregate) =>
    aggregate.matching_logs.map((log) => ({
      id: log.id,
      matchingRunId: log.matching_run_id,
      orderId: log.order_id,
      providerId: log.provider_id,
      decision: log.decision,
      eligibilityResultJson: parseJsonString(log.eligibility_result_json),
      scoreBreakdownJson: parseJsonString(log.score_breakdown_json),
      evaluatedAt: new Date(log.evaluated_at),
      notesAr: log.notes_ar,
    })),
  ),
  reassignmentEventRows: orders.flatMap((aggregate) =>
    aggregate.reassignment_events.map((event) => ({
      id: event.id,
      orderId: event.order_id,
      previousAssignmentId: event.previous_assignment_id,
      previousProviderId: event.previous_provider_id,
      nextProviderId: event.next_provider_id,
      reason: event.reason,
      actorRole: event.actor_role,
      createdAt: new Date(event.created_at),
      notesAr: event.notes_ar,
    })),
  ),
  slaHistoryRows: orders.flatMap((aggregate) =>
    aggregate.sla_history.map((history) => ({
      id: history.id,
      orderId: history.order_id,
      checkpoint: history.checkpoint,
      targetAt: new Date(history.target_at),
      actualAt: history.actual_at ? new Date(history.actual_at) : null,
      status: history.status,
      recordedAt: new Date(history.recorded_at),
      notesAr: history.notes_ar,
    })),
  ),
  settlementRows: orders.flatMap((aggregate) =>
    aggregate.settlements.map((settlement) => ({
      id: settlement.id,
      orderId: settlement.order_id,
      hotelId: settlement.hotel_id,
      providerId: settlement.provider_id,
      currency: settlement.currency,
      status: settlement.status,
      subtotalSar: createDecimal(settlement.subtotal_sar),
      platformFeeSar: createDecimal(settlement.platform_fee_sar),
      adjustmentsSar: createDecimal(settlement.adjustments_sar),
      totalSar: createDecimal(settlement.total_sar),
      generatedAt: new Date(settlement.generated_at),
      dueAt: settlement.due_at ? new Date(settlement.due_at) : null,
      paidAt: settlement.paid_at ? new Date(settlement.paid_at) : null,
    })),
  ),
  settlementLineItemRows: orders.flatMap((aggregate) =>
    aggregate.settlement_line_items.map((lineItem) => ({
      id: lineItem.id,
      settlementId: lineItem.settlement_id,
      orderItemId: lineItem.order_item_id,
      descriptionAr: lineItem.description_ar,
      descriptionEn: lineItem.description_en,
      quantity: createDecimal(lineItem.quantity),
      unitPriceSar: createDecimal(lineItem.unit_price_sar),
      totalSar: createDecimal(lineItem.total_sar),
    })),
  ),
});

export const createPrismaPlatformPersistenceStore = (
  prisma: PrismaClient,
): PrismaPlatformPersistenceStore => {
  const loadSnapshot = async (executor: PrismaExecutor): Promise<PlatformPersistenceSnapshot> => {
    const [
      accounts,
      accountSessions,
      identityAuditEvents,
      platformSettings,
      platformSettingsAudit,
      platformContentEntries,
      platformContentAudit,
      hotels,
      services,
      providers,
      providerCapabilities,
      providerCapacities,
      providerPerformanceStats,
      orders,
      orderItems,
      assignments,
      assignmentHistory,
      matchingLogs,
      reassignmentEvents,
      slaHistory,
      settlements,
      settlementLineItems,
      notifications,
    ] = await Promise.all([
      executor.account.findMany({ orderBy: { createdAt: "asc" } }),
      executor.accountSession.findMany({ orderBy: { createdAt: "asc" } }),
      executor.identityAuditEvent.findMany({ orderBy: { createdAt: "asc" } }),
      executor.platformSettings.findMany({ orderBy: { updatedAt: "desc" } }),
      executor.platformSettingsAudit.findMany({ orderBy: { changedAt: "desc" } }),
      executor.platformContentEntry.findMany({ orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }] }),
      executor.platformContentAudit.findMany({ orderBy: { changedAt: "desc" } }),
      executor.hotel.findMany({ orderBy: { code: "asc" } }),
      executor.service.findMany({ orderBy: { code: "asc" } }),
      executor.provider.findMany({ orderBy: { code: "asc" } }),
      executor.providerCapability.findMany({ orderBy: [{ providerId: "asc" }, { serviceId: "asc" }] }),
      executor.providerCapacity.findMany({ orderBy: [{ providerId: "asc" }, { capacityDate: "asc" }] }),
      executor.providerPerformanceStats.findMany({ orderBy: { providerId: "asc" } }),
      executor.order.findMany({ orderBy: { createdAt: "desc" } }),
      executor.orderItem.findMany({ orderBy: { id: "asc" } }),
      executor.assignment.findMany({ orderBy: [{ orderId: "asc" }, { attemptNumber: "asc" }] }),
      executor.assignmentHistory.findMany({ orderBy: { changedAt: "asc" } }),
      executor.matchingLog.findMany({ orderBy: { evaluatedAt: "asc" } }),
      executor.reassignmentEvent.findMany({ orderBy: { createdAt: "asc" } }),
      executor.sLAHistory.findMany({ orderBy: { recordedAt: "asc" } }),
      executor.settlement.findMany({ orderBy: { generatedAt: "asc" } }),
      executor.settlementLineItem.findMany({ orderBy: { id: "asc" } }),
      executor.notification.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    const capabilitiesByProviderId = new Map<string, typeof providerCapabilities>();
    const capacitiesByProviderId = new Map<string, typeof providerCapacities[number]>();
    const performanceByProviderId = new Map<string, typeof providerPerformanceStats[number]>();
    const orderItemsByOrderId = new Map<string, typeof orderItems>();
    const assignmentsByOrderId = new Map<string, typeof assignments>();
    const assignmentHistoryByOrderId = new Map<string, typeof assignmentHistory>();
    const matchingLogsByOrderId = new Map<string, typeof matchingLogs>();
    const reassignmentEventsByOrderId = new Map<string, typeof reassignmentEvents>();
    const slaHistoryByOrderId = new Map<string, typeof slaHistory>();
    const settlementsByOrderId = new Map<string, typeof settlements>();
    const settlementLineItemsBySettlementId = new Map<string, typeof settlementLineItems>();

    providerCapabilities.forEach((capability) => {
      const list = capabilitiesByProviderId.get(capability.providerId) ?? [];
      list.push(capability);
      capabilitiesByProviderId.set(capability.providerId, list);
    });
    providerCapacities.forEach((capacity) => {
      capacitiesByProviderId.set(capacity.providerId, capacity);
    });
    providerPerformanceStats.forEach((stats) => {
      performanceByProviderId.set(stats.providerId, stats);
    });
    orderItems.forEach((item) => {
      const list = orderItemsByOrderId.get(item.orderId) ?? [];
      list.push(item);
      orderItemsByOrderId.set(item.orderId, list);
    });
    assignments.forEach((assignment) => {
      const list = assignmentsByOrderId.get(assignment.orderId) ?? [];
      list.push(assignment);
      assignmentsByOrderId.set(assignment.orderId, list);
    });
    assignmentHistory.forEach((history) => {
      const list = assignmentHistoryByOrderId.get(history.orderId) ?? [];
      list.push(history);
      assignmentHistoryByOrderId.set(history.orderId, list);
    });
    matchingLogs.forEach((log) => {
      const list = matchingLogsByOrderId.get(log.orderId) ?? [];
      list.push(log);
      matchingLogsByOrderId.set(log.orderId, list);
    });
    reassignmentEvents.forEach((event) => {
      const list = reassignmentEventsByOrderId.get(event.orderId) ?? [];
      list.push(event);
      reassignmentEventsByOrderId.set(event.orderId, list);
    });
    slaHistory.forEach((history) => {
      const list = slaHistoryByOrderId.get(history.orderId) ?? [];
      list.push(history);
      slaHistoryByOrderId.set(history.orderId, list);
    });
    settlements.forEach((settlement) => {
      const list = settlementsByOrderId.get(settlement.orderId) ?? [];
      list.push(settlement);
      settlementsByOrderId.set(settlement.orderId, list);
    });
    settlementLineItems.forEach((lineItem) => {
      const list = settlementLineItemsBySettlementId.get(lineItem.settlementId) ?? [];
      list.push(lineItem);
      settlementLineItemsBySettlementId.set(lineItem.settlementId, list);
    });

    return {
      accounts: accounts.map((account) => ({
        id: account.id,
        full_name: account.fullName,
        email: account.email,
        phone: account.phone ?? undefined,
        password_salt: account.passwordSalt ?? undefined,
        password_hash: account.passwordHash ?? undefined,
        role: account.role,
        status: account.status,
        linked_entity_type: account.linkedEntityType ?? undefined,
        linked_hotel_id: account.linkedHotelId ?? undefined,
        linked_provider_id: account.linkedProviderId ?? undefined,
        activation_state: account.activationState,
        activation_token_hash: account.activationTokenHash ?? undefined,
        activation_token_issued_at: toIsoString(account.activationTokenIssuedAt),
        activation_token_expires_at: toIsoString(account.activationTokenExpiresAt),
        activation_token_used_at: toIsoString(account.activationTokenUsedAt),
        activation_eligible_at: toIsoString(account.activationEligibleAt),
        activated_at: toIsoString(account.activatedAt),
        password_reset_state: account.passwordResetState,
        password_reset_token_hash: account.passwordResetTokenHash ?? undefined,
        password_reset_requested_at: toIsoString(account.passwordResetRequestedAt),
        password_reset_issued_at: toIsoString(account.passwordResetIssuedAt),
        password_reset_token_expires_at: toIsoString(account.passwordResetTokenExpiresAt),
        password_reset_token_used_at: toIsoString(account.passwordResetTokenUsedAt),
        password_reset_completed_at: toIsoString(account.passwordResetCompletedAt),
        suspended_at: toIsoString(account.suspendedAt),
        suspended_by_account_id: account.suspendedByAccountId ?? undefined,
        suspended_by_role: account.suspendedByRole ?? undefined,
        suspension_reason_ar: account.suspensionReasonAr ?? undefined,
        reactivated_at: toIsoString(account.reactivatedAt),
        reactivated_by_account_id: account.reactivatedByAccountId ?? undefined,
        reactivated_by_role: account.reactivatedByRole ?? undefined,
        reactivation_reason_ar: account.reactivationReasonAr ?? undefined,
        last_login_at: toIsoString(account.lastLoginAt),
        created_at: account.createdAt.toISOString(),
        updated_at: account.updatedAt.toISOString(),
      })),
      account_sessions: accountSessions.map((session) => ({
        id: session.id,
        account_id: session.accountId,
        token_hash: session.tokenHash,
        role: session.role,
        linked_entity_type: session.linkedEntityType ?? undefined,
        linked_entity_id: session.linkedEntityId ?? undefined,
        created_at: session.createdAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        last_seen_at: toIsoString(session.lastSeenAt),
        revoked_at: toIsoString(session.revokedAt),
        revoked_reason_ar: session.revokedReasonAr ?? undefined,
        revoked_by_account_id: session.revokedByAccountId ?? undefined,
        revoked_by_role: session.revokedByRole ?? undefined,
      })),
      identity_audit_events: identityAuditEvents.map((event) => ({
        id: event.id,
        account_id: event.accountId ?? undefined,
        session_id: event.sessionId ?? undefined,
        event_type: event.eventType,
        actor_account_id: event.actorAccountId ?? undefined,
        actor_role: event.actorRole ?? undefined,
        linked_entity_type: event.linkedEntityType ?? undefined,
        linked_entity_id: event.linkedEntityId ?? undefined,
        details_ar: event.detailsAr ?? undefined,
        metadata_json: stringifyJsonValue(event.metadataJson),
        created_at: event.createdAt.toISOString(),
      })),
      platform_settings: platformSettings.map((entry) => ({
        id: entry.id,
        site_name_ar: entry.siteNameAr,
        site_name_en: entry.siteNameEn,
        site_tagline_ar: entry.siteTaglineAr,
        site_tagline_en: entry.siteTaglineEn,
        mail_from_name_ar: entry.mailFromNameAr,
        mail_from_email: entry.mailFromEmail,
        support_email: entry.supportEmail ?? undefined,
        support_phone: entry.supportPhone ?? undefined,
        registration_enabled: entry.registrationEnabled,
        hotel_registration_enabled: entry.hotelRegistrationEnabled,
        provider_registration_enabled: entry.providerRegistrationEnabled,
        require_admin_approval_for_hotels: entry.requireAdminApprovalForHotels,
        require_admin_approval_for_providers: entry.requireAdminApprovalForProviders,
        updated_at: entry.updatedAt.toISOString(),
        updated_by_account_id: entry.updatedByAccountId ?? undefined,
      })),
      platform_settings_audit: platformSettingsAudit.map((entry) => ({
        id: entry.id,
        settings_key: entry.settingsKey,
        old_value_json: entry.oldValueJson ? JSON.stringify(entry.oldValueJson) : undefined,
        new_value_json: JSON.stringify(entry.newValueJson),
        changed_by_account_id: entry.changedByAccountId ?? undefined,
        changed_by_role: entry.changedByRole ?? undefined,
        changed_at: entry.changedAt.toISOString(),
        notes_ar: entry.notesAr ?? undefined,
      })),
      platform_content_entries: platformContentEntries.map((entry) => ({
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
        description_ar: entry.descriptionAr ?? undefined,
        description_en: entry.descriptionEn ?? undefined,
        active: entry.active,
        sort_order: entry.sortOrder,
        updated_at: entry.updatedAt.toISOString(),
        updated_by_account_id: entry.updatedByAccountId ?? undefined,
      })),
      platform_content_audit: platformContentAudit.map((entry) => ({
        id: entry.id,
        content_entry_id: entry.contentEntryId,
        page_key: entry.pageKey,
        section_key: entry.sectionKey,
        content_key: entry.contentKey,
        old_value_ar: entry.oldValueAr ?? undefined,
        old_value_en: entry.oldValueEn ?? undefined,
        new_value_ar: entry.newValueAr,
        new_value_en: entry.newValueEn,
        changed_by_account_id: entry.changedByAccountId ?? undefined,
        changed_by_role: entry.changedByRole ?? undefined,
        changed_at: entry.changedAt.toISOString(),
        notes_ar: entry.notesAr ?? undefined,
      })),
      hotels: hotels.map((hotel) => ({
        id: hotel.id,
        code: hotel.code,
        display_name_ar: hotel.displayNameAr,
        display_name_en: hotel.displayNameEn ?? undefined,
        legal_entity_name: hotel.legalEntityName ?? undefined,
        hotel_classification: hotel.hotelClassification,
        room_count: hotel.roomCount,
        country_code: hotel.countryCode,
        city: hotel.city,
        district: hotel.district ?? undefined,
        line_1: hotel.line1 ?? undefined,
        postal_code: hotel.postalCode ?? undefined,
        latitude: hotel.latitude ?? undefined,
        longitude: hotel.longitude ?? undefined,
        timezone: hotel.timezone,
        contact_name: hotel.contactName ?? undefined,
        contact_phone: hotel.contactPhone ?? undefined,
        contact_email: hotel.contactEmail ?? undefined,
        service_level: hotel.serviceLevel,
        operating_hours: hotel.operatingHours,
        requires_daily_pickup: hotel.requiresDailyPickup,
        address_text: hotel.addressText,
        pickup_location: hotel.pickupLocation ?? undefined,
        has_loading_area: hotel.hasLoadingArea,
        access_notes: hotel.accessNotes ?? undefined,
        tax_registration_number: hotel.taxRegistrationNumber,
        commercial_registration_number: hotel.commercialRegistrationNumber,
        commercial_registration_file_json: stringifyJsonValue(hotel.commercialRegistrationFileJson),
        delegation_letter_file_json: hotel.delegationLetterFileJson
          ? stringifyJsonValue(hotel.delegationLetterFileJson)
          : undefined,
        delegation_status: hotel.delegationStatus,
        contracted_service_ids_json: stringifyJsonValue(hotel.contractedServiceIdsJson),
        active: hotel.active,
        notes_ar: hotel.notesAr ?? undefined,
        onboarding_status: hotel.onboardingStatus,
        submitted_at: hotel.submittedAt.toISOString(),
        reviewed_at: toIsoString(hotel.reviewedAt),
        reviewed_by_role: hotel.reviewedByRole ?? undefined,
        reviewed_by_id: hotel.reviewedById ?? undefined,
        review_notes_ar: hotel.reviewNotesAr ?? undefined,
        created_at: hotel.createdAt.toISOString(),
        updated_at: hotel.updatedAt.toISOString(),
      })),
      services: services.map((service) => ({
        id: service.id,
        code: service.code,
        name_ar: service.nameAr,
        name_en: service.nameEn ?? undefined,
        description_ar: service.descriptionAr ?? undefined,
        description_en: service.descriptionEn ?? undefined,
        category: service.category,
        billing_unit: service.billingUnit,
        default_unit_price_sar: toNumber(service.defaultUnitPriceSar) ?? 0,
        default_turnaround_hours: service.defaultTurnaroundHours,
        supports_rush: service.supportsRush,
        active: service.active,
      })),
      providers: providers.map<ProviderAggregateRecordSet>((provider) => ({
        provider: {
          id: provider.id,
          code: provider.code,
          legal_name_ar: provider.legalNameAr,
          legal_name_en: provider.legalNameEn ?? undefined,
          display_name_ar: provider.displayNameAr,
          display_name_en: provider.displayNameEn ?? undefined,
          country_code: provider.countryCode,
          city: provider.city,
          district: provider.district ?? undefined,
          line_1: provider.line1 ?? undefined,
          postal_code: provider.postalCode ?? undefined,
          latitude: provider.latitude ?? undefined,
          longitude: provider.longitude ?? undefined,
          timezone: provider.timezone,
          contact_name: provider.contactName ?? undefined,
          contact_phone: provider.contactPhone ?? undefined,
          contact_email: provider.contactEmail ?? undefined,
          service_area_cities_json: stringifyJsonValue(provider.serviceAreaCitiesJson),
          active: provider.active,
          created_at: provider.createdAt.toISOString(),
          updated_at: provider.updatedAt.toISOString(),
        },
        capabilities: (capabilitiesByProviderId.get(provider.id) ?? []).map((capability) => ({
          provider_id: capability.providerId,
          service_id: capability.serviceId,
          service_name_ar: capability.serviceNameAr,
          service_name_en: capability.serviceNameEn ?? undefined,
          active: capability.active,
          unit_price_sar: toNumber(capability.unitPriceSar) ?? 0,
          max_daily_kg: toNumber(capability.maxDailyKg) ?? 0,
          max_single_order_kg: toNumber(capability.maxSingleOrderKg) ?? 0,
          rush_supported: capability.rushSupported,
          supported_city_codes_json: stringifyJsonValue(capability.supportedCityCodesJson),
          default_turnaround_hours: capability.defaultTurnaroundHours,
          minimum_pickup_lead_hours: capability.minimumPickupLeadHours,
          pickup_window_start_hour: capability.pickupWindowStartHour,
          pickup_window_end_hour: capability.pickupWindowEndHour,
        })),
        capacity: {
          provider_id: provider.id,
          capacity_date: capacitiesByProviderId.get(provider.id)?.capacityDate ?? new Date().toISOString().slice(0, 10),
          total_kg: toNumber(capacitiesByProviderId.get(provider.id)?.totalKg) ?? 0,
          committed_kg: toNumber(capacitiesByProviderId.get(provider.id)?.committedKg) ?? 0,
          reserved_kg: toNumber(capacitiesByProviderId.get(provider.id)?.reservedKg) ?? 0,
          available_kg: toNumber(capacitiesByProviderId.get(provider.id)?.availableKg) ?? 0,
          utilization_ratio: toNumber(capacitiesByProviderId.get(provider.id)?.utilizationRatio) ?? 0,
          status: capacitiesByProviderId.get(provider.id)?.status ?? "available",
          cutoff_at: toIsoString(capacitiesByProviderId.get(provider.id)?.cutoffAt),
          created_at:
            capacitiesByProviderId.get(provider.id)?.createdAt.toISOString() ?? provider.createdAt.toISOString(),
          updated_at:
            capacitiesByProviderId.get(provider.id)?.updatedAt.toISOString() ?? provider.updatedAt.toISOString(),
        },
        performance: {
          provider_id: provider.id,
          rating: toNumber(performanceByProviderId.get(provider.id)?.rating) ?? 0,
          acceptance_rate: toNumber(performanceByProviderId.get(provider.id)?.acceptanceRate) ?? 0,
          on_time_pickup_rate: toNumber(performanceByProviderId.get(provider.id)?.onTimePickupRate) ?? 0,
          on_time_delivery_rate: toNumber(performanceByProviderId.get(provider.id)?.onTimeDeliveryRate) ?? 0,
          quality_score: toNumber(performanceByProviderId.get(provider.id)?.qualityScore) ?? 0,
          dispute_rate: toNumber(performanceByProviderId.get(provider.id)?.disputeRate) ?? 0,
          reassignment_rate: toNumber(performanceByProviderId.get(provider.id)?.reassignmentRate) ?? 0,
          completed_orders: performanceByProviderId.get(provider.id)?.completedOrders ?? 0,
          cancelled_orders: performanceByProviderId.get(provider.id)?.cancelledOrders ?? 0,
          last_evaluated_at:
            performanceByProviderId.get(provider.id)?.lastEvaluatedAt.toISOString() ??
            provider.updatedAt.toISOString(),
        },
      })),
      orders: orders.map<OrderAggregateRecordSet>((order) => ({
        order: {
          id: order.id,
          hotel_id: order.hotelId,
          provider_id: order.providerId ?? undefined,
          hotel_snapshot_json: stringifyJsonValue(order.hotelSnapshotJson),
          provider_snapshot_json: order.providerSnapshotJson
            ? stringifyJsonValue(order.providerSnapshotJson)
            : undefined,
          status_history_json: order.statusHistoryJson
            ? stringifyJsonValue(order.statusHistoryJson)
            : undefined,
          assignment_mode: order.assignmentMode,
          status: order.status,
          priority: order.priority,
          currency: order.currency,
          estimated_subtotal_sar: toNumber(order.estimatedSubtotalSar) ?? 0,
          total_item_count: toNumber(order.totalItemCount) ?? 0,
          pickup_at: order.pickupAt.toISOString(),
          notes_ar: order.notesAr ?? undefined,
          status_updated_at: order.statusUpdatedAt.toISOString(),
          progress_percent: toNumber(order.progressPercent),
          active_assignment_id: order.activeAssignmentId ?? undefined,
          sla_window_json: stringifyJsonValue(order.slaWindowJson),
          created_at: order.createdAt.toISOString(),
          updated_at: order.updatedAt.toISOString(),
        },
        items: (orderItemsByOrderId.get(order.id) ?? []).map((item) => ({
          id: item.id,
          order_id: item.orderId,
          service_id: item.serviceId,
          service_name_ar: item.serviceNameAr,
          service_name_en: item.serviceNameEn ?? undefined,
          quantity: toNumber(item.quantity) ?? 0,
          unit: item.unit,
          unit_price_sar: toNumber(item.unitPriceSar) ?? 0,
          estimated_line_total_sar: toNumber(item.estimatedLineTotalSar) ?? 0,
          notes_ar: item.notesAr ?? undefined,
        })),
        assignments: (assignmentsByOrderId.get(order.id) ?? []).map((assignment) => ({
          id: assignment.id,
          order_id: assignment.orderId,
          hotel_id: assignment.hotelId,
          provider_id: assignment.providerId,
          attempt_number: assignment.attemptNumber,
          status: assignment.status,
          assigned_at: assignment.assignedAt.toISOString(),
          response_due_at: toIsoString(assignment.responseDueAt),
          responded_at: toIsoString(assignment.respondedAt),
          accepted_at: toIsoString(assignment.acceptedAt),
          score_breakdown_json: stringifyJsonValue(assignment.scoreBreakdownJson),
          eligibility_result_json: stringifyJsonValue(assignment.eligibilityResultJson),
        })),
        assignment_history: (assignmentHistoryByOrderId.get(order.id) ?? []).map((history) => ({
          id: history.id,
          assignment_id: history.assignmentId,
          order_id: history.orderId,
          provider_id: history.providerId,
          attempt_number: history.attemptNumber,
          from_status: history.fromStatus ?? undefined,
          to_status: history.toStatus,
          changed_at: history.changedAt.toISOString(),
          actor_role: history.actorRole,
          reason_ar: history.reasonAr ?? undefined,
        })),
        matching_logs: (matchingLogsByOrderId.get(order.id) ?? []).map((log) => ({
          id: log.id,
          matching_run_id: log.matchingRunId,
          order_id: log.orderId,
          provider_id: log.providerId,
          decision: log.decision,
          eligibility_result_json: stringifyJsonValue(log.eligibilityResultJson),
          score_breakdown_json: stringifyJsonValue(log.scoreBreakdownJson),
          evaluated_at: log.evaluatedAt.toISOString(),
          notes_ar: log.notesAr ?? undefined,
        })),
        reassignment_events: (reassignmentEventsByOrderId.get(order.id) ?? []).map((event) => ({
          id: event.id,
          order_id: event.orderId,
          previous_assignment_id: event.previousAssignmentId ?? undefined,
          previous_provider_id: event.previousProviderId ?? undefined,
          next_provider_id: event.nextProviderId ?? undefined,
          reason: event.reason,
          actor_role: event.actorRole,
          created_at: event.createdAt.toISOString(),
          notes_ar: event.notesAr ?? undefined,
        })),
        sla_history: (slaHistoryByOrderId.get(order.id) ?? []).map((history) => ({
          id: history.id,
          order_id: history.orderId,
          checkpoint: history.checkpoint,
          target_at: history.targetAt.toISOString(),
          actual_at: toIsoString(history.actualAt),
          status: history.status,
          recorded_at: history.recordedAt.toISOString(),
          notes_ar: history.notesAr ?? undefined,
        })),
        settlements: (settlementsByOrderId.get(order.id) ?? []).map((settlement) => ({
          id: settlement.id,
          order_id: settlement.orderId,
          hotel_id: settlement.hotelId,
          provider_id: settlement.providerId,
          currency: settlement.currency,
          status: settlement.status,
          subtotal_sar: toNumber(settlement.subtotalSar) ?? 0,
          platform_fee_sar: toNumber(settlement.platformFeeSar) ?? 0,
          adjustments_sar: toNumber(settlement.adjustmentsSar) ?? 0,
          total_sar: toNumber(settlement.totalSar) ?? 0,
          generated_at: settlement.generatedAt.toISOString(),
          due_at: toIsoString(settlement.dueAt),
          paid_at: toIsoString(settlement.paidAt),
        })),
        settlement_line_items: (settlementsByOrderId.get(order.id) ?? []).flatMap((settlement) =>
          (settlementLineItemsBySettlementId.get(settlement.id) ?? []).map((lineItem) => ({
            id: lineItem.id,
            settlement_id: lineItem.settlementId,
            order_item_id: lineItem.orderItemId ?? undefined,
            description_ar: lineItem.descriptionAr,
            description_en: lineItem.descriptionEn ?? undefined,
            quantity: toNumber(lineItem.quantity) ?? 0,
            unit_price_sar: toNumber(lineItem.unitPriceSar) ?? 0,
            total_sar: toNumber(lineItem.totalSar) ?? 0,
          })),
        ),
      })),
      notifications: notifications.map((notification) => ({
        id: notification.id,
        recipient_role: notification.recipientRole,
        recipient_entity_id: notification.recipientEntityId,
        channel: notification.channel,
        status: notification.status,
        title_ar: notification.titleAr,
        title_en: notification.titleEn ?? undefined,
        body_ar: notification.bodyAr,
        body_en: notification.bodyEn ?? undefined,
        order_id: notification.orderId ?? undefined,
        assignment_id: notification.assignmentId ?? undefined,
        created_at: notification.createdAt.toISOString(),
        sent_at: toIsoString(notification.sentAt),
        read_at: toIsoString(notification.readAt),
      })),
    };
  };

  const replaceSnapshot = async (
    executor: PrismaExecutor,
    snapshot: PlatformPersistenceSnapshot,
  ) => {
    const providerRows = flattenProviderRecords(snapshot.providers);
    const orderRows = flattenOrderRecords(snapshot.orders);

    await executor.assignmentHistory.deleteMany();
    await executor.matchingLog.deleteMany();
    await executor.reassignmentEvent.deleteMany();
    await executor.settlementLineItem.deleteMany();
    await executor.notification.deleteMany();
    await executor.assignment.deleteMany();
    await executor.sLAHistory.deleteMany();
    await executor.settlement.deleteMany();
    await executor.orderItem.deleteMany();
    await executor.order.deleteMany();
    await executor.providerCapability.deleteMany();
    await executor.providerCapacity.deleteMany();
    await executor.providerPerformanceStats.deleteMany();
    await executor.provider.deleteMany();
    await executor.service.deleteMany();
    await executor.hotel.deleteMany();
    await executor.platformContentAudit.deleteMany();
    await executor.platformContentEntry.deleteMany();
    await executor.platformSettingsAudit.deleteMany();
    await executor.platformSettings.deleteMany();
    await executor.accountSession.deleteMany();
    await executor.identityAuditEvent.deleteMany();
    await executor.account.deleteMany();

    await createManyIfAny(
      (input) => executor.account.createMany(input),
      snapshot.accounts.map((account) => ({
        id: account.id,
        fullName: account.full_name,
        email: account.email,
        phone: account.phone,
        passwordSalt: account.password_salt,
        passwordHash: account.password_hash,
        role: account.role,
        status: account.status,
        linkedEntityType: account.linked_entity_type,
        linkedHotelId: account.linked_hotel_id,
        linkedProviderId: account.linked_provider_id,
        activationState: account.activation_state,
        activationTokenHash: account.activation_token_hash,
        activationTokenIssuedAt: account.activation_token_issued_at
          ? new Date(account.activation_token_issued_at)
          : null,
        activationTokenExpiresAt: account.activation_token_expires_at
          ? new Date(account.activation_token_expires_at)
          : null,
        activationTokenUsedAt: account.activation_token_used_at
          ? new Date(account.activation_token_used_at)
          : null,
        activationEligibleAt: account.activation_eligible_at
          ? new Date(account.activation_eligible_at)
          : null,
        activatedAt: account.activated_at ? new Date(account.activated_at) : null,
        passwordResetState: account.password_reset_state,
        passwordResetTokenHash: account.password_reset_token_hash,
        passwordResetRequestedAt: account.password_reset_requested_at
          ? new Date(account.password_reset_requested_at)
          : null,
        passwordResetIssuedAt: account.password_reset_issued_at
          ? new Date(account.password_reset_issued_at)
          : null,
        passwordResetTokenExpiresAt: account.password_reset_token_expires_at
          ? new Date(account.password_reset_token_expires_at)
          : null,
        passwordResetTokenUsedAt: account.password_reset_token_used_at
          ? new Date(account.password_reset_token_used_at)
          : null,
        passwordResetCompletedAt: account.password_reset_completed_at
          ? new Date(account.password_reset_completed_at)
          : null,
        suspendedAt: account.suspended_at ? new Date(account.suspended_at) : null,
        suspendedByAccountId: account.suspended_by_account_id,
        suspendedByRole: account.suspended_by_role,
        suspensionReasonAr: account.suspension_reason_ar,
        reactivatedAt: account.reactivated_at ? new Date(account.reactivated_at) : null,
        reactivatedByAccountId: account.reactivated_by_account_id,
        reactivatedByRole: account.reactivated_by_role,
        reactivationReasonAr: account.reactivation_reason_ar,
        lastLoginAt: account.last_login_at ? new Date(account.last_login_at) : null,
        createdAt: new Date(account.created_at),
        updatedAt: new Date(account.updated_at),
      })),
    );
    await createManyIfAny(
      (input) => executor.accountSession.createMany(input),
      snapshot.account_sessions.map((session) => ({
        id: session.id,
        accountId: session.account_id,
        tokenHash: session.token_hash,
        role: session.role,
        linkedEntityType: session.linked_entity_type,
        linkedEntityId: session.linked_entity_id,
        createdAt: new Date(session.created_at),
        expiresAt: new Date(session.expires_at),
        lastSeenAt: session.last_seen_at ? new Date(session.last_seen_at) : null,
        revokedAt: session.revoked_at ? new Date(session.revoked_at) : null,
        revokedReasonAr: session.revoked_reason_ar,
        revokedByAccountId: session.revoked_by_account_id,
        revokedByRole: session.revoked_by_role,
      })),
    );
    await createManyIfAny(
      (input) => executor.identityAuditEvent.createMany(input),
      snapshot.identity_audit_events.map((event) => ({
        id: event.id,
        accountId: event.account_id,
        sessionId: event.session_id,
        eventType: event.event_type,
        actorAccountId: event.actor_account_id,
        actorRole: event.actor_role,
        linkedEntityType: event.linked_entity_type,
        linkedEntityId: event.linked_entity_id,
        detailsAr: event.details_ar,
        metadataJson: parseJsonString(event.metadata_json),
        createdAt: new Date(event.created_at),
      })),
    );
    await createManyIfAny(
      (input) => executor.platformSettings.createMany(input),
      snapshot.platform_settings.map((entry) => ({
        id: entry.id,
        siteNameAr: entry.site_name_ar,
        siteNameEn: entry.site_name_en,
        siteTaglineAr: entry.site_tagline_ar,
        siteTaglineEn: entry.site_tagline_en,
        mailFromNameAr: entry.mail_from_name_ar,
        mailFromEmail: entry.mail_from_email,
        supportEmail: entry.support_email,
        supportPhone: entry.support_phone,
        registrationEnabled: entry.registration_enabled,
        hotelRegistrationEnabled: entry.hotel_registration_enabled,
        providerRegistrationEnabled: entry.provider_registration_enabled,
        requireAdminApprovalForHotels: entry.require_admin_approval_for_hotels,
        requireAdminApprovalForProviders: entry.require_admin_approval_for_providers,
        updatedAt: new Date(entry.updated_at),
        updatedByAccountId: entry.updated_by_account_id,
      })),
    );
    await createManyIfAny(
      (input) => executor.platformSettingsAudit.createMany(input),
      snapshot.platform_settings_audit.map((entry) => ({
        id: entry.id,
        settingsKey: entry.settings_key,
        oldValueJson: entry.old_value_json ? parseJsonString(entry.old_value_json) : null,
        newValueJson: parseJsonString(entry.new_value_json),
        changedByAccountId: entry.changed_by_account_id,
        changedByRole: entry.changed_by_role,
        changedAt: new Date(entry.changed_at),
        notesAr: entry.notes_ar,
      })),
    );
    await createManyIfAny(
      (input) => executor.platformContentEntry.createMany(input),
      snapshot.platform_content_entries.map((entry) => ({
        id: entry.id,
        pageKey: entry.page_key,
        sectionKey: entry.section_key,
        contentKey: entry.content_key,
        compositeKey: entry.composite_key,
        contentType: entry.content_type,
        labelAr: entry.label_ar,
        labelEn: entry.label_en,
        valueAr: entry.value_ar,
        valueEn: entry.value_en,
        descriptionAr: entry.description_ar,
        descriptionEn: entry.description_en,
        active: entry.active,
        sortOrder: entry.sort_order,
        updatedAt: new Date(entry.updated_at),
        updatedByAccountId: entry.updated_by_account_id,
      })),
    );
    await createManyIfAny(
      (input) => executor.platformContentAudit.createMany(input),
      snapshot.platform_content_audit.map((entry) => ({
        id: entry.id,
        contentEntryId: entry.content_entry_id,
        pageKey: entry.page_key,
        sectionKey: entry.section_key,
        contentKey: entry.content_key,
        oldValueAr: entry.old_value_ar,
        oldValueEn: entry.old_value_en,
        newValueAr: entry.new_value_ar,
        newValueEn: entry.new_value_en,
        changedByAccountId: entry.changed_by_account_id,
        changedByRole: entry.changed_by_role,
        changedAt: new Date(entry.changed_at),
        notesAr: entry.notes_ar,
      })),
    );

    await createManyIfAny(
      (input) => executor.hotel.createMany(input),
      snapshot.hotels.map((hotel) => ({
        id: hotel.id,
        code: hotel.code,
        displayNameAr: hotel.display_name_ar,
        displayNameEn: hotel.display_name_en,
        legalEntityName: hotel.legal_entity_name,
        hotelClassification: hotel.hotel_classification,
        roomCount: hotel.room_count,
        countryCode: hotel.country_code,
        city: hotel.city,
        district: hotel.district,
        line1: hotel.line_1,
        postalCode: hotel.postal_code,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        timezone: hotel.timezone,
        contactName: hotel.contact_name,
        contactPhone: hotel.contact_phone,
        contactEmail: hotel.contact_email,
        serviceLevel: hotel.service_level,
        operatingHours: hotel.operating_hours,
        requiresDailyPickup: hotel.requires_daily_pickup,
        addressText: hotel.address_text,
        pickupLocation: hotel.pickup_location,
        hasLoadingArea: hotel.has_loading_area,
        accessNotes: hotel.access_notes,
        taxRegistrationNumber:
          hotel.tax_registration_number || hotel.commercial_registration_number,
        commercialRegistrationNumber: hotel.commercial_registration_number,
        commercialRegistrationFileJson: parseJsonString(hotel.commercial_registration_file_json),
        delegationLetterFileJson: hotel.delegation_letter_file_json
          ? parseJsonString(hotel.delegation_letter_file_json)
          : null,
        delegationStatus: hotel.delegation_status,
        contractedServiceIdsJson: parseJsonString(hotel.contracted_service_ids_json),
        active: hotel.active,
        notesAr: hotel.notes_ar,
        onboardingStatus: hotel.onboarding_status,
        submittedAt: new Date(hotel.submitted_at),
        reviewedAt: hotel.reviewed_at ? new Date(hotel.reviewed_at) : null,
        reviewedByRole: hotel.reviewed_by_role,
        reviewedById: hotel.reviewed_by_id,
        reviewNotesAr: hotel.review_notes_ar,
        createdAt: new Date(hotel.created_at),
        updatedAt: new Date(hotel.updated_at),
      })),
    );

    await createManyIfAny(
      (input) => executor.service.createMany(input),
      snapshot.services.map((service) => ({
        id: service.id,
        code: service.code,
        nameAr: service.name_ar,
        nameEn: service.name_en,
        descriptionAr: service.description_ar,
        descriptionEn: service.description_en,
        category: service.category,
        billingUnit: service.billing_unit,
        defaultUnitPriceSar: createDecimal(service.default_unit_price_sar),
        defaultTurnaroundHours: service.default_turnaround_hours,
        supportsRush: service.supports_rush,
        active: service.active,
      })),
    );

    await createManyIfAny((input) => executor.provider.createMany(input), providerRows.providerRows);
    await createManyIfAny((input) => executor.providerCapability.createMany(input), providerRows.capabilityRows);
    await createManyIfAny((input) => executor.providerCapacity.createMany(input), providerRows.capacityRows);
    await createManyIfAny(
      (input) => executor.providerPerformanceStats.createMany(input),
      providerRows.performanceRows,
    );
    await createManyIfAny((input) => executor.order.createMany(input), orderRows.orderRows);
    await createManyIfAny((input) => executor.orderItem.createMany(input), orderRows.orderItemRows);
    await createManyIfAny((input) => executor.assignment.createMany(input), orderRows.assignmentRows);
    await createManyIfAny(
      (input) => executor.assignmentHistory.createMany(input),
      orderRows.assignmentHistoryRows,
    );
    await createManyIfAny((input) => executor.matchingLog.createMany(input), orderRows.matchingLogRows);
    await createManyIfAny(
      (input) => executor.reassignmentEvent.createMany(input),
      orderRows.reassignmentEventRows,
    );
    await createManyIfAny((input) => executor.sLAHistory.createMany(input), orderRows.slaHistoryRows);
    await createManyIfAny((input) => executor.settlement.createMany(input), orderRows.settlementRows);
    await createManyIfAny(
      (input) => executor.settlementLineItem.createMany(input),
      orderRows.settlementLineItemRows,
    );
    await createManyIfAny(
      (input) => executor.notification.createMany(input),
      snapshot.notifications.map((notification) => ({
        id: notification.id,
        recipientRole: notification.recipient_role,
        recipientEntityId: notification.recipient_entity_id,
        channel: notification.channel,
        status: notification.status,
        titleAr: notification.title_ar,
        titleEn: notification.title_en,
        bodyAr: notification.body_ar,
        bodyEn: notification.body_en,
        orderId: notification.order_id,
        assignmentId: notification.assignment_id,
        createdAt: new Date(notification.created_at),
        sentAt: notification.sent_at ? new Date(notification.sent_at) : null,
        readAt: notification.read_at ? new Date(notification.read_at) : null,
      })),
    );
  };

  const ensureSeeded = async () => {
    const hotelCount = await prisma.hotel.count();

    if (hotelCount > 0) {
      return;
    }

    resetMockOrdersRepository();
    const initialSnapshot = await exportMockOrdersRepositoryPersistenceSnapshot();

    await prisma.$transaction(async (tx) => {
      await replaceSnapshot(tx, initialSnapshot);
    });
  };

  return {
    ensureSeeded,
    loadSnapshot: (tx) => loadSnapshot(tx),
    replaceSnapshot: (tx, snapshot) => replaceSnapshot(tx, snapshot),
    withTransaction: (operation) => prisma.$transaction((tx) => operation(tx)),
  };
};
