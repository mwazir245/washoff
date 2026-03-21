export enum OrderStatus {
  Submitted = "submitted",
  AutoMatching = "auto_matching",
  PendingCapacity = "pending_capacity",
  Assigned = "assigned",
  Accepted = "accepted",
  PickupScheduled = "pickup_scheduled",
  PickedUp = "picked_up",
  InProcessing = "in_processing",
  QualityCheck = "quality_check",
  OutForDelivery = "out_for_delivery",
  Delivered = "delivered",
  Completed = "completed",
  Cancelled = "cancelled",
  Reassigned = "reassigned",
  Disputed = "disputed",
}

export const orderLifecycleSequence: OrderStatus[] = [
  OrderStatus.Submitted,
  OrderStatus.AutoMatching,
  OrderStatus.PendingCapacity,
  OrderStatus.Assigned,
  OrderStatus.Accepted,
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
  OrderStatus.Delivered,
  OrderStatus.Completed,
];

export const orderExecutionLifecycleSequence: OrderStatus[] = [
  OrderStatus.Accepted,
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
  OrderStatus.Delivered,
  OrderStatus.Completed,
];

export const providerExecutableOrderStatuses = new Set<OrderStatus>([
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
  OrderStatus.Delivered,
]);

export const orderStatusProgressPercent: Record<OrderStatus, number> = {
  [OrderStatus.Submitted]: 2,
  [OrderStatus.AutoMatching]: 5,
  [OrderStatus.PendingCapacity]: 4,
  [OrderStatus.Assigned]: 8,
  [OrderStatus.Accepted]: 12,
  [OrderStatus.PickupScheduled]: 28,
  [OrderStatus.PickedUp]: 42,
  [OrderStatus.InProcessing]: 60,
  [OrderStatus.QualityCheck]: 76,
  [OrderStatus.OutForDelivery]: 88,
  [OrderStatus.Delivered]: 96,
  [OrderStatus.Completed]: 100,
  [OrderStatus.Cancelled]: 0,
  [OrderStatus.Reassigned]: 8,
  [OrderStatus.Disputed]: 70,
};

const orderTransitionMap: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Submitted]: [OrderStatus.AutoMatching, OrderStatus.Cancelled],
  [OrderStatus.AutoMatching]: [OrderStatus.Assigned, OrderStatus.PendingCapacity, OrderStatus.Cancelled],
  [OrderStatus.PendingCapacity]: [OrderStatus.AutoMatching, OrderStatus.Assigned, OrderStatus.Cancelled],
  [OrderStatus.Assigned]: [OrderStatus.Accepted, OrderStatus.PendingCapacity, OrderStatus.Reassigned, OrderStatus.Cancelled],
  [OrderStatus.Accepted]: [OrderStatus.PickupScheduled, OrderStatus.PendingCapacity, OrderStatus.Reassigned, OrderStatus.Cancelled],
  [OrderStatus.PickupScheduled]: [OrderStatus.PickedUp, OrderStatus.PendingCapacity, OrderStatus.Reassigned, OrderStatus.Cancelled],
  [OrderStatus.PickedUp]: [OrderStatus.InProcessing, OrderStatus.PendingCapacity, OrderStatus.Reassigned, OrderStatus.Cancelled],
  [OrderStatus.InProcessing]: [OrderStatus.QualityCheck, OrderStatus.PendingCapacity, OrderStatus.Reassigned, OrderStatus.Cancelled],
  [OrderStatus.QualityCheck]: [OrderStatus.OutForDelivery, OrderStatus.Disputed, OrderStatus.PendingCapacity, OrderStatus.Reassigned],
  [OrderStatus.OutForDelivery]: [OrderStatus.Delivered, OrderStatus.Disputed],
  [OrderStatus.Delivered]: [OrderStatus.Completed, OrderStatus.Disputed],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.Reassigned]: [OrderStatus.AutoMatching, OrderStatus.PendingCapacity, OrderStatus.Assigned, OrderStatus.Cancelled],
  [OrderStatus.Disputed]: [OrderStatus.InProcessing, OrderStatus.OutForDelivery, OrderStatus.Completed, OrderStatus.Cancelled],
};

export const terminalOrderStatuses = new Set<OrderStatus>([
  OrderStatus.Completed,
  OrderStatus.Cancelled,
]);

export const isTerminalOrderStatus = (status: OrderStatus) => {
  return terminalOrderStatuses.has(status);
};

export const canTransitionOrderStatus = (current: OrderStatus, next: OrderStatus) => {
  return orderTransitionMap[current].includes(next);
};

export const getOrderProgressPercent = (status: OrderStatus) => {
  return orderStatusProgressPercent[status];
};
