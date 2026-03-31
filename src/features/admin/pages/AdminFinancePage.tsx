import { useEffect, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import {
  useAdminFinancePage,
  useMarkHotelInvoiceCollectedMutation,
  useMarkProviderStatementPaidMutation,
} from "@/features/admin/hooks/useAdminOperations";
import { formatAdminCurrency, formatAdminDate } from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import HotelInvoiceDetailsDrawer from "@/features/finance/components/HotelInvoiceDetailsDrawer";
import FinanceStatusBadge from "@/features/finance/components/FinanceStatusBadge";
import ProviderStatementDetailsDrawer from "@/features/finance/components/ProviderStatementDetailsDrawer";
import {
  HotelInvoiceStatus,
  ProviderStatementStatus,
  type HotelInvoice,
  type ProviderSettlementStatement,
} from "@/features/orders/model";
import { toast } from "@/hooks/use-toast";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";

const PAGE_SIZE = 12;

const AdminFinancePage = () => {
  const { language } = usePlatformLanguage();
  const collectInvoiceMutation = useMarkHotelInvoiceCollectedMutation();
  const payStatementMutation = useMarkProviderStatementPaidMutation();
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");
  const [invoiceDateFilter, setInvoiceDateFilter] = useState("");
  const [invoicePage, setInvoicePage] = useState(1);
  const [statementSearch, setStatementSearch] = useState("");
  const [statementStatusFilter, setStatementStatusFilter] = useState<string>("all");
  const [statementDateFilter, setStatementDateFilter] = useState("");
  const [statementPage, setStatementPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<HotelInvoice | undefined>();
  const [selectedStatement, setSelectedStatement] = useState<ProviderSettlementStatement | undefined>();

  const financeQuery = useAdminFinancePage({
    invoicePage,
    invoicePageSize: PAGE_SIZE,
    invoiceSearch: invoiceSearch || undefined,
    invoiceStatus: invoiceStatusFilter === "all" ? undefined : invoiceStatusFilter,
    invoiceDate: invoiceDateFilter || undefined,
    statementPage,
    statementPageSize: PAGE_SIZE,
    statementSearch: statementSearch || undefined,
    statementStatus: statementStatusFilter === "all" ? undefined : statementStatusFilter,
    statementDate: statementDateFilter || undefined,
  });

  useEffect(() => {
    setInvoicePage(1);
  }, [invoiceDateFilter, invoiceSearch, invoiceStatusFilter]);

  useEffect(() => {
    setStatementPage(1);
  }, [statementDateFilter, statementSearch, statementStatusFilter]);

  const invoiceColumns: DataTableColumn<HotelInvoice>[] = [
    {
      key: "invoice",
      header: language === "en" ? "Invoice" : "الفاتورة",
      cell: (invoice) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
          <p className="text-xs leading-6 text-muted-foreground">{invoice.buyer.displayNameAr}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: language === "en" ? "Date" : "التاريخ",
      cellClassName: "whitespace-nowrap",
      cell: (invoice) => formatAdminDate(invoice.invoiceDate, language),
    },
    {
      key: "status",
      header: language === "en" ? "Status" : "الحالة",
      cell: (invoice) => <FinanceStatusBadge status={invoice.status} />,
    },
    {
      key: "total",
      header: language === "en" ? "Total" : "الإجمالي",
      cellClassName: "whitespace-nowrap font-semibold text-foreground",
      cell: (invoice) => formatAdminCurrency(invoice.totalIncVatSar, language),
    },
    {
      key: "action",
      header: language === "en" ? "Action" : "الإجراء",
      cellClassName: "whitespace-nowrap",
      cell: (invoice) =>
        invoice.status === HotelInvoiceStatus.Issued ? (
          <Button
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              void handleCollectInvoice(invoice.id);
            }}
            disabled={collectInvoiceMutation.isPending}
          >
            {language === "en" ? "Mark collected" : "تم التحصيل"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedInvoice(invoice);
            }}
          >
            {language === "en" ? "Details" : "التفاصيل"}
          </Button>
        ),
    },
  ];

  const statementColumns: DataTableColumn<ProviderSettlementStatement>[] = [
    {
      key: "statement",
      header: language === "en" ? "Statement" : "كشف المستحقات",
      cell: (statement) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{statement.statementNumber}</p>
          <p className="text-xs leading-6 text-muted-foreground">{statement.provider.displayNameAr}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: language === "en" ? "Date" : "التاريخ",
      cellClassName: "whitespace-nowrap",
      cell: (statement) => formatAdminDate(statement.statementDate, language),
    },
    {
      key: "status",
      header: language === "en" ? "Status" : "الحالة",
      cell: (statement) => <FinanceStatusBadge status={statement.status} />,
    },
    {
      key: "total",
      header: language === "en" ? "Total" : "الإجمالي",
      cellClassName: "whitespace-nowrap font-semibold text-foreground",
      cell: (statement) => formatAdminCurrency(statement.totalIncVatSar, language),
    },
    {
      key: "action",
      header: language === "en" ? "Action" : "الإجراء",
      cellClassName: "whitespace-nowrap",
      cell: (statement) =>
        statement.status === ProviderStatementStatus.PendingPayment ? (
          <Button
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              void handlePayStatement(statement.id);
            }}
            disabled={payStatementMutation.isPending}
          >
            {language === "en" ? "Mark paid" : "تم السداد"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedStatement(statement);
            }}
          >
            {language === "en" ? "Details" : "التفاصيل"}
          </Button>
        ),
    },
  ];

  const handleCollectInvoice = async (invoiceId: string) => {
    try {
      await collectInvoiceMutation.mutateAsync(invoiceId);
      toast({
        title: language === "en" ? "Invoice collected" : "تم تحصيل الفاتورة",
        description:
          language === "en"
            ? "The hotel invoice status was updated successfully."
            : "تم تحديث حالة الفاتورة اليومية إلى محصلة بنجاح.",
      });
    } catch (error) {
      toast({
        title: language === "en" ? "Unable to update invoice" : "تعذّر تحديث الفاتورة",
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    }
  };

  const handlePayStatement = async (statementId: string) => {
    try {
      await payStatementMutation.mutateAsync(statementId);
      toast({
        title: language === "en" ? "Statement paid" : "تم سداد كشف المستحقات",
        description:
          language === "en"
            ? "The provider statement status was updated successfully."
            : "تم تحديث حالة كشف المستحقات إلى مسدد بنجاح.",
      });
    } catch (error) {
      toast({
        title: language === "en" ? "Unable to update statement" : "تعذّر تحديث كشف المستحقات",
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    }
  };

  if (financeQuery.isError) {
    return (
      <AdminWorkspaceLayout
        title={language === "en" ? "Finance" : "المالية"}
        subtitle={
          language === "en"
            ? "Unable to load finance operations."
            : "تعذّر تحميل بيانات العمليات المالية."
        }
        eyebrow={language === "en" ? "Admin finance" : "المالية والإدارة"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load finance data" : "تعذّر تحميل البيانات المالية"}
          description={financeQuery.error instanceof Error ? financeQuery.error.message : ""}
          action={
            <Button onClick={() => void financeQuery.refetch()}>
              {language === "en" ? "Retry" : "إعادة المحاولة"}
            </Button>
          }
        />
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={language === "en" ? "Finance" : "المالية"}
      subtitle={
        language === "en"
          ? "Server-driven finance operations for hotel invoices, provider statements, and collection status."
          : "تشغيل مالي يعتمد على الخادم لفواتير الفنادق وكشوف المزوّدين وحالات التحصيل والسداد."
      }
      eyebrow={language === "en" ? "Admin finance" : "المالية والإدارة"}
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "This module uses completed orders only. It does not change matching, assignment, or execution logic."
            : "تعتمد هذه الوحدة على الطلبات المكتملة فقط، ولا تغيّر منطق المطابقة أو الإسناد أو دورة التنفيذ."
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Today hotel invoices" : "إجمالي فواتير اليوم"}
          </p>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {formatAdminCurrency(financeQuery.data?.summary.todayHotelInvoiceTotalIncVatSar ?? 0, language)}
          </p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Today provider statements" : "إجمالي كشوف اليوم"}
          </p>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {formatAdminCurrency(
              financeQuery.data?.summary.todayProviderStatementTotalIncVatSar ?? 0,
              language,
            )}
          </p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Gross margin ex VAT" : "الهامش الإجمالي قبل الضريبة"}
          </p>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {formatAdminCurrency(financeQuery.data?.summary.grossMarginExVatSar ?? 0, language)}
          </p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Output VAT / Input VAT" : "ضريبة المخرجات / المدخلات"}
          </p>
          <p className="mt-3 text-lg font-bold text-foreground">
            {formatAdminCurrency(financeQuery.data?.summary.outputVatTotalSar ?? 0, language)} /{" "}
            {formatAdminCurrency(financeQuery.data?.summary.inputVatTotalSar ?? 0, language)}
          </p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Net VAT position" : "صافي مركز الضريبة"}
          </p>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {formatAdminCurrency(financeQuery.data?.summary.netVatPositionSar ?? 0, language)}
          </p>
        </div>
      </section>

      <FiltersBar
        title={language === "en" ? "Hotel invoices" : "فواتير الفنادق"}
        description={
          language === "en"
            ? "Filter hotel invoices by hotel name, date, status, or linked order number."
            : "صفِّ فواتير الفنادق حسب اسم الفندق أو التاريخ أو الحالة أو رقم الطلب المرتبط."
        }
        summary={
          language === "en"
            ? `${financeQuery.data?.hotelInvoicesPage.total ?? 0} invoices`
            : `${financeQuery.data?.hotelInvoicesPage.total ?? 0} فاتورة`
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Search" : "البحث"}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={invoiceSearch}
              onChange={(event) => setInvoiceSearch(event.target.value)}
              className="ps-10"
              placeholder={language === "en" ? "Hotel, invoice, or order" : "الفندق أو الفاتورة أو الطلب"}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Status" : "الحالة"}</label>
          <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "All statuses" : "كل الحالات"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "en" ? "All statuses" : "كل الحالات"}</SelectItem>
              <SelectItem value={HotelInvoiceStatus.Issued}>{language === "en" ? "Issued" : "مصدرة"}</SelectItem>
              <SelectItem value={HotelInvoiceStatus.Collected}>
                {language === "en" ? "Collected" : "تم التحصيل"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Date" : "التاريخ"}</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={invoiceDateFilter}
              onChange={(event) => setInvoiceDateFilter(event.target.value)}
              className="ps-10"
            />
          </div>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={invoiceColumns}
          rows={financeQuery.data?.hotelInvoicesPage.items ?? []}
          getRowKey={(invoice) => invoice.id}
          onRowClick={(invoice) => setSelectedInvoice(invoice)}
          emptyState={
            <EmptyState
              title={language === "en" ? "No invoices found" : "لا توجد فواتير"}
              description={
                language === "en"
                  ? "Try broadening the filters."
                  : "جرّب توسيع الفلاتر الحالية لعرض نتائج أكثر."
              }
            />
          }
        />
        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar
            currentPage={financeQuery.data?.hotelInvoicesPage.page ?? invoicePage}
            totalPages={financeQuery.data?.hotelInvoicesPage.totalPages ?? 1}
            onPageChange={setInvoicePage}
          />
        </div>
      </section>

      <FiltersBar
        title={language === "en" ? "Provider statements" : "كشوف مستحقات المزوّدين"}
        description={
          language === "en"
            ? "Filter provider statements by provider name, date, status, or linked order number."
            : "صفِّ كشوف مستحقات المزوّدين حسب اسم المزوّد أو التاريخ أو الحالة أو رقم الطلب المرتبط."
        }
        summary={
          language === "en"
            ? `${financeQuery.data?.providerStatementsPage.total ?? 0} statements`
            : `${financeQuery.data?.providerStatementsPage.total ?? 0} كشفًا`
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Search" : "البحث"}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={statementSearch}
              onChange={(event) => setStatementSearch(event.target.value)}
              className="ps-10"
              placeholder={language === "en" ? "Provider, statement, or order" : "المزوّد أو الكشف أو الطلب"}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Status" : "الحالة"}</label>
          <Select value={statementStatusFilter} onValueChange={setStatementStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "All statuses" : "كل الحالات"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "en" ? "All statuses" : "كل الحالات"}</SelectItem>
              <SelectItem value={ProviderStatementStatus.PendingPayment}>
                {language === "en" ? "Pending payment" : "بانتظار السداد"}
              </SelectItem>
              <SelectItem value={ProviderStatementStatus.Paid}>
                {language === "en" ? "Paid" : "تم السداد"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Date" : "التاريخ"}</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={statementDateFilter}
              onChange={(event) => setStatementDateFilter(event.target.value)}
              className="ps-10"
            />
          </div>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={statementColumns}
          rows={financeQuery.data?.providerStatementsPage.items ?? []}
          getRowKey={(statement) => statement.id}
          onRowClick={(statement) => setSelectedStatement(statement)}
          emptyState={
            <EmptyState
              title={language === "en" ? "No statements found" : "لا توجد كشوف"}
              description={
                language === "en"
                  ? "Try broadening the filters."
                  : "جرّب توسيع الفلاتر الحالية لعرض نتائج أكثر."
              }
            />
          }
        />
        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar
            currentPage={financeQuery.data?.providerStatementsPage.page ?? statementPage}
            totalPages={financeQuery.data?.providerStatementsPage.totalPages ?? 1}
            onPageChange={setStatementPage}
          />
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
      <ProviderStatementDetailsDrawer
        statement={selectedStatement}
        open={Boolean(selectedStatement)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStatement(undefined);
          }
        }}
      />
    </AdminWorkspaceLayout>
  );
};

export default AdminFinancePage;
