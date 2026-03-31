import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import DetailsDrawer from "@/shared/components/data-display/DetailsDrawer";
import { formatAdminCurrency, formatAdminDate, formatAdminDateTime } from "@/features/admin/lib/admin-presentation";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import FinanceStatusBadge from "@/features/finance/components/FinanceStatusBadge";
import type { HotelInvoice } from "@/features/orders/model";

interface HotelInvoiceDetailsDrawerProps {
  invoice?: HotelInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HotelInvoiceDetailsDrawer = ({
  invoice,
  open,
  onOpenChange,
}: HotelInvoiceDetailsDrawerProps) => {
  const { language } = usePlatformLanguage();

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={invoice?.invoiceNumber ?? (language === "en" ? "Invoice details" : "تفاصيل الفاتورة")}
      description={
        invoice
          ? language === "en"
            ? `Issued ${formatAdminDate(invoice.invoiceDate, language)}`
            : `فاتورة يومية بتاريخ ${formatAdminDate(invoice.invoiceDate, language)}`
          : undefined
      }
    >
      {invoice ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="surface-card px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {language === "en" ? "Invoice status" : "حالة الفاتورة"}
              </p>
              <div className="mt-3">
                <FinanceStatusBadge status={invoice.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                <p>{language === "en" ? "Seller" : "الجهة المصدرة"}: {invoice.seller.displayNameAr}</p>
                <p>{language === "en" ? "Buyer" : "الجهة المدينة"}: {invoice.buyer.displayNameAr}</p>
                <p>{language === "en" ? "Issued at" : "تاريخ الإصدار"}: {formatAdminDateTime(invoice.issuedAt, language)}</p>
                <p>
                  {language === "en" ? "Collected at" : "تاريخ التحصيل"}:{" "}
                  {formatAdminDateTime(invoice.collectedAt, language)}
                </p>
              </div>
              {invoice.pdf ? (
                <div className="mt-4">
                  <Button asChild size="sm" variant="outline">
                    <a href={invoice.pdf.downloadPath} target="_blank" rel="noreferrer">
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
                <p>{language === "en" ? "Orders" : "عدد الطلبات"}: <span className="font-semibold text-foreground">{invoice.orderCount}</span></p>
                <p>{language === "en" ? "Subtotal before VAT" : "الإجمالي قبل الضريبة"}: <span className="font-semibold text-foreground">{formatAdminCurrency(invoice.subtotalExVatSar, language)}</span></p>
                <p>{language === "en" ? "VAT" : "قيمة الضريبة"}: <span className="font-semibold text-foreground">{formatAdminCurrency(invoice.vatAmountSar, language)}</span></p>
                <p>{language === "en" ? "Total incl. VAT" : "الإجمالي شامل الضريبة"}: <span className="font-semibold text-foreground">{formatAdminCurrency(invoice.totalIncVatSar, language)}</span></p>
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
                  ? "Every completed order in this day is linked at the line level for traceability."
                  : "كل طلب مكتمل في هذا اليوم مرتبط على مستوى السطر لتتبع واضح بين الفاتورة والطلب."}
              </p>
            </div>

            <div className="space-y-3">
              {invoice.lines.map((line) => (
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
                      {formatAdminCurrency(line.orderSubtotalExVatSar, language)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{language === "en" ? "VAT" : "الضريبة"}</p>
                    <p className="font-semibold text-foreground">
                      {formatAdminCurrency(line.orderVatAmountSar, language)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{language === "en" ? "Total" : "الإجمالي"}</p>
                    <p className="font-semibold text-foreground">
                      {formatAdminCurrency(line.orderTotalIncVatSar, language)}
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

export default HotelInvoiceDetailsDrawer;
