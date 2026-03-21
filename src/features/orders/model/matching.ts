import type { ISODateString } from "@/features/orders/model/common";
import type { Provider } from "@/features/orders/model/provider";

export enum MatchingCriterion {
  Price = "price",
  SlaSpeed = "sla_speed",
  Rating = "rating",
  CapacityAvailability = "capacity_availability",
  OnTimePerformance = "on_time_performance",
}

export enum EligibilityReasonCode {
  ProviderInactive = "provider_inactive",
  ProviderNotApproved = "provider_not_approved",
  CityMismatch = "city_mismatch",
  ServiceUnsupported = "service_unsupported",
  QuantityUnsupported = "quantity_unsupported",
  PickupTimeUnsupported = "pickup_time_unsupported",
  CapacityUnavailable = "capacity_unavailable",
  ManualBlock = "manual_block",
}

export enum MatchingDecision {
  Skipped = "skipped",
  Shortlisted = "shortlisted",
  Selected = "selected",
}

export interface ScoreBreakdownEntry {
  criterion: MatchingCriterion;
  labelAr: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  explanationAr?: string;
}

export interface ScoreBreakdown {
  totalScore: number;
  entries: ScoreBreakdownEntry[];
}

export interface ProviderCapabilityMatch {
  providerId: string;
  requestedServiceIds: string[];
  matchedServiceIds: string[];
  unsupportedServiceIds: string[];
  sameCity: boolean;
  serviceAreaCovered: boolean;
  supportsRequestedQuantities: boolean;
  supportsRequestedPickupTime: boolean;
  capacityAvailable: boolean;
  isMatch: boolean;
  reasonsAr: string[];
}

export interface EligibilityResult {
  providerId: string;
  orderId: string;
  eligible: boolean;
  reasonCodes: EligibilityReasonCode[];
  blockingReasonsAr: string[];
  capabilityMatch: ProviderCapabilityMatch;
  availableCapacityKg: number;
  evaluatedAt: ISODateString;
}

export interface MatchingLog {
  id: string;
  matchingRunId: string;
  orderId: string;
  providerId: string;
  decision: MatchingDecision;
  eligibilityResult: EligibilityResult;
  scoreBreakdown: ScoreBreakdown;
  evaluatedAt: ISODateString;
  notesAr?: string;
}

export interface MatchingScoreWeights {
  price: number;
  slaSpeed: number;
  rating: number;
  capacityAvailability: number;
  onTimePerformance: number;
}

export interface RankedProviderMatch {
  rank: number;
  provider: Provider;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  eligibilityResult: EligibilityResult;
  estimatedPriceSar: number;
  estimatedTurnaroundHours: number;
  capacityAvailabilityRatio: number;
  onTimePerformanceRate: number;
}

export interface ExcludedProviderMatch {
  provider: Provider;
  eligibilityResult: EligibilityResult;
}

export interface MatchingRunResult {
  matchingRunId: string;
  orderId: string;
  evaluatedAt: ISODateString;
  weights: MatchingScoreWeights;
  rankedProviders: RankedProviderMatch[];
  bestProvider?: RankedProviderMatch;
  excludedProviders: ExcludedProviderMatch[];
  logs: MatchingLog[];
}

export const eligibilityReasonLabelsAr: Record<EligibilityReasonCode, string> = {
  [EligibilityReasonCode.ProviderInactive]: "المزوّد غير نشط حالياً",
  [EligibilityReasonCode.ProviderNotApproved]: "المزوّد لم يُعتمد بعد من الإدارة",
  [EligibilityReasonCode.CityMismatch]: "المزوّد ليس في نفس مدينة الفندق",
  [EligibilityReasonCode.ServiceUnsupported]: "المزوّد لا يدعم كل الخدمات المطلوبة",
  [EligibilityReasonCode.QuantityUnsupported]: "الكمية المطلوبة تتجاوز حدود الخدمة لدى المزوّد",
  [EligibilityReasonCode.PickupTimeUnsupported]: "وقت الاستلام المطلوب غير مدعوم",
  [EligibilityReasonCode.CapacityUnavailable]: "لا توجد سعة متاحة كافية حالياً",
  [EligibilityReasonCode.ManualBlock]: "المزوّد محجوب من الإسناد",
};

export const matchingDecisionLabelsAr: Record<MatchingDecision, string> = {
  [MatchingDecision.Selected]: "تم اختياره",
  [MatchingDecision.Shortlisted]: "ضمن القائمة القصيرة",
  [MatchingDecision.Skipped]: "تم استبعاده",
};

export const createEmptyScoreBreakdown = (): ScoreBreakdown => {
  return {
    totalScore: 0,
    entries: [],
  };
};

export const isProviderEligible = (result: EligibilityResult) => {
  return result.eligible;
};
