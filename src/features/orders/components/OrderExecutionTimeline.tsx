import { CheckCircle2, Circle, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { orderExecutionLifecycleSequence, OrderStatus } from "@/features/orders/model";
import type { LaundryOrder, OrderStatusHistoryEntry } from "@/features/orders/model/order";
import { getOrderStatusMeta } from "@/features/orders/model/order-status";
import { formatDateTimeLabel } from "@/shared/lib/formatters";

type TimelineVariant = "execution" | "hotel";

interface OrderExecutionTimelineProps {
  order: LaundryOrder;
  compact?: boolean;
  className?: string;
  variant?: TimelineVariant;
}

const hotelLifecycleSequence: OrderStatus[] = [
  OrderStatus.Submitted,
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

const buildStatusHistoryMap = (statusHistory?: OrderStatusHistoryEntry[]) => {
  const map = new Map<OrderStatus, OrderStatusHistoryEntry>();

  for (const entry of statusHistory ?? []) {
    map.set(entry.toStatus, entry);
  }

  return map;
};

const getTimelineStatuses = (variant: TimelineVariant) => {
  if (variant === "hotel") {
    return hotelLifecycleSequence;
  }

  return orderExecutionLifecycleSequence.filter(
    (status) =>
      ![OrderStatus.Cancelled, OrderStatus.Disputed, OrderStatus.PendingCapacity, OrderStatus.Reassigned].includes(
        status,
      ),
  );
};

const getStepState = ({
  order,
  status,
  index,
  statuses,
  historyByStatus,
}: {
  order: LaundryOrder;
  status: OrderStatus;
  index: number;
  statuses: OrderStatus[];
  historyByStatus: Map<OrderStatus, OrderStatusHistoryEntry>;
}) => {
  if (order.status === status) {
    return "current" as const;
  }

  if (historyByStatus.has(status)) {
    return "completed" as const;
  }

  const currentIndex = statuses.indexOf(order.status);

  if (currentIndex >= index && currentIndex !== -1) {
    return "completed" as const;
  }

  return "upcoming" as const;
};

const OrderExecutionTimeline = ({
  order,
  compact = false,
  className,
  variant = "execution",
}: OrderExecutionTimelineProps) => {
  const statuses = getTimelineStatuses(variant);
  const currentIndex = statuses.indexOf(order.status);
  const historyByStatus = buildStatusHistoryMap(order.statusHistory);

  if (currentIndex === -1 && historyByStatus.size === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4 rounded-[1.5rem] border border-border/70 bg-white/85 px-4 py-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {variant === "hotel" ? "تسلسل الطلب" : "مسار التنفيذ"}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentIndex >= 0
              ? `آخر تحديث على الطلب: ${getOrderStatusMeta(order.status).label}`
              : variant === "hotel"
                ? "يتم تحديث هذا التسلسل تلقائيًا مع كل مرحلة يعتمدها النظام أو المزوّد أو الفندق."
                : "سيبدأ المسار التنفيذي بعد قبول المزوّد للطلب."}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className={cn("grid gap-3", compact ? "md:grid-cols-4" : "md:grid-cols-3 xl:grid-cols-4")}>
        {statuses.map((status, index) => {
          const stepMeta = getOrderStatusMeta(status);
          const stepState = getStepState({
            order,
            status,
            index,
            statuses,
            historyByStatus,
          });
          const historyEntry = historyByStatus.get(status);

          return (
            <div
              key={status}
              className={cn(
                "rounded-[1.25rem] border px-3 py-3 transition-colors",
                stepState === "completed" && "border-primary/20 bg-primary/5",
                stepState === "current" && "border-primary bg-primary/10 shadow-sm",
                stepState === "upcoming" && "border-border/70 bg-background/70",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                    stepState === "completed" && "border-primary bg-primary text-primary-foreground",
                    stepState === "current" && "border-primary bg-white text-primary",
                    stepState === "upcoming" && "border-border bg-white text-muted-foreground",
                  )}
                >
                  {stepState === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : stepState === "current" ? (
                    <Dot className="h-5 w-5" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{stepMeta.label}</p>
                  {historyEntry ? (
                    <p className="text-xs leading-5 text-muted-foreground">{formatDateTimeLabel(historyEntry.changedAt)}</p>
                  ) : (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {stepState === "upcoming" ? "بانتظار الوصول إلى هذه المرحلة" : "قيد التنفيذ الآن"}
                    </p>
                  )}
                  {!compact && historyEntry?.notesAr ? (
                    <p className="text-xs leading-5 text-muted-foreground">{historyEntry.notesAr}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderExecutionTimeline;
