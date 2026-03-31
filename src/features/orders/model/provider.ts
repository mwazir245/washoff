import type {
  Address,
  AuditFields,
  ContactPoint,
  ISODateString,
  LocalizedText,
} from "@/features/orders/model/common";
import {
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS,
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES,
  HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  HOTEL_REGISTRATION_SAUDI_CITY_OPTIONS,
  type HotelRegistrationDocumentUploadInput,
  type HotelRegistrationStoredDocumentReference,
} from "@/features/orders/model/hotel";
import type {
  SaudiCityId,
  SaudiDistrictId,
} from "@/features/orders/model/location-catalog";
import type { OnboardingReviewState } from "@/features/orders/model/onboarding";
import type {
  ProviderServiceOffering,
  ProviderServicePricingInput,
} from "@/features/orders/model/service";
import type {
  ProviderSlaComplianceStats,
  ProviderSlaProfile,
} from "@/features/orders/model/sla";

export type ProviderRegistrationSaudiCity = string;
export type ProviderCoverageType = "city_wide" | "district_based";

export const PROVIDER_REGISTRATION_SAUDI_CITY_OPTIONS = HOTEL_REGISTRATION_SAUDI_CITY_OPTIONS;
export const PROVIDER_REGISTRATION_SAUDI_CITIES_AR = PROVIDER_REGISTRATION_SAUDI_CITY_OPTIONS.map(
  (city) => city.nameAr,
);

export const providerWorkingDayLabelsAr = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
} as const;

export type ProviderWorkingDay = keyof typeof providerWorkingDayLabelsAr;

export type ProviderRegistrationDocumentUploadInput = HotelRegistrationDocumentUploadInput;
export type ProviderRegistrationStoredDocumentReference = HotelRegistrationStoredDocumentReference;

export const PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES =
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES;
export const PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS =
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS;
export const PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES =
  HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES;

export const providerCoverageTypeLabelsAr: Record<ProviderCoverageType, string> = {
  city_wide: "يغطي المدينة كاملة",
  district_based: "يغطي أحياء محددة",
};

export interface ProviderBusinessProfile {
  legalEntityName?: string;
  commercialRegistrationNumber: string;
  taxRegistrationNumber: string;
  phone: string;
  email: string;
  commercialRegistrationFile: ProviderRegistrationStoredDocumentReference;
}

export interface ProviderLocationProfile {
  addressText: string;
}

export interface ProviderCoverageProfile {
  cityId: SaudiCityId;
  coverageType: ProviderCoverageType;
  coveredDistrictIds: SaudiDistrictId[];
}

export interface ProviderOperatingProfile {
  otherServicesText?: string;
  pickupLeadTimeHours: number;
  executionTimeHours: number;
  deliveryTimeHours: number;
  workingDays: ProviderWorkingDay[];
  workingHoursFrom: string;
  workingHoursTo: string;
  acceptanceWindowMinutes: number;
}

export interface ProviderOperationalLoadProfile {
  currentActiveOrders: number;
  maxActiveOrders: number;
}

export interface ProviderFinancialProfile {
  bankName: string;
  iban: string;
  accountHolderName: string;
}

export interface ProviderAccountSetupProfile {
  fullName: string;
  phone: string;
  email: string;
}

export interface ProviderRegistrationInput {
  providerName: string;
  legalEntityName?: string;
  commercialRegistrationNumber: string;
  taxRegistrationNumber: string;
  city: ProviderRegistrationSaudiCity;
  cityId: SaudiCityId;
  districtId: SaudiDistrictId;
  coverageType: ProviderCoverageType;
  coveredDistrictIds: SaudiDistrictId[];
  businessPhone: string;
  businessEmail: string;
  addressText: string;
  latitude: number;
  longitude: number;
  servicePricing: ProviderServicePricingInput[];
  dailyCapacityKg: number;
  acceptanceWindowMinutes: number;
  pickupLeadTimeHours: number;
  executionTimeHours: number;
  deliveryTimeHours: number;
  maxActiveOrders: number;
  workingDays: ProviderWorkingDay[];
  workingHoursFrom: string;
  workingHoursTo: string;
  commercialRegistrationFile: ProviderRegistrationDocumentUploadInput;
  bankName: string;
  iban: string;
  bankAccountHolderName: string;
  accountFullName: string;
  accountPhone: string;
  accountEmail: string;
  notesAr?: string;
  notes?: string;
}

export enum ProviderCapacityStatus {
  Available = "available",
  Limited = "limited",
  Full = "full",
  Offline = "offline",
}

export interface ProviderCapacity extends AuditFields {
  providerId: string;
  date: string;
  totalKg: number;
  committedKg: number;
  reservedKg: number;
  availableKg: number;
  utilizationRatio: number;
  status: ProviderCapacityStatus;
  cutoffAt?: ISODateString;
}

export interface ProviderPerformanceStats {
  providerId: string;
  rating: number;
  acceptanceRate: number;
  onTimePickupRate: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  disputeRate: number;
  reassignmentRate: number;
  completedOrders: number;
  cancelledOrders: number;
  slaCompliance: ProviderSlaComplianceStats;
  lastEvaluatedAt: ISODateString;
}

export interface ProviderServiceCapability {
  serviceId: string;
  serviceName: LocalizedText;
  active: boolean;
  unitPriceSar: number;
  rushSupported: boolean;
  defaultTurnaroundHours: number;
  sourceOfferingId?: string;
  hasApprovedActivePrice: boolean;
}

export interface Provider extends AuditFields {
  id: string;
  code: string;
  legalName: LocalizedText;
  displayName: LocalizedText;
  address: Address;
  timezone: string;
  contact: ContactPoint;
  serviceAreaCities: string[];
  businessProfile: ProviderBusinessProfile;
  locationProfile: ProviderLocationProfile;
  coverage: ProviderCoverageProfile;
  operatingProfile: ProviderOperatingProfile;
  operationalLoad: ProviderOperationalLoadProfile;
  slaProfile: ProviderSlaProfile;
  financialProfile: ProviderFinancialProfile;
  accountSetupProfile: ProviderAccountSetupProfile;
  serviceOfferings: ProviderServiceOffering[];
  capabilities: ProviderServiceCapability[];
  currentCapacity: ProviderCapacity;
  performance: ProviderPerformanceStats;
  active: boolean;
  notesAr?: string;
  onboarding: OnboardingReviewState;
}

export type ProviderProfile = Provider;

export const buildProviderDocumentDownloadPath = (providerId: string) =>
  `/api/platform/providers/${encodeURIComponent(providerId)}/documents/commercial-registration`;
