import { Badge } from "@/components/ui/badge";
import {
  HotelInvoiceStatus,
  ProviderStatementStatus,
  hotelInvoiceStatusLabelsAr,
  providerStatementStatusLabelsAr,
} from "@/features/orders/model";

interface FinanceStatusBadgeProps {
  status: HotelInvoiceStatus | ProviderStatementStatus;
}

const FinanceStatusBadge = ({ status }: FinanceStatusBadgeProps) => {
  const isPositive =
    status === HotelInvoiceStatus.Collected || status === ProviderStatementStatus.Paid;

  const label =
    status in hotelInvoiceStatusLabelsAr
      ? hotelInvoiceStatusLabelsAr[status as HotelInvoiceStatus]
      : providerStatementStatusLabelsAr[status as ProviderStatementStatus];

  return (
    <Badge
      variant={isPositive ? "secondary" : "outline"}
      className={
        isPositive
          ? "border-success/20 bg-success/10 text-success"
          : "border-warning/20 bg-warning/10 text-warning"
      }
    >
      {label}
    </Badge>
  );
};

export default FinanceStatusBadge;
