import { describe, expect, it } from "vitest";
import {
  AssignmentStatus,
  OrderAssignmentMode,
  OrderPriority,
  OrderStatus,
  ServiceBillingUnit,
  type LaundryOrder,
} from "../../src/features/orders/model";
import { createWashoffAssignmentExpiryWorker } from "./assignment-expiry-worker";

const createSilentLogger = () => {
  const logger = {
    child: () => logger,
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };

  return logger;
};

const buildOrder = (
  overrides: Partial<LaundryOrder> = {},
): LaundryOrder => ({
  id: "ORD-1045",
  hotelId: "hotel-1",
  hotelSnapshot: {
    id: "hotel-1",
    displayName: { ar: "فندق الريتز كارلتون" },
    city: "الرياض",
  },
  providerId: "provider-1",
  providerSnapshot: {
    id: "provider-1",
    displayName: { ar: "النظافة الذهبية" },
    city: "الرياض",
  },
  assignmentMode: OrderAssignmentMode.Auto,
  status: OrderStatus.Assigned,
  priority: OrderPriority.Standard,
  items: [
    {
      id: "item-1",
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
  notesAr: undefined,
  statusUpdatedAt: "2026-03-19T09:00:00.000Z",
  progressPercent: 8,
  activeAssignmentId: "assignment-1",
  activeAssignment: {
    id: "assignment-1",
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
    eligibilityResult: {
      providerId: "provider-1",
      orderId: "ORD-1045",
      eligible: true,
      reasonCodes: [],
      blockingReasonsAr: [],
      capabilityMatch: {
        providerId: "provider-1",
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
      availableCapacityKg: 220,
      evaluatedAt: "2026-03-19T09:00:00.000Z",
    },
  },
  assignmentHistory: [],
  matchingLogs: [],
  slaWindow: {
    responseDueAt: "2026-03-19T09:30:00.000Z",
    pickupTargetAt: "2026-03-20T09:00:00.000Z",
  },
  slaHistory: [],
  reassignmentEvents: [],
  createdAt: "2026-03-19T09:00:00.000Z",
  updatedAt: "2026-03-19T09:00:00.000Z",
  ...overrides,
});

describe("createWashoffAssignmentExpiryWorker", () => {
  it("returns zero work when no assignments are expired", async () => {
    const orders = [
      buildOrder({
        activeAssignment: {
          ...buildOrder().activeAssignment!,
          responseDueAt: "2026-03-19T12:30:00.000Z",
        },
      }),
    ];
    const worker = createWashoffAssignmentExpiryWorker({
      repository: {
        listAllOrders: async () => orders,
      },
      service: {
        runAssignmentExpirySweep: async () => orders,
      },
      logger: createSilentLogger(),
    });

    const result = await worker.runOnce("2026-03-19T10:00:00.000Z");

    expect(result.expiredCandidates).toBe(0);
    expect(result.processedOrderIds).toEqual([]);
    expect(result.attempts).toBe(1);
    expect(result.retried).toBe(false);
  });

  it("reports reassigned and unresolved results after the sweep", async () => {
    const beforeOrders = [
      buildOrder({ id: "ORD-1", activeAssignmentId: "assignment-1" }),
      buildOrder({ id: "ORD-2", activeAssignmentId: "assignment-2", activeAssignment: { ...buildOrder().activeAssignment!, id: "assignment-2", orderId: "ORD-2" } }),
    ];
    const afterOrders = [
      buildOrder({
        id: "ORD-1",
        activeAssignmentId: "assignment-1-retry",
        activeAssignment: {
          ...buildOrder().activeAssignment!,
          id: "assignment-1-retry",
          orderId: "ORD-1",
          attemptNumber: 2,
          providerId: "provider-2",
        },
        providerId: "provider-2",
      }),
      buildOrder({
        id: "ORD-2",
        status: OrderStatus.PendingCapacity,
        providerId: undefined,
        providerSnapshot: undefined,
        activeAssignmentId: undefined,
        activeAssignment: undefined,
      }),
    ];
    const worker = createWashoffAssignmentExpiryWorker({
      repository: {
        listAllOrders: async () => beforeOrders,
      },
      service: {
        runAssignmentExpirySweep: async () => afterOrders,
      },
      logger: createSilentLogger(),
    });

    const result = await worker.runOnce("2026-03-19T10:00:00.000Z");

    expect(result.expiredCandidates).toBe(2);
    expect(result.reassignedOrders).toBe(1);
    expect(result.unresolvedOrders).toBe(1);
    expect(result.processedOrderIds).toEqual(["ORD-1", "ORD-2"]);
    expect(result.attempts).toBe(1);
    expect(result.retried).toBe(false);
  });

  it("skips overlapping runs safely", async () => {
    let release = () => undefined;
    const blocker = new Promise<LaundryOrder[]>((resolve) => {
      release = () => resolve([]);
    });
    const worker = createWashoffAssignmentExpiryWorker({
      repository: {
        listAllOrders: async () => [buildOrder()],
      },
      service: {
        runAssignmentExpirySweep: async () => blocker,
      },
      logger: createSilentLogger(),
    });

    const firstRun = worker.runOnce("2026-03-19T10:00:00.000Z");
    const secondRun = await worker.runOnce("2026-03-19T10:00:00.000Z");
    release();
    await firstRun;

    expect(secondRun.skippedBecauseRunning).toBe(true);
  });

  it("retries failed worker jobs before succeeding", async () => {
    let attempts = 0;
    const worker = createWashoffAssignmentExpiryWorker({
      repository: {
        listAllOrders: async () => [buildOrder()],
      },
      service: {
        runAssignmentExpirySweep: async () => {
          attempts += 1;

          if (attempts === 1) {
            throw new Error("temporary failure");
          }

          return [
            buildOrder({
              id: "ORD-1045",
              activeAssignmentId: "assignment-1-retry",
              activeAssignment: {
                ...buildOrder().activeAssignment!,
                id: "assignment-1-retry",
                orderId: "ORD-1045",
                attemptNumber: 2,
                providerId: "provider-2",
              },
              providerId: "provider-2",
            }),
          ];
        },
      },
      maxAttempts: 2,
      logger: createSilentLogger(),
    });

    const result = await worker.runOnce("2026-03-19T10:00:00.000Z");

    expect(result.retried).toBe(true);
    expect(result.attempts).toBe(2);
    expect(result.reassignedOrders).toBe(1);
  });
});
