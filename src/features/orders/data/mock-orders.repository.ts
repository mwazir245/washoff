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
  accountTokenValidationStatusLabelsAr,
  identityAuditEventTypeLabelsAr,
  passwordResetStateLabelsAr,
  type AccountTokenValidationResult,
  type AccountProfile,
  type AccountSessionProfile,
  type AuthenticatedAccountSession,
  type IdentityAuditEvent,
  type StoredAccount,
  type StoredAccountSession,
} from "@/features/auth/model";
import {
  createOpaqueToken,
  createPasswordDigest,
  hashOpaqueToken,
  verifyPasswordDigest,
} from "@/features/auth/lib/credentials";
import { getStoredClientSessionToken } from "@/features/auth/infrastructure/client-auth-storage";
import {
  buildAllDefaultPlatformContentEntries,
  resolvePlatformPageContent,
  type PlatformContentAuditEntry,
  type PlatformContentEntry,
  type PlatformContentEntryUpdateCommand,
  type PlatformLanguage,
  type PlatformPageContent,
} from "@/features/content/model/platform-content";
import {
  Assignment,
  AssignmentHistory,
  AssignmentStatus,
  buildHotelDocumentDownloadPath,
  canTransitionOrderStatus,
  CreateHotelOrderInput,
  createEmptyScoreBreakdown,
  EligibilityReasonCode,
  getOrderProgressPercent,
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES,
  HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES,
  HotelProfile,
  hotelClassificationLabelsAr,
  HOTEL_REGISTRATION_SAUDI_CITIES_AR,
  hotelServiceLevelLabelsAr,
  HotelRegistrationInput,
  LaundryOrder,
  MatchingCriterion,
  MatchingDecision,
  MatchingLog,
  OnboardingStatus,
  OrderAssignmentMode,
  OrderItem,
  OrderPriority,
  OrderStatus,
  ProviderCapacityStatus,
  ProviderProfile,
  ProviderRegistrationInput,
  providerExecutableOrderStatuses,
  ReassignmentEvent,
  ReassignmentReason,
  ScoreBreakdown,
  ServiceBillingUnit,
  ServiceCatalogItem,
  ServiceCategory,
  Settlement,
  SettlementStatus,
  SLACheckpoint,
  SLAHistory,
  SLAStatus,
  type HotelRegistrationDocumentKind,
  type HotelRegistrationDocumentUploadInput,
  type HotelRegistrationStoredDocumentReference,
  type OrderStatusHistoryEntry,
} from "@/features/orders/model";
import {
  createMatchingRunId,
  evaluateProviderEligibility,
  matchProvidersForOrder,
} from "@/features/orders/services";
import {
  buildPlatformPersistenceSnapshot,
  restorePlatformDomainSnapshot,
} from "@/features/orders/infrastructure/persistence/persistence-mappers";
import type { PlatformPersistenceSnapshot } from "@/features/orders/infrastructure/persistence/persistence-records";
import {
  defaultPlatformSettings,
  type PlatformRuntimeStatus,
  type PlatformSettings,
  type PlatformSettingsAuditEntry,
  type PlatformSettingsUpdateCommand,
} from "@/features/platform-settings/model/platform-settings";

const DEFAULT_HOTEL_ID = "hotel-1";
const DEFAULT_PROVIDER_ID = "provider-1";
const DEFAULT_ADMIN_ACCOUNT_ID = "account-admin-1";
const DEFAULT_PLATFORM_SETTINGS_ID = "platform-settings-default";
const AUTO_ASSIGNMENT_RESPONSE_WINDOW_MINUTES = 30;
const ACCOUNT_SESSION_DURATION_HOURS = 24 * 7;
const ACCOUNT_ACTIVATION_TOKEN_DURATION_HOURS = 72;
const PASSWORD_RESET_TOKEN_DURATION_HOURS = 2;
const AUTH_REQUIRED_ERROR = "يجب تسجيل الدخول بحساب WashOff للوصول إلى هذه الصفحة.";
const ACCOUNT_NOT_ACTIVATED_ERROR = "الحساب غير مفعل بعد. أكمل التفعيل بعد اعتماد الإدارة أولًا.";
const ACCOUNT_SUSPENDED_ERROR = "هذا الحساب موقوف حاليًا. يرجى التواصل مع إدارة WashOff.";
const ACCOUNT_INVALID_CREDENTIALS_ERROR = "بيانات الدخول غير صحيحة أو أن الحساب غير مفعل بعد.";
const ACCOUNT_ACTIVATION_TOKEN_ERROR = "رابط التفعيل غير صالح أو انتهت صلاحيته.";
const HOTEL_ACCOUNT_LINK_ERROR = "الحساب الحالي غير مرتبط بفندق معتمد على المنصة.";
const PROVIDER_ACCOUNT_LINK_ERROR = "الحساب الحالي غير مرتبط بمزوّد معتمد على المنصة.";
const HOTEL_ACCESS_NOT_APPROVED_ERROR =
  "لا يمكن الوصول إلى لوحة الفندق قبل اعتماد طلب التسجيل من الإدارة.";
const PROVIDER_ACCESS_NOT_APPROVED_ERROR =
  "لا يمكن الوصول إلى لوحة المزود قبل اعتماد طلب التسجيل من الإدارة.";
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

const now = Date.now();

const clone = <Value,>(value: Value): Value => {
  return JSON.parse(JSON.stringify(value)) as Value;
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

const buildLocalizedText = (ar: string, en?: string) => ({ ar, en });

const addHours = (fromIso: string, hours: number) => {
  return new Date(new Date(fromIso).getTime() + hours * 60 * 60 * 1000).toISOString();
};

const buildOffsetDate = ({ days = 0, hours = 0, minutes = 0 }) => {
  const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
  return new Date(now + totalMinutes * 60 * 1000).toISOString();
};

const buildApprovedOnboarding = (timestamp: string) => ({
  status: OnboardingStatus.Approved,
  submittedAt: timestamp,
  reviewedAt: timestamp,
  reviewedByRole: "admin" as const,
  reviewedById: "seed-admin",
  reviewNotesAr: "جهة تشغيلية معتمدة ضمن بيانات WashOff الأساسية.",
});

const buildPendingOnboarding = (timestamp: string, reviewNotesAr?: string) => ({
  status: OnboardingStatus.PendingApproval,
  submittedAt: timestamp,
  reviewNotesAr,
});

const buildActivationPath = (token: string) => `/activate-account?token=${encodeURIComponent(token)}`;

const getLinkedEntityId = (account: Pick<StoredAccount, "linkedHotelId" | "linkedProviderId">) => {
  return account.linkedHotelId ?? account.linkedProviderId;
};

const sanitizeAccount = (account: StoredAccount): AccountProfile => ({
  id: account.id,
  fullName: account.fullName,
  email: account.email,
  phone: account.phone,
  role: account.role,
  status: account.status,
  linkedEntityType: account.linkedEntityType,
  linkedHotelId: account.linkedHotelId,
  linkedProviderId: account.linkedProviderId,
  activation: clone(account.activation),
  passwordReset: clone(account.passwordReset),
  suspension: clone(account.suspension),
  lastLoginAt: account.lastLoginAt,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});

const sanitizeAccountSession = (session: StoredAccountSession): AccountSessionProfile => ({
  id: session.id,
  accountId: session.accountId,
  role: session.role,
  linkedEntityType: session.linkedEntityType,
  linkedEntityId: session.linkedEntityId,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
  lastSeenAt: session.lastSeenAt,
  revokedAt: session.revokedAt,
  revokedReasonAr: session.revokedReasonAr,
  revokedByAccountId: session.revokedByAccountId,
  revokedByRole: session.revokedByRole,
});

const buildFutureDate = (fromIso: string, minutes: number) => {
  return new Date(new Date(fromIso).getTime() + minutes * 60 * 1000).toISOString();
};

const getRequestedCapacityKg = (order: Pick<LaundryOrder, "totalItemCount">) => {
  return order.totalItemCount;
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

const updateProviderCapacity = (
  providerId: string,
  updater: (capacity: ProviderProfile["currentCapacity"]) => ProviderProfile["currentCapacity"],
) => {
  const provider = providerProfiles[providerId];

  if (!provider) {
    return;
  }

  providerProfiles = {
    ...providerProfiles,
    [providerId]: {
      ...provider,
      currentCapacity: updater(provider.currentCapacity),
      updatedAt: new Date().toISOString(),
    },
  };
};

const reserveProviderCapacity = (providerId: string, quantityKg: number, timestamp: string) => {
  updateProviderCapacity(providerId, (capacity) => {
    const reservedKg = capacity.reservedKg + quantityKg;
    const availableKg = Math.max(capacity.totalKg - capacity.committedKg - reservedKg, 0);

    return {
      ...capacity,
      reservedKg,
      availableKg,
      utilizationRatio: capacity.totalKg > 0 ? (capacity.committedKg + reservedKg) / capacity.totalKg : 0,
      status: getCapacityStatus(availableKg, capacity.totalKg),
      updatedAt: timestamp,
    };
  });
};

const commitReservedProviderCapacity = (providerId: string, quantityKg: number, timestamp: string) => {
  updateProviderCapacity(providerId, (capacity) => {
    const reservedKg = Math.max(capacity.reservedKg - quantityKg, 0);
    const committedKg = capacity.committedKg + quantityKg;
    const availableKg = Math.max(capacity.totalKg - committedKg - reservedKg, 0);

    return {
      ...capacity,
      committedKg,
      reservedKg,
      availableKg,
      utilizationRatio: capacity.totalKg > 0 ? (committedKg + reservedKg) / capacity.totalKg : 0,
      status: getCapacityStatus(availableKg, capacity.totalKg),
      updatedAt: timestamp,
    };
  });
};

const releaseReservedProviderCapacity = (providerId: string, quantityKg: number, timestamp: string) => {
  updateProviderCapacity(providerId, (capacity) => {
    const reservedKg = Math.max(capacity.reservedKg - quantityKg, 0);
    const availableKg = Math.max(capacity.totalKg - capacity.committedKg - reservedKg, 0);

    return {
      ...capacity,
      reservedKg,
      availableKg,
      utilizationRatio: capacity.totalKg > 0 ? (capacity.committedKg + reservedKg) / capacity.totalKg : 0,
      status: getCapacityStatus(availableKg, capacity.totalKg),
      updatedAt: timestamp,
    };
  });
};

const roundMetric = (value: number, decimals = 3) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const updateProviderPerformance = (
  providerId: string,
  updater: (performance: ProviderProfile["performance"]) => ProviderProfile["performance"],
) => {
  const provider = providerProfiles[providerId];

  if (!provider) {
    return;
  }

  providerProfiles = {
    ...providerProfiles,
    [providerId]: {
      ...provider,
      performance: updater(provider.performance),
      updatedAt: new Date().toISOString(),
    },
  };
};

const applyProviderReliabilityPenalty = (
  providerId: string,
  reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
  timestamp: string,
) => {
  const penalty = RELIABILITY_PENALTIES[reason];

  updateProviderPerformance(providerId, (performance) => ({
    ...performance,
    acceptanceRate: roundMetric(clamp(performance.acceptanceRate - penalty.acceptanceRate, 0, 1)),
    rating: roundMetric(clamp(performance.rating - penalty.rating, 0, 5), 2),
    qualityScore: Math.max(performance.qualityScore - penalty.qualityScore, 0),
    reassignmentRate: roundMetric(clamp(performance.reassignmentRate + penalty.reassignmentRate, 0, 1)),
    lastEvaluatedAt: timestamp,
  }));
};

const normalizePickupAt = (pickupAt: string) => {
  const normalized = new Date(pickupAt);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error("يرجى إدخال موعد استلام صالح.");
  }

  return normalized.toISOString();
};

const buildHotel = (
  id: string,
  code: string,
  nameAr: string,
  city: string,
): HotelProfile => {
  const createdAt = buildOffsetDate({ days: -90 });
  const buildPreviewDocumentReference = (
    kind: HotelRegistrationDocumentKind,
  ): HotelRegistrationStoredDocumentReference => ({
    kind,
    fileName:
      kind === "commercial_registration"
        ? `${code.toLowerCase()}-commercial-registration.pdf`
        : `${code.toLowerCase()}-delegation-letter.pdf`,
    mimeType: "application/pdf",
    sizeBytes: 245_760,
    uploadedAt: createdAt,
    storageKey: `preview://hotels/${id}/${kind}`,
    downloadPath: buildHotelDocumentDownloadPath(id, kind),
  });

  return {
    id,
    code,
    displayName: buildLocalizedText(nameAr),
    legalEntityName: `شركة ${nameAr}`,
    classification: "five_star",
    roomCount: 240,
    address: {
      countryCode: "SA",
      city,
      line1: `${nameAr} - ${city}`,
      latitude: city === "الرياض" ? 24.7136 : city === "جدة" ? 21.5433 : 26.2172,
      longitude: city === "الرياض" ? 46.6753 : city === "جدة" ? 39.1728 : 50.1971,
    },
    timezone: "Asia/Riyadh",
    contact: {
      name: "مدير التشغيل",
      email: `${id}@washoff.sa`,
      phone: "0500000000",
    },
    operationalProfile: {
      serviceLevel: "standard",
      operatingHours: "24/7",
      requiresDailyPickup: true,
    },
    logistics: {
      addressText: `${nameAr} - ${city}`,
      pickupLocation: "منطقة الخدمات الخلفية",
      hasLoadingArea: true,
      accessNotes: "الدخول من البوابة الخلفية والتنسيق مع الأمن.",
    },
    compliance: {
      taxRegistrationNumber: `VAT-${code.replace(/[^0-9A-Z]/gi, "")}`,
      commercialRegistrationNumber: `CR-${code.replace(/[^0-9A-Z]/gi, "")}`,
      commercialRegistrationFile: buildPreviewDocumentReference("commercial_registration"),
      delegationStatus: "not_provided",
    },
    contractedServiceIds: ["wash_fold", "dry_clean", "iron", "stain_removal"],
    active: true,
    onboarding: buildApprovedOnboarding(createdAt),
    createdAt,
    updatedAt: buildOffsetDate({ days: -2 }),
  };
};

const initialServiceCatalog: ServiceCatalogItem[] = [
  {
    id: "wash_fold",
    code: "wash_fold",
    name: buildLocalizedText("غسيل وطي"),
    category: ServiceCategory.Laundry,
    billingUnit: ServiceBillingUnit.Kilogram,
    defaultUnitPriceSar: 15,
    defaultTurnaroundHours: 24,
    supportsRush: true,
    active: true,
  },
  {
    id: "dry_clean",
    code: "dry_clean",
    name: buildLocalizedText("تنظيف جاف"),
    category: ServiceCategory.DryCleaning,
    billingUnit: ServiceBillingUnit.Kilogram,
    defaultUnitPriceSar: 25,
    defaultTurnaroundHours: 48,
    supportsRush: false,
    active: true,
  },
  {
    id: "iron",
    code: "iron",
    name: buildLocalizedText("كي"),
    category: ServiceCategory.Pressing,
    billingUnit: ServiceBillingUnit.Kilogram,
    defaultUnitPriceSar: 8,
    defaultTurnaroundHours: 12,
    supportsRush: true,
    active: true,
  },
  {
    id: "stain_removal",
    code: "stain_removal",
    name: buildLocalizedText("إزالة بقع"),
    category: ServiceCategory.Specialty,
    billingUnit: ServiceBillingUnit.Kilogram,
    defaultUnitPriceSar: 30,
    defaultTurnaroundHours: 36,
    supportsRush: false,
    active: true,
  },
];

let serviceCatalog = clone(initialServiceCatalog);

const initialHotelProfiles: Record<string, HotelProfile> = {
  "hotel-1": buildHotel("hotel-1", "HTL-RC-RYD", "فندق الريتز كارلتون", "الرياض"),
  "hotel-2": buildHotel("hotel-2", "HTL-HIL-RYD", "فندق هيلتون", "الرياض"),
  "hotel-3": buildHotel("hotel-3", "HTL-FSL-RYD", "فندق الفيصلية", "الرياض"),
  "hotel-4": buildHotel("hotel-4", "HTL-RAF-JED", "فندق رافلز", "جدة"),
  "hotel-5": buildHotel("hotel-5", "HTL-FS-KBR", "فندق فور سيزونز", "الخبر"),
};

let hotelProfiles = clone(initialHotelProfiles);

const buildProvider = (
  id: string,
  code: string,
  nameAr: string,
  city: string,
  score: number,
  usedKg: number,
  totalKg: number,
  rating: number,
  acceptanceRate: number,
  slaRate: number,
): ProviderProfile => ({
  id,
  code,
  legalName: buildLocalizedText(nameAr),
  displayName: buildLocalizedText(nameAr),
  address: {
    countryCode: "SA",
    city,
  },
  timezone: "Asia/Riyadh",
  contact: {},
  serviceAreaCities: [city, "الرياض", "جدة"],
  capabilities: serviceCatalog.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    active: true,
    unitPriceSar: Math.max(service.defaultUnitPriceSar - 1, 5),
    maxDailyKg: totalKg,
    maxSingleOrderKg: Math.round(totalKg * 0.3),
    rushSupported: service.supportsRush,
    supportedCityCodes: [city, "الرياض", "جدة"],
    defaultTurnaroundHours: service.defaultTurnaroundHours,
    minimumPickupLeadHours: 2,
    pickupWindow: {
      startHour: 8,
      endHour: 22,
    },
  })),
  currentCapacity: {
    providerId: id,
    date: buildOffsetDate({}).slice(0, 10),
    totalKg,
    committedKg: usedKg,
    reservedKg: 0,
    availableKg: Math.max(totalKg - usedKg, 0),
    utilizationRatio: usedKg / totalKg,
    status:
      usedKg >= totalKg
        ? ProviderCapacityStatus.Full
        : usedKg / totalKg >= 0.8
          ? ProviderCapacityStatus.Limited
          : ProviderCapacityStatus.Available,
    createdAt: buildOffsetDate({ days: -1 }),
    updatedAt: buildOffsetDate({ minutes: -15 }),
  },
  performance: {
    providerId: id,
    rating,
    acceptanceRate,
    onTimePickupRate: slaRate,
    onTimeDeliveryRate: slaRate,
    qualityScore: score,
    disputeRate: 0.02,
    reassignmentRate: 0.06,
    completedOrders: Math.round(score * 1.5),
    cancelledOrders: 3,
    lastEvaluatedAt: buildOffsetDate({ hours: -6 }),
  },
  active: true,
  notesAr: undefined,
  onboarding: buildApprovedOnboarding(buildOffsetDate({ days: -120 })),
  createdAt: buildOffsetDate({ days: -120 }),
  updatedAt: buildOffsetDate({ hours: -1 }),
});

const initialProviderProfiles: Record<string, ProviderProfile> = {
  "provider-1": buildProvider("provider-1", "PRV-GOLD-RYD", "النظافة الذهبية", "الرياض", 95, 680, 1000, 4.9, 0.96, 0.98),
  "provider-2": buildProvider("provider-2", "PRV-MED-RYD", "غسيل المدينة", "الرياض", 88, 850, 1000, 4.7, 0.91, 0.94),
  "provider-3": buildProvider("provider-3", "PRV-ELEG-JED", "الأنيق للغسيل", "جدة", 82, 600, 1000, 4.6, 0.89, 0.91),
  "provider-4": buildProvider("provider-4", "PRV-GULF-DMM", "بريق الخليج", "الدمام", 79, 450, 1000, 4.4, 0.86, 0.89),
};

let providerProfiles = clone(initialProviderProfiles);

const buildSeedAccount = ({
  id,
  fullName,
  email,
  phone,
  role,
  linkedEntityType,
  linkedHotelId,
  linkedProviderId,
  createdAt,
  passwordSalt,
  passwordHash,
}: {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: AccountRole;
  linkedEntityType?: LinkedEntityType;
  linkedHotelId?: string;
  linkedProviderId?: string;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
}): StoredAccount => ({
  id,
  fullName,
  email,
  phone,
  passwordSalt,
  passwordHash,
  role,
  status: AccountStatus.Active,
  linkedEntityType,
  linkedHotelId,
  linkedProviderId,
  activation: {
    state: AccountActivationState.Activated,
    issuedAt: createdAt,
    usedAt: createdAt,
    eligibleAt: createdAt,
    activatedAt: createdAt,
  },
  passwordReset: {
    state: PasswordResetState.Idle,
  },
  suspension: {},
  createdAt,
  updatedAt: createdAt,
  lastLoginAt: createdAt,
});

const initialAccounts: Record<string, StoredAccount> = {
  [DEFAULT_ADMIN_ACCOUNT_ID]: buildSeedAccount({
    id: DEFAULT_ADMIN_ACCOUNT_ID,
    fullName: "مدير منصة WashOff",
    email: "mmekawe@hotmail.com",
    role: AccountRole.Admin,
    linkedEntityType: LinkedEntityType.Admin,
    createdAt: buildOffsetDate({ days: -120 }),
    passwordSalt: "7m4wzfpEJqQn6THYW_QMtQ",
    passwordHash: "wbm2rzZbk-26ej1hbNDVHk_2gnzdHo0d3BkoVKH6Jhg",
  }),
  "account-hotel-1": buildSeedAccount({
    id: "account-hotel-1",
    fullName: "مسؤول تشغيل الفندق",
    email: "hotel.ops@washoff.sa",
    phone: "+966500000101",
    role: AccountRole.Hotel,
    linkedEntityType: LinkedEntityType.Hotel,
    linkedHotelId: DEFAULT_HOTEL_ID,
    createdAt: buildOffsetDate({ days: -90 }),
    passwordSalt: "aG90ZWwtc2FsdC0yMDI2",
    passwordHash: "_ILcLKTrU4vp8mT5UtiLvqXu5yupwIsEWsCf1424RRc",
  }),
  "account-provider-1": buildSeedAccount({
    id: "account-provider-1",
    fullName: "مسؤول تشغيل المزوّد",
    email: "provider.ops@washoff.sa",
    phone: "+966500000202",
    role: AccountRole.Provider,
    linkedEntityType: LinkedEntityType.Provider,
    linkedProviderId: DEFAULT_PROVIDER_ID,
    createdAt: buildOffsetDate({ days: -90 }),
    passwordSalt: "cHJvdmlkZXItc2FsdC0yMDI2",
    passwordHash: "R0hL77siDIaqfV_ue8r_HpyzcLQ5PGvb61oxuIzaTlU",
  }),
  "account-provider-2": buildSeedAccount({
    id: "account-provider-2",
    fullName: "مسؤول تشغيل غسيل المدينة",
    email: "provider.city@washoff.sa",
    phone: "+966500000203",
    role: AccountRole.Provider,
    linkedEntityType: LinkedEntityType.Provider,
    linkedProviderId: "provider-2",
    createdAt: buildOffsetDate({ days: -88 }),
    passwordSalt: "cHJvdmlkZXItc2FsdC0yMDI2",
    passwordHash: "R0hL77siDIaqfV_ue8r_HpyzcLQ5PGvb61oxuIzaTlU",
  }),
  "account-provider-3": buildSeedAccount({
    id: "account-provider-3",
    fullName: "مسؤول تشغيل الأنيق للغسيل",
    email: "provider.elegance@washoff.sa",
    phone: "+966500000204",
    role: AccountRole.Provider,
    linkedEntityType: LinkedEntityType.Provider,
    linkedProviderId: "provider-3",
    createdAt: buildOffsetDate({ days: -86 }),
    passwordSalt: "cHJvdmlkZXItc2FsdC0yMDI2",
    passwordHash: "R0hL77siDIaqfV_ue8r_HpyzcLQ5PGvb61oxuIzaTlU",
  }),
  "account-provider-4": buildSeedAccount({
    id: "account-provider-4",
    fullName: "مسؤول تشغيل بريق الخليج",
    email: "provider.gulf@washoff.sa",
    phone: "+966500000205",
    role: AccountRole.Provider,
    linkedEntityType: LinkedEntityType.Provider,
    linkedProviderId: "provider-4",
    createdAt: buildOffsetDate({ days: -84 }),
    passwordSalt: "cHJvdmlkZXItc2FsdC0yMDI2",
    passwordHash: "R0hL77siDIaqfV_ue8r_HpyzcLQ5PGvb61oxuIzaTlU",
  }),
};

let accounts = clone(initialAccounts);
let accountSessions: Record<string, StoredAccountSession> = {};
let identityAuditEvents: IdentityAuditEvent[] = [];
const initialPlatformSettings: PlatformSettings = {
  ...defaultPlatformSettings,
  id: DEFAULT_PLATFORM_SETTINGS_ID,
};
let platformSettings = clone(initialPlatformSettings);
let platformSettingsAudit: PlatformSettingsAuditEntry[] = [];
const initialPlatformContentEntries = buildAllDefaultPlatformContentEntries();
let platformContentEntries: PlatformContentEntry[] = clone(initialPlatformContentEntries);
let platformContentAudit: PlatformContentAuditEntry[] = [];
const mockPlatformRuntimeStatus: PlatformRuntimeStatus = {
  environment: "preview",
  persistenceMode: "file",
  databaseTargetLabel: "preview-memory",
  mailMode: "outbox",
  workerEnabled: false,
  workerPollIntervalMs: 30_000,
  requestTimeSweepEnabled: true,
  authMode: "preview",
  publicAppUrl: "http://localhost:8080",
};

const ensurePlatformSettingsState = () => {
  if (!platformSettings?.id) {
    platformSettings = clone(initialPlatformSettings);
  }
};

const ensurePlatformContentState = () => {
  if (platformContentEntries.length === 0) {
    platformContentEntries = clone(initialPlatformContentEntries);
    return;
  }

  const existingEntriesById = new Map(platformContentEntries.map((entry) => [entry.id, entry]));
  const mergedEntries = initialPlatformContentEntries.map((defaultEntry) => {
    const existingEntry = existingEntriesById.get(defaultEntry.id);
    return existingEntry
      ? {
          ...defaultEntry,
          ...existingEntry,
        }
      : defaultEntry;
  });

  platformContentEntries = clone(mergedEntries);
};

const getCurrentStoredAccountSession = () => {
  const token = getStoredClientSessionToken();

  if (!token) {
    return null;
  }

  return resolveStoredAccountSessionByToken(token);
};

const getCurrentStoredAccount = () => {
  const currentSession = getCurrentStoredAccountSession();

  if (!currentSession) {
    return null;
  }

  return accounts[currentSession.accountId] ?? null;
};

const getCurrentAdminAccountId = () => {
  const account = getCurrentStoredAccount();
  return account?.role === AccountRole.Admin ? account.id : undefined;
};

const sortByUpdatedAtDesc = <Value extends { updatedAt?: string; changedAt?: string }>(
  values: Value[],
) => {
  return values
    .slice()
    .sort((left, right) =>
      (right.updatedAt ?? right.changedAt ?? "").localeCompare(left.updatedAt ?? left.changedAt ?? ""),
    );
};

const ensureAuthenticatedAccount = () => {
  const account = getCurrentStoredAccount();

  if (!account) {
    throw new Error(AUTH_REQUIRED_ERROR);
  }

  if (account.status === AccountStatus.PendingActivation) {
    throw new Error(ACCOUNT_NOT_ACTIVATED_ERROR);
  }

  if (account.status !== AccountStatus.Active) {
    throw new Error(ACCOUNT_SUSPENDED_ERROR);
  }

  return account;
};

const ensureAuthenticatedHotelAccount = () => {
  const account = ensureAuthenticatedAccount();

  if (account.role !== AccountRole.Hotel || !account.linkedHotelId) {
    throw new Error(HOTEL_ACCOUNT_LINK_ERROR);
  }

  return account;
};

const ensureAuthenticatedProviderAccount = () => {
  const account = ensureAuthenticatedAccount();

  if (account.role !== AccountRole.Provider || !account.linkedProviderId) {
    throw new Error(PROVIDER_ACCOUNT_LINK_ERROR);
  }

  return account;
};

const ensureAuthenticatedAdminAccount = () => {
  const account = ensureAuthenticatedAccount();

  if (account.role !== AccountRole.Admin) {
    throw new Error("هذه العملية متاحة للإدارة فقط.");
  }

  return account;
};

const createPendingLinkedAccount = ({
  fullName,
  email,
  phone,
  role,
  linkedHotelId,
  linkedProviderId,
  createdAt,
}: {
  fullName: string;
  email: string;
  phone?: string;
  role: AccountRole;
  linkedHotelId?: string;
  linkedProviderId?: string;
  createdAt: string;
}): StoredAccount => {
  const linkedEntityType =
    role === AccountRole.Hotel
      ? LinkedEntityType.Hotel
      : role === AccountRole.Provider
        ? LinkedEntityType.Provider
        : LinkedEntityType.Admin;
  const accountId = `account-${role}-${Object.keys(accounts).length + 1}`;

  return {
    id: accountId,
    fullName,
    email: email.trim().toLowerCase(),
    phone,
    role,
    status: AccountStatus.PendingActivation,
    linkedEntityType,
    linkedHotelId,
    linkedProviderId,
    activation: {
      state: AccountActivationState.AwaitingApproval,
    },
    passwordReset: {
      state: PasswordResetState.Idle,
    },
    suspension: {},
    createdAt,
    updatedAt: createdAt,
  };
};

const ensureUniqueAccountEmail = (email: string, excludeAccountId?: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const duplicateAccount = Object.values(accounts).find(
    (account) => account.email.toLowerCase() === normalizedEmail && account.id !== excludeAccountId,
  );

  if (duplicateAccount) {
    throw new Error("يوجد حساب آخر يستخدم البريد الإلكتروني نفسه.");
  }

  return normalizedEmail;
};

const buildAuthSessionResult = (account: StoredAccount, session: StoredAccountSession, token: string) => ({
  token,
  account: sanitizeAccount(account),
  session: sanitizeAccountSession(session),
});

const buildLinkedAccountSummary = (account: StoredAccount) => ({
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

const buildAccountAdminSummary = (account: StoredAccount) => ({
  ...sanitizeAccount(account),
  roleLabelAr: accountRoleLabelsAr[account.role],
  statusLabelAr: accountStatusLabelsAr[account.status],
  activationStateLabelAr: accountActivationStateLabelsAr[account.activation.state],
  passwordResetStateLabelAr: passwordResetStateLabelsAr[account.passwordReset.state],
});

const buildIdentityAuditEventSummary = (event: IdentityAuditEvent) => ({
  ...clone(event),
  typeLabelAr: identityAuditEventTypeLabelsAr[event.type],
});

const recordIdentityAuditEvent = ({
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
}: Omit<IdentityAuditEvent, "id" | "createdAt"> & { createdAt?: string }): IdentityAuditEvent => {
  const event: IdentityAuditEvent = {
    id: `audit-${type}-${Date.now()}-${identityAuditEvents.length + 1}`,
    accountId,
    sessionId,
    type,
    actorAccountId,
    actorRole,
    linkedEntityType,
    linkedEntityId,
    detailsAr,
    metadata: metadata ? clone(metadata) : undefined,
    createdAt,
  };

  identityAuditEvents = [event, ...identityAuditEvents];
  return event;
};

const getLinkedEntityTypeForAccount = (account: Pick<StoredAccount, "linkedEntityType">) => {
  return account.linkedEntityType;
};

const buildResetPasswordPath = (token: string) => `/reset-password?token=${encodeURIComponent(token)}`;

const getActivationTokenValidationResult = async (
  token: string,
): Promise<{ status: AccountTokenValidationStatus; account?: StoredAccount }> => {
  const hashedToken = await hashOpaqueToken(token);
  const account = Object.values(accounts).find((entry) => entry.activationTokenHash === hashedToken);

  if (!account) {
    return { status: AccountTokenValidationStatus.Invalid };
  }

  if (account.activation.usedAt || account.activation.state === AccountActivationState.Activated) {
    return { status: AccountTokenValidationStatus.Used, account };
  }

  if (
    account.activation.tokenExpiresAt &&
    new Date(account.activation.tokenExpiresAt).getTime() <= Date.now()
  ) {
    return { status: AccountTokenValidationStatus.Expired, account };
  }

  if (account.activation.state !== AccountActivationState.Ready) {
    return { status: AccountTokenValidationStatus.Invalid, account };
  }

  return { status: AccountTokenValidationStatus.Ready, account };
};

const getPasswordResetTokenValidationResult = async (
  token: string,
): Promise<{ status: AccountTokenValidationStatus; account?: StoredAccount }> => {
  const hashedToken = await hashOpaqueToken(token);
  const account = Object.values(accounts).find((entry) => entry.passwordResetTokenHash === hashedToken);

  if (!account) {
    return { status: AccountTokenValidationStatus.Invalid };
  }

  if (account.passwordReset.usedAt || account.passwordReset.state === PasswordResetState.Completed) {
    return { status: AccountTokenValidationStatus.Used, account };
  }

  if (
    account.passwordReset.tokenExpiresAt &&
    new Date(account.passwordReset.tokenExpiresAt).getTime() <= Date.now()
  ) {
    return { status: AccountTokenValidationStatus.Expired, account };
  }

  if (account.passwordReset.state !== PasswordResetState.Ready) {
    return { status: AccountTokenValidationStatus.Invalid, account };
  }

  return { status: AccountTokenValidationStatus.Ready, account };
};

const buildAccountTokenValidationResult = ({
  status,
  account,
}: {
  status: AccountTokenValidationStatus;
  account?: StoredAccount;
}): AccountTokenValidationResult => ({
  status,
  accountEmail: account?.email,
  accountFullName: account?.fullName,
  role: account?.role,
  linkedEntityType: account?.linkedEntityType,
});

const findAccountByEmail = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return Object.values(accounts).find((account) => account.email.toLowerCase() === normalizedEmail);
};

const issueActivationForAccount = async (accountId: string, issuedAt: string) => {
  const account = accounts[accountId];

  if (!account) {
    throw new Error("تعذر العثور على الحساب المرتبط بالجهة.");
  }

  const activationToken = createOpaqueToken(24);
  const activationTokenHash = await hashOpaqueToken(activationToken);
  const activationPath = buildActivationPath(activationToken);
  const nextAccount: StoredAccount = {
    ...account,
    status: AccountStatus.PendingActivation,
    activationTokenHash,
    activation: {
      state: AccountActivationState.Ready,
      eligibleAt: issuedAt,
      issuedAt,
      tokenExpiresAt: addHours(issuedAt, ACCOUNT_ACTIVATION_TOKEN_DURATION_HOURS),
      usedAt: undefined,
      activationPath,
    },
    updatedAt: issuedAt,
  };

  accounts = {
    ...accounts,
    [accountId]: nextAccount,
  };

  recordIdentityAuditEvent({
    accountId: nextAccount.id,
    type: IdentityAuditEventType.ActivationIssued,
    actorRole: "admin",
    linkedEntityType: nextAccount.linkedEntityType,
    linkedEntityId: getLinkedEntityId(nextAccount),
    detailsAr: "تم إصدار رابط تفعيل جديد للحساب بعد الاعتماد.",
    createdAt: issuedAt,
  });

  return nextAccount;
};

const findAccountByLinkedHotelId = (hotelId: string) => {
  return Object.values(accounts).find((account) => account.linkedHotelId === hotelId);
};

const findAccountByLinkedProviderId = (providerId: string) => {
  return Object.values(accounts).find((account) => account.linkedProviderId === providerId);
};

const revokeAccountSessions = ({
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
}) => {
  const affectedSessions = Object.values(accountSessions).filter(
    (session) => session.accountId === accountId && !session.revokedAt,
  );

  if (affectedSessions.length === 0) {
    return;
  }

  accountSessions = Object.fromEntries(
    Object.entries(accountSessions).map(([sessionId, session]) => [
      sessionId,
      session.accountId === accountId && !session.revokedAt
        ? {
            ...session,
            revokedAt,
            revokedReasonAr: reasonAr,
            revokedByAccountId,
            revokedByRole,
          }
        : session,
    ]),
  );

  affectedSessions.forEach((session) => {
    recordIdentityAuditEvent({
      accountId,
      sessionId: session.id,
      type: IdentityAuditEventType.SessionRevoked,
      actorAccountId: revokedByAccountId,
      actorRole: revokedByRole,
      linkedEntityType: session.linkedEntityType,
      linkedEntityId: session.linkedEntityId,
      detailsAr: reasonAr,
      createdAt: revokedAt,
    });
  });
};

const issueSessionForAccount = (account: StoredAccount, issuedAt: string): AuthenticatedAccountSession => {
  revokeAccountSessions({
    accountId: account.id,
    reasonAr: "تم إلغاء الجلسة السابقة عند إصدار جلسة أحدث.",
    revokedByAccountId: account.id,
    revokedByRole: account.role,
    revokedAt: issuedAt,
  });
  const token = createOpaqueToken(32);
  const linkedEntityId = getLinkedEntityId(account);
  const session: StoredAccountSession = {
    id: `session-${account.id}-${Date.now()}`,
    accountId: account.id,
    tokenHash: token,
    role: account.role,
    linkedEntityType: account.linkedEntityType,
    linkedEntityId,
    createdAt: issuedAt,
    expiresAt: addHours(issuedAt, ACCOUNT_SESSION_DURATION_HOURS),
    lastSeenAt: issuedAt,
  };
  const nextAccount: StoredAccount = {
    ...account,
    lastLoginAt: issuedAt,
    updatedAt: issuedAt,
  };

  accounts = {
    ...accounts,
    [account.id]: nextAccount,
  };
  accountSessions = {
    ...accountSessions,
    [session.id]: session,
  };

  recordIdentityAuditEvent({
    accountId: account.id,
    sessionId: session.id,
    type: IdentityAuditEventType.LoginSucceeded,
    actorAccountId: account.id,
    actorRole: account.role,
    linkedEntityType: account.linkedEntityType,
    linkedEntityId,
    detailsAr: "تم إنشاء جلسة دخول جديدة للحساب.",
    createdAt: issuedAt,
  });

  return buildAuthSessionResult(nextAccount, session, token);
};

const resolveStoredAccountSessionByToken = (token: string) => {
  const matchingSession = Object.values(accountSessions).find(
    (session) =>
      session.tokenHash === token &&
      !session.revokedAt &&
      new Date(session.expiresAt).getTime() > Date.now(),
  );

  if (!matchingSession) {
    return null;
  }

  const account = accounts[matchingSession.accountId];

  if (!account || account.status !== AccountStatus.Active) {
    revokeAccountSessions({
      accountId: matchingSession.accountId,
      reasonAr: "تم إلغاء الجلسة لأن الحساب لم يعد نشطًا.",
      revokedByRole: "system",
    });
    return null;
  }

  if (
    account.role === AccountRole.Hotel &&
    !isHotelOperationallyApproved(hotelProfiles[account.linkedHotelId ?? ""])
  ) {
    revokeAccountSessions({
      accountId: matchingSession.accountId,
      reasonAr: "تم إلغاء الجلسة لأن الفندق المرتبط بالحساب ليس معتمدًا حاليًا.",
      revokedByRole: "system",
    });
    return null;
  }

  if (
    account.role === AccountRole.Provider &&
    !isProviderOperationallyApproved(providerProfiles[account.linkedProviderId ?? ""])
  ) {
    revokeAccountSessions({
      accountId: matchingSession.accountId,
      reasonAr: "تم إلغاء الجلسة لأن المزوّد المرتبط بالحساب ليس معتمدًا حاليًا.",
      revokedByRole: "system",
    });
    return null;
  }

  return matchingSession;
};

const isHotelOperationallyApproved = (hotel: HotelProfile | undefined) => {
  return Boolean(hotel && hotel.active && hotel.onboarding.status === OnboardingStatus.Approved);
};

const isProviderOperationallyApproved = (provider: ProviderProfile | undefined) => {
  return Boolean(provider && provider.active && provider.onboarding.status === OnboardingStatus.Approved);
};

const resolveAuthorizedHotelId = (requestedHotelId?: string) => {
  const account = ensureAuthenticatedAccount();

  if (account.role === AccountRole.Admin) {
    return requestedHotelId ?? DEFAULT_HOTEL_ID;
  }

  if (account.role !== AccountRole.Hotel || !account.linkedHotelId) {
    throw new Error(HOTEL_ACCOUNT_LINK_ERROR);
  }

  if (requestedHotelId && requestedHotelId !== account.linkedHotelId) {
    throw new Error("لا يمكن لهذا الحساب الوصول إلى فندق آخر.");
  }

  return account.linkedHotelId;
};

const resolveAuthorizedProviderId = (requestedProviderId?: string) => {
  const account = ensureAuthenticatedAccount();

  if (account.role === AccountRole.Admin) {
    return requestedProviderId ?? DEFAULT_PROVIDER_ID;
  }

  if (account.role !== AccountRole.Provider || !account.linkedProviderId) {
    throw new Error(PROVIDER_ACCOUNT_LINK_ERROR);
  }

  if (requestedProviderId && requestedProviderId !== account.linkedProviderId) {
    throw new Error("لا يمكن لهذا الحساب تنفيذ العمليات نيابة عن مزوّد آخر.");
  }

  return account.linkedProviderId;
};

const ensureHotelOperationalAccess = (hotelId?: string) => {
  const hotel = hotelProfiles[resolveAuthorizedHotelId(hotelId)];

  if (!hotel) {
    throw new Error("تعذر العثور على ملف الفندق.");
  }

  if (!isHotelOperationallyApproved(hotel)) {
    throw new Error(HOTEL_ACCESS_NOT_APPROVED_ERROR);
  }

  return hotel;
};

const ensureProviderOperationalAccess = (providerId?: string) => {
  const provider = providerProfiles[resolveAuthorizedProviderId(providerId)];

  if (!provider) {
    throw new Error("تعذر العثور على ملف المزوّد.");
  }

  if (!isProviderOperationallyApproved(provider)) {
    throw new Error(PROVIDER_ACCESS_NOT_APPROVED_ERROR);
  }

  return provider;
};

const selectNextEntityNumber = (ids: string[], prefix: "hotel" | "provider") => {
  const maxValue = ids.reduce((currentMax, id) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(id);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return maxValue + 1;
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

const validateHotelRegistrationDocumentUploadInput = (
  file: HotelRegistrationDocumentUploadInput | undefined,
  label: string,
) => {
  if (!file) {
    throw new Error(`يجب إرفاق ${label}.`);
  }

  if (!HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimeType as never)) {
    throw new Error("الصيغ المسموحة: PDF, JPG, PNG.");
  }

  if (!Number.isFinite(file.sizeBytes) || file.sizeBytes <= 0) {
    throw new Error(`يرجى إرفاق ملف صالح لحقل ${label}.`);
  }

  if (file.sizeBytes > HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("الحد الأقصى لحجم الملف هو 5 ميجابايت.");
  }

  return file;
};

const buildPreviewRegistrationDocumentReference = ({
  hotelId,
  file,
  kind,
  uploadedAt,
}: {
  hotelId: string;
  file: HotelRegistrationDocumentUploadInput;
  kind: HotelRegistrationDocumentKind;
  uploadedAt: string;
}): HotelRegistrationStoredDocumentReference => ({
  kind,
  fileName: file.fileName.trim(),
  mimeType: file.mimeType,
  sizeBytes: file.sizeBytes,
  uploadedAt,
  storageKey: `preview://hotels/${hotelId}/${kind}/${file.fileName}`,
  downloadPath: buildHotelDocumentDownloadPath(hotelId, kind),
});

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

  if (typeof input.requiresDailyPickup !== "boolean") {
    throw new Error("يرجى تحديد ما إذا كان الفندق يحتاج استلامًا يوميًا.");
  }

  if (typeof input.hasLoadingArea !== "boolean") {
    throw new Error("يرجى تحديد ما إذا كانت هناك منطقة تحميل.");
  }

  const commercialRegistrationFile = validateHotelRegistrationDocumentUploadInput(
    input.commercialRegistrationFile,
    "ملف السجل التجاري",
  );
  const delegationLetterFile = input.delegationLetterFile
    ? validateHotelRegistrationDocumentUploadInput(input.delegationLetterFile, "خطاب التفويض")
    : undefined;
  const totalDocumentsSize = commercialRegistrationFile.sizeBytes + (delegationLetterFile?.sizeBytes ?? 0);

  if (totalDocumentsSize > HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES) {
    throw new Error("الحد الأقصى لإجمالي مرفقات التسجيل هو 10 ميجابايت.");
  }

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
    commercialRegistrationFile,
    delegationLetterFile,
    contactPersonName: requireTextField(input.contactPersonName, "اسم مسؤول التواصل"),
    contactEmail: requireEmailField(input.contactEmail),
    contactPhone: requirePhoneField(input.contactPhone),
    notesAr: normalizeOptionalTextField(input.notesAr ?? input.notes),
  };
};

const validateProviderRegistrationInput = (input: ProviderRegistrationInput) => {
  const supportedServiceIds = Array.from(
    new Set(input.supportedServiceIds.map((serviceId) => serviceId.trim()).filter(Boolean)),
  );
  const dailyCapacityKg = Number(input.dailyCapacityKg);

  if (supportedServiceIds.length === 0) {
    throw new Error("اختر خدمة واحدة على الأقل للمزوّد.");
  }

  if (!Number.isFinite(dailyCapacityKg) || dailyCapacityKg <= 0) {
    throw new Error("يرجى إدخال سعة تشغيلية يومية صحيحة.");
  }

  supportedServiceIds.forEach((serviceId) => {
    const service = findServiceById(serviceId);

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

const buildPendingProviderCapabilities = (serviceIds: string[], city: string, dailyCapacityKg: number) => {
  return serviceIds.map((serviceId) => {
    const service = findServiceById(serviceId);

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

const findServiceById = (serviceId: string) => {
  const service = serviceCatalog.find((currentService) => currentService.id === serviceId);

  if (!service) {
    throw new Error(`Service ${serviceId} was not found in the preview store.`);
  }

  return service;
};

const validateCreateHotelOrderInput = (input: CreateHotelOrderInput) => {
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

  for (const serviceId of serviceIds) {
    const service = findServiceById(serviceId);

    if (!service.active) {
      throw new Error(`الخدمة ${service.name.ar} غير متاحة حالياً.`);
    }
  }

  return {
    serviceIds,
    itemCount,
    pickupAt,
    notesAr: (input.notesAr ?? input.notes?.trim()) || undefined,
    priority: input.priority ?? OrderPriority.Standard,
  };
};

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
    .filter((log) =>
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

const buildOrderItems = (orderId: string, serviceIds: string[], totalItemCount: number): OrderItem[] => {
  return serviceIds.map((serviceId, index) => {
    const service = findServiceById(serviceId);

    return {
      id: `${orderId}-item-${index + 1}-${serviceId}`,
      serviceId: service.id,
      serviceName: service.name,
      quantity: totalItemCount,
      unit: service.billingUnit,
      unitPriceSar: service.defaultUnitPriceSar,
      estimatedLineTotalSar: totalItemCount * service.defaultUnitPriceSar,
    };
  });
};

const buildHotelSnapshot = (hotelId: string) => {
  const hotel = hotelProfiles[hotelId];

  return {
    id: hotel.id,
    displayName: hotel.displayName,
    city: hotel.address.city,
  };
};

const buildProviderSnapshot = (providerId: string) => {
  const provider = providerProfiles[providerId];

  return {
    id: provider.id,
    displayName: provider.displayName,
    city: provider.address.city,
  };
};

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

const buildUpdatedOrderAfterAssignment = ({
  order,
  assignment,
  changedAt,
  reasonAr,
  matchingLogs,
}: {
  order: LaundryOrder;
  assignment: Assignment;
  changedAt: string;
  reasonAr: string;
  matchingLogs: MatchingLog[];
}): LaundryOrder => {
  reserveProviderCapacity(assignment.providerId, getRequestedCapacityKg(order), changedAt);

  return {
    ...order,
    status: OrderStatus.Assigned,
    providerId: assignment.providerId,
    providerSnapshot: buildProviderSnapshot(assignment.providerId),
    updatedAt: changedAt,
    statusUpdatedAt: changedAt,
    progressPercent: getOrderProgressPercent(OrderStatus.Assigned),
    activeAssignmentId: assignment.id,
    activeAssignment: assignment,
    assignmentHistory: [
      ...order.assignmentHistory,
      buildPendingAssignmentHistory(assignment, changedAt, reasonAr),
    ],
    statusHistory:
      order.status === OrderStatus.Assigned
        ? order.statusHistory
        : appendOrderStatusHistory({
            order,
            toStatus: OrderStatus.Assigned,
            changedAt,
            actorRole: "system",
            notesAr: reasonAr,
          }),
    matchingLogs: [...order.matchingLogs, ...matchingLogs],
    slaWindow: {
      ...order.slaWindow,
      responseDueAt: assignment.responseDueAt,
    },
  };
};

const tryAutoReassignOrder = (
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
    const provider = providerProfiles[candidateLog.providerId];

    if (!provider) {
      continue;
    }

    const eligibilityResult = evaluateProviderEligibility(order, provider, { evaluatedAt: changedAt });

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
    };
  }

  return {
    assignment: undefined,
    matchingLogs: reassignmentLogs,
  };
};

const reassignOrderAfterPendingFailure = (
  order: LaundryOrder,
  {
    changedAt,
    reason,
    actorRole,
  }: {
    changedAt: string;
    reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired;
    actorRole: "provider" | "system";
  },
): LaundryOrder => {
  const previousAssignment = order.activeAssignment;

  if (!previousAssignment || previousAssignment.status !== AssignmentStatus.PendingAcceptance) {
    return order;
  }

  const copy = resolveReassignmentCopy(reason);
  const requestedCapacityKg = getRequestedCapacityKg(order);

  releaseReservedProviderCapacity(previousAssignment.providerId, requestedCapacityKg, changedAt);
  applyProviderReliabilityPenalty(previousAssignment.providerId, reason, changedAt);

  const finalStatus =
    reason === ReassignmentReason.ProviderExpired ? AssignmentStatus.Expired : AssignmentStatus.Rejected;
  const finalHistory: AssignmentHistory = {
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
  };
  const reassignmentEventBase = {
    id: `reassign-${order.id}-${order.reassignmentEvents.length + 1}`,
    orderId: order.id,
    previousAssignmentId: previousAssignment.id,
    previousProviderId: previousAssignment.providerId,
    reason,
    actorRole: "system" as const,
    createdAt: changedAt,
  };
  const reassignmentAttempt = tryAutoReassignOrder(order, changedAt, reason);

  if (reassignmentAttempt.assignment) {
    const reassignedOrder = buildUpdatedOrderAfterAssignment({
      order: {
        ...order,
        activeAssignmentId: undefined,
        activeAssignment: undefined,
        assignmentHistory: [...order.assignmentHistory, finalHistory],
        providerId: undefined,
        providerSnapshot: undefined,
        reassignmentEvents: [
          ...order.reassignmentEvents,
          {
            ...reassignmentEventBase,
            nextProviderId: reassignmentAttempt.assignment.providerId,
            notesAr: copy.eventNotesAr,
          },
        ],
      },
      assignment: reassignmentAttempt.assignment,
      changedAt,
      reasonAr: copy.nextAssignmentReasonAr,
      matchingLogs: reassignmentAttempt.matchingLogs,
    });

    return {
      ...reassignedOrder,
      reassignmentEvents: [
        ...order.reassignmentEvents,
        {
          ...reassignmentEventBase,
          nextProviderId: reassignmentAttempt.assignment.providerId,
          notesAr: copy.eventNotesAr,
        },
      ],
    };
  }

  return {
    ...order,
    status: OrderStatus.PendingCapacity,
    providerId: undefined,
    providerSnapshot: undefined,
    updatedAt: changedAt,
    statusUpdatedAt: changedAt,
    progressPercent: undefined,
    activeAssignmentId: undefined,
    activeAssignment: undefined,
    assignmentHistory: [...order.assignmentHistory, finalHistory],
    matchingLogs: [...order.matchingLogs, ...reassignmentAttempt.matchingLogs],
    slaWindow: {
      ...order.slaWindow,
      responseDueAt: undefined,
    },
    reassignmentEvents: [
      ...order.reassignmentEvents,
      {
        ...reassignmentEventBase,
        nextProviderId: undefined,
        notesAr: copy.unresolvedNotesAr,
      },
    ],
    statusHistory: appendOrderStatusHistory({
      order,
      toStatus: OrderStatus.PendingCapacity,
      changedAt,
      actorRole: "system",
      notesAr: copy.unresolvedNotesAr,
    }),
  };
};

const buildScoreBreakdown = (totalScore: number): ScoreBreakdown => {
  const entries = [
    { criterion: MatchingCriterion.Price, labelAr: "درجة السعر", weight: 0.25, rawScore: totalScore - 4, weightedScore: (totalScore - 4) * 0.25 },
    { criterion: MatchingCriterion.SlaSpeed, labelAr: "سرعة الالتزام التشغيلي", weight: 0.25, rawScore: totalScore - 2, weightedScore: (totalScore - 2) * 0.25 },
    { criterion: MatchingCriterion.Rating, labelAr: "تقييم المزود", weight: 0.2, rawScore: totalScore, weightedScore: totalScore * 0.2 },
    { criterion: MatchingCriterion.CapacityAvailability, labelAr: "توفر السعة", weight: 0.2, rawScore: totalScore - 1, weightedScore: (totalScore - 1) * 0.2 },
    { criterion: MatchingCriterion.OnTimePerformance, labelAr: "الالتزام بالمواعيد", weight: 0.1, rawScore: totalScore - 3, weightedScore: (totalScore - 3) * 0.1 },
  ];

  return {
    totalScore: Math.round(entries.reduce((sum, entry) => sum + entry.weightedScore, 0)),
    entries,
  };
};

const buildMatchingLog = (
  orderId: string,
  providerId: string,
  serviceIds: string[],
  hotelCity: string,
  decision: MatchingDecision,
  totalScore: number,
): MatchingLog => {
  const provider = providerProfiles[providerId];
  const matchedServiceIds = serviceIds.filter((serviceId) =>
    provider.capabilities.some((capability) => capability.serviceId === serviceId && capability.active),
  );
  const unsupportedServiceIds = serviceIds.filter((serviceId) => !matchedServiceIds.includes(serviceId));
  const sameCity = provider.address.city === hotelCity;
  const serviceAreaCovered = provider.serviceAreaCities.includes(hotelCity);
  const eligible = unsupportedServiceIds.length === 0 && sameCity && serviceAreaCovered && provider.active;

  return {
    id: `match-${orderId}-${providerId}`,
    matchingRunId: `run-${orderId}`,
    orderId,
    providerId,
    decision,
    eligibilityResult: {
      providerId,
      orderId,
      eligible,
      reasonCodes: eligible
        ? []
        : unsupportedServiceIds.length > 0
          ? [EligibilityReasonCode.ServiceUnsupported]
          : [EligibilityReasonCode.CityMismatch],
      blockingReasonsAr: eligible
        ? []
        : unsupportedServiceIds.length > 0
          ? ["الخدمات المطلوبة غير مدعومة بالكامل"]
          : ["المزوّد ليس في نفس مدينة الفندق"],
      capabilityMatch: {
        providerId,
        requestedServiceIds: serviceIds,
        matchedServiceIds,
        unsupportedServiceIds,
        sameCity,
        serviceAreaCovered,
        supportsRequestedQuantities: true,
        supportsRequestedPickupTime: true,
        capacityAvailable: provider.currentCapacity.availableKg > 0,
        isMatch: eligible,
        reasonsAr: eligible ? ["مطابقة كاملة"] : ["مطابقة جزئية"],
      },
      availableCapacityKg: provider.currentCapacity.availableKg,
      evaluatedAt: buildOffsetDate({ minutes: -5 }),
    },
    scoreBreakdown: buildScoreBreakdown(totalScore),
    evaluatedAt: buildOffsetDate({ minutes: -5 }),
    notesAr: decision === MatchingDecision.Selected ? "تم اختيار المزود الأعلى تقييماً" : "لم يتم اختيار المزود في هذه الجولة",
  };
};

const buildAssignment = (
  orderId: string,
  hotelId: string,
  providerId: string,
  serviceIds: string[],
  hotelCity: string,
  attemptNumber: number,
  status: AssignmentStatus,
  assignedAt: string,
  responseDueAt?: string,
): Assignment => {
  const matchingLog = buildMatchingLog(orderId, providerId, serviceIds, hotelCity, MatchingDecision.Selected, providerProfiles[providerId].performance.qualityScore);

  return {
    id: `assignment-${orderId}-${attemptNumber}`,
    orderId,
    hotelId,
    providerId,
    attemptNumber,
    status,
    assignedAt,
    responseDueAt,
    respondedAt: status === AssignmentStatus.PendingAcceptance ? undefined : buildOffsetDate({ minutes: -10 }),
    acceptedAt: status === AssignmentStatus.Accepted ? buildOffsetDate({ hours: -2 }) : undefined,
    scoreBreakdown: matchingLog.scoreBreakdown,
    eligibilityResult: matchingLog.eligibilityResult,
  };
};

const buildAssignmentHistory = (
  assignment: Assignment,
  toStatus: AssignmentStatus,
  changedAt: string,
  reasonAr?: string,
): AssignmentHistory => ({
  id: `assignment-history-${assignment.id}-${toStatus}`,
  assignmentId: assignment.id,
  orderId: assignment.orderId,
  providerId: assignment.providerId,
  attemptNumber: assignment.attemptNumber,
  fromStatus: assignment.status,
  toStatus,
  changedAt,
  actorRole: toStatus === AssignmentStatus.Accepted ? "provider" : "system",
  reasonAr,
});

const buildSlaHistory = (
  orderId: string,
  checkpoint: SLACheckpoint,
  targetAt: string,
  actualAt: string | undefined,
  status: SLAStatus,
  notesAr?: string,
): SLAHistory => ({
  id: `sla-${orderId}-${checkpoint}`,
  orderId,
  checkpoint,
  targetAt,
  actualAt,
  status,
  recordedAt: buildOffsetDate({ minutes: -20 }),
  notesAr,
});

const buildSettlement = (
  orderId: string,
  hotelId: string,
  providerId: string,
  items: OrderItem[],
): Settlement => {
  const subtotalSar = items.reduce((sum, item) => sum + item.estimatedLineTotalSar, 0);
  const platformFeeSar = Math.round(subtotalSar * 0.08);

  return {
    id: `settlement-${orderId}`,
    orderId,
    hotelId,
    providerId,
    currency: "SAR",
    status: SettlementStatus.Generated,
    lineItems: items.map((item) => ({
      id: `settlement-line-${item.id}`,
      orderItemId: item.id,
      description: item.serviceName,
      quantity: item.quantity,
      unitPriceSar: item.unitPriceSar,
      totalSar: item.estimatedLineTotalSar,
    })),
    subtotalSar,
    platformFeeSar,
    adjustmentsSar: 0,
    totalSar: subtotalSar + platformFeeSar,
    generatedAt: buildOffsetDate({ hours: -5 }),
    dueAt: buildOffsetDate({ days: 7 }),
  };
};

interface SeedOrderConfig {
  id: string;
  hotelId: string;
  providerId?: string;
  status: OrderStatus;
  serviceIds: string[];
  totalItemCount: number;
  createdAt: string;
  updatedAt: string;
  pickupAt: string;
  priority?: OrderPriority;
  progressPercent?: number;
  responseDueAt?: string;
  settlement?: boolean;
  reassignmentReason?: ReassignmentReason;
}

const createSeedOrder = (config: SeedOrderConfig): LaundryOrder => {
  const items = buildOrderItems(config.id, config.serviceIds, config.totalItemCount);
  const estimatedSubtotalSar = items.reduce((sum, item) => sum + item.estimatedLineTotalSar, 0);
  const hotelSnapshot = buildHotelSnapshot(config.hotelId);
  const providerSnapshot = config.providerId ? buildProviderSnapshot(config.providerId) : undefined;
  const isUnresolvedStatus =
    config.status === OrderStatus.Reassigned || config.status === OrderStatus.PendingCapacity;
  const activeAssignment =
    config.providerId && !isUnresolvedStatus
      ? buildAssignment(
          config.id,
          config.hotelId,
          config.providerId,
          config.serviceIds,
          hotelSnapshot.city,
          1,
          config.status === OrderStatus.Assigned ? AssignmentStatus.PendingAcceptance : AssignmentStatus.Accepted,
          config.createdAt,
          config.responseDueAt,
        )
      : undefined;
  const selectedMatchingLog = config.providerId
    ? buildMatchingLog(
        config.id,
        config.providerId,
        config.serviceIds,
        hotelSnapshot.city,
        MatchingDecision.Selected,
        providerProfiles[config.providerId].performance.qualityScore,
      )
    : undefined;
  const assignmentHistory = activeAssignment
    ? [
        buildAssignmentHistory(
          activeAssignment,
          activeAssignment.status,
          config.updatedAt,
          activeAssignment.status === AssignmentStatus.Accepted ? "تم قبول الإسناد من المزود" : "بانتظار قرار المزود",
        ),
      ]
    : [];
  const reassignmentEvents: ReassignmentEvent[] =
    isUnresolvedStatus
      ? [
          {
            id: `reassign-${config.id}`,
            orderId: config.id,
            previousAssignmentId: `assignment-${config.id}-1`,
            previousProviderId: config.providerId,
            nextProviderId: undefined,
            reason: config.reassignmentReason ?? ReassignmentReason.ProviderRejected,
            actorRole: "system",
            createdAt: config.updatedAt,
            notesAr: "تمت إعادة الإسناد بعد تعذر استمرار المزود السابق",
          },
        ]
      : [];

  return {
    id: config.id,
    hotelId: config.hotelId,
    hotelSnapshot,
    providerId: isUnresolvedStatus ? undefined : config.providerId,
    providerSnapshot: isUnresolvedStatus ? undefined : providerSnapshot,
    assignmentMode: OrderAssignmentMode.Auto,
    status: config.status,
    priority: config.priority ?? OrderPriority.Standard,
    items,
    totalItemCount: config.totalItemCount,
    currency: "SAR",
    estimatedSubtotalSar,
    pickupAt: config.pickupAt,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    statusUpdatedAt: config.updatedAt,
    progressPercent: config.progressPercent,
    activeAssignmentId: activeAssignment?.id,
    activeAssignment,
    assignmentHistory,
    matchingLogs: selectedMatchingLog ? [selectedMatchingLog] : [],
    slaWindow: {
      responseDueAt: config.responseDueAt,
      pickupTargetAt: config.pickupAt,
      deliveryTargetAt: buildOffsetDate({ hours: 24 }),
      completionTargetAt: buildOffsetDate({ hours: 30 }),
    },
    slaHistory: [
      buildSlaHistory(config.id, SLACheckpoint.Pickup, config.pickupAt, undefined, SLAStatus.OnTrack, "نافذة الاستلام ضمن الخطة الحالية"),
    ],
    reassignmentEvents,
    settlement:
      config.settlement && config.providerId
        ? buildSettlement(config.id, config.hotelId, config.providerId, items)
        : undefined,
  };
};

const initialOrders: LaundryOrder[] = [
  createSeedOrder({
    id: "ORD-1044",
    hotelId: "hotel-2",
    providerId: DEFAULT_PROVIDER_ID,
    status: OrderStatus.Assigned,
    serviceIds: ["dry_clean"],
    totalItemCount: 60,
    createdAt: buildOffsetDate({ hours: -1, minutes: -10 }),
    updatedAt: buildOffsetDate({ minutes: -5 }),
    pickupAt: buildOffsetDate({ hours: 22 }),
    responseDueAt: buildOffsetDate({ minutes: 18 }),
  }),
  createSeedOrder({
    id: "ORD-1043",
    hotelId: DEFAULT_HOTEL_ID,
    providerId: DEFAULT_PROVIDER_ID,
    status: OrderStatus.Assigned,
    serviceIds: ["wash_fold", "iron"],
    totalItemCount: 95,
    createdAt: buildOffsetDate({ hours: -2 }),
    updatedAt: buildOffsetDate({ minutes: -10 }),
    pickupAt: buildOffsetDate({ hours: 20 }),
    responseDueAt: buildOffsetDate({ minutes: 25 }),
  }),
  createSeedOrder({
    id: "ORD-1042",
    hotelId: DEFAULT_HOTEL_ID,
    providerId: DEFAULT_PROVIDER_ID,
    status: OrderStatus.Completed,
    serviceIds: ["wash_fold"],
    totalItemCount: 85,
    createdAt: buildOffsetDate({ days: -2, hours: -4 }),
    updatedAt: buildOffsetDate({ days: -1, hours: -2 }),
    pickupAt: buildOffsetDate({ days: -2, hours: 8 }),
    progressPercent: 100,
    settlement: true,
  }),
  createSeedOrder({
    id: "ORD-1041",
    hotelId: DEFAULT_HOTEL_ID,
    providerId: "provider-2",
    status: OrderStatus.InProcessing,
    serviceIds: ["dry_clean"],
    totalItemCount: 120,
    createdAt: buildOffsetDate({ days: -1, hours: -6 }),
    updatedAt: buildOffsetDate({ hours: -6 }),
    pickupAt: buildOffsetDate({ days: -1, hours: 4 }),
    progressPercent: 65,
  }),
  createSeedOrder({
    id: "ORD-1040",
    hotelId: DEFAULT_HOTEL_ID,
    providerId: DEFAULT_PROVIDER_ID,
    status: OrderStatus.PickedUp,
    serviceIds: ["wash_fold"],
    totalItemCount: 45,
    createdAt: buildOffsetDate({ days: -2, hours: -8 }),
    updatedAt: buildOffsetDate({ hours: -14 }),
    pickupAt: buildOffsetDate({ days: -1, hours: -1 }),
    progressPercent: 35,
  }),
  createSeedOrder({
    id: "ORD-1039",
    hotelId: DEFAULT_HOTEL_ID,
    providerId: "provider-3",
    status: OrderStatus.Delivered,
    serviceIds: ["dry_clean"],
    totalItemCount: 200,
    createdAt: buildOffsetDate({ days: -4 }),
    updatedAt: buildOffsetDate({ days: -2 }),
    pickupAt: buildOffsetDate({ days: -3 }),
    progressPercent: 100,
    settlement: true,
  }),
  createSeedOrder({
    id: "ORD-1038",
    hotelId: "hotel-3",
    providerId: DEFAULT_PROVIDER_ID,
    status: OrderStatus.InProcessing,
    serviceIds: ["wash_fold", "iron"],
    totalItemCount: 140,
    createdAt: buildOffsetDate({ days: -2 }),
    updatedAt: buildOffsetDate({ hours: -5 }),
    pickupAt: buildOffsetDate({ days: -1, hours: -8 }),
    progressPercent: 65,
  }),
  createSeedOrder({
    id: "ORD-1037",
    hotelId: "hotel-4",
    providerId: DEFAULT_PROVIDER_ID,
    status: OrderStatus.QualityCheck,
    serviceIds: ["wash_fold", "iron"],
    totalItemCount: 80,
    createdAt: buildOffsetDate({ days: -2, hours: -4 }),
    updatedAt: buildOffsetDate({ hours: -3 }),
    pickupAt: buildOffsetDate({ days: -1, hours: -10 }),
    progressPercent: 90,
  }),
  createSeedOrder({
    id: "ORD-1036",
    hotelId: "hotel-5",
    providerId: DEFAULT_PROVIDER_ID,
    status: OrderStatus.OutForDelivery,
    serviceIds: ["wash_fold"],
    totalItemCount: 110,
    createdAt: buildOffsetDate({ days: -3 }),
    updatedAt: buildOffsetDate({ hours: -2 }),
    pickupAt: buildOffsetDate({ days: -2 }),
    progressPercent: 95,
  }),
];

let orders = clone(initialOrders);
let nextOrderNumber = 1045;

const processExpiredAssignments = (referenceTime = new Date().toISOString()) => {
  const expiredOrderIds = orders
    .filter((order) => {
      if (order.status !== OrderStatus.Assigned) {
        return false;
      }

      if (!order.activeAssignment || order.activeAssignment.status !== AssignmentStatus.PendingAcceptance) {
        return false;
      }

      if (!order.activeAssignment.responseDueAt) {
        return false;
      }

      return new Date(order.activeAssignment.responseDueAt).getTime() <= new Date(referenceTime).getTime();
    })
    .sort((left, right) => {
      const leftDueAt = left.activeAssignment?.responseDueAt ?? "";
      const rightDueAt = right.activeAssignment?.responseDueAt ?? "";
      return leftDueAt.localeCompare(rightDueAt);
    })
    .map((order) => order.id);

  for (const orderId of expiredOrderIds) {
    orders = orders.map((order) =>
      order.id === orderId
        ? reassignOrderAfterPendingFailure(order, {
            changedAt: referenceTime,
            reason: ReassignmentReason.ProviderExpired,
            actorRole: "system",
          })
        : order,
    );
  }
};

function getOrderOrThrow(orderId: string) {
  const order = orders.find((currentOrder) => currentOrder.id === orderId);

  if (!order) {
    throw new Error(`Order ${orderId} was not found in the preview store.`);
  }

  return order;
}

function updateOrder(orderId: string, updater: (order: LaundryOrder) => LaundryOrder) {
  orders = orders.map((order) => (order.id === orderId ? updater(order) : order));
  return clone(getOrderOrThrow(orderId));
}

export async function getCurrentAccountSession() {
  const currentSession = getCurrentStoredAccountSession();

  if (!currentSession) {
    return null;
  }

  const account = accounts[currentSession.accountId];

  if (!account) {
    return null;
  }

  return {
    account: sanitizeAccount(account),
    session: sanitizeAccountSession(currentSession),
  };
}

export async function resolveAccountSession(sessionToken: string) {
  const session = resolveStoredAccountSessionByToken(sessionToken);

  if (!session) {
    return null;
  }

  const account = accounts[session.accountId];

  if (!account) {
    return null;
  }

  return {
    account: sanitizeAccount(account),
    session: sanitizeAccountSession(session),
  };
}

export async function listAccounts() {
  return clone(Object.values(accounts).map((account) => buildAccountAdminSummary(account)));
}

export async function login({ email, password }: { email: string; password: string }) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = findAccountByEmail(normalizedEmail);

  if (!account) {
    recordIdentityAuditEvent({
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
    recordIdentityAuditEvent({
      accountId: account.id,
      type: IdentityAuditEventType.LoginFailed,
      actorRole: "system",
      linkedEntityType: account.linkedEntityType,
      linkedEntityId: getLinkedEntityId(account),
      detailsAr: "فشل تسجيل الدخول لأن الحساب لم يُفعّل بعد.",
      metadata: {
        reason: "pending_activation",
      },
    });
    throw new Error(ACCOUNT_NOT_ACTIVATED_ERROR);
  }

  if (account.status !== AccountStatus.Active) {
    recordIdentityAuditEvent({
      accountId: account.id,
      type: IdentityAuditEventType.LoginFailed,
      actorRole: "system",
      linkedEntityType: account.linkedEntityType,
      linkedEntityId: getLinkedEntityId(account),
      detailsAr: "فشل تسجيل الدخول لأن الحساب موقوف.",
      metadata: {
        reason: "suspended",
      },
    });
    throw new Error(ACCOUNT_SUSPENDED_ERROR);
  }

  const passwordValid = await verifyPasswordDigest(password, account.passwordSalt, account.passwordHash);

  if (!passwordValid) {
    recordIdentityAuditEvent({
      accountId: account.id,
      type: IdentityAuditEventType.LoginFailed,
      actorRole: "system",
      linkedEntityType: account.linkedEntityType,
      linkedEntityId: getLinkedEntityId(account),
      detailsAr: "فشل تسجيل الدخول بسبب كلمة مرور غير صحيحة.",
      metadata: {
        reason: "invalid_password",
      },
    });
    throw new Error(ACCOUNT_INVALID_CREDENTIALS_ERROR);
  }

  if (account.role === AccountRole.Hotel && !isHotelOperationallyApproved(hotelProfiles[account.linkedHotelId ?? ""])) {
    recordIdentityAuditEvent({
      accountId: account.id,
      type: IdentityAuditEventType.LoginFailed,
      actorRole: "system",
      linkedEntityType: account.linkedEntityType,
      linkedEntityId: getLinkedEntityId(account),
      detailsAr: "فشل تسجيل الدخول لأن الفندق المرتبط بالحساب غير معتمد.",
      metadata: {
        reason: "hotel_not_approved",
      },
    });
    throw new Error(HOTEL_ACCESS_NOT_APPROVED_ERROR);
  }

  if (
    account.role === AccountRole.Provider &&
    !isProviderOperationallyApproved(providerProfiles[account.linkedProviderId ?? ""])
  ) {
    recordIdentityAuditEvent({
      accountId: account.id,
      type: IdentityAuditEventType.LoginFailed,
      actorRole: "system",
      linkedEntityType: account.linkedEntityType,
      linkedEntityId: getLinkedEntityId(account),
      detailsAr: "فشل تسجيل الدخول لأن المزوّد المرتبط بالحساب غير معتمد.",
      metadata: {
        reason: "provider_not_approved",
      },
    });
    throw new Error(PROVIDER_ACCESS_NOT_APPROVED_ERROR);
  }

  return issueSessionForAccount(account, new Date().toISOString());
}

export async function validateActivationToken({ token }: { token: string }) {
  return buildAccountTokenValidationResult(await getActivationTokenValidationResult(token));
}

export async function activateAccount({
  token,
  password,
  fullName,
  phone,
}: {
  token: string;
  password: string;
  fullName?: string;
  phone?: string;
}) {
  const validation = await getActivationTokenValidationResult(token);
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

  const passwordDigest = await createPasswordDigest(password);
  const timestamp = new Date().toISOString();
  const nextAccount: StoredAccount = {
    ...account,
    fullName: fullName?.trim() || account.fullName,
    phone: phone?.trim() || account.phone,
    passwordSalt: passwordDigest.salt,
    passwordHash: passwordDigest.hash,
    activationTokenHash: account.activationTokenHash,
    status: AccountStatus.Active,
    activation: {
      state: AccountActivationState.Activated,
      eligibleAt: account.activation.eligibleAt,
      issuedAt: account.activation.issuedAt,
      tokenExpiresAt: account.activation.tokenExpiresAt,
      usedAt: timestamp,
      activatedAt: timestamp,
    },
    updatedAt: timestamp,
  };

  accounts = {
    ...accounts,
    [account.id]: nextAccount,
  };

  recordIdentityAuditEvent({
    accountId: nextAccount.id,
    type: IdentityAuditEventType.AccountActivated,
    actorAccountId: nextAccount.id,
    actorRole: nextAccount.role,
    linkedEntityType: nextAccount.linkedEntityType,
    linkedEntityId: getLinkedEntityId(nextAccount),
    detailsAr: "تم تفعيل الحساب بنجاح وإكمال إعداد كلمة المرور.",
    createdAt: timestamp,
  });

  return issueSessionForAccount(nextAccount, timestamp);
}

export async function requestPasswordReset({ email }: { email: string }) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = findAccountByEmail(normalizedEmail);

  if (
    !account ||
    account.activation.state !== AccountActivationState.Activated ||
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
  const nextAccount: StoredAccount = {
    ...account,
    passwordResetTokenHash: tokenHash,
    passwordReset: {
      state: PasswordResetState.Ready,
      requestedAt: timestamp,
      issuedAt: timestamp,
      tokenExpiresAt: addHours(timestamp, PASSWORD_RESET_TOKEN_DURATION_HOURS),
      usedAt: undefined,
      completedAt: undefined,
      resetPath: buildResetPasswordPath(token),
    },
    updatedAt: timestamp,
  };

  accounts = {
    ...accounts,
    [account.id]: nextAccount,
  };

  recordIdentityAuditEvent({
    accountId: nextAccount.id,
    type: IdentityAuditEventType.PasswordResetRequested,
    actorAccountId: nextAccount.id,
    actorRole: nextAccount.role,
    linkedEntityType: nextAccount.linkedEntityType,
    linkedEntityId: getLinkedEntityId(nextAccount),
    detailsAr: "تم إصدار رابط إعادة ضبط كلمة المرور للحساب.",
    createdAt: timestamp,
  });

  return {
    accepted: true as const,
    messageAr: PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
    resetPath: nextAccount.passwordReset.resetPath,
    accountId: nextAccount.id,
    accountEmail: nextAccount.email,
    accountFullName: nextAccount.fullName,
    role: nextAccount.role,
    linkedEntityType: nextAccount.linkedEntityType,
    linkedEntityId: getLinkedEntityId(nextAccount),
  };
}

export async function validateResetPasswordToken({ token }: { token: string }) {
  return buildAccountTokenValidationResult(await getPasswordResetTokenValidationResult(token));
}

export async function resetPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  const validation = await getPasswordResetTokenValidationResult(token);
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

  const passwordDigest = await createPasswordDigest(password);
  const timestamp = new Date().toISOString();

  revokeAccountSessions({
    accountId: account.id,
    reasonAr: "تم إلغاء الجلسات السابقة بعد إعادة ضبط كلمة المرور.",
    revokedByAccountId: account.id,
    revokedByRole: account.role,
    revokedAt: timestamp,
  });

  const nextAccount: StoredAccount = {
    ...account,
    passwordSalt: passwordDigest.salt,
    passwordHash: passwordDigest.hash,
    passwordResetTokenHash: account.passwordResetTokenHash,
    passwordReset: {
      ...account.passwordReset,
      state: PasswordResetState.Completed,
      usedAt: timestamp,
      completedAt: timestamp,
      resetPath: undefined,
    },
    updatedAt: timestamp,
  };

  accounts = {
    ...accounts,
    [account.id]: nextAccount,
  };

  recordIdentityAuditEvent({
    accountId: nextAccount.id,
    type: IdentityAuditEventType.PasswordResetCompleted,
    actorAccountId: nextAccount.id,
    actorRole: nextAccount.role,
    linkedEntityType: nextAccount.linkedEntityType,
    linkedEntityId: getLinkedEntityId(nextAccount),
    detailsAr: "تمت إعادة ضبط كلمة المرور للحساب بنجاح.",
    createdAt: timestamp,
  });

  return issueSessionForAccount(nextAccount, timestamp);
}

export async function logout(sessionToken?: string) {
  const currentSession = sessionToken
    ? resolveStoredAccountSessionByToken(sessionToken)
    : getCurrentStoredAccountSession();

  if (!currentSession) {
    return;
  }

  accountSessions = {
    ...accountSessions,
    [currentSession.id]: {
      ...currentSession,
      revokedAt: new Date().toISOString(),
      revokedReasonAr: "تم تسجيل الخروج من الحساب.",
      revokedByAccountId: currentSession.accountId,
      revokedByRole: currentSession.role,
    },
  };

  recordIdentityAuditEvent({
    accountId: currentSession.accountId,
    sessionId: currentSession.id,
    type: IdentityAuditEventType.Logout,
    actorAccountId: currentSession.accountId,
    actorRole: currentSession.role,
    linkedEntityType: currentSession.linkedEntityType,
    linkedEntityId: currentSession.linkedEntityId,
    detailsAr: "تم تسجيل الخروج من الجلسة الحالية.",
  });
}

export async function listIdentityAuditEvents() {
  return clone(identityAuditEvents.map((event) => buildIdentityAuditEventSummary(event)));
}

export async function recordIdentityAuditEventEntry(
  event: Omit<IdentityAuditEvent, "id" | "createdAt"> & { createdAt?: string },
) {
  return buildIdentityAuditEventSummary(recordIdentityAuditEvent(event));
}

export async function suspendAccount(accountId: string, reasonAr?: string) {
  const adminAccount = ensureAuthenticatedAdminAccount();
  const account = accounts[accountId];

  if (!account) {
    throw new Error("تعذر العثور على الحساب المطلوب.");
  }

  const timestamp = new Date().toISOString();
  const suspensionReason = reasonAr?.trim() || "تم إيقاف الحساب من قبل الإدارة.";

  revokeAccountSessions({
    accountId,
    reasonAr: "تم إلغاء الجلسات بسبب إيقاف الحساب.",
    revokedByAccountId: adminAccount.id,
    revokedByRole: adminAccount.role,
    revokedAt: timestamp,
  });

  const nextAccount: StoredAccount = {
    ...account,
    status: AccountStatus.Suspended,
    suspension: {
      ...account.suspension,
      suspendedAt: timestamp,
      suspendedByAccountId: adminAccount.id,
      suspendedByRole: adminAccount.role,
      suspensionReasonAr: suspensionReason,
    },
    updatedAt: timestamp,
  };

  accounts = {
    ...accounts,
    [accountId]: nextAccount,
  };

  recordIdentityAuditEvent({
    accountId,
    type: IdentityAuditEventType.AccountSuspended,
    actorAccountId: adminAccount.id,
    actorRole: adminAccount.role,
    linkedEntityType: nextAccount.linkedEntityType,
    linkedEntityId: getLinkedEntityId(nextAccount),
    detailsAr: suspensionReason,
    createdAt: timestamp,
  });

  return buildAccountAdminSummary(nextAccount);
}

export async function reactivateAccount(accountId: string, reasonAr?: string) {
  const adminAccount = ensureAuthenticatedAdminAccount();
  const account = accounts[accountId];

  if (!account) {
    throw new Error("تعذر العثور على الحساب المطلوب.");
  }

  const timestamp = new Date().toISOString();
  const nextStatus =
    account.activation.state === AccountActivationState.Activated
      ? AccountStatus.Active
      : AccountStatus.PendingActivation;
  const nextAccount: StoredAccount = {
    ...account,
    status: nextStatus,
    suspension: {
      ...account.suspension,
      reactivatedAt: timestamp,
      reactivatedByAccountId: adminAccount.id,
      reactivatedByRole: adminAccount.role,
      reactivationReasonAr: reasonAr?.trim() || "تمت إعادة تنشيط الحساب من قبل الإدارة.",
    },
    updatedAt: timestamp,
  };

  accounts = {
    ...accounts,
    [accountId]: nextAccount,
  };

  recordIdentityAuditEvent({
    accountId,
    type: IdentityAuditEventType.AccountReactivated,
    actorAccountId: adminAccount.id,
    actorRole: adminAccount.role,
    linkedEntityType: nextAccount.linkedEntityType,
    linkedEntityId: getLinkedEntityId(nextAccount),
    detailsAr: nextAccount.suspension.reactivationReasonAr,
    createdAt: timestamp,
  });

  return buildAccountAdminSummary(nextAccount);
}

export async function resendActivationEmail(accountId: string) {
  const adminAccount = ensureAuthenticatedAdminAccount();
  const account = accounts[accountId];

  if (!account) {
    throw new Error("تعذر العثور على الحساب المطلوب.");
  }

  if (account.activation.state === AccountActivationState.Activated) {
    throw new Error("تم تفعيل هذا الحساب مسبقًا، ولا يحتاج إلى رابط تفعيل جديد.");
  }

  if (account.status === AccountStatus.Suspended) {
    throw new Error("لا يمكن إعادة إرسال التفعيل إلى حساب موقوف. أعد تنشيطه أولًا.");
  }

  const nextAccount = await issueActivationForAccount(accountId, new Date().toISOString());

  return buildLinkedAccountSummary(nextAccount);
}

export async function getHotelProfile(hotelId?: string) {
  return clone(ensureHotelOperationalAccess(hotelId));
}

export async function listHotels() {
  return clone(Object.values(hotelProfiles).filter((hotel) => isHotelOperationallyApproved(hotel)));
}

export async function listHotelRegistrations() {
  return clone(
    Object.values(hotelProfiles).sort((left, right) =>
      right.onboarding.submittedAt.localeCompare(left.onboarding.submittedAt),
    ),
  );
}

export async function getProviderProfile(providerId?: string) {
  processExpiredAssignments();
  return clone(ensureProviderOperationalAccess(providerId));
}

export async function listProviders() {
  processExpiredAssignments();
  return clone(Object.values(providerProfiles).filter((provider) => isProviderOperationallyApproved(provider)));
}

export async function listProviderRegistrations() {
  processExpiredAssignments();
  return clone(
    Object.values(providerProfiles).sort((left, right) =>
      right.onboarding.submittedAt.localeCompare(left.onboarding.submittedAt),
    ),
  );
}

export async function listServiceCatalog() {
  return clone(serviceCatalog);
}

export async function registerHotel(input: HotelRegistrationInput) {
  const validatedInput = validateHotelRegistrationInput(input);
  const submittedAt = new Date().toISOString();
  const nextNumber = selectNextEntityNumber(Object.keys(hotelProfiles), "hotel");
  const hotelId = `hotel-${nextNumber}`;
  const account = createPendingLinkedAccount({
    fullName: validatedInput.contactPersonName,
    email: ensureUniqueAccountEmail(validatedInput.contactEmail),
    phone: validatedInput.contactPhone,
    role: AccountRole.Hotel,
    linkedHotelId: hotelId,
    createdAt: submittedAt,
  });
  const hotel: HotelProfile = {
    id: hotelId,
    code: `HTL-REG-${String(nextNumber).padStart(3, "0")}`,
    displayName: buildLocalizedText(validatedInput.hotelName),
    legalEntityName: validatedInput.legalEntityName,
    classification: validatedInput.hotelClassification,
    roomCount: Math.round(validatedInput.roomCount),
    address: {
      countryCode: "SA",
      city: validatedInput.city,
      line1: validatedInput.addressText,
      latitude: validatedInput.latitude,
      longitude: validatedInput.longitude,
    },
    timezone: "Asia/Riyadh",
    contact: {
      name: validatedInput.contactPersonName,
      email: validatedInput.contactEmail,
      phone: validatedInput.contactPhone,
    },
    operationalProfile: {
      serviceLevel: validatedInput.serviceLevel,
      operatingHours: validatedInput.operatingHours,
      requiresDailyPickup: validatedInput.requiresDailyPickup,
    },
    logistics: {
      addressText: validatedInput.addressText,
      pickupLocation: validatedInput.pickupLocation,
      hasLoadingArea: validatedInput.hasLoadingArea,
      accessNotes: validatedInput.accessNotes,
    },
    compliance: {
      taxRegistrationNumber: validatedInput.taxRegistrationNumber,
      commercialRegistrationNumber: validatedInput.commercialRegistrationNumber,
      commercialRegistrationFile: buildPreviewRegistrationDocumentReference({
        hotelId,
        file: validatedInput.commercialRegistrationFile,
        kind: "commercial_registration",
        uploadedAt: submittedAt,
      }),
      delegationLetterFile: validatedInput.delegationLetterFile
        ? buildPreviewRegistrationDocumentReference({
            hotelId,
            file: validatedInput.delegationLetterFile,
            kind: "delegation_letter",
            uploadedAt: submittedAt,
          })
        : undefined,
      delegationStatus: validatedInput.delegationLetterFile ? "pending_review" : "not_provided",
    },
    contractedServiceIds: [],
    active: false,
    notesAr: validatedInput.notesAr,
    onboarding: buildPendingOnboarding(submittedAt),
    createdAt: submittedAt,
    updatedAt: submittedAt,
  };

  hotelProfiles = {
    ...hotelProfiles,
    [hotelId]: hotel,
  };
  accounts = {
    ...accounts,
    [account.id]: account,
  };

  recordIdentityAuditEvent({
    accountId: account.id,
    type: IdentityAuditEventType.AccountCreated,
    actorRole: "system",
    linkedEntityType: account.linkedEntityType,
    linkedEntityId: hotelId,
    detailsAr: "تم إنشاء حساب فندق جديد بانتظار الاعتماد والتفعيل.",
    createdAt: submittedAt,
  });

  return clone({
    hotel,
    account: {
      accountId: account.id,
      email: account.email,
      role: account.role,
      roleLabelAr: account.role === AccountRole.Hotel ? "فندق" : "مزود خدمة",
      status: account.status,
      statusLabelAr: "بانتظار التفعيل",
      activationState: account.activation.state,
      activationStateLabelAr: "بانتظار اعتماد الجهة",
    },
  });
}

export async function registerProvider(input: ProviderRegistrationInput) {
  const validatedInput = validateProviderRegistrationInput(input);
  const submittedAt = new Date().toISOString();
  const nextNumber = selectNextEntityNumber(Object.keys(providerProfiles), "provider");
  const providerId = `provider-${nextNumber}`;
  const account = createPendingLinkedAccount({
    fullName: validatedInput.contactPersonName,
    email: ensureUniqueAccountEmail(validatedInput.contactEmail),
    phone: validatedInput.contactPhone,
    role: AccountRole.Provider,
    linkedProviderId: providerId,
    createdAt: submittedAt,
  });
  const provider: ProviderProfile = {
    id: providerId,
    code: `PRV-REG-${String(nextNumber).padStart(3, "0")}`,
    legalName: buildLocalizedText(validatedInput.providerName),
    displayName: buildLocalizedText(validatedInput.providerName),
    address: {
      countryCode: "SA",
      city: validatedInput.city,
    },
    timezone: "Asia/Riyadh",
    contact: {
      name: validatedInput.contactPersonName,
      email: validatedInput.contactEmail,
      phone: validatedInput.contactPhone,
    },
    serviceAreaCities: [validatedInput.city],
    capabilities: buildPendingProviderCapabilities(
      validatedInput.supportedServiceIds,
      validatedInput.city,
      validatedInput.dailyCapacityKg,
    ),
    currentCapacity: {
      providerId,
      date: submittedAt.slice(0, 10),
      totalKg: validatedInput.dailyCapacityKg,
      committedKg: 0,
      reservedKg: 0,
      availableKg: validatedInput.dailyCapacityKg,
      utilizationRatio: 0,
      status: ProviderCapacityStatus.Available,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    },
    performance: {
      providerId,
      rating: 4.2,
      acceptanceRate: 0.9,
      onTimePickupRate: 0.9,
      onTimeDeliveryRate: 0.9,
      qualityScore: 75,
      disputeRate: 0.01,
      reassignmentRate: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      lastEvaluatedAt: submittedAt,
    },
    active: false,
    notesAr: validatedInput.notesAr,
    onboarding: buildPendingOnboarding(submittedAt),
    createdAt: submittedAt,
    updatedAt: submittedAt,
  };

  providerProfiles = {
    ...providerProfiles,
    [providerId]: provider,
  };
  accounts = {
    ...accounts,
    [account.id]: account,
  };

  recordIdentityAuditEvent({
    accountId: account.id,
    type: IdentityAuditEventType.AccountCreated,
    actorRole: "system",
    linkedEntityType: account.linkedEntityType,
    linkedEntityId: providerId,
    detailsAr: "تم إنشاء حساب مزوّد جديد بانتظار الاعتماد والتفعيل.",
    createdAt: submittedAt,
  });

  return clone({
    provider,
    account: {
      accountId: account.id,
      email: account.email,
      role: account.role,
      roleLabelAr: "مزود خدمة",
      status: account.status,
      statusLabelAr: "بانتظار التفعيل",
      activationState: account.activation.state,
      activationStateLabelAr: "بانتظار اعتماد الجهة",
    },
  });
}

const reviewHotelRegistration = async (
  hotelId: string,
  status: OnboardingStatus.Approved | OnboardingStatus.Rejected,
  reviewNotesAr?: string,
) => {
  const hotel = hotelProfiles[hotelId];

  if (!hotel) {
    throw new Error("تعذر العثور على طلب تسجيل الفندق.");
  }

  const reviewedAt = new Date().toISOString();
  const nextHotel: HotelProfile = {
    ...hotel,
    active: status === OnboardingStatus.Approved,
    onboarding: {
      ...hotel.onboarding,
      status,
      reviewedAt,
      reviewedByRole: "admin",
      reviewedById: "admin-console",
      reviewNotesAr: reviewNotesAr?.trim() || undefined,
    },
    updatedAt: reviewedAt,
  };

  hotelProfiles = {
    ...hotelProfiles,
    [hotelId]: nextHotel,
  };

  const linkedAccount = findAccountByLinkedHotelId(hotelId);

  if (linkedAccount) {
    if (status === OnboardingStatus.Approved) {
      await issueActivationForAccount(linkedAccount.id, reviewedAt);
    } else {
      revokeAccountSessions({
        accountId: linkedAccount.id,
        reasonAr: "تم إلغاء الجلسات لأن طلب اعتماد الفندق رُفض.",
        revokedByRole: "admin",
        revokedAt: reviewedAt,
      });
      accounts = {
        ...accounts,
        [linkedAccount.id]: {
          ...linkedAccount,
          status: AccountStatus.PendingActivation,
          activationTokenHash: undefined,
          activation: {
            state: AccountActivationState.AwaitingApproval,
          },
          passwordResetTokenHash: undefined,
          passwordReset: {
            state: PasswordResetState.Idle,
          },
          updatedAt: reviewedAt,
        },
      };
    }
  }

  const nextAccount = findAccountByLinkedHotelId(hotelId);

  if (!nextAccount) {
    throw new Error("تعذر العثور على الحساب المرتبط بالفندق.");
  }

  return clone({
    hotel: nextHotel,
    account: buildLinkedAccountSummary(nextAccount),
  });
};

const reviewProviderRegistration = async (
  providerId: string,
  status: OnboardingStatus.Approved | OnboardingStatus.Rejected,
  reviewNotesAr?: string,
) => {
  const provider = providerProfiles[providerId];

  if (!provider) {
    throw new Error("تعذر العثور على طلب تسجيل المزوّد.");
  }

  const reviewedAt = new Date().toISOString();
  const nextProvider: ProviderProfile = {
    ...provider,
    active: status === OnboardingStatus.Approved,
    onboarding: {
      ...provider.onboarding,
      status,
      reviewedAt,
      reviewedByRole: "admin",
      reviewedById: "admin-console",
      reviewNotesAr: reviewNotesAr?.trim() || undefined,
    },
    updatedAt: reviewedAt,
  };

  providerProfiles = {
    ...providerProfiles,
    [providerId]: nextProvider,
  };

  const linkedAccount = findAccountByLinkedProviderId(providerId);

  if (linkedAccount) {
    if (status === OnboardingStatus.Approved) {
      await issueActivationForAccount(linkedAccount.id, reviewedAt);
    } else {
      revokeAccountSessions({
        accountId: linkedAccount.id,
        reasonAr: "تم إلغاء الجلسات لأن طلب اعتماد المزوّد رُفض.",
        revokedByRole: "admin",
        revokedAt: reviewedAt,
      });
      accounts = {
        ...accounts,
        [linkedAccount.id]: {
          ...linkedAccount,
          status: AccountStatus.PendingActivation,
          activationTokenHash: undefined,
          activation: {
            state: AccountActivationState.AwaitingApproval,
          },
          passwordResetTokenHash: undefined,
          passwordReset: {
            state: PasswordResetState.Idle,
          },
          updatedAt: reviewedAt,
        },
      };
    }
  }

  const nextAccount = findAccountByLinkedProviderId(providerId);

  if (!nextAccount) {
    throw new Error("تعذر العثور على الحساب المرتبط بالمزوّد.");
  }

  return clone({
    provider: nextProvider,
    account: buildLinkedAccountSummary(nextAccount),
  });
};

export async function approveHotelRegistration(hotelId: string, reviewNotesAr?: string) {
  return reviewHotelRegistration(hotelId, OnboardingStatus.Approved, reviewNotesAr);
}

export async function rejectHotelRegistration(hotelId: string, reviewNotesAr?: string) {
  return reviewHotelRegistration(hotelId, OnboardingStatus.Rejected, reviewNotesAr);
}

export async function approveProviderRegistration(providerId: string, reviewNotesAr?: string) {
  return reviewProviderRegistration(providerId, OnboardingStatus.Approved, reviewNotesAr);
}

export async function rejectProviderRegistration(providerId: string, reviewNotesAr?: string) {
  return reviewProviderRegistration(providerId, OnboardingStatus.Rejected, reviewNotesAr);
}

export async function runAssignmentExpirySweep(referenceTime = new Date().toISOString()) {
  processExpiredAssignments(referenceTime);
  return clone(
    orders
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );
}

export async function expirePendingAssignment(orderId: string, referenceTime = new Date().toISOString()) {
  return updateOrder(orderId, (order) => {
    if (
      order.status !== OrderStatus.Assigned ||
      !order.activeAssignment ||
      order.activeAssignment.status !== AssignmentStatus.PendingAcceptance ||
      !order.activeAssignment.responseDueAt ||
      new Date(order.activeAssignment.responseDueAt).getTime() > new Date(referenceTime).getTime()
    ) {
      return order;
    }

    return reassignOrderAfterPendingFailure(order, {
      changedAt: referenceTime,
      reason: ReassignmentReason.ProviderExpired,
      actorRole: "system",
    });
  });
}

export async function listAllOrders() {
  processExpiredAssignments();
  return clone(
    orders
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );
}

export async function listHotelOrders(hotelId?: string) {
  processExpiredAssignments();
  const authorizedHotel = ensureHotelOperationalAccess(hotelId);
  return clone(
    orders
      .filter((order) => order.hotelId === authorizedHotel.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  );
}

export async function listProviderIncomingOrders(providerId?: string) {
  processExpiredAssignments();
  const authorizedProvider = ensureProviderOperationalAccess(providerId);
  return clone(
    orders
      .filter((order) => order.providerId === authorizedProvider.id && order.status === OrderStatus.Assigned)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  );
}

export async function listProviderActiveOrders(providerId?: string) {
  processExpiredAssignments();
  const authorizedProvider = ensureProviderOperationalAccess(providerId);
  const activeStatuses = new Set([
    OrderStatus.Accepted,
    OrderStatus.PickupScheduled,
    OrderStatus.PickedUp,
    OrderStatus.InProcessing,
    OrderStatus.QualityCheck,
    OrderStatus.OutForDelivery,
    OrderStatus.Delivered,
  ]);

  return clone(
    orders
      .filter((order) => order.providerId === authorizedProvider.id && activeStatuses.has(order.status))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );
}

export async function createHotelOrder(input: CreateHotelOrderInput) {
  processExpiredAssignments();
  const hotel = ensureHotelOperationalAccess(input.hotelId);
  const validatedInput = validateCreateHotelOrderInput(input);
  const orderId = `ORD-${nextOrderNumber}`;
  const items = buildOrderItems(orderId, validatedInput.serviceIds, validatedInput.itemCount);
  const estimatedSubtotalSar = items.reduce((sum, item) => sum + item.estimatedLineTotalSar, 0);
  const timestamp = new Date().toISOString();
  const submittedOrder: LaundryOrder = {
    id: orderId,
    hotelId: hotel.id,
    hotelSnapshot: buildHotelSnapshot(hotel.id),
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
  const matchingResult = matchProvidersForOrder(autoMatchingOrder, Object.values(providerProfiles), {
    evaluatedAt: timestamp,
  });
  const rankedLogOrder = new Map(
    matchingResult.rankedProviders.map((providerMatch, index) => [providerMatch.provider.id, index]),
  );
  const matchingLogs = matchingResult.logs
    .slice()
    .sort((left, right) => {
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

  let nextOrder: LaundryOrder = {
    ...autoMatchingOrder,
    updatedAt: matchingResult.evaluatedAt,
    statusUpdatedAt: matchingResult.evaluatedAt,
    matchingLogs,
  };

  if (matchingResult.bestProvider) {
    const bestProviderId = matchingResult.bestProvider.provider.id;
    const responseDueAt = buildFutureDate(
      matchingResult.evaluatedAt,
      AUTO_ASSIGNMENT_RESPONSE_WINDOW_MINUTES,
    );
    const activeAssignment: Assignment = {
      id: `assignment-${orderId}-1`,
      orderId,
      hotelId: hotel.id,
      providerId: bestProviderId,
      attemptNumber: 1,
      status: AssignmentStatus.PendingAcceptance,
      assignedAt: matchingResult.evaluatedAt,
      responseDueAt,
      scoreBreakdown: matchingResult.bestProvider.scoreBreakdown,
      eligibilityResult: matchingResult.bestProvider.eligibilityResult,
    };

    reserveProviderCapacity(bestProviderId, getRequestedCapacityKg(submittedOrder), matchingResult.evaluatedAt);

    nextOrder = {
      ...nextOrder,
      status: OrderStatus.Assigned,
      providerId: bestProviderId,
      providerSnapshot: buildProviderSnapshot(bestProviderId),
      progressPercent: getOrderProgressPercent(OrderStatus.Assigned),
      activeAssignmentId: activeAssignment.id,
      activeAssignment,
      assignmentHistory: [
        {
          id: `assignment-history-${activeAssignment.id}-${AssignmentStatus.PendingAcceptance}`,
          assignmentId: activeAssignment.id,
          orderId,
          providerId: bestProviderId,
          attemptNumber: 1,
          toStatus: AssignmentStatus.PendingAcceptance,
          changedAt: matchingResult.evaluatedAt,
          actorRole: "system",
          reasonAr: "تم إسناد الطلب تلقائياً إلى أفضل مزود مؤهل.",
        },
      ],
      slaWindow: {
        ...nextOrder.slaWindow,
        responseDueAt,
      },
      statusHistory: appendOrderStatusHistory({
        order: nextOrder,
        toStatus: OrderStatus.Assigned,
        changedAt: matchingResult.evaluatedAt,
        actorRole: "system",
        notesAr: "تم إسناد الطلب تلقائياً إلى مزوّد مؤهل.",
      }),
    };
  } else {
    nextOrder = {
      ...nextOrder,
      status: OrderStatus.PendingCapacity,
      statusHistory: appendOrderStatusHistory({
        order: nextOrder,
        toStatus: OrderStatus.PendingCapacity,
        changedAt: matchingResult.evaluatedAt,
        actorRole: "system",
        notesAr: "تعذر إيجاد مزوّد مؤهل حاليًا، وتم تحويل الطلب إلى قائمة انتظار السعة.",
      }),
    };
  }

  nextOrderNumber += 1;
  orders = [nextOrder, ...orders];

  return clone(nextOrder);
}

export async function acceptIncomingOrder(orderId: string, providerId?: string) {
  processExpiredAssignments();
  const authorizedProvider = ensureProviderOperationalAccess(providerId);
  return updateOrder(orderId, (order) => {
    if (
      order.status !== OrderStatus.Assigned ||
      !order.activeAssignment ||
      order.activeAssignment.status !== AssignmentStatus.PendingAcceptance ||
      order.providerId !== authorizedProvider.id ||
      order.activeAssignment.providerId !== authorizedProvider.id
    ) {
      throw new Error("لم يعد هذا الطلب متاحاً للقبول من هذا المزوّد.");
    }

    const timestamp = new Date().toISOString();
    const reservedQuantityKg = getRequestedCapacityKg(order);
    const activeAssignment = order.activeAssignment
      ? {
          ...order.activeAssignment,
          status: AssignmentStatus.Accepted,
          respondedAt: timestamp,
          acceptedAt: timestamp,
        }
      : undefined;

    if (activeAssignment) {
      commitReservedProviderCapacity(activeAssignment.providerId, reservedQuantityKg, timestamp);
    }

    const assignmentHistory: AssignmentHistory[] = activeAssignment
      ? [
          ...order.assignmentHistory,
          {
            id: `assignment-history-${activeAssignment.id}-accepted`,
            assignmentId: activeAssignment.id,
            orderId: order.id,
            providerId: activeAssignment.providerId,
            attemptNumber: activeAssignment.attemptNumber,
            fromStatus: AssignmentStatus.PendingAcceptance,
            toStatus: AssignmentStatus.Accepted,
            changedAt: timestamp,
            actorRole: "provider",
            reasonAr: "تم قبول الطلب من لوحة المزود",
          },
        ]
      : order.assignmentHistory;

    return {
      ...order,
      status: OrderStatus.Accepted,
      updatedAt: timestamp,
      statusUpdatedAt: timestamp,
      progressPercent: getOrderProgressPercent(OrderStatus.Accepted),
      activeAssignment,
      assignmentHistory,
      statusHistory: appendOrderStatusHistory({
        order,
        toStatus: OrderStatus.Accepted,
        changedAt: timestamp,
        actorRole: "provider",
        notesAr: "تم قبول الطلب من لوحة المزوّد.",
      }),
    };
  });
}

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

export async function advanceProviderOrderExecution({
  orderId,
  nextStatus,
  providerId,
  notesAr,
}: {
  orderId: string;
  nextStatus:
    | OrderStatus.PickupScheduled
    | OrderStatus.PickedUp
    | OrderStatus.InProcessing
    | OrderStatus.QualityCheck
    | OrderStatus.OutForDelivery
    | OrderStatus.Delivered;
  providerId?: string;
  notesAr?: string;
}) {
  processExpiredAssignments();
  const authorizedProvider = ensureProviderOperationalAccess(providerId);

  return updateOrder(orderId, (order) => {
    if (!providerExecutableOrderStatuses.has(nextStatus)) {
      throw new Error("المرحلة المطلوبة غير متاحة كتحديث تشغيلي من لوحة المزوّد.");
    }

    if (
      !order.activeAssignment ||
      order.activeAssignment.status !== AssignmentStatus.Accepted ||
      order.providerId !== authorizedProvider.id ||
      order.activeAssignment.providerId !== authorizedProvider.id
    ) {
      throw new Error("لا يمكن لهذا المزوّد تحديث هذا الطلب تشغيليًا.");
    }

    if (!canTransitionOrderStatus(order.status, nextStatus)) {
      throw new Error("انتقال الحالة المطلوب غير صالح لهذا الطلب.");
    }

    const timestamp = new Date().toISOString();
    const executionNotesAr = notesAr?.trim() || providerExecutionStatusNotesAr[nextStatus];

    return {
      ...order,
      status: nextStatus,
      updatedAt: timestamp,
      statusUpdatedAt: timestamp,
      progressPercent: getOrderProgressPercent(nextStatus),
      statusHistory: appendOrderStatusHistory({
        order,
        toStatus: nextStatus,
        changedAt: timestamp,
        actorRole: "provider",
        notesAr: executionNotesAr,
      }),
    };
  });
}

export async function confirmHotelOrderCompletion({
  orderId,
  hotelId,
  notesAr,
}: {
  orderId: string;
  hotelId?: string;
  notesAr?: string;
}) {
  processExpiredAssignments();
  const authorizedHotel = ensureHotelOperationalAccess(hotelId);

  return updateOrder(orderId, (order) => {
    if (order.hotelId !== authorizedHotel.id) {
      throw new Error("لا يمكن لهذا الفندق تأكيد اكتمال طلب لا يخصه.");
    }

    if (order.status !== OrderStatus.Delivered || !canTransitionOrderStatus(order.status, OrderStatus.Completed)) {
      throw new Error("لا يمكن تأكيد اكتمال الطلب قبل وصوله إلى مرحلة تم التسليم.");
    }

    const timestamp = new Date().toISOString();
    const completionNotesAr = notesAr?.trim() || "تم تأكيد اكتمال الطلب من جهة الفندق.";

    if (order.providerId) {
      const provider = providerProfiles[order.providerId];

      if (provider) {
        providerProfiles = {
          ...providerProfiles,
          [provider.id]: {
            ...provider,
            performance: {
              ...provider.performance,
              completedOrders: provider.performance.completedOrders + 1,
              lastEvaluatedAt: timestamp,
            },
            updatedAt: timestamp,
          },
        };
      }
    }

    return {
      ...order,
      status: OrderStatus.Completed,
      updatedAt: timestamp,
      statusUpdatedAt: timestamp,
      progressPercent: getOrderProgressPercent(OrderStatus.Completed),
      statusHistory: appendOrderStatusHistory({
        order,
        toStatus: OrderStatus.Completed,
        changedAt: timestamp,
        actorRole: "hotel",
        notesAr: completionNotesAr,
      }),
    };
  });
}

export async function rejectIncomingOrder(orderId: string, providerId?: string) {
  const authorizedProvider = ensureProviderOperationalAccess(providerId);
  processExpiredAssignments();
  return updateOrder(orderId, (order) => {
    if (
      order.status !== OrderStatus.Assigned ||
      !order.activeAssignment ||
      order.activeAssignment.status !== AssignmentStatus.PendingAcceptance ||
      order.providerId !== authorizedProvider.id ||
      order.activeAssignment.providerId !== authorizedProvider.id
    ) {
      throw new Error("لم يعد هذا الطلب متاحاً للرفض من هذا المزوّد.");
    }

    return reassignOrderAfterPendingFailure(order, {
      changedAt: new Date().toISOString(),
      reason: ReassignmentReason.ProviderRejected,
      actorRole: "provider",
    });

  });
}

export async function autoReassignOrder(
  orderId: string,
  reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
  referenceTime = new Date().toISOString(),
) {
  processExpiredAssignments(referenceTime);
  return updateOrder(orderId, (order) => {
    if (
      order.status !== OrderStatus.Assigned ||
      !order.activeAssignment ||
      order.activeAssignment.status !== AssignmentStatus.PendingAcceptance
    ) {
      return order;
    }

    return reassignOrderAfterPendingFailure(order, {
      changedAt: referenceTime,
      reason,
      actorRole: "system",
    });
  });
}

export async function getPlatformSettings() {
  ensurePlatformSettingsState();
  return clone(platformSettings);
}

export async function updatePlatformSettings(command: PlatformSettingsUpdateCommand) {
  ensurePlatformSettingsState();
  const timestamp = new Date().toISOString();
  const previousSettings = clone(platformSettings);
  const changedByAccountId = command.updatedByAccountId ?? getCurrentAdminAccountId();

  platformSettings = {
    ...platformSettings,
    siteNameAr: command.siteNameAr,
    siteNameEn: command.siteNameEn,
    siteTaglineAr: command.siteTaglineAr,
    siteTaglineEn: command.siteTaglineEn,
    mailFromNameAr: command.mailFromNameAr,
    mailFromEmail: command.mailFromEmail,
    supportEmail: command.supportEmail?.trim() || undefined,
    supportPhone: command.supportPhone?.trim() || undefined,
    registrationEnabled: command.registrationEnabled,
    hotelRegistrationEnabled: command.hotelRegistrationEnabled,
    providerRegistrationEnabled: command.providerRegistrationEnabled,
    requireAdminApprovalForHotels: command.requireAdminApprovalForHotels,
    requireAdminApprovalForProviders: command.requireAdminApprovalForProviders,
    updatedAt: timestamp,
    updatedByAccountId: changedByAccountId,
  };

  platformSettingsAudit = [
    {
      id: `platform-settings-audit-${timestamp}`,
      settingsKey: "platform_settings",
      oldValueJson: JSON.stringify(previousSettings),
      newValueJson: JSON.stringify(platformSettings),
      changedByAccountId,
      changedByRole: changedByAccountId ? "admin" : "system",
      changedAt: timestamp,
      notesAr: command.notesAr,
    },
    ...platformSettingsAudit,
  ];

  return clone(platformSettings);
}

export async function listPlatformSettingsAudit() {
  return clone(sortByUpdatedAtDesc(platformSettingsAudit));
}

export async function getPlatformRuntimeStatus() {
  return clone(mockPlatformRuntimeStatus);
}

export async function listPlatformContentEntries(pageKey?: string) {
  ensurePlatformContentState();

  return clone(
    platformContentEntries
      .filter((entry) => !pageKey || entry.pageKey === pageKey)
      .sort((left, right) =>
        left.pageKey === right.pageKey
          ? left.sortOrder - right.sortOrder
          : left.pageKey.localeCompare(right.pageKey),
      ),
  );
}

export async function updatePlatformContentEntry(command: PlatformContentEntryUpdateCommand) {
  ensurePlatformContentState();
  const currentEntryIndex = platformContentEntries.findIndex((entry) => entry.id === command.id);

  if (currentEntryIndex < 0) {
    throw new Error("تعذر العثور على النص المطلوب لتحديثه.");
  }

  const previousEntry = clone(platformContentEntries[currentEntryIndex]);
  const timestamp = new Date().toISOString();
  const changedByAccountId = command.updatedByAccountId ?? getCurrentAdminAccountId();
  const updatedEntry: PlatformContentEntry = {
    ...previousEntry,
    valueAr: command.valueAr,
    valueEn: command.valueEn,
    active: command.active,
    updatedAt: timestamp,
    updatedByAccountId: changedByAccountId,
  };

  platformContentEntries = platformContentEntries.map((entry, index) =>
    index === currentEntryIndex ? updatedEntry : entry,
  );
  platformContentAudit = [
    {
      id: `platform-content-audit-${command.id}-${timestamp}`,
      contentEntryId: updatedEntry.id,
      pageKey: updatedEntry.pageKey,
      sectionKey: updatedEntry.sectionKey,
      contentKey: updatedEntry.contentKey,
      oldValueAr: previousEntry.valueAr,
      oldValueEn: previousEntry.valueEn,
      newValueAr: updatedEntry.valueAr,
      newValueEn: updatedEntry.valueEn,
      changedByAccountId,
      changedByRole: changedByAccountId ? "admin" : "system",
      changedAt: timestamp,
      notesAr: command.notesAr,
    },
    ...platformContentAudit,
  ];

  return clone(updatedEntry);
}

export async function listPlatformContentAudit(pageKey?: string) {
  return clone(
    sortByUpdatedAtDesc(
      platformContentAudit.filter((entry) => !pageKey || entry.pageKey === pageKey),
    ),
  );
}

export async function getPlatformPageContent(
  pageKey: string,
  language: PlatformLanguage,
): Promise<PlatformPageContent> {
  ensurePlatformContentState();
  return clone(resolvePlatformPageContent({ entries: platformContentEntries, pageKey, language }));
}

const resolveNextOrderNumber = (currentOrders: LaundryOrder[]) => {
  const maxOrderNumber = currentOrders.reduce((currentMax, order) => {
    const match = /(\d+)$/.exec(order.id);

    if (!match) {
      return currentMax;
    }

    return Math.max(currentMax, Number(match[1]));
  }, 1044);

  return maxOrderNumber + 1;
};

export async function exportMockOrdersRepositoryPersistenceSnapshot() {
  processExpiredAssignments();
  ensurePlatformSettingsState();
  ensurePlatformContentState();

  return buildPlatformPersistenceSnapshot({
    accounts: Object.values(accounts),
    accountSessions: Object.values(accountSessions),
    identityAuditEvents,
    platformSettings: [platformSettings],
    platformSettingsAudit,
    platformContentEntries,
    platformContentAudit,
    hotels: Object.values(hotelProfiles),
    providers: Object.values(providerProfiles),
    services: serviceCatalog,
    orders,
  });
}

export function hydrateMockOrdersRepositoryFromPersistenceSnapshot(
  snapshot: PlatformPersistenceSnapshot,
) {
  const restored = restorePlatformDomainSnapshot(snapshot);

  accounts = clone(
    restored.accounts.reduce<Record<string, StoredAccount>>((collection, account) => {
      collection[account.id] = account;
      return collection;
    }, {}),
  );
  accountSessions = clone(
    restored.accountSessions.reduce<Record<string, StoredAccountSession>>((collection, session) => {
      collection[session.id] = session;
      return collection;
    }, {}),
  );
  identityAuditEvents = clone(restored.identityAuditEvents);
  platformSettings = clone(restored.platformSettings[0] ?? initialPlatformSettings);
  platformSettingsAudit = clone(restored.platformSettingsAudit);
  platformContentEntries = clone(
    restored.platformContentEntries.length > 0
      ? restored.platformContentEntries
      : initialPlatformContentEntries,
  );
  platformContentAudit = clone(restored.platformContentAudit);
  serviceCatalog = clone(restored.services);
  hotelProfiles = clone(
    restored.hotels.reduce<Record<string, HotelProfile>>((collection, hotel) => {
      collection[hotel.id] = hotel;
      return collection;
    }, {}),
  );
  providerProfiles = clone(
    restored.providers.reduce<Record<string, ProviderProfile>>((collection, provider) => {
      collection[provider.id] = provider;
      return collection;
    }, {}),
  );
  orders = clone(restored.orders);
  nextOrderNumber = resolveNextOrderNumber(restored.orders);
  ensurePlatformSettingsState();
  ensurePlatformContentState();
}

export function resetMockOrdersRepository() {
  serviceCatalog = clone(initialServiceCatalog);
  hotelProfiles = clone(initialHotelProfiles);
  providerProfiles = clone(initialProviderProfiles);
  accounts = clone(initialAccounts);
  accountSessions = {};
  identityAuditEvents = [];
  platformSettings = clone(initialPlatformSettings);
  platformSettingsAudit = [];
  platformContentEntries = clone(initialPlatformContentEntries);
  platformContentAudit = [];
  orders = clone(initialOrders);
  nextOrderNumber = 1045;
}

