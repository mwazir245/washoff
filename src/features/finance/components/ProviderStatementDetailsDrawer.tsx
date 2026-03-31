import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import DetailsDrawer from "@/shared/components/data-display/DetailsDrawer";
import { formatAdminCurrency, formatAdminDate, formatAdminDateTime } from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import FinanceStatusBadge from "@/features/finance/components/FinanceStatusBadge";
import type { ProviderSettlementStatement } from "@/features/orders/model";

interface ProviderStatementDetailsDrawerProps {
  statement?: ProviderSettlementStatement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProviderStatementDetailsDrawer = ({
  statement,
  open,
  onOpenChange,
}: ProviderStatementDetailsDrawerProps) => {
  const { language } = usePlatformLanguage();

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={statement?.statementNumber ?? (language === "en" ? "Statement details" : "تفاصيل كشف المستحقات")}
      description={
        statement
          ? language === "en"
            ? `Statement date ${formatAdminDate(statement.statementDate, language)}`
            : `كشف يومي بتاريخ ${formatAdminDate(statement.statementDate, language)}`
          : undefined
      }
    >
      {statement ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="surface-card px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Statement status" : "حالة الكشف"}
              </p>
              <div className="mt-3">
                <FinanceStatusBadge status={statement.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                <p>{language === "en" ? "Provider" : "المزوّد"}: {statement.provider.displayNameAr}</p>
                <p>{language === "en" ? "Created at" : "تاريخ الإنشاء"}: {formatAdminDateTime(statement.createdAt, language)}</p>
                <p>{language === "en" ? "Paid at" : "تاريخ السداد"}: {formatAdminDateTime(statement.paidAt, language)}</p>
              </div>
              {statement.pdf ? (
                <div className="mt-4">
                  <Button asChild size="sm" variant="outline">
                    <a href={statement.pdf.downloadPath} target="_blank" rel="noreferrer">
                      <FileDown className="h-4 w-4" />
                      {language === "en" ? "Download PDF" : "تنزيل PDF"}
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="surface-card px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Financial totals" : "الإجماليات المالية"}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                <p>{language === "en" ? "Orders" : "عدد الطلبات"}: <span className="font-semibold text-foreground">{statement.orderCount}</span></p>
                <p>{language === "en" ? "Subtotal before VAT" : "الإجمالي قبل الضريبة"}: <span className="font-semibold text-foreground">{formatAdminCurrency(statement.subtotalExVatSar, language)}</span></p>
                <p>{language === "en" ? "VAT" : "قيمة الضريبة"}: <span className="font-semibold text-foreground">{formatAdminCurrency(statement.vatAmountSar, language)}</span></p>
                <p>{language === "en" ? "Total incl. VAT" : "الإجمالي شامل الضريبة"}: <span className="font-semibold text-foreground">{formatAdminCurrency(statement.totalIncVatSar, language)}</span></p>
              </div>
            </div>
          </section>

          <section className="surface-card px-5 py-5">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground">
                {language === "en" ? "Included orders" : "الطلبات المدرجة"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "en"
                  ? "Only completed orders linked to this provider and date appear in the statement."
                  : "تظهر هنا فقط الطلبات المكتملة المرتبطة بهذا المزوّد وبهذا اليوم داخل كشف المستحقات."}
              </p>
            </div>

            <div className="space-y-3">
              {statement.lines.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-3 rounded-[1.1rem] border border-border/70 px-4 py-4 md:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{line.orderId}</p>
                    <p className="text-sm text-muted-foreground">
                      {(language === "en" ? "Room" : "الغرفة")}: {line.roomNumber ?? "—"}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{language === "en" ? "Subtotal" : "قبل الضريبة"}</p>
                    <p className="font-semibold text-foreground">
                      {formatAdminCurrency(line.providerSubtotalExVatSar, language)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{language === "en" ? "VAT" : "الضريبة"}</p>
                    <p className="font-semibold text-foreground">
                      {formatAdminCurrency(line.providerVatAmountSar, language)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{language === "en" ? "Total" : "الإجمالي"}</p>
                    <p className="font-semibold text-foreground">
                      {formatAdminCurrency(line.providerTotalIncVatSar, language)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </DetailsDrawer>
  );
};

export default ProviderStatementDetailsDrawer;
