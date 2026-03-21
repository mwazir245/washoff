import type { CurrencyCode, ISODateString, LocalizedText } from "@/features/orders/model/common";

export enum SettlementStatus {
  Pending = "pending",
  Generated = "generated",
  Approved = "approved",
  Paid = "paid",
  Failed = "failed",
  Disputed = "disputed",
}

export interface SettlementLineItem {
  id: string;
  orderItemId?: string;
  description: LocalizedText;
  quantity: number;
  unitPriceSar: number;
  totalSar: number;
}

export interface Settlement {
  id: string;
  orderId: string;
  hotelId: string;
  providerId: string;
  currency: CurrencyCode;
  status: SettlementStatus;
  lineItems: SettlementLineItem[];
  subtotalSar: number;
  platformFeeSar: number;
  adjustmentsSar: number;
  totalSar: number;
  generatedAt: ISODateString;
  dueAt?: ISODateString;
  paidAt?: ISODateString;
}
