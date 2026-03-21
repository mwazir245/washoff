import { Badge } from "@/components/ui/badge";
import type {
  MatchingTransparencyEntry,
  MatchingTransparencyOrder,
} from "@/features/admin/hooks/useAdminDashboard";
import { MatchingDecision } from "@/features/orders/model";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import EmptyState from "@/shared/components/feedback/EmptyState";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import { formatDateTimeLabel, formatNumber } from "@/shared/lib/formatters";

interface AdminMatchingTransparencyListProps {
  orders: MatchingTransparencyOrder[];
}

const DecisionBadge = ({ entry }: { entry: MatchingTransparencyEntry }) => {
  const variant =
    entry.decision === MatchingDecision.Selected
      ? "default"
      : entry.decision === MatchingDecision.Shortlisted
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{entry.decisionLabel}</Badge>;
};

const AdminMatchingTransparencyList = ({ orders }: AdminMatchingTransparencyListProps) => {
  if (orders.length === 0) {
    return (
      <div className="surface-card px-6 py-6 sm:px-8">
        <EmptyState
          title="لا توجد بيانات مطابقة متاحة بعد"
          description="ستظهر هنا أسباب اختيار المزودين أو استبعادهم فور وجود طلبات تحتوي على سجلات مطابقة."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {orders.map((order) => (
        <article key={order.orderId} className="surface-card overflow-hidden">
          <div className="border-b border-border/70 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="section-kicker">شفافية المطابقة</span>
                  <OrderStatusBadge status={order.currentStatus} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{order.orderId}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{order.hotelName}</p>
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  أُنشئ في {formatDateTimeLabel(order.createdAt)}
                </p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="info-panel px-4 py-3">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">المزود الحالي</p>
                  <p className="mt-1 font-semibold text-foreground">{order.currentProviderName ?? "بانتظار بديل"}</p>
                </div>
                <div className="info-panel px-4 py-3">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">جولات المطابقة</p>
                  <p className="mt-1 font-semibold text-foreground">{formatNumber(order.matchingRuns)}</p>
                </div>
                <div className="info-panel px-4 py-3">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">إعادات الإسناد</p>
                  <p className="mt-1 font-semibold text-foreground">{formatNumber(order.reassignmentCount)}</p>
                </div>
              </div>
            </div>

            {order.unresolvedNotesAr ? (
              <div className="mt-4 rounded-[1.2rem] border border-warning/20 bg-warning/10 px-4 py-4 text-sm leading-7 text-foreground">
                {order.unresolvedNotesAr}
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 px-6 py-6 sm:px-8 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-4">
              <SectionHeader
                eyebrow="المزود المختار"
                title="سبب الاختيار النهائي"
                description="يعرض هذا القسم نتيجة التقييم للمزود الذي حاز أعلى نقاط نهائية ضمن الشروط المؤهلة."
              />

              {order.selectedProvider ? (
                <div className="space-y-4 accent-panel">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-foreground">{order.selectedProvider.providerName}</p>
                    <DecisionBadge entry={order.selectedProvider} />
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-secondary">
                      {`${formatNumber(order.selectedProvider.totalScore)} / 100`}
                    </span>
                  </div>

                  {order.selectedProvider.notesAr ? (
                    <p className="text-sm leading-7 text-muted-foreground">{order.selectedProvider.notesAr}</p>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    {order.selectedProvider.scoreEntries.map((entry) => (
                      <div key={entry.labelAr} className="rounded-2xl border border-border/80 bg-card px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{entry.labelAr}</p>
                          <span className="text-xs font-semibold text-secondary">
                            {`${formatNumber(Math.round(entry.weightedScore))}`}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          {entry.explanationAr ?? `الدرجة الخام ${formatNumber(Math.round(entry.rawScore))}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="info-panel px-5 py-5 text-sm leading-7 text-muted-foreground">
                  لم يتم اختيار مزود نهائي لهذا الطلب بعد.
                </div>
              )}
            </section>

            <section className="space-y-4">
              <SectionHeader
                eyebrow="قائمة قصيرة"
                title="المزودون المؤهلون"
                description="تظهر هنا البدائل التي اجتازت الأهلية ووصلت إلى قائمة الترشيح."
              />

              <div className="space-y-3">
                {order.shortlistedProviders.length > 0 ? (
                  order.shortlistedProviders.map((entry) => (
                    <div key={entry.providerId} className="info-panel px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{entry.providerName}</p>
                        <DecisionBadge entry={entry} />
                        <span className="text-xs font-semibold text-muted-foreground">
                          {`${formatNumber(entry.totalScore)} / 100`}
                        </span>
                      </div>
                      {entry.notesAr ? (
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">{entry.notesAr}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="info-panel px-4 py-4 text-sm text-muted-foreground">
                    لا توجد مزودات ضمن القائمة القصيرة في السجلات الحالية.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="border-t border-border/70 px-6 py-6 sm:px-8">
            <SectionHeader
              eyebrow="الاستبعاد"
              title="أسباب خروج بعض المزودين من المنافسة"
              description="تعتمد أسباب الاستبعاد على المدينة والخدمات والكمية ووقت الاستلام والسعة المتاحة في وقت المطابقة."
              className="mb-4"
            />

            <div className="grid gap-3 xl:grid-cols-2">
              {order.excludedProviders.length > 0 ? (
                order.excludedProviders.map((entry) => (
                  <div key={entry.providerId} className="info-panel px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{entry.providerName}</p>
                      <DecisionBadge entry={entry} />
                    </div>
                    <div className="mt-3 space-y-1 text-xs leading-6 text-muted-foreground">
                      {entry.blockingReasonsAr.length > 0 ? (
                        entry.blockingReasonsAr.map((reason) => <p key={reason}>• {reason}</p>)
                      ) : (
                        <p>• لا توجد أسباب استبعاد مسجلة.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="info-panel px-4 py-4 text-sm text-muted-foreground">
                  لم تسجل حالات استبعاد لهذا الطلب.
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default AdminMatchingTransparencyList;
