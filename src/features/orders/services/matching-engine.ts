import { ProviderCapacityStatus, type Provider, type ProviderServiceCapability } from "@/features/orders/model/provider";
import { getOrderQuantityTotal, type Order } from "@/features/orders/model/order";
import { OnboardingStatus } from "@/features/orders/model/onboarding";
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
import { buildNumericRange, normalizeHigherIsBetter, normalizeLowerIsBetter, roundScore, toPercentageScore } from "@/features/orders/services/matching-helpers";

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
  capacityAvailabilityRatio: number;
  onTimePerformanceRate: number;
  ratingValue: number;
}

export const DEFAULT_MATCHING_SCORE_WEIGHTS: MatchingScoreWeights = {
  price: 0.25,
  slaSpeed: 0.25,
  rating: 0.2,
  capacityAvailability: 0.2,
  onTimePerformance: 0.1,
};

const RATING_RANGE = {
  min: 0,
  max: 5,
};

const RATE_RANGE = {
  min: 0,
  max: 1,
};

const normalizeText = (value: string) => {
  return value.trim().toLocaleLowerCase("ar-SA");
};

const getRequestedServiceIds = (order: Pick<Order, "items">) => {
  return Array.from(new Set(order.items.map((item) => item.serviceId)));
};

const getCapabilityForService = (provider: Provider, serviceId: string) => {
  return provider.capabilities.find((capability) => capability.serviceId === serviceId && capability.active);
};

const hasServiceAreaCoverage = (provider: Provider, requestedServiceIds: string[], hotelCity: string) => {
  if (!provider.serviceAreaCities.some((city) => normalizeText(city) === hotelCity)) {
    return false;
  }

  return requestedServiceIds
    .map((serviceId) => getCapabilityForService(provider, serviceId))
    .filter((capability): capability is ProviderServiceCapability => Boolean(capability))
    .every((capability) => capability.supportedCityCodes.some((cityCode) => normalizeText(cityCode) === hotelCity));
};

const getRequestedServiceQuantities = (order: Pick<Order, "items">) => {
  return order.items.reduce<Record<string, number>>((quantities, item) => {
    quantities[item.serviceId] = (quantities[item.serviceId] ?? 0) + item.quantity;
    return quantities;
  }, {});
};

const getPickupHourInProviderTimezone = (pickupAt: string, providerTimezone: string) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: providerTimezone,
    });

    return Number(formatter.format(new Date(pickupAt)));
  } catch {
    return new Date(pickupAt).getHours();
  }
};

const hasMinimumPickupLeadTime = (pickupAt: string, evaluatedAt: string, minimumPickupLeadHours: number) => {
  const pickupTime = new Date(pickupAt).getTime();
  const evaluationTime = new Date(evaluatedAt).getTime();

  if (Number.isNaN(pickupTime) || Number.isNaN(evaluationTime)) {
    return false;
  }

  const leadHours = (pickupTime - evaluationTime) / (1000 * 60 * 60);
  return leadHours >= minimumPickupLeadHours;
};

const isPickupHourWithinWindow = (pickupHour: number, capability: ProviderServiceCapability) => {
  const { startHour, endHour } = capability.pickupWindow;

  if (startHour === endHour) {
    return true;
  }

  if (startHour < endHour) {
    return pickupHour >= startHour && pickupHour < endHour;
  }

  return pickupHour >= startHour || pickupHour < endHour;
};

const supportsRequestedPickupTime = (
  capability: ProviderServiceCapability,
  pickupAt: string,
  providerTimezone: string,
  evaluatedAt: string,
) => {
  const pickupHour = getPickupHourInProviderTimezone(pickupAt, providerTimezone);

  return (
    hasMinimumPickupLeadTime(pickupAt, evaluatedAt, capability.minimumPickupLeadHours) &&
    isPickupHourWithinWindow(pickupHour, capability)
  );
};

const resolveEligibilityReasonLabels = (reasonCodes: EligibilityReasonCode[]) => {
  return reasonCodes.map((reasonCode) => eligibilityReasonLabelsAr[reasonCode]);
};

const buildCapabilityMatch = (
  provider: Provider,
  order: Order,
  evaluatedAt: string,
  reasonCodes: EligibilityReasonCode[],
): ProviderCapabilityMatch => {
  const hotelCity = normalizeText(order.hotelSnapshot.city);
  const requestedServiceIds = getRequestedServiceIds(order);
  const requestedQuantities = getRequestedServiceQuantities(order);
  const matchedServiceIds = requestedServiceIds.filter((serviceId) => Boolean(getCapabilityForService(provider, serviceId)));
  const unsupportedServiceIds = requestedServiceIds.filter((serviceId) => !matchedServiceIds.includes(serviceId));
  const sameCity = normalizeText(provider.address.city) === hotelCity;
  const serviceAreaCovered = hasServiceAreaCoverage(provider, requestedServiceIds, hotelCity);
  const supportsRequestedQuantities = requestedServiceIds.every((serviceId) => {
    const capability = getCapabilityForService(provider, serviceId);
    const requestedQuantity = requestedQuantities[serviceId] ?? 0;

    if (!capability) {
      return false;
    }

    return requestedQuantity <= capability.maxSingleOrderKg && requestedQuantity <= capability.maxDailyKg;
  });
  const supportsPickupTime = requestedServiceIds.every((serviceId) => {
    const capability = getCapabilityForService(provider, serviceId);
    return capability
      ? supportsRequestedPickupTime(capability, order.pickupAt, provider.timezone, evaluatedAt)
      : false;
  });
  const capacityAvailable =
    provider.currentCapacity.status !== ProviderCapacityStatus.Offline &&
    provider.currentCapacity.status !== ProviderCapacityStatus.Full &&
    provider.currentCapacity.availableKg >= getOrderQuantityTotal(order);
  const blockingReasonsAr = resolveEligibilityReasonLabels(reasonCodes);

  return {
    providerId: provider.id,
    requestedServiceIds,
    matchedServiceIds,
    unsupportedServiceIds,
    sameCity,
    serviceAreaCovered,
    supportsRequestedQuantities,
    supportsRequestedPickupTime: supportsPickupTime,
    capacityAvailable,
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
  const hotelCity = normalizeText(order.hotelSnapshot.city);
  const requestedServiceIds = getRequestedServiceIds(order);
  const requestedQuantities = getRequestedServiceQuantities(order);
  const sameCity = normalizeText(provider.address.city) === hotelCity;
  const serviceAreaCovered = hasServiceAreaCoverage(provider, requestedServiceIds, hotelCity);
  const hasUnsupportedService = requestedServiceIds.some((serviceId) => !getCapabilityForService(provider, serviceId));
  const quantitiesSupported =
    hasUnsupportedService ||
    requestedServiceIds.every((serviceId) => {
      const capability = getCapabilityForService(provider, serviceId);
      const requestedQuantity = requestedQuantities[serviceId] ?? 0;

      if (!capability) {
        return false;
      }

      return requestedQuantity <= capability.maxSingleOrderKg && requestedQuantity <= capability.maxDailyKg;
    });
  const pickupTimeSupported =
    hasUnsupportedService ||
    requestedServiceIds.every((serviceId) => {
      const capability = getCapabilityForService(provider, serviceId);
      return capability
        ? supportsRequestedPickupTime(capability, order.pickupAt, provider.timezone, evaluatedAt)
        : false;
    });
  const hasAvailableCapacity =
    provider.currentCapacity.status !== ProviderCapacityStatus.Offline &&
    provider.currentCapacity.status !== ProviderCapacityStatus.Full &&
    provider.currentCapacity.availableKg >= getOrderQuantityTotal(order);
  const reasonCodes: EligibilityReasonCode[] = [];

  if (!provider.active) {
    reasonCodes.push(EligibilityReasonCode.ProviderInactive);
  }

  if (provider.onboarding.status !== OnboardingStatus.Approved) {
    reasonCodes.push(EligibilityReasonCode.ProviderNotApproved);
  }

  if (!sameCity || !serviceAreaCovered) {
    reasonCodes.push(EligibilityReasonCode.CityMismatch);
  }

  if (hasUnsupportedService) {
    reasonCodes.push(EligibilityReasonCode.ServiceUnsupported);
  }

  if (!hasUnsupportedService && !quantitiesSupported) {
    reasonCodes.push(EligibilityReasonCode.QuantityUnsupported);
  }

  if (!hasUnsupportedService && !pickupTimeSupported) {
    reasonCodes.push(EligibilityReasonCode.PickupTimeUnsupported);
  }

  if (!hasAvailableCapacity) {
    reasonCodes.push(EligibilityReasonCode.CapacityUnavailable);
  }

  return {
    providerId: provider.id,
    orderId: order.id,
    eligible: reasonCodes.length === 0,
    reasonCodes,
    blockingReasonsAr: resolveEligibilityReasonLabels(reasonCodes),
    capabilityMatch: buildCapabilityMatch(provider, order, evaluatedAt, reasonCodes),
    availableCapacityKg: provider.currentCapacity.availableKg,
    evaluatedAt,
  };
};

const estimateProviderPrice = (order: Order, provider: Provider) => {
  return roundScore(
    order.items.reduce((total, item) => {
      const capability = getCapabilityForService(provider, item.serviceId);
      return total + item.quantity * (capability?.unitPriceSar ?? item.unitPriceSar);
    }, 0),
  );
};

const estimateProviderTurnaroundHours = (order: Order, provider: Provider) => {
  const turnaroundHours = order.items.map((item) => {
    const capability = getCapabilityForService(provider, item.serviceId);
    return capability?.defaultTurnaroundHours ?? 0;
  });

  return Math.max(...turnaroundHours, 0);
};

const getCapacityAvailabilityRatio = (provider: Provider) => {
  if (provider.currentCapacity.totalKg <= 0) {
    return 0;
  }

  return Math.min(provider.currentCapacity.availableKg / provider.currentCapacity.totalKg, 1);
};

const getOnTimePerformanceRate = (provider: Provider) => {
  return (provider.performance.onTimePickupRate + provider.performance.onTimeDeliveryRate) / 2;
};

const buildScoreBreakdown = (
  candidate: EligibleProviderScoringInput,
  weights: MatchingScoreWeights,
  ranges: {
    price: ReturnType<typeof buildNumericRange>;
    turnaround: ReturnType<typeof buildNumericRange>;
  },
): ScoreBreakdown => {
  const priceScore = toPercentageScore(normalizeLowerIsBetter(candidate.estimatedPriceSar, ranges.price));
  const slaSpeedScore = toPercentageScore(normalizeLowerIsBetter(candidate.estimatedTurnaroundHours, ranges.turnaround));
  const ratingScore = toPercentageScore(normalizeHigherIsBetter(candidate.ratingValue, RATING_RANGE));
  const capacityScore = toPercentageScore(normalizeHigherIsBetter(candidate.capacityAvailabilityRatio, RATE_RANGE));
  const onTimeScore = toPercentageScore(normalizeHigherIsBetter(candidate.onTimePerformanceRate, RATE_RANGE));

  const entries: ScoreBreakdownEntry[] = [
    {
      criterion: MatchingCriterion.Price,
      labelAr: "درجة السعر",
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
      explanationAr: `زمن التنفيذ التقديري ${candidate.estimatedTurnaroundHours} ساعة`,
    },
    {
      criterion: MatchingCriterion.Rating,
      labelAr: "تقييم المزوّد",
      weight: weights.rating,
      rawScore: ratingScore,
      weightedScore: roundScore(ratingScore * weights.rating),
      explanationAr: `التقييم الحالي ${roundScore(candidate.ratingValue, 1)} من 5`,
    },
    {
      criterion: MatchingCriterion.CapacityAvailability,
      labelAr: "توفر السعة",
      weight: weights.capacityAvailability,
      rawScore: capacityScore,
      weightedScore: roundScore(capacityScore * weights.capacityAvailability),
      explanationAr: `السعة المتاحة ${candidate.eligibilityResult.availableCapacityKg} كجم`,
    },
    {
      criterion: MatchingCriterion.OnTimePerformance,
      labelAr: "الالتزام بالمواعيد",
      weight: weights.onTimePerformance,
      rawScore: onTimeScore,
      weightedScore: roundScore(onTimeScore * weights.onTimePerformance),
      explanationAr: `معدل الالتزام ${roundScore(candidate.onTimePerformanceRate * 100)}%`,
    },
  ];

  return {
    totalScore: roundScore(entries.reduce((total, entry) => total + entry.weightedScore, 0)),
    entries,
  };
};

const buildEligibleProviderScoringInput = (order: Order, provider: Provider, eligibilityResult: EligibilityResult): EligibleProviderScoringInput => {
  return {
    provider,
    eligibilityResult,
    estimatedPriceSar: estimateProviderPrice(order, provider),
    estimatedTurnaroundHours: estimateProviderTurnaroundHours(order, provider),
    capacityAvailabilityRatio: getCapacityAvailabilityRatio(provider),
    onTimePerformanceRate: getOnTimePerformanceRate(provider),
    ratingValue: provider.performance.rating,
  };
};

export const createMatchingRunId = (orderId: string, evaluatedAt: string) => {
  const normalizedTimestamp = evaluatedAt.replace(/[^0-9]/g, "").slice(0, 14);
  return `match-${orderId}-${normalizedTimestamp}`;
};

const resolveScoreWeights = (weights?: Partial<MatchingScoreWeights>): MatchingScoreWeights => {
  return {
    ...DEFAULT_MATCHING_SCORE_WEIGHTS,
    ...weights,
  };
};

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
        ? "تم اختيار هذا المزوّد كأفضل تطابق تلقائي"
        : decision === MatchingDecision.Shortlisted
          ? "المزوّد مؤهل لكنه لم يحصل على أعلى نتيجة"
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
    turnaround: buildNumericRange(eligibleCandidates.map((candidate) => candidate.estimatedTurnaroundHours)),
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
        capacityAvailabilityRatio: roundScore(candidate.capacityAvailabilityRatio, 4),
        onTimePerformanceRate: roundScore(candidate.onTimePerformanceRate, 4),
      };
    })
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      if (left.estimatedPriceSar !== right.estimatedPriceSar) {
        return left.estimatedPriceSar - right.estimatedPriceSar;
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
