import { useState } from "react";
import { ArrowLeftRight, CheckCircle, Clock3, DollarSign, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import HotelOrderForm from "@/features/hotel/components/HotelOrderForm";
import OrderSubmissionNotice from "@/features/hotel/components/OrderSubmissionNotice";
import {
  useConfirmHotelOrderCompletionMutation,
  useCreateHotelOrderMutation,
  useHotelDashboard,
} from "@/features/hotel/hooks/useHotelDashboard";
import OrderExecutionTimeline from "@/features/orders/components/OrderExecutionTimeline";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { MatchingDecision, OrderStatus } from "@/features/orders/model";
import { getOrderQuantityTotal, type LaundryOrder } from "@/features/orders/model/order";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import MetricCard from "@/shared/components/metrics/MetricCard";
import { DashboardLayout } from "@/shared/layout/DashboardLayout";
import { formatDateLabel, formatDateTimeLabel, formatSar } from "@/shared/lib/formatters";
import { toast } from "@/hooks/use-toast";

const metricIcons = [Package, Clock3, CheckCircle, DollarSign] as const;
const trackedExecutionStatuses = new Set([
  OrderStatus.Accepted,
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
  OrderStatus.Delivered,
  OrderStatus.Completed,
]);

const getOrderProviderSummary = (order: LaundryOrder) => {
  const latestReassignmentEvent = order.reassignmentEvents.slice(-1)[0];

  if (order.providerSnapshot) {
    return {
      primary: order.providerSnapshot.displayName.ar,
      secondary:
        (order.activeAssignment?.attemptNumber ?? 1) > 1
          ? `أعيد إسناد الطلب في المحاولة ${order.activeAssignment?.attemptNumber} وبانتظار رد المزوّد حتى ${
              order.activeAssignment?.responseDueAt ? formatDateTimeLabel(order.activeAssignment.responseDueAt) : "الآن"
            }`
          : order.activeAssignment?.responseDueAt
            ? `بانتظار رد المزوّد حتى ${formatDateTimeLabel(order.activeAssignment.responseDueAt)}`
            : undefined,
    };
  }

  const blockingReasons = Array.from(
    new Set(
      order.matchingLogs.flatMap((log) =>
        log.decision === MatchingDecision.Skipped ? log.eligibilityResult.blockingReasonsAr : [],
      ),
    ),
  );

  if (order.status === OrderStatus.AutoMatching && blockingReasons.length > 0) {
    return {
      primary: "قيد المطابقة التشغيلية",
      secondary: blockingReasons[0],
    };
  }

  if (order.status === OrderStatus.PendingCapacity || order.status === OrderStatus.Reassigned) {
    return {
      primary: "بانتظار توفر مزود مؤهل",
      secondary:
        latestReassignmentEvent?.notesAr ??
        "تعذر تثبيت مزود بديل حتى الآن، ويستمر الطلب في قائمة الانتظار التشغيلية.",
    };
  }

  return {
    primary: "قيد المطابقة التلقائية",
    secondary: undefined,
  };
};

const HotelDashboardPage = () => {
  const dashboardQuery = useHotelDashboard();
  const createOrderMutation = useCreateHotelOrderMutation();
  const confirmCompletionMutation = useConfirmHotelOrderCompletionMutation();
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [recentlySubmittedOrder, setRecentlySubmittedOrder] = useState<LaundryOrder | null>(null);
  const [completionOrderId, setCompletionOrderId] = useState<string | null>(null);

  if (dashboardQuery.isError) {
    return (
      <DashboardLayout title="لوحة الفندق" subtitle="تعذر تحميل البيانات التشغيلية الخاصة بالفندق." eyebrow="واجهة الفندق">
        <EmptyState
          title="تعذر تحميل لوحة الفندق"
          description={
            dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : "حدث خطأ أثناء جلب بيانات الفندق. يمكنك إعادة المحاولة الآن."
          }
          action={<Button onClick={() => void dashboardQuery.refetch()}>إعادة المحاولة</Button>}
        />
      </DashboardLayout>
    );
  }

  if (dashboardQuery.isLoading || !dashboardQuery.data) {
    return (
      <DashboardLayout
        title="لوحة الفندق"
        subtitle="جارٍ تحميل البيانات التشغيلية الخاصة بالفندق."
        eyebrow="واجهة الفندق"
      >
        <div className="surface-card px-6 py-6 text-sm text-muted-foreground">
          يتم تجهيز بيانات الفندق وربطها بلوحة المؤشرات الحالية.
        </div>
      </DashboardLayout>
    );
  }

  const { city, hotelName, metrics, recentOrders, serviceCatalog } = dashboardQuery.data;
  const displayedRecentOrder = recentlySubmittedOrder
    ? recentOrders.find((order) => order.id === recentlySubmittedOrder.id) ?? recentlySubmittedOrder
    : null;

  const executionOrders = recentOrders.filter((order) => trackedExecutionStatuses.has(order.status)).slice(0, 4);

  const assignedOrdersCount = recentOrders.filter((order) => Boolean(order.providerId)).length;
  const unresolvedOrdersCount = recentOrders.filter(
    (order) => order.status === OrderStatus.PendingCapacity || order.status === OrderStatus.AutoMatching,
  ).length;

  const handleOpenOrderForm = () => {
    createOrderMutation.reset();
    setShowNewOrderForm(true);
  };

  const handleCloseOrderForm = () => {
    createOrderMutation.reset();
    setShowNewOrderForm(false);
  };

  const handleOrderSubmit = async (input: {
    serviceIds: string[];
    itemCount: number;
    pickupAt: string;
    notes: string;
  }) => {
    const newOrder = await createOrderMutation.mutateAsync(input);
    setRecentlySubmittedOrder(newOrder);
    setShowNewOrderForm(false);
  };

  const handleConfirmCompletion = async (orderId: string) => {
    try {
      setCompletionOrderId(orderId);
      await confirmCompletionMutation.mutateAsync(orderId);
      toast({
        title: "تم تأكيد اكتمال الطلب",
        description: "أُغلق الطلب نهائيًا بعد تأكيد الفندق لوصول الخدمة واكتمال التنفيذ.",
      });
    } catch (error) {
      toast({
        title: "تعذر تأكيد اكتمال الطلب",
        description: error instanceof Error ? error.message : "تعذر تحديث الطلب إلى حالة مكتمل حاليًا.",
        variant: "destructive",
      });
    } finally {
      setCompletionOrderId(null);
    }
  };

  return (
    <DashboardLayout
      title="لوحة الفندق"
      subtitle={`${hotelName} - ${city}`}
      eyebrow="واجهة الفندق"
      actions={
        <Button onClick={() => (showNewOrderForm ? handleCloseOrderForm() : handleOpenOrderForm())}>
          <Plus className="h-4 w-4" />
          {showNewOrderForm ? "إغلاق النموذج" : "طلب جديد"}
        </Button>
      }
    >
      <PreviewModeNotice description="تعرض هذه الواجهة دورة الطلب الكاملة من الإنشاء وحتى التنفيذ النهائي والتأكيد. لا يزال الإسناد يتم تلقائيًا بالكامل من دون أي اختيار يدوي للمزوّد." />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card overflow-hidden">
          <div className="hero-band px-6 py-7 text-foreground sm:px-8">
            <p className="text-sm font-semibold tracking-[0.14em] text-primary/70">مركز طلبات الفندق</p>
            <h2 className="mt-3 text-3xl font-bold">أنشئ الطلب، تابع الإسناد، وراقب التنفيذ حتى الاكتمال</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              يدير النظام التخصيص تلقائيًا وفق قواعد الأهلية والسعة، بينما تمنحك اللوحة رؤية واضحة لحالة التنفيذ والخطوة
              الحالية حتى التسليم النهائي.
            </p>
          </div>
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
            <div className="hero-stat-card">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">إجمالي الطلبات الحديثة</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{recentOrders.length}</p>
            </div>
            <div className="hero-stat-card">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">طلبات مع مزود معيّن</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{assignedOrdersCount}</p>
            </div>
            <div className="hero-stat-card">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">طلبات غير محسومة</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{unresolvedOrdersCount}</p>
            </div>
          </div>
        </div>

        <div className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow="تجربة الاستخدام"
            title="رحلة الطلب أوضح وأكثر مباشرة"
            description="أنشئ طلبًا جديدًا أو تابع آخر نتيجة إسناد، ثم راقب التدرج التنفيذي حتى التأكيد النهائي."
          />
          <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
            <div className="accent-panel px-4 py-4">
              تظهر النتيجة مباشرة بعد الإرسال: مزود معيّن، مهلة الرد، أو حالة انتظار السعة مع أسباب التعذر.
            </div>
            <div className="info-panel px-4 py-4">
              بعد قبول المزوّد يتحول الطلب إلى مسار تنفيذي واضح يتيح للفندق متابعة كل مرحلة حتى التسليم ثم التأكيد النهائي.
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[index];
          const value = metric.title === "متوسط الطلب" ? formatSar(Number(metric.value)) : metric.value;

          return <MetricCard key={metric.title} title={metric.title} value={value} icon={<Icon className="h-6 w-6" />} />;
        })}
      </section>

      {displayedRecentOrder ? <OrderSubmissionNotice order={displayedRecentOrder} /> : null}

      {showNewOrderForm ? (
        <section>
          <HotelOrderForm
            services={serviceCatalog}
            isSubmitting={createOrderMutation.isPending}
            errorMessage={createOrderMutation.error instanceof Error ? createOrderMutation.error.message : undefined}
            onCancel={handleCloseOrderForm}
            onSubmit={handleOrderSubmit}
          />
        </section>
      ) : null}

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5 sm:px-8">
          <SectionHeader
            eyebrow="متابعة التنفيذ"
            title="الطلبات الجاري تنفيذها"
            description="تمنح هذه المساحة فريق الفندق رؤية فورية لحالة التنفيذ الحالية، والخطوات المكتملة، ومتى يمكن تأكيد إغلاق الطلب."
          />
        </div>

        {executionOrders.length > 0 ? (
          <div className="divide-y divide-border/70">
            {executionOrders.map((order) => (
              <div key={order.id} className="grid gap-4 px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                      <span>{order.providerSnapshot?.displayName.ar ?? "بانتظار مزود"}</span>
                      <span>{`${order.progressPercent ?? 0}% نسبة التقدم`}</span>
                    </div>
                  </div>

                  {order.status === OrderStatus.Delivered ? (
                    <Button
                      disabled={completionOrderId === order.id}
                      onClick={() => void handleConfirmCompletion(order.id)}
                    >
                      تأكيد اكتمال الطلب
                    </Button>
                  ) : (
                    <div className="info-panel px-3 py-3 text-xs leading-6 text-muted-foreground">
                      {order.status === OrderStatus.Completed
                        ? "أغلق هذا الطلب نهائيًا وتم اعتماده كمكتمل."
                        : "يتم تحديث هذه البطاقة تلقائيًا مع تقدم المزوّد في التنفيذ."}
                    </div>
                  )}
                </div>

                <OrderExecutionTimeline order={order} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 sm:px-8">
            <EmptyState
              title="لا توجد طلبات تنفيذية حاليًا"
              description="ستظهر هنا الطلبات التي تجاوزت مرحلة الإسناد ودخلت فعليًا في دورة التنفيذ حتى التسليم."
            />
          </div>
        )}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5 sm:px-8">
          <SectionHeader
            eyebrow="الطلبات الأخيرة"
            title="سجل الطلبات ومخرجات الإسناد"
            description="تعرض القائمة الحالة الحالية لكل طلب، والمزوّد الحالي أو سبب عدم توفر مزوّد مؤهل، وأي سجل لإعادة الإسناد."
          />
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[1080px]">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>الحالة</th>
                  <th>الكمية</th>
                  <th>المزوّد / نتيجة الإسناد</th>
                  <th>تاريخ الإنشاء</th>
                  <th>السعر التقديري</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const providerSummary = getOrderProviderSummary(order);

                  return (
                    <tr key={order.id}>
                      <td className="font-semibold text-foreground">{order.id}</td>
                      <td>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="text-muted-foreground">{getOrderQuantityTotal(order)} قطعة</td>
                      <td>
                        <div className="space-y-1.5">
                          <p className="font-semibold text-foreground">{providerSummary.primary}</p>
                          {order.reassignmentEvents.length > 0 ? (
                            <p className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                              {`سجل إعادة إسناد: ${order.reassignmentEvents.length}`}
                            </p>
                          ) : null}
                          {providerSummary.secondary ? (
                            <p className="max-w-md text-xs leading-6 text-muted-foreground">{providerSummary.secondary}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="text-muted-foreground">{formatDateLabel(order.createdAt)}</td>
                      <td className="font-semibold text-foreground">{formatSar(order.estimatedSubtotalSar)}</td>
                      <td>
                        {order.status === OrderStatus.Delivered ? (
                          <Button
                            size="sm"
                            disabled={completionOrderId === order.id}
                            onClick={() => void handleConfirmCompletion(order.id)}
                          >
                            تأكيد الاستلام
                          </Button>
                        ) : trackedExecutionStatuses.has(order.status) ? (
                          <span className="text-xs text-muted-foreground">متابعة من القسم أعلاه</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">لا يوجد إجراء</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 sm:px-8">
            <EmptyState
              title="لا توجد طلبات حديثة بعد"
              description="ابدأ بإنشاء أول طلب ليظهر هنا سجل الإسناد، حالة التنفيذ، وأي محاولات إعادة تخصيص مستقبلية."
              action={
                <Button onClick={handleOpenOrderForm}>
                  <Plus className="h-4 w-4" />
                  إنشاء أول طلب
                </Button>
              }
            />
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default HotelDashboardPage;
