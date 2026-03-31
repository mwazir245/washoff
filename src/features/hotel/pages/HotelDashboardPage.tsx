import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Package, Search, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HotelOrderDetailsDrawer from "@/features/hotel/components/HotelOrderDetailsDrawer";
import HotelOrderForm from "@/features/hotel/components/HotelOrderForm";
import {
  useConfirmHotelOrderCompletionMutation,
  useCreateHotelOrderMutation,
  useHotelDashboard,
} from "@/features/hotel/hooks/useHotelDashboard";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { OrderStatus } from "@/features/orders/model";
import { getOrderQuantityTotal, type LaundryOrder } from "@/features/orders/model/order";
import { getOrderStatusMeta } from "@/features/orders/model/order-status";
import { toast } from "@/hooks/use-toast";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import { appRoutes } from "@/shared/config/navigation";
import { DashboardLayout } from "@/shared/layout/DashboardLayout";
import { formatDateTimeLabel } from "@/shared/lib/formatters";

const PAGE_SIZE = 12;

const providerPickupPendingStatuses = new Set([OrderStatus.Accepted, OrderStatus.PickupScheduled]);
const inExecutionStatuses = new Set([
  OrderStatus.Accepted,
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
]);

const isToday = (value: string) => {
  const currentDate = new Date();
  const candidateDate = new Date(value);

  return (
    currentDate.getFullYear() === candidateDate.getFullYear() &&
    currentDate.getMonth() === candidateDate.getMonth() &&
    currentDate.getDate() === candidateDate.getDate()
  );
};

const kpiCards = [
  {
    key: "today",
    title: "الطلبات اليوم",
    icon: Package,
  },
  {
    key: "execution",
    title: "قيد التنفيذ",
    icon: Clock3,
  },
  {
    key: "pickupPending",
    title: "بانتظار الاستلام من المزود",
    icon: Truck,
  },
  {
    key: "delivered",
    title: "تم التسليم",
    icon: CheckCircle2,
  },
  {
    key: "completed",
    title: "المكتمل",
    icon: CheckCircle2,
  },
] as const;

const resolveExecutionStageLabel = (order: LaundryOrder) => {
  switch (order.status) {
    case OrderStatus.Submitted:
      return "تم إنشاء الطلب";
    case OrderStatus.AutoMatching:
      return "قيد المطابقة";
    case OrderStatus.Assigned:
      return "تم الإسناد";
    default:
      return getOrderStatusMeta(order.status).label;
  }
};

const buildProviderOptions = (orders: LaundryOrder[]) => {
  const providerMap = new Map<string, string>();

  orders.forEach((order) => {
    if (order.providerId && order.providerSnapshot?.displayName.ar) {
      providerMap.set(order.providerId, order.providerSnapshot.displayName.ar);
    }
  });

  return Array.from(providerMap.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "ar"));
};

const createHotelOrderPayload = (input: {
  roomNumber: string;
  items: Array<{ serviceId: string; quantity: number }>;
  pickupAt: string;
  notes: string;
}) => ({
  roomNumber: input.roomNumber,
  items: input.items,
  pickupAt: input.pickupAt,
  notes: input.notes,
});

const HotelDashboardPage = () => {
  const dashboardQuery = useHotelDashboard();
  const createOrderMutation = useCreateHotelOrderMutation();
  const confirmCompletionMutation = useConfirmHotelOrderCompletionMutation();
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | undefined>();
  const [completionOrderId, setCompletionOrderId] = useState<string | null>(null);
  const dashboardData = dashboardQuery.data;
  const recentOrders = useMemo(() => dashboardData?.recentOrders ?? [], [dashboardData?.recentOrders]);
  const serviceCatalog = useMemo(
    () => dashboardData?.serviceCatalog ?? [],
    [dashboardData?.serviceCatalog],
  );

  const providerOptions = useMemo(() => buildProviderOptions(recentOrders), [recentOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return recentOrders.filter((order) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [
              order.id,
              order.roomNumber ?? "",
              order.providerSnapshot?.displayName.ar ?? "",
              ...order.items.map((item) => item.serviceName.ar),
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      const matchesProvider = providerFilter === "all" ? true : order.providerId === providerFilter;
      const orderDate = order.createdAt.slice(0, 10);
      const matchesDateFrom = dateFrom ? orderDate >= dateFrom : true;
      const matchesDateTo = dateTo ? orderDate <= dateTo : true;

      return matchesSearch && matchesStatus && matchesProvider && matchesDateFrom && matchesDateTo;
    });
  }, [dateFrom, dateTo, providerFilter, recentOrders, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredOrders],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, providerFilter, searchQuery, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      <DashboardLayout title="لوحة الفندق" subtitle="جارٍ تحميل البيانات التشغيلية الخاصة بالفندق." eyebrow="واجهة الفندق">
        <div className="surface-card px-6 py-6 text-sm text-muted-foreground">
          يتم تجهيز لوحة الفندق وربطها بالطلبات التشغيلية الحالية.
        </div>
      </DashboardLayout>
    );
  }

  const { city, hotelName } = dashboardData;

  const hotelKpis = {
    today: recentOrders.filter((order) => isToday(order.createdAt)).length,
    execution: recentOrders.filter((order) => inExecutionStatuses.has(order.status)).length,
    pickupPending: recentOrders.filter((order) => providerPickupPendingStatuses.has(order.status)).length,
    delivered: recentOrders.filter((order) => order.status === OrderStatus.Delivered).length,
    completed: recentOrders.filter((order) => order.status === OrderStatus.Completed).length,
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProviderFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleOrderSubmit = async (input: {
    roomNumber: string;
    items: Array<{ serviceId: string; quantity: number }>;
    pickupAt: string;
    notes: string;
  }) => {
    const order = await createOrderMutation.mutateAsync(createHotelOrderPayload(input));
    setShowNewOrderForm(false);
    setSelectedOrder(order);
    toast({
      title: "تم إنشاء الطلب",
      description: "سجل النظام الطلب وبدأ الإسناد التشغيلي التلقائي مباشرة.",
    });
  };

  const handleConfirmCompletion = async (orderId: string) => {
    try {
      setCompletionOrderId(orderId);
      const completedOrder = await confirmCompletionMutation.mutateAsync(orderId);
      setSelectedOrder(completedOrder);
      toast({
        title: "تم اعتماد اكتمال الطلب",
        description: "تم تأكيد استلام الفندق للطلب وإغلاقه بعد تسليمه للنزيل.",
      });
    } catch (error) {
      toast({
        title: "تعذر اعتماد اكتمال الطلب",
        description: error instanceof Error ? error.message : "تعذر تحديث حالة الطلب حاليًا.",
        variant: "destructive",
      });
    } finally {
      setCompletionOrderId(null);
    }
  };

  const columns: DataTableColumn<LaundryOrder>[] = [
    {
      key: "order",
      header: "رقم الطلب",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{order.id}</p>
          <p className="text-xs leading-6 text-muted-foreground">{getOrderQuantityTotal(order)} قطعة</p>
        </div>
      ),
    },
    {
      key: "room",
      header: "رقم الغرفة",
      cellClassName: "whitespace-nowrap",
      cell: (order) => <span className="font-semibold text-foreground">{order.roomNumber ?? "غير محدد"}</span>,
    },
    {
      key: "status",
      header: "الحالة",
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: "provider",
      header: "المزوّد",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{order.providerSnapshot?.displayName.ar ?? "بانتظار الإسناد"}</p>
          <p className="text-xs leading-6 text-muted-foreground">{order.providerSnapshot?.city ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "created",
      header: "وقت الإنشاء",
      cellClassName: "whitespace-nowrap text-sm text-muted-foreground",
      cell: (order) => formatDateTimeLabel(order.createdAt),
    },
    {
      key: "execution",
      header: "المرحلة التنفيذية",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{resolveExecutionStageLabel(order)}</p>
          <p className="text-xs leading-6 text-muted-foreground">{order.progressPercent ?? 0}% تقدم</p>
        </div>
      ),
    },
    {
      key: "updated",
      header: "آخر تحديث",
      cellClassName: "whitespace-nowrap text-sm text-muted-foreground",
      cell: (order) => formatDateTimeLabel(order.updatedAt),
    },
    {
      key: "action",
      header: "الإجراء",
      cellClassName: "whitespace-nowrap",
      cell: (order) =>
        order.status === OrderStatus.Delivered ? (
          <Button
            size="sm"
            disabled={completionOrderId === order.id}
            onClick={(event) => {
              event.stopPropagation();
              void handleConfirmCompletion(order.id);
            }}
          >
            تم التسليم للنزيل
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedOrder(order);
            }}
          >
            عرض التفاصيل
          </Button>
        ),
    },
  ];

  return (
    <DashboardLayout
      title="لوحة الفندق"
      subtitle={`${hotelName} - ${city}`}
      eyebrow="واجهة الفندق"
      actions={
        <>
          <Button asChild variant="outline">
            <Link to={appRoutes.hotelBilling}>الفواتير</Link>
          </Button>
          <Button onClick={() => setShowNewOrderForm((current) => !current)}>
            {showNewOrderForm ? "إغلاق نموذج الطلب" : "إدخال طلب جديد"}
          </Button>
        </>
      }
    >
      <PreviewModeNotice description="واجهة الفندق أصبحت تشغيلية ومركزة على إدخال الطلبات، تتبع التنفيذ، واستلام الطلبات المكتملة من المزوّد دون أي تفاصيل مطابقة أو مراقبة إدارية." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((metric) => {
          const Icon = metric.icon;
          const value = hotelKpis[metric.key];

          return (
            <div key={metric.key} className="surface-card px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {showNewOrderForm ? (
        <HotelOrderForm
          services={serviceCatalog}
          isSubmitting={createOrderMutation.isPending}
          errorMessage={createOrderMutation.error instanceof Error ? createOrderMutation.error.message : undefined}
          onCancel={() => setShowNewOrderForm(false)}
          onSubmit={handleOrderSubmit}
        />
      ) : null}

      <FiltersBar
        title="إدارة الطلبات"
        description="ابحث في الطلبات حسب رقم الطلب أو رقم الغرفة أو المزوّد، ثم صفِّ النتائج حسب الحالة أو تاريخ الإنشاء."
        summary={`${filteredOrders.length} طلبًا مطابقًا للفلاتر الحالية`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={resetFilters}>
              مسح الفلاتر
            </Button>
            <Button type="button" onClick={() => setShowNewOrderForm(true)}>
              إدخال طلب جديد
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">البحث</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="ps-10"
              placeholder="رقم الطلب أو رقم الغرفة أو المزوّد"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">الحالة</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.values(OrderStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {getOrderStatusMeta(status).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">المزوّد</label>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل المزوّدين" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المزوّدين</SelectItem>
              {providerOptions.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">من تاريخ</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="ps-10" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">إلى تاريخ</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="ps-10" />
          </div>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={columns}
          rows={paginatedOrders}
          getRowKey={(order) => order.id}
          onRowClick={(order) => setSelectedOrder(order)}
          emptyState={
            <EmptyState
              title="لا توجد طلبات مطابقة للفلاتر الحالية"
              description="جرّب توسيع البحث أو إلغاء بعض الفلاتر، أو ابدأ بإدخال طلب جديد من نموذج التشغيل."
              action={
                <Button onClick={() => setShowNewOrderForm(true)}>
                  إدخال طلب جديد
                </Button>
              }
            />
          }
        />

        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </section>

      <HotelOrderDetailsDrawer
        order={selectedOrder}
        services={serviceCatalog}
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(undefined);
          }
        }}
        onConfirmCompletion={handleConfirmCompletion}
        isConfirming={Boolean(selectedOrder && completionOrderId === selectedOrder.id)}
      />
    </DashboardLayout>
  );
};

export default HotelDashboardPage;
