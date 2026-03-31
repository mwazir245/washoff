import type { ActorRole, CurrencyCode, ISODateString } from "@/features/orders/model/common";

export const WASHOFF_VAT_RATE = 0.15;
export const WASHOFF_VAT_PERCENT = 15;
export const WASHOFF_FINANCE_CURRENCY: CurrencyCode = "SAR";

export type OrderFinancialPricingSource = "hotel_contract" | "provider_approved_offering";

export enum HotelInvoiceStatus {
  Issued = "issued",
  Collected = "collected",
}

export enum ProviderStatementStatus {
  PendingPayment = "pending_payment",
  Paid = "paid",
}

export const hotelInvoiceStatusLabelsAr: Record<HotelInvoiceStatus, string> = {
  [HotelInvoiceStatus.Issued]: "مصدرة",
  [HotelInvoiceStatus.Collected]: "تم التحصيل",
};

export const providerStatementStatusLabelsAr: Record<ProviderStatementStatus, string> = {
  [ProviderStatementStatus.PendingPayment]: "بانتظار السداد",
  [ProviderStatementStatus.Paid]: "تم السداد",
};

export interface OrderFinancialLineSnapshot {
  id: string;
  orderItemId: string;
  serviceId: string;
  serviceNameAr: string;
  quantity: number;
  unitPriceExVatSar: number;
  subtotalExVatSar: number;
  vatAmountSar: number;
  totalIncVatSar: number;
}

export interface OrderFinancialSnapshot {
  currencyCode: CurrencyCode;
  vatRate: number;
  pricingSource: OrderFinancialPricingSource;
  lockedAt: ISODateString;
  lines: OrderFinancialLineSnapshot[];
  subtotalExVatSar: number;
  vatAmountSar: number;
  totalIncVatSar: number;
}

export interface FinancialDocumentPartySnapshot {
  id: string;
  displayNameAr: string;
  legalNameAr?: string;
  addressLineAr?: string;
  city?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
}

export interface FinancialDocumentDownloadReference {
  objectId: string;
  downloadPath: string;
  generatedAt: ISODateString;
  qrPayloadAr: string;
}

export interface HotelInvoiceOrderLine {
  id: string;
  invoiceId: string;
  orderId: string;
  roomNumber?: string;
  orderSubtotalExVatSar: number;
  orderVatAmountSar: number;
  orderTotalIncVatSar: number;
}

export interface ProviderStatementOrderLine {
  id: string;
  statementId: string;
  orderId: string;
  roomNumber?: string;
  providerSubtotalExVatSar: number;
  providerVatAmountSar: number;
  providerTotalIncVatSar: number;
}

export interface HotelInvoice {
  id: string;
  invoiceNumber: string;
  hotelId: string;
  invoiceDate: string;
  currencyCode: CurrencyCode;
  status: HotelInvoiceStatus;
  statusLabelAr: string;
  orderCount: number;
  subtotalExVatSar: number;
  vatAmountSar: number;
  totalIncVatSar: number;
  seller: FinancialDocumentPartySnapshot;
  buyer: FinancialDocumentPartySnapshot;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  issuedAt: ISODateString;
  collectedAt?: ISODateString;
  collectedByAccountId?: string;
  collectedByRole?: ActorRole;
  pdf?: FinancialDocumentDownloadReference;
  lines: HotelInvoiceOrderLine[];
}

export interface ProviderSettlementStatement {
  id: string;
  statementNumber: string;
  providerId: string;
  statementDate: string;
  currencyCode: CurrencyCode;
  status: ProviderStatementStatus;
  statusLabelAr: string;
  orderCount: number;
  subtotalExVatSar: number;
  vatAmountSar: number;
  totalIncVatSar: number;
  provider: FinancialDocumentPartySnapshot;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  paidAt?: ISODateString;
  paidByAccountId?: string;
  paidByRole?: ActorRole;
  pdf?: FinancialDocumentDownloadReference;
  lines: ProviderStatementOrderLine[];
}

export interface FinanceAuditEntry {
  id: string;
  entityType: "hotel_invoice" | "provider_statement";
  entityId: string;
  action: "issued" | "collected" | "pending_payment" | "paid";
  previousStatus?: string;
  nextStatus: string;
  actorAccountId?: string;
  actorRole?: ActorRole | "system";
  occurredAt: ISODateString;
  notesAr?: string;
  metadataJson?: string;
}

export interface AdminFinanceSummary {
  todayHotelInvoiceTotalIncVatSar: number;
  todayProviderStatementTotalIncVatSar: number;
  grossMarginExVatSar: number;
  outputVatTotalSar: number;
  inputVatTotalSar: number;
  netVatPositionSar: number;
}

export const roundFinanceAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateVatAmount = (subtotalExVatSar: number) =>
  roundFinanceAmount(roundFinanceAmount(subtotalExVatSar) * WASHOFF_VAT_RATE);

export const calculateInclusiveTotal = (subtotalExVatSar: number, vatAmountSar: number) =>
  roundFinanceAmount(roundFinanceAmount(subtotalExVatSar) + roundFinanceAmount(vatAmountSar));

export const buildFinancialBreakdown = (subtotalExVatSar: number) => {
  const normalizedSubtotalExVatSar = roundFinanceAmount(subtotalExVatSar);
  const vatAmountSar = calculateVatAmount(normalizedSubtotalExVatSar);
  const totalIncVatSar = calculateInclusiveTotal(normalizedSubtotalExVatSar, vatAmountSar);

  return {
    subtotalExVatSar: normalizedSubtotalExVatSar,
    vatAmountSar,
    totalIncVatSar,
  };
};

export const buildOrderFinancialSnapshot = ({
  pricingSource,
  lockedAt,
  lines,
}: {
  pricingSource: OrderFinancialPricingSource;
  lockedAt: ISODateString;
  lines: OrderFinancialLineSnapshot[];
}): OrderFinancialSnapshot => {
  const subtotalExVatSar = roundFinanceAmount(
    lines.reduce((sum, line) => sum + line.subtotalExVatSar, 0),
  );
  const vatAmountSar = roundFinanceAmount(lines.reduce((sum, line) => sum + line.vatAmountSar, 0));
  const totalIncVatSar = roundFinanceAmount(lines.reduce((sum, line) => sum + line.totalIncVatSar, 0));

  return {
    currencyCode: WASHOFF_FINANCE_CURRENCY,
    vatRate: WASHOFF_VAT_RATE,
    pricingSource,
    lockedAt,
    lines,
    subtotalExVatSar,
    vatAmountSar,
    totalIncVatSar,
  };
};

export const buildDailyFinanceDateKey = (value: ISODateString) => value.slice(0, 10);

const sanitizeDocumentNumberSegment = (value: string) =>
  value.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();

export const buildHotelInvoiceId = (hotelId: string, invoiceDate: string) =>
  `hotel-invoice-${hotelId}-${invoiceDate}`;

export const buildProviderStatementId = (providerId: string, statementDate: string) =>
  `provider-statement-${providerId}-${statementDate}`;

export const buildHotelInvoiceNumber = (hotelId: string, invoiceDate: string) =>
  `INV-${invoiceDate.replace(/-/g, "")}-${sanitizeDocumentNumberSegment(hotelId)}`;

export const buildProviderStatementNumber = (providerId: string, statementDate: string) =>
  `PST-${statementDate.replace(/-/g, "")}-${sanitizeDocumentNumberSegment(providerId)}`;

export const appendHotelInvoiceLine = (
  invoice: HotelInvoice,
  line: HotelInvoiceOrderLine,
  timestamp: ISODateString,
): HotelInvoice => {
  if (invoice.lines.some((existingLine) => existingLine.orderId === line.orderId)) {
    return invoice;
  }

  const lines = [...invoice.lines, line];

  return {
    ...invoice,
    lines,
    orderCount: lines.length,
    subtotalExVatSar: roundFinanceAmount(lines.reduce((sum, entry) => sum + entry.orderSubtotalExVatSar, 0)),
    vatAmountSar: roundFinanceAmount(lines.reduce((sum, entry) => sum + entry.orderVatAmountSar, 0)),
    totalIncVatSar: roundFinanceAmount(lines.reduce((sum, entry) => sum + entry.orderTotalIncVatSar, 0)),
    updatedAt: timestamp,
  };
};

export const appendProviderStatementLine = (
  statement: ProviderSettlementStatement,
  line: ProviderStatementOrderLine,
  timestamp: ISODateString,
): ProviderSettlementStatement => {
  if (statement.lines.some((existingLine) => existingLine.orderId === line.orderId)) {
    return statement;
  }

  const lines = [...statement.lines, line];

  return {
    ...statement,
    lines,
    orderCount: lines.length,
    subtotalExVatSar: roundFinanceAmount(
      lines.reduce((sum, entry) => sum + entry.providerSubtotalExVatSar, 0),
    ),
    vatAmountSar: roundFinanceAmount(lines.reduce((sum, entry) => sum + entry.providerVatAmountSar, 0)),
    totalIncVatSar: roundFinanceAmount(
      lines.reduce((sum, entry) => sum + entry.providerTotalIncVatSar, 0),
    ),
    updatedAt: timestamp,
  };
};
