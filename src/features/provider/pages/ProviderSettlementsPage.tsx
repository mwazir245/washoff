import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatAdminCurrency, formatAdminDate } from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import FinanceStatusBadge from "@/features/finance/components/FinanceStatusBadge";
import ProviderStatementDetailsDrawer from "@/features/finance/components/ProviderStatementDetailsDrawer";
import { useProviderFinance } from "@/features/provider/hooks/useProviderDashboard";
import { ProviderStatementStatus, type ProviderSettlementStatement } from "@/features/orders/model";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import DataTable, { type DataTableColumn } from "@/shared/components/data-display/DataTable";
import FiltersBar from "@/shared/components/data-display/FiltersBar";
import PaginationBar from "@/shared/components/data-display/PaginationBar";
import { DashboardLayout } from "@/shared/layout/DashboardLayout";
import { appRoutes } from "@/shared/config/navigation";

const PAGE_SIZE = 12;

const ProviderSettlementsPage = () => {
  const { language } = usePlatformLanguage();
  const financeQuery = useProviderFinance();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatement, setSelectedStatement] = useState<ProviderSettlementStatement | undefined>();

  const filteredStatements = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return (financeQuery.data?.statements ?? []).filter((statement) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [statement.statementNumber, statement.provider.displayNameAr, ...statement.lines.map((line) => line.orderId)]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" ? true : statement.status === statusFilter;
      const matchesDate = dateFilter ? statement.statementDate === dateFilter : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, financeQuery.data?.statements, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStatements.length / PAGE_SIZE));
  const paginatedStatements = useMemo(
    () => filteredStatements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredStatements],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const columns: DataTableColumn<ProviderSettlementStatement>[] = [
    {
      key: "statement",
      header: language === "en" ? "Statement" : "كشف المستحقات",
      cell: (statement) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{statement.statementNumber}</p>
          <p className="text-xs leading-6 text-muted-foreground">{formatAdminDate(statement.statementDate, language)}</p>
        </div>
      ),
    },
    {
      key: "orders",
      header: language === "en" ? "Orders" : "الطلبات",
      cell: (statement) => (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{statement.orderCount}</p>
          <p className="text-xs leading-6 text-muted-foreground">
            {statement.lines
              .slice(0, 2)
              .map((line) => line.orderId)
              .join("، ")}
            {statement.lines.length > 2 ? "..." : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: language === "en" ? "Status" : "الحالة",
      cell: (statement) => <FinanceStatusBadge status={statement.status} />,
    },
    {
      key: "subtotal",
      header: language === "en" ? "Subtotal" : "قبل الضريبة",
      cellClassName: "whitespace-nowrap",
      cell: (statement) => formatAdminCurrency(statement.subtotalExVatSar, language),
    },
    {
      key: "vat",
      header: language === "en" ? "VAT" : "الضريبة",
      cellClassName: "whitespace-nowrap",
      cell: (statement) => formatAdminCurrency(statement.vatAmountSar, language),
    },
    {
      key: "total",
      header: language === "en" ? "Total" : "الإجمالي",
      cellClassName: "whitespace-nowrap font-semibold text-foreground",
      cell: (statement) => formatAdminCurrency(statement.totalIncVatSar, language),
    },
  ];

  if (financeQuery.isError) {
    return (
      <DashboardLayout
        title={language === "en" ? "Settlements" : "مستحقاتي"}
        subtitle={language === "en" ? "Unable to load provider settlements." : "تعذر تحميل كشوف مستحقات المزوّد."}
        eyebrow={language === "en" ? "Provider finance" : "مالية المزوّد"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load statements" : "تعذر تحميل الكشوف"}
          description={financeQuery.error instanceof Error ? financeQuery.error.message : ""}
          action={<Button onClick={() => void financeQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={language === "en" ? "Settlements" : "مستحقاتي"}
      subtitle={
        language === "en"
          ? "Daily provider statements built from completed orders only."
          : "كشوف يومية لمستحقات المزوّد مبنية فقط على الطلبات المكتملة."
      }
      eyebrow={language === "en" ? "Provider finance" : "مالية المزوّد"}
      actions={
        <Button asChild variant="outline">
          <Link to={appRoutes.providerDashboard}>{language === "en" ? "Back to provider console" : "العودة إلى لوحة المزوّد"}</Link>
        </Button>
      }
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "This screen shows provider earnings only. Hotel billing values and platform margin remain hidden."
            : "تعرض هذه الشاشة مستحقات المزوّد فقط. قيم فواتير الفندق والهامش الداخلي لا تظهر هنا."
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{language === "en" ? "Pending payment" : "بانتظار السداد"}</p>
          <p className="mt-3 text-2xl font-bold text-foreground">{financeQuery.data?.summary.pendingStatementsCount ?? 0}</p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{language === "en" ? "Paid statements" : "الكشوف المسددة"}</p>
          <p className="mt-3 text-2xl font-bold text-foreground">{financeQuery.data?.summary.paidStatementsCount ?? 0}</p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{language === "en" ? "Pending total" : "إجمالي بانتظار السداد"}</p>
          <p className="mt-3 text-2xl font-bold text-foreground">{formatAdminCurrency(financeQuery.data?.summary.pendingTotalIncVatSar ?? 0, language)}</p>
        </div>
      </section>

      <FiltersBar
        title={language === "en" ? "Provider statements" : "كشوف المستحقات"}
        description={
          language === "en"
            ? "Search by statement or order number, then filter by status or statement date."
            : "ابحث برقم الكشف أو الطلب، ثم صفِّ النتائج حسب الحالة أو تاريخ الكشف."
        }
        summary={language === "en" ? `${filteredStatements.length} statements` : `${filteredStatements.length} كشفًا`}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Search" : "البحث"}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="ps-10" placeholder={language === "en" ? "Statement or order number" : "رقم الكشف أو الطلب"} />
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
              <SelectItem value={ProviderStatementStatus.PendingPayment}>{language === "en" ? "Pending payment" : "بانتظار السداد"}</SelectItem>
              <SelectItem value={ProviderStatementStatus.Paid}>{language === "en" ? "Paid" : "تم السداد"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{language === "en" ? "Statement date" : "تاريخ الكشف"}</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="ps-10" />
          </div>
        </div>
      </FiltersBar>

      <section className="space-y-5">
        <DataTable
          columns={columns}
          rows={paginatedStatements}
          getRowKey={(statement) => statement.id}
          onRowClick={(statement) => setSelectedStatement(statement)}
          emptyState={
            <EmptyState
              title={language === "en" ? "No statements available" : "لا توجد كشوف متاحة"}
              description={
                language === "en"
                  ? "Completed orders will appear here once the daily statement is generated."
                  : "ستظهر الكشوف هنا بعد اكتمال الطلبات وتجميعها داخل كشف المستحقات اليومي."
              }
            />
          }
        />
        <div className="surface-card px-6 py-5 sm:px-8">
          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </section>

      <ProviderStatementDetailsDrawer
        statement={selectedStatement}
        open={Boolean(selectedStatement)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStatement(undefined);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default ProviderSettlementsPage;
