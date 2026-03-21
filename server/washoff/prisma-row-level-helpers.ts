import {
  MatchingDecision,
  OrderPriority,
  ProviderCapacityStatus,
  ReassignmentReason,
  type CreateHotelOrderInput,
  type LaundryOrder,
  type MatchingLog,
  type OrderItem,
  type ProviderProfile,
  type ServiceCatalogItem,
} from "../../src/features/orders/model";

const RELIABILITY_PENALTIES = {
  [ReassignmentReason.ProviderRejected]: {
    acceptanceRate: 0.03,
    rating: 0.05,
    qualityScore: 2,
    reassignmentRate: 0.03,
  },
  [ReassignmentReason.ProviderExpired]: {
    acceptanceRate: 0.06,
    rating: 0.08,
    qualityScore: 3,
    reassignmentRate: 0.05,
  },
} as const;

const roundMetric = (value: number, decimals = 3) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const normalizePickupAt = (pickupAt: string) => {
  const normalized = new Date(pickupAt);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error("يرجى إدخال موعد استلام صالح.");
  }

  return normalized.toISOString();
};

const getCapacityStatus = (availableKg: number, totalKg: number) => {
  if (availableKg <= 0) {
    return ProviderCapacityStatus.Full;
  }

  if (totalKg > 0 && availableKg / totalKg <= 0.2) {
    return ProviderCapacityStatus.Limited;
  }

  return ProviderCapacityStatus.Available;
};

export const rowLevelHelperSuite = {
  validateCreateHotelOrderInput: (
    input: CreateHotelOrderInput,
    services: ServiceCatalogItem[],
  ) => {
    const serviceIds = Array.from(
      new Set(
        input.serviceIds
          .map((serviceId) => serviceId.trim())
          .filter(Boolean),
      ),
    );

    if (serviceIds.length === 0) {
      throw new Error("اختر خدمة واحدة على الأقل قبل إرسال الطلب.");
    }

    const itemCount = Number(input.itemCount);

    if (!Number.isFinite(itemCount) || itemCount <= 0) {
      throw new Error("يرجى إدخال كمية صحيحة أكبر من صفر.");
    }

    const pickupAt = normalizePickupAt(input.pickupAt);

    if (new Date(pickupAt).getTime() <= Date.now()) {
      throw new Error("يجب أن يكون موعد الاستلام في المستقبل.");
    }

    const serviceMap = new Map(services.map((service) => [service.id, service]));

    serviceIds.forEach((serviceId) => {
      const service = serviceMap.get(serviceId);

      if (!service) {
        throw new Error(`الخدمة ${serviceId} غير موجودة.`);
      }

      if (!service.active) {
        throw new Error(`الخدمة ${service.name.ar} غير متاحة حالياً.`);
      }
    });

    return {
      serviceIds,
      itemCount,
      pickupAt,
      notesAr: (input.notesAr ?? input.notes?.trim()) || undefined,
      priority: input.priority ?? OrderPriority.Standard,
    };
  },

  buildOrderItems: ({
    orderId,
    serviceIds,
    totalItemCount,
    serviceMap,
  }: {
    orderId: string;
    serviceIds: string[];
    totalItemCount: number;
    serviceMap: Map<string, ServiceCatalogItem>;
  }): OrderItem[] => {
    return serviceIds.map((serviceId, index) => {
      const service = serviceMap.get(serviceId);

      if (!service) {
        throw new Error(`الخدمة ${serviceId} غير موجودة.`);
      }

      return {
        id: `${orderId}-item-${index + 1}-${service.id}`,
        serviceId: service.id,
        serviceName: service.name,
        quantity: totalItemCount,
        unit: service.billingUnit,
        unitPriceSar: service.defaultUnitPriceSar,
        estimatedLineTotalSar: totalItemCount * service.defaultUnitPriceSar,
      };
    });
  },

  getRankedCandidateLogs: (order: LaundryOrder, attemptedProviderIds: Set<string>) => {
    const providerLogMap = new Map<string, MatchingLog>();

    order.matchingLogs
      .filter(
        (log) =>
          (log.decision === MatchingDecision.Selected || log.decision === MatchingDecision.Shortlisted) &&
          !attemptedProviderIds.has(log.providerId),
      )
      .sort((left, right) => {
        if (right.scoreBreakdown.totalScore !== left.scoreBreakdown.totalScore) {
          return right.scoreBreakdown.totalScore - left.scoreBreakdown.totalScore;
        }

        return left.evaluatedAt.localeCompare(right.evaluatedAt);
      })
      .forEach((log) => {
        if (!providerLogMap.has(log.providerId)) {
          providerLogMap.set(log.providerId, log);
        }
      });

    return Array.from(providerLogMap.values());
  },

  applyCapacityMutation: (
    capacity: Pick<
      ProviderProfile["currentCapacity"],
      "providerId" | "date" | "totalKg" | "committedKg" | "reservedKg" | "createdAt"
    >,
    mode: "reserve" | "commit" | "release",
    quantityKg: number,
    timestamp: string,
  ) => {
    let committedKg = capacity.committedKg;
    let reservedKg = capacity.reservedKg;

    if (mode === "reserve") {
      reservedKg += quantityKg;
    } else if (mode === "commit") {
      reservedKg = Math.max(reservedKg - quantityKg, 0);
      committedKg += quantityKg;
    } else {
      reservedKg = Math.max(reservedKg - quantityKg, 0);
    }

    const availableKg = Math.max(capacity.totalKg - committedKg - reservedKg, 0);

    return {
      providerId: capacity.providerId,
      date: capacity.date,
      totalKg: capacity.totalKg,
      committedKg,
      reservedKg,
      availableKg,
      utilizationRatio: capacity.totalKg > 0 ? (committedKg + reservedKg) / capacity.totalKg : 0,
      status: getCapacityStatus(availableKg, capacity.totalKg),
      createdAt: capacity.createdAt,
      updatedAt: timestamp,
    };
  },

  applyReliabilityPenalty: (
    performance: Pick<
      ProviderProfile["performance"],
      "providerId" | "rating" | "acceptanceRate" | "onTimePickupRate" | "onTimeDeliveryRate" | "qualityScore" | "disputeRate" | "reassignmentRate" | "completedOrders" | "cancelledOrders"
    >,
    reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
    timestamp: string,
  ) => {
    const penalty = RELIABILITY_PENALTIES[reason];

    return {
      providerId: performance.providerId,
      rating: roundMetric(clamp(performance.rating - penalty.rating, 0, 5), 2),
      acceptanceRate: roundMetric(clamp(performance.acceptanceRate - penalty.acceptanceRate, 0, 1)),
      onTimePickupRate: performance.onTimePickupRate,
      onTimeDeliveryRate: performance.onTimeDeliveryRate,
      qualityScore: Math.max(performance.qualityScore - penalty.qualityScore, 0),
      disputeRate: performance.disputeRate,
      reassignmentRate: roundMetric(clamp(performance.reassignmentRate + penalty.reassignmentRate, 0, 1)),
      completedOrders: performance.completedOrders,
      cancelledOrders: performance.cancelledOrders,
      lastEvaluatedAt: timestamp,
    };
  },

  selectNextOrderNumber: (orderIds: string[]) => {
    const maxOrderNumber = orderIds.reduce((currentMax, orderId) => {
      const match = /(\d+)$/.exec(orderId);

      if (!match) {
        return currentMax;
      }

      return Math.max(currentMax, Number(match[1]));
    }, 1044);

    return maxOrderNumber + 1;
  },
};
