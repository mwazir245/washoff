import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import {
  useAdminProviderPricing,
  useApproveProviderServicePricingMutation,
  useRejectProviderServicePricingMutation,
} from "@/features/admin/hooks/useAdminOperations";
import {
  formatAdminCurrency,
  formatAdminDateTime,
  formatAdminNumber,
} from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import type { ProviderServicePricingReviewEntry } from "@/features/orders/application";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import DetailsDrawer from "@/shared/components/data-display/DetailsDrawer";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";

const PAGE_SIZE = 20;

const AdminProviderPricingPage = () => {
  const { language } = usePlatformLanguage();
  const pricingQuery = useAdminProviderPricing();
  const approveMutation = useApproveProviderServicePricingMutation();
  const rejectMutation = useRejectProviderServicePricingMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<ProviderServicePricingReviewEntry | undefined>();
  const [rejectionReasonAr, setRejectionReasonAr] = useState("");

  const providerOptions = useMemo(() => {
    const entries = new Map<string, string>();

    for (const review of pricingQuery.data?.pendingReviews ?? []) {
      entries.set(review.providerId, review.providerNameAr);
    }

    return Array.from(entries.entries()).map(([id, label]) => ({ id, label }));
  }, [pricingQuery.data]);

  const productOptions = useMemo(() => {
    const entries = new Map<string, string>();

    for (const review of pricingQuery.data?.pendingReviews ?? []) {
      entries.set(review.productId, review.productNameAr);
    }

    return Array.from(entries.entries()).map(([id, label]) => ({ id, label }));
  }, [pricingQuery.data]);

  const serviceTypeOptions = useMemo(() => {
    const entries = new Map<string, string>();

    for (const review of pricingQuery.data?.pendingReviews ?? []) {
      entries.set(review.serviceType, review.serviceTypeLabelAr);
    }

    return Array.from(entries.entries()).map(([id, label]) => ({ id, label }));
  }, [pricingQuery.data]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return (pricingQuery.data?.pendingReviews ?? []).filter((entry) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [
              entry.providerNameAr,
              entry.productNameAr,
              entry.serviceTypeLabelAr,
              entry.offeringId,
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);

      const matchesProvider = providerFilter === "all" ? true : entry.providerId === providerFilter;
      const matchesServiceType = serviceTypeFilter === "all" ? true : entry.serviceType === serviceTypeFilter;
      const matchesStatus =
        statusFilter === "all" ? true : entry.proposedStatusLabelAr === statusFilter;
      const matchesProduct = productFilter === "all" ? true : entry.productId === productFilter;

      return matchesSearch && matchesProvider && matchesServiceType && matchesStatus && matchesProduct;
    });
  }, [pricingQuery.data, productFilter, providerFilter, searchQuery, serviceTypeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const paginatedReviews = useMemo(
    () => filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredReviews],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [productFilter, providerFilter, searchQuery, serviceTypeFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!selectedEntry) {
      setRejectionReasonAr("");
    }
  }, [selectedEntry]);

  const resetFilters = () => {
    setSearchQuery("");
    setProviderFilter("all");
    setServiceTypeFilter("all");
    setStatusFilter("all");
    setProductFilter("all");
  };

  const handleApprove = async () => {
    if (!selectedEntry) {
      return;
    }

    try {
      await approveMutation.mutateAsync({ offeringId: selectedEntry.offeringId });
      toast({
        title: "تم اعتماد السعر",
        description: "أصبح السعر المقترح هو السعر التشغيلي النشط لهذا المزوّد.",
      });
      setSelectedEntry(undefined);
    } catch (error) {
      toast({
        title: "تعذر اعتماد السعر",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء اعتماد السعر المقترح.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedEntry) {
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        offeringId: selectedEntry.offeringId,
        rejectionReasonAr: rejectionReasonAr.trim() || undefined,
      });
      toast({
        title: "تم رفض السعر المقترح",
        description: "بقي السعر النشط السابق كما هو، وتم حفظ قرار الرفض للمزوّد.",
      });
      setSelectedEntry(undefined);
    } catch (error) {
      toast({
        title: "تعذر رفض السعر",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء رفض السعر المقترح.",
        variant: "destructive",
      });
    }
  };

  const columns: DataTableColumn<ProviderServicePricingReviewEntry>[] = [
    {
      key: "provider",
      header: language === "en" ? "Provider" : "المزوّد",
      cell: (entry) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{entry.providerNameAr}</p>
          <p className="text-xs leading-6 text-muted-foreground">{entry.offeringId}</p>
        </div>
      ),
    },
    {
      key: "service",
      header: language === "en" ? "Service" : "الخدمة",
      cell: (entry) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{entry.productNameAr}</p>
          <p className="text-xs leading-6 text-muted-foreground">{entry.serviceTypeLabelAr}</p>
        </div>
      ),
    },
    {
      key: "prices",
      header: language === "en" ? "Pricing" : "الأسعار",
      cell: (entry) => (
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-foreground">
            المقترح: {formatAdminCurrency(entry.proposedPriceSar, language)}
          </p>
          <p className="text-muted-foreground">
            الحالي:{" "}
            {typeof entry.currentApprovedPriceSar === "number"
              ? formatAdminCurrency(entry.currentApprovedPriceSar, language)
              : "لا يوجد"}
          </p>
          <p className="text-muted-foreground">
            الاسترشادي:{" "}
            {typeof entry.suggestedPriceSar === "number"
              ? formatAdminCurrency(entry.suggestedPriceSar, language)
              : "غير محدد"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: language === "en" ? "Status" : "الحالة",
      cell: (entry) => (
        <div className="space-y-2">
          <Badge variant="secondary">{entry.proposedStatusLabelAr}</Badge>
          <p className="text-xs leading-6 text-muted-foreground">{entry.activeStatusLabelAr}</p>
        </div>
      ),
    },
    {
      key: "submitted",
      header: language === "en" ? "Submitted" : "تاريخ الإرسال",
      cell: (entry) => (
        <p className="whitespace-nowrap text-sm text-muted-foreground">
          {formatAdminDateTime(entry.proposedSubmittedAt, language)}
        </p>
      ),
    },
  ];

  if (pricingQuery.isError) {
    return (
      <AdminWorkspaceLayout
        title={language === "en" ? "Provider pricing" : "اعتماد أسعار المزوّدين"}
        subtitle={language === "en" ? "Unable to load pricing submissions." : "تعذر تحميل طلبات اعتماد الأسعار."}
        eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load provider pricing" : "تعذر تحميل أسعار المزوّدين"}
          description={
            pricingQuery.error instanceof Error
              ? pricingQuery.error.message
              : language === "en"
                ? "An unexpected error occurred while loading pricing submissions."
                : "حدث خطأ غير متوقع أثناء تحميل طلبات اعتماد الأسعار."
          }
          action={
            <Button onClick={() => void pricingQuery.refetch()}>
              {language === "en" ? "Retry" : "إعادة المحاولة"}
            </Button>
          }
        />
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={language === "en" ? "Provider pricing" : "اعتماد أسعار المزوّدين"}
      subtitle={
        language === "en"
          ? "Review proposed provider prices against platform suggestions and current active prices."
          : "راجع الأسعار المقترحة من المزوّدين مقارنة بالسعر الاسترشادي والسعر النشط الحالي."
      }
      eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
    >
      <PreviewModeNotice description="يعرض هذا القسم فقط الأسعار المقترحة بانتظار الاعتماد. لا تؤثر الأسعار المعلقة أو المرفوضة على الفنادق أو المطابقة." />

      <FiltersBar
        title={language === "en" ? "Pending pricing queue" : "طابور الأسعار المعلقة"}
        description={
          language === "en"
            ? "Filter by provider, product, service type, and status before opening the full review drawer."
            : "صفِّ الطلبات حسب المزوّد أو المنتج أو نوع الخدمة أو الحالة، ثم افتح أي صف للمراجعة الكاملة."
        }
        summary={`${formatAdminNumber(filteredReviews.length, language)} طلبًا بانتظار الاعتماد`}
        actions={
          <Button type="button" variant="outline" onClick={resetFilters}>
            مسح الفلاتر
          </Button>
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
              placeholder="المزوّد أو المنتج أو نوع الخدمة"
            />
          </div>
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
          <label className="text-sm font-medium text-foreground">المنتج</label>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل المنتجات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المنتجات</SelectItem>
              {productOptions.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">نوع الخدمة</label>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل أنواع الخدمة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل أنواع الخدمة</SelectItem>
              {serviceTypeOptions.map((serviceType) => (
                <SelectItem key={serviceType.id} value={serviceType.id}>
                  {serviceType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">الحالة</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="بانتظار الاعتماد">بانتظار الاعتماد</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={columns}
          rows={paginatedReviews}
          getRowKey={(entry) => entry.offeringId}
          onRowClick={(entry) => setSelectedEntry(entry)}
          emptyState={
            <EmptyState
              title="لا توجد طلبات مطابقة"
              description="جرّب توسيع نطاق البحث أو مسح الفلاتر الحالية لرؤية المزيد."
            />
          }
        />

        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </section>

      <DetailsDrawer
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(undefined);
          }
        }}
        title={selectedEntry ? `${selectedEntry.productNameAr} - ${selectedEntry.serviceTypeLabelAr}` : "تفاصيل التسعير"}
        description={selectedEntry ? `مراجعة عرض ${selectedEntry.providerNameAr}` : undefined}
      >
        {selectedEntry ? (
          <>
            <section className="surface-card px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">المزوّد</p>
                  <p className="text-sm font-semibold text-foreground">{selectedEntry.providerNameAr}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">وحدة التسعير</p>
                  <p className="text-sm font-semibold text-foreground">{selectedEntry.pricingUnitLabelAr}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">السعر المقترح</p>
                  <p className="text-base font-bold text-foreground">
                    {formatAdminCurrency(selectedEntry.proposedPriceSar, language)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">تاريخ الإرسال</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatAdminDateTime(selectedEntry.proposedSubmittedAt, language)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">السعر النشط الحالي</p>
                  <p className="text-sm font-semibold text-foreground">
                    {typeof selectedEntry.currentApprovedPriceSar === "number"
                      ? formatAdminCurrency(selectedEntry.currentApprovedPriceSar, language)
                      : "لا يوجد"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">السعر الاسترشادي</p>
                  <p className="text-sm font-semibold text-foreground">
                    {typeof selectedEntry.suggestedPriceSar === "number"
                      ? formatAdminCurrency(selectedEntry.suggestedPriceSar, language)
                      : "غير محدد"}
                  </p>
                </div>
              </div>
            </section>

            <section className="surface-card px-5 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">سبب الرفض (اختياري)</label>
                <Textarea
                  rows={4}
                  value={rejectionReasonAr}
                  onChange={(event) => setRejectionReasonAr(event.target.value)}
                  placeholder="أضف ملاحظة توضيحية للمزوّد إذا كان السعر يحتاج تعديلًا."
                />
              </div>
            </section>

            <section className="flex flex-wrap gap-3">
              <Button onClick={() => void handleApprove()} disabled={approveMutation.isPending} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                اعتماد السعر
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleReject()}
                disabled={rejectMutation.isPending}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                رفض السعر
              </Button>
            </section>
          </>
        ) : null}
      </DetailsDrawer>
    </AdminWorkspaceLayout>
  );
};

export default AdminProviderPricingPage;
