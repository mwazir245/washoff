import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LaundryOrder } from "@/features/admin/hooks/useAdminOperations";
import {
  formatAdminCurrency,
  formatAdminDateTime,
  formatAdminNumber,
  getAssignmentStatusLabel,
} from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { AssignmentStatus, reassignmentReasonLabelsAr } from "@/features/orders/model/assignment";
import OrderExecutionTimeline from "@/features/orders/components/OrderExecutionTimeline";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { getOrderStatusMeta } from "@/features/orders/model/order-status";
import DetailsDrawer from "@/shared/components/data-display/DetailsDrawer";

interface AdminOrderDetailsDrawerProps {
  order?: LaundryOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const assignmentBadgeVariant = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.Accepted:
      return "default" as const;
    case AssignmentStatus.Rejected:
    case AssignmentStatus.Expired:
      return "destructive" as const;
    case AssignmentStatus.PendingAcceptance:
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const AdminOrderDetailsDrawer = ({ order, open, onOpenChange }: AdminOrderDetailsDrawerProps) => {
  const { language } = usePlatformLanguage();

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={order ? (language === "en" ? `Order ${order.id}` : `تفاصيل الطلب ${order.id}`) : ""}
      description={
        order
          ? language === "en"
            ? "Operational detail view for the selected order."
            : "عرض تشغيلي كامل للطلب المحدد، من الحالة الحالية حتى السجل التنفيذي."
          : undefined
      }
    >
      {order ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Status" : "الحالة"}
              </p>
              <div className="mt-3">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Hotel" : "الفندق"}
              </p>
              <p className="mt-3 font-semibold text-foreground">{order.hotelSnapshot.displayName.ar}</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Provider" : "المزوّد"}
              </p>
              <p className="mt-3 font-semibold text-foreground">
                {order.providerSnapshot?.displayName.ar ??
                  (language === "en" ? "Not assigned yet" : "لم يُسند بعد")}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Estimated total" : "القيمة التقديرية"}
              </p>
              <p className="mt-3 font-semibold text-foreground">
                {formatAdminCurrency(order.estimatedSubtotalSar, language)}
              </p>
            </div>
          </section>

          <section className="surface-card px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-lg font-bold text-foreground">
                  {language === "en" ? "Execution status" : "التقدم التنفيذي"}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {language === "en"
                    ? `The order is currently at ${getOrderStatusMeta(order.status).label}.`
                    : `الطلب الآن في مرحلة ${getOrderStatusMeta(order.status).label}.`}
                </p>
              </div>
              <div className="min-w-[240px] space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{language === "en" ? "Progress" : "نسبة الإنجاز"}</span>
                  <span>{formatAdminNumber(order.progressPercent ?? 0, language)}%</span>
                </div>
                <Progress value={order.progressPercent ?? 0} className="h-2.5" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                  {language === "en" ? "Created at" : "تاريخ الإنشاء"}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatAdminDateTime(order.createdAt, language)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                  {language === "en" ? "Pickup target" : "موعد الاستلام"}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatAdminDateTime(order.pickupAt, language)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                  {language === "en" ? "Items count" : "إجمالي القطع"}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatAdminNumber(order.totalItemCount, language)}
                </p>
              </div>
            </div>
          </section>

          <OrderExecutionTimeline order={order} />

          <section className="surface-card px-5 py-5">
            <p className="text-lg font-bold text-foreground">
              {language === "en" ? "Order items" : "تفاصيل الخدمات"}
            </p>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{item.serviceName.ar}</p>
                    <p className="text-xs leading-6 text-muted-foreground">
                      {language === "en"
                        ? `Quantity ${formatAdminNumber(item.quantity, language)} • ${item.unit}`
                        : `الكمية ${formatAdminNumber(item.quantity, language)} • ${item.unit}`}
                    </p>
                    {item.notesAr ? <p className="text-xs leading-6 text-muted-foreground">{item.notesAr}</p> : null}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatAdminCurrency(item.estimatedLineTotalSar, language)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="surface-card px-5 py-5">
              <p className="text-lg font-bold text-foreground">
                {language === "en" ? "Status history" : "سجل الحالات"}
              </p>
              <div className="mt-4 space-y-3">
                {(order.statusHistory ?? [])
                  .slice()
                  .sort((left, right) => right.changedAt.localeCompare(left.changedAt))
                  .map((entry) => (
                    <div key={entry.id} className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {language === "en"
                            ? entry.actorRole === "admin"
                              ? "Admin"
                              : entry.actorRole === "provider"
                                ? "Provider"
                                : entry.actorRole === "hotel"
                                  ? "Hotel"
                                  : "System"
                            : entry.actorRole === "admin"
                              ? "الإدارة"
                              : entry.actorRole === "provider"
                                ? "المزوّد"
                                : entry.actorRole === "hotel"
                                  ? "الفندق"
                                  : "النظام"}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {getOrderStatusMeta(entry.toStatus).label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        {formatAdminDateTime(entry.changedAt, language)}
                      </p>
                      {entry.notesAr ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{entry.notesAr}</p> : null}
                    </div>
                  ))}
              </div>
            </div>

            <div className="surface-card px-5 py-5">
              <p className="text-lg font-bold text-foreground">
                {language === "en" ? "Assignment history" : "سجل الإسناد"}
              </p>
              <div className="mt-4 space-y-3">
                {(order.assignmentHistory ?? [])
                  .slice()
                  .sort((left, right) => right.changedAt.localeCompare(left.changedAt))
                  .map((entry) => (
                    <div key={entry.id} className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={assignmentBadgeVariant(entry.toStatus)}>
                          {getAssignmentStatusLabel(entry.toStatus, language)}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {language === "en"
                            ? `Attempt ${formatAdminNumber(entry.attemptNumber, language)}`
                            : `المحاولة ${formatAdminNumber(entry.attemptNumber, language)}`}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        {formatAdminDateTime(entry.changedAt, language)}
                      </p>
                      {entry.reasonAr ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{entry.reasonAr}</p> : null}
                    </div>
                  ))}
              </div>

              {order.reassignmentEvents.length > 0 ? (
                <div className="mt-5 space-y-3">
                  <p className="text-lg font-bold text-foreground">
                    {language === "en" ? "Reassignment events" : "أحداث إعادة الإسناد"}
                  </p>
                  {order.reassignmentEvents
                    .slice()
                    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                    .map((event) => (
                      <div key={event.id} className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
                        <p className="font-semibold text-foreground">{reassignmentReasonLabelsAr[event.reason]}</p>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          {formatAdminDateTime(event.createdAt, language)}
                        </p>
                        {event.notesAr ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{event.notesAr}</p> : null}
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </DetailsDrawer>
  );
};

export default AdminOrderDetailsDrawer;
