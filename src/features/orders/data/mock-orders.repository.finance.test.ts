import { beforeEach, describe, expect, it } from "vitest";
import { storeClientSession, clearClientSession } from "@/features/auth/infrastructure/client-auth-storage";
import { OrderStatus } from "@/features/orders/model";
import {
  acceptIncomingOrder,
  advanceProviderOrderExecution,
  confirmHotelOrderCompletion,
  createHotelOrder,
  getAdminFinanceData,
  getHotelBillingData,
  getProviderFinanceData,
  login,
  markHotelInvoiceCollected,
  markProviderStatementPaid,
  resetMockOrdersRepository,
} from "@/features/orders/data/mock-orders.repository";

const DEFAULT_REQUESTED_SERVICE_ID = "svc-thobe-dry_clean";
const DEFAULT_PASSWORD = "Washoff123!";
const DEFAULT_ADMIN_PASSWORD = "Zajillema2@123";

const signInAs = async (email: string, password = DEFAULT_PASSWORD) => {
  const session = await login({ email, password });
  storeClientSession(session);
  return session;
};

const completeOrderForFinance = async (roomNumber: string, quantity: number) => {
  await signInAs("hotel.ops@washoff.sa");
  const createdOrder = await createHotelOrder({
    roomNumber,
    items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity }],
    pickupAt: "2030-03-20T10:00:00+03:00",
    notes: "Finance validation order",
  });

  await signInAs("provider.ops@washoff.sa");
  await acceptIncomingOrder(createdOrder.id);
  await advanceProviderOrderExecution({ orderId: createdOrder.id, nextStatus: OrderStatus.PickupScheduled });
  await advanceProviderOrderExecution({ orderId: createdOrder.id, nextStatus: OrderStatus.PickedUp });
  await advanceProviderOrderExecution({ orderId: createdOrder.id, nextStatus: OrderStatus.InProcessing });
  await advanceProviderOrderExecution({ orderId: createdOrder.id, nextStatus: OrderStatus.QualityCheck });
  await advanceProviderOrderExecution({ orderId: createdOrder.id, nextStatus: OrderStatus.OutForDelivery });
  await advanceProviderOrderExecution({ orderId: createdOrder.id, nextStatus: OrderStatus.Delivered });

  await signInAs("hotel.ops@washoff.sa");
  return confirmHotelOrderCompletion({ orderId: createdOrder.id });
};

describe("mockOrdersRepository finance layer", () => {
  beforeEach(() => {
    resetMockOrdersRepository();
    clearClientSession();
  });

  it("creates daily hotel invoices and provider statements from completed orders without duplicate inclusion", async () => {
    const completedOrder = await completeOrderForFinance("1810", 10);

    const hotelBilling = await getHotelBillingData();

    await signInAs("provider.ops@washoff.sa");
    const providerFinance = await getProviderFinanceData();

    const invoice = hotelBilling.invoices.find((entry) => entry.id === completedOrder.hotelInvoiceId);
    const statement = providerFinance.statements.find((entry) => entry.id === completedOrder.providerStatementId);

    expect(completedOrder.status).toBe(OrderStatus.Completed);
    expect(completedOrder.hotelFinancialSnapshot?.pricingSource).toBe("hotel_contract");
    expect(completedOrder.providerFinancialSnapshot?.pricingSource).toBe("provider_approved_offering");
    expect(invoice).toBeDefined();
    expect(statement).toBeDefined();
    expect(invoice?.lines).toHaveLength(1);
    expect(statement?.lines).toHaveLength(1);
    expect(invoice?.lines[0]?.orderId).toBe(completedOrder.id);
    expect(statement?.lines[0]?.orderId).toBe(completedOrder.id);
    expect(invoice?.subtotalExVatSar).toBe(completedOrder.hotelFinancialSnapshot?.subtotalExVatSar);
    expect(invoice?.vatAmountSar).toBe(completedOrder.hotelFinancialSnapshot?.vatAmountSar);
    expect(invoice?.totalIncVatSar).toBe(completedOrder.hotelFinancialSnapshot?.totalIncVatSar);
    expect(statement?.subtotalExVatSar).toBe(completedOrder.providerFinancialSnapshot?.subtotalExVatSar);
    expect(statement?.vatAmountSar).toBe(completedOrder.providerFinancialSnapshot?.vatAmountSar);
    expect(statement?.totalIncVatSar).toBe(completedOrder.providerFinancialSnapshot?.totalIncVatSar);
    expect(invoice?.vatAmountSar ?? 0).toBeCloseTo((invoice?.subtotalExVatSar ?? 0) * 0.15, 1);
    expect(invoice?.totalIncVatSar ?? 0).toBeCloseTo(
      (invoice?.subtotalExVatSar ?? 0) + (invoice?.vatAmountSar ?? 0),
      2,
    );
    expect(statement?.vatAmountSar ?? 0).toBeCloseTo(
      (statement?.subtotalExVatSar ?? 0) * 0.15,
      1,
    );
    expect(statement?.totalIncVatSar ?? 0).toBeCloseTo(
      (statement?.subtotalExVatSar ?? 0) + (statement?.vatAmountSar ?? 0),
      2,
    );

    await signInAs("hotel.ops@washoff.sa");
    const hotelBillingAfterReload = await getHotelBillingData();
    expect(
      hotelBillingAfterReload.invoices.find((entry) => entry.id === completedOrder.hotelInvoiceId)?.lines,
    ).toHaveLength(1);

    await signInAs("provider.ops@washoff.sa");
    const providerFinanceAfterReload = await getProviderFinanceData();
    expect(
      providerFinanceAfterReload.statements.find((entry) => entry.id === completedOrder.providerStatementId)?.lines,
    ).toHaveLength(1);
  });

  it("lets admin mark invoices as collected and provider statements as paid while keeping finance views separated", async () => {
    const completedOrder = await completeOrderForFinance("1811", 6);

    await signInAs("mmekawe@hotmail.com", DEFAULT_ADMIN_PASSWORD);
    const collectedInvoice = await markHotelInvoiceCollected({ invoiceId: completedOrder.hotelInvoiceId! });
    const paidStatement = await markProviderStatementPaid({ statementId: completedOrder.providerStatementId! });
    const adminFinance = await getAdminFinanceData();

    expect(collectedInvoice.status).toBe("collected");
    expect(collectedInvoice.collectedAt).toBeDefined();
    expect(paidStatement.status).toBe("paid");
    expect(paidStatement.paidAt).toBeDefined();
    expect(adminFinance.hotelInvoices.some((entry) => entry.id === completedOrder.hotelInvoiceId)).toBe(true);
    expect(
      adminFinance.providerStatements.some((entry) => entry.id === completedOrder.providerStatementId),
    ).toBe(true);

    await signInAs("hotel.ops@washoff.sa");
    const hotelBilling = await getHotelBillingData();
    const hotelInvoice = hotelBilling.invoices.find((entry) => entry.id === completedOrder.hotelInvoiceId);

    expect(hotelInvoice?.status).toBe("collected");
    expect("provider" in (hotelInvoice ?? {})).toBe(false);

    await signInAs("provider.ops@washoff.sa");
    const providerFinance = await getProviderFinanceData();
    const providerStatement = providerFinance.statements.find(
      (entry) => entry.id === completedOrder.providerStatementId,
    );

    expect(providerStatement?.status).toBe("paid");
    expect("buyer" in (providerStatement ?? {})).toBe(false);
  });
});
