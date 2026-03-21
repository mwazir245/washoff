import { Badge } from "@/components/ui/badge";
import type { MatchingTransparencyOrder } from "@/features/admin/hooks/useAdminOperations";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { formatAdminDateTime, formatAdminNumber } from "@/features/admin/lib/admin-presentation";
import { MatchingDecision } from "@/features/orders/model";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import DetailsDrawer from "@/shared/components/data-display/DetailsDrawer";

interface AdminMatchingDetailsDrawerProps {
  order?: MatchingTransparencyOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const decisionBadgeVariant = (decision: MatchingDecision) => {
  switch (decision) {
    case MatchingDecision.Selected:
      return "default" as const;
    case MatchingDecision.Shortlisted:
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const AdminMatchingDetailsDrawer = ({ order, open, onOpenChange }: AdminMatchingDetailsDrawerProps) => {
  const { language } = usePlatformLanguage();

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={order ? (language === "en" ? `Matching ${order.orderId}` : `تفاصيل المطابقة ${order.orderId}`) : ""}
      description={
        order
          ? language === "en"
            ? "Complete matching transparency for the selected order."
            : "عرض كامل لشفافية المطابقة والاختيار والاستبعاد للطلب المحدد."
          : undefined
      }
    >
      {order ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Order" : "الطلب"}
              </p>
              <p className="mt-3 font-semibold text-foreground">{order.orderId}</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Hotel" : "الفندق"}
              </p>
              <p className="mt-3 font-semibold text-foreground">{order.hotelName}</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Status" : "الحالة"}
              </p>
              <div className="mt-3">
                <OrderStatusBadge status={order.currentStatus} />
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Created at" : "تاريخ الإنشاء"}
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {formatAdminDateTime(order.createdAt, language)}
              </p>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="surface-card px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Current provider" : "المزوّد الحالي"}
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {order.currentProviderName ?? (language === "en" ? "Waiting for provider" : "بانتظار مزوّد")}
              </p>
            </div>
            <div className="surface-card px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Matching runs" : "جولات المطابقة"}
              </p>
              <p className="mt-2 font-semibold text-foreground">{formatAdminNumber(order.matchingRuns, language)}</p>
            </div>
            <div className="surface-card px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Reassignments" : "إعادات الإسناد"}
              </p>
              <p className="mt-2 font-semibold text-foreground">{formatAdminNumber(order.reassignmentCount, language)}</p>
            </div>
          </section>

          <section className="surface-card px-5 py-5">
            <p className="text-lg font-bold text-foreground">
              {language === "en" ? "Selected provider" : "المزوّد المختار"}
            </p>
            {order.selectedProvider ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.2rem] border border-primary/20 bg-primary/5 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-foreground">{order.selectedProvider.providerName}</p>
                    <Badge variant={decisionBadgeVariant(order.selectedProvider.decision)}>
                      {order.selectedProvider.decisionLabel}
                    </Badge>
                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary">
                      {formatAdminNumber(Math.round(order.selectedProvider.totalScore), language)} / 100
                    </span>
                  </div>
                  {order.selectedProvider.notesAr ? (
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{order.selectedProvider.notesAr}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {order.selectedProvider.scoreEntries.map((entry) => (
                    <div key={entry.labelAr} className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{entry.labelAr}</p>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {formatAdminNumber(Math.round(entry.weightedScore), language)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        {entry.explanationAr ??
                          (language === "en"
                            ? `Raw score ${formatAdminNumber(Math.round(entry.rawScore), language)}`
                            : `الدرجة الخام ${formatAdminNumber(Math.round(entry.rawScore), language)}`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4 text-sm leading-7 text-muted-foreground">
                {language === "en"
                  ? "No final selected provider is recorded for this order yet."
                  : "لا يوجد مزوّد نهائي مختار مسجل لهذا الطلب حتى الآن."}
              </div>
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="surface-card px-5 py-5">
              <p className="text-lg font-bold text-foreground">
                {language === "en" ? "Shortlisted providers" : "المزوّدون المؤهلون"}
              </p>
              <div className="mt-4 space-y-3">
                {order.shortlistedProviders.length > 0 ? (
                  order.shortlistedProviders.map((entry) => (
                    <div key={entry.providerId} className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{entry.providerName}</p>
                        <Badge variant={decisionBadgeVariant(entry.decision)}>{entry.decisionLabel}</Badge>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {formatAdminNumber(Math.round(entry.totalScore), language)} / 100
                        </span>
                      </div>
                      {entry.notesAr ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{entry.notesAr}</p> : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4 text-sm leading-7 text-muted-foreground">
                    {language === "en"
                      ? "No shortlisted providers were kept in the current matching record."
                      : "لا توجد قائمة قصيرة محفوظة في سجل المطابقة الحالي."}
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card px-5 py-5">
              <p className="text-lg font-bold text-foreground">
                {language === "en" ? "Excluded providers" : "المزوّدون المستبعدون"}
              </p>
              <div className="mt-4 space-y-3">
                {order.excludedProviders.length > 0 ? (
                  order.excludedProviders.map((entry) => (
                    <div key={entry.providerId} className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{entry.providerName}</p>
                        <Badge variant={decisionBadgeVariant(entry.decision)}>{entry.decisionLabel}</Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-xs leading-6 text-muted-foreground">
                        {entry.blockingReasonsAr.length > 0 ? (
                          entry.blockingReasonsAr.map((reason) => <p key={reason}>• {reason}</p>)
                        ) : (
                          <p>
                            {language === "en"
                              ? "No exclusion notes were recorded."
                              : "لا توجد ملاحظات استبعاد مسجلة."}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4 text-sm leading-7 text-muted-foreground">
                    {language === "en"
                      ? "No excluded providers were recorded for this order."
                      : "لم تسجل حالات استبعاد لهذا الطلب."}
                  </div>
                )}
              </div>
            </div>
          </section>

          {order.unresolvedNotesAr ? (
            <section className="rounded-[1.35rem] border border-warning/30 bg-warning/10 px-5 py-5">
              <p className="text-sm font-semibold text-foreground">
                {language === "en" ? "Operational note" : "ملاحظة تشغيلية"}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{order.unresolvedNotesAr}</p>
            </section>
          ) : null}
        </>
      ) : null}
    </DetailsDrawer>
  );
};

export default AdminMatchingDetailsDrawer;
