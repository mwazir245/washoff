import type {
  Address,
  AuditFields,
  ContactPoint,
  ISODateString,
  LocalizedText,
} from "@/features/orders/model/common";
import type { OnboardingReviewState } from "@/features/orders/model/onboarding";

export interface ProviderRegistrationInput {
  providerName: string;
  city: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  supportedServiceIds: string[];
  dailyCapacityKg: number;
  notesAr?: string;
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
  lastEvaluatedAt: ISODateString;
}

export interface ProviderPickupWindow {
  startHour: number;
  endHour: number;
}

export interface ProviderServiceCapability {
  serviceId: string;
  serviceName: LocalizedText;
  active: boolean;
  unitPriceSar: number;
  maxDailyKg: number;
  maxSingleOrderKg: number;
  rushSupported: boolean;
  supportedCityCodes: string[];
  defaultTurnaroundHours: number;
  minimumPickupLeadHours: number;
  pickupWindow: ProviderPickupWindow;
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
  capabilities: ProviderServiceCapability[];
  currentCapacity: ProviderCapacity;
  performance: ProviderPerformanceStats;
  active: boolean;
  notesAr?: string;
  onboarding: OnboardingReviewState;
}

export type ProviderProfile = Provider;
