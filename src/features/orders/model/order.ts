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
import type { OrderFinancialSnapshot } from "@/features/orders/model/finance";
import type { Settlement } from "@/features/orders/model/settlement";
import type {
  OrderProviderSlaSnapshot,
  OrderRequiredSlaSnapshot,
  OrderSlaSummary,
  SLAHistory,
} from "@/features/orders/model/sla";
import { ServiceBillingUnit } from "@/features/orders/model/service";
import type { SaudiCityId, SaudiDistrictId } from "@/features/orders/model/location-catalog";

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
  cityId?: SaudiCityId;
  city: string;
  districtId?: SaudiDistrictId;
  district?: string;
  latitude?: number;
  longitude?: number;
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
  requiredSla?: OrderRequiredSlaSnapshot;
  providerSla?: OrderProviderSlaSnapshot;
  summary?: OrderSlaSummary;
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
  roomNumber?: string;
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
  hotelFinancialSnapshot?: OrderFinancialSnapshot;
  providerFinancialSnapshot?: OrderFinancialSnapshot;
  hotelInvoiceId?: string;
  providerStatementId?: string;
  billedAt?: ISODateString;
  settledAt?: ISODateString;
  settlement?: Settlement;
}

export interface CreateOrderItemInput {
  serviceId: string;
  quantity: number;
}

export interface CreateOrderInput {
  hotelId: string;
  roomNumber: string;
  items: CreateOrderItemInput[];
  pickupAt: ISODateString;
  notesAr?: string;
  assignmentMode: OrderAssignmentMode.Auto;
  selectedProviderId?: never;
  priority?: OrderPriority;
}

export interface CreateHotelOrderInput {
  hotelId?: string;
  roomNumber: string;
  items: CreateOrderItemInput[];
  serviceIds?: string[];
  itemCount?: number;
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
