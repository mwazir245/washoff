import { OrderStatus } from "@/features/orders/model/lifecycle";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface OrderStatusMeta {
  label: string;
  variant: BadgeVariant;
}

const orderStatusMeta: Record<OrderStatus, OrderStatusMeta> = {
  [OrderStatus.Submitted]: { label: "تم الإرسال", variant: "outline" },
  [OrderStatus.AutoMatching]: { label: "المطابقة التلقائية", variant: "secondary" },
  [OrderStatus.PendingCapacity]: { label: "بانتظار السعة", variant: "outline" },
  [OrderStatus.Assigned]: { label: "تم التعيين", variant: "default" },
  [OrderStatus.Accepted]: { label: "مقبول", variant: "default" },
  [OrderStatus.PickupScheduled]: { label: "تمت جدولة الاستلام", variant: "secondary" },
  [OrderStatus.PickedUp]: { label: "تم الاستلام", variant: "secondary" },
  [OrderStatus.InProcessing]: { label: "قيد المعالجة", variant: "secondary" },
  [OrderStatus.QualityCheck]: { label: "فحص الجودة", variant: "secondary" },
  [OrderStatus.OutForDelivery]: { label: "في الطريق", variant: "secondary" },
  [OrderStatus.Delivered]: { label: "تم التسليم", variant: "default" },
  [OrderStatus.Completed]: { label: "مكتمل", variant: "default" },
  [OrderStatus.Cancelled]: { label: "ملغي", variant: "destructive" },
  [OrderStatus.Reassigned]: { label: "إعادة إسناد", variant: "outline" },
  [OrderStatus.Disputed]: { label: "نزاع", variant: "destructive" },
};

export const getOrderStatusMeta = (status: OrderStatus): OrderStatusMeta => {
  return orderStatusMeta[status];
};
