import { Prisma } from "@prisma/client";
import type {
  Account as PrismaAccountRecord,
  AccountSession as PrismaAccountSessionRecord,
  Assignment as PrismaAssignmentRecord,
  AssignmentHistory as PrismaAssignmentHistoryRecord,
  Hotel as PrismaHotelRecord,
  HotelInvoice as PrismaHotelInvoiceRecord,
  HotelInvoiceOrderLine as PrismaHotelInvoiceOrderLineRecord,
  IdentityAuditEvent as PrismaIdentityAuditEventRecord,
  MatchingLog as PrismaMatchingLogRecord,
  Order as PrismaOrderRecord,
  OrderItem as PrismaOrderItemRecord,
  PlatformProduct as PrismaPlatformProductRecord,
  PrismaClient,
  Provider as PrismaProviderRecord,
  ProviderCapability as PrismaProviderCapabilityRecord,
  ProviderCapacity as PrismaProviderCapacityRecord,
  ProviderPerformanceStats as PrismaProviderPerformanceStatsRecord,
  ProviderStatement as PrismaProviderStatementRecord,
  ProviderStatementOrderLine as PrismaProviderStatementOrderLineRecord,
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
} from "../../src/features/auth/model/index.ts";
import {
  buildAllDefaultPlatformContentEntries,
  resolvePlatformPageContent,
  type PlatformContentAuditEntry,
  type PlatformContentEntry,
  type PlatformContentEntryUpdateCommand,
  type PlatformLanguage,
  type PlatformPageContent,
} from "../../src/features/content/model/platform-content.ts";
import {
  createOpaqueToken,
  createPasswordDigest,
  hashOpaqueToken,
  verifyPasswordDigest,
} from "../../src/features/auth/lib/credentials.ts";
import type { WashoffPlatformRepository } from "../../src/features/orders/application/ports/washoff-platform-repository.ts";
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
  PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  PROVIDER_REGISTRATION_SAUDI_CITIES_AR,
  type ProviderProfile,
  type ProviderRegistrationInput,
  type ProviderRegistrationDocumentUploadInput,
  type ProviderRegistrationStoredDocumentReference,
  type ProviderServiceOffering,
  type ProviderWorkingDay,
  type PlatformProduct,
  type PlatformServiceMatrixRow,
  type PlatformServiceType,
  PlatformServiceCurrentStatus,
  ProviderServiceProposalStatus,
  providerWorkingDayLabelsAr,
  providerExecutableOrderStatuses,
  ReassignmentReason,
  type Assignment,
  type AssignmentHistory,
  type MatchingLog,
  type ScoreBreakdown,
  ServiceBillingUnit,
  ServiceCategory,
  ServicePricingUnit,
  type ServiceCatalogItem,
  SettlementStatus,
  type Settlement,
  type SettlementLineItem,
  SLACheckpoint,
  SLAStatus,
  type SLAHistory,
  buildDefaultPlatformServiceCatalog,
  buildServiceCatalogItemDescription,
  buildServiceCatalogItemName,
  buildHotelFacingServiceCatalog,
  buildProviderDocumentDownloadPath,
  buildProviderCapabilitiesFromApprovedOfferings,
  buildPlatformCatalogMatrixLabel,
  buildProviderStatementId,
  buildProviderStatementNumber,
  buildHotelInvoiceId,
  buildHotelInvoiceNumber,
  buildDailyFinanceDateKey,
  buildFinancialBreakdown,
  buildOrderFinancialSnapshot,
  appendHotelInvoiceLine,
  appendProviderStatementLine,
  getDefaultRushSupportForServiceType,
  getDefaultTurnaroundHoursForServiceType,
  hotelInvoiceStatusLabelsAr,
  mapServiceTypeToCategory,
  providerStatementStatusLabelsAr,
  PlatformServiceTypeCode,
  type AdminFinanceSummary,
  type FinancialDocumentPartySnapshot,
  type HotelInvoice,
  HotelInvoiceStatus,
  type OrderFinancialLineSnapshot,
  type OrderFinancialSnapshot,
  type ProviderSettlementStatement,
  ProviderStatementStatus,
  roundFinanceAmount,
} from "../../src/features/orders/model/index.ts";
import {
  createMatchingRunId,
  evaluateProviderEligibility,
  matchProvidersForOrder,
} from "../../src/features/orders/services/index.ts";
import {
  defaultPlatformSettings,
  type PlatformRuntimeStatus,
  type PlatformSettings,
  type PlatformSettingsAuditEntry,
  type PlatformSettingsUpdateCommand,
} from "../../src/features/platform-settings/model/platform-settings.ts";
import { getWashoffPrismaClient } from "./prisma-client.ts";
import {
  createPrismaPlatformPersistenceStore,
  type PrismaPlatformPersistenceStore,
} from "./prisma-persistence-store.ts";
import {
  assertHotelRegistrationDocumentsTotalSize,
  validateHotelRegistrationDocumentUpload,
} from "./hotel-registration-documents.ts";
import { validateProviderRegistrationDocumentUpload } from "./provider-registration-documents.ts";
import type { WashoffEnvironment } from "./environment.ts";
import {
  createDatabaseWashoffObjectStorage,
  createFilesystemWashoffObjectStorage,
  type WashoffObjectStorage,
  type WashoffObjectStorageMode,
} from "./object-storage.ts";
import {
  generateHotelInvoicePdf,
  generateProviderStatementPdf,
} from "./financial-documents-pdf.ts";

type PrismaTx = Prisma.TransactionClient;

export interface PrismaBackedWashoffPlatformRepositoryOptions {
  prisma?: PrismaClient;
  store?: PrismaPlatformPersistenceStore;
  requestTimeSweepEnabled?: boolean;
  runtimeStatus?: PlatformRuntimeStatus;
  environment?: WashoffEnvironment;
  storageMode?: WashoffObjectStorageMode;
  storageRootPath?: string;
  signingSecret?: string;
  storageSignedUrlTtlSeconds?: number;
  publicAppUrl?: string;
  pdfFontPath?: string;
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

const DEFAULT_PLATFORM_SERVICE_CATALOG = buildDefaultPlatformServiceCatalog();

const buildProviderOfferingId = (providerId: string, serviceId: string) =>
  `offering-${providerId}-${serviceId}`;

const isPlatformMatrixServiceRecord = (service: PrismaServiceRecord) =>
  Boolean(service.productId && service.serviceType && service.pricingUnit);

const isApprovedProviderCapabilityRecord = (capability: PrismaProviderCapabilityRecord) =>
  capability.active &&
  capability.currentStatus === PlatformServiceCurrentStatus.Active &&
  capability.availableMatrix &&
  capability.activeMatrix;

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
    sellerLegalNameAr: string;
    sellerVatNumber: string;
    sellerAddressAr: string;
    sellerCityAr: string;
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
  sellerLegalNameAr: record.sellerLegalNameAr,
  sellerVatNumber: record.sellerVatNumber,
  sellerAddressAr: record.sellerAddressAr,
  sellerCityAr: record.sellerCityAr,
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
        sellerLegalNameAr: defaultPlatformSettings.sellerLegalNameAr,
        sellerVatNumber: defaultPlatformSettings.sellerVatNumber,
        sellerAddressAr: defaultPlatformSettings.sellerAddressAr,
        sellerCityAr: defaultPlatformSettings.sellerCityAr,
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

const ensurePlatformServiceCatalogSeededTx = async (tx: PrismaTx) => {
  const timestamp = new Date().toISOString();

  for (const product of DEFAULT_PLATFORM_SERVICE_CATALOG.products) {
    await tx.platformProduct.upsert({
      where: { id: product.id },
      update: {
        code: product.code,
        nameAr: product.name.ar,
        nameEn: product.name.en ?? null,
        active: product.active,
        sortOrder: product.sortOrder,
        updatedAt: new Date(timestamp),
      },
      create: {
        id: product.id,
        code: product.code,
        nameAr: product.name.ar,
        nameEn: product.name.en ?? null,
        active: product.active,
        sortOrder: product.sortOrder,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
      },
    });
  }

  const productById = new Map(
    DEFAULT_PLATFORM_SERVICE_CATALOG.products.map((product) => [product.id, product]),
  );
  const serviceTypeById = new Map(
    DEFAULT_PLATFORM_SERVICE_CATALOG.serviceTypes.map((serviceType) => [serviceType.id, serviceType]),
  );

  for (const row of DEFAULT_PLATFORM_SERVICE_CATALOG.matrixRows) {
    const product = productById.get(row.productId);
    const serviceType = serviceTypeById.get(row.serviceTypeId);

    if (!product || !serviceType) {
      continue;
    }

    const localizedName = buildServiceCatalogItemName(product.name.ar, serviceType.code);
    const localizedDescription = buildServiceCatalogItemDescription(product.name.ar, serviceType.code);

    await tx.service.upsert({
      where: { id: row.id },
      update: {
        code: row.code,
        nameAr: localizedName.ar,
        nameEn: localizedName.en ?? null,
        descriptionAr: localizedDescription?.ar ?? null,
        descriptionEn: localizedDescription?.en ?? null,
        category: mapServiceTypeToCategory(serviceType.code),
        billingUnit: ServiceBillingUnit.Piece,
        defaultUnitPriceSar: toDecimal(row.suggestedPriceSar ?? 0) ?? new Prisma.Decimal(0),
        defaultTurnaroundHours: getDefaultTurnaroundHoursForServiceType(serviceType.code),
        supportsRush: getDefaultRushSupportForServiceType(serviceType.code),
        active: row.active,
        productId: product.id,
        serviceType: serviceType.code,
        pricingUnit: row.pricingUnit,
        suggestedPriceSar: toDecimal(row.suggestedPriceSar),
        isAvailable: row.isAvailable,
        sortOrder: row.sortOrder,
        updatedAt: new Date(timestamp),
      },
      create: {
        id: row.id,
        code: row.code,
        nameAr: localizedName.ar,
        nameEn: localizedName.en ?? null,
        descriptionAr: localizedDescription?.ar ?? null,
        descriptionEn: localizedDescription?.en ?? null,
        category: mapServiceTypeToCategory(serviceType.code),
        billingUnit: ServiceBillingUnit.Piece,
        defaultUnitPriceSar: toDecimal(row.suggestedPriceSar ?? 0) ?? new Prisma.Decimal(0),
        defaultTurnaroundHours: getDefaultTurnaroundHoursForServiceType(serviceType.code),
        supportsRush: getDefaultRushSupportForServiceType(serviceType.code),
        active: row.active,
        productId: product.id,
        serviceType: serviceType.code,
        pricingUnit: row.pricingUnit,
        suggestedPriceSar: toDecimal(row.suggestedPriceSar),
        isAvailable: row.isAvailable,
        sortOrder: row.sortOrder,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
      },
    });
  }
};

const ensureLegacyProviderMatrixOfferingsSeededTx = async (tx: PrismaTx) => {
  const [providers, matrixServices, latestCapacities, existingCapabilities] = await Promise.all([
    tx.provider.findMany({
      where: {
        onboardingStatus: OnboardingStatus.Approved,
        active: true,
      },
      orderBy: { code: "asc" },
    }),
    tx.service.findMany({
      where: {
        productId: {
          not: null,
        },
        active: true,
        isAvailable: true,
      },
    }),
    tx.providerCapacity.findMany({
      orderBy: [{ providerId: "asc" }, { capacityDate: "desc" }],
    }),
    tx.providerCapability.findMany({
      orderBy: [{ providerId: "asc" }, { serviceId: "asc" }],
    }),
  ]);

  const latestCapacityByProviderId = selectLatestCapacityRows(latestCapacities);
  const matrixServiceIds = new Set(matrixServices.map((service) => service.id));
  const capabilitiesByProviderId = new Map<string, PrismaProviderCapabilityRecord[]>();

  existingCapabilities.forEach((capability) => {
    const list = capabilitiesByProviderId.get(capability.providerId) ?? [];
    list.push(capability);
    capabilitiesByProviderId.set(capability.providerId, list);
  });

  for (const provider of providers) {
    const providerCapabilities = capabilitiesByProviderId.get(provider.id) ?? [];
    const hasMatrixOffering = providerCapabilities.some((capability) => matrixServiceIds.has(capability.serviceId));

    if (hasMatrixOffering) {
      continue;
    }

    const totalCapacityKg = toNumber(latestCapacityByProviderId.get(provider.id)?.totalKg) ?? 0;

    if (totalCapacityKg <= 0) {
      continue;
    }

    await tx.providerCapability.createMany({
      data: matrixServices.map((service) => ({
        providerId: provider.id,
        serviceId: service.id,
        serviceNameAr: service.nameAr,
        serviceNameEn: service.nameEn ?? null,
        active: true,
        unitPriceSar:
          toDecimal(toNumber(service.suggestedPriceSar) ?? toNumber(service.defaultUnitPriceSar) ?? 0) ??
          new Prisma.Decimal(0),
        maxDailyKg: toDecimal(totalCapacityKg) ?? new Prisma.Decimal(0),
        maxSingleOrderKg: toDecimal(Math.max(Math.round(totalCapacityKg * 0.3), 25)) ?? new Prisma.Decimal(25),
        rushSupported: service.supportsRush,
        supportedCityCodesJson: toJsonInput([provider.city]),
        defaultTurnaroundHours: service.defaultTurnaroundHours,
        minimumPickupLeadHours: 2,
        pickupWindowStartHour: 8,
        pickupWindowEndHour: 22,
        currentApprovedPriceSar:
          toDecimal(toNumber(service.suggestedPriceSar) ?? toNumber(service.defaultUnitPriceSar) ?? 0) ??
          new Prisma.Decimal(0),
        currentStatus: PlatformServiceCurrentStatus.Active,
        proposedPriceSar: null,
        proposedStatus: null,
        proposedSubmittedAt: null,
        approvedAt: provider.reviewedAt ?? provider.updatedAt,
        approvedByAccountId: DEFAULT_ADMIN_ACCOUNT_ID,
        approvedByRole: AccountRole.Admin,
        rejectionReasonAr: null,
        activeMatrix: service.active,
        availableMatrix: service.isAvailable,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      })),
      skipDuplicates: true,
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
  productId: service.productId ?? undefined,
  serviceType: (service.serviceType as PlatformServiceTypeCode | null) ?? undefined,
  pricingUnit: (service.pricingUnit as ServicePricingUnit | null) ?? undefined,
  suggestedPriceSar: toNumber(service.suggestedPriceSar) ?? undefined,
  isAvailable: service.isAvailable,
});

const mapPlatformServiceMatrixSummary = ({
  row,
  product,
  serviceType,
  providerOfferings,
}: {
  row: PrismaServiceRecord;
  product: PrismaPlatformProductRecord;
  serviceType: PlatformServiceType;
  providerOfferings: PrismaProviderCapabilityRecord[];
}): PlatformServiceMatrixRow & {
  productName: { ar: string; en?: string };
  serviceTypeName: { ar: string; en?: string };
  matrixLabelAr: string;
} => {
  const activeOfferings = providerOfferings.filter(isApprovedProviderCapabilityRecord);

  return {
    id: row.id,
    code: row.code,
    productId: product.id,
    serviceTypeId: serviceType.id,
    pricingUnit: (row.pricingUnit as ServicePricingUnit | null) ?? ServicePricingUnit.Piece,
    suggestedPriceSar: toNumber(row.suggestedPriceSar) ?? undefined,
    isAvailable: row.isAvailable,
    active: row.active,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt?.toISOString?.() ?? undefined,
    updatedAt: row.updatedAt?.toISOString?.() ?? undefined,
    productName: {
      ar: product.nameAr,
      en: product.nameEn ?? undefined,
    },
    serviceTypeName: serviceType.name,
    matrixLabelAr: buildPlatformCatalogMatrixLabel({
      productName: { ar: product.nameAr, en: product.nameEn ?? undefined },
      serviceTypeName: serviceType.name,
    }),
    operationalProviderCount: activeOfferings.length,
    lowestApprovedPriceSar:
      activeOfferings.length > 0
        ? activeOfferings.reduce((current, entry) => {
            const approvedPrice = toNumber(entry.currentApprovedPriceSar);
            return typeof approvedPrice === "number" ? Math.min(current, approvedPrice) : current;
          }, Number.POSITIVE_INFINITY)
        : undefined,
  };
};

const loadPlatformCatalogTx = async (tx: PrismaTx) => {
  const [products, serviceRows] = await Promise.all([
    tx.platformProduct.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }] }),
    tx.service.findMany({
      where: {
        productId: {
          not: null,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
  ]);
  const capabilities =
    serviceRows.length === 0
      ? []
      : await tx.providerCapability.findMany({
          where: {
            serviceId: {
              in: serviceRows.map((row) => row.id),
            },
          },
          orderBy: [{ providerId: "asc" }, { serviceId: "asc" }],
        });
  const serviceTypes = DEFAULT_PLATFORM_SERVICE_CATALOG.serviceTypes;
  const productById = new Map(products.map((product) => [product.id, product]));
  const serviceTypeById = new Map(serviceTypes.map((serviceType) => [serviceType.id, serviceType]));
  const capabilitiesByServiceId = new Map<string, PrismaProviderCapabilityRecord[]>();

  capabilities.forEach((capability) => {
    const list = capabilitiesByServiceId.get(capability.serviceId) ?? [];
    list.push(capability);
    capabilitiesByServiceId.set(capability.serviceId, list);
  });

  const matrixRows = serviceRows
    .map((row) => {
      if (!row.productId || !row.serviceType) {
        return undefined;
      }

      const product = productById.get(row.productId);
      const serviceType = serviceTypeById.get(row.serviceType);

      if (!product || !serviceType) {
        return undefined;
      }

      return mapPlatformServiceMatrixSummary({
        row,
        product,
        serviceType,
        providerOfferings: capabilitiesByServiceId.get(row.id) ?? [],
      });
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return {
    serviceTypes,
    products: products.map<PlatformProduct>((product) => ({
      id: product.id,
      code: product.code,
      name: {
        ar: product.nameAr,
        en: product.nameEn ?? undefined,
      },
      active: product.active,
      sortOrder: product.sortOrder,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })),
    matrixRows,
  };
};

const mapProviderCapabilityRecordToOffering = ({
  capability,
  serviceById,
  productById,
  serviceTypeById,
}: {
  capability: PrismaProviderCapabilityRecord;
  serviceById: Map<string, PrismaServiceRecord>;
  productById: Map<string, PrismaPlatformProductRecord>;
  serviceTypeById: Map<string, PlatformServiceType>;
}): ProviderServiceOffering | undefined => {
  const service = serviceById.get(capability.serviceId);

  if (!service || !service.productId || !service.serviceType || !service.pricingUnit) {
    return undefined;
  }

  const product = productById.get(service.productId);
  const serviceType = serviceTypeById.get(service.serviceType);

  if (!product || !serviceType) {
    return undefined;
  }

  return {
    id: buildProviderOfferingId(capability.providerId, capability.serviceId),
    providerId: capability.providerId,
    serviceId: capability.serviceId,
    productId: product.id,
    productName: {
      ar: product.nameAr,
      en: product.nameEn ?? undefined,
    },
    serviceType: service.serviceType as PlatformServiceTypeCode,
    serviceTypeName: serviceType.name,
    pricingUnit: service.pricingUnit as ServicePricingUnit,
    currentApprovedPriceSar: toNumber(capability.currentApprovedPriceSar) ?? undefined,
    currentStatus: capability.currentStatus as PlatformServiceCurrentStatus,
    currentStatusLabelAr:
      capability.currentStatus === PlatformServiceCurrentStatus.Active ? "نشط" : "غير نشط",
    proposedPriceSar: toNumber(capability.proposedPriceSar) ?? undefined,
    proposedStatus: (capability.proposedStatus as ProviderServiceProposalStatus | null) ?? undefined,
    proposedStatusLabelAr:
      capability.proposedStatus === ProviderServiceProposalStatus.PendingApproval
        ? "بانتظار الاعتماد"
        : capability.proposedStatus === ProviderServiceProposalStatus.Rejected
          ? "مرفوض"
          : undefined,
    proposedSubmittedAt: toIsoString(capability.proposedSubmittedAt),
    approvedAt: toIsoString(capability.approvedAt),
    approvedByAccountId: capability.approvedByAccountId ?? undefined,
    approvedByRole: capability.approvedByRole ?? undefined,
    rejectionReasonAr: capability.rejectionReasonAr ?? undefined,
    suggestedPriceSar: toNumber(service.suggestedPriceSar) ?? undefined,
    activeMatrix: capability.activeMatrix,
    availableMatrix: capability.availableMatrix,
    createdAt: toIsoString(capability.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(capability.updatedAt) ?? new Date().toISOString(),
  };
};

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
  serviceRows,
  products,
}: {
  providers: PrismaProviderRecord[];
  capabilities: PrismaProviderCapabilityRecord[];
  capacities: PrismaProviderCapacityRecord[];
  performance: PrismaProviderPerformanceStatsRecord[];
  serviceRows: PrismaServiceRecord[];
  products: PrismaPlatformProductRecord[];
}): ProviderProfile[] => {
  const capabilitiesByProviderId = new Map<string, PrismaProviderCapabilityRecord[]>();
  const performanceByProviderId = new Map<string, PrismaProviderPerformanceStatsRecord>();
  const capacityByProviderId = selectLatestCapacityRows(capacities);
  const serviceById = new Map(serviceRows.map((service) => [service.id, service]));
  const productById = new Map(products.map((product) => [product.id, product]));
  const serviceTypeById = new Map(
    DEFAULT_PLATFORM_SERVICE_CATALOG.serviceTypes.map((serviceType) => [serviceType.id, serviceType]),
  );

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
    const providerCapabilities = capabilitiesByProviderId.get(provider.id) ?? [];
    const commercialRegistrationFile =
      fromJsonOptional<ProviderRegistrationStoredDocumentReference>(
        provider.commercialRegistrationFileJson,
      ) ?? {
        kind: "commercial_registration",
        fileName: "commercial-registration.pdf",
        mimeType: "application/pdf",
        sizeBytes: 0,
        uploadedAt: provider.createdAt.toISOString(),
        storageKey: `legacy://${provider.id}/commercial-registration.pdf`,
        downloadPath: buildProviderDocumentDownloadPath(provider.id),
      };
    const workingDays = fromJson<ProviderWorkingDay[]>(provider.workingDaysJson, [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
    ]);

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
      businessProfile: {
        legalEntityName: provider.legalEntityName ?? undefined,
        commercialRegistrationNumber: provider.commercialRegistrationNumber ?? provider.code,
        taxRegistrationNumber: provider.taxRegistrationNumber ?? provider.code,
        phone: provider.businessPhone ?? provider.contactPhone ?? "",
        email: provider.businessEmail ?? provider.contactEmail ?? "",
        commercialRegistrationFile: {
          ...commercialRegistrationFile,
          downloadPath:
            commercialRegistrationFile.downloadPath ?? buildProviderDocumentDownloadPath(provider.id),
        },
      },
      locationProfile: {
        addressText: provider.addressText ?? provider.line1 ?? "",
      },
      operatingProfile: {
        otherServicesText: provider.otherServicesText ?? undefined,
        pickupLeadTimeHours: provider.pickupLeadTimeHours ?? 2,
        executionTimeHours: provider.executionTimeHours ?? 24,
        deliveryTimeHours: provider.deliveryTimeHours ?? 4,
        workingDays,
        workingHoursFrom: provider.workingHoursFrom ?? "08:00",
        workingHoursTo: provider.workingHoursTo ?? "22:00",
      },
      financialProfile: {
        bankName: provider.bankName ?? "غير محدد",
        iban: provider.iban ?? "",
        accountHolderName:
          provider.bankAccountHolderName ?? provider.legalEntityName ?? provider.legalNameAr,
      },
      accountSetupProfile: {
        fullName: provider.accountSetupName ?? provider.contactName ?? "",
        phone: provider.accountSetupPhone ?? provider.contactPhone ?? "",
        email: provider.accountSetupEmail ?? provider.contactEmail ?? "",
      },
      serviceOfferings: providerCapabilities
        .map((capability) =>
          mapProviderCapabilityRecordToOffering({
            capability,
            serviceById,
            productById,
            serviceTypeById,
          }),
        )
        .filter((offering): offering is ProviderServiceOffering => Boolean(offering)),
      capabilities: providerCapabilities.map((capability) => ({
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
      roomNumber: order.roomNumber ?? undefined,
      totalItemCount: toNumber(order.totalItemCount) ?? 0,
      currency: order.currency as LaundryOrder["currency"],
      estimatedSubtotalSar: toNumber(order.estimatedSubtotalSar) ?? 0,
      pickupAt: order.pickupAt.toISOString(),
      notesAr: order.notesAr ?? undefined,
      hotelFinancialSnapshot: fromJsonOptional<OrderFinancialSnapshot>(order.hotelFinancialSnapshotJson),
      providerFinancialSnapshot: fromJsonOptional<OrderFinancialSnapshot>(order.providerFinancialSnapshotJson),
      hotelInvoiceId: order.hotelInvoiceId ?? undefined,
      providerStatementId: order.providerStatementId ?? undefined,
      billedAt: toIsoString(order.billedAt),
      settledAt: toIsoString(order.settledAt),
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

const requireSaudiCityField = (value: string) => {
  const normalized = requireTextField(value, "المدينة");

  if (!PROVIDER_REGISTRATION_SAUDI_CITIES_AR.includes(normalized as never)) {
    throw new Error("يرجى اختيار المدينة من القائمة المتاحة.");
  }

  return normalized as (typeof PROVIDER_REGISTRATION_SAUDI_CITIES_AR)[number];
};

const requireTimeField = (value: string, label: string) => {
  const normalized = requireTextField(value, label);

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
    throw new Error(`يرجى إدخال ${label} بصيغة وقت صحيحة مثل 08:00.`);
  }

  return normalized;
};

const requireIbanField = (value: string) => {
  const normalized = requireTextField(value, "رقم الآيبان")
    .replace(/\s+/g, "")
    .toUpperCase();

  if (!/^SA\d{22}$/.test(normalized)) {
    throw new Error("يرجى إدخال رقم آيبان سعودي صالح يبدأ بـ SA.");
  }

  return normalized;
};

const normalizeWorkingDays = (value: ProviderWorkingDay[] | string[]) => {
  const normalized = Array.from(
    new Set(
      value
        .map((item) => item.toString().trim())
        .filter((item): item is ProviderWorkingDay => item in providerWorkingDayLabelsAr),
    ),
  );

  if (normalized.length === 0) {
    throw new Error("يرجى اختيار يوم عمل واحد على الأقل.");
  }

  return normalized;
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
  const servicePricing = Array.from(
    new Map(
      input.servicePricing
        .filter(
          (entry) =>
            typeof entry.serviceId === "string" &&
            entry.serviceId.trim().length > 0 &&
            Number.isFinite(entry.proposedPriceSar) &&
            entry.proposedPriceSar > 0,
        )
        .map((entry) => [entry.serviceId.trim(), entry]),
    ).values(),
  );
  const dailyCapacityKg = requirePositiveNumberField(input.dailyCapacityKg, "السعة اليومية");
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const commercialRegistrationFile = input.commercialRegistrationFile;

  if (servicePricing.length === 0) {
    throw new Error("اختر خدمة واحدة على الأقل للمزوّد.");
  }

  if (!commercialRegistrationFile) {
    throw new Error("يجب إرفاق ملف السجل التجاري.");
  }

  if (
    !Number.isFinite(commercialRegistrationFile.sizeBytes) ||
    commercialRegistrationFile.sizeBytes <= 0
  ) {
    throw new Error("يرجى إرفاق ملف صالح للسجل التجاري.");
  }

  if (commercialRegistrationFile.sizeBytes > PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("الحد الأقصى لحجم ملف السجل التجاري هو 5 ميجابايت.");
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
    legalEntityName: normalizeOptionalTextField(input.legalEntityName),
    commercialRegistrationNumber: requireTextField(input.commercialRegistrationNumber, "رقم السجل التجاري"),
    taxRegistrationNumber: requireTextField(input.taxRegistrationNumber, "الرقم الضريبي"),
    city: requireSaudiCityField(input.city),
    businessPhone: requirePhoneField(input.businessPhone),
    businessEmail: requireEmailField(input.businessEmail),
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
    supportedServiceIds,
    otherServicesText: normalizeOptionalTextField(input.otherServicesText),
    dailyCapacityKg,
    pickupLeadTimeHours: requirePositiveNumberField(input.pickupLeadTimeHours, "زمن الاستلام"),
    executionTimeHours: requirePositiveNumberField(input.executionTimeHours, "زمن التنفيذ"),
    deliveryTimeHours: requirePositiveNumberField(input.deliveryTimeHours, "زمن التسليم"),
    workingDays: normalizeWorkingDays(input.workingDays),
    workingHoursFrom: requireTimeField(input.workingHoursFrom, "من وقت العمل"),
    workingHoursTo: requireTimeField(input.workingHoursTo, "إلى وقت العمل"),
    commercialRegistrationFile: commercialRegistrationFile as ProviderRegistrationDocumentUploadInput,
    bankName: requireTextField(input.bankName, "اسم البنك"),
    iban: requireIbanField(input.iban),
    bankAccountHolderName: requireTextField(input.bankAccountHolderName, "اسم صاحب الحساب"),
    accountFullName: requireTextField(input.accountFullName, "اسم مسؤول الحساب"),
    accountPhone: requirePhoneField(input.accountPhone),
    accountEmail: requireEmailField(input.accountEmail),
    notesAr: normalizeOptionalTextField(input.notesAr ?? input.notes),
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

const normalizeProviderServicePricingEntries = (
  pricingInput: ProviderServicePricingInput[],
  matrixRows: Array<PlatformServiceMatrixRow & { matrixLabelAr?: string }>,
) => {
  const matrixById = new Map(matrixRows.map((row) => [row.id, row]));
  const normalized = Array.from(
    new Map(
      pricingInput
        .map((entry) => ({
          serviceId: entry.serviceId.trim(),
          proposedPriceSar: entry.proposedPriceSar,
        }))
        .filter((entry) => entry.serviceId.length > 0)
        .map((entry) => [entry.serviceId, entry]),
    ).values(),
  ).map((entry) => {
    const row = matrixById.get(entry.serviceId);
    const label = row?.matrixLabelAr ?? entry.serviceId;

    return {
      serviceId: entry.serviceId,
      proposedPriceSar: requirePositiveNumberField(entry.proposedPriceSar, `Ø³Ø¹Ø± ${label}`),
    };
  });

  if (normalized.length === 0) {
    throw new Error("Ø§Ø®ØªØ± Ø®Ø¯Ù…Ø© Ù‚ÙŠØ§Ø³ÙŠØ© ÙˆØ§Ø­Ø¯Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ Ù…Ø¹ Ø¥Ø¯Ø®Ø§Ù„ Ø³Ø¹Ø±Ù‡Ø§.");
  }

  normalized.forEach((entry) => {
    const row = matrixById.get(entry.serviceId);

    if (!row) {
      throw new Error(`Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ù‚ÙŠØ§Ø³ÙŠØ© ${entry.serviceId} ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©.`);
    }

    if (!row.active || !row.isAvailable) {
      throw new Error(`Ø§Ù„Ø®Ø¯Ù…Ø© ${row.matrixLabelAr ?? entry.serviceId} ØºÙŠØ± Ù…ØªØ§Ø­Ø© Ø­Ø§Ù„ÙŠØ§Ù‹.`);
    }
  });

  return normalized;
};

const validateProviderServiceCatalogRegistrationInput = (
  input: ProviderRegistrationInput,
  catalog: {
    matrixRows: Array<PlatformServiceMatrixRow & { matrixLabelAr?: string }>;
  },
) => {
  const commercialRegistrationFile = input.commercialRegistrationFile;

  if (!commercialRegistrationFile) {
    throw new Error("ÙŠØ¬Ø¨ Ø¥Ø±ÙØ§Ù‚ Ù…Ù„Ù Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ.");
  }

  if (
    !Number.isFinite(commercialRegistrationFile.sizeBytes) ||
    commercialRegistrationFile.sizeBytes <= 0
  ) {
    throw new Error("ÙŠØ±Ø¬Ù‰ Ø¥Ø±ÙØ§Ù‚ Ù…Ù„Ù ØµØ§Ù„Ø­ Ù„Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ.");
  }

  if (commercialRegistrationFile.sizeBytes > PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ø­Ø¬Ù… Ù…Ù„Ù Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ Ù‡Ùˆ 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª.");
  }

  return {
    providerName: requireTextField(input.providerName, "Ø§Ø³Ù… Ø§Ù„Ù…Ø²ÙˆÙ‘Ø¯"),
    legalEntityName: normalizeOptionalTextField(input.legalEntityName),
    commercialRegistrationNumber: requireTextField(
      input.commercialRegistrationNumber,
      "Ø±Ù‚Ù… Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ",
    ),
    taxRegistrationNumber: requireTextField(input.taxRegistrationNumber, "Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠ"),
    city: requireSaudiCityField(input.city),
    businessPhone: requirePhoneField(input.businessPhone),
    businessEmail: requireEmailField(input.businessEmail),
    addressText: requireTextField(input.addressText, "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†"),
    latitude: requireCoordinateField({
      value: input.latitude,
      label: "Ø®Ø· Ø§Ù„Ø¹Ø±Ø¶",
      min: -90,
      max: 90,
    }),
    longitude: requireCoordinateField({
      value: input.longitude,
      label: "Ø®Ø· Ø§Ù„Ø·ÙˆÙ„",
      min: -180,
      max: 180,
    }),
    servicePricing: normalizeProviderServicePricingEntries(input.servicePricing, catalog.matrixRows),
    dailyCapacityKg: requirePositiveNumberField(input.dailyCapacityKg, "Ø§Ù„Ø³Ø¹Ø© Ø§Ù„ÙŠÙˆÙ…ÙŠØ©"),
    pickupLeadTimeHours: requirePositiveNumberField(input.pickupLeadTimeHours, "Ø²Ù…Ù† Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"),
    executionTimeHours: requirePositiveNumberField(input.executionTimeHours, "Ø²Ù…Ù† Ø§Ù„ØªÙ†ÙÙŠØ°"),
    deliveryTimeHours: requirePositiveNumberField(input.deliveryTimeHours, "Ø²Ù…Ù† Ø§Ù„ØªØ³Ù„ÙŠÙ…"),
    workingDays: normalizeWorkingDays(input.workingDays),
    workingHoursFrom: requireTimeField(input.workingHoursFrom, "Ù…Ù† ÙˆÙ‚Øª Ø§Ù„Ø¹Ù…Ù„"),
    workingHoursTo: requireTimeField(input.workingHoursTo, "Ø¥Ù„Ù‰ ÙˆÙ‚Øª Ø§Ù„Ø¹Ù…Ù„"),
    commercialRegistrationFile: commercialRegistrationFile as ProviderRegistrationDocumentUploadInput,
    bankName: requireTextField(input.bankName, "Ø§Ø³Ù… Ø§Ù„Ø¨Ù†Ùƒ"),
    iban: requireIbanField(input.iban),
    bankAccountHolderName: requireTextField(input.bankAccountHolderName, "Ø§Ø³Ù… ØµØ§Ø­Ø¨ Ø§Ù„Ø­Ø³Ø§Ø¨"),
    accountFullName: requireTextField(input.accountFullName, "Ø§Ø³Ù… Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨"),
    accountPhone: requirePhoneField(input.accountPhone),
    accountEmail: requireEmailField(input.accountEmail),
    notesAr: normalizeOptionalTextField(input.notesAr ?? input.notes),
  };
};

const parseWorkingHourForProviderCapability = (value: string, fallback: number) => {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return fallback;
  }

  const hours = Number(match[1]);
  return Number.isFinite(hours) ? Math.max(0, Math.min(23, hours)) : fallback;
};

const buildProviderCapabilityRowsForRegistration = ({
  providerId,
  pricingInput,
  city,
  dailyCapacityKg,
  pickupLeadTimeHours,
  workingHoursFrom,
  workingHoursTo,
  matrixRows,
  timestamp,
}: {
  providerId: string;
  pricingInput: ProviderServicePricingInput[];
  city: string;
  dailyCapacityKg: number;
  pickupLeadTimeHours: number;
  workingHoursFrom: string;
  workingHoursTo: string;
  matrixRows: Array<PlatformServiceMatrixRow & { matrixLabelAr?: string }>;
  timestamp: string;
}) => {
  const matrixById = new Map(matrixRows.map((row) => [row.id, row]));
  const pickupWindowStartHour = parseWorkingHourForProviderCapability(workingHoursFrom, 8);
  const pickupWindowEndHour = parseWorkingHourForProviderCapability(workingHoursTo, 22);

  return pricingInput.map((entry) => {
    const service = matrixById.get(entry.serviceId);

    if (!service) {
      throw new Error(`Ø§Ù„Ø®Ø¯Ù…Ø© ${entry.serviceId} ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©.`);
    }

    const serviceType = service.serviceTypeId as PlatformServiceTypeCode;

    return {
      providerId,
      serviceId: service.id,
      serviceNameAr: service.matrixLabelAr ?? service.id,
      serviceNameEn: null,
      active: false,
      unitPriceSar: entry.proposedPriceSar,
      maxDailyKg: dailyCapacityKg,
      maxSingleOrderKg: Math.max(Math.round(dailyCapacityKg * 0.3), 25),
      rushSupported: getDefaultRushSupportForServiceType(serviceType),
      supportedCityCodesJson: toJsonInput([city]),
      defaultTurnaroundHours: getDefaultTurnaroundHoursForServiceType(serviceType),
      minimumPickupLeadHours: pickupLeadTimeHours,
      pickupWindowStartHour,
      pickupWindowEndHour,
      currentApprovedPriceSar: null,
      currentStatus: PlatformServiceCurrentStatus.Inactive,
      proposedPriceSar: entry.proposedPriceSar,
      proposedStatus: ProviderServiceProposalStatus.PendingApproval,
      proposedSubmittedAt: new Date(timestamp),
      approvedAt: null,
      approvedByAccountId: null,
      approvedByRole: null,
      rejectionReasonAr: null,
      activeMatrix: service.active,
      availableMatrix: service.isAvailable,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
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

const validateHotelConsoleOrderInput = (
  input: CreateHotelOrderInput,
  services: ServiceCatalogItem[],
) => {
  const roomNumber = input.roomNumber?.trim();

  if (!roomNumber) {
    throw new Error("يرجى إدخال رقم الغرفة قبل إرسال الطلب.");
  }

  const pickupAt = normalizePickupAt(input.pickupAt);

  if (new Date(pickupAt).getTime() <= Date.now()) {
    throw new Error("يجب أن يكون موعد الاستلام في المستقبل.");
  }

  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const deduplicatedItems = new Map<string, number>();

  (input.items ?? []).forEach((item) => {
    const serviceId = item.serviceId.trim();
    const quantity = Number(item.quantity);

    if (serviceId.length === 0 || !Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    deduplicatedItems.set(serviceId, (deduplicatedItems.get(serviceId) ?? 0) + quantity);
  });

  if (deduplicatedItems.size === 0) {
    throw new Error("أدخل كمية لخدمة واحدة على الأقل قبل إرسال الطلب.");
  }

  const items = Array.from(deduplicatedItems.entries()).map(([serviceId, quantity]) => {
    const service = serviceMap.get(serviceId);

    if (!service) {
      throw new Error("يرجى اختيار خدمات معتمدة من كتالوج WashOff التشغيلي فقط.");
    }

    if (!service.active || service.isAvailable === false || (service.operationalProviderCount ?? 0) <= 0) {
      throw new Error(`الخدمة ${service.name.ar} غير متاحة حاليًا.`);
    }

    return {
      serviceId,
      quantity,
    };
  });

  return {
    roomNumber,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    pickupAt,
    notesAr: (input.notesAr ?? input.notes?.trim()) || undefined,
    priority: input.priority ?? OrderPriority.Standard,
  };
};

const buildItemizedOrderItems = ({
  orderId,
  items,
  serviceMap,
}: {
  orderId: string;
  items: Array<{ serviceId: string; quantity: number }>;
  serviceMap: Map<string, ServiceCatalogItem>;
}): OrderItem[] => {
  return items.map((requestedItem, index) => {
    const service = serviceMap.get(requestedItem.serviceId);

    if (!service) {
      throw new Error(`الخدمة ${requestedItem.serviceId} غير موجودة.`);
    }

    return {
      id: `${orderId}-item-${index + 1}-${service.id}`,
      serviceId: service.id,
      serviceName: service.name,
      quantity: requestedItem.quantity,
      unit: service.billingUnit,
      unitPriceSar: service.defaultUnitPriceSar,
      estimatedLineTotalSar: requestedItem.quantity * service.defaultUnitPriceSar,
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

const ensureHotelContractPricesForHotelTx = async (
  tx: PrismaTx,
  hotelId: string,
  referenceTime = new Date().toISOString(),
) => {
  const [serviceRows, existingContractPrices] = await Promise.all([
    tx.service.findMany({
      where: {
        active: true,
        isAvailable: true,
        productId: { not: null },
        serviceType: { not: null },
        pricingUnit: { not: null },
      },
      orderBy: { code: "asc" },
    }),
    tx.hotelContractPrice.findMany({
      where: { hotelId },
      orderBy: { serviceId: "asc" },
    }),
  ]);

  const existingServiceIds = new Set(existingContractPrices.map((entry) => entry.serviceId));
  const missingContractPrices = serviceRows
    .filter((service) => !existingServiceIds.has(service.id) && service.suggestedPriceSar !== null)
    .map((service) => ({
      hotelId,
      serviceId: service.id,
      unitPriceSar: service.suggestedPriceSar ?? new Prisma.Decimal(0),
      active: true,
      createdAt: new Date(referenceTime),
      updatedAt: new Date(referenceTime),
    }));

  if (missingContractPrices.length > 0) {
    await tx.hotelContractPrice.createMany({
      data: missingContractPrices,
      skipDuplicates: true,
    });
  }
};

const loadHotelContractPriceMapTx = async (tx: PrismaTx, hotelId: string) => {
  await ensureHotelContractPricesForHotelTx(tx, hotelId);

  const contractPrices = await tx.hotelContractPrice.findMany({
    where: {
      hotelId,
      active: true,
    },
    orderBy: { serviceId: "asc" },
  });

  return new Map(
    contractPrices
      .map((entry) => [entry.serviceId, toNumber(entry.unitPriceSar)])
      .filter((entry): entry is [string, number] => typeof entry[1] === "number"),
  );
};

const loadServicesTx = async (tx: PrismaTx, hotelId?: string) => {
  const catalog = await loadPlatformCatalogTx(tx);
  const serviceIds = catalog.matrixRows.map((row) => row.id);

  if (serviceIds.length === 0) {
    return [];
  }

  const [capabilities, serviceRows, products] = await Promise.all([
    tx.providerCapability.findMany({
      where: {
        serviceId: {
          in: serviceIds,
        },
        active: true,
        currentStatus: PlatformServiceCurrentStatus.Active,
        currentApprovedPriceSar: {
          not: null,
        },
        activeMatrix: true,
        availableMatrix: true,
      },
      orderBy: [{ providerId: "asc" }, { serviceId: "asc" }],
    }),
    tx.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
    }),
    tx.platformProduct.findMany({
      where: {
        id: {
          in: catalog.products.map((product) => product.id),
        },
      },
    }),
  ]);
  const serviceById = new Map(serviceRows.map((service) => [service.id, service]));
  const productById = new Map(products.map((product) => [product.id, product]));
  const serviceTypeById = new Map(catalog.serviceTypes.map((serviceType) => [serviceType.id, serviceType]));
  const offerings = capabilities
    .map((capability) =>
      mapProviderCapabilityRecordToOffering({
        capability,
        serviceById,
        productById,
        serviceTypeById,
      }),
    )
    .filter((offering): offering is ProviderServiceOffering => Boolean(offering));
  const hotelContractPricesByServiceId = hotelId
    ? await loadHotelContractPriceMapTx(tx, hotelId)
    : undefined;

  return buildHotelFacingServiceCatalog({
    ...catalog,
    offerings,
    hotelContractPricesByServiceId,
  });
};

const loadProvidersTx = async (tx: PrismaTx, providerIds?: string[]) => {
  const where = providerIds ? { id: { in: providerIds } } : undefined;
  const [providers, capabilities, capacities, performance, serviceRows, products] = await Promise.all([
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
    tx.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    tx.platformProduct.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
  ]);

  return mapProviderRecordsToDomain({
    providers,
    capabilities,
    capacities,
    performance,
    serviceRows,
    products,
  });
};

const loadProviderServiceManagementTx = async (tx: PrismaTx, providerId: string) => {
  const [catalog, provider] = await Promise.all([
    loadPlatformCatalogTx(tx),
    loadProvidersTx(tx, [providerId]).then((entries) => entries[0]),
  ]);

  if (!provider) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù…Ù„Ù Ø§Ù„Ù…Ø²ÙˆÙ‘Ø¯.");
  }

  return {
    catalog,
    offerings: provider.serviceOfferings ?? [],
  };
};

const loadProviderPricingAdminDataTx = async (tx: PrismaTx) => {
  const providers = await loadProvidersTx(tx);

  return {
    pendingReviews: providers
      .flatMap((provider) =>
        (provider.serviceOfferings ?? [])
          .filter(
            (offering) =>
              offering.proposedStatus === ProviderServiceProposalStatus.PendingApproval &&
              typeof offering.proposedPriceSar === "number",
          )
          .map((offering) => ({
            offeringId: offering.id,
            providerId: provider.id,
            providerNameAr: provider.displayName.ar,
            productId: offering.productId,
            productNameAr: offering.productName.ar,
            serviceType: offering.serviceType,
            serviceTypeLabelAr: offering.serviceTypeName.ar,
            pricingUnitLabelAr:
              offering.pricingUnit === ServicePricingUnit.Piece ? "Ù„Ù„Ù‚Ø·Ø¹Ø©" : "Ù„Ù„ÙˆØ­Ø¯Ø©",
            suggestedPriceSar: offering.suggestedPriceSar,
            currentApprovedPriceSar: offering.currentApprovedPriceSar,
            proposedPriceSar: offering.proposedPriceSar!,
            proposedSubmittedAt: offering.proposedSubmittedAt ?? offering.updatedAt,
            activeApprovedAt: offering.approvedAt,
            activeStatusLabelAr: offering.currentStatusLabelAr,
            proposedStatusLabelAr: offering.proposedStatusLabelAr ?? "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯",
            rejectionReasonAr: offering.rejectionReasonAr,
          })),
      )
      .sort((left, right) => right.proposedSubmittedAt.localeCompare(left.proposedSubmittedAt)),
  };
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

const loadPlatformSettingsTx = async (tx: PrismaTx): Promise<PlatformSettings> => {
  const settings = await tx.platformSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return settings ? mapPlatformSettingsRecordToDomain(settings) : { ...defaultPlatformSettings };
};

const buildPlatformFinanceSellerSnapshot = (settings: PlatformSettings): FinancialDocumentPartySnapshot => ({
  id: "washoff-platform",
  legalNameAr: settings.sellerLegalNameAr || settings.siteNameAr || "واش أوف",
  addressLineAr: settings.sellerAddressAr || undefined,
  displayNameAr: settings.siteNameAr || "واش أوف",
  vatNumber: settings.sellerVatNumber || undefined,
  city: settings.sellerCityAr || "الرياض",
  email: settings.mailFromEmail,
  phone: settings.supportPhone,
});

const buildHotelFinanceBuyerSnapshot = (hotel: HotelProfile): FinancialDocumentPartySnapshot => ({
  id: hotel.id,
  displayNameAr: hotel.displayName.ar,
  legalNameAr: hotel.legalEntityName ?? hotel.displayName.ar,
  addressLineAr: hotel.logistics.addressText || undefined,
  city: hotel.address.city,
  vatNumber: hotel.compliance.taxRegistrationNumber,
  email: hotel.contact.email,
  phone: hotel.contact.phone,
});

const buildProviderFinancePartySnapshot = (
  provider: ProviderProfile,
): FinancialDocumentPartySnapshot => ({
  id: provider.id,
  displayNameAr: provider.displayName.ar,
  legalNameAr: provider.businessProfile.legalEntityName ?? provider.legalName.ar,
  addressLineAr: provider.locationProfile.addressText || undefined,
  city: provider.address.city,
  vatNumber: provider.businessProfile.taxRegistrationNumber,
  email: provider.businessProfile.email,
  phone: provider.businessProfile.phone,
});

const buildHotelFinancialSnapshotForOrder = (
  order: LaundryOrder,
  lockedAt: string,
): OrderFinancialSnapshot => {
  const lines: OrderFinancialLineSnapshot[] = order.items.map((item) => {
    const subtotalExVatSar = roundFinanceAmount(item.unitPriceSar * item.quantity);
    const breakdown = buildFinancialBreakdown(subtotalExVatSar);

    return {
      id: `hotel-financial-line-${order.id}-${item.id}`,
      orderItemId: item.id,
      serviceId: item.serviceId,
      serviceNameAr: item.serviceName.ar,
      quantity: item.quantity,
      unitPriceExVatSar: item.unitPriceSar,
      subtotalExVatSar: breakdown.subtotalExVatSar,
      vatAmountSar: breakdown.vatAmountSar,
      totalIncVatSar: breakdown.totalIncVatSar,
    };
  });

  return buildOrderFinancialSnapshot({
    pricingSource: "hotel_contract",
    lockedAt,
    lines,
  });
};

const findApprovedProviderCapabilityForOrderItemTx = async (
  tx: PrismaTx,
  providerId: string,
  serviceId: string,
) => {
  const capability = await tx.providerCapability.findUnique({
    where: {
      providerId_serviceId: {
        providerId,
        serviceId,
      },
    },
  });

  if (
    !capability ||
    capability.currentStatus !== PlatformServiceCurrentStatus.Active ||
    capability.currentApprovedPriceSar === null ||
    !capability.activeMatrix ||
    !capability.availableMatrix
  ) {
    return undefined;
  }

  return capability;
};

const buildProviderFinancialSnapshotForOrderTx = async (
  tx: PrismaTx,
  order: LaundryOrder,
  lockedAt: string,
): Promise<OrderFinancialSnapshot> => {
  if (!order.providerId) {
    throw new Error("لا يمكن إنشاء لقطة مالية للمزوّد قبل تحديد المزوّد المعني بالطلب.");
  }

  const lines: OrderFinancialLineSnapshot[] = [];

  for (const item of order.items) {
    const capability = await findApprovedProviderCapabilityForOrderItemTx(
      tx,
      order.providerId,
      item.serviceId,
    );

    if (!capability) {
      throw new Error("تعذر تثبيت السعر المعتمد للمزوّد لهذا الطلب المكتمل.");
    }

    const approvedPrice = toNumber(capability.currentApprovedPriceSar);

    if (approvedPrice === undefined) {
      throw new Error("تعذر تثبيت السعر المعتمد للمزوّد لهذا الطلب المكتمل.");
    }

    const subtotalExVatSar = roundFinanceAmount(approvedPrice * item.quantity);
    const breakdown = buildFinancialBreakdown(subtotalExVatSar);

    lines.push({
      id: `provider-financial-line-${order.id}-${item.id}`,
      orderItemId: item.id,
      serviceId: item.serviceId,
      serviceNameAr: item.serviceName.ar,
      quantity: item.quantity,
      unitPriceExVatSar: approvedPrice,
      subtotalExVatSar: breakdown.subtotalExVatSar,
      vatAmountSar: breakdown.vatAmountSar,
      totalIncVatSar: breakdown.totalIncVatSar,
    });
  }

  return buildOrderFinancialSnapshot({
    pricingSource: "provider_approved_offering",
    lockedAt,
    lines,
  });
};

const mapHotelInvoiceRecordToDomain = (
  record: PrismaHotelInvoiceRecord,
  lines: PrismaHotelInvoiceOrderLineRecord[],
): HotelInvoice => ({
  id: record.id,
  invoiceNumber: record.invoiceNumber,
  hotelId: record.hotelId,
  invoiceDate: record.invoiceDate,
  currencyCode: record.currencyCode as HotelInvoice["currencyCode"],
  status: record.status as HotelInvoiceStatus,
  statusLabelAr: hotelInvoiceStatusLabelsAr[record.status as HotelInvoiceStatus],
  orderCount: record.orderCount,
  subtotalExVatSar: toNumber(record.subtotalExVatSar) ?? 0,
  vatAmountSar: toNumber(record.vatAmountSar) ?? 0,
  totalIncVatSar: toNumber(record.totalIncVatSar) ?? 0,
  seller: fromJson<FinancialDocumentPartySnapshot>(record.sellerJson, {
    id: "washoff-platform",
    displayNameAr: "واش أوف",
  }),
  buyer: fromJson<FinancialDocumentPartySnapshot>(record.buyerJson, {
    id: record.hotelId,
    displayNameAr: "",
  }),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  issuedAt: record.issuedAt.toISOString(),
  collectedAt: toIsoString(record.collectedAt),
  collectedByAccountId: record.collectedByAccountId ?? undefined,
  collectedByRole: record.collectedByRole as HotelInvoice["collectedByRole"],
  lines: lines.map((line) => ({
    id: line.id,
    invoiceId: line.invoiceId,
    orderId: line.orderId,
    roomNumber: line.roomNumber ?? undefined,
    orderSubtotalExVatSar: toNumber(line.orderSubtotalExVatSar) ?? 0,
    orderVatAmountSar: toNumber(line.orderVatAmountSar) ?? 0,
    orderTotalIncVatSar: toNumber(line.orderTotalIncVatSar) ?? 0,
  })),
});

const mapProviderStatementRecordToDomain = (
  record: PrismaProviderStatementRecord,
  lines: PrismaProviderStatementOrderLineRecord[],
): ProviderSettlementStatement => ({
  id: record.id,
  statementNumber: record.statementNumber,
  providerId: record.providerId,
  statementDate: record.statementDate,
  currencyCode: record.currencyCode as ProviderSettlementStatement["currencyCode"],
  status: record.status as ProviderStatementStatus,
  statusLabelAr: providerStatementStatusLabelsAr[record.status as ProviderStatementStatus],
  orderCount: record.orderCount,
  subtotalExVatSar: toNumber(record.subtotalExVatSar) ?? 0,
  vatAmountSar: toNumber(record.vatAmountSar) ?? 0,
  totalIncVatSar: toNumber(record.totalIncVatSar) ?? 0,
  provider: fromJson<FinancialDocumentPartySnapshot>(record.providerJson, {
    id: record.providerId,
    displayNameAr: "",
  }),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  paidAt: toIsoString(record.paidAt),
  paidByAccountId: record.paidByAccountId ?? undefined,
  paidByRole: record.paidByRole as ProviderSettlementStatement["paidByRole"],
  lines: lines.map((line) => ({
    id: line.id,
    statementId: line.statementId,
    orderId: line.orderId,
    roomNumber: line.roomNumber ?? undefined,
    providerSubtotalExVatSar: toNumber(line.providerSubtotalExVatSar) ?? 0,
    providerVatAmountSar: toNumber(line.providerVatAmountSar) ?? 0,
    providerTotalIncVatSar: toNumber(line.providerTotalIncVatSar) ?? 0,
  })),
});

const loadHotelInvoicesTx = async (tx: PrismaTx, hotelId?: string): Promise<HotelInvoice[]> => {
  const invoices = await tx.hotelInvoice.findMany({
    where: hotelId ? { hotelId } : undefined,
    orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }],
  });

  const lines = await tx.hotelInvoiceOrderLine.findMany({
    where:
      invoices.length > 0
        ? {
            invoiceId: {
              in: invoices.map((invoice) => invoice.id),
            },
          }
        : { invoiceId: "__none__" },
    orderBy: { orderId: "asc" },
  });
  const linesByInvoiceId = new Map<string, PrismaHotelInvoiceOrderLineRecord[]>();

  lines.forEach((line) => {
    const collection = linesByInvoiceId.get(line.invoiceId) ?? [];
    collection.push(line);
    linesByInvoiceId.set(line.invoiceId, collection);
  });

  return invoices.map((invoice) =>
    mapHotelInvoiceRecordToDomain(invoice, linesByInvoiceId.get(invoice.id) ?? []),
  );
};

const loadProviderStatementsTx = async (
  tx: PrismaTx,
  providerId?: string,
): Promise<ProviderSettlementStatement[]> => {
  const statements = await tx.providerStatement.findMany({
    where: providerId ? { providerId } : undefined,
    orderBy: [{ statementDate: "desc" }, { createdAt: "desc" }],
  });

  const lines = await tx.providerStatementOrderLine.findMany({
    where:
      statements.length > 0
        ? {
            statementId: {
              in: statements.map((statement) => statement.id),
            },
          }
        : { statementId: "__none__" },
    orderBy: { orderId: "asc" },
  });
  const linesByStatementId = new Map<string, PrismaProviderStatementOrderLineRecord[]>();

  lines.forEach((line) => {
    const collection = linesByStatementId.get(line.statementId) ?? [];
    collection.push(line);
    linesByStatementId.set(line.statementId, collection);
  });

  return statements.map((statement) =>
    mapProviderStatementRecordToDomain(statement, linesByStatementId.get(statement.id) ?? []),
  );
};

const ensureHotelInvoiceForCompletedOrderTx = async (
  tx: PrismaTx,
  order: LaundryOrder,
  completedAt: string,
): Promise<HotelInvoice> => {
  if (!order.hotelFinancialSnapshot) {
    throw new Error("تعذر بناء الفاتورة اليومية قبل تثبيت لقطة الفندق المالية للطلب.");
  }

  const existingLine = await tx.hotelInvoiceOrderLine.findUnique({
    where: { orderId: order.id },
  });

  if (existingLine) {
    const invoice = await tx.hotelInvoice.findUniqueOrThrow({
      where: { id: existingLine.invoiceId },
    });
    const lines = await tx.hotelInvoiceOrderLine.findMany({
      where: { invoiceId: existingLine.invoiceId },
      orderBy: { orderId: "asc" },
    });

    return mapHotelInvoiceRecordToDomain(invoice, lines);
  }

  const invoiceDate = buildDailyFinanceDateKey(completedAt);
  const invoiceId = buildHotelInvoiceId(order.hotelId, invoiceDate);
  const [settings, hotel] = await Promise.all([
    loadPlatformSettingsTx(tx),
    ensureHotelOperationalAccessTx(tx, order.hotelId),
  ]);
  const existingInvoice = await tx.hotelInvoice.findUnique({
    where: { id: invoiceId },
  });

  if (!existingInvoice) {
    await tx.hotelInvoice.create({
      data: {
        id: invoiceId,
        invoiceNumber: buildHotelInvoiceNumber(order.hotelId, invoiceDate),
        hotelId: order.hotelId,
        invoiceDate,
        currencyCode: "SAR",
        status: HotelInvoiceStatus.Issued,
        orderCount: 0,
        subtotalExVatSar: new Prisma.Decimal(0),
        vatAmountSar: new Prisma.Decimal(0),
        totalIncVatSar: new Prisma.Decimal(0),
        sellerJson: toJsonInput(buildPlatformFinanceSellerSnapshot(settings)),
        buyerJson: toJsonInput(buildHotelFinanceBuyerSnapshot(hotel)),
        createdAt: new Date(completedAt),
        updatedAt: new Date(completedAt),
        issuedAt: new Date(completedAt),
      },
    });
    await recordFinanceAuditEventTx({
      tx,
      entityType: "hotel_invoice",
      entityId: invoiceId,
      action: "issued",
      nextStatus: HotelInvoiceStatus.Issued,
      actorRole: "system",
      occurredAt: completedAt,
      notesAr: "تم إصدار الفاتورة اليومية عند أول طلب مكتمل في اليوم.",
      metadata: {
        hotelId: order.hotelId,
        invoiceDate,
      },
    });
  }

  await tx.hotelInvoiceOrderLine.create({
    data: {
      id: `hotel-invoice-line-${order.id}`,
      invoiceId,
      orderId: order.id,
      roomNumber: order.roomNumber ?? null,
      orderSubtotalExVatSar:
        toDecimal(order.hotelFinancialSnapshot.subtotalExVatSar) ?? new Prisma.Decimal(0),
      orderVatAmountSar: toDecimal(order.hotelFinancialSnapshot.vatAmountSar) ?? new Prisma.Decimal(0),
      orderTotalIncVatSar:
        toDecimal(order.hotelFinancialSnapshot.totalIncVatSar) ?? new Prisma.Decimal(0),
    },
  });

  const lines = await tx.hotelInvoiceOrderLine.findMany({
    where: { invoiceId },
    orderBy: { orderId: "asc" },
  });
  const totals = lines.reduce(
    (accumulator, line) => ({
      orderCount: accumulator.orderCount + 1,
      subtotalExVatSar:
        accumulator.subtotalExVatSar + (toNumber(line.orderSubtotalExVatSar) ?? 0),
      vatAmountSar: accumulator.vatAmountSar + (toNumber(line.orderVatAmountSar) ?? 0),
      totalIncVatSar:
        accumulator.totalIncVatSar + (toNumber(line.orderTotalIncVatSar) ?? 0),
    }),
    {
      orderCount: 0,
      subtotalExVatSar: 0,
      vatAmountSar: 0,
      totalIncVatSar: 0,
    },
  );

  const invoice = await tx.hotelInvoice.update({
    where: { id: invoiceId },
    data: {
      orderCount: totals.orderCount,
      subtotalExVatSar: toDecimal(roundFinanceAmount(totals.subtotalExVatSar)) ?? new Prisma.Decimal(0),
      vatAmountSar: toDecimal(roundFinanceAmount(totals.vatAmountSar)) ?? new Prisma.Decimal(0),
      totalIncVatSar: toDecimal(roundFinanceAmount(totals.totalIncVatSar)) ?? new Prisma.Decimal(0),
      updatedAt: new Date(completedAt),
    },
  });

  return mapHotelInvoiceRecordToDomain(invoice, lines);
};

const ensureProviderStatementForCompletedOrderTx = async (
  tx: PrismaTx,
  order: LaundryOrder,
  completedAt: string,
): Promise<ProviderSettlementStatement> => {
  if (!order.providerId || !order.providerFinancialSnapshot) {
    throw new Error("تعذر إنشاء كشف مستحقات المزوّد قبل تثبيت اللقطة المالية الخاصة به.");
  }

  const existingLine = await tx.providerStatementOrderLine.findUnique({
    where: { orderId: order.id },
  });

  if (existingLine) {
    const statement = await tx.providerStatement.findUniqueOrThrow({
      where: { id: existingLine.statementId },
    });
    const lines = await tx.providerStatementOrderLine.findMany({
      where: { statementId: existingLine.statementId },
      orderBy: { orderId: "asc" },
    });

    return mapProviderStatementRecordToDomain(statement, lines);
  }

  const statementDate = buildDailyFinanceDateKey(completedAt);
  const statementId = buildProviderStatementId(order.providerId, statementDate);
  const existingStatement = await tx.providerStatement.findUnique({
    where: { id: statementId },
  });

  if (!existingStatement) {
    const provider = await ensureProviderOperationalAccessTx(tx, order.providerId);
    await tx.providerStatement.create({
      data: {
        id: statementId,
        statementNumber: buildProviderStatementNumber(order.providerId, statementDate),
        providerId: order.providerId,
        statementDate,
        currencyCode: "SAR",
        status: ProviderStatementStatus.PendingPayment,
        orderCount: 0,
        subtotalExVatSar: new Prisma.Decimal(0),
        vatAmountSar: new Prisma.Decimal(0),
        totalIncVatSar: new Prisma.Decimal(0),
        providerJson: toJsonInput(buildProviderFinancePartySnapshot(provider)),
        createdAt: new Date(completedAt),
        updatedAt: new Date(completedAt),
      },
    });
    await recordFinanceAuditEventTx({
      tx,
      entityType: "provider_statement",
      entityId: statementId,
      action: "pending_payment",
      nextStatus: ProviderStatementStatus.PendingPayment,
      actorRole: "system",
      occurredAt: completedAt,
      notesAr: "تم إنشاء كشف مستحقات يومي جديد بانتظار السداد.",
      metadata: {
        providerId: order.providerId,
        statementDate,
      },
    });
  }

  await tx.providerStatementOrderLine.create({
    data: {
      id: `provider-statement-line-${order.id}`,
      statementId,
      orderId: order.id,
      roomNumber: order.roomNumber ?? null,
      providerSubtotalExVatSar:
        toDecimal(order.providerFinancialSnapshot.subtotalExVatSar) ?? new Prisma.Decimal(0),
      providerVatAmountSar:
        toDecimal(order.providerFinancialSnapshot.vatAmountSar) ?? new Prisma.Decimal(0),
      providerTotalIncVatSar:
        toDecimal(order.providerFinancialSnapshot.totalIncVatSar) ?? new Prisma.Decimal(0),
    },
  });

  const lines = await tx.providerStatementOrderLine.findMany({
    where: { statementId },
    orderBy: { orderId: "asc" },
  });
  const totals = lines.reduce(
    (accumulator, line) => ({
      orderCount: accumulator.orderCount + 1,
      subtotalExVatSar:
        accumulator.subtotalExVatSar + (toNumber(line.providerSubtotalExVatSar) ?? 0),
      vatAmountSar: accumulator.vatAmountSar + (toNumber(line.providerVatAmountSar) ?? 0),
      totalIncVatSar:
        accumulator.totalIncVatSar + (toNumber(line.providerTotalIncVatSar) ?? 0),
    }),
    {
      orderCount: 0,
      subtotalExVatSar: 0,
      vatAmountSar: 0,
      totalIncVatSar: 0,
    },
  );

  const statement = await tx.providerStatement.update({
    where: { id: statementId },
    data: {
      orderCount: totals.orderCount,
      subtotalExVatSar: toDecimal(roundFinanceAmount(totals.subtotalExVatSar)) ?? new Prisma.Decimal(0),
      vatAmountSar: toDecimal(roundFinanceAmount(totals.vatAmountSar)) ?? new Prisma.Decimal(0),
      totalIncVatSar: toDecimal(roundFinanceAmount(totals.totalIncVatSar)) ?? new Prisma.Decimal(0),
      updatedAt: new Date(completedAt),
    },
  });

  return mapProviderStatementRecordToDomain(statement, lines);
};

const finalizeCompletedOrderFinancialsTx = async (
  tx: PrismaTx,
  order: LaundryOrder,
  completedAt?: string,
): Promise<LaundryOrder> => {
  if (order.status !== OrderStatus.Completed) {
    return order;
  }

  const lockedAt = completedAt ?? order.statusUpdatedAt;
  const hotelFinancialSnapshot =
    order.hotelFinancialSnapshot ?? buildHotelFinancialSnapshotForOrder(order, lockedAt);
  const providerFinancialSnapshot =
    order.providerFinancialSnapshot ?? (await buildProviderFinancialSnapshotForOrderTx(tx, order, lockedAt));

  await tx.order.update({
    where: { id: order.id },
    data: {
      hotelFinancialSnapshotJson: toJsonInput(hotelFinancialSnapshot),
      providerFinancialSnapshotJson: toJsonInput(providerFinancialSnapshot),
      billedAt: order.billedAt ? new Date(order.billedAt) : new Date(lockedAt),
      updatedAt: new Date(lockedAt),
    },
  });

  const orderWithSnapshots: LaundryOrder = {
    ...order,
    hotelFinancialSnapshot,
    providerFinancialSnapshot,
    billedAt: order.billedAt ?? lockedAt,
    updatedAt: lockedAt,
  };
  const hotelInvoice = await ensureHotelInvoiceForCompletedOrderTx(tx, orderWithSnapshots, lockedAt);
  const providerStatement = await ensureProviderStatementForCompletedOrderTx(tx, orderWithSnapshots, lockedAt);

  await tx.order.update({
    where: { id: order.id },
    data: {
      hotelInvoiceId: hotelInvoice.id,
      providerStatementId: providerStatement.id,
      billedAt: new Date(orderWithSnapshots.billedAt ?? lockedAt),
    },
  });

  return loadOrderOrThrowTx(tx, order.id);
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
      authMode: "session",
      publicAppUrl: "http://localhost:8080",
    } satisfies PlatformRuntimeStatus);
  const objectStorage: WashoffObjectStorage =
    options.storageMode === "filesystem"
      ? createFilesystemWashoffObjectStorage({
          rootPath: options.storageRootPath,
          signingSecret: options.signingSecret ?? "washoff-dev-signing-secret",
          signedUrlTtlSeconds: options.storageSignedUrlTtlSeconds ?? 15 * 60,
        })
      : createDatabaseWashoffObjectStorage({
          prisma,
          signingSecret: options.signingSecret ?? "washoff-dev-signing-secret",
          signedUrlTtlSeconds: options.storageSignedUrlTtlSeconds ?? 15 * 60,
        });
  const pdfFontPath = options.pdfFontPath;
  let operationQueue = Promise.resolve<void>(undefined);

  const enqueue = async <Value>(operation: () => Promise<Value>) => {
    const nextOperation = operationQueue.then(operation, operation);
    operationQueue = nextOperation.then(
      () => undefined,
      () => undefined,
    );
    return nextOperation;
  };

  const storeObjectTx = async (
    tx: PrismaTx,
    input: Parameters<NonNullable<WashoffObjectStorage["storeObjectTx"]>>[1],
  ) => {
    if (objectStorage.storeObjectTx) {
      return objectStorage.storeObjectTx(tx, input);
    }

    return objectStorage.storeObject(input);
  };

  const storeHotelRegistrationDocumentReferenceTx = async ({
    tx,
    hotelId,
    kind,
    file,
    uploadedAt,
  }: {
    tx: PrismaTx;
    hotelId: string;
    kind: HotelRegistrationDocumentKind;
    file: HotelRegistrationDocumentUploadInput;
    uploadedAt: string;
  }): Promise<HotelRegistrationStoredDocumentReference> => {
    const validatedFile = validateHotelRegistrationDocumentUpload({ file, kind });
    const storedObject = await storeObjectTx(tx, {
      logicalBucket: `hotel-registration/${kind}`,
      fileName: file.fileName,
      mimeType: validatedFile.mimeType,
      contentBytes: validatedFile.buffer,
      createdAt: uploadedAt,
      metadataJson: toJsonInput({
        entityType: "hotel",
        entityId: hotelId,
        kind,
      }),
    });

    return {
      kind,
      fileName: file.fileName.trim(),
      mimeType: validatedFile.mimeType,
      sizeBytes: validatedFile.sizeBytes,
      uploadedAt,
      storageKey: storedObject.id,
      downloadPath: buildHotelDocumentDownloadPath(hotelId, kind),
    };
  };

  const storeProviderRegistrationDocumentReferenceTx = async ({
    tx,
    providerId,
    file,
    uploadedAt,
  }: {
    tx: PrismaTx;
    providerId: string;
    file: ProviderRegistrationDocumentUploadInput;
    uploadedAt: string;
  }): Promise<ProviderRegistrationStoredDocumentReference> => {
    const validatedFile = validateProviderRegistrationDocumentUpload(file);
    const storedObject = await storeObjectTx(tx, {
      logicalBucket: "provider-registration/commercial_registration",
      fileName: file.fileName,
      mimeType: validatedFile.mimeType,
      contentBytes: validatedFile.buffer,
      createdAt: uploadedAt,
      metadataJson: toJsonInput({
        entityType: "provider",
        entityId: providerId,
        kind: "commercial_registration",
      }),
    });

    return {
      kind: "commercial_registration",
      fileName: file.fileName.trim(),
      mimeType: validatedFile.mimeType,
      sizeBytes: validatedFile.sizeBytes,
      uploadedAt,
      storageKey: storedObject.id,
      downloadPath: buildProviderDocumentDownloadPath(providerId),
    };
  };

  const buildHotelInvoicePdfReference = (invoice: HotelInvoice, objectId: string, qrPayloadAr: string) => ({
    objectId,
    generatedAt: invoice.updatedAt,
    qrPayloadAr,
    downloadPath: objectStorage.createSignedDownloadPath({
      objectId,
      fileName: `${invoice.invoiceNumber}.pdf`,
      purpose: `hotel-invoice-${invoice.id}`,
    }),
  });

  const buildProviderStatementPdfReference = (
    statement: ProviderSettlementStatement,
    objectId: string,
    qrPayloadAr: string,
  ) => ({
    objectId,
    generatedAt: statement.updatedAt,
    qrPayloadAr,
    downloadPath: objectStorage.createSignedDownloadPath({
      objectId,
      fileName: `${statement.statementNumber}.pdf`,
      purpose: `provider-statement-${statement.id}`,
    }),
  });

  const syncHotelInvoicePdfTx = async (tx: PrismaTx, invoice: HotelInvoice) => {
    const existingInvoice = await tx.hotelInvoice.findUniqueOrThrow({
      where: { id: invoice.id },
      select: { pdfObjectId: true },
    });
    const generatedPdf = await generateHotelInvoicePdf({
      invoice,
      pdfFontPath,
    });
    const storedObject = await storeObjectTx(tx, {
      objectId: existingInvoice.pdfObjectId ?? undefined,
      logicalBucket: "finance/hotel-invoices",
      fileName: generatedPdf.fileName,
      mimeType: generatedPdf.mimeType,
      contentBytes: generatedPdf.bytes,
      createdAt: invoice.updatedAt,
      metadataJson: toJsonInput({
        entityType: "hotel_invoice",
        entityId: invoice.id,
        qrPayloadAr: generatedPdf.qrPayloadAr,
      }),
    });

    if (existingInvoice.pdfObjectId !== storedObject.id) {
      await tx.hotelInvoice.update({
        where: { id: invoice.id },
        data: {
          pdfObjectId: storedObject.id,
          updatedAt: new Date(invoice.updatedAt),
        },
      });
    }

    return {
      ...invoice,
      pdf: buildHotelInvoicePdfReference(invoice, storedObject.id, generatedPdf.qrPayloadAr),
    };
  };

  const syncProviderStatementPdfTx = async (
    tx: PrismaTx,
    statement: ProviderSettlementStatement,
  ) => {
    const existingStatement = await tx.providerStatement.findUniqueOrThrow({
      where: { id: statement.id },
      select: { pdfObjectId: true },
    });
    const generatedPdf = await generateProviderStatementPdf({
      statement,
      pdfFontPath,
    });
    const storedObject = await storeObjectTx(tx, {
      objectId: existingStatement.pdfObjectId ?? undefined,
      logicalBucket: "finance/provider-statements",
      fileName: generatedPdf.fileName,
      mimeType: generatedPdf.mimeType,
      contentBytes: generatedPdf.bytes,
      createdAt: statement.updatedAt,
      metadataJson: toJsonInput({
        entityType: "provider_statement",
        entityId: statement.id,
        qrPayloadAr: generatedPdf.qrPayloadAr,
      }),
    });

    if (existingStatement.pdfObjectId !== storedObject.id) {
      await tx.providerStatement.update({
        where: { id: statement.id },
        data: {
          pdfObjectId: storedObject.id,
          updatedAt: new Date(statement.updatedAt),
        },
      });
    }

    return {
      ...statement,
      pdf: buildProviderStatementPdfReference(
        statement,
        storedObject.id,
        generatedPdf.qrPayloadAr,
      ),
    };
  };

  const hydrateHotelInvoicePdfReferencesTx = async (tx: PrismaTx, invoices: HotelInvoice[]) => {
    if (invoices.length === 0) {
      return invoices;
    }

    const pdfMappings = await tx.hotelInvoice.findMany({
      where: {
        id: {
          in: invoices.map((invoice) => invoice.id),
        },
      },
      select: {
        id: true,
        pdfObjectId: true,
      },
    });
    const pdfObjectIdByInvoiceId = new Map(
      pdfMappings
        .filter((entry) => entry.pdfObjectId)
        .map((entry) => [entry.id, entry.pdfObjectId as string]),
    );

    return invoices.map((invoice) => {
      const objectId = pdfObjectIdByInvoiceId.get(invoice.id);

      return objectId
        ? {
            ...invoice,
            pdf: buildHotelInvoicePdfReference(invoice, objectId, `رقم الفاتورة: ${invoice.invoiceNumber}`),
          }
        : invoice;
    });
  };

  const hydrateProviderStatementPdfReferencesTx = async (
    tx: PrismaTx,
    statements: ProviderSettlementStatement[],
  ) => {
    if (statements.length === 0) {
      return statements;
    }

    const pdfMappings = await tx.providerStatement.findMany({
      where: {
        id: {
          in: statements.map((statement) => statement.id),
        },
      },
      select: {
        id: true,
        pdfObjectId: true,
      },
    });
    const pdfObjectIdByStatementId = new Map(
      pdfMappings
        .filter((entry) => entry.pdfObjectId)
        .map((entry) => [entry.id, entry.pdfObjectId as string]),
    );

    return statements.map((statement) => {
      const objectId = pdfObjectIdByStatementId.get(statement.id);

      return objectId
        ? {
            ...statement,
            pdf: buildProviderStatementPdfReference(
              statement,
              objectId,
              `رقم الكشف: ${statement.statementNumber}`,
            ),
          }
        : statement;
    });
  };

  const recordFinanceAuditEventTx = async ({
    tx,
    entityType,
    entityId,
    action,
    previousStatus,
    nextStatus,
    actorAccountId,
    actorRole,
    occurredAt,
    notesAr,
    metadata,
  }: {
    tx: PrismaTx;
    entityType: "hotel_invoice" | "provider_statement";
    entityId: string;
    action: "issued" | "collected" | "pending_payment" | "paid";
    previousStatus?: string;
    nextStatus: string;
    actorAccountId?: string;
    actorRole?: AccountRole | "system";
    occurredAt: string;
    notesAr?: string;
    metadata?: Record<string, unknown>;
  }) => {
    await tx.financeAuditEvent.create({
      data: {
        id: `finance-audit-${entityType}-${entityId}-${action}-${occurredAt}`,
        entityType,
        entityId,
        action,
        previousStatus: previousStatus ?? null,
        nextStatus,
        actorAccountId: actorAccountId ?? null,
        actorRole: actorRole ?? null,
        notesAr: notesAr ?? null,
        metadataJson: metadata ? toJsonInput(metadata) : Prisma.JsonNull,
        occurredAt: new Date(occurredAt),
      },
    });
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
        await ensurePlatformServiceCatalogSeededTx(tx);
        await ensureLegacyProviderMatrixOfferingsSeededTx(tx);

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
              sellerLegalNameAr: command.sellerLegalNameAr,
              sellerVatNumber: command.sellerVatNumber,
              sellerAddressAr: command.sellerAddressAr,
              sellerCityAr: command.sellerCityAr,
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
          const commercialRegistrationFile = await storeHotelRegistrationDocumentReferenceTx({
            tx,
            hotelId,
            kind: "commercial_registration",
            file: validatedInput.commercialRegistrationFile,
            uploadedAt: timestamp,
          });
          const delegationLetterFile = validatedInput.delegationLetterFile
            ? await storeHotelRegistrationDocumentReferenceTx({
                tx,
                hotelId,
                kind: "delegation_letter",
                file: validatedInput.delegationLetterFile,
                uploadedAt: timestamp,
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
          await ensureHotelContractPricesForHotelTx(tx, hotelId, timestamp);
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
          const catalog = await loadPlatformCatalogTx(tx);
          const validatedInput = validateProviderServiceCatalogRegistrationInput(input, catalog);
          const normalizedEmail = await ensureUniqueAccountEmailTx(tx, validatedInput.accountEmail);
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
          const commercialRegistrationFile = await storeProviderRegistrationDocumentReferenceTx({
            tx,
            providerId,
            file: validatedInput.commercialRegistrationFile,
            uploadedAt: timestamp,
          });
          await tx.provider.create({
            data: {
              id: providerId,
              code: `PRV-REG-${String(nextNumber).padStart(3, "0")}`,
              legalNameAr: validatedInput.legalEntityName ?? validatedInput.providerName,
              legalNameEn: null,
              displayNameAr: validatedInput.providerName,
              displayNameEn: null,
              countryCode: "SA",
              city: validatedInput.city,
              district: null,
              line1: validatedInput.addressText,
              postalCode: null,
              latitude: toDecimal(validatedInput.latitude),
              longitude: toDecimal(validatedInput.longitude),
              timezone: "Asia/Riyadh",
              contactName: validatedInput.accountFullName,
              contactEmail: normalizedEmail,
              contactPhone: validatedInput.accountPhone,
              serviceAreaCitiesJson: toJsonInput([validatedInput.city]),
              legalEntityName: validatedInput.legalEntityName ?? null,
              businessPhone: validatedInput.businessPhone,
              businessEmail: validatedInput.businessEmail,
              addressText: validatedInput.addressText,
              taxRegistrationNumber: validatedInput.taxRegistrationNumber,
              commercialRegistrationNumber: validatedInput.commercialRegistrationNumber,
              commercialRegistrationFileJson: toJsonInput(commercialRegistrationFile),
              otherServicesText: null,
              pickupLeadTimeHours: validatedInput.pickupLeadTimeHours,
              executionTimeHours: validatedInput.executionTimeHours,
              deliveryTimeHours: validatedInput.deliveryTimeHours,
              workingDaysJson: toJsonInput(validatedInput.workingDays),
              workingHoursFrom: validatedInput.workingHoursFrom,
              workingHoursTo: validatedInput.workingHoursTo,
              bankName: validatedInput.bankName,
              iban: validatedInput.iban,
              bankAccountHolderName: validatedInput.bankAccountHolderName,
              accountSetupName: validatedInput.accountFullName,
              accountSetupPhone: validatedInput.accountPhone,
              accountSetupEmail: normalizedEmail,
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
              fullName: validatedInput.accountFullName,
              email: normalizedEmail,
              phone: validatedInput.accountPhone,
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
          const capabilities = buildProviderCapabilityRowsForRegistration({
            providerId,
            pricingInput: validatedInput.servicePricing,
            city: validatedInput.city,
            dailyCapacityKg: validatedInput.dailyCapacityKg,
            pickupLeadTimeHours: validatedInput.pickupLeadTimeHours,
            workingHoursFrom: validatedInput.workingHoursFrom,
            workingHoursTo: validatedInput.workingHoursTo,
            matrixRows: catalog.matrixRows,
            timestamp,
          });
          await tx.providerCapability.createMany({
            data: capabilities.map((capability) => ({
              providerId: capability.providerId,
              serviceId: capability.serviceId,
              serviceNameAr: capability.serviceNameAr,
              serviceNameEn: capability.serviceNameEn,
              active: capability.active,
              unitPriceSar: toDecimal(capability.unitPriceSar) ?? new Prisma.Decimal(0),
              maxDailyKg: toDecimal(capability.maxDailyKg) ?? new Prisma.Decimal(0),
              maxSingleOrderKg: toDecimal(capability.maxSingleOrderKg) ?? new Prisma.Decimal(0),
              rushSupported: capability.rushSupported,
              supportedCityCodesJson: capability.supportedCityCodesJson,
              defaultTurnaroundHours: capability.defaultTurnaroundHours,
              minimumPickupLeadHours: capability.minimumPickupLeadHours,
              pickupWindowStartHour: capability.pickupWindowStartHour,
              pickupWindowEndHour: capability.pickupWindowEndHour,
              currentApprovedPriceSar:
                capability.currentApprovedPriceSar === null
                  ? null
                  : toDecimal(capability.currentApprovedPriceSar),
              currentStatus: capability.currentStatus,
              proposedPriceSar:
                capability.proposedPriceSar === null ? null : toDecimal(capability.proposedPriceSar),
              proposedStatus: capability.proposedStatus,
              proposedSubmittedAt: capability.proposedSubmittedAt,
              approvedAt: capability.approvedAt,
              approvedByAccountId: capability.approvedByAccountId,
              approvedByRole: capability.approvedByRole,
              rejectionReasonAr: capability.rejectionReasonAr,
              activeMatrix: capability.activeMatrix,
              availableMatrix: capability.availableMatrix,
              createdAt: capability.createdAt,
              updatedAt: capability.updatedAt,
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
    listServiceCatalog: (hotelId?: string) =>
      withDatabase((tx) => loadServicesTx(tx, hotelId), { processExpiries: false }),

    getPlatformServiceCatalogAdminData: () =>
      withDatabase((tx) => loadPlatformCatalogTx(tx), { processExpiries: false }),

    upsertPlatformProduct: (command) =>
      withDatabase(
        async (tx) => {
          const timestamp = new Date().toISOString();
          const normalizedName = requireTextField(command.nameAr, "Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬");

          if (command.id) {
            const existing = await tx.platformProduct.findUnique({
              where: { id: command.id },
            });

            if (!existing) {
              throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.");
            }

            const updated = await tx.platformProduct.update({
              where: { id: command.id },
              data: {
                nameAr: normalizedName,
                active: command.active,
                updatedAt: new Date(timestamp),
              },
            });

            for (const serviceType of DEFAULT_PLATFORM_SERVICE_CATALOG.serviceTypes) {
              const localizedName = buildServiceCatalogItemName(normalizedName, serviceType.code);
              const localizedDescription = buildServiceCatalogItemDescription(
                normalizedName,
                serviceType.code,
              );

              await tx.service.updateMany({
                where: {
                  productId: updated.id,
                  serviceType: serviceType.code,
                },
                data: {
                  nameAr: localizedName.ar,
                  nameEn: localizedName.en ?? null,
                  descriptionAr: localizedDescription.ar,
                  descriptionEn: localizedDescription.en ?? null,
                  updatedAt: new Date(timestamp),
                },
              });
            }

            return {
              id: updated.id,
              code: updated.code,
              name: {
                ar: updated.nameAr,
                en: updated.nameEn ?? undefined,
              },
              active: updated.active,
              sortOrder: updated.sortOrder,
              createdAt: updated.createdAt.toISOString(),
              updatedAt: updated.updatedAt.toISOString(),
            };
          }

          const products = await tx.platformProduct.findMany({
            select: {
              sortOrder: true,
            },
          });
          const nextSortOrder =
            products.reduce((currentMax, product) => Math.max(currentMax, product.sortOrder), 0) + 1;
          const productCode = `custom_product_${nextSortOrder}`;
          const productId = `product-${productCode}`;

          const created = await tx.platformProduct.create({
            data: {
              id: productId,
              code: productCode,
              nameAr: normalizedName,
              nameEn: null,
              active: command.active,
              sortOrder: nextSortOrder,
              createdAt: new Date(timestamp),
              updatedAt: new Date(timestamp),
            },
          });

          const nextMatrixSortOrder =
            (await tx.service.aggregate({
              _max: {
                sortOrder: true,
              },
              where: {
                productId: {
                  not: null,
                },
              },
            }))._max.sortOrder ?? 0;

          for (const [index, serviceType] of DEFAULT_PLATFORM_SERVICE_CATALOG.serviceTypes.entries()) {
            const localizedName = buildServiceCatalogItemName(normalizedName, serviceType.code);
            const localizedDescription = buildServiceCatalogItemDescription(
              normalizedName,
              serviceType.code,
            );

            await tx.service.create({
              data: {
                id: `svc-${productCode}-${serviceType.code}`,
                code: `svc_${productCode}_${serviceType.code}`,
                nameAr: localizedName.ar,
                nameEn: localizedName.en ?? null,
                descriptionAr: localizedDescription.ar,
                descriptionEn: localizedDescription.en ?? null,
                category: mapServiceTypeToCategory(serviceType.code),
                billingUnit: ServiceBillingUnit.Piece,
                defaultUnitPriceSar: new Prisma.Decimal(0),
                defaultTurnaroundHours: getDefaultTurnaroundHoursForServiceType(serviceType.code),
                supportsRush: getDefaultRushSupportForServiceType(serviceType.code),
                active: false,
                productId,
                serviceType: serviceType.code,
                pricingUnit: ServicePricingUnit.Piece,
                suggestedPriceSar: null,
                isAvailable: false,
                sortOrder: nextMatrixSortOrder + index + 1,
                createdAt: new Date(timestamp),
                updatedAt: new Date(timestamp),
              },
            });
          }

          return {
            id: created.id,
            code: created.code,
            name: {
              ar: created.nameAr,
              en: created.nameEn ?? undefined,
            },
            active: created.active,
            sortOrder: created.sortOrder,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
          };
        },
        { processExpiries: false },
      ),

    updatePlatformServiceMatrix: (command) =>
      withDatabase(
        async (tx) => {
          const existing = await tx.service.findUnique({
            where: { id: command.matrixRowId },
          });

          if (!existing || !existing.productId || !existing.serviceType) {
            throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ ØµÙ Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ù‚ÙŠØ§Ø³ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.");
          }

          const timestamp = new Date().toISOString();
          const nextIsAvailable = command.isAvailable ?? existing.isAvailable;
          const nextActive = command.active ?? existing.active;
          const nextSuggestedPrice =
            command.suggestedPriceSar === undefined
              ? toNumber(existing.suggestedPriceSar)
              : requirePositiveNumberField(command.suggestedPriceSar, "Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø§Ø³ØªØ±Ø´Ø§Ø¯ÙŠ");

          await tx.service.update({
            where: { id: command.matrixRowId },
            data: {
              active: nextActive,
              isAvailable: nextIsAvailable,
              suggestedPriceSar: nextIsAvailable ? toDecimal(nextSuggestedPrice) : null,
              defaultUnitPriceSar: nextIsAvailable
                ? toDecimal(nextSuggestedPrice ?? toNumber(existing.defaultUnitPriceSar) ?? 0) ??
                  existing.defaultUnitPriceSar
                : existing.defaultUnitPriceSar,
              updatedAt: new Date(timestamp),
            },
          });

          await tx.providerCapability.updateMany({
            where: { serviceId: command.matrixRowId },
            data: {
              activeMatrix: nextActive,
              availableMatrix: nextIsAvailable,
              updatedAt: new Date(timestamp),
            },
          });

          const catalog = await loadPlatformCatalogTx(tx);
          const updatedRow = catalog.matrixRows.find((row) => row.id === command.matrixRowId);

          if (!updatedRow) {
            throw new Error("ØªØ¹Ø°Ø± Ø§Ø³ØªØ¹Ø§Ø¯Ø© ØµÙ Ø§Ù„Ø®Ø¯Ù…Ø© Ø¨Ø¹Ø¯ Ø§Ù„ØªØ­Ø¯ÙŠØ«.");
          }

          return updatedRow;
        },
        { processExpiries: false },
      ),

    getProviderServiceManagement: (providerId = DEFAULT_PROVIDER_ID) =>
      withDatabase(
        (tx) => loadProviderServiceManagementTx(tx, providerId),
        { processExpiries: false },
      ),

    submitProviderServicePricing: ({ providerId = DEFAULT_PROVIDER_ID, offerings }) =>
      withDatabase(
        async (tx) => {
          const [provider, catalog] = await Promise.all([
            loadProvidersTx(tx, [providerId]).then((entries) => entries[0]),
            loadPlatformCatalogTx(tx),
          ]);

          if (!provider) {
            throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù…Ù„Ù Ø§Ù„Ù…Ø²ÙˆÙ‘Ø¯.");
          }

          const normalizedOfferings = normalizeProviderServicePricingEntries(
            offerings,
            catalog.matrixRows,
          );
          const timestamp = new Date().toISOString();
          const maxDailyKg = provider.currentCapacity.totalKg;
          const maxSingleOrderKg = Math.max(Math.round(maxDailyKg * 0.3), 25);
          const pickupWindowStartHour = parseWorkingHourForProviderCapability(
            provider.operatingProfile.workingHoursFrom,
            8,
          );
          const pickupWindowEndHour = parseWorkingHourForProviderCapability(
            provider.operatingProfile.workingHoursTo,
            22,
          );
          const matrixById = new Map(catalog.matrixRows.map((row) => [row.id, row]));

          for (const entry of normalizedOfferings) {
            const matrixRow = matrixById.get(entry.serviceId);

            if (!matrixRow) {
              continue;
            }

            const serviceType = matrixRow.serviceTypeId as PlatformServiceTypeCode;
            const compositeKey = {
              providerId_serviceId: {
                providerId,
                serviceId: entry.serviceId,
              },
            } as const;
            const existing = await tx.providerCapability.findUnique({
              where: compositeKey,
            });

            if (existing) {
              await tx.providerCapability.update({
                where: compositeKey,
                data: {
                  unitPriceSar:
                    existing.currentApprovedPriceSar ??
                    toDecimal(entry.proposedPriceSar) ??
                    existing.unitPriceSar,
                  maxDailyKg: toDecimal(maxDailyKg) ?? existing.maxDailyKg,
                  maxSingleOrderKg:
                    toDecimal(maxSingleOrderKg) ?? existing.maxSingleOrderKg,
                  rushSupported: getDefaultRushSupportForServiceType(serviceType),
                  supportedCityCodesJson: toJsonInput([provider.address.city]),
                  defaultTurnaroundHours: getDefaultTurnaroundHoursForServiceType(serviceType),
                  minimumPickupLeadHours: provider.operatingProfile.pickupLeadTimeHours,
                  pickupWindowStartHour,
                  pickupWindowEndHour,
                  proposedPriceSar: toDecimal(entry.proposedPriceSar),
                  proposedStatus: ProviderServiceProposalStatus.PendingApproval,
                  proposedSubmittedAt: new Date(timestamp),
                  rejectionReasonAr: null,
                  activeMatrix: matrixRow.active,
                  availableMatrix: matrixRow.isAvailable,
                  updatedAt: new Date(timestamp),
                },
              });
              continue;
            }

            const [createdCapability] = buildProviderCapabilityRowsForRegistration({
              providerId,
              pricingInput: [entry],
              city: provider.address.city,
              dailyCapacityKg: maxDailyKg,
              pickupLeadTimeHours: provider.operatingProfile.pickupLeadTimeHours,
              workingHoursFrom: provider.operatingProfile.workingHoursFrom,
              workingHoursTo: provider.operatingProfile.workingHoursTo,
              matrixRows: catalog.matrixRows,
              timestamp,
            });

            await tx.providerCapability.create({
              data: {
                providerId: createdCapability.providerId,
                serviceId: createdCapability.serviceId,
                serviceNameAr: createdCapability.serviceNameAr,
                serviceNameEn: createdCapability.serviceNameEn,
                active: createdCapability.active,
                unitPriceSar: toDecimal(createdCapability.unitPriceSar) ?? new Prisma.Decimal(0),
                maxDailyKg: toDecimal(createdCapability.maxDailyKg) ?? new Prisma.Decimal(0),
                maxSingleOrderKg:
                  toDecimal(createdCapability.maxSingleOrderKg) ?? new Prisma.Decimal(0),
                rushSupported: createdCapability.rushSupported,
                supportedCityCodesJson: createdCapability.supportedCityCodesJson,
                defaultTurnaroundHours: createdCapability.defaultTurnaroundHours,
                minimumPickupLeadHours: createdCapability.minimumPickupLeadHours,
                pickupWindowStartHour: createdCapability.pickupWindowStartHour,
                pickupWindowEndHour: createdCapability.pickupWindowEndHour,
                currentApprovedPriceSar: null,
                currentStatus: createdCapability.currentStatus,
                proposedPriceSar:
                  toDecimal(createdCapability.proposedPriceSar) ?? new Prisma.Decimal(0),
                proposedStatus: createdCapability.proposedStatus,
                proposedSubmittedAt: createdCapability.proposedSubmittedAt,
                approvedAt: null,
                approvedByAccountId: null,
                approvedByRole: null,
                rejectionReasonAr: null,
                activeMatrix: createdCapability.activeMatrix,
                availableMatrix: createdCapability.availableMatrix,
                createdAt: createdCapability.createdAt,
                updatedAt: createdCapability.updatedAt,
              },
            });
          }

          return loadProviderServiceManagementTx(tx, providerId);
        },
        { processExpiries: false },
      ),

    getProviderPricingAdminData: () =>
      withDatabase((tx) => loadProviderPricingAdminDataTx(tx), { processExpiries: false }),

    approveProviderServicePricing: (offeringId) =>
      withDatabase(
        async (tx) => {
          const pendingCapabilities = await tx.providerCapability.findMany({
            where: {
              proposedStatus: ProviderServiceProposalStatus.PendingApproval,
            },
          });
          const capability = pendingCapabilities.find(
            (entry) => buildProviderOfferingId(entry.providerId, entry.serviceId) === offeringId,
          );

          if (!capability || capability.proposedPriceSar === null) {
            throw new Error("Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø·Ù„Ø¨ ØªØ³Ø¹ÙŠØ± Ù…Ø¹Ù„Ù‚ Ù„Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¹Ø±Ø¶.");
          }

          const timestamp = new Date().toISOString();
          await tx.providerCapability.update({
            where: {
              providerId_serviceId: {
                providerId: capability.providerId,
                serviceId: capability.serviceId,
              },
            },
            data: {
              active: true,
              unitPriceSar: capability.proposedPriceSar,
              currentApprovedPriceSar: capability.proposedPriceSar,
              currentStatus: PlatformServiceCurrentStatus.Active,
              proposedPriceSar: null,
              proposedStatus: null,
              proposedSubmittedAt: null,
              approvedAt: new Date(timestamp),
              approvedByAccountId: DEFAULT_ADMIN_ACCOUNT_ID,
              approvedByRole: AccountRole.Admin,
              rejectionReasonAr: null,
              updatedAt: new Date(timestamp),
            },
          });

          const provider = (await loadProvidersTx(tx, [capability.providerId]))[0];
          const offering = provider?.serviceOfferings.find((entry) => entry.id === offeringId);

          if (!offering) {
            throw new Error("ØªØ¹Ø°Ø± Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø¹Ø±Ø¶ Ø¨Ø¹Ø¯ Ø§Ø¹ØªÙ…Ø§Ø¯Ù‡.");
          }

          return offering;
        },
        { processExpiries: false },
      ),

    rejectProviderServicePricing: (command) =>
      withDatabase(
        async (tx) => {
          const pendingCapabilities = await tx.providerCapability.findMany({
            where: {
              proposedStatus: ProviderServiceProposalStatus.PendingApproval,
            },
          });
          const capability = pendingCapabilities.find(
            (entry) => buildProviderOfferingId(entry.providerId, entry.serviceId) === command.offeringId,
          );

          if (!capability) {
            throw new Error("Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø·Ù„Ø¨ ØªØ³Ø¹ÙŠØ± Ù…Ø¹Ù„Ù‚ ÙŠÙ…ÙƒÙ† Ø±ÙØ¶Ù‡.");
          }

          const timestamp = new Date().toISOString();
          await tx.providerCapability.update({
            where: {
              providerId_serviceId: {
                providerId: capability.providerId,
                serviceId: capability.serviceId,
              },
            },
            data: {
              proposedStatus: ProviderServiceProposalStatus.Rejected,
              rejectionReasonAr: normalizeOptionalTextField(command.rejectionReasonAr),
              updatedAt: new Date(timestamp),
            },
          });

          const provider = (await loadProvidersTx(tx, [capability.providerId]))[0];
          const offering = provider?.serviceOfferings.find(
            (entry) => entry.id === command.offeringId,
          );

          if (!offering) {
            throw new Error("ØªØ¹Ø°Ø± Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø¹Ø±Ø¶ Ø¨Ø¹Ø¯ Ø±ÙØ¶Ù‡.");
          }

          return offering;
        },
        { processExpiries: false },
      ),

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

    getHotelBillingData: (hotelId = DEFAULT_HOTEL_ID) =>
      withDatabase(async (tx) => {
        const hotel = await ensureHotelOperationalAccessTx(tx, hotelId);
        const invoices = await hydrateHotelInvoicePdfReferencesTx(
          tx,
          await loadHotelInvoicesTx(tx, hotel.id),
        );

        return {
          hotelName: hotel.displayName.ar,
          invoices,
          summary: {
            issuedInvoicesCount: invoices.filter((invoice) => invoice.status === HotelInvoiceStatus.Issued).length,
            collectedInvoicesCount: invoices.filter((invoice) => invoice.status === HotelInvoiceStatus.Collected).length,
            outstandingTotalIncVatSar: roundFinanceAmount(
              invoices
                .filter((invoice) => invoice.status !== HotelInvoiceStatus.Collected)
                .reduce((sum, invoice) => sum + invoice.totalIncVatSar, 0),
            ),
            totalInvoicedIncVatSar: roundFinanceAmount(
              invoices.reduce((sum, invoice) => sum + invoice.totalIncVatSar, 0),
            ),
          },
        };
      }),

    getProviderFinanceData: (providerId = DEFAULT_PROVIDER_ID) =>
      withDatabase(async (tx) => {
        const provider = await ensureProviderOperationalAccessTx(tx, providerId);
        const statements = await hydrateProviderStatementPdfReferencesTx(
          tx,
          await loadProviderStatementsTx(tx, provider.id),
        );

        return {
          providerName: provider.displayName.ar,
          statements,
          summary: {
            pendingStatementsCount: statements.filter(
              (statement) => statement.status === ProviderStatementStatus.PendingPayment,
            ).length,
            paidStatementsCount: statements.filter(
              (statement) => statement.status === ProviderStatementStatus.Paid,
            ).length,
            pendingTotalIncVatSar: roundFinanceAmount(
              statements
                .filter((statement) => statement.status === ProviderStatementStatus.PendingPayment)
                .reduce((sum, statement) => sum + statement.totalIncVatSar, 0),
            ),
            totalEarnedIncVatSar: roundFinanceAmount(
              statements.reduce((sum, statement) => sum + statement.totalIncVatSar, 0),
            ),
          },
        };
      }),

    getAdminFinanceData: () =>
      withDatabase(async (tx) => {
        const [hotelInvoices, providerStatements] = await Promise.all([
          hydrateHotelInvoicePdfReferencesTx(tx, await loadHotelInvoicesTx(tx)),
          hydrateProviderStatementPdfReferencesTx(tx, await loadProviderStatementsTx(tx)),
        ]);
        const todayDateKey = buildDailyFinanceDateKey(new Date().toISOString());
        const summary: AdminFinanceSummary = {
          todayHotelInvoiceTotalIncVatSar: roundFinanceAmount(
            hotelInvoices
              .filter((invoice) => invoice.invoiceDate === todayDateKey)
              .reduce((sum, invoice) => sum + invoice.totalIncVatSar, 0),
          ),
          todayProviderStatementTotalIncVatSar: roundFinanceAmount(
            providerStatements
              .filter((statement) => statement.statementDate === todayDateKey)
              .reduce((sum, statement) => sum + statement.totalIncVatSar, 0),
          ),
          grossMarginExVatSar: roundFinanceAmount(
            hotelInvoices.reduce((sum, invoice) => sum + invoice.subtotalExVatSar, 0) -
              providerStatements.reduce((sum, statement) => sum + statement.subtotalExVatSar, 0),
          ),
          outputVatTotalSar: roundFinanceAmount(
            hotelInvoices.reduce((sum, invoice) => sum + invoice.vatAmountSar, 0),
          ),
          inputVatTotalSar: roundFinanceAmount(
            providerStatements.reduce((sum, statement) => sum + statement.vatAmountSar, 0),
          ),
          netVatPositionSar: roundFinanceAmount(
            hotelInvoices.reduce((sum, invoice) => sum + invoice.vatAmountSar, 0) -
              providerStatements.reduce((sum, statement) => sum + statement.vatAmountSar, 0),
          ),
        };

        return {
          summary,
          hotelInvoices,
          providerStatements,
        };
      }),

    createHotelOrder: (input) =>
      withDatabase(async (tx) => {
        const hotelId = input.hotelId ?? DEFAULT_HOTEL_ID;
        await ensureHotelOperationalAccessTx(tx, hotelId);
        const [hotels, services, providers, existingOrders] = await Promise.all([
          loadHotelsTx(tx),
          loadServicesTx(tx, hotelId),
          loadProvidersTx(tx).then((entries) => entries.filter(isProviderOperationallyApproved)),
          tx.order.findMany({
            select: { id: true },
          }),
        ]);
        const hotel = hotels.find((entry) => entry.id === hotelId);

        if (!hotel) {
          throw new Error("تعذر العثور على ملف الفندق المرتبط بالحساب الحالي.");
        }

        const validatedInput = validateHotelConsoleOrderInput(input, services);
        const orderNumber = selectNextOrderNumber(existingOrders.map((order) => order.id));
        const orderId = `ORD-${orderNumber}`;
        const serviceMap = new Map(services.map((service) => [service.id, service]));
        const items = buildItemizedOrderItems({
          orderId,
          items: validatedInput.items,
          serviceMap,
        });
        const estimatedSubtotalSar = items.reduce(
          (sum, item) => sum + item.estimatedLineTotalSar,
          0,
        );
        if (existingInvoice.status === HotelInvoiceStatus.Collected) {
          throw new Error("تم تحصيل هذه الفاتورة مسبقًا ولا يمكن إعادة تحصيلها.");
        }

        const timestamp = new Date().toISOString();
        const submittedOrder: LaundryOrder = {
          id: orderId,
          hotelId: hotel.id,
          hotelSnapshot: buildHotelSnapshot(hotel),
          roomNumber: validatedInput.roomNumber,
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
            roomNumber: validatedInput.roomNumber,
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

        const completedOrder = await loadOrderOrThrowTx(tx, order.id);
        const finalizedOrder = await finalizeCompletedOrderFinancialsTx(
          tx,
          completedOrder,
          completedOrder.statusUpdatedAt,
        );

        if (finalizedOrder.hotelInvoiceId) {
          const invoice = (
            await loadHotelInvoicesTx(tx, finalizedOrder.hotelId)
          ).find((entry) => entry.id === finalizedOrder.hotelInvoiceId);

          if (invoice) {
            await syncHotelInvoicePdfTx(tx, invoice);
          }
        }

        if (finalizedOrder.providerStatementId && finalizedOrder.providerId) {
          const statement = (
            await loadProviderStatementsTx(tx, finalizedOrder.providerId)
          ).find((entry) => entry.id === finalizedOrder.providerStatementId);

          if (statement) {
            await syncProviderStatementPdfTx(tx, statement);
          }
        }

        return finalizedOrder;
      }),

    markHotelInvoiceCollected: ({ invoiceId, actorAccountId = DEFAULT_ADMIN_ACCOUNT_ID }) =>
      withDatabase(async (tx) => {
        const existingInvoice = await tx.hotelInvoice.findUnique({
          where: { id: invoiceId },
        });

        if (!existingInvoice) {
          throw new Error("Unable to find the requested invoice.");
        }

        if (existingInvoice.status === HotelInvoiceStatus.Collected) {
          throw new Error("This invoice has already been collected and cannot be collected again.");
        }

        const timestamp = new Date().toISOString();
        const updatedInvoice = await tx.hotelInvoice.update({
          where: { id: invoiceId },
          data: {
            status: HotelInvoiceStatus.Collected,
            collectedAt: new Date(timestamp),
            collectedByAccountId: actorAccountId,
            collectedByRole: AccountRole.Admin,
            updatedAt: new Date(timestamp),
          },
        });
        await recordFinanceAuditEventTx({
          tx,
          entityType: "hotel_invoice",
          entityId: invoiceId,
          action: "collected",
          previousStatus: existingInvoice.status,
          nextStatus: HotelInvoiceStatus.Collected,
          actorAccountId,
          actorRole: AccountRole.Admin,
          occurredAt: timestamp,
          notesAr: "تم تحصيل الفاتورة من لوحة الإدارة المالية.",
        });
        const lines = await tx.hotelInvoiceOrderLine.findMany({
          where: { invoiceId },
          orderBy: { orderId: "asc" },
        });

        return syncHotelInvoicePdfTx(tx, mapHotelInvoiceRecordToDomain(updatedInvoice, lines));
      }),

    markProviderStatementPaid: ({ statementId, actorAccountId = DEFAULT_ADMIN_ACCOUNT_ID }) =>
      withDatabase(async (tx) => {
        const existingStatement = await tx.providerStatement.findUnique({
          where: { id: statementId },
        });

        if (!existingStatement) {
          throw new Error("تعذر العثور على كشف مستحقات المزوّد المطلوب.");
        }

        if (existingStatement.status === ProviderStatementStatus.Paid) {
          throw new Error("تم سداد هذا الكشف مسبقًا ولا يمكن إعادة السداد.");
        }

        const timestamp = new Date().toISOString();
        const updatedStatement = await tx.providerStatement.update({
          where: { id: statementId },
          data: {
            status: ProviderStatementStatus.Paid,
            paidAt: new Date(timestamp),
            paidByAccountId: actorAccountId,
            paidByRole: AccountRole.Admin,
            updatedAt: new Date(timestamp),
          },
        });
        await recordFinanceAuditEventTx({
          tx,
          entityType: "provider_statement",
          entityId: statementId,
          action: "paid",
          previousStatus: existingStatement.status,
          nextStatus: ProviderStatementStatus.Paid,
          actorAccountId,
          actorRole: AccountRole.Admin,
          occurredAt: timestamp,
          notesAr: "تم تعليم كشف المستحقات كمسدد من لوحة الإدارة المالية.",
        });
        const lines = await tx.providerStatementOrderLine.findMany({
          where: { statementId },
          orderBy: { orderId: "asc" },
        });
        const paidOrderIds = lines.map((line) => line.orderId);

        if (paidOrderIds.length > 0) {
          await tx.order.updateMany({
            where: {
              id: {
                in: paidOrderIds,
              },
            },
            data: {
              settledAt: new Date(timestamp),
            },
          });
        }

        return syncProviderStatementPdfTx(
          tx,
          mapProviderStatementRecordToDomain(updatedStatement, lines),
        );
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
