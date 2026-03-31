import type { Order } from "@/features/orders/model/order";
import { OnboardingStatus } from "@/features/orders/model/onboarding";
import type { Provider } from "@/features/orders/model/provider";
import {
  createEmptyScoreBreakdown,
  EligibilityReasonCode,
  eligibilityReasonLabelsAr,
  MatchingCriterion,
  MatchingDecision,
  type EligibilityResult,
  type MatchingLog,
  type MatchingRunResult,
  type MatchingScoreWeights,
  type ProviderCapabilityMatch,
  type RankedProviderMatch,
  type ScoreBreakdown,
  type ScoreBreakdownEntry,
} from "@/features/orders/model/matching";
import { buildHotelSlaProfile, evaluateSlaCompatibility } from "@/features/orders/model/sla";
import { ProviderServiceCurrentStatus } from "@/features/orders/model/service";
import {
  buildNumericRange,
  normalizeHigherIsBetter,
  normalizeLowerIsBetter,
  roundScore,
  toPercentageScore,
} from "@/features/orders/services/matching-helpers";

export interface MatchingEngineOptions {
  evaluatedAt?: string;
  matchingRunId?: string;
  weights?: Partial<MatchingScoreWeights>;
}

interface EligibleProviderScoringInput {
  provider: Provider;
  eligibilityResult: EligibilityResult;
  estimatedPriceSar: number;
  estimatedTurnaroundHours: number;
  distanceKm: number;
  activeLoadRatio: number;
  slaComplianceRate: number;
  ratingValue: number;
}

export const DEFAULT_MATCHING_SCORE_WEIGHTS: MatchingScoreWeights = {
  price: 0.25,
  slaSpeed: 0.2,
  slaComplianceHistory: 0.2,
  rating: 0.15,
  geographicProximity: 0.1,
  activeLoad: 0.1,
};

const RATING_RANGE = {
  min: 0,
  max: 5,
};

const RATE_RANGE = {
  min: 0,
  max: 1,
};

const DISTANCE_FALLBACK_KM = 50;

const normalizeText = (value: string) => value.trim().toLocaleLowerCase("ar-SA");

const getRequestedServiceIds = (order: Pick<Order, "items">) =>
  Array.from(new Set(order.items.map((item) => item.serviceId)));

const getProviderOfferingForService = (provider: Provider, serviceId: string) =>
  provider.serviceOfferings.find((offering) => offering.serviceId === serviceId);

const getApprovedActiveOfferingForService = (provider: Provider, serviceId: string) =>
  provider.serviceOfferings.find(
    (offering) =>
      offering.serviceId === serviceId &&
      offering.activeMatrix &&
      offering.availableMatrix &&
      offering.currentStatus === ProviderServiceCurrentStatus.Active &&
      typeof offering.currentApprovedPriceSar === "number",
  );

const getHotelCityId = (order: Order) => order.hotelSnapshot.cityId;

const getHotelDistrictId = (order: Order) => order.hotelSnapshot.districtId;

const hasSameCity = (order: Order, provider: Provider) =>
  Boolean(getHotelCityId(order)) && provider.coverage.cityId === getHotelCityId(order);

const hasDistrictCoverage = (order: Order, provider: Provider) => {
  const hotelDistrictId = getHotelDistrictId(order);

  if (!hasSameCity(order, provider) || !hotelDistrictId) {
    return false;
  }

  if (provider.coverage.coverageType === "city_wide") {
    return true;
  }

  return provider.coverage.coveredDistrictIds.includes(hotelDistrictId);
};

const hasServiceCapability = (provider: Provider, requestedServiceIds: string[]) =>
  requestedServiceIds.every((serviceId) => {
    const offering = getProviderOfferingForService(provider, serviceId);
    return Boolean(offering && offering.activeMatrix && offering.availableMatrix);
  });

const hasApprovedActivePrice = (provider: Provider, requestedServiceIds: string[]) =>
  requestedServiceIds.every((serviceId) => Boolean(getApprovedActiveOfferingForService(provider, serviceId)));

const getActiveLoadRatio = (provider: Provider) => {
  const maxActiveOrders = provider.operationalLoad.maxActiveOrders;

  if (maxActiveOrders <= 0) {
    return 1;
  }

  return Math.min(provider.operationalLoad.currentActiveOrders / maxActiveOrders, 2);
};

const isWithinActiveLoadThreshold = (provider: Provider) => {
  const maxActiveOrders = provider.operationalLoad.maxActiveOrders;

  if (maxActiveOrders <= 0) {
    return false;
  }

  return provider.operationalLoad.currentActiveOrders <= maxActiveOrders;
};

const getRequiredSlaForOrder = (order: Order) =>
  order.slaWindow.requiredSla ?? buildHotelSlaProfile(order.hotelId, "standard");

const getSlaCompatibility = (order: Order, provider: Provider) =>
  evaluateSlaCompatibility(getRequiredSlaForOrder(order), provider.slaProfile);

const resolveEligibilityReasonLabels = (reasonCodes: EligibilityReasonCode[]) =>
  reasonCodes.map((reasonCode) => eligibilityReasonLabelsAr[reasonCode]);

const haversineDistanceKm = (
  originLatitude: number,
  originLongitude: number,
  targetLatitude: number,
  targetLongitude: number,
) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(targetLatitude - originLatitude);
  const deltaLongitude = toRadians(targetLongitude - originLongitude);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(originLatitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getGeographicDistanceKm = (order: Order, provider: Provider) => {
  const providerLatitude = provider.address.latitude;
  const providerLongitude = provider.address.longitude;
  const hotelLatitude = order.hotelSnapshot.latitude;
  const hotelLongitude = order.hotelSnapshot.longitude;

  if (
    typeof hotelLatitude !== "number" ||
    typeof hotelLongitude !== "number" ||
    typeof providerLatitude !== "number" ||
    typeof providerLongitude !== "number"
  ) {
    return DISTANCE_FALLBACK_KM;
  }

  return roundScore(
    haversineDistanceKm(
      hotelLatitude,
      hotelLongitude,
      providerLatitude,
      providerLongitude,
    ),
    3,
  );
};

const buildCapabilityMatch = (
  provider: Provider,
  order: Order,
  reasonCodes: EligibilityReasonCode[],
): ProviderCapabilityMatch => {
  const requestedServiceIds = getRequestedServiceIds(order);
  const matchedServiceIds = requestedServiceIds.filter((serviceId) =>
    Boolean(getProviderOfferingForService(provider, serviceId)),
  );
  const unsupportedServiceIds = requestedServiceIds.filter(
    (serviceId) => !matchedServiceIds.includes(serviceId),
  );
  const sameCity = hasSameCity(order, provider);
  const districtCovered = hasDistrictCoverage(order, provider);
  const approvedAndActive = provider.active && provider.onboarding.status === OnboardingStatus.Approved;
  const approvedPriceAvailable = hasApprovedActivePrice(provider, requestedServiceIds);
  const slaCompatibility = getSlaCompatibility(order, provider);
  const withinActiveLoadThreshold = isWithinActiveLoadThreshold(provider);
  const blockingReasonsAr = resolveEligibilityReasonLabels(reasonCodes);

  return {
    providerId: provider.id,
    requestedServiceIds,
    matchedServiceIds,
    unsupportedServiceIds,
    sameCity,
    districtCovered,
    approvedAndActive,
    hasApprovedActivePrice: approvedPriceAvailable,
    slaCompatible: slaCompatibility.compatible,
    withinActiveLoadThreshold,
    activeLoadRatio: roundScore(getActiveLoadRatio(provider), 4),
    currentActiveOrders: provider.operationalLoad.currentActiveOrders,
    maxActiveOrders: provider.operationalLoad.maxActiveOrders,
    isMatch: reasonCodes.length === 0,
    reasonsAr: blockingReasonsAr.length > 0 ? blockingReasonsAr : ["مطابقة كاملة لشروط الإسناد"],
  };
};

export const evaluateProviderEligibility = (
  order: Order,
  provider: Provider,
  options: Pick<MatchingEngineOptions, "evaluatedAt"> = {},
): EligibilityResult => {
  const evaluatedAt = options.evaluatedAt ?? new Date().toISOString();
  const requestedServiceIds = getRequestedServiceIds(order);
  const sameCity = hasSameCity(order, provider);
  const districtCovered = hasDistrictCoverage(order, provider);
  const approvedAndActive = provider.active && provider.onboarding.status === OnboardingStatus.Approved;
  const serviceSupported = hasServiceCapability(provider, requestedServiceIds);
  const approvedPriceAvailable = hasApprovedActivePrice(provider, requestedServiceIds);
  const slaCompatibility = getSlaCompatibility(order, provider);
  const withinActiveLoadThreshold = isWithinActiveLoadThreshold(provider);
  const reasonCodes: EligibilityReasonCode[] = [];

  if (!provider.active) {
    reasonCodes.push(EligibilityReasonCode.ProviderInactive);
  }

  if (provider.onboarding.status !== OnboardingStatus.Approved) {
    reasonCodes.push(EligibilityReasonCode.ProviderNotApproved);
  }

  if (!sameCity) {
    reasonCodes.push(EligibilityReasonCode.CityMismatch);
  }

  if (sameCity && !districtCovered) {
    reasonCodes.push(EligibilityReasonCode.DistrictNotCovered);
  }

  if (!serviceSupported) {
    reasonCodes.push(EligibilityReasonCode.ServiceUnsupported);
  }

  if (serviceSupported && !approvedPriceAvailable) {
    reasonCodes.push(EligibilityReasonCode.PriceNotApproved);
  }

  if (!slaCompatibility.compatible) {
    reasonCodes.push(EligibilityReasonCode.SlaIncompatible);
  }

  if (!withinActiveLoadThreshold) {
    reasonCodes.push(EligibilityReasonCode.ProviderOverloaded);
  }

  return {
    providerId: provider.id,
    orderId: order.id,
    eligible: reasonCodes.length === 0,
    reasonCodes,
    blockingReasonsAr: resolveEligibilityReasonLabels(reasonCodes),
    capabilityMatch: buildCapabilityMatch(provider, order, reasonCodes),
    currentActiveOrders: provider.operationalLoad.currentActiveOrders,
    maxActiveOrders: provider.operationalLoad.maxActiveOrders,
    activeLoadRatio: roundScore(getActiveLoadRatio(provider), 4),
    evaluatedAt,
  };
};

const estimateProviderPrice = (order: Order, provider: Provider) =>
  roundScore(
    order.items.reduce((total, item) => {
      const offering = getApprovedActiveOfferingForService(provider, item.serviceId);
      return total + item.quantity * (offering?.currentApprovedPriceSar ?? item.unitPriceSar);
    }, 0),
  );

const estimateProviderTurnaroundHours = (provider: Provider) =>
  provider.slaProfile.pickupLeadTimeHours +
  provider.slaProfile.processingHours +
  provider.slaProfile.deliveryWindowHours;

const getSlaComplianceRate = (provider: Provider) =>
  provider.performance.slaCompliance?.slaComplianceRate ??
  (provider.performance.onTimePickupRate + provider.performance.onTimeDeliveryRate) / 2;

const buildScoreBreakdown = (
  candidate: EligibleProviderScoringInput,
  weights: MatchingScoreWeights,
  ranges: {
    price: ReturnType<typeof buildNumericRange>;
    turnaround: ReturnType<typeof buildNumericRange>;
    distance: ReturnType<typeof buildNumericRange>;
    activeLoad: ReturnType<typeof buildNumericRange>;
  },
): ScoreBreakdown => {
  const priceScore = toPercentageScore(normalizeLowerIsBetter(candidate.estimatedPriceSar, ranges.price));
  const slaSpeedScore = toPercentageScore(
    normalizeLowerIsBetter(candidate.estimatedTurnaroundHours, ranges.turnaround),
  );
  const slaComplianceScore = toPercentageScore(
    normalizeHigherIsBetter(candidate.slaComplianceRate, RATE_RANGE),
  );
  const ratingScore = toPercentageScore(normalizeHigherIsBetter(candidate.ratingValue, RATING_RANGE));
  const proximityScore = toPercentageScore(normalizeLowerIsBetter(candidate.distanceKm, ranges.distance));
  const activeLoadScore = toPercentageScore(
    normalizeLowerIsBetter(candidate.activeLoadRatio, ranges.activeLoad),
  );

  const entries: ScoreBreakdownEntry[] = [
    {
      criterion: MatchingCriterion.Price,
      labelAr: "السعر",
      weight: weights.price,
      rawScore: priceScore,
      weightedScore: roundScore(priceScore * weights.price),
      explanationAr: `التكلفة التقديرية ${candidate.estimatedPriceSar} ر.س`,
    },
    {
      criterion: MatchingCriterion.SlaSpeed,
      labelAr: "سرعة الالتزام التشغيلي",
      weight: weights.slaSpeed,
      rawScore: slaSpeedScore,
      weightedScore: roundScore(slaSpeedScore * weights.slaSpeed),
      explanationAr: `الزمن التشغيلي المتوقع ${candidate.estimatedTurnaroundHours} ساعة`,
    },
    {
      criterion: MatchingCriterion.SlaComplianceHistory,
      labelAr: "سجل الالتزام بالـ SLA",
      weight: weights.slaComplianceHistory,
      rawScore: slaComplianceScore,
      weightedScore: roundScore(slaComplianceScore * weights.slaComplianceHistory),
      explanationAr: `معدل الالتزام التاريخي ${roundScore(candidate.slaComplianceRate * 100)}%`,
    },
    {
      criterion: MatchingCriterion.Rating,
      labelAr: "تقييم المزود",
      weight: weights.rating,
      rawScore: ratingScore,
      weightedScore: roundScore(ratingScore * weights.rating),
      explanationAr: `التقييم الحالي ${roundScore(candidate.ratingValue, 1)} من 5`,
    },
    {
      criterion: MatchingCriterion.GeographicProximity,
      labelAr: "القرب الجغرافي",
      weight: weights.geographicProximity,
      rawScore: proximityScore,
      weightedScore: roundScore(proximityScore * weights.geographicProximity),
      explanationAr: `المسافة التقديرية ${roundScore(candidate.distanceKm, 1)} كم`,
    },
    {
      criterion: MatchingCriterion.ActiveLoad,
      labelAr: "الحمل التشغيلي النشط",
      weight: weights.activeLoad,
      rawScore: activeLoadScore,
      weightedScore: roundScore(activeLoadScore * weights.activeLoad),
      explanationAr: `الحمل الحالي ${candidate.eligibilityResult.currentActiveOrders}/${candidate.eligibilityResult.maxActiveOrders}`,
    },
  ];

  return {
    totalScore: roundScore(entries.reduce((total, entry) => total + entry.weightedScore, 0)),
    entries,
  };
};

const buildEligibleProviderScoringInput = (
  order: Order,
  provider: Provider,
  eligibilityResult: EligibilityResult,
): EligibleProviderScoringInput => ({
  provider,
  eligibilityResult,
  estimatedPriceSar: estimateProviderPrice(order, provider),
  estimatedTurnaroundHours: estimateProviderTurnaroundHours(provider),
  distanceKm: getGeographicDistanceKm(order, provider),
  activeLoadRatio: getActiveLoadRatio(provider),
  slaComplianceRate: getSlaComplianceRate(provider),
  ratingValue: provider.performance.rating,
});

export const createMatchingRunId = (orderId: string, evaluatedAt: string) => {
  const normalizedTimestamp = evaluatedAt.replace(/[^0-9]/g, "").slice(0, 14);
  return `match-${orderId}-${normalizedTimestamp}`;
};

const resolveScoreWeights = (weights?: Partial<MatchingScoreWeights>): MatchingScoreWeights => ({
  ...DEFAULT_MATCHING_SCORE_WEIGHTS,
  ...weights,
});

const buildMatchingLog = (
  order: Order,
  matchingRunId: string,
  provider: Provider,
  eligibilityResult: EligibilityResult,
  bestProviderId: string | undefined,
  rankedProviderById: Map<string, RankedProviderMatch>,
): MatchingLog => {
  const rankedProvider = rankedProviderById.get(provider.id);
  const decision =
    !eligibilityResult.eligible
      ? MatchingDecision.Skipped
      : provider.id === bestProviderId
        ? MatchingDecision.Selected
        : MatchingDecision.Shortlisted;

  return {
    id: `log-${matchingRunId}-${provider.id}`,
    matchingRunId,
    orderId: order.id,
    providerId: provider.id,
    decision,
    eligibilityResult,
    scoreBreakdown: rankedProvider?.scoreBreakdown ?? createEmptyScoreBreakdown(),
    evaluatedAt: eligibilityResult.evaluatedAt,
    notesAr:
      decision === MatchingDecision.Selected
        ? "تم اختيار هذا المزود كأفضل تطابق تلقائي"
        : decision === MatchingDecision.Shortlisted
          ? "المزود مؤهل لكنه لم يحصل على أعلى نتيجة"
          : eligibilityResult.blockingReasonsAr.join("، "),
  };
};

export const matchProvidersForOrder = (
  order: Order,
  providers: Provider[],
  options: MatchingEngineOptions = {},
): MatchingRunResult => {
  const evaluatedAt = options.evaluatedAt ?? new Date().toISOString();
  const weights = resolveScoreWeights(options.weights);
  const matchingRunId = options.matchingRunId ?? createMatchingRunId(order.id, evaluatedAt);
  const eligibleCandidates: EligibleProviderScoringInput[] = [];
  const excludedProviders: MatchingRunResult["excludedProviders"] = [];
  const eligibilityByProviderId = new Map<string, EligibilityResult>();

  for (const provider of providers) {
    const eligibilityResult = evaluateProviderEligibility(order, provider, { evaluatedAt });
    eligibilityByProviderId.set(provider.id, eligibilityResult);

    if (!eligibilityResult.eligible) {
      excludedProviders.push({
        provider,
        eligibilityResult,
      });
      continue;
    }

    eligibleCandidates.push(buildEligibleProviderScoringInput(order, provider, eligibilityResult));
  }

  const ranges = {
    price: buildNumericRange(eligibleCandidates.map((candidate) => candidate.estimatedPriceSar)),
    turnaround: buildNumericRange(
      eligibleCandidates.map((candidate) => candidate.estimatedTurnaroundHours),
    ),
    distance: buildNumericRange(eligibleCandidates.map((candidate) => candidate.distanceKm)),
    activeLoad: buildNumericRange(eligibleCandidates.map((candidate) => candidate.activeLoadRatio)),
  };

  const rankedProviders = eligibleCandidates
    .map((candidate) => {
      const scoreBreakdown = buildScoreBreakdown(candidate, weights, ranges);

      return {
        rank: 0,
        provider: candidate.provider,
        totalScore: scoreBreakdown.totalScore,
        scoreBreakdown,
        eligibilityResult: candidate.eligibilityResult,
        estimatedPriceSar: candidate.estimatedPriceSar,
        estimatedTurnaroundHours: candidate.estimatedTurnaroundHours,
        distanceKm: roundScore(candidate.distanceKm, 3),
        activeLoadRatio: roundScore(candidate.activeLoadRatio, 4),
        slaComplianceRate: roundScore(candidate.slaComplianceRate, 4),
      };
    })
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      if (left.estimatedPriceSar !== right.estimatedPriceSar) {
        return left.estimatedPriceSar - right.estimatedPriceSar;
      }

      if (right.slaComplianceRate !== left.slaComplianceRate) {
        return right.slaComplianceRate - left.slaComplianceRate;
      }

      if (right.provider.performance.rating !== left.provider.performance.rating) {
        return right.provider.performance.rating - left.provider.performance.rating;
      }

      return left.provider.id.localeCompare(right.provider.id);
    })
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));

  const bestProvider = rankedProviders[0];
  const rankedProviderById = new Map(rankedProviders.map((candidate) => [candidate.provider.id, candidate]));
  const logs = providers.map((provider) =>
    buildMatchingLog(
      order,
      matchingRunId,
      provider,
      eligibilityByProviderId.get(provider.id) ?? evaluateProviderEligibility(order, provider, { evaluatedAt }),
      bestProvider?.provider.id,
      rankedProviderById,
    ),
  );

  return {
    matchingRunId,
    orderId: order.id,
    evaluatedAt,
    weights,
    rankedProviders,
    bestProvider,
    excludedProviders,
    logs,
  };
};
