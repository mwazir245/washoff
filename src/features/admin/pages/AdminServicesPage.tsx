import { useEffect, useMemo, useState } from "react";
import { PlusCircle, Search, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  useAdminServiceCatalog,
  useUpdatePlatformServiceMatrixMutation,
  useUpsertPlatformProductMutation,
} from "@/features/admin/hooks/useAdminOperations";
import { formatAdminCurrency, formatAdminNumber } from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import type { PlatformProduct } from "@/features/orders/model/service";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import DetailsDrawer from "@/shared/components/data-display/DetailsDrawer";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";

const PAGE_SIZE = 12;

interface ProductTableRow {
  product: PlatformProduct;
  rows: Array<{
    id: string;
    serviceTypeId: string;
    serviceTypeName: string;
    suggestedPriceSar?: number;
    active: boolean;
    isAvailable: boolean;
  }>;
}

interface MatrixDraft {
  suggestedPriceSar: string;
  active: boolean;
  isAvailable: boolean;
}

const toneClasses = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  muted: "border-border/70 bg-muted/30 text-muted-foreground",
} as const;

const buildMatrixDrafts = (row?: ProductTableRow) =>
  Object.fromEntries(
    (row?.rows ?? []).map((entry) => [
      entry.id,
      {
        suggestedPriceSar: entry.suggestedPriceSar?.toFixed(2) ?? "",
        active: entry.active,
        isAvailable: entry.isAvailable,
      } satisfies MatrixDraft,
    ]),
  );

const AdminServicesPage = () => {
  const { language } = usePlatformLanguage();
  const catalogQuery = useAdminServiceCatalog();
  const upsertProductMutation = useUpsertPlatformProductMutation();
  const updateMatrixMutation = useUpdatePlatformServiceMatrixMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [productNameAr, setProductNameAr] = useState("");
  const [productActive, setProductActive] = useState(true);
  const [matrixDrafts, setMatrixDrafts] = useState<Record<string, MatrixDraft>>({});

  const serviceTypes = useMemo(
    () => catalogQuery.data?.serviceTypes.filter((serviceType) => serviceType.active) ?? [],
    [catalogQuery.data],
  );

  const productRows = useMemo<ProductTableRow[]>(() => {
    if (!catalogQuery.data) {
      return [];
    }

    return catalogQuery.data.products
      .map((product) => ({
        product,
        rows: catalogQuery.data.matrixRows
          .filter((row) => row.productId === product.id)
          .map((row) => ({
            id: row.id,
            serviceTypeId: row.serviceTypeId,
            serviceTypeName: row.serviceTypeName.ar,
            suggestedPriceSar: row.suggestedPriceSar,
            active: row.active,
            isAvailable: row.isAvailable,
          }))
          .sort((left, right) => left.serviceTypeName.localeCompare(right.serviceTypeName, "ar")),
      }))
      .sort((left, right) => left.product.sortOrder - right.product.sortOrder);
  }, [catalogQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return productRows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [row.product.name.ar, row.product.code]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);

      const matchesServiceType =
        serviceTypeFilter === "all"
          ? true
          : row.rows.some((entry) => entry.serviceTypeId === serviceTypeFilter);

      const hasOperationalRows = row.rows.some((entry) => entry.active && entry.isAvailable);
      const hasUnavailableRows = row.rows.some((entry) => !entry.isAvailable || !entry.active);
      const matchesAvailability =
        availabilityFilter === "all"
          ? true
          : availabilityFilter === "available"
            ? hasOperationalRows
            : availabilityFilter === "mixed"
              ? hasOperationalRows && hasUnavailableRows
              : !hasOperationalRows;

      return matchesSearch && matchesServiceType && matchesAvailability;
    });
  }, [availabilityFilter, productRows, searchQuery, serviceTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredRows],
  );

  const selectedProductRow = useMemo(
    () => productRows.find((row) => row.product.id === selectedProductId),
    [productRows, selectedProductId],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [availabilityFilter, searchQuery, serviceTypeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (selectedProductRow) {
      setProductNameAr(selectedProductRow.product.name.ar);
      setProductActive(selectedProductRow.product.active);
      setMatrixDrafts(buildMatrixDrafts(selectedProductRow));
      return;
    }

    if (createDrawerOpen) {
      setProductNameAr("");
      setProductActive(true);
      setMatrixDrafts({});
    }
  }, [createDrawerOpen, selectedProductRow]);

  const resetFilters = () => {
    setSearchQuery("");
    setServiceTypeFilter("all");
    setAvailabilityFilter("all");
  };

  const handleSaveProduct = async () => {
    try {
      await upsertProductMutation.mutateAsync({
        id: selectedProductRow?.product.id,
        nameAr: productNameAr,
        active: productActive,
      });
      toast({
        title: selectedProductRow ? "تم تحديث المنتج" : "تمت إضافة المنتج",
        description: selectedProductRow
          ? "تم حفظ بيانات المنتج داخل كتالوج المنصة."
          : "تمت إضافة منتج جديد مع صفوف خدمات غير مفعلة افتراضيًا.",
      });

      if (!selectedProductRow) {
        setCreateDrawerOpen(false);
      }
    } catch (error) {
      toast({
        title: "تعذر حفظ المنتج",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ المنتج.",
        variant: "destructive",
      });
    }
  };

  const handleSaveMatrixRow = async (matrixRowId: string) => {
    const draft = matrixDrafts[matrixRowId];

    if (!draft) {
      return;
    }

    try {
      await updateMatrixMutation.mutateAsync({
        matrixRowId,
        active: draft.active,
        isAvailable: draft.isAvailable,
        suggestedPriceSar:
          draft.isAvailable && draft.suggestedPriceSar.trim().length > 0
            ? Number(draft.suggestedPriceSar)
            : undefined,
      });
      toast({
        title: "تم تحديث صف الخدمة",
        description: "تم حفظ حالة التفعيل والإتاحة والسعر الاسترشادي بنجاح.",
      });
    } catch (error) {
      toast({
        title: "تعذر تحديث صف الخدمة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث صف الخدمة.",
        variant: "destructive",
      });
    }
  };

  const columns: DataTableColumn<ProductTableRow>[] = [
    {
      key: "product",
      header: language === "en" ? "Product" : "المنتج",
      cell: (row) => (
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{row.product.name.ar}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={row.product.active ? "default" : "outline"}>
              {row.product.active ? "نشط" : "غير نشط"}
            </Badge>
            <Badge variant="outline">{row.product.code}</Badge>
          </div>
        </div>
      ),
    },
    ...serviceTypes.map<DataTableColumn<ProductTableRow>>((serviceType) => ({
      key: serviceType.id,
      header: serviceType.name.ar,
      cell: (row) => {
        const matrixRow = row.rows.find((entry) => entry.serviceTypeId === serviceType.id);

        if (!matrixRow) {
          return <span className="text-xs text-muted-foreground">غير متاح</span>;
        }

        const tone =
          matrixRow.active && matrixRow.isAvailable ? toneClasses.success : matrixRow.isAvailable ? toneClasses.warning : toneClasses.muted;

        return (
          <div className="space-y-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
              {matrixRow.active && matrixRow.isAvailable
                ? "تشغيلي"
                : matrixRow.isAvailable
                  ? "متاح غير مفعّل"
                  : "غير متاح"}
            </span>
            <p className="text-sm font-semibold text-foreground">
              {typeof matrixRow.suggestedPriceSar === "number"
                ? formatAdminCurrency(matrixRow.suggestedPriceSar, language)
                : "غير محدد"}
            </p>
          </div>
        );
      },
    })),
    {
      key: "summary",
      header: language === "en" ? "Summary" : "الملخص",
      cell: (row) => {
        const activeCount = row.rows.filter((entry) => entry.active && entry.isAvailable).length;
        return (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{`${formatAdminNumber(activeCount, language)} خدمة تشغيلية`}</p>
            <p>{`${formatAdminNumber(row.rows.length, language)} صفوف في المصفوفة`}</p>
          </div>
        );
      },
    },
  ];

  if (catalogQuery.isError) {
    return (
      <AdminWorkspaceLayout
        title={language === "en" ? "Platform services" : "كتالوج الخدمات"}
        subtitle={
          language === "en"
            ? "Unable to load the platform service matrix."
            : "تعذر تحميل مصفوفة خدمات المنصة."
        }
        eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load services" : "تعذر تحميل الخدمات"}
          description={
            catalogQuery.error instanceof Error
              ? catalogQuery.error.message
              : language === "en"
                ? "An unexpected error occurred while loading the catalog."
                : "حدث خطأ غير متوقع أثناء تحميل الكتالوج."
          }
          action={
            <Button onClick={() => void catalogQuery.refetch()}>
              {language === "en" ? "Retry" : "إعادة المحاولة"}
            </Button>
          }
        />
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={language === "en" ? "Platform services" : "كتالوج الخدمات"}
      subtitle={
        language === "en"
          ? "Manage products, service availability, and suggested pricing in one standardized matrix."
          : "أدر المنتجات وإتاحة الخدمة والأسعار الاسترشادية من خلال مصفوفة موحدة واضحة."
      }
      eyebrow={language === "en" ? "Admin operations" : "تشغيل الإدارة"}
    >
      <PreviewModeNotice description="تتحكم هذه الصفحة في الكتالوج القياسي للمنصة فقط. لم يتغير منطق المطابقة أو الإسناد أو قبول الطلبات." />

      <FiltersBar
        title={language === "en" ? "Service catalog controls" : "التحكم في كتالوج الخدمات"}
        description={
          language === "en"
            ? "Search products, filter the matrix, and open any row to edit operational availability and suggested pricing."
            : "ابحث في المنتجات وصفِّ المصفوفة، ثم افتح أي صف لتعديل الإتاحة التشغيلية والسعر الاسترشادي."
        }
        summary={`${formatAdminNumber(filteredRows.length, language)} منتجًا مطابقًا للفلاتر`}
        actions={
          <Button
            type="button"
            onClick={() => {
              setSelectedProductId(null);
              setCreateDrawerOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4" />
            إضافة منتج
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
              placeholder="اسم المنتج أو الرمز"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">نوع الخدمة</label>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل أنواع الخدمة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل أنواع الخدمة</SelectItem>
              {serviceTypes.map((serviceType) => (
                <SelectItem key={serviceType.id} value={serviceType.id}>
                  {serviceType.name.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">حالة الإتاحة</label>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="available">يوجد صفوف تشغيلية</SelectItem>
              <SelectItem value="mixed">إتاحة مختلطة</SelectItem>
              <SelectItem value="unavailable">غير متاح تشغيليًا</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">الفلاتر</label>
          <Button type="button" variant="outline" onClick={resetFilters} className="w-full justify-center">
            <Settings2 className="h-4 w-4" />
            مسح الفلاتر
          </Button>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={columns}
          rows={paginatedRows}
          getRowKey={(row) => row.product.id}
          onRowClick={(row) => {
            setCreateDrawerOpen(false);
            setSelectedProductId(row.product.id);
          }}
          emptyState={
            <EmptyState
              title="لا توجد منتجات مطابقة"
              description="جرّب توسيع البحث أو تغيير فلاتر الإتاحة ونوع الخدمة."
            />
          }
        />

        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </section>

      <DetailsDrawer
        open={createDrawerOpen || Boolean(selectedProductRow)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDrawerOpen(false);
            setSelectedProductId(null);
          }
        }}
        title={selectedProductRow ? selectedProductRow.product.name.ar : "إضافة منتج جديد"}
        description={
          selectedProductRow
            ? "عدّل بيانات المنتج وصفوف الخدمة القياسية المرتبطة به."
            : "أضف منتجًا جديدًا ثم فعّل صفوف الخدمات المناسبة له من نفس الشاشة."
        }
      >
        <section className="surface-card px-5 py-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">اسم المنتج</label>
              <Input value={productNameAr} onChange={(event) => setProductNameAr(event.target.value)} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground">
              <Checkbox checked={productActive} onCheckedChange={(value) => setProductActive(Boolean(value))} />
              <span>نشط في الكتالوج</span>
            </label>
            <Button type="button" onClick={() => void handleSaveProduct()} disabled={upsertProductMutation.isPending}>
              {selectedProductRow ? "حفظ المنتج" : "إضافة المنتج"}
            </Button>
          </div>
        </section>

        {selectedProductRow ? (
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">صفوف المصفوفة</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                فعّل أو عطّل كل تركيبة منتج × نوع خدمة، وحدد السعر الاسترشادي الذي يظهر للمزوّد كمرجع.
              </p>
            </div>

            <div className="space-y-4">
              {selectedProductRow.rows.map((matrixRow) => {
                const draft = matrixDrafts[matrixRow.id] ?? {
                  suggestedPriceSar: matrixRow.suggestedPriceSar?.toFixed(2) ?? "",
                  active: matrixRow.active,
                  isAvailable: matrixRow.isAvailable,
                };

                return (
                  <div key={matrixRow.id} className="surface-card px-5 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">{matrixRow.serviceTypeName}</p>
                        <p className="text-sm text-muted-foreground">وحدة التسعير: للقطعة الواحدة</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={draft.active && draft.isAvailable ? "default" : "outline"}>
                          {draft.active && draft.isAvailable ? "تشغيلي" : "غير تشغيلي"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[220px_220px_220px_auto] md:items-end">
                      <label className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground">
                        <Checkbox
                          checked={draft.isAvailable}
                          onCheckedChange={(value) =>
                            setMatrixDrafts((current) => ({
                              ...current,
                              [matrixRow.id]: {
                                ...draft,
                                isAvailable: Boolean(value),
                              },
                            }))
                          }
                        />
                        <span>متاح ضمن الكتالوج</span>
                      </label>

                      <label className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground">
                        <Checkbox
                          checked={draft.active}
                          onCheckedChange={(value) =>
                            setMatrixDrafts((current) => ({
                              ...current,
                              [matrixRow.id]: {
                                ...draft,
                                active: Boolean(value),
                              },
                            }))
                          }
                        />
                        <span>نشط تشغيليًا</span>
                      </label>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">السعر الاسترشادي</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={draft.suggestedPriceSar}
                          onChange={(event) =>
                            setMatrixDrafts((current) => ({
                              ...current,
                              [matrixRow.id]: {
                                ...draft,
                                suggestedPriceSar: event.target.value,
                              },
                            }))
                          }
                          disabled={!draft.isAvailable}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleSaveMatrixRow(matrixRow.id)}
                        disabled={updateMatrixMutation.isPending}
                      >
                        حفظ الصف
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </DetailsDrawer>
    </AdminWorkspaceLayout>
  );
};

export default AdminServicesPage;
