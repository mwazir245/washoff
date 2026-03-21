import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminMatchingDetailsDrawer from "@/features/admin/components/AdminMatchingDetailsDrawer";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import { useAdminMatching, type MatchingTransparencyOrder } from "@/features/admin/hooks/useAdminOperations";
import {
  formatAdminDateTime,
  formatAdminNumber,
} from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import { OrderStatus } from "@/features/orders/model";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";

const PAGE_SIZE = 20;

const AdminMatchingPage = () => {
  const { language } = usePlatformLanguage();
  const matchingQuery = useAdminMatching();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<MatchingTransparencyOrder | undefined>();

  const providerOptions = useMemo(() => {
    const providerMap = new Map<string, string>();

    for (const order of matchingQuery.data ?? []) {
      if (order.selectedProvider) {
        providerMap.set(order.selectedProvider.providerId, order.selectedProvider.providerName);
      }
    }

    return Array.from(providerMap.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "ar"));
  }, [matchingQuery.data]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return (matchingQuery.data ?? []).filter((order) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [
              order.orderId,
              order.hotelName,
              order.currentProviderName ?? "",
              order.selectedProvider?.providerName ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" ? true : order.currentStatus === statusFilter;
      const matchesProvider =
        selectedProviderFilter === "all"
          ? true
          : order.selectedProvider?.providerId === selectedProviderFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [matchingQuery.data, searchQuery, selectedProviderFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredOrders],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProviderFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const columns: DataTableColumn<MatchingTransparencyOrder>[] = [
    {
      key: "order",
      header: language === "en" ? "Order" : "الطلب",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{order.orderId}</p>
          <p className="text-xs leading-6 text-muted-foreground">{order.hotelName}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: language === "en" ? "Status" : "الحالة",
      cell: (order) => <OrderStatusBadge status={order.currentStatus} />,
    },
    {
      key: "selected",
      header: language === "en" ? "Selected provider" : "المزوّد المختار",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            {order.selectedProvider?.providerName ??
              (language === "en" ? "No final choice yet" : "لا يوجد اختيار نهائي بعد")}
          </p>
          {order.selectedProvider ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{order.selectedProvider.decisionLabel}</Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {formatAdminNumber(Math.round(order.selectedProvider.totalScore), language)} / 100
              </span>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "current",
      header: language === "en" ? "Current provider" : "المزوّد الحالي",
      cell: (order) => (
        <p className="font-semibold text-foreground">
          {order.currentProviderName ?? (language === "en" ? "Pending provider" : "بانتظار مزوّد")}
        </p>
      ),
    },
    {
      key: "runs",
      header: language === "en" ? "Matching runs" : "جولات المطابقة",
      cell: (order) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{formatAdminNumber(order.matchingRuns, language)}</p>
          <p className="text-xs leading-6 text-muted-foreground">
            {language === "en"
              ? `${formatAdminNumber(order.reassignmentCount, language)} reassignments`
              : `${formatAdminNumber(order.reassignmentCount, language)} إعادات إسناد`}
          </p>
        </div>
      ),
    },
    {
      key: "created",
      header: language === "en" ? "Created at" : "تاريخ الإنشاء",
      cell: (order) => (
        <p className="whitespace-nowrap text-sm text-muted-foreground">
          {formatAdminDateTime(order.createdAt, language)}
        </p>
      ),
    },
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedProviderFilter("all");
  };

  if (matchingQuery.isError) {
    return (
      <AdminWorkspaceLayout
        title={language === "en" ? "Matching" : "المطابقة"}
        subtitle={language === "en" ? "Unable to load matching transparency." : "تعذر تحميل شفافية المطابقة."}
        eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load matching data" : "تعذر تحميل بيانات المطابقة"}
          description={
            matchingQuery.error instanceof Error
              ? matchingQuery.error.message
              : language === "en"
                ? "An unexpected error occurred while loading matching results."
                : "حدث خطأ غير متوقع أثناء تحميل نتائج المطابقة."
          }
          action={<Button onClick={() => void matchingQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={language === "en" ? "Matching" : "المطابقة"}
      subtitle={
        language === "en"
          ? "Compact matching list for large volumes, with details available on row click."
          : "قائمة مطابقة مضغوطة للأحجام الكبيرة، مع تفاصيل كاملة عند فتح الطلب."
      }
      eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "This page changes presentation only. Matching calculations, assignment, and reassignment behavior are unchanged."
            : "هذه الصفحة تغيّر طريقة العرض فقط. حسابات المطابقة والإسناد وإعادة الإسناد بقيت كما هي دون أي تعديل."
        }
      />

      <FiltersBar
        title={language === "en" ? "Review matching results" : "مراجعة نتائج المطابقة"}
        description={
          language === "en"
            ? "Scan orders quickly, then open the selected row to inspect full matching transparency."
            : "راجع الطلبات بسرعة من القائمة، ثم افتح الصف المطلوب لرؤية شفافية المطابقة الكاملة."
        }
        summary={
          language === "en"
            ? `${formatAdminNumber(filteredOrders.length, language)} matching records`
            : `${formatAdminNumber(filteredOrders.length, language)} سجل مطابقة`
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
              placeholder={language === "en" ? "Order, hotel, or provider" : "الطلب أو الفندق أو المزوّد"}
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
                  {language === "en" ? status : getOrderStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {language === "en" ? "Selected provider" : "المزوّد المختار"}
          </label>
          <Select value={selectedProviderFilter} onValueChange={setSelectedProviderFilter}>
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "All selected providers" : "كل المزوّدين المختارين"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "en" ? "All selected providers" : "كل المزوّدين المختارين"}
              </SelectItem>
              {providerOptions.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-[1.2rem] border border-border/70 bg-muted/20 px-4 py-4">
          <div className="flex items-start gap-3">
            <SlidersHorizontal className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {language === "en" ? "Operational review mode" : "وضع المراجعة التشغيلية"}
              </p>
              <p className="text-xs leading-6 text-muted-foreground">
                {language === "en"
                  ? "Rows stay compact by default; open any row to inspect full selected, shortlisted, and excluded providers."
                  : "الصفوف تبقى مضغوطة افتراضيًا؛ افتح أي صف لرؤية المزوّد المختار والقائمة القصيرة والاستبعادات كاملة."}
              </p>
            </div>
          </div>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={columns}
          rows={paginatedOrders}
          getRowKey={(order) => order.orderId}
          onRowClick={(order) => setSelectedOrder(order)}
          emptyState={
            <EmptyState
              title={language === "en" ? "No matching records found" : "لا توجد سجلات مطابقة"}
              description={
                language === "en"
                  ? "Try using broader filters or clearing the current provider selection."
                  : "جرّب توسيع البحث أو إلغاء الفلاتر الحالية لرؤية سجلات أكثر."
              }
            />
          }
        />

        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </section>

      <AdminMatchingDetailsDrawer
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

const getOrderStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Submitted:
      return "تم الإرسال";
    case OrderStatus.AutoMatching:
      return "المطابقة التلقائية";
    case OrderStatus.PendingCapacity:
      return "بانتظار السعة";
    case OrderStatus.Assigned:
      return "تم التعيين";
    case OrderStatus.Accepted:
      return "مقبول";
    case OrderStatus.PickupScheduled:
      return "تمت جدولة الاستلام";
    case OrderStatus.PickedUp:
      return "تم الاستلام";
    case OrderStatus.InProcessing:
      return "قيد المعالجة";
    case OrderStatus.QualityCheck:
      return "فحص الجودة";
    case OrderStatus.OutForDelivery:
      return "خرج للتسليم";
    case OrderStatus.Delivered:
      return "تم التسليم";
    case OrderStatus.Completed:
      return "مكتمل";
    case OrderStatus.Cancelled:
      return "ملغي";
    case OrderStatus.Reassigned:
      return "إعادة إسناد";
    case OrderStatus.Disputed:
      return "نزاع";
  }
};

export default AdminMatchingPage;
