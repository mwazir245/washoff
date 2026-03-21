import { ArrowLeftRight } from "lucide-react";
import type { ReassignmentActivityItem } from "@/features/admin/hooks/useAdminDashboard";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import EmptyState from "@/shared/components/feedback/EmptyState";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import { formatDateTimeLabel } from "@/shared/lib/formatters";

interface AdminReassignmentTableProps {
  items: ReassignmentActivityItem[];
}

const AdminReassignmentTable = ({ items }: AdminReassignmentTableProps) => {
  if (items.length === 0) {
    return (
      <div className="surface-card px-6 py-6 sm:px-8">
        <EmptyState
          title="لا توجد إعادات إسناد حديثة"
          description="ستظهر هنا أسباب إعادة التوجيه بين المزودين ومحاولات البدائل حال حدوثها."
        />
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5 sm:px-8">
        <SectionHeader
          eyebrow="إعادة الإسناد"
          title="آخر التحويلات التشغيلية بين المزودين"
          description="يعرض هذا الجدول سبب التحويل، المزود السابق، المزود البديل إن وجد، وحالة الطلب الحالية بعد الإجراء."
        />
      </div>

      <div className="overflow-x-auto">
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>الطلب</th>
              <th>سبب التحويل</th>
              <th>من</th>
              <th>إلى</th>
              <th>المحاولة</th>
              <th>الحالة الحالية</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{item.orderId}</p>
                    <p className="text-xs text-muted-foreground">طلب مراقب عبر لوحة الإدارة</p>
                  </div>
                </td>
                <td>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{item.reasonLabel}</p>
                    {item.notesAr ? <p className="max-w-md text-xs leading-6 text-muted-foreground">{item.notesAr}</p> : null}
                  </div>
                </td>
                <td className="text-muted-foreground">{item.previousProviderName ?? "غير محدد"}</td>
                <td>
                  {item.nextProviderName ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      {item.nextProviderName}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">لم يتوفر بديل</span>
                  )}
                </td>
                <td className="font-semibold text-foreground">{item.attemptNumber}</td>
                <td>
                  <OrderStatusBadge status={item.currentOrderStatus} />
                </td>
                <td className="text-muted-foreground">{formatDateTimeLabel(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReassignmentTable;
