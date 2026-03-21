import { CheckCircle2, Clock3, RefreshCw, ShieldAlert } from "lucide-react";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { MatchingDecision, OrderStatus } from "@/features/orders/model";
import type { LaundryOrder } from "@/features/orders/model/order";
import { formatDateTimeLabel } from "@/shared/lib/formatters";

interface OrderSubmissionNoticeProps {
  order: LaundryOrder;
}

const OrderSubmissionNotice = ({ order }: OrderSubmissionNoticeProps) => {
  const selectedLog = order.matchingLogs.find((log) => log.decision === MatchingDecision.Selected);
  const blockingReasons = Array.from(
    new Set(
      order.matchingLogs.flatMap((log) =>
        log.decision === MatchingDecision.Skipped ? log.eligibilityResult.blockingReasonsAr : [],
      ),
    ),
  ).slice(0, 3);
  const hasAssignedProvider = Boolean(order.providerSnapshot && order.activeAssignment);
  const isPendingCapacity = order.status === OrderStatus.PendingCapacity;
  const responseDueAt = order.activeAssignment?.responseDueAt ?? order.slaWindow.responseDueAt;
  const topScoreEntries = selectedLog?.scoreBreakdown.entries.slice(0, 4) ?? [];

  const summaryIcon = hasAssignedProvider ? (
    <CheckCircle2 className="h-5 w-5 text-success" />
  ) : isPendingCapacity || blockingReasons.length > 0 ? (
    <ShieldAlert className="h-5 w-5 text-warning" />
  ) : (
    <Clock3 className="h-5 w-5 text-secondary" />
  );

  const summaryTitle = hasAssignedProvider
    ? "تم إسناد الطلب تلقائيًا إلى أفضل مزود متاح"
    : isPendingCapacity
      ? "الطلب محفوظ في قائمة الانتظار التشغيلية"
      : "الطلب مسجل ويجري فحصه ضمن دورة الإسناد";

  const summaryBody = hasAssignedProvider
    ? `اختار محرك المطابقة المزود ${order.providerSnapshot?.displayName.ar} استنادًا إلى الأهلية والسعة والجودة والأداء.`
    : isPendingCapacity
      ? "لم تتوفر سعة أو أهلية كافية لإتمام الإسناد الآن، لذلك تم الاحتفاظ بالطلب مع سجل الأسباب ومحاولات إعادة التخصيص."
      : "تم إدخال الطلب بنجاح، وسيظل تحت متابعة النظام حتى يتم التخصيص أو نقله إلى حالة انتظار السعة.";

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {summaryIcon}
              <span className="section-kicker">
                {hasAssignedProvider ? "نتيجة الإسناد" : "حالة المعالجة"}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{summaryTitle}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{summaryBody}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            {order.reassignmentEvents.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                <RefreshCw className="h-3.5 w-3.5" />
                {`إعادة إسناد ${order.reassignmentEvents.length}`}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:px-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="info-panel px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">رقم الطلب</p>
            <p className="mt-2 text-lg font-bold text-foreground">{order.id}</p>
          </div>

          <div className="info-panel px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">المزود الحالي</p>
            <p className="mt-2 text-lg font-bold text-foreground">
              {order.providerSnapshot?.displayName.ar ?? "بانتظار مزود مؤهل"}
            </p>
          </div>

          <div className="info-panel px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">مهلة الرد</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {responseDueAt ? formatDateTimeLabel(responseDueAt) : "لا توجد مهلة رد حالية"}
            </p>
          </div>

          <div className="info-panel px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">سجل إعادة الإسناد</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {order.reassignmentEvents.length > 0
                ? `${order.reassignmentEvents.length} محاولة مسجلة`
                : "لا توجد إعادة إسناد بعد"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {selectedLog ? (
            <div className="accent-panel">
              <p className="text-sm font-semibold text-foreground">
                مجموع تقييم المزود المختار: {selectedLog.scoreBreakdown.totalScore} / 100
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {topScoreEntries.map((entry) => (
                  <div key={entry.labelAr} className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground">{entry.labelAr}</span>
                      <span className="text-xs font-semibold text-secondary">
                        {Math.round(entry.weightedScore)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      {entry.explanationAr ?? `الدرجة الخام ${Math.round(entry.rawScore)} من 100`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!hasAssignedProvider && blockingReasons.length > 0 ? (
            <div className="rounded-[1.35rem] border border-warning/20 bg-warning/10 p-5">
              <p className="text-sm font-semibold text-foreground">أسباب عدم توفر مزود مؤهل حاليًا</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                {blockingReasons.map((reason) => (
                  <p key={reason}>• {reason}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default OrderSubmissionNotice;
