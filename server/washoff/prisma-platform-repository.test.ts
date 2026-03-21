import { describe, expect, it } from "vitest";
import {
  AssignmentStatus,
  MatchingDecision,
  OrderAssignmentMode,
  OrderPriority,
  OrderStatus,
  ReassignmentReason,
  ServiceBillingUnit,
  ServiceCategory,
  type LaundryOrder,
  type MatchingLog,
  type ServiceCatalogItem,
} from "../../src/features/orders/model";
import { rowLevelHelperSuite } from "./prisma-row-level-helpers";

const createService = (id: string, nameAr: string, price: number): ServiceCatalogItem => ({
  id,
  code: id,
  name: { ar: nameAr },
  category: ServiceCategory.Laundry,
  billingUnit: ServiceBillingUnit.Kilogram,
  defaultUnitPriceSar: price,
  defaultTurnaroundHours: 24,
  supportsRush: true,
  active: true,
});

const createMatchingLog = (
  providerId: string,
  score: number,
  decision: MatchingDecision,
): MatchingLog => ({
  id: `log-${providerId}`,
  matchingRunId: "match-1",
  orderId: "ORD-1045",
  providerId,
  decision,
  eligibilityResult: {
    providerId,
    orderId: "ORD-1045",
    eligible: true,
    reasonCodes: [],
    blockingReasonsAr: [],
    capabilityMatch: {
      providerId,
      requestedServiceIds: ["wash_fold"],
      matchedServiceIds: ["wash_fold"],
      unsupportedServiceIds: [],
      sameCity: true,
      serviceAreaCovered: true,
      supportsRequestedQuantities: true,
      supportsRequestedPickupTime: true,
      capacityAvailable: true,
      isMatch: true,
      reasonsAr: ["مطابقة كاملة"],
    },
    availableCapacityKg: 240,
    evaluatedAt: "2026-03-19T09:00:00.000Z",
  },
  scoreBreakdown: {
    totalScore: score,
    entries: [],
  },
  evaluatedAt: "2026-03-19T09:00:00.000Z",
});

const createOrder = (): LaundryOrder => ({
  id: "ORD-1045",
  hotelId: "hotel-1",
  hotelSnapshot: {
    id: "hotel-1",
    displayName: { ar: "فندق الريتز كارلتون" },
    city: "الرياض",
  },
  assignmentMode: OrderAssignmentMode.Auto,
  status: OrderStatus.Assigned,
  priority: OrderPriority.Standard,
  items: [
    {
      id: "ORD-1045-item-1-wash_fold",
      serviceId: "wash_fold",
      serviceName: { ar: "غسيل وطي" },
      quantity: 20,
      unit: ServiceBillingUnit.Kilogram,
      unitPriceSar: 15,
      estimatedLineTotalSar: 300,
    },
  ],
  totalItemCount: 20,
  currency: "SAR",
  estimatedSubtotalSar: 300,
  pickupAt: "2026-03-20T09:00:00.000Z",
  statusUpdatedAt: "2026-03-19T09:00:00.000Z",
  createdAt: "2026-03-19T09:00:00.000Z",
  updatedAt: "2026-03-19T09:00:00.000Z",
  providerId: "provider-1",
  providerSnapshot: {
    id: "provider-1",
    displayName: { ar: "النظافة الذهبية" },
    city: "الرياض",
  },
  progressPercent: 8,
  activeAssignmentId: "assignment-ORD-1045-1",
  activeAssignment: {
    id: "assignment-ORD-1045-1",
    orderId: "ORD-1045",
    hotelId: "hotel-1",
    providerId: "provider-1",
    attemptNumber: 1,
    status: AssignmentStatus.PendingAcceptance,
    assignedAt: "2026-03-19T09:00:00.000Z",
    responseDueAt: "2026-03-19T09:30:00.000Z",
    scoreBreakdown: {
      totalScore: 94,
      entries: [],
    },
    eligibilityResult: createMatchingLog("provider-1", 94, MatchingDecision.Selected).eligibilityResult,
  },
  assignmentHistory: [],
  matchingLogs: [
    createMatchingLog("provider-1", 94, MatchingDecision.Selected),
    createMatchingLog("provider-2", 90, MatchingDecision.Shortlisted),
    createMatchingLog("provider-3", 82, MatchingDecision.Shortlisted),
  ],
  slaWindow: {
    responseDueAt: "2026-03-19T09:30:00.000Z",
    pickupTargetAt: "2026-03-20T09:00:00.000Z",
  },
  slaHistory: [],
  reassignmentEvents: [],
});

describe("__rowLevelPrismaHelpers", () => {
  it("builds globally unique order item ids for direct row persistence", () => {
    const services = new Map([
      ["wash_fold", createService("wash_fold", "غسيل وطي", 15)],
      ["iron", createService("iron", "كي", 8)],
    ]);

    const items = rowLevelHelperSuite.buildOrderItems({
      orderId: "ORD-1200",
      serviceIds: ["wash_fold", "iron"],
      totalItemCount: 14,
      serviceMap: services,
    });

    expect(items.map((item) => item.id)).toEqual([
      "ORD-1200-item-1-wash_fold",
      "ORD-1200-item-2-iron",
    ]);
    expect(items[0].estimatedLineTotalSar).toBe(210);
  });

  it("selects the next reassignment candidate from stored ranked logs", () => {
    const order = createOrder();
    const attemptedProviders = new Set(["provider-1"]);

    const candidates = rowLevelHelperSuite.getRankedCandidateLogs(order, attemptedProviders);

    expect(candidates.map((candidate) => candidate.providerId)).toEqual(["provider-2", "provider-3"]);
    expect(candidates[0].scoreBreakdown.totalScore).toBeGreaterThan(candidates[1].scoreBreakdown.totalScore);
  });

  it("updates provider capacity correctly for reserve, commit, and release flows", () => {
    const baseCapacity = {
      providerId: "provider-1",
      date: "2026-03-19",
      totalKg: 1000,
      committedKg: 680,
      reservedKg: 20,
      createdAt: "2026-03-19T06:00:00.000Z",
    };

    const reserved = rowLevelHelperSuite.applyCapacityMutation(
      baseCapacity,
      "reserve",
      40,
      "2026-03-19T10:00:00.000Z",
    );
    const committed = rowLevelHelperSuite.applyCapacityMutation(
      reserved,
      "commit",
      40,
      "2026-03-19T10:05:00.000Z",
    );
    const released = rowLevelHelperSuite.applyCapacityMutation(
      reserved,
      "release",
      40,
      "2026-03-19T10:10:00.000Z",
    );

    expect(reserved.reservedKg).toBe(60);
    expect(reserved.availableKg).toBe(260);
    expect(committed.committedKg).toBe(720);
    expect(committed.reservedKg).toBe(20);
    expect(released.reservedKg).toBe(20);
    expect(released.availableKg).toBe(300);
  });

  it("applies provider reliability penalties with timeout stricter than rejection", () => {
    const performance = {
      providerId: "provider-1",
      rating: 4.9,
      acceptanceRate: 0.96,
      onTimePickupRate: 0.98,
      onTimeDeliveryRate: 0.98,
      qualityScore: 95,
      disputeRate: 0.02,
      reassignmentRate: 0.06,
      completedOrders: 120,
      cancelledOrders: 3,
    };

    const rejected = rowLevelHelperSuite.applyReliabilityPenalty(
      performance,
      ReassignmentReason.ProviderRejected,
      "2026-03-19T10:00:00.000Z",
    );
    const expired = rowLevelHelperSuite.applyReliabilityPenalty(
      performance,
      ReassignmentReason.ProviderExpired,
      "2026-03-19T10:00:00.000Z",
    );

    expect(rejected.acceptanceRate).toBeCloseTo(0.93, 3);
    expect(expired.acceptanceRate).toBeCloseTo(0.9, 3);
    expect(expired.rating).toBeLessThan(rejected.rating);
    expect(expired.reassignmentRate).toBeGreaterThan(rejected.reassignmentRate);
  });

  it("resolves the next order number from persisted row ids", () => {
    const nextOrderNumber = rowLevelHelperSuite.selectNextOrderNumber([
      "ORD-1045",
      "ORD-1102",
      "ORD-1107",
    ]);

    expect(nextOrderNumber).toBe(1108);
  });
});
