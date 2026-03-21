import { Prisma } from "@prisma/client";
import type {
  Account as PrismaAccountRecord,
  AccountSession as PrismaAccountSessionRecord,
  Assignment as PrismaAssignmentRecord,
  AssignmentHistory as PrismaAssignmentHistoryRecord,
  Hotel as PrismaHotelRecord,
  IdentityAuditEvent as PrismaIdentityAuditEventRecord,
  MatchingLog as PrismaMatchingLogRecord,
  Order as PrismaOrderRecord,
  OrderItem as PrismaOrderItemRecord,
  PrismaClient,
  Provider as PrismaProviderRecord,
  ProviderCapability as PrismaProviderCapabilityRecord,
  ProviderCapacity as PrismaProviderCapacityRecord,
  ProviderPerformanceStats as PrismaProviderPerformanceStatsRecord,
  ReassignmentEvent as PrismaReassignmentEventRecord,
  Service as PrismaServiceRecord,
  Settlement as PrismaSettlementRecord,
  SettlementLineItem as PrismaSettlementLineItemRecord,
  SLAHistory as PrismaSlaHistoryRecord,
} from "@prisma/client";
import {
  AccountActivationState,
  AccountRole,
  AccountStatus,
  AccountTokenValidationStatus,
  IdentityAuditEventType,
  LinkedEntityType,
  PasswordResetState,
  accountActivationStateLabelsAr,
  accountRoleLabelsAr,
  accountStatusLabelsAr,
  passwordResetStateLabelsAr,
  type AccountProfile,
  type AccountSessionProfile,
  type AccountTokenValidationResult,
  type AuthenticatedAccountSession,
  type IdentityAuditEvent,
} from "../../src/features/auth/model";
import {
  buildAllDefaultPlatformContentEntries,
  resolvePlatformPageContent,
  type PlatformContentAuditEntry,
  type PlatformContentEntry,
  type PlatformContentEntryUpdateCommand,
  type PlatformLanguage,
  type PlatformPageContent,
} from "../../src/features/content/model/platform-content";
import {
  createOpaqueToken,
  createPasswordDigest,
  hashOpaqueToken,
  verifyPasswordDigest,
} from "../../src/features/auth/lib/credentials";
import type { WashoffPlatformRepository } from "../../src/features/orders/application/ports/washoff-platform-repository";
import {
  AssignmentStatus,
  HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES,
  buildHotelDocumentDownloadPath,
  canTransitionOrderStatus,
  createEmptyScoreBreakdown,
  type CreateHotelOrderInput,
  type EligibilityResult,
  getOrderProgressPercent,
  hotelClassificationLabelsAr,
  HOTEL_REGISTRATION_SAUDI_CITIES_AR,
  hotelServiceLevelLabelsAr,
  type HotelProfile,
  type HotelRegistrationDocumentKind,
  type HotelRegistrationDocumentUploadInput,
  type HotelRegistrationInput,
  type HotelRegistrationStoredDocumentReference,
  type LaundryOrder,
  MatchingDecision,
  OnboardingStatus,
  OrderAssignmentMode,
  type OrderItem,
  type OrderPartySnapshot,
  OrderPriority,
  OrderStatus,
  type OrderStatusHistoryEntry,
  ProviderCapacityStatus,
  type ProviderProfile,
  type ProviderRegistrationInput,
  providerExecutableOrderStatuses,
  ReassignmentReason,
  type Assignment,
  type AssignmentHistory,
  type MatchingLog,
  type ScoreBreakdown,
  ServiceBillingUnit,
  ServiceCategory,
  type ServiceCatalogItem,
  SettlementStatus,
  type Settlement,
  type SettlementLineItem,
  SLACheckpoint,
  SLAStatus,
  type SLAHistory,
} from "../../src/features/orders/model";
import {
  createMatchingRunId,
  evaluateProviderEligibility,
  matchProvidersForOrder,
} from "../../src/features/orders/services";
import {
  defaultPlatformSettings,
  type PlatformRuntimeStatus,
  type PlatformSettings,
  type PlatformSettingsAuditEntry,
  type PlatformSettingsUpdateCommand,
} from "../../src/features/platform-settings/model/platform-settings";
import { getWashoffPrismaClient } from "./prisma-client";
import {
  createPrismaPlatformPersistenceStore,
  type PrismaPlatformPersistenceStore,
} from "./prisma-persistence-store";
import {
  assertHotelRegistrationDocumentsTotalSize,
  storeHotelRegistrationDocument,
} from "./hotel-registration-documents";
import type { WashoffEnvironment } from "./environment";

type PrismaTx = Prisma.TransactionClient;

export interface PrismaBackedWashoffPlatformRepositoryOptions {
  prisma?: PrismaClient;
  store?: PrismaPlatformPersistenceStore;
  requestTimeSweepEnabled?: boolean;
  runtimeStatus?: PlatformRuntimeStatus;
  environment?: WashoffEnvironment;
}

const DEFAULT_HOTEL_ID = "hotel-1";
const DEFAULT_PROVIDER_ID = "provider-1";
const DEFAULT_ADMIN_ACCOUNT_ID = "account-admin-1";
const AUTO_ASSIGNMENT_RESPONSE_WINDOW_MINUTES = 30;
const ACCOUNT_SESSION_DURATION_HOURS = 24 * 7;
const ACCOUNT_ACTIVATION_TOKEN_DURATION_HOURS = 72;
const PASSWORD_RESET_TOKEN_DURATION_HOURS = 2;
const ACCOUNT_NOT_ACTIVATED_ERROR = "الحساب غير مفعل بعد. أكمل التفعيل بعد اعتماد الإدارة أولًا.";
const ACCOUNT_SUSPENDED_ERROR = "هذا الحساب موقوف حاليًا. يرجى التواصل مع إدارة WashOff.";
const ACCOUNT_INVALID_CREDENTIALS_ERROR = "بيانات الدخول غير صحيحة أو أن الحساب غير مفعل بعد.";
const ACCOUNT_ACTIVATION_TOKEN_ERROR = "رابط التفعيل غير صالح أو انتهت صلاحيته.";
const HOTEL_ACCESS_NOT_APPROVED_ERROR =
  "لا يمكن الوصول إلى لوحة الفندق قبل اعتماد طلب التسجيل من الإدارة.";
const PROVIDER_ACCESS_NOT_APPROVED_ERROR =
  "لا يمكن الوصول إلى لوحة المزود قبل اعتماد طلب التسجيل من الإدارة.";
const PROVIDER_ACTIVE_ORDER_STATUSES = new Set([
  OrderStatus.Accepted,
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
  OrderStatus.Delivered,
]);
const ACCOUNT_ACTIVATION_TOKEN_USED_ERROR =
  "تم استخدام رابط التفعيل مسبقًا. سجّل الدخول أو اطلب رابطًا جديدًا من الإدارة.";
const PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE =
  "إذا كان البريد مرتبطًا بحساب نشط في WashOff فسيتم تجهيز رابط إعادة ضبط كلمة المرور.";
const PASSWORD_RESET_TOKEN_INVALID_ERROR = "رابط إعادة ضبط كلمة المرور غير صالح.";
const PASSWORD_RESET_TOKEN_EXPIRED_ERROR =
  "انتهت صلاحية رابط إعادة ضبط كلمة المرور. اطلب رابطًا جديدًا.";
const PASSWORD_RESET_TOKEN_USED_ERROR =
  "تم استخدام رابط إعادة ضبط كلمة المرور مسبقًا. اطلب رابطًا جديدًا.";
const RELIABILITY_PENALTIES = {
  [ReassignmentReason.ProviderRejected]: {
    acceptanceRate: 0.03,
    rating: 0.05,
    qualityScore: 2,
    reassignmentRate: 0.03,
  },
  [ReassignmentReason.ProviderExpired]: {
    acceptanceRate: 0.06,
    rating: 0.08,
    qualityScore: 3,
    reassignmentRate: 0.05,
  },
} as const;

const roundMetric = (value: number, decimals = 3) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const toDecimal = (value: number | undefined | null) => {
  if (value === undefined || value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
};

const toNumber = (value: Prisma.Decimal | number | null | undefined) => {
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

const addHours = (fromIso: string, hours: number) => {
  return new Date(new Date(fromIso).getTime() + hours * 60 * 60 * 1000).toISOString();
};

const buildActivationPath = (token: string) => `/activate-account?token=${encodeURIComponent(token)}`;
const buildResetPasswordPath = (token: string) => `/reset-password?token=${encodeURIComponent(token)}`;

const fromJson = <Value,>(value: Prisma.JsonValue | null | undefined, fallback: Value): Value => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return JSON.parse(JSON.stringify(value)) as Value;
};

const fromJsonOptional = <Value,>(value: Prisma.JsonValue | null | undefined): Value | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Value;
};

const toJsonInput = <Value,>(value: Value): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const createOrderStatusHistoryEntry = ({
  orderId,
  fromStatus,
  toStatus,
  changedAt,
  actorRole,
  notesAr,
}: {
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedAt: string;
  actorRole: "hotel" | "provider" | "admin" | "system";
  notesAr?: string;
}): OrderStatusHistoryEntry => ({
  id: `order-status-history-${orderId}-${toStatus}-${changedAt}`,
  orderId,
  fromStatus,
  toStatus,
  changedAt,
  actorRole,
  notesAr,
});

const appendOrderStatusHistory = ({
  order,
  toStatus,
  changedAt,
  actorRole,
  notesAr,
}: {
  order: LaundryOrder;
  toStatus: OrderStatus;
  changedAt: string;
  actorRole: "hotel" | "provider" | "admin" | "system";
  notesAr?: string;
}) => {
  const existingHistory = order.statusHistory ?? [];
  const lastEntry = existingHistory[existingHistory.length - 1];

  if (lastEntry?.toStatus === toStatus && lastEntry.changedAt === changedAt) {
    return existingHistory;
  }

  return [
    ...existingHistory,
    createOrderStatusHistoryEntry({
      orderId: order.id,
      fromStatus: order.status,
      toStatus,
      changedAt,
      actorRole,
      notesAr,
    }),
  ];
};

const buildFutureDate = (fromIso: string, minutes: number) => {
  return new Date(new Date(fromIso).getTime() + minutes * 60 * 1000).toISOString();
};

const normalizePickupAt = (pickupAt: string) => {
  const normalized = new Date(pickupAt);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error("يرجى إدخال موعد استلام صالح.");
  }

  return normalized.toISOString();
};

const mapAccountRecordToDomain = (account: PrismaAccountRecord): AccountProfile => ({
  id: account.id,
  fullName: account.fullName,
  email: account.email,
  phone: account.phone ?? undefined,
  role: account.role as AccountRole,
  status: account.status as AccountStatus,
  linkedEntityType: account.linkedEntityType as LinkedEntityType | undefined,
  linkedHotelId: account.linkedHotelId ?? undefined,
  linkedProviderId: account.linkedProviderId ?? undefined,
  activation: {
    state: account.activationState as AccountActivationState,
    issuedAt: toIsoString(account.activationTokenIssuedAt),
    eligibleAt: toIsoString(account.activationEligibleAt),
    tokenExpiresAt: toIsoString(account.activationTokenExpiresAt),
    usedAt: toIsoString(account.activationTokenUsedAt),
    activatedAt: toIsoString(account.activatedAt),
  },
  passwordReset: {
    state: (account.passwordResetState as PasswordResetState | undefined) ?? PasswordResetState.Idle,
    requestedAt: toIsoString(account.passwordResetRequestedAt),
    issuedAt: toIsoString(account.passwordResetIssuedAt),
    tokenExpiresAt: toIsoString(account.passwordResetTokenExpiresAt),
    usedAt: toIsoString(account.passwordResetTokenUsedAt),
    completedAt: toIsoString(account.passwordResetCompletedAt),
  },
  suspension: {
    suspendedAt: toIsoString(account.suspendedAt),
    suspendedByAccountId: account.suspendedByAccountId ?? undefined,
    suspendedByRole: account.suspendedByRole as AccountRole | "system" | undefined,
    suspensionReasonAr: account.suspensionReasonAr ?? undefined,
    reactivatedAt: toIsoString(account.reactivatedAt),
    reactivatedByAccountId: account.reactivatedByAccountId ?? undefined,
    reactivatedByRole: account.reactivatedByRole as AccountRole | "system" | undefined,
    reactivationReasonAr: account.reactivationReasonAr ?? undefined,
  },
  lastLoginAt: toIsoString(account.lastLoginAt),
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
});

const mapAccountSessionRecordToDomain = (
  session: PrismaAccountSessionRecord,
): AccountSessionProfile => ({
  id: session.id,
  accountId: session.accountId,
  role: session.role as AccountRole,
  linkedEntityType: session.linkedEntityType as LinkedEntityType | undefined,
  linkedEntityId: session.linkedEntityId ?? undefined,
  createdAt: session.createdAt.toISOString(),
  expiresAt: session.expiresAt.toISOString(),
  lastSeenAt: toIsoString(session.lastSeenAt),
  revokedAt: toIsoString(session.revokedAt),
  revokedReasonAr: session.revokedReasonAr ?? undefined,
  revokedByAccountId: session.revokedByAccountId ?? undefined,
  revokedByRole: session.revokedByRole as AccountRole | "system" | undefined,
});

const mapIdentityAuditEventRecordToDomain = (
  event: PrismaIdentityAuditEventRecord,
): IdentityAuditEvent => ({
  id: event.id,
  accountId: event.accountId ?? undefined,
  sessionId: event.sessionId ?? undefined,
  type: event.eventType as IdentityAuditEventType,
  actorAccountId: event.actorAccountId ?? undefined,
  actorRole: event.actorRole as AccountRole | "system" | undefined,
  linkedEntityType: event.linkedEntityType as LinkedEntityType | undefined,
  linkedEntityId: event.linkedEntityId ?? undefined,
  detailsAr: event.detailsAr ?? undefined,
  metadata: fromJsonOptional<Record<string, unknown>>(event.metadataJson),
  createdAt: event.createdAt.toISOString(),
});

const mapPlatformSettingsRecordToDomain = (
  record: {
    id: string;
    siteNameAr: string;
    siteNameEn: string;
    siteTaglineAr: string;
    siteTaglineEn: string;
    mailFromNameAr: string;
    mailFromEmail: string;
    supportEmail: string | null;
    supportPhone: string | null;
    registrationEnabled: boolean;
    hotelRegistrationEnabled: boolean;
    providerRegistrationEnabled: boolean;
    requireAdminApprovalForHotels: boolean;
    requireAdminApprovalForProviders: boolean;
    updatedAt: Date;
    updatedByAccountId: string | null;
  },
): PlatformSettings => ({
  id: record.id,
  siteNameAr: record.siteNameAr,
  siteNameEn: record.siteNameEn,
  siteTaglineAr: record.siteTaglineAr,
  siteTaglineEn: record.siteTaglineEn,
  mailFromNameAr: record.mailFromNameAr,
  mailFromEmail: record.mailFromEmail,
  supportEmail: record.supportEmail ?? undefined,
  supportPhone: record.supportPhone ?? undefined,
  registrationEnabled: record.registrationEnabled,
  hotelRegistrationEnabled: record.hotelRegistrationEnabled,
  providerRegistrationEnabled: record.providerRegistrationEnabled,
  requireAdminApprovalForHotels: record.requireAdminApprovalForHotels,
  requireAdminApprovalForProviders: record.requireAdminApprovalForProviders,
  updatedAt: record.updatedAt.toISOString(),
  updatedByAccountId: record.updatedByAccountId ?? undefined,
});

const mapPlatformSettingsAuditRecordToDomain = (
  record: {
    id: string;
    settingsKey: string;
    oldValueJson: Prisma.JsonValue | null;
    newValueJson: Prisma.JsonValue;
    changedByAccountId: string | null;
    changedByRole: string | null;
    changedAt: Date;
    notesAr: string | null;
  },
): PlatformSettingsAuditEntry => ({
  id: record.id,
  settingsKey: record.settingsKey,
  oldValueJson:
    record.oldValueJson === null || record.oldValueJson === undefined
      ? undefined
      : JSON.stringify(record.oldValueJson),
  newValueJson: JSON.stringify(record.newValueJson),
  changedByAccountId: record.changedByAccountId ?? undefined,
  changedByRole: record.changedByRole as "admin" | "system" | undefined,
  changedAt: record.changedAt.toISOString(),
  notesAr: record.notesAr ?? undefined,
});

const mapPlatformContentEntryRecordToDomain = (
  record: {
    id: string;
    pageKey: string;
    sectionKey: string;
    contentKey: string;
    compositeKey: string;
    contentType: string;
    labelAr: string;
    labelEn: string;
    valueAr: string;
    valueEn: string;
    descriptionAr: string | null;
    descriptionEn: string | null;
    active: boolean;
    sortOrder: number;
    updatedAt: Date;
    updatedByAccountId: string | null;
  },
): PlatformContentEntry => ({
  id: record.id,
  pageKey: record.pageKey,
  sectionKey: record.sectionKey,
  contentKey: record.contentKey,
  compositeKey: record.compositeKey,
  contentType: record.contentType as PlatformContentEntry["contentType"],
  labelAr: record.labelAr,
  labelEn: record.labelEn,
  valueAr: record.valueAr,
  valueEn: record.valueEn,
  descriptionAr: record.descriptionAr ?? undefined,
  descriptionEn: record.descriptionEn ?? undefined,
  active: record.active,
  sortOrder: record.sortOrder,
  updatedAt: record.updatedAt.toISOString(),
  updatedByAccountId: record.updatedByAccountId ?? undefined,
});

const mapPlatformContentAuditRecordToDomain = (
  record: {
    id: string;
    contentEntryId: string;
    pageKey: string;
    sectionKey: string;
    contentKey: string;
    oldValueAr: string | null;
    oldValueEn: string | null;
    newValueAr: string;
    newValueEn: string;
    changedByAccountId: string | null;
    changedByRole: string | null;
    changedAt: Date;
    notesAr: string | null;
  },
): PlatformContentAuditEntry => ({
  id: record.id,
  contentEntryId: record.contentEntryId,
  pageKey: record.pageKey,
  sectionKey: record.sectionKey,
  contentKey: record.contentKey,
  oldValueAr: record.oldValueAr ?? undefined,
  oldValueEn: record.oldValueEn ?? undefined,
  newValueAr: record.newValueAr,
  newValueEn: record.newValueEn,
  changedByAccountId: record.changedByAccountId ?? undefined,
  changedByRole: record.changedByRole as "admin" | "system" | undefined,
  changedAt: record.changedAt.toISOString(),
  notesAr: record.notesAr ?? undefined,
});

const getRequestedCapacityKg = (order: Pick<LaundryOrder, "totalItemCount">) => {
  return order.totalItemCount;
};

const ensurePlatformAdminSeededTx = async (tx: PrismaTx) => {
  const existingSettingsCount = await tx.platformSettings.count();

  if (existingSettingsCount === 0) {
    await tx.platformSettings.create({
      data: {
        id: defaultPlatformSettings.id,
        siteNameAr: defaultPlatformSettings.siteNameAr,
        siteNameEn: defaultPlatformSettings.siteNameEn,
        siteTaglineAr: defaultPlatformSettings.siteTaglineAr,
        siteTaglineEn: defaultPlatformSettings.siteTaglineEn,
        mailFromNameAr: defaultPlatformSettings.mailFromNameAr,
        mailFromEmail: defaultPlatformSettings.mailFromEmail,
        supportEmail: defaultPlatformSettings.supportEmail ?? null,
        supportPhone: defaultPlatformSettings.supportPhone ?? null,
        registrationEnabled: defaultPlatformSettings.registrationEnabled,
        hotelRegistrationEnabled: defaultPlatformSettings.hotelRegistrationEnabled,
        providerRegistrationEnabled: defaultPlatformSettings.providerRegistrationEnabled,
        requireAdminApprovalForHotels: defaultPlatformSettings.requireAdminApprovalForHotels,
        requireAdminApprovalForProviders: defaultPlatformSettings.requireAdminApprovalForProviders,
        updatedAt: new Date(defaultPlatformSettings.updatedAt),
        updatedByAccountId: defaultPlatformSettings.updatedByAccountId ?? null,
      },
    });
  }

  const existingEntries = await tx.platformContentEntry.findMany({
    select: {
      id: true,
    },
  });
  const existingEntryIds = new Set(existingEntries.map((entry) => entry.id));
  const missingEntries = buildAllDefaultPlatformContentEntries().filter(
    (entry) => !existingEntryIds.has(entry.id),
  );

  if (missingEntries.length > 0) {
    await tx.platformContentEntry.createMany({
      data: missingEntries.map((entry) => ({
        id: entry.id,
        pageKey: entry.pageKey,
        sectionKey: entry.sectionKey,
        contentKey: entry.contentKey,
        compositeKey: entry.compositeKey,
        contentType: entry.contentType,
        labelAr: entry.labelAr,
        labelEn: entry.labelEn,
        valueAr: entry.valueAr,
        valueEn: entry.valueEn,
        descriptionAr: entry.descriptionAr ?? null,
        descriptionEn: entry.descriptionEn ?? null,
        active: entry.active,
        sortOrder: entry.sortOrder,
        updatedAt: new Date(entry.updatedAt),
        updatedByAccountId: entry.updatedByAccountId ?? null,
      })),
    });
  }
};

const getCapacityStatus = (availableKg: number, totalKg: number) => {
  if (availableKg <= 0) {
    return ProviderCapacityStatus.Full;
  }

  if (totalKg > 0 && availableKg / totalKg <= 0.2) {
    return ProviderCapacityStatus.Limited;
  }

  return ProviderCapacityStatus.Available;
};

const mapHotelRecordToDomain = (hotel: PrismaHotelRecord): HotelProfile => {
  const commercialRegistrationFile =
    fromJsonOptional<HotelRegistrationStoredDocumentReference>(
      hotel.commercialRegistrationFileJson,
    ) ?? {
      kind: "commercial_registration",
      fileName: "commercial-registration.pdf",
      mimeType: "application/pdf",
      sizeBytes: 0,
      uploadedAt: hotel.createdAt.toISOString(),
      storageKey: `legacy://${hotel.id}/commercial-registration.pdf`,
      downloadPath: buildHotelDocumentDownloadPath(hotel.id, "commercial_registration"),
    };
  const delegationLetterFile = fromJsonOptional<HotelRegistrationStoredDocumentReference>(
    hotel.delegationLetterFileJson,
  );

  return {
    id: hotel.id,
    code: hotel.code,
    displayName: {
      ar: hotel.displayNameAr,
      en: hotel.displayNameEn ?? undefined,
    },
    legalEntityName: hotel.legalEntityName ?? undefined,
    classification: (hotel.hotelClassification as HotelProfile["classification"]) ?? "other",
    roomCount: hotel.roomCount,
    address: {
      countryCode: hotel.countryCode,
      city: hotel.city,
      district: hotel.district ?? undefined,
      line1: hotel.line1 ?? undefined,
      postalCode: hotel.postalCode ?? undefined,
      latitude: hotel.latitude ?? undefined,
      longitude: hotel.longitude ?? undefined,
    },
    timezone: hotel.timezone,
    contact: {
      name: hotel.contactName ?? undefined,
      phone: hotel.contactPhone ?? undefined,
      email: hotel.contactEmail ?? undefined,
    },
    operationalProfile: {
      serviceLevel:
        (hotel.serviceLevel as HotelProfile["operationalProfile"]["serviceLevel"]) ?? "standard",
      operatingHours: hotel.operatingHours,
      requiresDailyPickup: hotel.requiresDailyPickup,
    },
    logistics: {
      addressText: hotel.addressText || hotel.line1 || "",
      pickupLocation: hotel.pickupLocation ?? undefined,
      hasLoadingArea: hotel.hasLoadingArea,
      accessNotes: hotel.accessNotes ?? undefined,
    },
    compliance: {
      taxRegistrationNumber: hotel.taxRegistrationNumber || hotel.code,
      commercialRegistrationNumber: hotel.commercialRegistrationNumber || hotel.code,
      commercialRegistrationFile: {
        ...commercialRegistrationFile,
        downloadPath:
          commercialRegistrationFile.downloadPath ??
          buildHotelDocumentDownloadPath(hotel.id, "commercial_registration"),
      },
      delegationLetterFile: delegationLetterFile
        ? {
            ...delegationLetterFile,
            downloadPath:
              delegationLetterFile.downloadPath ??
              buildHotelDocumentDownloadPath(hotel.id, "delegation_letter"),
          }
        : undefined,
      delegationStatus: (hotel.delegationStatus as HotelProfile["compliance"]["delegationStatus"]) ?? "not_provided",
    },
    contractedServiceIds: fromJson<string[]>(hotel.contractedServiceIdsJson, []),
    active: hotel.active,
    notesAr: hotel.notesAr ?? undefined,
    onboarding: {
      status: (hotel.onboardingStatus as OnboardingStatus | undefined) ?? OnboardingStatus.Approved,
      submittedAt: toIsoString(hotel.submittedAt) ?? hotel.createdAt.toISOString(),
      reviewedAt: toIsoString(hotel.reviewedAt),
      reviewedByRole: hotel.reviewedByRole as HotelProfile["onboarding"]["reviewedByRole"],
      reviewedById: hotel.reviewedById ?? undefined,
      reviewNotesAr: hotel.reviewNotesAr ?? undefined,
    },
    createdAt: hotel.createdAt.toISOString(),
    updatedAt: hotel.updatedAt.toISOString(),
  };
};

const mapServiceRecordToDomain = (service: PrismaServiceRecord): ServiceCatalogItem => ({
  id: service.id,
  code: service.code,
  name: {
    ar: service.nameAr,
    en: service.nameEn ?? undefined,
  },
  description:
    service.descriptionAr || service.descriptionEn
      ? {
          ar: service.descriptionAr ?? "",
          en: service.descriptionEn ?? undefined,
        }
      : undefined,
  category: service.category as ServiceCategory,
  billingUnit: service.billingUnit as ServiceBillingUnit,
  defaultUnitPriceSar: toNumber(service.defaultUnitPriceSar) ?? 0,
  defaultTurnaroundHours: service.defaultTurnaroundHours,
  supportsRush: service.supportsRush,
  active: service.active,
});

const selectLatestCapacityRows = (rows: PrismaProviderCapacityRecord[]) => {
  const capacityByProviderId = new Map<string, PrismaProviderCapacityRecord>();

  rows.forEach((row) => {
    const current = capacityByProviderId.get(row.providerId);

    if (!current || row.capacityDate > current.capacityDate) {
      capacityByProviderId.set(row.providerId, row);
    }
  });

  return capacityByProviderId;
};

const mapProviderRecordsToDomain = ({
  providers,
  capabilities,
  capacities,
  performance,
}: {
  providers: PrismaProviderRecord[];
  capabilities: PrismaProviderCapabilityRecord[];
  capacities: PrismaProviderCapacityRecord[];
  performance: PrismaProviderPerformanceStatsRecord[];
}): ProviderProfile[] => {
  const capabilitiesByProviderId = new Map<string, PrismaProviderCapabilityRecord[]>();
  const performanceByProviderId = new Map<string, PrismaProviderPerformanceStatsRecord>();
  const capacityByProviderId = selectLatestCapacityRows(capacities);

  capabilities.forEach((capability) => {
    const list = capabilitiesByProviderId.get(capability.providerId) ?? [];
    list.push(capability);
    capabilitiesByProviderId.set(capability.providerId, list);
  });

  performance.forEach((entry) => {
    performanceByProviderId.set(entry.providerId, entry);
  });

  return providers.map((provider) => {
    const providerCapacity = capacityByProviderId.get(provider.id);
    const providerPerformance = performanceByProviderId.get(provider.id);

    return {
      id: provider.id,
      code: provider.code,
      legalName: {
        ar: provider.legalNameAr,
        en: provider.legalNameEn ?? undefined,
      },
      displayName: {
        ar: provider.displayNameAr,
        en: provider.displayNameEn ?? undefined,
      },
      address: {
        countryCode: provider.countryCode,
        city: provider.city,
        district: provider.district ?? undefined,
        line1: provider.line1 ?? undefined,
        postalCode: provider.postalCode ?? undefined,
        latitude: provider.latitude ?? undefined,
        longitude: provider.longitude ?? undefined,
      },
      timezone: provider.timezone,
      contact: {
        name: provider.contactName ?? undefined,
        phone: provider.contactPhone ?? undefined,
        email: provider.contactEmail ?? undefined,
      },
      serviceAreaCities: fromJson<string[]>(provider.serviceAreaCitiesJson, []),
      capabilities: (capabilitiesByProviderId.get(provider.id) ?? []).map((capability) => ({
        serviceId: capability.serviceId,
        serviceName: {
          ar: capability.serviceNameAr,
          en: capability.serviceNameEn ?? undefined,
        },
        active: capability.active,
        unitPriceSar: toNumber(capability.unitPriceSar) ?? 0,
        maxDailyKg: toNumber(capability.maxDailyKg) ?? 0,
        maxSingleOrderKg: toNumber(capability.maxSingleOrderKg) ?? 0,
        rushSupported: capability.rushSupported,
        supportedCityCodes: fromJson<string[]>(capability.supportedCityCodesJson, []),
        defaultTurnaroundHours: capability.defaultTurnaroundHours,
        minimumPickupLeadHours: capability.minimumPickupLeadHours,
        pickupWindow: {
          startHour: capability.pickupWindowStartHour,
          endHour: capability.pickupWindowEndHour,
        },
      })),
      currentCapacity: {
        providerId: provider.id,
        date: providerCapacity?.capacityDate ?? new Date().toISOString().slice(0, 10),
        totalKg: toNumber(providerCapacity?.totalKg) ?? 0,
        committedKg: toNumber(providerCapacity?.committedKg) ?? 0,
        reservedKg: toNumber(providerCapacity?.reservedKg) ?? 0,
        availableKg: toNumber(providerCapacity?.availableKg) ?? 0,
        utilizationRatio: toNumber(providerCapacity?.utilizationRatio) ?? 0,
        status: (providerCapacity?.status as ProviderCapacityStatus) ?? ProviderCapacityStatus.Available,
        cutoffAt: toIsoString(providerCapacity?.cutoffAt),
        createdAt: providerCapacity?.createdAt.toISOString() ?? provider.createdAt.toISOString(),
        updatedAt: providerCapacity?.updatedAt.toISOString() ?? provider.updatedAt.toISOString(),
      },
      performance: {
        providerId: provider.id,
        rating: toNumber(providerPerformance?.rating) ?? 0,
        acceptanceRate: toNumber(providerPerformance?.acceptanceRate) ?? 0,
        onTimePickupRate: toNumber(providerPerformance?.onTimePickupRate) ?? 0,
        onTimeDeliveryRate: toNumber(providerPerformance?.onTimeDeliveryRate) ?? 0,
        qualityScore: toNumber(providerPerformance?.qualityScore) ?? 0,
        disputeRate: toNumber(providerPerformance?.disputeRate) ?? 0,
        reassignmentRate: toNumber(providerPerformance?.reassignmentRate) ?? 0,
        completedOrders: providerPerformance?.completedOrders ?? 0,
        cancelledOrders: providerPerformance?.cancelledOrders ?? 0,
        lastEvaluatedAt:
          providerPerformance?.lastEvaluatedAt.toISOString() ?? provider.updatedAt.toISOString(),
      },
      active: provider.active,
      notesAr: provider.notesAr ?? undefined,
      onboarding: {
        status: (provider.onboardingStatus as OnboardingStatus | undefined) ?? OnboardingStatus.Approved,
        submittedAt: toIsoString(provider.submittedAt) ?? provider.createdAt.toISOString(),
        reviewedAt: toIsoString(provider.reviewedAt),
        reviewedByRole: provider.reviewedByRole as ProviderProfile["onboarding"]["reviewedByRole"],
        reviewedById: provider.reviewedById ?? undefined,
        reviewNotesAr: provider.reviewNotesAr ?? undefined,
      },
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    };
  });
};

const mapAssignmentRecordToDomain = (assignment: PrismaAssignmentRecord): Assignment => ({
  id: assignment.id,
  orderId: assignment.orderId,
  hotelId: assignment.hotelId,
  providerId: assignment.providerId,
  attemptNumber: assignment.attemptNumber,
  status: assignment.status as AssignmentStatus,
  assignedAt: assignment.assignedAt.toISOString(),
  responseDueAt: toIsoString(assignment.responseDueAt),
  respondedAt: toIsoString(assignment.respondedAt),
  acceptedAt: toIsoString(assignment.acceptedAt),
  scoreBreakdown: fromJson<ScoreBreakdown>(assignment.scoreBreakdownJson, createEmptyScoreBreakdown()),
  eligibilityResult: fromJson<EligibilityResult>(assignment.eligibilityResultJson, {
    providerId: assignment.providerId,
    orderId: assignment.orderId,
    eligible: false,
    reasonCodes: [],
    blockingReasonsAr: [],
    capabilityMatch: {
      providerId: assignment.providerId,
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
    evaluatedAt: assignment.assignedAt.toISOString(),
  }),
});

const mapAssignmentHistoryRecordToDomain = (
  history: PrismaAssignmentHistoryRecord,
): AssignmentHistory => ({
  id: history.id,
  assignmentId: history.assignmentId,
  orderId: history.orderId,
  providerId: history.providerId,
  attemptNumber: history.attemptNumber,
  fromStatus: (history.fromStatus as AssignmentStatus) ?? undefined,
  toStatus: history.toStatus as AssignmentStatus,
  changedAt: history.changedAt.toISOString(),
  actorRole: history.actorRole as AssignmentHistory["actorRole"],
  reasonAr: history.reasonAr ?? undefined,
});

const mapMatchingLogRecordToDomain = (log: PrismaMatchingLogRecord): MatchingLog => ({
  id: log.id,
  matchingRunId: log.matchingRunId,
  orderId: log.orderId,
  providerId: log.providerId,
  decision: log.decision as MatchingDecision,
  eligibilityResult: fromJson<EligibilityResult>(log.eligibilityResultJson, {
    providerId: log.providerId,
    orderId: log.orderId,
    eligible: false,
    reasonCodes: [],
    blockingReasonsAr: [],
    capabilityMatch: {
      providerId: log.providerId,
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
    evaluatedAt: log.evaluatedAt.toISOString(),
  }),
  scoreBreakdown: fromJson<ScoreBreakdown>(log.scoreBreakdownJson, createEmptyScoreBreakdown()),
  evaluatedAt: log.evaluatedAt.toISOString(),
  notesAr: log.notesAr ?? undefined,
});

const mapReassignmentEventRecordToDomain = (
  event: PrismaReassignmentEventRecord,
): ReassignmentEvent => ({
  id: event.id,
  orderId: event.orderId,
  previousAssignmentId: event.previousAssignmentId ?? undefined,
  previousProviderId: event.previousProviderId ?? undefined,
  nextProviderId: event.nextProviderId ?? undefined,
  reason: event.reason as ReassignmentReason,
  actorRole: event.actorRole as ReassignmentEvent["actorRole"],
  createdAt: event.createdAt.toISOString(),
  notesAr: event.notesAr ?? undefined,
});

const mapSlaHistoryRecordToDomain = (history: PrismaSlaHistoryRecord): SLAHistory => ({
  id: history.id,
  orderId: history.orderId,
  checkpoint: history.checkpoint as SLACheckpoint,
  targetAt: history.targetAt.toISOString(),
  actualAt: toIsoString(history.actualAt),
  status: history.status as SLAStatus,
  recordedAt: history.recordedAt.toISOString(),
  notesAr: history.notesAr ?? undefined,
});

const mapSettlementLineItemRecordToDomain = (
  lineItem: PrismaSettlementLineItemRecord,
): SettlementLineItem => ({
  id: lineItem.id,
  orderItemId: lineItem.orderItemId ?? undefined,
  description: {
    ar: lineItem.descriptionAr,
    en: lineItem.descriptionEn ?? undefined,
  },
  quantity: toNumber(lineItem.quantity) ?? 0,
  unitPriceSar: toNumber(lineItem.unitPriceSar) ?? 0,
  totalSar: toNumber(lineItem.totalSar) ?? 0,
});

const mapSettlementRecordToDomain = (
  settlement: PrismaSettlementRecord,
  lineItems: PrismaSettlementLineItemRecord[],
): Settlement => ({
  id: settlement.id,
  orderId: settlement.orderId,
  hotelId: settlement.hotelId,
  providerId: settlement.providerId,
  currency: settlement.currency as Settlement["currency"],
  status: settlement.status as SettlementStatus,
  lineItems: lineItems.map(mapSettlementLineItemRecordToDomain),
  subtotalSar: toNumber(settlement.subtotalSar) ?? 0,
  platformFeeSar: toNumber(settlement.platformFeeSar) ?? 0,
  adjustmentsSar: toNumber(settlement.adjustmentsSar) ?? 0,
  totalSar: toNumber(settlement.totalSar) ?? 0,
  generatedAt: settlement.generatedAt.toISOString(),
  dueAt: toIsoString(settlement.dueAt),
  paidAt: toIsoString(settlement.paidAt),
});

const mapOrdersToDomain = ({
  orders,
  items,
  assignments,
  assignmentHistory,
  matchingLogs,
  reassignmentEvents,
  slaHistory,
  settlements,
  settlementLineItems,
}: {
  orders: PrismaOrderRecord[];
  items: PrismaOrderItemRecord[];
  assignments: PrismaAssignmentRecord[];
  assignmentHistory: PrismaAssignmentHistoryRecord[];
  matchingLogs: PrismaMatchingLogRecord[];
  reassignmentEvents: PrismaReassignmentEventRecord[];
  slaHistory: PrismaSlaHistoryRecord[];
  settlements: PrismaSettlementRecord[];
  settlementLineItems: PrismaSettlementLineItemRecord[];
}): LaundryOrder[] => {
  const itemsByOrderId = new Map<string, PrismaOrderItemRecord[]>();
  const assignmentsByOrderId = new Map<string, PrismaAssignmentRecord[]>();
  const assignmentHistoryByOrderId = new Map<string, PrismaAssignmentHistoryRecord[]>();
  const matchingLogsByOrderId = new Map<string, PrismaMatchingLogRecord[]>();
  const reassignmentEventsByOrderId = new Map<string, PrismaReassignmentEventRecord[]>();
  const slaHistoryByOrderId = new Map<string, PrismaSlaHistoryRecord[]>();
  const settlementsByOrderId = new Map<string, PrismaSettlementRecord[]>();
  const settlementLineItemsBySettlementId = new Map<string, PrismaSettlementLineItemRecord[]>();

  items.forEach((item) => {
    const list = itemsByOrderId.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrderId.set(item.orderId, list);
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

  return orders.map((order) => {
    const orderAssignments = (assignmentsByOrderId.get(order.id) ?? [])
      .slice()
      .sort((left, right) => left.attemptNumber - right.attemptNumber);
    const activeAssignment = order.activeAssignmentId
      ? orderAssignments.find((assignment) => assignment.id === order.activeAssignmentId)
      : undefined;
    const orderSettlements = (settlementsByOrderId.get(order.id) ?? [])
      .slice()
      .sort((left, right) => left.generatedAt.getTime() - right.generatedAt.getTime());
    const latestSettlement = orderSettlements.at(-1);

    return {
      id: order.id,
      hotelId: order.hotelId,
      hotelSnapshot: fromJson<OrderPartySnapshot>(order.hotelSnapshotJson, {
        id: order.hotelId,
        displayName: { ar: order.hotelId },
        city: "",
      }),
      providerId: order.providerId ?? undefined,
      providerSnapshot: fromJsonOptional<OrderPartySnapshot>(order.providerSnapshotJson),
      assignmentMode: order.assignmentMode as OrderAssignmentMode,
      status: order.status as OrderStatus,
      priority: order.priority as OrderPriority,
      items: (itemsByOrderId.get(order.id) ?? []).map<OrderItem>((item) => ({
        id: item.id,
        serviceId: item.serviceId,
        serviceName: {
          ar: item.serviceNameAr,
          en: item.serviceNameEn ?? undefined,
        },
        quantity: toNumber(item.quantity) ?? 0,
        unit: item.unit as ServiceBillingUnit,
        unitPriceSar: toNumber(item.unitPriceSar) ?? 0,
        estimatedLineTotalSar: toNumber(item.estimatedLineTotalSar) ?? 0,
        notesAr: item.notesAr ?? undefined,
      })),
      totalItemCount: toNumber(order.totalItemCount) ?? 0,
      currency: order.currency as LaundryOrder["currency"],
      estimatedSubtotalSar: toNumber(order.estimatedSubtotalSar) ?? 0,
      pickupAt: order.pickupAt.toISOString(),
      notesAr: order.notesAr ?? undefined,
      statusUpdatedAt: order.statusUpdatedAt.toISOString(),
      progressPercent: toNumber(order.progressPercent),
      activeAssignmentId: order.activeAssignmentId ?? undefined,
      activeAssignment: activeAssignment ? mapAssignmentRecordToDomain(activeAssignment) : undefined,
      assignmentHistory: (assignmentHistoryByOrderId.get(order.id) ?? [])
        .slice()
        .sort((left, right) => left.changedAt.getTime() - right.changedAt.getTime())
        .map(mapAssignmentHistoryRecordToDomain),
      statusHistory: fromJson<OrderStatusHistoryEntry[]>(order.statusHistoryJson, []),
      matchingLogs: (matchingLogsByOrderId.get(order.id) ?? [])
        .slice()
        .sort((left, right) => left.evaluatedAt.getTime() - right.evaluatedAt.getTime())
        .map(mapMatchingLogRecordToDomain),
      slaWindow: fromJson(order.slaWindowJson, {
        responseDueAt: undefined,
        pickupTargetAt: undefined,
        deliveryTargetAt: undefined,
        completionTargetAt: undefined,
      }),
      slaHistory: (slaHistoryByOrderId.get(order.id) ?? [])
        .slice()
        .sort((left, right) => left.recordedAt.getTime() - right.recordedAt.getTime())
        .map(mapSlaHistoryRecordToDomain),
      reassignmentEvents: (reassignmentEventsByOrderId.get(order.id) ?? [])
        .slice()
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
        .map(mapReassignmentEventRecordToDomain),
      settlement:
        latestSettlement
          ? mapSettlementRecordToDomain(
              latestSettlement,
              settlementLineItemsBySettlementId.get(latestSettlement.id) ?? [],
            )
          : undefined,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  });
};

const requireTextField = (value: string | undefined, label: string) => {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`يرجى إدخال ${label}.`);
  }

  return normalized;
};

const requireEmailField = (value: string | undefined) => {
  const normalized = requireTextField(value, "البريد الإلكتروني");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("يرجى إدخال بريد إلكتروني صالح.");
  }

  return normalized;
};

const requirePhoneField = (value: string | undefined) => {
  const normalized = requireTextField(value, "رقم الجوال");

  if (normalized.replace(/[^0-9+]/g, "").length < 8) {
    throw new Error("يرجى إدخال رقم جوال صالح.");
  }

  return normalized;
};

const normalizeOptionalTextField = (value: string | undefined) => value?.trim() || undefined;

const requirePositiveNumberField = (value: number | string | undefined, label: string) => {
  const normalized = Number(value);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`يرجى إدخال ${label} بقيمة صحيحة.`);
  }

  return normalized;
};

const requireCoordinateField = ({
  value,
  label,
  min,
  max,
}: {
  value: number | string | undefined;
  label: string;
  min: number;
  max: number;
}) => {
  const normalized = Number(value);

  if (!Number.isFinite(normalized) || normalized < min || normalized > max) {
    throw new Error(`يرجى إدخال ${label} بصيغة رقمية صحيحة.`);
  }

  return normalized;
};

const normalizeOptionalDateField = (value: string | undefined, label: string) => {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`يرجى إدخال ${label} بتاريخ صالح.`);
  }

  return parsedDate.toISOString();
};

const validateHotelRegistrationInput = (input: HotelRegistrationInput) => {
  if (!(input.hotelClassification in hotelClassificationLabelsAr)) {
    throw new Error("يرجى اختيار تصنيف الفندق.");
  }

  if (!HOTEL_REGISTRATION_SAUDI_CITIES_AR.includes(input.city)) {
    throw new Error("يرجى اختيار المدينة من القائمة المتاحة.");
  }

  if (!(input.serviceLevel in hotelServiceLevelLabelsAr)) {
    throw new Error("يرجى اختيار مستوى الخدمة.");
  }

  if (!input.commercialRegistrationFile) {
    throw new Error("يجب إرفاق ملف السجل التجاري.");
  }

  if (typeof input.requiresDailyPickup !== "boolean") {
    throw new Error("يرجى تحديد ما إذا كان الفندق يحتاج استلامًا يوميًا.");
  }

  if (typeof input.hasLoadingArea !== "boolean") {
    throw new Error("يرجى تحديد ما إذا كانت هناك منطقة تحميل.");
  }

  const files = [input.commercialRegistrationFile, input.delegationLetterFile].filter(
    (file): file is HotelRegistrationDocumentUploadInput => Boolean(file),
  );

  files.forEach((file) => {
    if (!Number.isFinite(file.sizeBytes) || file.sizeBytes <= 0) {
      throw new Error(`يرجى إرفاق ملف صالح: ${file.fileName}.`);
    }

    if (file.sizeBytes > HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
      throw new Error("الحد الأقصى لحجم الملف هو 5 ميجابايت.");
    }
  });

  assertHotelRegistrationDocumentsTotalSize(files);

  return {
    hotelName: requireTextField(input.hotelName, "اسم الفندق"),
    legalEntityName: normalizeOptionalTextField(input.legalEntityName),
    city: input.city,
    hotelClassification: input.hotelClassification,
    roomCount: requirePositiveNumberField(input.roomCount, "عدد الغرف"),
    taxRegistrationNumber: requireTextField(
      input.taxRegistrationNumber,
      "الرقم الضريبي",
    ),
    serviceLevel: input.serviceLevel,
    operatingHours: requireTextField(input.operatingHours, "ساعات التشغيل"),
    requiresDailyPickup: input.requiresDailyPickup,
    addressText: requireTextField(input.addressText, "العنوان"),
    latitude: requireCoordinateField({
      value: input.latitude,
      label: "خط العرض",
      min: -90,
      max: 90,
    }),
    longitude: requireCoordinateField({
      value: input.longitude,
      label: "خط الطول",
      min: -180,
      max: 180,
    }),
    pickupLocation: normalizeOptionalTextField(input.pickupLocation),
    hasLoadingArea: input.hasLoadingArea,
    accessNotes: normalizeOptionalTextField(input.accessNotes),
    commercialRegistrationNumber: requireTextField(
      input.commercialRegistrationNumber,
      "رقم السجل التجاري",
    ),
    commercialRegistrationFile: input.commercialRegistrationFile,
    delegationLetterFile: input.delegationLetterFile,
    contactPersonName: requireTextField(input.contactPersonName, "اسم مسؤول التواصل"),
    contactEmail: requireEmailField(input.contactEmail),
    contactPhone: requirePhoneField(input.contactPhone),
    notesAr: normalizeOptionalTextField(input.notesAr ?? input.notes),
  };
};

const validateProviderRegistrationInput = (
  input: ProviderRegistrationInput,
  services: ServiceCatalogItem[],
) => {
  const supportedServiceIds = Array.from(
    new Set(input.supportedServiceIds.map((serviceId) => serviceId.trim()).filter(Boolean)),
  );
  const dailyCapacityKg = Number(input.dailyCapacityKg);
  const serviceMap = new Map(services.map((service) => [service.id, service]));

  if (supportedServiceIds.length === 0) {
    throw new Error("اختر خدمة واحدة على الأقل للمزوّد.");
  }

  if (!Number.isFinite(dailyCapacityKg) || dailyCapacityKg <= 0) {
    throw new Error("يرجى إدخال سعة تشغيلية يومية صحيحة.");
  }

  supportedServiceIds.forEach((serviceId) => {
    const service = serviceMap.get(serviceId);

    if (!service) {
      throw new Error(`الخدمة ${serviceId} غير موجودة.`);
    }

    if (!service.active) {
      throw new Error(`الخدمة ${service.name.ar} غير متاحة حالياً.`);
    }
  });

  return {
    providerName: requireTextField(input.providerName, "اسم المزوّد"),
    city: requireTextField(input.city, "المدينة"),
    contactPersonName: requireTextField(input.contactPersonName, "اسم مسؤول التواصل"),
    contactEmail: requireEmailField(input.contactEmail),
    contactPhone: requirePhoneField(input.contactPhone),
    supportedServiceIds,
    dailyCapacityKg,
    notesAr: input.notesAr?.trim() || undefined,
  };
};

const isHotelOperationallyApproved = (hotel: HotelProfile | undefined) => {
  return Boolean(hotel && hotel.active && hotel.onboarding.status === OnboardingStatus.Approved);
};

const isProviderOperationallyApproved = (provider: ProviderProfile | undefined) => {
  return Boolean(provider && provider.active && provider.onboarding.status === OnboardingStatus.Approved);
};

const buildProviderCapabilitiesForRegistration = (
  serviceIds: string[],
  city: string,
  dailyCapacityKg: number,
  services: ServiceCatalogItem[],
) => {
  const serviceMap = new Map(services.map((service) => [service.id, service]));

  return serviceIds.map((serviceId) => {
    const service = serviceMap.get(serviceId);

    if (!service) {
      throw new Error(`الخدمة ${serviceId} غير موجودة.`);
    }

    return {
      serviceId: service.id,
      serviceName: service.name,
      active: true,
      unitPriceSar: service.defaultUnitPriceSar,
      maxDailyKg: dailyCapacityKg,
      maxSingleOrderKg: Math.max(Math.round(dailyCapacityKg * 0.3), 25),
      rushSupported: service.supportsRush,
      supportedCityCodes: [city],
      defaultTurnaroundHours: service.defaultTurnaroundHours,
      minimumPickupLeadHours: 2,
      pickupWindow: {
        startHour: 8,
        endHour: 22,
      },
    };
  });
};

const selectNextEntityNumber = (ids: string[], prefix: "hotel" | "provider") => {
  const maxValue = ids.reduce((currentMax, id) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(id);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return maxValue + 1;
};

const validateCreateHotelOrderInput = (
  input: CreateHotelOrderInput,
  services: ServiceCatalogItem[],
) => {
  const serviceIds = Array.from(
    new Set(
      input.serviceIds
        .map((serviceId) => serviceId.trim())
        .filter(Boolean),
    ),
  );

  if (serviceIds.length === 0) {
    throw new Error("اختر خدمة واحدة على الأقل قبل إرسال الطلب.");
  }

  const itemCount = Number(input.itemCount);

  if (!Number.isFinite(itemCount) || itemCount <= 0) {
    throw new Error("يرجى إدخال كمية صحيحة أكبر من صفر.");
  }

  const pickupAt = normalizePickupAt(input.pickupAt);

  if (new Date(pickupAt).getTime() <= Date.now()) {
    throw new Error("يجب أن يكون موعد الاستلام في المستقبل.");
  }

  const serviceMap = new Map(services.map((service) => [service.id, service]));

  serviceIds.forEach((serviceId) => {
    const service = serviceMap.get(serviceId);

    if (!service) {
      throw new Error(`الخدمة ${serviceId} غير موجودة.`);
    }

    if (!service.active) {
      throw new Error(`الخدمة ${service.name.ar} غير متاحة حالياً.`);
    }
  });

  return {
    serviceIds,
    itemCount,
    pickupAt,
    notesAr: (input.notesAr ?? input.notes?.trim()) || undefined,
    priority: input.priority ?? OrderPriority.Standard,
  };
};

const buildOrderItems = ({
  orderId,
  serviceIds,
  totalItemCount,
  serviceMap,
}: {
  orderId: string;
  serviceIds: string[];
  totalItemCount: number;
  serviceMap: Map<string, ServiceCatalogItem>;
}): OrderItem[] => {
  return serviceIds.map((serviceId, index) => {
    const service = serviceMap.get(serviceId);

    if (!service) {
      throw new Error(`الخدمة ${serviceId} غير موجودة.`);
    }

    return {
      id: `${orderId}-item-${index + 1}-${service.id}`,
      serviceId: service.id,
      serviceName: service.name,
      quantity: totalItemCount,
      unit: service.billingUnit,
      unitPriceSar: service.defaultUnitPriceSar,
      estimatedLineTotalSar: totalItemCount * service.defaultUnitPriceSar,
    };
  });
};

const buildHotelSnapshot = (hotel: HotelProfile): OrderPartySnapshot => ({
  id: hotel.id,
  displayName: hotel.displayName,
  city: hotel.address.city,
});

const buildProviderSnapshot = (provider: ProviderProfile): OrderPartySnapshot => ({
  id: provider.id,
  displayName: provider.displayName,
  city: provider.address.city,
});

const buildPendingAssignmentHistory = (
  assignment: Assignment,
  changedAt: string,
  reasonAr: string,
): AssignmentHistory => ({
  id: `assignment-history-${assignment.id}-${AssignmentStatus.PendingAcceptance}`,
  assignmentId: assignment.id,
  orderId: assignment.orderId,
  providerId: assignment.providerId,
  attemptNumber: assignment.attemptNumber,
  toStatus: AssignmentStatus.PendingAcceptance,
  changedAt,
  actorRole: "system",
  reasonAr,
});

const providerExecutionStatusNotesAr: Record<
  | OrderStatus.PickupScheduled
  | OrderStatus.PickedUp
  | OrderStatus.InProcessing
  | OrderStatus.QualityCheck
  | OrderStatus.OutForDelivery
  | OrderStatus.Delivered,
  string
> = {
  [OrderStatus.PickupScheduled]: "تمت جدولة استلام الطلب من جهة المزوّد.",
  [OrderStatus.PickedUp]: "تم استلام الطلب فعليًا من الفندق.",
  [OrderStatus.InProcessing]: "بدأت مرحلة المعالجة التشغيلية للطلب.",
  [OrderStatus.QualityCheck]: "دخل الطلب مرحلة فحص الجودة.",
  [OrderStatus.OutForDelivery]: "خرج الطلب للتسليم إلى الفندق.",
  [OrderStatus.Delivered]: "تم تسليم الطلب إلى الفندق وبانتظار تأكيد الاكتمال.",
};

const buildOrderStatusHistoryJsonInput = (
  order: LaundryOrder,
  toStatus: OrderStatus,
  changedAt: string,
  actorRole: "hotel" | "provider" | "admin" | "system",
  notesAr?: string,
) =>
  toJsonInput(
    appendOrderStatusHistory({
      order,
      toStatus,
      changedAt,
      actorRole,
      notesAr,
    }),
  );

const createAssignmentFromProviderMatch = ({
  order,
  providerId,
  attemptNumber,
  assignedAt,
  responseDueAt,
  scoreBreakdown,
  eligibilityResult,
}: {
  order: LaundryOrder;
  providerId: string;
  attemptNumber: number;
  assignedAt: string;
  responseDueAt: string;
  scoreBreakdown: MatchingLog["scoreBreakdown"];
  eligibilityResult: MatchingLog["eligibilityResult"];
}): Assignment => ({
  id: `assignment-${order.id}-${attemptNumber}`,
  orderId: order.id,
  hotelId: order.hotelId,
  providerId,
  attemptNumber,
  status: AssignmentStatus.PendingAcceptance,
  assignedAt,
  responseDueAt,
  scoreBreakdown,
  eligibilityResult,
});

const getAttemptedProviderIds = (order: LaundryOrder) => {
  const attemptedProviderIds = new Set<string>();

  order.assignmentHistory.forEach((history) => {
    attemptedProviderIds.add(history.providerId);
  });

  order.reassignmentEvents.forEach((event) => {
    if (event.previousProviderId) {
      attemptedProviderIds.add(event.previousProviderId);
    }

    if (event.nextProviderId) {
      attemptedProviderIds.add(event.nextProviderId);
    }
  });

  if (order.activeAssignment?.providerId) {
    attemptedProviderIds.add(order.activeAssignment.providerId);
  }

  if (order.providerId) {
    attemptedProviderIds.add(order.providerId);
  }

  return attemptedProviderIds;
};

const getNextAssignmentAttemptNumber = (order: LaundryOrder) => {
  const attemptNumbers = order.assignmentHistory.map((history) => history.attemptNumber);

  if (order.activeAssignment) {
    attemptNumbers.push(order.activeAssignment.attemptNumber);
  }

  return (attemptNumbers.length > 0 ? Math.max(...attemptNumbers) : 0) + 1;
};

const getRankedCandidateLogs = (order: LaundryOrder, attemptedProviderIds: Set<string>) => {
  const providerLogMap = new Map<string, MatchingLog>();

  order.matchingLogs
    .filter(
      (log) =>
        (log.decision === MatchingDecision.Selected || log.decision === MatchingDecision.Shortlisted) &&
        !attemptedProviderIds.has(log.providerId),
    )
    .sort((left, right) => {
      if (right.scoreBreakdown.totalScore !== left.scoreBreakdown.totalScore) {
        return right.scoreBreakdown.totalScore - left.scoreBreakdown.totalScore;
      }

      return left.evaluatedAt.localeCompare(right.evaluatedAt);
    })
    .forEach((log) => {
      if (!providerLogMap.has(log.providerId)) {
        providerLogMap.set(log.providerId, log);
      }
    });

  return Array.from(providerLogMap.values());
};

const buildReassignmentMatchingLog = ({
  order,
  providerId,
  matchingRunId,
  decision,
  eligibilityResult,
  scoreBreakdown,
  evaluatedAt,
  notesAr,
}: {
  order: LaundryOrder;
  providerId: string;
  matchingRunId: string;
  decision: MatchingDecision;
  eligibilityResult: MatchingLog["eligibilityResult"];
  scoreBreakdown: MatchingLog["scoreBreakdown"];
  evaluatedAt: string;
  notesAr: string;
}): MatchingLog => ({
  id: `log-${matchingRunId}-${providerId}`,
  matchingRunId,
  orderId: order.id,
  providerId,
  decision,
  eligibilityResult,
  scoreBreakdown,
  evaluatedAt,
  notesAr,
});

const resolveReassignmentCopy = (
  reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
) => {
  if (reason === ReassignmentReason.ProviderExpired) {
    return {
      historyReasonAr: "انتهت مهلة رد المزوّد دون استجابة.",
      eventNotesAr: "تمت إعادة الإسناد بعد انتهاء مهلة الرد للمزوّد السابق.",
      nextAssignmentReasonAr: "تمت إعادة الإسناد تلقائياً إلى المزوّد التالي بعد انتهاء المهلة.",
      unresolvedNotesAr: "انتهت مهلة الرد ولم يتوفر بديل مؤهل حالياً.",
    };
  }

  return {
    historyReasonAr: "تم رفض الإسناد من المزوّد.",
    eventNotesAr: "تمت إعادة الإسناد بعد رفض المزوّد للطلب.",
    nextAssignmentReasonAr: "تمت إعادة الإسناد تلقائياً إلى المزوّد التالي بعد الرفض.",
    unresolvedNotesAr: "تم رفض الطلب من المزوّد ولم يتوفر بديل مؤهل حالياً.",
  };
};

const selectNextOrderNumber = (orderIds: string[]) => {
  const maxOrderNumber = orderIds.reduce((currentMax, orderId) => {
    const match = /(\d+)$/.exec(orderId);

    if (!match) {
      return currentMax;
    }

    return Math.max(currentMax, Number(match[1]));
  }, 1044);

  return maxOrderNumber + 1;
};

const applyCapacityMutation = (
  capacity: Pick<
    ProviderProfile["currentCapacity"],
    "providerId" | "date" | "totalKg" | "committedKg" | "reservedKg" | "createdAt"
  >,
  mode: "reserve" | "commit" | "release",
  quantityKg: number,
  timestamp: string,
) => {
  let committedKg = capacity.committedKg;
  let reservedKg = capacity.reservedKg;

  if (mode === "reserve") {
    reservedKg += quantityKg;
  } else if (mode === "commit") {
    reservedKg = Math.max(reservedKg - quantityKg, 0);
    committedKg += quantityKg;
  } else {
    reservedKg = Math.max(reservedKg - quantityKg, 0);
  }

  const availableKg = Math.max(capacity.totalKg - committedKg - reservedKg, 0);

  return {
    providerId: capacity.providerId,
    date: capacity.date,
    totalKg: capacity.totalKg,
    committedKg,
    reservedKg,
    availableKg,
    utilizationRatio: capacity.totalKg > 0 ? (committedKg + reservedKg) / capacity.totalKg : 0,
    status: getCapacityStatus(availableKg, capacity.totalKg),
    createdAt: capacity.createdAt,
    updatedAt: timestamp,
  };
};

const applyReliabilityPenalty = (
  performance: Pick<
    ProviderProfile["performance"],
    "providerId" | "rating" | "acceptanceRate" | "onTimePickupRate" | "onTimeDeliveryRate" | "qualityScore" | "disputeRate" | "reassignmentRate" | "completedOrders" | "cancelledOrders"
  >,
  reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
  timestamp: string,
) => {
  const penalty = RELIABILITY_PENALTIES[reason];

  return {
    providerId: performance.providerId,
    rating: roundMetric(clamp(performance.rating - penalty.rating, 0, 5), 2),
    acceptanceRate: roundMetric(clamp(performance.acceptanceRate - penalty.acceptanceRate, 0, 1)),
    onTimePickupRate: performance.onTimePickupRate,
    onTimeDeliveryRate: performance.onTimeDeliveryRate,
    qualityScore: Math.max(performance.qualityScore - penalty.qualityScore, 0),
    disputeRate: performance.disputeRate,
    reassignmentRate: roundMetric(clamp(performance.reassignmentRate + penalty.reassignmentRate, 0, 1)),
    completedOrders: performance.completedOrders,
    cancelledOrders: performance.cancelledOrders,
    lastEvaluatedAt: timestamp,
  };
};

const updateProviderCapacityTx = async (
  tx: PrismaTx,
  providerId: string,
  quantityKg: number,
  timestamp: string,
  mode: "reserve" | "commit" | "release",
) => {
  const capacityRow = await tx.providerCapacity.findFirst({
    where: { providerId },
    orderBy: { capacityDate: "desc" },
  });

  if (!capacityRow) {
    throw new Error("تعذر العثور على سعة تشغيلية للمزوّد.");
  }

  const updated = applyCapacityMutation(
    {
      providerId,
      date: capacityRow.capacityDate,
      totalKg: toNumber(capacityRow.totalKg) ?? 0,
      committedKg: toNumber(capacityRow.committedKg) ?? 0,
      reservedKg: toNumber(capacityRow.reservedKg) ?? 0,
      createdAt: capacityRow.createdAt.toISOString(),
    },
    mode,
    quantityKg,
    timestamp,
  );

  await tx.providerCapacity.update({
    where: {
      providerId_capacityDate: {
        providerId,
        capacityDate: capacityRow.capacityDate,
      },
    },
    data: {
      committedKg: toDecimal(updated.committedKg),
      reservedKg: toDecimal(updated.reservedKg),
      availableKg: toDecimal(updated.availableKg),
      utilizationRatio: toDecimal(updated.utilizationRatio),
      status: updated.status,
      updatedAt: new Date(updated.updatedAt),
    },
  });

  await tx.provider.update({
    where: { id: providerId },
    data: {
      updatedAt: new Date(timestamp),
    },
  });
};

const applyProviderReliabilityPenaltyTx = async (
  tx: PrismaTx,
  providerId: string,
  reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
  timestamp: string,
) => {
  const performanceRow = await tx.providerPerformanceStats.findUnique({
    where: { providerId },
  });

  const nextPerformance = applyReliabilityPenalty(
    {
      providerId,
      rating: toNumber(performanceRow?.rating) ?? 0,
      acceptanceRate: toNumber(performanceRow?.acceptanceRate) ?? 0,
      onTimePickupRate: toNumber(performanceRow?.onTimePickupRate) ?? 0,
      onTimeDeliveryRate: toNumber(performanceRow?.onTimeDeliveryRate) ?? 0,
      qualityScore: toNumber(performanceRow?.qualityScore) ?? 0,
      disputeRate: toNumber(performanceRow?.disputeRate) ?? 0,
      reassignmentRate: toNumber(performanceRow?.reassignmentRate) ?? 0,
      completedOrders: performanceRow?.completedOrders ?? 0,
      cancelledOrders: performanceRow?.cancelledOrders ?? 0,
    },
    reason,
    timestamp,
  );

  await tx.providerPerformanceStats.upsert({
    where: { providerId },
    create: {
      providerId,
      rating: toDecimal(nextPerformance.rating) ?? new Prisma.Decimal(0),
      acceptanceRate: toDecimal(nextPerformance.acceptanceRate) ?? new Prisma.Decimal(0),
      onTimePickupRate: toDecimal(nextPerformance.onTimePickupRate) ?? new Prisma.Decimal(0),
      onTimeDeliveryRate: toDecimal(nextPerformance.onTimeDeliveryRate) ?? new Prisma.Decimal(0),
      qualityScore: toDecimal(nextPerformance.qualityScore) ?? new Prisma.Decimal(0),
      disputeRate: toDecimal(nextPerformance.disputeRate) ?? new Prisma.Decimal(0),
      reassignmentRate: toDecimal(nextPerformance.reassignmentRate) ?? new Prisma.Decimal(0),
      completedOrders: nextPerformance.completedOrders,
      cancelledOrders: nextPerformance.cancelledOrders,
      lastEvaluatedAt: new Date(nextPerformance.lastEvaluatedAt),
    },
    update: {
      rating: toDecimal(nextPerformance.rating),
      acceptanceRate: toDecimal(nextPerformance.acceptanceRate),
      qualityScore: toDecimal(nextPerformance.qualityScore),
      reassignmentRate: toDecimal(nextPerformance.reassignmentRate),
      lastEvaluatedAt: new Date(nextPerformance.lastEvaluatedAt),
    },
  });

  await tx.provider.update({
    where: { id: providerId },
    data: {
      updatedAt: new Date(timestamp),
    },
  });
};

const writeMatchingLogsTx = async (tx: PrismaTx, logs: MatchingLog[]) => {
  if (logs.length === 0) {
    return;
  }

  await tx.matchingLog.createMany({
    data: logs.map((log) => ({
      id: log.id,
      matchingRunId: log.matchingRunId,
      orderId: log.orderId,
      providerId: log.providerId,
      decision: log.decision,
      eligibilityResultJson: toJsonInput(log.eligibilityResult),
      scoreBreakdownJson: toJsonInput(log.scoreBreakdown),
      evaluatedAt: new Date(log.evaluatedAt),
      notesAr: log.notesAr ?? null,
    })),
  });
};

const writeOrderItemsTx = async (tx: PrismaTx, orderItems: OrderItem[], orderId: string) => {
  if (orderItems.length === 0) {
    return;
  }

  await tx.orderItem.createMany({
    data: orderItems.map((item) => ({
      id: item.id,
      orderId,
      serviceId: item.serviceId,
      serviceNameAr: item.serviceName.ar,
      serviceNameEn: item.serviceName.en ?? null,
      quantity: toDecimal(item.quantity) ?? new Prisma.Decimal(0),
      unit: item.unit,
      unitPriceSar: toDecimal(item.unitPriceSar) ?? new Prisma.Decimal(0),
      estimatedLineTotalSar: toDecimal(item.estimatedLineTotalSar) ?? new Prisma.Decimal(0),
      notesAr: item.notesAr ?? null,
    })),
  });
};

const loadHotelsTx = async (tx: PrismaTx) => {
  const hotels = await tx.hotel.findMany({
    orderBy: { code: "asc" },
  });

  return hotels.map(mapHotelRecordToDomain);
};

const loadServicesTx = async (tx: PrismaTx) => {
  const services = await tx.service.findMany({
    orderBy: { code: "asc" },
  });

  return services.map(mapServiceRecordToDomain);
};

const loadProvidersTx = async (tx: PrismaTx, providerIds?: string[]) => {
  const where = providerIds ? { id: { in: providerIds } } : undefined;
  const [providers, capabilities, capacities, performance] = await Promise.all([
    tx.provider.findMany({
      where,
      orderBy: { code: "asc" },
    }),
    tx.providerCapability.findMany({
      where: providerIds ? { providerId: { in: providerIds } } : undefined,
      orderBy: [{ providerId: "asc" }, { serviceId: "asc" }],
    }),
    tx.providerCapacity.findMany({
      where: providerIds ? { providerId: { in: providerIds } } : undefined,
      orderBy: [{ providerId: "asc" }, { capacityDate: "desc" }],
    }),
    tx.providerPerformanceStats.findMany({
      where: providerIds ? { providerId: { in: providerIds } } : undefined,
      orderBy: { providerId: "asc" },
    }),
  ]);

  return mapProviderRecordsToDomain({
    providers,
    capabilities,
    capacities,
    performance,
  });
};

const loadAccountsTx = async (tx: PrismaTx) => {
  const accounts = await tx.account.findMany({
    orderBy: { createdAt: "asc" },
  });

  return accounts.map((account) => mapAccountRecordToDomain(account));
};

const ensureUniqueAccountEmailTx = async (tx: PrismaTx, email: string, excludeAccountId?: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingAccount = await tx.account.findFirst({
    where: {
      email: normalizedEmail,
      ...(excludeAccountId ? { NOT: { id: excludeAccountId } } : {}),
    },
  });

  if (existingAccount) {
    throw new Error("يوجد حساب آخر يستخدم البريد الإلكتروني نفسه.");
  }

  return normalizedEmail;
};

const findAccountByLinkedHotelIdTx = async (tx: PrismaTx, hotelId: string) => {
  return tx.account.findFirst({
    where: {
      linkedHotelId: hotelId,
    },
  });
};

const findAccountByLinkedProviderIdTx = async (tx: PrismaTx, providerId: string) => {
  return tx.account.findFirst({
    where: {
      linkedProviderId: providerId,
    },
  });
};

const buildRegistrationAccountSummary = (account: AccountProfile) => ({
  accountId: account.id,
  fullName: account.fullName,
  email: account.email,
  role: account.role,
  roleLabelAr: accountRoleLabelsAr[account.role],
  status: account.status,
  statusLabelAr: accountStatusLabelsAr[account.status],
  activationState: account.activation.state,
  activationStateLabelAr: accountActivationStateLabelsAr[account.activation.state],
  activationPath: account.activation.activationPath,
});

const buildAccountAdminSummary = (account: AccountProfile) => ({
  ...account,
  roleLabelAr: accountRoleLabelsAr[account.role],
  statusLabelAr: accountStatusLabelsAr[account.status],
  activationStateLabelAr: accountActivationStateLabelsAr[account.activation.state],
  passwordResetStateLabelAr: passwordResetStateLabelsAr[account.passwordReset.state],
});

const loadIdentityAuditEventsTx = async (tx: PrismaTx) => {
  const events = await tx.identityAuditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return events.map((event) => {
    const domainEvent = mapIdentityAuditEventRecordToDomain(event);

    return {
      ...domainEvent,
      typeLabelAr: identityAuditEventTypeLabelsAr[domainEvent.type],
    };
  });
};

const recordIdentityAuditEventTx = async (
  tx: PrismaTx,
  {
    accountId,
    sessionId,
    type,
    actorAccountId,
    actorRole,
    linkedEntityType,
    linkedEntityId,
    detailsAr,
    metadata,
    createdAt = new Date().toISOString(),
  }: Omit<IdentityAuditEvent, "id" | "createdAt"> & { createdAt?: string },
) => {
  await tx.identityAuditEvent.create({
    data: {
      id: `audit-${type}-${Date.now()}-${Math.round(Math.random() * 10_000)}`,
      accountId: accountId ?? null,
      sessionId: sessionId ?? null,
      eventType: type,
      actorAccountId: actorAccountId ?? null,
      actorRole: actorRole ?? null,
      linkedEntityType: linkedEntityType ?? null,
      linkedEntityId: linkedEntityId ?? null,
      detailsAr: detailsAr ?? null,
      metadataJson: metadata ? toJsonInput(metadata) : Prisma.JsonNull,
      createdAt: new Date(createdAt),
    },
  });
};

const issueActivationForAccountTx = async (tx: PrismaTx, accountId: string, issuedAt: string) => {
  const activationToken = createOpaqueToken(24);
  const activationTokenHash = await hashOpaqueToken(activationToken);
  const activationPath = buildActivationPath(activationToken);

  const account = await tx.account.update({
    where: { id: accountId },
    data: {
      status: AccountStatus.PendingActivation,
      activationState: AccountActivationState.Ready,
      activationTokenHash,
      activationTokenIssuedAt: new Date(issuedAt),
      activationTokenExpiresAt: new Date(addHours(issuedAt, ACCOUNT_ACTIVATION_TOKEN_DURATION_HOURS)),
      activationTokenUsedAt: null,
      activationEligibleAt: new Date(issuedAt),
      activatedAt: null,
      updatedAt: new Date(issuedAt),
    },
  });

  await recordIdentityAuditEventTx(tx, {
    accountId: account.id,
    type: IdentityAuditEventType.ActivationIssued,
    actorRole: "admin",
    linkedEntityType: account.linkedEntityType as LinkedEntityType | undefined,
    linkedEntityId: account.linkedHotelId ?? account.linkedProviderId ?? undefined,
    detailsAr: "تم إصدار رابط تفعيل جديد للحساب بعد اعتماد الجهة.",
    createdAt: issuedAt,
  });

  return {
    ...mapAccountRecordToDomain(account),
    activation: {
      ...mapAccountRecordToDomain(account).activation,
      activationPath,
    },
  };
};

const revokeAccountSessionsTx = async (
  tx: PrismaTx,
  {
    accountId,
    reasonAr,
    revokedByAccountId,
    revokedByRole,
    revokedAt = new Date().toISOString(),
  }: {
    accountId: string;
    reasonAr: string;
    revokedByAccountId?: string;
    revokedByRole?: AccountRole | "system";
    revokedAt?: string;
  },
) => {
  const sessions = await tx.accountSession.findMany({
    where: {
      accountId,
      revokedAt: null,
    },
  });

  if (sessions.length === 0) {
    return;
  }

  await tx.accountSession.updateMany({
    where: {
      accountId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(revokedAt),
      revokedReasonAr: reasonAr,
      revokedByAccountId: revokedByAccountId ?? null,
      revokedByRole: revokedByRole ?? null,
    },
  });

  for (const session of sessions) {
    await recordIdentityAuditEventTx(tx, {
      accountId,
      sessionId: session.id,
      type: IdentityAuditEventType.SessionRevoked,
      actorAccountId: revokedByAccountId,
      actorRole: revokedByRole,
      linkedEntityType: session.linkedEntityType as LinkedEntityType | undefined,
      linkedEntityId: session.linkedEntityId ?? undefined,
      detailsAr: reasonAr,
      createdAt: revokedAt,
    });
  }
};

const issueSessionForAccountTx = async (
  tx: PrismaTx,
  account: PrismaAccountRecord,
  issuedAt: string,
): Promise<AuthenticatedAccountSession> => {
  await revokeAccountSessionsTx(tx, {
    accountId: account.id,
    reasonAr: "تم إلغاء الجلسة السابقة عند إصدار جلسة أحدث.",
    revokedByAccountId: account.id,
    revokedByRole: account.role as AccountRole,
    revokedAt: issuedAt,
  });
  const token = createOpaqueToken(32);
  const tokenHash = await hashOpaqueToken(token);
  const session = await tx.accountSession.create({
    data: {
      id: `session-${account.id}-${Date.now()}`,
      accountId: account.id,
      tokenHash,
      role: account.role,
      linkedEntityType: account.linkedEntityType,
      linkedEntityId: account.linkedHotelId ?? account.linkedProviderId ?? null,
      createdAt: new Date(issuedAt),
      expiresAt: new Date(addHours(issuedAt, ACCOUNT_SESSION_DURATION_HOURS)),
      lastSeenAt: new Date(issuedAt),
      revokedAt: null,
      revokedReasonAr: null,
      revokedByAccountId: null,
      revokedByRole: null,
    },
  });
  const nextAccount = await tx.account.update({
    where: { id: account.id },
    data: {
      lastLoginAt: new Date(issuedAt),
      updatedAt: new Date(issuedAt),
    },
  });

  await recordIdentityAuditEventTx(tx, {
    accountId: nextAccount.id,
    sessionId: session.id,
    type: IdentityAuditEventType.LoginSucceeded,
    actorAccountId: nextAccount.id,
    actorRole: nextAccount.role as AccountRole,
    linkedEntityType: nextAccount.linkedEntityType as LinkedEntityType | undefined,
    linkedEntityId: nextAccount.linkedHotelId ?? nextAccount.linkedProviderId ?? undefined,
    detailsAr: "تم إنشاء جلسة دخول جديدة للحساب.",
    createdAt: issuedAt,
  });

  return {
    token,
    account: mapAccountRecordToDomain(nextAccount),
    session: mapAccountSessionRecordToDomain(session),
  };
};

const buildAccountTokenValidationResult = ({
  status,
  account,
}: {
  status: AccountTokenValidationStatus;
  account?: PrismaAccountRecord | null;
}): AccountTokenValidationResult => ({
  status,
  accountEmail: account?.email ?? undefined,
  accountFullName: account?.fullName ?? undefined,
  role: account?.role as AccountRole | undefined,
  linkedEntityType: account?.linkedEntityType as LinkedEntityType | undefined,
});

const resolveActivationTokenStatusTx = async (
  tx: PrismaTx,
  token: string,
): Promise<{ status: AccountTokenValidationStatus; account?: PrismaAccountRecord }> => {
  const activationTokenHash = await hashOpaqueToken(token);
  const account = await tx.account.findFirst({
    where: {
      activationTokenHash,
    },
  });

  if (!account) {
    return { status: AccountTokenValidationStatus.Invalid };
  }

  if (account.activationTokenUsedAt || account.activationState === AccountActivationState.Activated) {
    return { status: AccountTokenValidationStatus.Used, account };
  }

  if (account.activationTokenExpiresAt && account.activationTokenExpiresAt.getTime() <= Date.now()) {
    return { status: AccountTokenValidationStatus.Expired, account };
  }

  if (account.activationState !== AccountActivationState.Ready) {
    return { status: AccountTokenValidationStatus.Invalid, account };
  }

  return { status: AccountTokenValidationStatus.Ready, account };
};

const resolvePasswordResetTokenStatusTx = async (
  tx: PrismaTx,
  token: string,
): Promise<{ status: AccountTokenValidationStatus; account?: PrismaAccountRecord }> => {
  const passwordResetTokenHash = await hashOpaqueToken(token);
  const account = await tx.account.findFirst({
    where: {
      passwordResetTokenHash,
    },
  });

  if (!account) {
    return { status: AccountTokenValidationStatus.Invalid };
  }

  if (
    account.passwordResetTokenUsedAt ||
    account.passwordResetState === PasswordResetState.Completed
  ) {
    return { status: AccountTokenValidationStatus.Used, account };
  }

  if (
    account.passwordResetTokenExpiresAt &&
    account.passwordResetTokenExpiresAt.getTime() <= Date.now()
  ) {
    return { status: AccountTokenValidationStatus.Expired, account };
  }

  if (account.passwordResetState !== PasswordResetState.Ready) {
    return { status: AccountTokenValidationStatus.Invalid, account };
  }

  return { status: AccountTokenValidationStatus.Ready, account };
};

const ensureHotelOperationalAccessTx = async (tx: PrismaTx, hotelId: string) => {
  const hotel = (await loadHotelsTx(tx)).find((entry) => entry.id === hotelId);

  if (!hotel) {
    throw new Error("تعذر العثور على ملف الفندق.");
  }

  if (!isHotelOperationallyApproved(hotel)) {
    throw new Error(HOTEL_ACCESS_NOT_APPROVED_ERROR);
  }

  return hotel;
};

const ensureProviderOperationalAccessTx = async (tx: PrismaTx, providerId: string) => {
  const provider = (await loadProvidersTx(tx, [providerId]))[0];

  if (!provider) {
    throw new Error("تعذر العثور على ملف المزوّد.");
  }

  if (!isProviderOperationallyApproved(provider)) {
    throw new Error(PROVIDER_ACCESS_NOT_APPROVED_ERROR);
  }

  return provider;
};

const loadOrdersTx = async (
  tx: PrismaTx,
  options: {
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput | Prisma.OrderOrderByWithRelationInput[];
  } = {},
) => {
  const orderRows = await tx.order.findMany({
    where: options.where,
    orderBy: options.orderBy ?? { updatedAt: "desc" },
  });

  if (orderRows.length === 0) {
    return [];
  }

  const orderIds = orderRows.map((order) => order.id);
  const [items, assignments, assignmentHistory, matchingLogs, reassignmentEvents, slaHistory, settlements] =
    await Promise.all([
      tx.orderItem.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { id: "asc" },
      }),
      tx.assignment.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: [{ orderId: "asc" }, { attemptNumber: "asc" }],
      }),
      tx.assignmentHistory.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { changedAt: "asc" },
      }),
      tx.matchingLog.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { evaluatedAt: "asc" },
      }),
      tx.reassignmentEvent.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { createdAt: "asc" },
      }),
      tx.sLAHistory.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { recordedAt: "asc" },
      }),
      tx.settlement.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { generatedAt: "asc" },
      }),
    ]);
  const settlementIds = settlements.map((settlement) => settlement.id);
  const settlementLineItems = settlementIds.length
    ? await tx.settlementLineItem.findMany({
        where: { settlementId: { in: settlementIds } },
        orderBy: { id: "asc" },
      })
    : [];

  return mapOrdersToDomain({
    orders: orderRows,
    items,
    assignments,
    assignmentHistory,
    matchingLogs,
    reassignmentEvents,
    slaHistory,
    settlements,
    settlementLineItems,
  });
};

const loadOrderByIdTx = async (tx: PrismaTx, orderId: string) => {
  const orders = await loadOrdersTx(tx, {
    where: { id: orderId },
  });

  return orders[0];
};

const loadOrderOrThrowTx = async (tx: PrismaTx, orderId: string) => {
  const order = await loadOrderByIdTx(tx, orderId);

  if (!order) {
    throw new Error("تعذر العثور على الطلب المطلوب.");
  }

  return order;
};

const tryAutoReassignOrderTx = async (
  tx: PrismaTx,
  order: LaundryOrder,
  changedAt: string,
  reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
) => {
  const attemptedProviderIds = getAttemptedProviderIds(order);
  const rankedCandidateLogs = getRankedCandidateLogs(order, attemptedProviderIds);
  const attemptNumber = getNextAssignmentAttemptNumber(order);
  const matchingRunId = `${createMatchingRunId(order.id, changedAt)}-retry-${attemptNumber}`;
  const reassignmentLogs: MatchingLog[] = [];

  for (const candidateLog of rankedCandidateLogs) {
    const provider = (await loadProvidersTx(tx, [candidateLog.providerId]))[0];

    if (!provider) {
      continue;
    }

    const eligibilityResult = evaluateProviderEligibility(order, provider, {
      evaluatedAt: changedAt,
    });

    if (!eligibilityResult.eligible) {
      reassignmentLogs.push(
        buildReassignmentMatchingLog({
          order,
          providerId: provider.id,
          matchingRunId,
          decision: MatchingDecision.Skipped,
          eligibilityResult,
          scoreBreakdown: createEmptyScoreBreakdown(),
          evaluatedAt: changedAt,
          notesAr: `استُبعد المزوّد في محاولة إعادة الإسناد: ${eligibilityResult.blockingReasonsAr.join("، ")}`,
        }),
      );
      continue;
    }

    const responseDueAt = buildFutureDate(changedAt, AUTO_ASSIGNMENT_RESPONSE_WINDOW_MINUTES);
    const nextAssignment = createAssignmentFromProviderMatch({
      order,
      providerId: provider.id,
      attemptNumber,
      assignedAt: changedAt,
      responseDueAt,
      scoreBreakdown: candidateLog.scoreBreakdown,
      eligibilityResult,
    });
    const selectedLog = buildReassignmentMatchingLog({
      order,
      providerId: provider.id,
      matchingRunId,
      decision: MatchingDecision.Selected,
      eligibilityResult,
      scoreBreakdown: candidateLog.scoreBreakdown,
      evaluatedAt: changedAt,
      notesAr:
        reason === ReassignmentReason.ProviderExpired
          ? "تم اختيار هذا المزوّد تلقائياً بعد انتهاء مهلة المزوّد السابق."
          : "تم اختيار هذا المزوّد تلقائياً بعد رفض المزوّد السابق.",
    });

    return {
      assignment: nextAssignment,
      matchingLogs: [...reassignmentLogs, selectedLog],
      provider,
    };
  }

  return {
    assignment: undefined,
    matchingLogs: reassignmentLogs,
    provider: undefined,
  };
};

const handlePendingAssignmentFailureTx = async (
  tx: PrismaTx,
  orderId: string,
  {
    changedAt,
    reason,
    actorRole,
  }: {
    changedAt: string;
    reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired;
    actorRole: "provider" | "system";
  },
) => {
  const order = await loadOrderOrThrowTx(tx, orderId);
  const previousAssignment = order.activeAssignment;

  if (!previousAssignment || previousAssignment.status !== AssignmentStatus.PendingAcceptance) {
    return order;
  }

  const copy = resolveReassignmentCopy(reason);
  const requestedCapacityKg = getRequestedCapacityKg(order);

  await updateProviderCapacityTx(
    tx,
    previousAssignment.providerId,
    requestedCapacityKg,
    changedAt,
    "release",
  );
  await applyProviderReliabilityPenaltyTx(tx, previousAssignment.providerId, reason, changedAt);

  const finalStatus =
    reason === ReassignmentReason.ProviderExpired
      ? AssignmentStatus.Expired
      : AssignmentStatus.Rejected;
  const finalHistory = {
    id: `assignment-history-${previousAssignment.id}-${finalStatus}`,
    assignmentId: previousAssignment.id,
    orderId: order.id,
    providerId: previousAssignment.providerId,
    attemptNumber: previousAssignment.attemptNumber,
    fromStatus: AssignmentStatus.PendingAcceptance,
    toStatus: finalStatus,
    changedAt,
    actorRole,
    reasonAr: copy.historyReasonAr,
  } satisfies AssignmentHistory;
  const reassignmentEventBase = {
    id: `reassign-${order.id}-${order.reassignmentEvents.length + 1}`,
    orderId: order.id,
    previousAssignmentId: previousAssignment.id,
    previousProviderId: previousAssignment.providerId,
    reason,
    actorRole: "system" as const,
    createdAt: changedAt,
  };
  const reassignmentAttempt = await tryAutoReassignOrderTx(tx, order, changedAt, reason);

  await tx.assignment.update({
    where: { id: previousAssignment.id },
    data: {
      status: finalStatus,
      respondedAt:
        reason === ReassignmentReason.ProviderRejected ? new Date(changedAt) : undefined,
    },
  });

  await tx.assignmentHistory.create({
    data: {
      id: finalHistory.id,
      assignmentId: finalHistory.assignmentId,
      orderId: finalHistory.orderId,
      providerId: finalHistory.providerId,
      attemptNumber: finalHistory.attemptNumber,
      fromStatus: finalHistory.fromStatus ?? null,
      toStatus: finalHistory.toStatus,
      changedAt: new Date(finalHistory.changedAt),
      actorRole: finalHistory.actorRole,
      reasonAr: finalHistory.reasonAr ?? null,
    },
  });

  await writeMatchingLogsTx(tx, reassignmentAttempt.matchingLogs);

  if (reassignmentAttempt.assignment && reassignmentAttempt.provider) {
    const nextAssignment = reassignmentAttempt.assignment;
    const nextProvider = reassignmentAttempt.provider;
    const pendingHistory = buildPendingAssignmentHistory(
      nextAssignment,
      changedAt,
      copy.nextAssignmentReasonAr,
    );

    await tx.assignment.create({
      data: {
        id: nextAssignment.id,
        orderId: nextAssignment.orderId,
        hotelId: nextAssignment.hotelId,
        providerId: nextAssignment.providerId,
        attemptNumber: nextAssignment.attemptNumber,
        status: nextAssignment.status,
        assignedAt: new Date(nextAssignment.assignedAt),
        responseDueAt: nextAssignment.responseDueAt ? new Date(nextAssignment.responseDueAt) : null,
        respondedAt: null,
        acceptedAt: null,
        scoreBreakdownJson: toJsonInput(nextAssignment.scoreBreakdown),
        eligibilityResultJson: toJsonInput(nextAssignment.eligibilityResult),
      },
    });

    await tx.assignmentHistory.create({
      data: {
        id: pendingHistory.id,
        assignmentId: pendingHistory.assignmentId,
        orderId: pendingHistory.orderId,
        providerId: pendingHistory.providerId,
        attemptNumber: pendingHistory.attemptNumber,
        fromStatus: null,
        toStatus: pendingHistory.toStatus,
        changedAt: new Date(pendingHistory.changedAt),
        actorRole: pendingHistory.actorRole,
        reasonAr: pendingHistory.reasonAr ?? null,
      },
    });

    await updateProviderCapacityTx(
      tx,
      nextAssignment.providerId,
      requestedCapacityKg,
      changedAt,
      "reserve",
    );

    await tx.reassignmentEvent.create({
      data: {
        id: reassignmentEventBase.id,
        orderId: reassignmentEventBase.orderId,
        previousAssignmentId: reassignmentEventBase.previousAssignmentId ?? null,
        previousProviderId: reassignmentEventBase.previousProviderId ?? null,
        nextProviderId: nextAssignment.providerId,
        reason: reassignmentEventBase.reason,
        actorRole: reassignmentEventBase.actorRole,
        createdAt: new Date(reassignmentEventBase.createdAt),
        notesAr: copy.eventNotesAr,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.Assigned,
        providerId: nextAssignment.providerId,
        providerSnapshotJson: toJsonInput(buildProviderSnapshot(nextProvider)),
        updatedAt: new Date(changedAt),
        statusUpdatedAt: new Date(changedAt),
        progressPercent: toDecimal(8),
        activeAssignmentId: nextAssignment.id,
        slaWindowJson: toJsonInput({
          ...order.slaWindow,
          responseDueAt: nextAssignment.responseDueAt,
        }),
      },
    });

    return loadOrderOrThrowTx(tx, order.id);
  }

  await tx.reassignmentEvent.create({
    data: {
      id: reassignmentEventBase.id,
      orderId: reassignmentEventBase.orderId,
      previousAssignmentId: reassignmentEventBase.previousAssignmentId ?? null,
      previousProviderId: reassignmentEventBase.previousProviderId ?? null,
      nextProviderId: null,
      reason: reassignmentEventBase.reason,
      actorRole: reassignmentEventBase.actorRole,
      createdAt: new Date(reassignmentEventBase.createdAt),
      notesAr: copy.unresolvedNotesAr,
    },
  });

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.PendingCapacity,
      providerId: null,
      providerSnapshotJson: Prisma.JsonNull,
      updatedAt: new Date(changedAt),
      statusUpdatedAt: new Date(changedAt),
      progressPercent: null,
      activeAssignmentId: null,
      statusHistoryJson: buildOrderStatusHistoryJsonInput(
        order,
        OrderStatus.PendingCapacity,
        changedAt,
        "system",
        copy.unresolvedNotesAr,
      ),
      slaWindowJson: toJsonInput({
        ...order.slaWindow,
        responseDueAt: undefined,
      }),
    },
  });

  return loadOrderOrThrowTx(tx, order.id);
};

const processExpiredAssignmentsTx = async (tx: PrismaTx, referenceTime: string) => {
  const pendingAssignments = await tx.assignment.findMany({
    where: {
      status: AssignmentStatus.PendingAcceptance,
      responseDueAt: {
        not: null,
        lte: new Date(referenceTime),
      },
    },
    orderBy: {
      responseDueAt: "asc",
    },
  });

  const targetOrderIds = Array.from(new Set(pendingAssignments.map((assignment) => assignment.orderId)));

  for (const orderId of targetOrderIds) {
    const order = await loadOrderByIdTx(tx, orderId);

    if (
      order?.status === OrderStatus.Assigned &&
      order.activeAssignment?.status === AssignmentStatus.PendingAcceptance &&
      order.activeAssignment.responseDueAt &&
      new Date(order.activeAssignment.responseDueAt).getTime() <= new Date(referenceTime).getTime()
    ) {
      await handlePendingAssignmentFailureTx(tx, order.id, {
        changedAt: referenceTime,
        reason: ReassignmentReason.ProviderExpired,
        actorRole: "system",
      });
    }
  }
};

export const __rowLevelPrismaHelpers = {
  validateCreateHotelOrderInput,
  buildOrderItems,
  getRankedCandidateLogs,
  applyCapacityMutation,
  applyReliabilityPenalty,
  selectNextOrderNumber,
};

export const createPrismaBackedWashoffPlatformRepository = (
  options: PrismaBackedWashoffPlatformRepositoryOptions = {},
): WashoffPlatformRepository => {
  const prisma = options.prisma ?? getWashoffPrismaClient();
  const store = options.store ?? createPrismaPlatformPersistenceStore(prisma);
  const requestTimeSweepEnabled = options.requestTimeSweepEnabled ?? false;
  const runtimeStatus =
    options.runtimeStatus ??
    ({
      environment: "dev",
      persistenceMode: "db",
      databaseTargetLabel: "postgresql",
      mailMode: "outbox",
      workerEnabled: false,
      workerPollIntervalMs: 30_000,
      requestTimeSweepEnabled,
      authMode: "session-or-dev-header",
      publicAppUrl: "http://localhost:8080",
    } satisfies PlatformRuntimeStatus);
  let operationQueue = Promise.resolve<void>(undefined);

  const enqueue = async <Value>(operation: () => Promise<Value>) => {
    const nextOperation = operationQueue.then(operation, operation);
    operationQueue = nextOperation.then(
      () => undefined,
      () => undefined,
    );
    return nextOperation;
  };

  const withDatabase = async <Value>(
    operation: (tx: PrismaTx) => Promise<Value>,
    options: {
      processExpiries?: boolean;
      referenceTime?: string;
    } = {},
  ) =>
    enqueue(async () => {
      await store.ensureSeeded();

      return prisma.$transaction(async (tx) => {
        const referenceTime = options.referenceTime ?? new Date().toISOString();
        await ensurePlatformAdminSeededTx(tx);

        if (options.processExpiries ?? requestTimeSweepEnabled) {
          await processExpiredAssignmentsTx(tx, referenceTime);
        }

        return operation(tx);
      });
    });

  return {
    login: (command) =>
      withDatabase(
        async (tx) => {
          const normalizedEmail = command.email.trim().toLowerCase();
          const account = await tx.account.findUnique({
            where: { email: normalizedEmail },
          });

          if (!account) {
            await recordIdentityAuditEventTx(tx, {
              type: IdentityAuditEventType.LoginFailed,
              actorRole: "system",
              detailsAr: `فشل تسجيل الدخول للبريد ${normalizedEmail}.`,
              metadata: {
                email: normalizedEmail,
                reason: "account_not_found",
              },
            });
            throw new Error(ACCOUNT_INVALID_CREDENTIALS_ERROR);
          }

          if (account.status === AccountStatus.PendingActivation) {
            await recordIdentityAuditEventTx(tx, {
              accountId: account.id,
              type: IdentityAuditEventType.LoginFailed,
              actorRole: "system",
              linkedEntityType: account.linkedEntityType as LinkedEntityType | undefined,
              linkedEntityId: account.linkedHotelId ?? account.linkedProviderId ?? undefined,
              detailsAr: "فشل تسجيل الدخول لأن الحساب لم يُفعّل بعد.",
              metadata: {
                reason: "pending_activation",
              },
            });
            throw new Error(ACCOUNT_NOT_ACTIVATED_ERROR);
          }

          if (account.status !== AccountStatus.Active) {
            await recordIdentityAuditEventTx(tx, {
              accountId: account.id,
              type: IdentityAuditEventType.LoginFailed,
              actorRole: "system",
              linkedEntityType: account.linkedEntityType as LinkedEntityType | undefined,
              linkedEntityId: account.linkedHotelId ?? account.linkedProviderId ?? undefined,
              detailsAr: "فشل تسجيل الدخول لأن الحساب موقوف.",
              metadata: {
                reason: "suspended",
              },
            });
            throw new Error(ACCOUNT_SUSPENDED_ERROR);
          }

          const passwordValid = await verifyPasswordDigest(
            command.password,
            account.passwordSalt ?? undefined,
            account.passwordHash ?? undefined,
          );

          if (!passwordValid) {
            await recordIdentityAuditEventTx(tx, {
              accountId: account.id,
              type: IdentityAuditEventType.LoginFailed,
              actorRole: "system",
              linkedEntityType: account.linkedEntityType as LinkedEntityType | undefined,
              linkedEntityId: account.linkedHotelId ?? account.linkedProviderId ?? undefined,
              detailsAr: "فشل تسجيل الدخول بسبب كلمة مرور غير صحيحة.",
              metadata: {
                reason: "invalid_password",
              },
            });
            throw new Error(ACCOUNT_INVALID_CREDENTIALS_ERROR);
          }

          if (
            account.role === AccountRole.Hotel &&
            (!account.linkedHotelId || !(await ensureHotelOperationalAccessTx(tx, account.linkedHotelId)))
          ) {
            await recordIdentityAuditEventTx(tx, {
              accountId: account.id,
              type: IdentityAuditEventType.LoginFailed,
              actorRole: "system",
              linkedEntityType: account.linkedEntityType as LinkedEntityType | undefined,
              linkedEntityId: account.linkedHotelId ?? undefined,
              detailsAr: "فشل تسجيل الدخول لأن الفندق المرتبط بالحساب غير معتمد.",
              metadata: {
                reason: "hotel_not_approved",
              },
            });
            throw new Error(HOTEL_ACCESS_NOT_APPROVED_ERROR);
          }

          if (
            account.role === AccountRole.Provider &&
            (!account.linkedProviderId || !(await ensureProviderOperationalAccessTx(tx, account.linkedProviderId)))
          ) {
            await recordIdentityAuditEventTx(tx, {
              accountId: account.id,
              type: IdentityAuditEventType.LoginFailed,
              actorRole: "system",
              linkedEntityType: account.linkedEntityType as LinkedEntityType | undefined,
              linkedEntityId: account.linkedProviderId ?? undefined,
              detailsAr: "فشل تسجيل الدخول لأن المزوّد المرتبط بالحساب غير معتمد.",
              metadata: {
                reason: "provider_not_approved",
              },
            });
            throw new Error(PROVIDER_ACCESS_NOT_APPROVED_ERROR);
          }

          return issueSessionForAccountTx(tx, account, new Date().toISOString());
        },
        { processExpiries: false },
      ),

    validateActivationToken: (command) =>
      withDatabase(
        async (tx) =>
          buildAccountTokenValidationResult(await resolveActivationTokenStatusTx(tx, command.token)),
        { processExpiries: false },
      ),

    activateAccount: (command) =>
      withDatabase(
        async (tx) => {
          const validation = await resolveActivationTokenStatusTx(tx, command.token);
          const account = validation.account;

          if (!account || validation.status === AccountTokenValidationStatus.Invalid) {
            throw new Error(ACCOUNT_ACTIVATION_TOKEN_ERROR);
          }

          if (validation.status === AccountTokenValidationStatus.Expired) {
            throw new Error(ACCOUNT_ACTIVATION_TOKEN_ERROR);
          }

          if (validation.status === AccountTokenValidationStatus.Used) {
            throw new Error(ACCOUNT_ACTIVATION_TOKEN_USED_ERROR);
          }

          const passwordDigest = await createPasswordDigest(command.password);
          const timestamp = new Date().toISOString();
          const updatedAccount = await tx.account.update({
            where: { id: account.id },
            data: {
              fullName: command.fullName?.trim() || account.fullName,
              phone: command.phone?.trim() || account.phone,
              passwordSalt: passwordDigest.salt,
              passwordHash: passwordDigest.hash,
              status: AccountStatus.Active,
              activationState: AccountActivationState.Activated,
              activationTokenUsedAt: new Date(timestamp),
              activatedAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });

          await recordIdentityAuditEventTx(tx, {
            accountId: updatedAccount.id,
            type: IdentityAuditEventType.AccountActivated,
            actorAccountId: updatedAccount.id,
            actorRole: updatedAccount.role as AccountRole,
            linkedEntityType: updatedAccount.linkedEntityType as LinkedEntityType | undefined,
            linkedEntityId: updatedAccount.linkedHotelId ?? updatedAccount.linkedProviderId ?? undefined,
            detailsAr: "تم تفعيل الحساب بنجاح وإكمال إعداد كلمة المرور.",
            createdAt: timestamp,
          });

          return issueSessionForAccountTx(tx, updatedAccount, timestamp);
        },
        { processExpiries: false },
      ),

    requestPasswordReset: (command) =>
      withDatabase(
        async (tx) => {
          const normalizedEmail = command.email.trim().toLowerCase();
          const account = await tx.account.findUnique({
            where: { email: normalizedEmail },
          });

          if (
            !account ||
            account.activationState !== AccountActivationState.Activated ||
            account.status !== AccountStatus.Active
          ) {
            return {
              accepted: true as const,
              messageAr: PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
            };
          }

          const timestamp = new Date().toISOString();
          const token = createOpaqueToken(24);
          const tokenHash = await hashOpaqueToken(token);
          const updatedAccount = await tx.account.update({
            where: { id: account.id },
            data: {
              passwordResetState: PasswordResetState.Ready,
              passwordResetTokenHash: tokenHash,
              passwordResetRequestedAt: new Date(timestamp),
              passwordResetIssuedAt: new Date(timestamp),
              passwordResetTokenExpiresAt: new Date(
                addHours(timestamp, PASSWORD_RESET_TOKEN_DURATION_HOURS),
              ),
              passwordResetTokenUsedAt: null,
              passwordResetCompletedAt: null,
              updatedAt: new Date(timestamp),
            },
          });

          await recordIdentityAuditEventTx(tx, {
            accountId: updatedAccount.id,
            type: IdentityAuditEventType.PasswordResetRequested,
            actorAccountId: updatedAccount.id,
            actorRole: updatedAccount.role as AccountRole,
            linkedEntityType: updatedAccount.linkedEntityType as LinkedEntityType | undefined,
            linkedEntityId: updatedAccount.linkedHotelId ?? updatedAccount.linkedProviderId ?? undefined,
            detailsAr: "تم إصدار رابط إعادة ضبط كلمة المرور للحساب.",
            createdAt: timestamp,
          });

          return {
            accepted: true as const,
            messageAr: PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
            resetPath: buildResetPasswordPath(token),
            accountId: updatedAccount.id,
            accountEmail: updatedAccount.email,
            accountFullName: updatedAccount.fullName,
            role: updatedAccount.role as AccountRole,
            linkedEntityType: updatedAccount.linkedEntityType as LinkedEntityType | undefined,
            linkedEntityId: updatedAccount.linkedHotelId ?? updatedAccount.linkedProviderId ?? undefined,
          };
        },
        { processExpiries: false },
      ),

    validateResetPasswordToken: (command) =>
      withDatabase(
        async (tx) =>
          buildAccountTokenValidationResult(await resolvePasswordResetTokenStatusTx(tx, command.token)),
        { processExpiries: false },
      ),

    resetPassword: (command) =>
      withDatabase(
        async (tx) => {
          const validation = await resolvePasswordResetTokenStatusTx(tx, command.token);
          const account = validation.account;

          if (!account || validation.status === AccountTokenValidationStatus.Invalid) {
            throw new Error(PASSWORD_RESET_TOKEN_INVALID_ERROR);
          }

          if (validation.status === AccountTokenValidationStatus.Expired) {
            throw new Error(PASSWORD_RESET_TOKEN_EXPIRED_ERROR);
          }

          if (validation.status === AccountTokenValidationStatus.Used) {
            throw new Error(PASSWORD_RESET_TOKEN_USED_ERROR);
          }

          if (account.status !== AccountStatus.Active) {
            throw new Error(ACCOUNT_SUSPENDED_ERROR);
          }

          const passwordDigest = await createPasswordDigest(command.password);
          const timestamp = new Date().toISOString();

          await revokeAccountSessionsTx(tx, {
            accountId: account.id,
            reasonAr: "تم إلغاء الجلسات السابقة بعد إعادة ضبط كلمة المرور.",
            revokedByAccountId: account.id,
            revokedByRole: account.role as AccountRole,
            revokedAt: timestamp,
          });

          const updatedAccount = await tx.account.update({
            where: { id: account.id },
            data: {
              passwordSalt: passwordDigest.salt,
              passwordHash: passwordDigest.hash,
              passwordResetState: PasswordResetState.Completed,
              passwordResetTokenUsedAt: new Date(timestamp),
              passwordResetCompletedAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });

          await recordIdentityAuditEventTx(tx, {
            accountId: updatedAccount.id,
            type: IdentityAuditEventType.PasswordResetCompleted,
            actorAccountId: updatedAccount.id,
            actorRole: updatedAccount.role as AccountRole,
            linkedEntityType: updatedAccount.linkedEntityType as LinkedEntityType | undefined,
            linkedEntityId: updatedAccount.linkedHotelId ?? updatedAccount.linkedProviderId ?? undefined,
            detailsAr: "تمت إعادة ضبط كلمة المرور للحساب بنجاح.",
            createdAt: timestamp,
          });

          return issueSessionForAccountTx(tx, updatedAccount, timestamp);
        },
        { processExpiries: false },
      ),

    logout: (sessionToken?: string) =>
      withDatabase(
        async (tx) => {
          if (!sessionToken) {
            return;
          }

          const tokenHash = await hashOpaqueToken(sessionToken);
          const sessions = await tx.accountSession.findMany({
            where: {
              tokenHash,
              revokedAt: null,
            },
          });

          if (sessions.length === 0) {
            return;
          }

          const session = sessions[0];
          const timestamp = new Date().toISOString();

          await tx.accountSession.updateMany({
            where: {
              tokenHash,
              revokedAt: null,
            },
            data: {
              revokedAt: new Date(timestamp),
              revokedReasonAr: "تم تسجيل الخروج من الحساب.",
              revokedByAccountId: session.accountId,
              revokedByRole: session.role,
            },
          });

          await recordIdentityAuditEventTx(tx, {
            accountId: session.accountId,
            sessionId: session.id,
            type: IdentityAuditEventType.Logout,
            actorAccountId: session.accountId,
            actorRole: session.role as AccountRole,
            linkedEntityType: session.linkedEntityType as LinkedEntityType | undefined,
            linkedEntityId: session.linkedEntityId ?? undefined,
            detailsAr: "تم تسجيل الخروج من الجلسة الحالية.",
            createdAt: timestamp,
          });
        },
        { processExpiries: false },
      ),

    getCurrentAccountSession: async () => null,

    resolveAccountSession: (sessionToken: string) =>
      withDatabase(
        async (tx) => {
          const tokenHash = await hashOpaqueToken(sessionToken);
          const session = await tx.accountSession.findFirst({
            where: {
              tokenHash,
              revokedAt: null,
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
          });

          if (!session) {
            return null;
          }

          const account = await tx.account.findUnique({
            where: { id: session.accountId },
          });

          if (!account) {
            await revokeAccountSessionsTx(tx, {
              accountId: session.accountId,
              reasonAr: "تم إلغاء الجلسة لأن الحساب لم يعد موجودًا أو نشطًا.",
              revokedByRole: "system",
            });
            return null;
          }

          if (account.status !== AccountStatus.Active) {
            await revokeAccountSessionsTx(tx, {
              accountId: session.accountId,
              reasonAr: "تم إلغاء الجلسة لأن الحساب لم يعد نشطًا.",
              revokedByRole: "system",
            });
            return null;
          }

          if (
            account.role === AccountRole.Hotel &&
            (!account.linkedHotelId || !(await ensureHotelOperationalAccessTx(tx, account.linkedHotelId)))
          ) {
            await revokeAccountSessionsTx(tx, {
              accountId: session.accountId,
              reasonAr: "تم إلغاء الجلسة لأن الفندق المرتبط بالحساب ليس معتمدًا حاليًا.",
              revokedByRole: "system",
            });
            return null;
          }

          if (
            account.role === AccountRole.Provider &&
            (!account.linkedProviderId ||
              !(await ensureProviderOperationalAccessTx(tx, account.linkedProviderId)))
          ) {
            await revokeAccountSessionsTx(tx, {
              accountId: session.accountId,
              reasonAr: "تم إلغاء الجلسة لأن المزوّد المرتبط بالحساب ليس معتمدًا حاليًا.",
              revokedByRole: "system",
            });
            return null;
          }

          const refreshedSession = await tx.accountSession.update({
            where: { id: session.id },
            data: {
              lastSeenAt: new Date(),
            },
          });

          return {
            account: mapAccountRecordToDomain(account),
            session: mapAccountSessionRecordToDomain(refreshedSession),
          };
        },
        { processExpiries: false },
      ),

    listAccounts: () =>
      withDatabase(
        async (tx) => (await loadAccountsTx(tx)).map((account) => buildAccountAdminSummary(account)),
        { processExpiries: false },
      ),

    listIdentityAuditEvents: () =>
      withDatabase((tx) => loadIdentityAuditEventsTx(tx), { processExpiries: false }),

    getPlatformSettings: () =>
      withDatabase(
        async (tx) => {
          await ensurePlatformAdminSeededTx(tx);
          const settings = await tx.platformSettings.findFirst({
            orderBy: { updatedAt: "desc" },
          });

          if (!settings) {
            return { ...defaultPlatformSettings };
          }

          return mapPlatformSettingsRecordToDomain(settings);
        },
        { processExpiries: false },
      ),

    updatePlatformSettings: (command: PlatformSettingsUpdateCommand) =>
      withDatabase(
        async (tx) => {
          await ensurePlatformAdminSeededTx(tx);
          const currentSettings = await tx.platformSettings.findFirst({
            orderBy: { updatedAt: "desc" },
          });

          if (!currentSettings) {
            throw new Error("تعذر العثور على إعدادات المنصة الحالية.");
          }

          const timestamp = new Date().toISOString();
          const updatedSettings = await tx.platformSettings.update({
            where: { id: currentSettings.id },
            data: {
              siteNameAr: command.siteNameAr,
              siteNameEn: command.siteNameEn,
              siteTaglineAr: command.siteTaglineAr,
              siteTaglineEn: command.siteTaglineEn,
              mailFromNameAr: command.mailFromNameAr,
              mailFromEmail: command.mailFromEmail,
              supportEmail: command.supportEmail ?? null,
              supportPhone: command.supportPhone ?? null,
              registrationEnabled: command.registrationEnabled,
              hotelRegistrationEnabled: command.hotelRegistrationEnabled,
              providerRegistrationEnabled: command.providerRegistrationEnabled,
              requireAdminApprovalForHotels: command.requireAdminApprovalForHotels,
              requireAdminApprovalForProviders: command.requireAdminApprovalForProviders,
              updatedAt: new Date(timestamp),
              updatedByAccountId: command.updatedByAccountId ?? null,
            },
          });

          await tx.platformSettingsAudit.create({
            data: {
              id: `platform-settings-audit-${timestamp}`,
              settingsKey: "platform_settings",
              oldValueJson: toJsonInput(mapPlatformSettingsRecordToDomain(currentSettings)),
              newValueJson: toJsonInput(mapPlatformSettingsRecordToDomain(updatedSettings)),
              changedByAccountId: command.updatedByAccountId ?? null,
              changedByRole: command.updatedByAccountId ? "admin" : "system",
              changedAt: new Date(timestamp),
              notesAr: command.notesAr ?? null,
            },
          });

          return mapPlatformSettingsRecordToDomain(updatedSettings);
        },
        { processExpiries: false },
      ),

    listPlatformSettingsAudit: () =>
      withDatabase(
        async (tx) => {
          await ensurePlatformAdminSeededTx(tx);
          const auditEntries = await tx.platformSettingsAudit.findMany({
            orderBy: { changedAt: "desc" },
          });
          return auditEntries.map((entry) => mapPlatformSettingsAuditRecordToDomain(entry));
        },
        { processExpiries: false },
      ),

    getPlatformRuntimeStatus: () =>
      withDatabase(async () => ({ ...runtimeStatus }), { processExpiries: false }),

    listPlatformContentEntries: (pageKey?: string) =>
      withDatabase(
        async (tx) => {
          await ensurePlatformAdminSeededTx(tx);
          const entries = await tx.platformContentEntry.findMany({
            where: pageKey ? { pageKey } : undefined,
            orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }],
          });
          return entries.map((entry) => mapPlatformContentEntryRecordToDomain(entry));
        },
        { processExpiries: false },
      ),

    updatePlatformContentEntry: (command: PlatformContentEntryUpdateCommand) =>
      withDatabase(
        async (tx) => {
          await ensurePlatformAdminSeededTx(tx);
          const currentEntry = await tx.platformContentEntry.findUnique({
            where: { id: command.id },
          });

          if (!currentEntry) {
            throw new Error("تعذر العثور على النص المطلوب لتحديثه.");
          }

          const timestamp = new Date().toISOString();
          const updatedEntry = await tx.platformContentEntry.update({
            where: { id: command.id },
            data: {
              valueAr: command.valueAr,
              valueEn: command.valueEn,
              active: command.active,
              updatedAt: new Date(timestamp),
              updatedByAccountId: command.updatedByAccountId ?? null,
            },
          });

          await tx.platformContentAudit.create({
            data: {
              id: `platform-content-audit-${command.id}-${timestamp}`,
              contentEntryId: currentEntry.id,
              pageKey: currentEntry.pageKey,
              sectionKey: currentEntry.sectionKey,
              contentKey: currentEntry.contentKey,
              oldValueAr: currentEntry.valueAr,
              oldValueEn: currentEntry.valueEn,
              newValueAr: updatedEntry.valueAr,
              newValueEn: updatedEntry.valueEn,
              changedByAccountId: command.updatedByAccountId ?? null,
              changedByRole: command.updatedByAccountId ? "admin" : "system",
              changedAt: new Date(timestamp),
              notesAr: command.notesAr ?? null,
            },
          });

          return mapPlatformContentEntryRecordToDomain(updatedEntry);
        },
        { processExpiries: false },
      ),

    listPlatformContentAudit: (pageKey?: string) =>
      withDatabase(
        async (tx) => {
          await ensurePlatformAdminSeededTx(tx);
          const auditEntries = await tx.platformContentAudit.findMany({
            where: pageKey ? { pageKey } : undefined,
            orderBy: { changedAt: "desc" },
          });
          return auditEntries.map((entry) => mapPlatformContentAuditRecordToDomain(entry));
        },
        { processExpiries: false },
      ),

    getPlatformPageContent: (pageKey: string, language: PlatformLanguage) =>
      withDatabase(
        async (tx) => {
          await ensurePlatformAdminSeededTx(tx);
          const entries = await tx.platformContentEntry.findMany({
            where: { pageKey },
            orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }],
          });
          return resolvePlatformPageContent({
            entries: entries.map((entry) => mapPlatformContentEntryRecordToDomain(entry)),
            pageKey,
            language,
          });
        },
        { processExpiries: false },
      ),

    resendActivationEmail: (accountId) =>
      withDatabase(
        async (tx) => {
          const account = await tx.account.findUnique({
            where: { id: accountId },
          });

          if (!account) {
            throw new Error("تعذر العثور على الحساب المطلوب.");
          }

          if (account.activationState === AccountActivationState.Activated) {
            throw new Error("تم تفعيل هذا الحساب مسبقًا، ولا يحتاج إلى رابط تفعيل جديد.");
          }

          if (account.status === AccountStatus.Suspended) {
            throw new Error("لا يمكن إعادة إرسال التفعيل إلى حساب موقوف. أعد تنشيطه أولًا.");
          }

          const activationAccount = await issueActivationForAccountTx(
            tx,
            accountId,
            new Date().toISOString(),
          );

          return buildRegistrationAccountSummary(activationAccount);
        },
        { processExpiries: false },
      ),

    suspendAccount: (accountId, reasonAr) =>
      withDatabase(
        async (tx) => {
          const account = await tx.account.findUnique({
            where: { id: accountId },
          });

          if (!account) {
            throw new Error("تعذر العثور على الحساب المطلوب.");
          }

          const timestamp = new Date().toISOString();
          const suspensionReason = reasonAr?.trim() || "تم إيقاف الحساب من قبل الإدارة.";

          await revokeAccountSessionsTx(tx, {
            accountId,
            reasonAr: "تم إلغاء الجلسات بسبب إيقاف الحساب.",
            revokedByAccountId: DEFAULT_ADMIN_ACCOUNT_ID,
            revokedByRole: AccountRole.Admin,
            revokedAt: timestamp,
          });

          const updatedAccount = await tx.account.update({
            where: { id: accountId },
            data: {
              status: AccountStatus.Suspended,
              suspendedAt: new Date(timestamp),
              suspendedByAccountId: DEFAULT_ADMIN_ACCOUNT_ID,
              suspendedByRole: AccountRole.Admin,
              suspensionReasonAr: suspensionReason,
              updatedAt: new Date(timestamp),
            },
          });

          await recordIdentityAuditEventTx(tx, {
            accountId,
            type: IdentityAuditEventType.AccountSuspended,
            actorAccountId: DEFAULT_ADMIN_ACCOUNT_ID,
            actorRole: AccountRole.Admin,
            linkedEntityType: updatedAccount.linkedEntityType as LinkedEntityType | undefined,
            linkedEntityId: updatedAccount.linkedHotelId ?? updatedAccount.linkedProviderId ?? undefined,
            detailsAr: suspensionReason,
            createdAt: timestamp,
          });

          return buildAccountAdminSummary(mapAccountRecordToDomain(updatedAccount));
        },
        { processExpiries: false },
      ),

    reactivateAccount: (accountId, reasonAr) =>
      withDatabase(
        async (tx) => {
          const account = await tx.account.findUnique({
            where: { id: accountId },
          });

          if (!account) {
            throw new Error("تعذر العثور على الحساب المطلوب.");
          }

          const timestamp = new Date().toISOString();
          const nextStatus =
            account.activationState === AccountActivationState.Activated
              ? AccountStatus.Active
              : AccountStatus.PendingActivation;

          const updatedAccount = await tx.account.update({
            where: { id: accountId },
            data: {
              status: nextStatus,
              reactivatedAt: new Date(timestamp),
              reactivatedByAccountId: DEFAULT_ADMIN_ACCOUNT_ID,
              reactivatedByRole: AccountRole.Admin,
              reactivationReasonAr: reasonAr?.trim() || "تمت إعادة تنشيط الحساب من قبل الإدارة.",
              updatedAt: new Date(timestamp),
            },
          });

          await recordIdentityAuditEventTx(tx, {
            accountId,
            type: IdentityAuditEventType.AccountReactivated,
            actorAccountId: DEFAULT_ADMIN_ACCOUNT_ID,
            actorRole: AccountRole.Admin,
            linkedEntityType: updatedAccount.linkedEntityType as LinkedEntityType | undefined,
            linkedEntityId: updatedAccount.linkedHotelId ?? updatedAccount.linkedProviderId ?? undefined,
            detailsAr: updatedAccount.reactivationReasonAr ?? "تمت إعادة تنشيط الحساب من قبل الإدارة.",
            createdAt: timestamp,
          });

          return buildAccountAdminSummary(mapAccountRecordToDomain(updatedAccount));
        },
        { processExpiries: false },
      ),

    registerHotel: (input) =>
      withDatabase(
        async (tx) => {
          const validatedInput = validateHotelRegistrationInput(input);
          const normalizedEmail = await ensureUniqueAccountEmailTx(tx, validatedInput.contactEmail);
          const existingHotels = await tx.hotel.findMany({
            select: { id: true },
          });
          const timestamp = new Date().toISOString();
          const nextNumber = selectNextEntityNumber(existingHotels.map((hotel) => hotel.id), "hotel");
          const hotelId = `hotel-${nextNumber}`;
          const accountId = `account-hotel-${nextNumber}`;
          const environment = options.environment ?? runtimeStatus.environment;
          const commercialRegistrationFile = await storeHotelRegistrationDocument({
            hotelId,
            kind: "commercial_registration",
            file: validatedInput.commercialRegistrationFile,
            uploadedAt: timestamp,
            environment,
          });
          const delegationLetterFile = validatedInput.delegationLetterFile
            ? await storeHotelRegistrationDocument({
                hotelId,
                kind: "delegation_letter",
                file: validatedInput.delegationLetterFile,
                uploadedAt: timestamp,
                environment,
              })
            : undefined;
          await tx.hotel.create({
            data: {
              id: hotelId,
              code: `HTL-REG-${String(nextNumber).padStart(3, "0")}`,
              displayNameAr: validatedInput.hotelName,
              displayNameEn: null,
              legalEntityName: validatedInput.legalEntityName ?? null,
              hotelClassification: validatedInput.hotelClassification,
              roomCount: Math.round(validatedInput.roomCount),
              countryCode: "SA",
              city: validatedInput.city,
              district: null,
              line1: validatedInput.addressText,
              postalCode: null,
              latitude: validatedInput.latitude,
              longitude: validatedInput.longitude,
              timezone: "Asia/Riyadh",
              contactName: validatedInput.contactPersonName,
              contactEmail: normalizedEmail,
              contactPhone: validatedInput.contactPhone,
              serviceLevel: validatedInput.serviceLevel,
              operatingHours: validatedInput.operatingHours,
              requiresDailyPickup: validatedInput.requiresDailyPickup,
              addressText: validatedInput.addressText,
              pickupLocation: validatedInput.pickupLocation ?? null,
              hasLoadingArea: validatedInput.hasLoadingArea,
              accessNotes: validatedInput.accessNotes ?? null,
              taxRegistrationNumber: validatedInput.taxRegistrationNumber,
              commercialRegistrationNumber: validatedInput.commercialRegistrationNumber,
              commercialRegistrationFileJson: toJsonInput(commercialRegistrationFile),
              delegationLetterFileJson: delegationLetterFile
                ? toJsonInput(delegationLetterFile)
                : Prisma.JsonNull,
              delegationStatus: delegationLetterFile ? "pending_review" : "not_provided",
              contractedServiceIdsJson: toJsonInput([]),
              active: false,
              notesAr: validatedInput.notesAr ?? null,
              onboardingStatus: OnboardingStatus.PendingApproval,
              submittedAt: new Date(timestamp),
              reviewedAt: null,
              reviewedByRole: null,
              reviewedById: null,
              reviewNotesAr: null,
              createdAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });
          await tx.account.create({
            data: {
              id: accountId,
              fullName: validatedInput.contactPersonName,
              email: normalizedEmail,
              phone: validatedInput.contactPhone,
              passwordSalt: null,
              passwordHash: null,
              role: AccountRole.Hotel,
              status: AccountStatus.PendingActivation,
              linkedEntityType: LinkedEntityType.Hotel,
              linkedHotelId: hotelId,
              linkedProviderId: null,
              activationState: AccountActivationState.AwaitingApproval,
              activationTokenHash: null,
              activationTokenIssuedAt: null,
              activationTokenExpiresAt: null,
              activationTokenUsedAt: null,
              activationEligibleAt: null,
              activatedAt: null,
              passwordResetState: PasswordResetState.Idle,
              passwordResetTokenHash: null,
              passwordResetRequestedAt: null,
              passwordResetIssuedAt: null,
              passwordResetTokenExpiresAt: null,
              passwordResetTokenUsedAt: null,
              passwordResetCompletedAt: null,
              suspendedAt: null,
              suspendedByAccountId: null,
              suspendedByRole: null,
              suspensionReasonAr: null,
              reactivatedAt: null,
              reactivatedByAccountId: null,
              reactivatedByRole: null,
              reactivationReasonAr: null,
              lastLoginAt: null,
              createdAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });
          await recordIdentityAuditEventTx(tx, {
            accountId,
            type: IdentityAuditEventType.AccountCreated,
            actorRole: "system",
            linkedEntityType: LinkedEntityType.Hotel,
            linkedEntityId: hotelId,
            detailsAr: "تم إنشاء حساب فندق جديد بانتظار الاعتماد والتفعيل.",
            createdAt: timestamp,
          });
          const persistedHotel = await tx.hotel.findUnique({
            where: { id: hotelId },
          });
          const persistedAccount = await tx.account.findUnique({
            where: { id: accountId },
          });
          if (!persistedHotel || !persistedAccount) {
            throw new Error("تعذر إنشاء الفندق أو الحساب المرتبط به.");
          }
          return {
            hotel: mapHotelRecordToDomain(persistedHotel),
            account: buildRegistrationAccountSummary(mapAccountRecordToDomain(persistedAccount)),
          };
        },
        { processExpiries: false },
      ),
    getHotelProfile: (hotelId = DEFAULT_HOTEL_ID) =>
      withDatabase(async (tx) => {
        const hotel = await tx.hotel.findUnique({
          where: { id: hotelId },
        });

        if (!hotel) {
          throw new Error("تعذر العثور على ملف الفندق.");
        }

        return mapHotelRecordToDomain(hotel);
      }),

    listHotels: () =>
      withDatabase(async (tx) => {
        const hotels = await loadHotelsTx(tx);
        return hotels.filter(isHotelOperationallyApproved);
      }),

    listHotelRegistrations: () => withDatabase((tx) => loadHotelsTx(tx), { processExpiries: false }),

    approveHotelRegistration: (hotelId, reviewNotesAr) =>
      withDatabase(
        async (tx) => {
          const timestamp = new Date().toISOString();
          await tx.hotel.update({
            where: { id: hotelId },
            data: {
              active: true,
              onboardingStatus: OnboardingStatus.Approved,
              reviewedAt: new Date(timestamp),
              reviewedByRole: "admin",
              reviewedById: "admin-console",
              reviewNotesAr: reviewNotesAr?.trim() || null,
              updatedAt: new Date(timestamp),
            },
          });
          const linkedAccount = await findAccountByLinkedHotelIdTx(tx, hotelId);
          const activationAccount = linkedAccount
            ? await issueActivationForAccountTx(tx, linkedAccount.id, timestamp)
            : undefined;
          const hotel = await tx.hotel.findUnique({
            where: { id: hotelId },
          });
          const persistedAccount = linkedAccount
            ? mapAccountRecordToDomain(
                (await tx.account.findUnique({
                  where: { id: linkedAccount.id },
                })) ?? linkedAccount,
              )
            : undefined;
          const accountWithActivationPath =
            activationAccount && persistedAccount
              ? {
                  ...persistedAccount,
                  activation: {
                    ...persistedAccount.activation,
                    activationPath: activationAccount.activation.activationPath,
                  },
                }
              : persistedAccount;
          if (!hotel || !accountWithActivationPath) {
            throw new Error("تعذر اعتماد الفندق أو إعداد الحساب المرتبط به.");
          }
          return {
            hotel: mapHotelRecordToDomain(hotel),
            account: buildRegistrationAccountSummary(accountWithActivationPath),
          };
        },
        { processExpiries: false },
      ),
    rejectHotelRegistration: (hotelId, reviewNotesAr) =>
      withDatabase(
        async (tx) => {
          const timestamp = new Date().toISOString();
          await tx.hotel.update({
            where: { id: hotelId },
            data: {
              active: false,
              onboardingStatus: OnboardingStatus.Rejected,
              reviewedAt: new Date(timestamp),
              reviewedByRole: "admin",
              reviewedById: "admin-console",
              reviewNotesAr: reviewNotesAr?.trim() || null,
              updatedAt: new Date(timestamp),
            },
          });
          const linkedAccount = await findAccountByLinkedHotelIdTx(tx, hotelId);
          if (linkedAccount) {
            await revokeAccountSessionsTx(tx, {
              accountId: linkedAccount.id,
              reasonAr: "تم إلغاء الجلسات لأن طلب اعتماد الفندق رُفض.",
              revokedByRole: AccountRole.Admin,
              revokedAt: timestamp,
            });
            await tx.account.update({
              where: { id: linkedAccount.id },
              data: {
                status: AccountStatus.PendingActivation,
                activationState: AccountActivationState.AwaitingApproval,
                activationTokenHash: null,
                activationTokenIssuedAt: null,
                activationTokenExpiresAt: null,
                activationTokenUsedAt: null,
                activationEligibleAt: null,
                activatedAt: null,
                passwordResetState: PasswordResetState.Idle,
                passwordResetTokenHash: null,
                passwordResetRequestedAt: null,
                passwordResetIssuedAt: null,
                passwordResetTokenExpiresAt: null,
                passwordResetTokenUsedAt: null,
                passwordResetCompletedAt: null,
                updatedAt: new Date(timestamp),
              },
            });
          }
          const hotel = await tx.hotel.findUnique({
            where: { id: hotelId },
          });
          const persistedAccount = linkedAccount
            ? mapAccountRecordToDomain(
                (await tx.account.findUnique({
                  where: { id: linkedAccount.id },
                })) ?? linkedAccount,
              )
            : undefined;
          if (!hotel || !persistedAccount) {
            throw new Error("تعذر رفض الفندق أو تحديث الحساب المرتبط به.");
          }
          return {
            hotel: mapHotelRecordToDomain(hotel),
            account: buildRegistrationAccountSummary(persistedAccount),
          };
        },
        { processExpiries: false },
      ),
    getProviderProfile: (providerId = DEFAULT_PROVIDER_ID) =>
      withDatabase(async (tx) => {
        const provider = (await loadProvidersTx(tx, [providerId]))[0];

        if (!provider) {
          throw new Error("تعذر العثور على ملف المزوّد.");
        }

        return provider;
      }),

    registerProvider: (input) =>
      withDatabase(
        async (tx) => {
          const services = await loadServicesTx(tx);
          const validatedInput = validateProviderRegistrationInput(input, services);
          const normalizedEmail = await ensureUniqueAccountEmailTx(tx, validatedInput.contactEmail);
          const existingProviders = await tx.provider.findMany({
            select: { id: true },
          });
          const timestamp = new Date().toISOString();
          const nextNumber = selectNextEntityNumber(
            existingProviders.map((provider) => provider.id),
            "provider",
          );
          const providerId = `provider-${nextNumber}`;
          const accountId = `account-provider-${nextNumber}`;
          await tx.provider.create({
            data: {
              id: providerId,
              code: `PRV-REG-${String(nextNumber).padStart(3, "0")}`,
              legalNameAr: validatedInput.providerName,
              legalNameEn: null,
              displayNameAr: validatedInput.providerName,
              displayNameEn: null,
              countryCode: "SA",
              city: validatedInput.city,
              district: null,
              line1: null,
              postalCode: null,
              latitude: null,
              longitude: null,
              timezone: "Asia/Riyadh",
              contactName: validatedInput.contactPersonName,
              contactEmail: normalizedEmail,
              contactPhone: validatedInput.contactPhone,
              serviceAreaCitiesJson: toJsonInput([validatedInput.city]),
              active: false,
              notesAr: validatedInput.notesAr ?? null,
              onboardingStatus: OnboardingStatus.PendingApproval,
              submittedAt: new Date(timestamp),
              reviewedAt: null,
              reviewedByRole: null,
              reviewedById: null,
              reviewNotesAr: validatedInput.notesAr ?? null,
              createdAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });
          await tx.account.create({
            data: {
              id: accountId,
              fullName: validatedInput.contactPersonName,
              email: normalizedEmail,
              phone: validatedInput.contactPhone,
              passwordSalt: null,
              passwordHash: null,
              role: AccountRole.Provider,
              status: AccountStatus.PendingActivation,
              linkedEntityType: LinkedEntityType.Provider,
              linkedHotelId: null,
              linkedProviderId: providerId,
              activationState: AccountActivationState.AwaitingApproval,
              activationTokenHash: null,
              activationTokenIssuedAt: null,
              activationTokenExpiresAt: null,
              activationTokenUsedAt: null,
              activationEligibleAt: null,
              activatedAt: null,
              passwordResetState: PasswordResetState.Idle,
              passwordResetTokenHash: null,
              passwordResetRequestedAt: null,
              passwordResetIssuedAt: null,
              passwordResetTokenExpiresAt: null,
              passwordResetTokenUsedAt: null,
              passwordResetCompletedAt: null,
              suspendedAt: null,
              suspendedByAccountId: null,
              suspendedByRole: null,
              suspensionReasonAr: null,
              reactivatedAt: null,
              reactivatedByAccountId: null,
              reactivatedByRole: null,
              reactivationReasonAr: null,
              lastLoginAt: null,
              createdAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });
          await recordIdentityAuditEventTx(tx, {
            accountId,
            type: IdentityAuditEventType.AccountCreated,
            actorRole: "system",
            linkedEntityType: LinkedEntityType.Provider,
            linkedEntityId: providerId,
            detailsAr: "تم إنشاء حساب مزوّد جديد بانتظار الاعتماد والتفعيل.",
            createdAt: timestamp,
          });
          const capabilities = buildProviderCapabilitiesForRegistration(
            validatedInput.supportedServiceIds,
            validatedInput.city,
            validatedInput.dailyCapacityKg,
            services,
          );
          await tx.providerCapability.createMany({
            data: capabilities.map((capability) => ({
              providerId,
              serviceId: capability.serviceId,
              serviceNameAr: capability.serviceName.ar,
              serviceNameEn: capability.serviceName.en ?? null,
              active: capability.active,
              unitPriceSar: toDecimal(capability.unitPriceSar) ?? new Prisma.Decimal(0),
              maxDailyKg: toDecimal(capability.maxDailyKg) ?? new Prisma.Decimal(0),
              maxSingleOrderKg: toDecimal(capability.maxSingleOrderKg) ?? new Prisma.Decimal(0),
              rushSupported: capability.rushSupported,
              supportedCityCodesJson: toJsonInput(capability.supportedCityCodes),
              defaultTurnaroundHours: capability.defaultTurnaroundHours,
              minimumPickupLeadHours: capability.minimumPickupLeadHours,
              pickupWindowStartHour: capability.pickupWindow.startHour,
              pickupWindowEndHour: capability.pickupWindow.endHour,
            })),
          });
          await tx.providerCapacity.create({
            data: {
              providerId,
              capacityDate: timestamp.slice(0, 10),
              totalKg: toDecimal(validatedInput.dailyCapacityKg) ?? new Prisma.Decimal(0),
              committedKg: new Prisma.Decimal(0),
              reservedKg: new Prisma.Decimal(0),
              availableKg: toDecimal(validatedInput.dailyCapacityKg) ?? new Prisma.Decimal(0),
              utilizationRatio: new Prisma.Decimal(0),
              status: ProviderCapacityStatus.Available,
              cutoffAt: null,
              createdAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });
          await tx.providerPerformanceStats.create({
            data: {
              providerId,
              rating: new Prisma.Decimal(4.2),
              acceptanceRate: new Prisma.Decimal(0.9),
              onTimePickupRate: new Prisma.Decimal(0.9),
              onTimeDeliveryRate: new Prisma.Decimal(0.9),
              qualityScore: new Prisma.Decimal(75),
              disputeRate: new Prisma.Decimal(0.01),
              reassignmentRate: new Prisma.Decimal(0),
              completedOrders: 0,
              cancelledOrders: 0,
              lastEvaluatedAt: new Date(timestamp),
            },
          });
          const persistedProvider = (await loadProvidersTx(tx, [providerId]))[0];
          const persistedAccount = await tx.account.findUnique({
            where: { id: accountId },
          });
          if (!persistedProvider || !persistedAccount) {
            throw new Error("تعذر إنشاء المزود أو الحساب المرتبط به.");
          }
          return {
            provider: persistedProvider,
            account: buildRegistrationAccountSummary(mapAccountRecordToDomain(persistedAccount)),
          };
        },
        { processExpiries: false },
      ),
    listProviders: () => withDatabase((tx) => loadProvidersTx(tx)),

    listProviderRegistrations: () =>
      withDatabase((tx) => loadProvidersTx(tx), { processExpiries: false }),

    approveProviderRegistration: (providerId, reviewNotesAr) =>
      withDatabase(
        async (tx) => {
          const timestamp = new Date().toISOString();
          await tx.provider.update({
            where: { id: providerId },
            data: {
              active: true,
              onboardingStatus: OnboardingStatus.Approved,
              reviewedAt: new Date(timestamp),
              reviewedByRole: "admin",
              reviewedById: "admin-console",
              reviewNotesAr: reviewNotesAr?.trim() || null,
              updatedAt: new Date(timestamp),
            },
          });
          const linkedAccount = await findAccountByLinkedProviderIdTx(tx, providerId);
          const activationAccount = linkedAccount
            ? await issueActivationForAccountTx(tx, linkedAccount.id, timestamp)
            : undefined;
          const provider = (await loadProvidersTx(tx, [providerId]))[0];
          const persistedAccount = linkedAccount
            ? mapAccountRecordToDomain(
                (await tx.account.findUnique({
                  where: { id: linkedAccount.id },
                })) ?? linkedAccount,
              )
            : undefined;
          const accountWithActivationPath =
            activationAccount && persistedAccount
              ? {
                  ...persistedAccount,
                  activation: {
                    ...persistedAccount.activation,
                    activationPath: activationAccount.activation.activationPath,
                  },
                }
              : persistedAccount;
          if (!provider || !accountWithActivationPath) {
            throw new Error("تعذر اعتماد المزود أو إعداد الحساب المرتبط به.");
          }
          return {
            provider,
            account: buildRegistrationAccountSummary(accountWithActivationPath),
          };
        },
        { processExpiries: false },
      ),
    rejectProviderRegistration: (providerId, reviewNotesAr) =>
      withDatabase(
        async (tx) => {
          const timestamp = new Date().toISOString();
          await tx.provider.update({
            where: { id: providerId },
            data: {
              active: false,
              onboardingStatus: OnboardingStatus.Rejected,
              reviewedAt: new Date(timestamp),
              reviewedByRole: "admin",
              reviewedById: "admin-console",
              reviewNotesAr: reviewNotesAr?.trim() || null,
              updatedAt: new Date(timestamp),
            },
          });
          const linkedAccount = await findAccountByLinkedProviderIdTx(tx, providerId);
          if (linkedAccount) {
            await revokeAccountSessionsTx(tx, {
              accountId: linkedAccount.id,
              reasonAr: "تم إلغاء الجلسات لأن طلب اعتماد المزوّد رُفض.",
              revokedByRole: AccountRole.Admin,
              revokedAt: timestamp,
            });
            await tx.account.update({
              where: { id: linkedAccount.id },
              data: {
                status: AccountStatus.PendingActivation,
                activationState: AccountActivationState.AwaitingApproval,
                activationTokenHash: null,
                activationTokenIssuedAt: null,
                activationTokenExpiresAt: null,
                activationTokenUsedAt: null,
                activationEligibleAt: null,
                activatedAt: null,
                passwordResetState: PasswordResetState.Idle,
                passwordResetTokenHash: null,
                passwordResetRequestedAt: null,
                passwordResetIssuedAt: null,
                passwordResetTokenExpiresAt: null,
                passwordResetTokenUsedAt: null,
                passwordResetCompletedAt: null,
                updatedAt: new Date(timestamp),
              },
            });
          }
          const provider = (await loadProvidersTx(tx, [providerId]))[0];
          const persistedAccount = linkedAccount
            ? mapAccountRecordToDomain(
                (await tx.account.findUnique({
                  where: { id: linkedAccount.id },
                })) ?? linkedAccount,
              )
            : undefined;
          if (!provider || !persistedAccount) {
            throw new Error("تعذر رفض المزود أو تحديث الحساب المرتبط به.");
          }
          return {
            provider,
            account: buildRegistrationAccountSummary(persistedAccount),
          };
        },
        { processExpiries: false },
      ),
    listServiceCatalog: () => withDatabase((tx) => loadServicesTx(tx), { processExpiries: false }),

    listAllOrders: () =>
      withDatabase((tx) =>
        loadOrdersTx(tx, {
          orderBy: { updatedAt: "desc" },
        }),
      ),

    listHotelOrders: (hotelId = DEFAULT_HOTEL_ID) =>
      withDatabase(async (tx) => {
        await ensureHotelOperationalAccessTx(tx, hotelId);

        return loadOrdersTx(tx, {
          where: { hotelId },
          orderBy: { createdAt: "desc" },
        });
      }),

    listProviderIncomingOrders: (providerId = DEFAULT_PROVIDER_ID) =>
      withDatabase(async (tx) => {
        await ensureProviderOperationalAccessTx(tx, providerId);

        return loadOrdersTx(tx, {
          where: {
            providerId,
            status: OrderStatus.Assigned,
          },
          orderBy: { createdAt: "desc" },
        });
      }),

    listProviderActiveOrders: (providerId = DEFAULT_PROVIDER_ID) =>
      withDatabase(async (tx) => {
        await ensureProviderOperationalAccessTx(tx, providerId);

        return loadOrdersTx(tx, {
          where: {
            providerId,
            status: {
              in: Array.from(PROVIDER_ACTIVE_ORDER_STATUSES),
            },
          },
          orderBy: { updatedAt: "desc" },
        });
      }),

    createHotelOrder: (input) =>
      withDatabase(async (tx) => {
        const hotelId = input.hotelId ?? DEFAULT_HOTEL_ID;
        await ensureHotelOperationalAccessTx(tx, hotelId);
        const [hotels, services, providers, existingOrders] = await Promise.all([
          loadHotelsTx(tx),
          loadServicesTx(tx),
          loadProvidersTx(tx).then((entries) => entries.filter(isProviderOperationallyApproved)),
          tx.order.findMany({
            select: { id: true },
          }),
        ]);
        const hotel = hotels.find((entry) => entry.id === hotelId);

        if (!hotel) {
          throw new Error("تعذر العثور على ملف الفندق المرتبط بالحساب الحالي.");
        }

        const validatedInput = validateCreateHotelOrderInput(input, services);
        const orderNumber = selectNextOrderNumber(existingOrders.map((order) => order.id));
        const orderId = `ORD-${orderNumber}`;
        const serviceMap = new Map(services.map((service) => [service.id, service]));
        const items = buildOrderItems({
          orderId,
          serviceIds: validatedInput.serviceIds,
          totalItemCount: validatedInput.itemCount,
          serviceMap,
        });
        const estimatedSubtotalSar = items.reduce(
          (sum, item) => sum + item.estimatedLineTotalSar,
          0,
        );
        const timestamp = new Date().toISOString();
        const submittedOrder: LaundryOrder = {
          id: orderId,
          hotelId: hotel.id,
          hotelSnapshot: buildHotelSnapshot(hotel),
          assignmentMode: OrderAssignmentMode.Auto,
          status: OrderStatus.Submitted,
          priority: validatedInput.priority,
          items,
          totalItemCount: validatedInput.itemCount,
          currency: "SAR",
          estimatedSubtotalSar,
          pickupAt: validatedInput.pickupAt,
          createdAt: timestamp,
          updatedAt: timestamp,
          statusUpdatedAt: timestamp,
          notesAr: validatedInput.notesAr,
          assignmentHistory: [],
          statusHistory: [
            createOrderStatusHistoryEntry({
              orderId,
              toStatus: OrderStatus.Submitted,
              changedAt: timestamp,
              actorRole: "hotel",
              notesAr: "تم إنشاء الطلب من لوحة الفندق.",
            }),
          ],
          matchingLogs: [],
          slaWindow: {
            pickupTargetAt: validatedInput.pickupAt,
          },
          slaHistory: [],
          reassignmentEvents: [],
        };
        const autoMatchingOrder: LaundryOrder = {
          ...submittedOrder,
          status: OrderStatus.AutoMatching,
          statusHistory: appendOrderStatusHistory({
            order: submittedOrder,
            toStatus: OrderStatus.AutoMatching,
            changedAt: timestamp,
            actorRole: "system",
            notesAr: "بدأت مطابقة المزوّدين المؤهلين تلقائياً.",
          }),
        };
        const matchingResult = matchProvidersForOrder(autoMatchingOrder, providers, {
          evaluatedAt: timestamp,
        });
        const rankedLogOrder = new Map(
          matchingResult.rankedProviders.map((providerMatch, index) => [
            providerMatch.provider.id,
            index,
          ]),
        );
        const matchingLogs = matchingResult.logs.slice().sort((left, right) => {
          const leftRank = rankedLogOrder.get(left.providerId);
          const rightRank = rankedLogOrder.get(right.providerId);

          if (leftRank !== undefined && rightRank !== undefined) {
            return leftRank - rightRank;
          }

          if (leftRank !== undefined) {
            return -1;
          }

          if (rightRank !== undefined) {
            return 1;
          }

          return left.providerId.localeCompare(right.providerId);
        });

        await tx.order.create({
          data: {
            id: orderId,
            hotelId: hotel.id,
            providerId: null,
            hotelSnapshotJson: toJsonInput(submittedOrder.hotelSnapshot),
            providerSnapshotJson: Prisma.JsonNull,
            statusHistoryJson: toJsonInput(submittedOrder.statusHistory ?? []),
            assignmentMode: OrderAssignmentMode.Auto,
            status: OrderStatus.Submitted,
            priority: validatedInput.priority,
            currency: "SAR",
            estimatedSubtotalSar: toDecimal(estimatedSubtotalSar) ?? new Prisma.Decimal(0),
            totalItemCount: toDecimal(validatedInput.itemCount) ?? new Prisma.Decimal(0),
            pickupAt: new Date(validatedInput.pickupAt),
            notesAr: validatedInput.notesAr ?? null,
            statusUpdatedAt: new Date(timestamp),
            progressPercent: null,
            activeAssignmentId: null,
            slaWindowJson: toJsonInput(submittedOrder.slaWindow),
            createdAt: new Date(timestamp),
            updatedAt: new Date(timestamp),
          },
        });

        await writeOrderItemsTx(tx, items, orderId);

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.AutoMatching,
            updatedAt: new Date(matchingResult.evaluatedAt),
            statusUpdatedAt: new Date(matchingResult.evaluatedAt),
            statusHistoryJson: buildOrderStatusHistoryJsonInput(
              submittedOrder,
              OrderStatus.AutoMatching,
              matchingResult.evaluatedAt,
              "system",
              "بدأت مطابقة المزوّدين المؤهلين تلقائياً.",
            ),
          },
        });

        await writeMatchingLogsTx(tx, matchingLogs);

        if (matchingResult.bestProvider) {
          const bestProvider = matchingResult.bestProvider.provider;
          const responseDueAt = buildFutureDate(
            matchingResult.evaluatedAt,
            AUTO_ASSIGNMENT_RESPONSE_WINDOW_MINUTES,
          );
          const activeAssignment: Assignment = {
            id: `assignment-${orderId}-1`,
            orderId,
            hotelId: hotel.id,
            providerId: bestProvider.id,
            attemptNumber: 1,
            status: AssignmentStatus.PendingAcceptance,
            assignedAt: matchingResult.evaluatedAt,
            responseDueAt,
            scoreBreakdown: matchingResult.bestProvider.scoreBreakdown,
            eligibilityResult: matchingResult.bestProvider.eligibilityResult,
          };
          const assignmentHistory = buildPendingAssignmentHistory(
            activeAssignment,
            matchingResult.evaluatedAt,
            "تم إسناد الطلب تلقائياً إلى أفضل مزود مؤهل.",
          );

          await tx.assignment.create({
            data: {
              id: activeAssignment.id,
              orderId,
              hotelId: hotel.id,
              providerId: bestProvider.id,
              attemptNumber: 1,
              status: AssignmentStatus.PendingAcceptance,
              assignedAt: new Date(activeAssignment.assignedAt),
              responseDueAt: activeAssignment.responseDueAt
                ? new Date(activeAssignment.responseDueAt)
                : null,
              respondedAt: null,
              acceptedAt: null,
              scoreBreakdownJson: toJsonInput(activeAssignment.scoreBreakdown),
              eligibilityResultJson: toJsonInput(activeAssignment.eligibilityResult),
            },
          });

          await tx.assignmentHistory.create({
            data: {
              id: assignmentHistory.id,
              assignmentId: assignmentHistory.assignmentId,
              orderId,
              providerId: bestProvider.id,
              attemptNumber: assignmentHistory.attemptNumber,
              fromStatus: null,
              toStatus: assignmentHistory.toStatus,
              changedAt: new Date(assignmentHistory.changedAt),
              actorRole: assignmentHistory.actorRole,
              reasonAr: assignmentHistory.reasonAr ?? null,
            },
          });

          await updateProviderCapacityTx(
            tx,
            bestProvider.id,
            getRequestedCapacityKg(submittedOrder),
            matchingResult.evaluatedAt,
            "reserve",
          );

          await tx.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.Assigned,
              providerId: bestProvider.id,
              providerSnapshotJson: toJsonInput(buildProviderSnapshot(bestProvider)),
              updatedAt: new Date(matchingResult.evaluatedAt),
              statusUpdatedAt: new Date(matchingResult.evaluatedAt),
              progressPercent: toDecimal(getOrderProgressPercent(OrderStatus.Assigned)),
              activeAssignmentId: activeAssignment.id,
              statusHistoryJson: buildOrderStatusHistoryJsonInput(
                autoMatchingOrder,
                OrderStatus.Assigned,
                matchingResult.evaluatedAt,
                "system",
                "تم إسناد الطلب تلقائياً إلى مزوّد مؤهل.",
              ),
              slaWindowJson: toJsonInput({
                ...submittedOrder.slaWindow,
                responseDueAt,
              }),
            },
          });
        } else {
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.PendingCapacity,
              updatedAt: new Date(matchingResult.evaluatedAt),
              statusUpdatedAt: new Date(matchingResult.evaluatedAt),
              statusHistoryJson: buildOrderStatusHistoryJsonInput(
                autoMatchingOrder,
                OrderStatus.PendingCapacity,
                matchingResult.evaluatedAt,
                "system",
                "تعذر إيجاد مزوّد مؤهل حاليًا، وتم تحويل الطلب إلى قائمة انتظار السعة.",
              ),
            },
          });
        }

        return loadOrderOrThrowTx(tx, orderId);
      }),

    acceptIncomingOrder: (orderId, providerId = DEFAULT_PROVIDER_ID) =>
      withDatabase(async (tx) => {
        await ensureProviderOperationalAccessTx(tx, providerId);
        const order = await loadOrderOrThrowTx(tx, orderId);

        if (
          order.status !== OrderStatus.Assigned ||
          !order.activeAssignment ||
          order.activeAssignment.status !== AssignmentStatus.PendingAcceptance ||
          order.providerId !== providerId ||
          order.activeAssignment.providerId !== providerId
        ) {
          throw new Error("لم يعد هذا الطلب متاحاً للقبول من هذا المزوّد.");
        }

        const timestamp = new Date().toISOString();
        const reservedQuantityKg = getRequestedCapacityKg(order);

        await tx.assignment.update({
          where: { id: order.activeAssignment.id },
          data: {
            status: AssignmentStatus.Accepted,
            respondedAt: new Date(timestamp),
            acceptedAt: new Date(timestamp),
          },
        });

        await updateProviderCapacityTx(
          tx,
          order.activeAssignment.providerId,
          reservedQuantityKg,
          timestamp,
          "commit",
        );

        await tx.assignmentHistory.create({
          data: {
            id: `assignment-history-${order.activeAssignment.id}-accepted`,
            assignmentId: order.activeAssignment.id,
            orderId: order.id,
            providerId: order.activeAssignment.providerId,
            attemptNumber: order.activeAssignment.attemptNumber,
            fromStatus: AssignmentStatus.PendingAcceptance,
            toStatus: AssignmentStatus.Accepted,
            changedAt: new Date(timestamp),
            actorRole: "provider",
            reasonAr: "تم قبول الطلب من لوحة المزوّد",
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.Accepted,
            updatedAt: new Date(timestamp),
            statusUpdatedAt: new Date(timestamp),
            progressPercent: toDecimal(getOrderProgressPercent(OrderStatus.Accepted)),
            statusHistoryJson: buildOrderStatusHistoryJsonInput(
              order,
              OrderStatus.Accepted,
              timestamp,
              "provider",
              "تم قبول الطلب من لوحة المزوّد.",
            ),
          },
        });

        return loadOrderOrThrowTx(tx, order.id);
      }),

    advanceProviderOrderExecution: ({ orderId, nextStatus, providerId = DEFAULT_PROVIDER_ID, notesAr }) =>
      withDatabase(async (tx) => {
        await ensureProviderOperationalAccessTx(tx, providerId);
        const order = await loadOrderOrThrowTx(tx, orderId);

        if (!providerExecutableOrderStatuses.has(nextStatus)) {
          throw new Error("المرحلة المطلوبة غير متاحة كتحديث تشغيلي من لوحة المزوّد.");
        }

        if (
          !order.activeAssignment ||
          order.activeAssignment.status !== AssignmentStatus.Accepted ||
          order.providerId !== providerId ||
          order.activeAssignment.providerId !== providerId
        ) {
          throw new Error("لا يمكن لهذا المزوّد تحديث هذا الطلب تشغيليًا.");
        }

        if (!canTransitionOrderStatus(order.status, nextStatus)) {
          throw new Error("انتقال الحالة المطلوب غير صالح لهذا الطلب.");
        }

        const timestamp = new Date().toISOString();

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: nextStatus,
            updatedAt: new Date(timestamp),
            statusUpdatedAt: new Date(timestamp),
            progressPercent: toDecimal(getOrderProgressPercent(nextStatus)),
            statusHistoryJson: buildOrderStatusHistoryJsonInput(
              order,
              nextStatus,
              timestamp,
              "provider",
              notesAr?.trim() || providerExecutionStatusNotesAr[nextStatus],
            ),
          },
        });

        return loadOrderOrThrowTx(tx, order.id);
      }),

    confirmHotelOrderCompletion: ({ orderId, hotelId = DEFAULT_HOTEL_ID, notesAr }) =>
      withDatabase(async (tx) => {
        await ensureHotelOperationalAccessTx(tx, hotelId);
        const order = await loadOrderOrThrowTx(tx, orderId);

        if (order.hotelId !== hotelId) {
          throw new Error("لا يمكن لهذا الفندق تأكيد اكتمال طلب لا يخصه.");
        }

        if (order.status !== OrderStatus.Delivered || !canTransitionOrderStatus(order.status, OrderStatus.Completed)) {
          throw new Error("لا يمكن تأكيد اكتمال الطلب قبل وصوله إلى مرحلة تم التسليم.");
        }

        const timestamp = new Date().toISOString();

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.Completed,
            updatedAt: new Date(timestamp),
            statusUpdatedAt: new Date(timestamp),
            progressPercent: toDecimal(getOrderProgressPercent(OrderStatus.Completed)),
            statusHistoryJson: buildOrderStatusHistoryJsonInput(
              order,
              OrderStatus.Completed,
              timestamp,
              "hotel",
              notesAr?.trim() || "تم تأكيد اكتمال الطلب من جهة الفندق.",
            ),
          },
        });

        if (order.providerId) {
          await tx.providerPerformanceStats.updateMany({
            where: { providerId: order.providerId },
            data: {
              completedOrders: {
                increment: 1,
              },
              lastEvaluatedAt: new Date(timestamp),
            },
          });

          await tx.provider.update({
            where: { id: order.providerId },
            data: {
              updatedAt: new Date(timestamp),
            },
          });
        }

        return loadOrderOrThrowTx(tx, order.id);
      }),

    rejectIncomingOrder: (orderId, providerId = DEFAULT_PROVIDER_ID) =>
      withDatabase(async (tx) => {
        await ensureProviderOperationalAccessTx(tx, providerId);
        const order = await loadOrderOrThrowTx(tx, orderId);

        if (
          order.status !== OrderStatus.Assigned ||
          !order.activeAssignment ||
          order.activeAssignment.status !== AssignmentStatus.PendingAcceptance ||
          order.providerId !== providerId ||
          order.activeAssignment.providerId !== providerId
        ) {
          throw new Error("لم يعد هذا الطلب متاحاً للرفض من هذا المزوّد.");
        }

        return handlePendingAssignmentFailureTx(tx, order.id, {
          changedAt: new Date().toISOString(),
          reason: ReassignmentReason.ProviderRejected,
          actorRole: "provider",
        });
      }),

    expirePendingAssignment: (orderId, referenceTime = new Date().toISOString()) =>
      withDatabase(
        async (tx) => {
          const order = await loadOrderOrThrowTx(tx, orderId);

          if (
            order.status !== OrderStatus.Assigned ||
            !order.activeAssignment ||
            order.activeAssignment.status !== AssignmentStatus.PendingAcceptance ||
            !order.activeAssignment.responseDueAt ||
            new Date(order.activeAssignment.responseDueAt).getTime() >
              new Date(referenceTime).getTime()
          ) {
            return order;
          }

          return handlePendingAssignmentFailureTx(tx, order.id, {
            changedAt: referenceTime,
            reason: ReassignmentReason.ProviderExpired,
            actorRole: "system",
          });
        },
        {
          referenceTime,
        },
      ),

    autoReassignOrder: (
      orderId,
      reason,
      referenceTime = new Date().toISOString(),
    ) =>
      withDatabase(
        async (tx) => {
          const order = await loadOrderOrThrowTx(tx, orderId);

          if (
            order.status !== OrderStatus.Assigned ||
            !order.activeAssignment ||
            order.activeAssignment.status !== AssignmentStatus.PendingAcceptance
          ) {
            return order;
          }

          return handlePendingAssignmentFailureTx(tx, order.id, {
            changedAt: referenceTime,
            reason,
            actorRole: "system",
          });
        },
        {
          referenceTime,
        },
      ),

    runAssignmentExpirySweep: (referenceTime = new Date().toISOString()) =>
      withDatabase(
        (tx) =>
          loadOrdersTx(tx, {
            orderBy: { updatedAt: "desc" },
          }),
        {
          referenceTime,
        },
      ),

    recordIdentityAuditEvent: (event) =>
      withDatabase(
        async (tx) => {
          await recordIdentityAuditEventTx(tx, event);
        },
        { processExpiries: false },
      ),
  };
};
