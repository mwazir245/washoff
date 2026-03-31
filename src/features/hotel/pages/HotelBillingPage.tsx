import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatAdminCurrency, formatAdminDate } from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import HotelInvoiceDetailsDrawer from "@/features/finance/components/HotelInvoiceDetailsDrawer";
import FinanceStatusBadge from "@/features/finance/components/FinanceStatusBadge";
import { useHotelBilling } from "@/features/hotel/hooks/useHotelDashboard";
import { HotelInvoiceStatus, type HotelInvoice } from "@/features/orders/model";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";
import { DashboardLayout } from "@/shared/layout/DashboardLayout";
import { appRoutes } from "@/shared/config/navigation";

const PAGE_SIZE = 12;

const HotelBillingPage = () => {
  const { language } = usePlatformLanguage();
  const billingQuery = useHotelBilling();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<HotelInvoice | undefined>();

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return (billingQuery.data?.invoices ?? []).filter((invoice) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [invoice.invoiceNumber, invoice.buyer.displayNameAr, ...invoice.lines.map((line) => line.orderId)]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" ? true : invoice.status === statusFilter;
      const matchesDate = dateFilter ? invoice.invoiceDate === dateFilter : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [billingQuery.data?.invoices, dateFilter, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const paginatedInvoices = useMemo(
    () => filteredInvoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredInvoices],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const columns: DataTableColumn<HotelInvoice>[] = [
    {
      key: "invoice",
      header: language === "en" ? "Invoice" : "الفاتورة",
      cell: (invoice) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
          <p className="text-xs leading-6 text-muted-foreground">{formatAdminDate(invoice.invoiceDate, language)}</p>
        </div>
      ),
    },
    {
      key: "orders",
      header: language === "en" ? "Orders" : "الطلبات",
      cell: (invoice) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{invoice.orderCount}</p>
          <p className="text-xs leading-6 text-muted-foreground">
            {invoice.lines
              .slice(0, 2)
              .map((line) => line.orderId)
              .join("، ")}
            {invoice.lines.length > 2 ? "..." : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: language === "en" ? "Status" : "الحالة",
      cell: (invoice) => <FinanceStatusBadge status={invoice.status} />,
    },
    {
      key: "subtotal",
      header: language === "en" ? "Subtotal" : "قبل الضريبة",
      cellClassName: "whitespace-nowrap",
      cell: (invoice) => formatAdminCurrency(invoice.subtotalExVatSar, language),
    },
    {
      key: "vat",
      header: language === "en" ? "VAT" : "الضريبة",
      cellClassName: "whitespace-nowrap",
      cell: (invoice) => formatAdminCurrency(invoice.vatAmountSar, language),
    },
    {
      key: "total",
      header: language === "en" ? "Total" : "الإجمالي",
      cellClassName: "whitespace-nowrap font-semibold text-foreground",
      cell: (invoice) => formatAdminCurrency(invoice.totalIncVatSar, language),
    },
  ];

  if (billingQuery.isError) {
    return (
      <DashboardLayout
        title={language === "en" ? "Billing" : "الفواتير"}
        subtitle={language === "en" ? "Unable to load hotel billing." : "تعذر تحميل فواتير الفندق اليومية."}
        eyebrow={language === "en" ? "Hotel finance" : "مالية الفندق"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load invoices" : "تعذر تحميل الفواتير"}
          description={billingQuery.error instanceof Error ? billingQuery.error.message : undefined}
          action={<Button onClick={() => void billingQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={language === "en" ? "Billing" : "الفواتير"}
      subtitle={
        language === "en"
          ? "Daily hotel invoices for completed orders only."
          : "فواتير يومية مجمعة تشمل فقط الطلبات المكتملة الخاصة بالفندق."
      }
      eyebrow={language === "en" ? "Hotel finance" : "مالية الفندق"}
      actions={
        <Button asChild variant="outline">
          <Link to={appRoutes.hotelDashboard}>{language === "en" ? "Back to hotel console" : "العودة إلى لوحة الفندق"}</Link>
        </Button>
      }
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "This screen shows hotel-facing invoice values only. Provider pricing and platform margin remain hidden."
            : "تعرض هذه الشاشة قيم الفواتير الخاصة بالفندق فقط. أسعار المزوّد والهامش الداخلي لا تظهر هنا."
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{language === "en" ? "Issued invoices" : "الفواتير المصدرة"}</p>
          <p className="mt-3 text-2xl font-bold text-foreground">{billingQuery.data?.summary.issuedInvoicesCount ?? 0}</p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{language === "en" ? "Collected invoices" : "الفواتير المحصلة"}</p>
          <p className="mt-3 text-2xl font-bold text-foreground">{billingQuery.data?.summary.collectedInvoicesCount ?? 0}</p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{language === "en" ? "Outstanding total" : "إجمالي غير محصل"}</p>
          <p className="mt-3 text-2xl font-bold text-foreground">{formatAdminCurrency(billingQuery.data?.summary.outstandingTotalIncVatSar ?? 0, language)}</p>
        </div>
      </section>

      <FiltersBar
        title={language === "en" ? "Hotel invoices" : "فواتير الفندق"}
        description={
          language === "en"
            ? "Search by invoice number or order number, then filter by status or invoice date."
            : "ابحث برقم الفاتورة أو الطلب، ثم صفِّ النتائج حسب الحالة أو تاريخ الفاتورة."
        }
        summary={
          language === "en"
            ? `${filteredInvoices.length} invoices`
            : `${filteredInvoices.length} فاتورة`
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Search" : "البحث"}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="ps-10" placeholder={language === "en" ? "Invoice or order number" : "رقم الفاتورة أو الطلب"} />
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
              <SelectItem value={HotelInvoiceStatus.Issued}>{language === "en" ? "Issued" : "مصدرة"}</SelectItem>
              <SelectItem value={HotelInvoiceStatus.Collected}>{language === "en" ? "Collected" : "تم التحصيل"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Invoice date" : "تاريخ الفاتورة"}</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="ps-10" />
          </div>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={columns}
          rows={paginatedInvoices}
          getRowKey={(invoice) => invoice.id}
          onRowClick={(invoice) => setSelectedInvoice(invoice)}
          emptyState={
            <EmptyState
              title={language === "en" ? "No invoices available" : "لا توجد فواتير متاحة"}
              description={
                language === "en"
                  ? "Completed orders will appear here after daily billing is generated."
                  : "ستظهر الفواتير هنا بعد اكتمال الطلبات وتجميعها داخل الفاتورة اليومية."
              }
            />
          }
        />
        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </section>

      <HotelInvoiceDetailsDrawer
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoice(undefined);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default HotelBillingPage;
