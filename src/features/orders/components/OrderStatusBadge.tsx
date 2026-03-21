import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/features/orders/model/lifecycle";
import { getOrderStatusMeta } from "@/features/orders/model/order-status";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const config = getOrderStatusMeta(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default OrderStatusBadge;
