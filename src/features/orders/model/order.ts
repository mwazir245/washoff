import type { Assignment, AssignmentHistory, ReassignmentEvent } from "@/features/orders/model/assignment";
import type {
  ActorRole,
  AuditFields,
  CurrencyCode,
  ISODateString,
  LocalizedText,
} from "@/features/orders/model/common";
import { OrderStatus } from "@/features/orders/model/lifecycle";
import type { MatchingLog } from "@/features/orders/model/matching";
import type { Settlement } from "@/features/orders/model/settlement";
import type { SLAHistory } from "@/features/orders/model/sla";
import { ServiceBillingUnit } from "@/features/orders/model/service";

export enum OrderAssignmentMode {
  Auto = "auto",
}

export enum OrderPriority {
  Standard = "standard",
  Urgent = "urgent",
  Critical = "critical",
}

export interface OrderPartySnapshot {
  id: string;
  displayName: LocalizedText;
  city: string;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: LocalizedText;
  quantity: number;
  unit: ServiceBillingUnit;
  unitPriceSar: number;
  estimatedLineTotalSar: number;
  notesAr?: string;
}

export interface OrderSlaWindow {
  responseDueAt?: ISODateString;
  pickupTargetAt?: ISODateString;
  deliveryTargetAt?: ISODateString;
  completionTargetAt?: ISODateString;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedAt: ISODateString;
  actorRole: ActorRole;
  notesAr?: string;
}

export interface Order extends AuditFields {
  id: string;
  hotelId: string;
  hotelSnapshot: OrderPartySnapshot;
  providerId?: string;
  providerSnapshot?: OrderPartySnapshot;
  assignmentMode: OrderAssignmentMode;
  selectedProviderId?: never;
  status: OrderStatus;
  priority: OrderPriority;
  items: OrderItem[];
  totalItemCount: number;
  currency: CurrencyCode;
  estimatedSubtotalSar: number;
  pickupAt: ISODateString;
  notesAr?: string;
  statusUpdatedAt: ISODateString;
  progressPercent?: number;
  activeAssignmentId?: string;
  activeAssignment?: Assignment;
  assignmentHistory: AssignmentHistory[];
  statusHistory?: OrderStatusHistoryEntry[];
  matchingLogs: MatchingLog[];
  slaWindow: OrderSlaWindow;
  slaHistory: SLAHistory[];
  reassignmentEvents: ReassignmentEvent[];
  settlement?: Settlement;
}

export interface CreateOrderItemInput {
  serviceId: string;
  quantity: number;
}

export interface CreateOrderInput {
  hotelId: string;
  items: CreateOrderItemInput[];
  pickupAt: ISODateString;
  notesAr?: string;
  assignmentMode: OrderAssignmentMode.Auto;
  selectedProviderId?: never;
  priority?: OrderPriority;
}

export interface CreateHotelOrderInput {
  hotelId?: string;
  serviceIds: string[];
  itemCount: number;
  pickupAt: ISODateString;
  notes?: string;
  notesAr?: string;
  assignmentMode?: OrderAssignmentMode.Auto;
  selectedProviderId?: never;
  priority?: OrderPriority;
}

export const getOrderServiceNames = (order: Pick<Order, "items">) => {
  return order.items.map((item) => item.serviceName.ar);
};

export const getOrderQuantityTotal = (order: Pick<Order, "items" | "totalItemCount">) => {
  if (typeof order.totalItemCount === "number") {
    return order.totalItemCount;
  }

  return order.items.reduce((sum, item) => sum + item.quantity, 0);
};

export type LaundryOrder = Order;
