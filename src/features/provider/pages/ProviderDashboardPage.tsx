import { useState } from "react";
import { Activity, Package, ShieldCheck, Star, TrendingUp } from "lucide-react";
import IncomingAssignmentCard from "@/features/provider/components/IncomingAssignmentCard";
import {
  useAcceptIncomingOrderMutation,
  useAdvanceProviderOrderExecutionMutation,
  useProviderDashboard,
  useRejectIncomingOrderMutation,
} from "@/features/provider/hooks/useProviderDashboard";
import type { ProviderExecutionStatus } from "@/features/orders/application/contracts/platform-contracts";
import OrderExecutionTimeline from "@/features/orders/components/OrderExecutionTimeline";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { OrderStatus } from "@/features/orders/model";
import { Button } from "@/components/ui/button";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import CapacityMeter from "@/shared/components/metrics/CapacityMeter";
import MetricCard from "@/shared/components/metrics/MetricCard";
import { DashboardLayout } from "@/shared/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";

const metricIcons = [TrendingUp, Package, Activity, Star] as const;

const providerExecutionActions: Partial<Record<OrderStatus, { label: string; nextStatus: ProviderExecutionStatus }>> = {
  [OrderStatus.Accepted]: {
    label: "جدولة الاستلام",
    nextStatus: OrderStatus.PickupScheduled,
  },
  [OrderStatus.PickupScheduled]: {
    label: "تم الاستلام",
    nextStatus: OrderStatus.PickedUp,
  },
  [OrderStatus.PickedUp]: {
    label: "جارٍ المعالجة",
    nextStatus: OrderStatus.InProcessing,
  },
  [OrderStatus.InProcessing]: {
    label: "فحص الجودة",
    nextStatus: OrderStatus.QualityCheck,
  },
  [OrderStatus.QualityCheck]: {
    label: "خرج للتسليم",
    nextStatus: OrderStatus.OutForDelivery,
  },
  [OrderStatus.OutForDelivery]: {
    label: "تم التسليم",
    nextStatus: OrderStatus.Delivered,
  },
};

const ProviderDashboardPage = () => {
  const dashboardQuery = useProviderDashboard();
  const acceptIncomingOrderMutation = useAcceptIncomingOrderMutation();
  const rejectIncomingOrderMutation = useRejectIncomingOrderMutation();
  const advanceProviderOrderExecutionMutation = useAdvanceProviderOrderExecutionMutation();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  if (dashboardQuery.isError) {
    return (
      <DashboardLayout title="لوحة المزود" subtitle="تعذر تحميل حالة السعة والطلبات الواردة." eyebrow="واجهة المزود">
        <EmptyState
          title="تعذر تحميل لوحة المزود"
          description={
            dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : "حدث خطأ أثناء جلب بيانات المزود. يمكنك إعادة المحاولة الآن."
          }
          action={<Button onClick={() => void dashboardQuery.refetch()}>إعادة المحاولة</Button>}
        />
      </DashboardLayout>
    );
  }

  if (dashboardQuery.isLoading || !dashboardQuery.data) {
    return (
      <DashboardLayout
        title="لوحة المزود"
        subtitle="جارٍ تحميل حالة السعة والطلبات الواردة."
        eyebrow="واجهة المزود"
      >
        <div className="surface-card px-6 py-6 text-sm text-muted-foreground">
          يتم تجهيز بيانات المزود وربطها بدورة الإسناد الحالية.
        </div>
      </DashboardLayout>
    );
  }

  const { activeOrders, capacity, city, incomingOrders, metrics, providerName, rating } = dashboardQuery.data;

  const handleAccept = async (orderId: string) => {
    try {
      setActiveOrderId(orderId);
      await acceptIncomingOrderMutation.mutateAsync(orderId);
      toast({
        title: "تم قبول الطلب",
        description: "أصبح الطلب ضمن قائمة التنفيذ النشط، وتم تثبيت السعة التشغيلية الخاصة به.",
      });
    } catch (error) {
      toast({
        title: "تعذر قبول الطلب",
        description: error instanceof Error ? error.message : "تعذر تحديث حالة الطلب حاليًا.",
        variant: "destructive",
      });
    } finally {
      setActiveOrderId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      setActiveOrderId(orderId);
      const updatedOrder = await rejectIncomingOrderMutation.mutateAsync(orderId);
      toast({
        title: updatedOrder.activeAssignment ? "تمت إعادة الإسناد تلقائيًا" : "تم تسجيل الرفض وتعذر إيجاد بديل فوري",
        description: updatedOrder.activeAssignment
          ? `أعيد توجيه الطلب ${updatedOrder.id} إلى ${updatedOrder.providerSnapshot?.displayName.ar ?? "مزود آخر"}.`
          : "بقي الطلب في قائمة الانتظار التشغيلية حتى يتوفر مزود مؤهل.",
      });
    } catch (error) {
      toast({
        title: "تعذر رفض الطلب",
        description: error instanceof Error ? error.message : "تعذر تحديث حالة الطلب حاليًا.",
        variant: "destructive",
      });
    } finally {
      setActiveOrderId(null);
    }
  };

  const handleAdvanceExecution = async (orderId: string, action: { label: string; nextStatus: ProviderExecutionStatus }) => {
    try {
      setActiveOrderId(orderId);
      const updatedOrder = await advanceProviderOrderExecutionMutation.mutateAsync({
        orderId,
        nextStatus: action.nextStatus,
      });
      toast({
        title: `تم تحديث الحالة إلى ${action.label}`,
        description:
          updatedOrder.status === OrderStatus.Delivered
            ? "تم إنهاء جميع خطوات المزوّد، والطلب الآن بانتظار تأكيد الفندق."
            : "تم حفظ المرحلة الجديدة ومشاركتها مباشرة مع الفندق ولوحة الإدارة.",
      });
    } catch (error) {
      toast({
        title: "تعذر تحديث المرحلة التنفيذية",
        description: error instanceof Error ? error.message : "تعذر حفظ المرحلة التشغيلية الجديدة لهذا الطلب.",
        variant: "destructive",
      });
    } finally {
      setActiveOrderId(null);
    }
  };

  return (
    <DashboardLayout
      title="لوحة المزود"
      subtitle={`${providerName} - ${city}`}
      eyebrow="واجهة المزود"
      actions={
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-semibold text-success">
          <ShieldCheck className="h-4 w-4" />
          وضع تشغيلي مباشر
        </div>
      }
    >
      <PreviewModeNotice description="تعكس هذه الشاشة دورة القبول والرفض والتنفيذ اللاحق حتى التسليم. تم توسيعها لعرض الخطوة التشغيلية التالية بوضوح من دون تغيير منطق الإسناد أو المطابقة." />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-card overflow-hidden">
          <div className="hero-band px-6 py-7 text-foreground sm:px-8">
            <p className="text-sm font-semibold tracking-[0.14em] text-primary/70">إدارة الاستجابة والسعة</p>
            <h2 className="mt-3 text-3xl font-bold">تابع الإسنادات الواردة ونفّذ الطلبات من لوحة واحدة</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              تعرض الواجهة مهلة القبول، وسجل إعادة الإسناد، ثم تحول الطلب المقبول إلى مسار تنفيذي واضح خطوة بخطوة حتى
              التسليم.
            </p>
          </div>
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
            <div className="hero-stat-card">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">طلبات واردة</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{incomingOrders.length}</p>
            </div>
            <div className="hero-stat-card">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">طلبات نشطة</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{activeOrders.length}</p>
            </div>
            <div className="hero-stat-card">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">التقييم الحالي</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{rating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow="السعة اليومية"
            title="مراقبة فورية لاستهلاك الطاقة التشغيلية"
            description="يبقى فريق التنفيذ مطلعًا على السعة المستخدمة والمتبقية طوال دورة الطلب من القبول وحتى الإغلاق."
          />
          <div className="mt-6">
            <CapacityMeter used={capacity.used} total={capacity.total} label="السعة المحجوزة والنشطة" />
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[index];

          return <MetricCard key={metric.title} title={metric.title} value={metric.value} icon={<Icon className="h-6 w-6" />} />;
        })}
      </section>

      <section>
        <SectionHeader
          eyebrow="الإسنادات الواردة"
          title="طلبات بانتظار قرار القبول"
          description="كل بطاقة تعرض ما يحتاجه فريق المزود لاتخاذ قرار سريع: الفندق، الخدمات، القيمة، والمهلة الزمنية."
          className="mb-5"
        />

        {incomingOrders.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {incomingOrders.map((order) => (
              <IncomingAssignmentCard
                key={order.id}
                order={order}
                isPending={activeOrderId === order.id}
                onAccept={() => void handleAccept(order.id)}
                onReject={() => void handleReject(order.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="لا توجد إسنادات جديدة بانتظارك"
            description="ستظهر هنا أي طلبات يتم تعيينها إلى هذا المزود، بما في ذلك محاولات إعادة الإسناد التلقائية."
          />
        )}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5 sm:px-8">
          <SectionHeader
            eyebrow="الطلبات النشطة"
            title="سير التنفيذ الحالي"
            description="بعد القبول ينتقل كل طلب إلى مسار تنفيذي واضح، وتظهر الخطوة التالية مباشرة لتقليل التردد والانتظار."
          />
        </div>

        {activeOrders.length > 0 ? (
          <div className="divide-y divide-border/70">
            {activeOrders.map((order) => {
              const nextAction = providerExecutionActions[order.status];

              return (
                <div key={order.id} className="grid gap-5 px-6 py-5 sm:px-8">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                      {order.reassignmentEvents.length > 0 ? (
                        <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                          {`إعادة إسناد ${order.reassignmentEvents.length}`}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <span>{order.hotelSnapshot.displayName.ar}</span>
                      <span>{`${order.progressPercent ?? 0}% نسبة التقدم`}</span>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_240px] lg:items-start">
                    <OrderExecutionTimeline order={order} compact />

                    <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-4">
                      <div className="space-y-2">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${order.progressPercent ?? 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>التنفيذ الحالي</span>
                          <span>{order.progressPercent ?? 0}%</span>
                        </div>
                      </div>

                      {nextAction ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">الخطوة التالية</p>
                            <p className="text-xs leading-6 text-muted-foreground">{`الإجراء التالي لهذا الطلب هو ${nextAction.label}.`}</p>
                          </div>
                          <Button
                            className="w-full"
                            disabled={activeOrderId === order.id}
                            onClick={() => void handleAdvanceExecution(order.id, nextAction)}
                          >
                            {nextAction.label}
                          </Button>
                        </div>
                      ) : (
                        <div className="info-panel px-3 py-3 text-xs leading-6 text-muted-foreground">
                          {order.status === OrderStatus.Delivered
                            ? "تم إنهاء خطوات التنفيذ من جهة المزوّد، والطلب الآن بانتظار تأكيد الفندق النهائي."
                            : "لا توجد خطوة تنفيذية إضافية مطلوبة من هذه اللوحة حاليًا."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-8 sm:px-8">
            <EmptyState
              title="لا توجد طلبات نشطة حاليًا"
              description="بعد قبول أي طلب وارد ستظهر هنا حالة التنفيذ ونسبة التقدم والخطوة التالية المطلوبة."
              action={<Button variant="outline">بانتظار إسناد جديد</Button>}
            />
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ProviderDashboardPage;
