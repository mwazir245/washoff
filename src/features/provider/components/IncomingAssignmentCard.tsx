import { ArrowLeftRight, CalendarClock, Package2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/shared/components/feedback/CountdownTimer";
import {
  getOrderQuantityTotal,
  getOrderServiceNames,
  type LaundryOrder,
} from "@/features/orders/model/order";
import { formatDateTimeLabel, formatSar } from "@/shared/lib/formatters";

interface IncomingAssignmentCardProps {
  order: LaundryOrder;
  isPending?: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingAssignmentCard = ({
  order,
  isPending = false,
  onAccept,
  onReject,
}: IncomingAssignmentCardProps) => {
  const minutesLeft = order.activeAssignment?.responseDueAt
    ? Math.max(Math.ceil((new Date(order.activeAssignment.responseDueAt).getTime() - Date.now()) / (1000 * 60)), 0)
    : 0;
  const latestReassignmentEvent = order.reassignmentEvents
    .slice()
    .reverse()
    .find((event) => event.nextProviderId === order.providerId);
  const reassignmentAttempt = order.activeAssignment?.attemptNumber ?? 1;

  return (
    <article className="surface-card overflow-hidden">
      <div className="border-b border-border/70 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="section-kicker">طلب وارد</span>
              {reassignmentAttempt > 1 ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {`محاولة إسناد ${reassignmentAttempt}`}
                </span>
              ) : null}
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{order.id}</p>
              <p className="mt-1 text-sm text-muted-foreground">{order.hotelSnapshot.displayName.ar}</p>
            </div>
          </div>

          {minutesLeft > 0 ? <CountdownTimer totalMinutes={minutesLeft} /> : null}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {latestReassignmentEvent?.notesAr ? (
          <div className="rounded-[1.2rem] border border-warning/20 bg-warning/10 px-4 py-4 text-sm leading-7 text-foreground">
            {latestReassignmentEvent.notesAr}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="info-panel px-4 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Store className="h-4 w-4" />
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">الفندق</p>
            </div>
            <p className="mt-2 font-semibold text-foreground">{order.hotelSnapshot.displayName.ar}</p>
          </div>

          <div className="info-panel px-4 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Package2 className="h-4 w-4" />
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">الخدمات</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{getOrderServiceNames(order).join("، ")}</p>
          </div>

          <div className="info-panel px-4 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Package2 className="h-4 w-4" />
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">الكمية</p>
            </div>
            <p className="mt-2 font-semibold text-foreground">{getOrderQuantityTotal(order)} قطعة</p>
          </div>

          <div className="info-panel px-4 py-4">
            <div className="flex items-center gap-2 text-primary">
              <CalendarClock className="h-4 w-4" />
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">مهلة الرد</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {order.activeAssignment?.responseDueAt
                ? formatDateTimeLabel(order.activeAssignment.responseDueAt)
                : "لا توجد مهلة حالية"}
            </p>
          </div>
        </div>

        <div className="accent-panel flex items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">القيمة التقديرية</p>
            <p className="mt-1 text-lg font-bold text-foreground">{formatSar(order.estimatedSubtotalSar)}</p>
          </div>
          <div className="text-left text-xs leading-6 text-muted-foreground">
            يتم تثبيت السعة للمزود عند القبول النهائي
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="flex-1 min-w-[160px]" disabled={isPending} onClick={onAccept}>
            قبول الإسناد
          </Button>
          <Button className="flex-1 min-w-[160px]" variant="outline" disabled={isPending} onClick={onReject}>
            رفض وتحويل للبديل
          </Button>
        </div>
      </div>
    </article>
  );
};

export default IncomingAssignmentCard;
