import type { ISODateString } from "@/features/orders/model/common";
import type { Provider } from "@/features/orders/model/provider";

export enum MatchingCriterion {
  Price = "price",
  SlaSpeed = "sla_speed",
  SlaComplianceHistory = "sla_compliance_history",
  Rating = "rating",
  GeographicProximity = "geographic_proximity",
  ActiveLoad = "active_load",
}

export enum EligibilityReasonCode {
  ProviderInactive = "provider_inactive",
  ProviderNotApproved = "provider_not_approved",
  CityMismatch = "city_mismatch",
  DistrictNotCovered = "district_not_covered",
  ServiceUnsupported = "service_unsupported",
  PriceNotApproved = "price_not_approved",
  SlaIncompatible = "sla_incompatible",
  ProviderOverloaded = "provider_overloaded",
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
  districtCovered: boolean;
  approvedAndActive: boolean;
  hasApprovedActivePrice: boolean;
  slaCompatible: boolean;
  withinActiveLoadThreshold: boolean;
  activeLoadRatio: number;
  currentActiveOrders: number;
  maxActiveOrders: number;
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
  currentActiveOrders: number;
  maxActiveOrders: number;
  activeLoadRatio: number;
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
  slaComplianceHistory: number;
  rating: number;
  geographicProximity: number;
  activeLoad: number;
}

export interface RankedProviderMatch {
  rank: number;
  provider: Provider;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  eligibilityResult: EligibilityResult;
  estimatedPriceSar: number;
  estimatedTurnaroundHours: number;
  distanceKm: number;
  activeLoadRatio: number;
  slaComplianceRate: number;
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
  [EligibilityReasonCode.ProviderInactive]: "المزود غير نشط أو حسابه غير فعال",
  [EligibilityReasonCode.ProviderNotApproved]: "المزود لم يُعتمد بعد من الإدارة",
  [EligibilityReasonCode.CityMismatch]: "المزود ليس في نفس مدينة الفندق",
  [EligibilityReasonCode.DistrictNotCovered]: "حي الفندق خارج نطاق التغطية المعتمد للمزود",
  [EligibilityReasonCode.ServiceUnsupported]: "المزود لا يقدّم الخدمة المطلوبة لهذا المنتج",
  [EligibilityReasonCode.PriceNotApproved]: "لا يوجد سعر معتمد ونشط لهذه الخدمة لدى المزود",
  [EligibilityReasonCode.SlaIncompatible]: "المزود لا يحقق متطلبات SLA المطلوبة لهذا الطلب",
  [EligibilityReasonCode.ProviderOverloaded]: "المزود تجاوز الحد الأقصى للطلبات النشطة",
  [EligibilityReasonCode.ManualBlock]: "المزود محجوب من الإسناد",
};

export const matchingDecisionLabelsAr: Record<MatchingDecision, string> = {
  [MatchingDecision.Selected]: "تم اختياره",
  [MatchingDecision.Shortlisted]: "ضمن القائمة القصيرة",
  [MatchingDecision.Skipped]: "تم استبعاده",
};

export const createEmptyScoreBreakdown = (): ScoreBreakdown => ({
  totalScore: 0,
  entries: [],
});

export const isProviderEligible = (result: EligibilityResult) => result.eligible;
