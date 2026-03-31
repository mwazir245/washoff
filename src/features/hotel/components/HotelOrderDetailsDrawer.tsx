import { Building2, ClipboardList, MapPinned, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import OrderExecutionTimeline from "@/features/orders/components/OrderExecutionTimeline";
import { OrderStatus } from "@/features/orders/model";
import type { LaundryOrder } from "@/features/orders/model/order";
import type { ServiceCatalogItem } from "@/features/orders/model/service";
import DetailsDrawer from "@/shared/components/data-display/DetailsDrawer";
import { formatDateTimeLabel, formatSar } from "@/shared/lib/formatters";

interface HotelOrderDetailsDrawerProps {
  order?: LaundryOrder;
  services: ServiceCatalogItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCompletion: (orderId: string) => Promise<void> | void;
  isConfirming?: boolean;
}

const splitLegacyServiceName = (value: string) => {
  const [productName, serviceTypeName] = value.split(" - ").map((part) => part.trim());

  return {
    productName: productName || value,
    serviceTypeName: serviceTypeName || value,
  };
};

const HotelOrderDetailsDrawer = ({
  order,
  services,
  open,
  onOpenChange,
  onConfirmCompletion,
  isConfirming = false,
}: HotelOrderDetailsDrawerProps) => {
  const serviceById = new Map(services.map((service) => [service.id, service]));

  if (!order) {
    return null;
  }

  const itemRows = order.items.map((item) => {
    const service = serviceById.get(item.serviceId);
    const fallback = splitLegacyServiceName(item.serviceName.ar);

    return {
      id: item.id,
      productName: service?.productName?.ar ?? fallback.productName,
      serviceTypeName: service?.serviceTypeName?.ar ?? fallback.serviceTypeName,
      quantity: item.quantity,
      lineTotalSar: item.estimatedLineTotalSar,
    };
  });

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`تفاصيل الطلب ${order.id}`}
      description="عرض تشغيلي موجز للطلب من منظور الفندق: الملخص، العناصر، مسار التنفيذ، والمزوّد المعين."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="info-panel px-4 py-4">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">رقم الطلب</p>
          <p className="mt-2 text-lg font-bold text-foreground">{order.id}</p>
        </div>
        <div className="info-panel px-4 py-4">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">رقم الغرفة</p>
          <p className="mt-2 text-lg font-bold text-foreground">{order.roomNumber ?? "غير محدد"}</p>
        </div>
        <div className="info-panel px-4 py-4">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">الحالة الحالية</p>
          <div className="mt-2">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
        <div className="info-panel px-4 py-4">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">السعر المرجعي</p>
          <p className="mt-2 text-lg font-bold text-foreground">{formatSar(order.estimatedSubtotalSar)}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-white/90 p-5">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardList className="h-5 w-5" />
            <h3 className="text-base font-semibold text-foreground">ملخص الطلب</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">وقت الإنشاء</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDateTimeLabel(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">آخر تحديث</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDateTimeLabel(order.updatedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">وقت الاستلام المطلوب</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDateTimeLabel(order.pickupAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">إجمالي القطع</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{order.totalItemCount} قطعة</p>
            </div>
          </div>

          {order.notesAr ? (
            <div className="rounded-[1.15rem] border border-border/70 bg-muted/25 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">ملاحظات</p>
              <p className="mt-2 text-sm leading-7 text-foreground">{order.notesAr}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-white/90 p-5">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <h3 className="text-base font-semibold text-foreground">بيانات المزوّد</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">المزوّد المعين</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {order.providerSnapshot?.displayName.ar ?? "بانتظار الإسناد"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">المدينة</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{order.providerSnapshot?.city ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">المهلة التشغيلية الحالية</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {order.activeAssignment?.responseDueAt ? formatDateTimeLabel(order.activeAssignment.responseDueAt) : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-border/70 bg-white/90 p-5">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <PackageCheck className="h-5 w-5" />
          <h3 className="text-base font-semibold text-foreground">تفاصيل العناصر</h3>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/35">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-semibold tracking-[0.08em] text-muted-foreground">المنتج</th>
                <th className="px-4 py-3 text-start text-xs font-semibold tracking-[0.08em] text-muted-foreground">نوع الخدمة</th>
                <th className="px-4 py-3 text-start text-xs font-semibold tracking-[0.08em] text-muted-foreground">الكمية</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((item) => (
                <tr key={item.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-semibold text-foreground">{item.productName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.serviceTypeName}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <OrderExecutionTimeline order={order} variant="hotel" />

      <section className="rounded-[1.5rem] border border-border/70 bg-white/90 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <MapPinned className="h-5 w-5" />
              <h3 className="text-base font-semibold text-foreground">إجراء الفندق</h3>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              يظهر هذا الإجراء فقط بعد وصول الطلب إلى الفندق، وعند تنفيذه يتم اعتماد اكتمال الطلب نهائيًا.
            </p>
          </div>

          {order.status === OrderStatus.Delivered ? (
            <Button disabled={isConfirming} onClick={() => void onConfirmCompletion(order.id)}>
              تم التسليم للنزيل
            </Button>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">لا يوجد إجراء متاح حاليًا</span>
          )}
        </div>
      </section>
    </DetailsDrawer>
  );
};

export default HotelOrderDetailsDrawer;
