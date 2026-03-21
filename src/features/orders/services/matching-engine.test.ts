import { describe, expect, it } from "vitest";
import {
  OnboardingStatus,
  OrderAssignmentMode,
  OrderPriority,
  OrderStatus,
  ProviderCapacityStatus,
  ServiceBillingUnit,
  type Order,
  type Provider,
} from "@/features/orders/model";
import { EligibilityReasonCode, MatchingDecision } from "@/features/orders/model/matching";
import { matchProvidersForOrder, evaluateProviderEligibility } from "@/features/orders/services/matching-engine";
import { normalizeHigherIsBetter, normalizeLowerIsBetter } from "@/features/orders/services/matching-helpers";

const buildOrder = (): Order => {
  const pickupAt = "2030-03-20T12:00:00+03:00";

  return {
    id: "order-1",
    hotelId: "hotel-1",
    hotelSnapshot: {
      id: "hotel-1",
      displayName: { ar: "فندق الاختبار" },
      city: "الرياض",
    },
    assignmentMode: OrderAssignmentMode.Auto,
    status: OrderStatus.Submitted,
    priority: OrderPriority.Standard,
    items: [
      {
        id: "item-1",
        serviceId: "wash_fold",
        serviceName: { ar: "غسيل وطي" },
        quantity: 100,
        unit: ServiceBillingUnit.Kilogram,
        unitPriceSar: 15,
        estimatedLineTotalSar: 1500,
      },
    ],
    totalItemCount: 100,
    currency: "SAR",
    estimatedSubtotalSar: 1500,
    pickupAt,
    createdAt: "2030-03-20T08:00:00+03:00",
    updatedAt: "2030-03-20T08:00:00+03:00",
    statusUpdatedAt: "2030-03-20T08:00:00+03:00",
    assignmentHistory: [],
    matchingLogs: [],
    slaWindow: {
      pickupTargetAt: pickupAt,
    },
    slaHistory: [],
    reassignmentEvents: [],
  };
};

const buildProvider = ({
  id,
  city = "الرياض",
  serviceId = "wash_fold",
  serviceNameAr = "غسيل وطي",
  unitPriceSar = 14,
  turnaroundHours = 24,
  rating = 4.7,
  availableKg = 500,
  totalKg = 1000,
  onTimeRate = 0.95,
  maxSingleOrderKg = 200,
  minimumPickupLeadHours = 2,
  pickupWindowStartHour = 8,
  pickupWindowEndHour = 22,
  active = true,
}: {
  id: string;
  city?: string;
  serviceId?: string;
  serviceNameAr?: string;
  unitPriceSar?: number;
  turnaroundHours?: number;
  rating?: number;
  availableKg?: number;
  totalKg?: number;
  onTimeRate?: number;
  maxSingleOrderKg?: number;
  minimumPickupLeadHours?: number;
  pickupWindowStartHour?: number;
  pickupWindowEndHour?: number;
  active?: boolean;
}): Provider => {
  const committedKg = Math.max(totalKg - availableKg, 0);

  return {
    id,
    code: id.toUpperCase(),
    legalName: { ar: `مزود ${id}` },
    displayName: { ar: `مزود ${id}` },
    address: {
      countryCode: "SA",
      city,
    },
    timezone: "Asia/Riyadh",
    contact: {},
    serviceAreaCities: [city],
    capabilities: [
      {
        serviceId,
        serviceName: { ar: serviceNameAr },
        active: true,
        unitPriceSar,
        maxDailyKg: totalKg,
        maxSingleOrderKg,
        rushSupported: true,
        supportedCityCodes: [city],
        defaultTurnaroundHours: turnaroundHours,
        minimumPickupLeadHours,
        pickupWindow: {
          startHour: pickupWindowStartHour,
          endHour: pickupWindowEndHour,
        },
      },
    ],
    currentCapacity: {
      providerId: id,
      date: "2030-03-20",
      totalKg,
      committedKg,
      reservedKg: 0,
      availableKg,
      utilizationRatio: totalKg === 0 ? 0 : committedKg / totalKg,
      status: availableKg <= 0 ? ProviderCapacityStatus.Full : ProviderCapacityStatus.Available,
      createdAt: "2030-03-20T06:00:00+03:00",
      updatedAt: "2030-03-20T08:00:00+03:00",
    },
    performance: {
      providerId: id,
      rating,
      acceptanceRate: 0.95,
      onTimePickupRate: onTimeRate,
      onTimeDeliveryRate: onTimeRate,
      qualityScore: 90,
      disputeRate: 0.01,
      reassignmentRate: 0.02,
      completedOrders: 320,
      cancelledOrders: 8,
      lastEvaluatedAt: "2030-03-20T07:00:00+03:00",
    },
    active,
    onboarding: {
      status: OnboardingStatus.Approved,
      submittedAt: "2030-03-10T08:00:00+03:00",
      reviewedAt: "2030-03-11T08:00:00+03:00",
      reviewedByRole: "admin",
      reviewedById: "admin-1",
    },
    createdAt: "2030-03-10T08:00:00+03:00",
    updatedAt: "2030-03-20T08:00:00+03:00",
  };
};

describe("matching helpers", () => {
  it("normalizes higher-is-better and lower-is-better values into a 0..1 range", () => {
    expect(normalizeHigherIsBetter(80, { min: 50, max: 100 })).toBeCloseTo(0.6);
    expect(normalizeLowerIsBetter(12, { min: 10, max: 20 })).toBeCloseTo(0.8);
  });
});

describe("matching engine", () => {
  it("filters ineligible providers with clear exclusion reason codes", () => {
    const order = buildOrder();
    const evaluatedAt = "2030-03-20T08:00:00+03:00";
    const cityMismatchProvider = buildProvider({ id: "provider-city", city: "جدة" });
    const serviceProvider = buildProvider({ id: "provider-service", serviceId: "dry_clean", serviceNameAr: "تنظيف جاف" });
    const quantityProvider = buildProvider({ id: "provider-qty", maxSingleOrderKg: 50 });
    const pickupProvider = buildProvider({ id: "provider-pickup", minimumPickupLeadHours: 6 });
    const capacityProvider = buildProvider({ id: "provider-capacity", availableKg: 40 });

    expect(evaluateProviderEligibility(order, cityMismatchProvider, { evaluatedAt }).reasonCodes).toContain(
      EligibilityReasonCode.CityMismatch,
    );
    expect(evaluateProviderEligibility(order, serviceProvider, { evaluatedAt }).reasonCodes).toContain(
      EligibilityReasonCode.ServiceUnsupported,
    );
    expect(evaluateProviderEligibility(order, serviceProvider, { evaluatedAt }).reasonCodes).not.toContain(
      EligibilityReasonCode.CityMismatch,
    );
    expect(evaluateProviderEligibility(order, serviceProvider, { evaluatedAt }).reasonCodes).not.toContain(
      EligibilityReasonCode.QuantityUnsupported,
    );
    expect(evaluateProviderEligibility(order, serviceProvider, { evaluatedAt }).reasonCodes).not.toContain(
      EligibilityReasonCode.PickupTimeUnsupported,
    );
    expect(evaluateProviderEligibility(order, quantityProvider, { evaluatedAt }).reasonCodes).toContain(
      EligibilityReasonCode.QuantityUnsupported,
    );
    expect(evaluateProviderEligibility(order, pickupProvider, { evaluatedAt }).reasonCodes).toContain(
      EligibilityReasonCode.PickupTimeUnsupported,
    );
    expect(evaluateProviderEligibility(order, capacityProvider, { evaluatedAt }).reasonCodes).toContain(
      EligibilityReasonCode.CapacityUnavailable,
    );
  });

  it("excludes providers that are not approved even when operationally capable", () => {
    const order = buildOrder();
    const evaluatedAt = "2030-03-20T08:00:00+03:00";
    const pendingProvider = {
      ...buildProvider({ id: "provider-pending" }),
      onboarding: {
        status: OnboardingStatus.PendingApproval,
        submittedAt: "2030-03-19T08:00:00+03:00",
      },
    };

    const eligibility = evaluateProviderEligibility(order, pendingProvider, { evaluatedAt });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasonCodes).toContain(EligibilityReasonCode.ProviderNotApproved);
  });

  it("scores only eligible providers and selects the highest ranked provider", () => {
    const order = buildOrder();
    const evaluatedAt = "2030-03-20T08:00:00+03:00";
    const bestValueProvider = buildProvider({
      id: "provider-best",
      unitPriceSar: 12,
      turnaroundHours: 18,
      rating: 4.6,
      availableKg: 400,
      onTimeRate: 0.93,
    });
    const premiumProvider = buildProvider({
      id: "provider-premium",
      unitPriceSar: 15,
      turnaroundHours: 24,
      rating: 4.9,
      availableKg: 600,
      onTimeRate: 0.98,
    });
    const ineligibleProvider = buildProvider({
      id: "provider-blocked",
      availableKg: 20,
    });

    const result = matchProvidersForOrder(order, [bestValueProvider, premiumProvider, ineligibleProvider], {
      evaluatedAt,
    });

    expect(result.rankedProviders).toHaveLength(2);
    expect(result.bestProvider?.provider.id).toBe("provider-best");
    expect(result.rankedProviders[0].totalScore).toBeGreaterThan(result.rankedProviders[1].totalScore);
    expect(result.excludedProviders).toHaveLength(1);
    expect(result.excludedProviders[0].eligibilityResult.reasonCodes).toContain(EligibilityReasonCode.CapacityUnavailable);
  });

  it("produces matching logs for selected, shortlisted, and skipped providers", () => {
    const order = buildOrder();
    const evaluatedAt = "2030-03-20T08:00:00+03:00";
    const selectedProvider = buildProvider({
      id: "provider-selected",
      unitPriceSar: 11,
      turnaroundHours: 16,
      rating: 4.8,
      availableKg: 500,
      onTimeRate: 0.97,
    });
    const shortlistedProvider = buildProvider({
      id: "provider-shortlisted",
      unitPriceSar: 13,
      turnaroundHours: 22,
      rating: 4.7,
      availableKg: 420,
      onTimeRate: 0.94,
    });
    const skippedProvider = buildProvider({
      id: "provider-skipped",
      city: "جدة",
    });

    const result = matchProvidersForOrder(order, [selectedProvider, shortlistedProvider, skippedProvider], {
      evaluatedAt,
    });
    const decisions = new Map(result.logs.map((log) => [log.providerId, log.decision]));

    expect(decisions.get("provider-selected")).toBe(MatchingDecision.Selected);
    expect(decisions.get("provider-shortlisted")).toBe(MatchingDecision.Shortlisted);
    expect(decisions.get("provider-skipped")).toBe(MatchingDecision.Skipped);
  });
});
