import type { ISODateString } from "@/features/orders/model/common";

export type SlaTier = "standard" | "express" | "vip";
export type SlaBreachType = "pickup_delay" | "turnaround_delay" | "delivery_delay" | "completion_delay";

export enum SLACheckpoint {
  MatchingResponse = "matching_response",
  Acceptance = "acceptance",
  Pickup = "pickup",
  Processing = "processing",
  Delivery = "delivery",
  Completion = "completion",
}

export enum SLAStatus {
  OnTrack = "on_track",
  AtRisk = "at_risk",
  Breached = "breached",
  Met = "met",
}

export interface HotelSlaProfile {
  hotelId?: string;
  slaTier: SlaTier;
  pickupTargetHours: number;
  turnaroundTargetHours: number;
  deliveryTargetHours?: number;
  priorityWeight: number;
  escalationThresholdMinutes: number;
}

export interface ProviderSlaProfile {
  providerId?: string;
  acceptanceWindowMinutes: number;
  pickupLeadTimeHours: number;
  processingHours: number;
  deliveryWindowHours: number;
  minComplianceRate: number;
  maxDelayToleranceMinutes: number;
}

export interface ProviderSlaComplianceStats {
  totalTrackedOrders: number;
  onTimePickups: number;
  onTimeCompletions: number;
  slaComplianceRate: number;
  averageDelayMinutes: number;
  updatedAt?: ISODateString;
}

export interface OrderRequiredSlaSnapshot {
  hotelId: string;
  slaTier: SlaTier;
  pickupTargetHours: number;
  turnaroundTargetHours: number;
  deliveryTargetHours?: number;
  priorityWeight: number;
  escalationThresholdMinutes: number;
}

export interface OrderProviderSlaSnapshot {
  providerId: string;
  acceptanceWindowMinutes: number;
  pickupLeadTimeHours: number;
  processingHours: number;
  deliveryWindowHours: number;
  minComplianceRate: number;
  maxDelayToleranceMinutes: number;
  recordedAt: ISODateString;
}

export interface SlaCompatibilityResult {
  compatible: boolean;
  pickupCompatible: boolean;
  turnaroundCompatible: boolean;
  deliveryCompatible: boolean;
  reasonsAr: string[];
}

export interface OrderSlaBreach {
  type: SlaBreachType;
  checkpoint: SLACheckpoint;
  breachedAt: ISODateString;
  breachMinutes: number;
  targetAt?: ISODateString;
  actualAt?: ISODateString;
  notesAr?: string;
}

export interface OrderSlaSummary {
  tracked: boolean;
  slaBreached: boolean;
  currentStatus: SLAStatus;
  breachType?: SlaBreachType;
  breachMinutes?: number;
  breachedAt?: ISODateString;
  breaches: OrderSlaBreach[];
}

export interface SLAHistory {
  id: string;
  orderId: string;
  checkpoint: SLACheckpoint;
  targetAt: ISODateString;
  actualAt?: ISODateString;
  status: SLAStatus;
  recordedAt: ISODateString;
  notesAr?: string;
}

const roundPercent = (value: number) => Math.round((value + Number.EPSILON) * 10000) / 10000;

export const DEFAULT_HOTEL_SLA_PROFILES: Record<SlaTier, Omit<HotelSlaProfile, "hotelId" | "slaTier">> = {
  standard: {
    pickupTargetHours: 6,
    turnaroundTargetHours: 24,
    deliveryTargetHours: 4,
    priorityWeight: 1,
    escalationThresholdMinutes: 60,
  },
  express: {
    pickupTargetHours: 3,
    turnaroundTargetHours: 12,
    deliveryTargetHours: 3,
    priorityWeight: 1.15,
    escalationThresholdMinutes: 30,
  },
  vip: {
    pickupTargetHours: 2,
    turnaroundTargetHours: 8,
    deliveryTargetHours: 2,
    priorityWeight: 1.3,
    escalationThresholdMinutes: 15,
  },
};

export const buildHotelSlaProfile = (
  hotelId: string | undefined,
  slaTier: SlaTier,
): HotelSlaProfile => ({
  hotelId,
  slaTier,
  ...DEFAULT_HOTEL_SLA_PROFILES[slaTier],
});

export const buildDefaultProviderSlaProfile = (
  providerId?: string,
  overrides: Partial<ProviderSlaProfile> = {},
): ProviderSlaProfile => ({
  providerId,
  acceptanceWindowMinutes: overrides.acceptanceWindowMinutes ?? 30,
  pickupLeadTimeHours: overrides.pickupLeadTimeHours ?? 3,
  processingHours: overrides.processingHours ?? 24,
  deliveryWindowHours: overrides.deliveryWindowHours ?? 4,
  minComplianceRate: overrides.minComplianceRate ?? 0.9,
  maxDelayToleranceMinutes: overrides.maxDelayToleranceMinutes ?? 30,
});

export const buildOrderRequiredSlaSnapshot = (
  hotelId: string,
  profile: HotelSlaProfile,
): OrderRequiredSlaSnapshot => ({
  hotelId,
  slaTier: profile.slaTier,
  pickupTargetHours: profile.pickupTargetHours,
  turnaroundTargetHours: profile.turnaroundTargetHours,
  deliveryTargetHours: profile.deliveryTargetHours,
  priorityWeight: profile.priorityWeight,
  escalationThresholdMinutes: profile.escalationThresholdMinutes,
});

export const buildOrderProviderSlaSnapshot = (
  providerId: string,
  profile: ProviderSlaProfile,
  recordedAt: ISODateString,
): OrderProviderSlaSnapshot => ({
  providerId,
  acceptanceWindowMinutes: profile.acceptanceWindowMinutes,
  pickupLeadTimeHours: profile.pickupLeadTimeHours,
  processingHours: profile.processingHours,
  deliveryWindowHours: profile.deliveryWindowHours,
  minComplianceRate: profile.minComplianceRate,
  maxDelayToleranceMinutes: profile.maxDelayToleranceMinutes,
  recordedAt,
});

export const evaluateSlaCompatibility = (
  hotelProfile: HotelSlaProfile,
  providerProfile: ProviderSlaProfile,
): SlaCompatibilityResult => {
  const pickupCompatible = providerProfile.pickupLeadTimeHours <= hotelProfile.pickupTargetHours;
  const turnaroundCompatible =
    providerProfile.processingHours <= hotelProfile.turnaroundTargetHours;
  const deliveryCompatible =
    typeof hotelProfile.deliveryTargetHours !== "number" ||
    providerProfile.deliveryWindowHours <= hotelProfile.deliveryTargetHours;
  const reasonsAr: string[] = [];

  if (!pickupCompatible) {
    reasonsAr.push("زمن الاستلام لدى المزود يتجاوز المستهدف المطلوب للفندق");
  }

  if (!turnaroundCompatible) {
    reasonsAr.push("زمن المعالجة لدى المزود لا يحقق زمن الإنجاز المطلوب");
  }

  if (!deliveryCompatible) {
    reasonsAr.push("نافذة التسليم لدى المزود لا تتوافق مع التزام الفندق");
  }

  return {
    compatible: pickupCompatible && turnaroundCompatible && deliveryCompatible,
    pickupCompatible,
    turnaroundCompatible,
    deliveryCompatible,
    reasonsAr,
  };
};

export const createEmptySlaSummary = (): OrderSlaSummary => ({
  tracked: false,
  slaBreached: false,
  currentStatus: SLAStatus.OnTrack,
  breaches: [],
});

export const buildProviderSlaComplianceStats = ({
  totalTrackedOrders,
  onTimePickups,
  onTimeCompletions,
  averageDelayMinutes,
  updatedAt,
}: Omit<ProviderSlaComplianceStats, "slaComplianceRate">): ProviderSlaComplianceStats => {
  const denominator = totalTrackedOrders > 0 ? totalTrackedOrders : 1;
  const slaComplianceRate = roundPercent((onTimePickups + onTimeCompletions) / (denominator * 2));

  return {
    totalTrackedOrders,
    onTimePickups,
    onTimeCompletions,
    slaComplianceRate,
    averageDelayMinutes,
    updatedAt,
  };
};
