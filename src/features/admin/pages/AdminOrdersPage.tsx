import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import AdminOrderDetailsDrawer from "@/features/admin/components/AdminOrderDetailsDrawer";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import { useAdminOrders, type LaundryOrder } from "@/features/admin/hooks/useAdminOperations";
import {
  formatAdminCurrency,
  formatAdminDateTime,
  formatAdminNumber,
} from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { OrderStatus } from "@/features/orders/model";
import { getOrderStatusMeta } from "@/features/orders/model/order-status";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";

const PAGE_SIZE = 20;

const AdminOrdersPage = () => {
  const { language } = usePlatformLanguage();
  const ordersQuery = useAdminOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | undefined>();

  const providerOptions = useMemo(() => {
    const providerMap = new Map<string, string>();

    for (const order of ordersQuery.data ?? []) {
      if (order.providerId && order.providerSnapshot?.displayName.ar) {
        providerMap.set(order.providerId, order.providerSnapshot.displayName.ar);
      }
    }

    return Array.from(providerMap.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "ar"));
  }, [ordersQuery.data]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return (ordersQuery.data ?? []).filter((order) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [
              order.id,
              order.hotelSnapshot.displayName.ar,
              order.providerSnapshot?.displayName.ar ?? "",
              order.items.map((item) => item.serviceName.ar).join(" "),
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
  }, [dateFrom, dateTo, ordersQuery.data, providerFilter, searchQuery, statusFilter]);

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

  const columns: DataTableColumn<LaundryOrder>[] = [
    {
      key: "order",
      header: language === "en" ? "Order" : "الطلب",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{order.id}</p>
          <p className="text-xs leading-6 text-muted-foreground">{order.hotelSnapshot.displayName.ar}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: language === "en" ? "Status" : "الحالة",
      cell: (order) => (
        <div className="min-w-[180px] space-y-3">
          <OrderStatusBadge status={order.status} />
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{language === "en" ? "Progress" : "التقدم"}</span>
              <span>{formatAdminNumber(order.progressPercent ?? 0, language)}%</span>
            </div>
            <Progress value={order.progressPercent ?? 0} className="h-2" />
          </div>
        </div>
      ),
    },
    {
      key: "provider",
      header: language === "en" ? "Provider" : "المزوّد",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            {order.providerSnapshot?.displayName.ar ??
              (language === "en" ? "Waiting for provider" : "بانتظار مزوّد")}
          </p>
          <p className="text-xs leading-6 text-muted-foreground">
            {language === "en"
              ? `Assignments ${formatAdminNumber(order.assignmentHistory.length, language)}`
              : `محاولات الإسناد ${formatAdminNumber(order.assignmentHistory.length, language)}`}
          </p>
        </div>
      ),
    },
    {
      key: "services",
      header: language === "en" ? "Services" : "الخدمات",
      cell: (order) => (
        <div className="max-w-[260px] space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {order.items
              .slice(0, 2)
              .map((item) => item.serviceName.ar)
              .join("، ")}
            {order.items.length > 2 ? "..." : ""}
          </p>
          <p className="text-xs leading-6 text-muted-foreground">
            {language === "en"
              ? `${formatAdminNumber(order.totalItemCount, language)} items`
              : `${formatAdminNumber(order.totalItemCount, language)} قطعة`}
          </p>
        </div>
      ),
    },
    {
      key: "dates",
      header: language === "en" ? "Dates" : "المواعيد",
      cell: (order) => (
        <div className="space-y-1 text-xs leading-6 text-muted-foreground">
          <p>
            {language === "en"
              ? `Created ${formatAdminDateTime(order.createdAt, language)}`
              : `أُنشئ ${formatAdminDateTime(order.createdAt, language)}`}
          </p>
          <p>
            {language === "en"
              ? `Pickup ${formatAdminDateTime(order.pickupAt, language)}`
              : `الاستلام ${formatAdminDateTime(order.pickupAt, language)}`}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: language === "en" ? "Value" : "القيمة",
      cellClassName: "whitespace-nowrap",
      cell: (order) => (
        <p className="font-semibold text-foreground">{formatAdminCurrency(order.estimatedSubtotalSar, language)}</p>
      ),
    },
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProviderFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  if (ordersQuery.isError) {
    return (
      <AdminWorkspaceLayout
        title={language === "en" ? "Orders" : "الطلبات"}
        subtitle={language === "en" ? "Unable to load admin orders." : "تعذر تحميل قائمة الطلبات الإدارية."}
        eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load orders" : "تعذر تحميل الطلبات"}
          description={
            ordersQuery.error instanceof Error
              ? ordersQuery.error.message
              : language === "en"
                ? "An unexpected error occurred while loading orders."
                : "حدث خطأ غير متوقع أثناء تحميل الطلبات."
          }
          action={<Button onClick={() => void ordersQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={language === "en" ? "Orders" : "الطلبات"}
      subtitle={
        language === "en"
          ? "A scalable operations table for orders, filters, and drill-down details."
          : "جدول تشغيلي قابل للتوسع لعرض الطلبات والفلاتر والتفاصيل الكاملة."
      }
      eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "This page focuses on operational presentation only. Matching, assignment, and lifecycle logic remain unchanged."
            : "هذه الصفحة مخصصة لعرض العمليات فقط. منطق المطابقة والإسناد ودورة التنفيذ بقي كما هو دون تغيير."
        }
      />

      <FiltersBar
        title={language === "en" ? "Filter orders" : "تصفية الطلبات"}
        description={
          language === "en"
            ? "Search by order, hotel, provider, or service name. Filter by status, provider, and creation date."
            : "ابحث بالطلب أو الفندق أو المزوّد أو الخدمة، ثم صفِّ النتائج حسب الحالة والمزوّد وتاريخ الإنشاء."
        }
        summary={
          language === "en"
            ? `${formatAdminNumber(filteredOrders.length, language)} matching orders`
            : `${formatAdminNumber(filteredOrders.length, language)} طلبًا مطابقًا للفلاتر`
        }
        actions={
          <Button type="button" variant="outline" onClick={resetFilters}>
            {language === "en" ? "Clear filters" : "مسح الفلاتر"}
          </Button>
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Search" : "البحث"}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="ps-10"
              placeholder={
                language === "en"
                  ? "Order ID, hotel, provider, or service"
                  : "رقم الطلب أو الفندق أو المزوّد أو الخدمة"
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Status" : "الحالة"}</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "All statuses" : "كل الحالات"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "en" ? "All statuses" : "كل الحالات"}</SelectItem>
              {Object.values(OrderStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {language === "en" ? status : getOrderStatusMeta(status).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Provider" : "المزوّد"}</label>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "All providers" : "كل المزوّدين"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "en" ? "All providers" : "كل المزوّدين"}</SelectItem>
              {providerOptions.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "From date" : "من تاريخ"}</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="ps-10" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "To date" : "إلى تاريخ"}</label>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              title={language === "en" ? "No orders match the current filters" : "لا توجد طلبات مطابقة للفلاتر الحالية"}
              description={
                language === "en"
                  ? "Try broadening the search or clearing one of the filters."
                  : "جرّب توسيع البحث أو إلغاء أحد الفلاتر لرؤية نتائج أكثر."
              }
            />
          }
        />

        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </section>

      <AdminOrderDetailsDrawer
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(undefined);
          }
        }}
      />
    </AdminWorkspaceLayout>
  );
};

export default AdminOrdersPage;
