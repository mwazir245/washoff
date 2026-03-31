import type {
  Address,
  AuditFields,
  ContactPoint,
  ISODateString,
  LocalizedText,
} from "@/features/orders/model/common";
import {
  getSaudiCities,
  getSaudiCityLabelsAr,
  type SaudiCityId,
  type SaudiDistrictId,
} from "@/features/orders/model/location-catalog";
import type { OnboardingReviewState } from "@/features/orders/model/onboarding";
import type { HotelSlaProfile } from "@/features/orders/model/sla";

export type HotelClassification = "three_star" | "four_star" | "five_star" | "other";
export type HotelServiceLevel = "standard" | "express" | "vip";
export type HotelDelegationStatus = "not_provided" | "pending_review" | "approved" | "rejected";
export type HotelRegistrationDocumentKind = "commercial_registration" | "delegation_letter";
export type HotelRegistrationSaudiCity = string;

export const HOTEL_REGISTRATION_SAUDI_CITY_OPTIONS = getSaudiCities();
export const HOTEL_REGISTRATION_SAUDI_CITIES_AR = getSaudiCityLabelsAr();

export const hotelClassificationLabelsAr: Record<HotelClassification, string> = {
  three_star: "3 نجوم",
  four_star: "4 نجوم",
  five_star: "5 نجوم",
  other: "أخرى",
};

export const hotelServiceLevelLabelsAr: Record<HotelServiceLevel, string> = {
  standard: "قياسي",
  express: "سريع",
  vip: "VIP",
};

export const hotelDelegationStatusLabelsAr: Record<HotelDelegationStatus, string> = {
  not_provided: "غير مرفق",
  pending_review: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

export const hotelRegistrationDocumentKindLabelsAr: Record<HotelRegistrationDocumentKind, string> = {
  commercial_registration: "السجل التجاري",
  delegation_letter: "خطاب التفويض",
};

export const HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const HOTEL_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

export const HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES = 10 * 1024 * 1024;

export interface HotelRegistrationDocumentUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
}

export interface HotelRegistrationStoredDocumentReference {
  kind: HotelRegistrationDocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: ISODateString;
  storageKey: string;
  downloadPath?: string;
}

export interface HotelOperationalProfile {
  serviceLevel: HotelServiceLevel;
  operatingHours: string;
  requiresDailyPickup: boolean;
}

export interface HotelLogisticsProfile {
  addressText: string;
  pickupLocation?: string;
  hasLoadingArea: boolean;
  accessNotes?: string;
}

export interface HotelComplianceProfile {
  taxRegistrationNumber: string;
  commercialRegistrationNumber: string;
  commercialRegistrationFile: HotelRegistrationStoredDocumentReference;
  delegationLetterFile?: HotelRegistrationStoredDocumentReference;
  delegationStatus: HotelDelegationStatus;
}

export interface HotelRegistrationInput {
  hotelName: string;
  legalEntityName?: string;
  city: HotelRegistrationSaudiCity;
  cityId: SaudiCityId;
  districtId: SaudiDistrictId;
  hotelClassification: HotelClassification;
  roomCount: number;
  taxRegistrationNumber: string;
  commercialRegistrationNumber: string;
  serviceLevel: HotelServiceLevel;
  operatingHours: string;
  requiresDailyPickup: boolean;
  addressText: string;
  latitude: number;
  longitude: number;
  pickupLocation?: string;
  hasLoadingArea: boolean;
  accessNotes?: string;
  commercialRegistrationFile: HotelRegistrationDocumentUploadInput;
  delegationLetterFile?: HotelRegistrationDocumentUploadInput;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  notesAr?: string;
  notes?: string;
}

export interface Hotel extends AuditFields {
  id: string;
  code: string;
  displayName: LocalizedText;
  legalEntityName?: string;
  classification: HotelClassification;
  roomCount: number;
  address: Address;
  timezone: string;
  contact: ContactPoint;
  operationalProfile: HotelOperationalProfile;
  logistics: HotelLogisticsProfile;
  compliance: HotelComplianceProfile;
  slaProfile: HotelSlaProfile;
  contractedServiceIds: string[];
  active: boolean;
  notesAr?: string;
  onboarding: OnboardingReviewState;
}

export type HotelProfile = Hotel;

export const buildHotelDocumentDownloadPath = (
  hotelId: string,
  kind: HotelRegistrationDocumentKind,
) => {
  const documentPathSegment =
    kind === "commercial_registration" ? "commercial-registration" : "delegation-letter";

  return `/api/platform/hotels/${encodeURIComponent(hotelId)}/documents/${documentPathSegment}`;
};
