import { beforeEach, describe, expect, it } from "vitest";
import {
  clearClientSession,
  storeClientSession,
} from "@/features/auth/infrastructure/client-auth-storage";
import { AccountTokenValidationStatus } from "@/features/auth/model";
import {
  AssignmentStatus,
  EligibilityReasonCode,
  OnboardingStatus,
  OrderStatus,
  ReassignmentReason,
} from "@/features/orders/model";
import {
  acceptIncomingOrder,
  activateAccount,
  advanceProviderOrderExecution,
  approveHotelRegistration,
  approveProviderRegistration,
  approveProviderServicePricing,
  confirmHotelOrderCompletion,
  createHotelOrder,
  expirePendingAssignment,
  getAdminFinanceData,
  getHotelBillingData,
  getHotelProfile,
  getPlatformPageContent,
  getPlatformSettings,
  getProviderFinanceData,
  getProviderPricingAdminData,
  getProviderProfile,
  listIdentityAuditEvents,
  markHotelInvoiceCollected,
  markProviderStatementPaid,
  listPlatformContentAudit,
  listPlatformContentEntries,
  listPlatformSettingsAudit,
  listProviderIncomingOrders,
  listProviderRegistrations,
  login,
  reactivateAccount,
  registerHotel,
  registerProvider,
  rejectIncomingOrder,
  requestPasswordReset,
  resetPassword,
  resetMockOrdersRepository,
  resolveAccountSession,
  suspendAccount,
  updatePlatformContentEntry,
  updatePlatformSettings,
  validateActivationToken,
  validateResetPasswordToken,
} from "@/features/orders/data/mock-orders.repository";

const DEFAULT_PASSWORD = "Washoff123!";
const DEFAULT_ADMIN_PASSWORD = "Zajillema2@123";
const DEFAULT_REQUESTED_SERVICE_ID = "svc-thobe-dry_clean";
const DEFAULT_PROVIDER_SERVICE_PRICING = [
  { serviceId: DEFAULT_REQUESTED_SERVICE_ID, proposedPriceSar: 12.65 },
  { serviceId: "svc-shirt-iron", proposedPriceSar: 3.45 },
  { serviceId: "svc-bedsheet-wash_and_iron", proposedPriceSar: 11.5 },
];

const extractActivationToken = (activationPath: string) => {
  return new URL(activationPath, "https://washoff.local").searchParams.get("token") ?? "";
};

const extractResetToken = (resetPath: string) => {
  return new URL(resetPath, "https://washoff.local").searchParams.get("token") ?? "";
};

const signInAs = async (email: string, password = DEFAULT_PASSWORD) => {
  const session = await login({ email, password });
  storeClientSession(session);
  return session;
};

const approvePendingPricingForProvider = async (providerId: string) => {
  const review = await getProviderPricingAdminData();

  for (const submission of review.pendingReviews.filter((entry) => entry.providerId === providerId)) {
    await approveProviderServicePricing(submission.offeringId);
  }
};

const buildHotelRegistrationInput = (overrides: Record<string, unknown> = {}) => ({
  hotelName: "فندق النخبة",
  legalEntityName: "شركة الفندق التشغيلية",
  city: "الرياض",
  hotelClassification: "five_star" as const,
  roomCount: 220,
  taxRegistrationNumber: "300112223300003",
  serviceLevel: "express" as const,
  operatingHours: "24/7",
  requiresDailyPickup: true,
  addressText: "حي العليا - الرياض",
  latitude: 24.7136,
  longitude: 46.6753,
  pickupLocation: "منطقة الخدمات الخلفية",
  hasLoadingArea: true,
  accessNotes: "الدخول من بوابة الخدمات.",
  commercialRegistrationNumber: "1010998877",
  commercialRegistrationFile: {
    fileName: "commercial-registration.pdf",
    mimeType: "application/pdf",
    sizeBytes: 128_000,
    contentBase64: "JVBERi0xLjQKJcTl8uXr",
  },
  contactPersonName: "سارة",
  contactEmail: "ops@elite-hotel.sa",
  contactPhone: "0500000000",
  ...overrides,
});
/*
  it("creates daily hotel invoices and provider statements from completed orders without duplicate inclusion", async () => {
    await signInAs("hotel.ops@washoff.sa");
    const createdOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1810",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 10 }],
        notes: "Billing validation order",
      }),
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
    const completedOrder = await confirmHotelOrderCompletion({ orderId: createdOrder.id });
    const hotelBilling = await getHotelBillingData();

    await signInAs("provider.ops@washoff.sa");
    const providerFinance = await getProviderFinanceData();

    const invoice = hotelBilling.invoices.find((entry) => entry.id === completedOrder.hotelInvoiceId);
    const statement = providerFinance.statements.find(
      (entry) => entry.id === completedOrder.providerStatementId,
    );

    expect(completedOrder.status).toBe(OrderStatus.Completed);
    expect(completedOrder.hotelFinancialSnapshot?.pricingSource).toBe("hotel_contract");
    expect(completedOrder.providerFinancialSnapshot?.pricingSource).toBe("provider_offering");
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
    expect(invoice?.vatAmountSar).toBe(18.98);
    expect(invoice?.totalIncVatSar).toBe(145.48);
    expect(statement?.vatAmountSar).toBe(18.98);
    expect(statement?.totalIncVatSar).toBe(145.48);

    const hotelBillingAfterReload = await getHotelBillingData();
    expect(
      hotelBillingAfterReload.invoices.find((entry) => entry.id === completedOrder.hotelInvoiceId)?.lines,
    ).toHaveLength(1);

    await signInAs("provider.ops@washoff.sa");
    const providerFinanceAfterReload = await getProviderFinanceData();
    expect(
      providerFinanceAfterReload.statements.find(
        (entry) => entry.id === completedOrder.providerStatementId,
      )?.lines,
    ).toHaveLength(1);
  });

  it("lets admin mark invoices as collected and provider statements as paid while keeping finance views separated", async () => {
    await signInAs("hotel.ops@washoff.sa");
    const createdOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1811",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 6 }],
        notes: "Settlement validation order",
      }),
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
    const completedOrder = await confirmHotelOrderCompletion({ orderId: createdOrder.id });

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

*/
const buildProviderRegistrationInput = (overrides: Record<string, unknown> = {}) => ({
  providerName: "مغسلة السعة الذكية",
  legalEntityName: "شركة المغسلة التشغيلية",
  commercialRegistrationNumber: "1010776655",
  taxRegistrationNumber: "300998877660003",
  city: "الرياض",
  businessPhone: "0550000000",
  businessEmail: "ops@smartwash.sa",
  addressText: "المنطقة الصناعية - الرياض",
  latitude: 24.774265,
  longitude: 46.738586,
  servicePricing: DEFAULT_PROVIDER_SERVICE_PRICING,
  dailyCapacityKg: 180,
  pickupLeadTimeHours: 2,
  executionTimeHours: 18,
  deliveryTimeHours: 4,
  workingDays: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
  workingHoursFrom: "08:00",
  workingHoursTo: "22:00",
  commercialRegistrationFile: {
    fileName: "provider-commercial-registration.pdf",
    mimeType: "application/pdf",
    sizeBytes: 128_000,
    contentBase64: "JVBERi0xLjQKJcTl8uXr",
  },
  bankName: "البنك الأهلي السعودي",
  iban: "SA0380000000608010167519",
  bankAccountHolderName: "شركة المغسلة التشغيلية",
  accountFullName: "عبدالله",
  accountPhone: "0550000000",
  accountEmail: "ops@smartwash.sa",
  ...overrides,
});

const buildHotelOrderCommand = (
  overrides: Partial<{
    hotelId: string;
    roomNumber: string;
    pickupAt: string;
    notes: string;
    items: Array<{ serviceId: string; quantity: number }>;
  }> = {},
) => ({
  hotelId: overrides.hotelId,
  roomNumber: overrides.roomNumber ?? "1208",
  items: overrides.items ?? [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 12 }],
  pickupAt: overrides.pickupAt ?? "2030-03-20T10:00:00+03:00",
  notes: overrides.notes ?? "طلب تشغيلي من لوحة الفندق",
});

describe("mockOrdersRepository reassignment and identity flow", () => {
  beforeEach(() => {
    resetMockOrdersRepository();
    clearClientSession();
  });

  it("creates a hotel order, runs auto-matching, and assigns the best provider when eligible", async () => {
    await signInAs("hotel.ops@washoff.sa");

    const createdOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1208",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 40 }],
        notes: "Handle with care",
      }),
    });

    expect(createdOrder.status).toBe(OrderStatus.Assigned);
    expect(createdOrder.roomNumber).toBe("1208");
    expect(createdOrder.providerId).toBe("provider-1");
    expect(createdOrder.providerSnapshot?.displayName.ar).toBeDefined();
    expect(createdOrder.activeAssignment?.status).toBe(AssignmentStatus.PendingAcceptance);
    expect(createdOrder.slaWindow.responseDueAt).toBeDefined();
    expect(createdOrder.matchingLogs.length).toBeGreaterThan(0);
  });

  it("stores unresolved submissions in pending capacity when no provider is initially eligible", async () => {
    await signInAs("hotel.ops@washoff.sa");

    const createdOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1301",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 340 }],
        notes: "Oversized batch",
      }),
    });

    expect(createdOrder.status).toBe(OrderStatus.PendingCapacity);
    expect(createdOrder.providerId).toBeUndefined();
    expect(createdOrder.activeAssignment).toBeUndefined();
    expect(createdOrder.matchingLogs.some((log) => log.eligibilityResult.blockingReasonsAr.length > 0)).toBe(true);
  });

  it("reassigns to the next eligible provider when the current provider rejects", async () => {
    await signInAs("hotel.ops@washoff.sa");
    const createdOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1401",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 40 }],
        notes: "Handle with care",
      }),
    });

    await signInAs("provider.ops@washoff.sa");
    const providerBeforeReject = await getProviderProfile();
    const reassignedOrder = await rejectIncomingOrder(createdOrder.id);
    const providerAfterReject = await getProviderProfile();

    expect(reassignedOrder.status).toBe(OrderStatus.Assigned);
    expect(reassignedOrder.providerId).toBe("provider-2");
    expect(reassignedOrder.activeAssignment?.attemptNumber).toBe(2);
    expect(reassignedOrder.activeAssignment?.status).toBe(AssignmentStatus.PendingAcceptance);
    expect(reassignedOrder.reassignmentEvents.slice(-1)[0]?.reason).toBe(ReassignmentReason.ProviderRejected);
    expect(reassignedOrder.assignmentHistory.some((history) => history.toStatus === AssignmentStatus.Rejected)).toBe(true);
    expect(providerAfterReject.performance.acceptanceRate).toBeLessThan(providerBeforeReject.performance.acceptanceRate);
    expect(providerAfterReject.performance.rating).toBeLessThan(providerBeforeReject.performance.rating);
  });

  it("expires overdue assignments and auto-assigns the next provider", async () => {
    await signInAs("hotel.ops@washoff.sa");

    const createdOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1501",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 40 }],
        notes: "Handle with care",
      }),
    });
    const expiredOrder = await expirePendingAssignment(
      createdOrder.id,
      new Date(
        new Date(createdOrder.activeAssignment?.responseDueAt ?? createdOrder.createdAt).getTime() + 1000,
      ).toISOString(),
    );

    expect(expiredOrder?.status).toBe(OrderStatus.Assigned);
    expect(expiredOrder?.providerId).toBe("provider-2");
    expect(expiredOrder?.activeAssignment?.attemptNumber).toBe(2);
    expect(expiredOrder?.reassignmentEvents.slice(-1)[0]?.reason).toBe(ReassignmentReason.ProviderExpired);
    expect(expiredOrder?.assignmentHistory.some((history) => history.toStatus === AssignmentStatus.Expired)).toBe(true);
  });

  it("keeps the order unresolved in pending capacity when no alternative provider exists", async () => {
    await signInAs("hotel.ops@washoff.sa");
    const createdOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1508",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 260 }],
        notes: "Large urgent batch",
      }),
    });

    await signInAs("provider.ops@washoff.sa");
    const unresolvedOrder = await rejectIncomingOrder(createdOrder.id);

    expect(unresolvedOrder.status).toBe(OrderStatus.PendingCapacity);
    expect(unresolvedOrder.providerId).toBeUndefined();
    expect(unresolvedOrder.activeAssignment).toBeUndefined();
    expect(unresolvedOrder.reassignmentEvents.slice(-1)[0]?.reason).toBe(ReassignmentReason.ProviderRejected);
    expect(unresolvedOrder.matchingLogs.length).toBeGreaterThan(0);
  });

  it("registers hotels and providers with pending approval and pending account scaffolds by default", async () => {
    const hotelRegistration = await registerHotel(buildHotelRegistrationInput());
    const providerRegistration = await registerProvider(buildProviderRegistrationInput());

    expect(hotelRegistration.hotel.onboarding.status).toBe(OnboardingStatus.PendingApproval);
    expect(hotelRegistration.hotel.active).toBe(false);
    expect(hotelRegistration.hotel.legalEntityName).toBe("شركة الفندق التشغيلية");
    expect(hotelRegistration.hotel.classification).toBe("five_star");
    expect(hotelRegistration.hotel.roomCount).toBe(220);
    expect(hotelRegistration.hotel.compliance.taxRegistrationNumber).toBe("300112223300003");
    expect(hotelRegistration.hotel.operationalProfile.serviceLevel).toBe("express");
    expect(hotelRegistration.hotel.logistics.addressText).toBe("حي العليا - الرياض");
    expect(hotelRegistration.hotel.address.latitude).toBe(24.7136);
    expect(hotelRegistration.hotel.address.longitude).toBe(46.6753);
    expect(hotelRegistration.hotel.compliance.commercialRegistrationNumber).toBe("1010998877");
    expect(hotelRegistration.hotel.compliance.commercialRegistrationFile.fileName).toBe(
      "commercial-registration.pdf",
    );
    expect(hotelRegistration.hotel.compliance.delegationStatus).toBe("not_provided");
    expect(hotelRegistration.account.statusLabelAr).toBeDefined();
    expect(hotelRegistration.account.activationPath).toBeUndefined();

    expect(providerRegistration.provider.onboarding.status).toBe(OnboardingStatus.PendingApproval);
    expect(providerRegistration.provider.active).toBe(false);
    expect(providerRegistration.provider.businessProfile.commercialRegistrationNumber).toBe("1010776655");
    expect(providerRegistration.provider.businessProfile.taxRegistrationNumber).toBe("300998877660003");
    expect(providerRegistration.provider.locationProfile.addressText).toBe("المنطقة الصناعية - الرياض");
    expect(providerRegistration.provider.address.latitude).toBe(24.774265);
    expect(providerRegistration.provider.address.longitude).toBe(46.738586);
    expect(providerRegistration.provider.operatingProfile.pickupLeadTimeHours).toBe(2);
    expect(providerRegistration.provider.operatingProfile.executionTimeHours).toBe(18);
    expect(providerRegistration.provider.operatingProfile.deliveryTimeHours).toBe(4);
    expect(providerRegistration.provider.financialProfile.bankName).toBe("البنك الأهلي السعودي");
    expect(providerRegistration.provider.accountSetupProfile.email).toBe("ops@smartwash.sa");
    expect(providerRegistration.provider.businessProfile.commercialRegistrationFile.fileName).toBe(
      "provider-commercial-registration.pdf",
    );
    expect(providerRegistration.account.statusLabelAr).toBeDefined();
    expect(providerRegistration.account.activationPath).toBeUndefined();
  });

  it("rejects provider registration when commercial registration file type is invalid", async () => {
    await expect(
      registerProvider(
        buildProviderRegistrationInput({
          commercialRegistrationFile: {
            fileName: "provider-commercial-registration.txt",
            mimeType: "text/plain",
            sizeBytes: 512,
            contentBase64: "dGVzdA==",
          },
        }),
      ),
    ).rejects.toThrow("الصيغ المسموحة");
  });

  it("validates provider coordinates before storing the onboarding request", async () => {
    await expect(
      registerProvider(
        buildProviderRegistrationInput({
          latitude: 95,
        }),
      ),
    ).rejects.toThrow("خط العرض");

    await expect(
      registerProvider(
        buildProviderRegistrationInput({
          longitude: 190,
        }),
      ),
    ).rejects.toThrow("خط الطول");
  });

  it("rejects hotel registration when commercial registration file type is invalid", async () => {
    await expect(
      registerHotel(
        buildHotelRegistrationInput({
          commercialRegistrationFile: {
            fileName: "commercial-registration.txt",
            mimeType: "text/plain",
            sizeBytes: 512,
            contentBase64: "dGVzdA==",
          },
        }),
      ),
    ).rejects.toThrow("الصيغ المسموحة");
  });

  it("requires selecting a supported city from the predefined list", async () => {
    await expect(
      registerHotel(
        buildHotelRegistrationInput({
          city: "دبي",
        }),
      ),
    ).rejects.toThrow("المدينة");
  });

  it("requires the tax registration number during hotel onboarding", async () => {
    await expect(
      registerHotel(
        buildHotelRegistrationInput({
          taxRegistrationNumber: "   ",
        }),
      ),
    ).rejects.toThrow("الرقم الضريبي");
  });

  it("rejects hotel registration when a required document exceeds the allowed size", async () => {
    await expect(
      registerHotel(
        buildHotelRegistrationInput({
          commercialRegistrationFile: {
            fileName: "commercial-registration.pdf",
            mimeType: "application/pdf",
            sizeBytes: 6 * 1024 * 1024,
            contentBase64: "JVBERi0xLjQKJcTl8uXr",
          },
        }),
      ),
    ).rejects.toThrow("الحد الأقصى لحجم الملف");
  });

  it("validates hotel coordinates before storing the onboarding request", async () => {
    await expect(
      registerHotel(
        buildHotelRegistrationInput({
          latitude: 95,
        }),
      ),
    ).rejects.toThrow("خط العرض");

    await expect(
      registerHotel(
        buildHotelRegistrationInput({
          longitude: 190,
        }),
      ),
    ).rejects.toThrow("خط الطول");
  });

  it("excludes unapproved providers from matching until admin approves them", async () => {
    await registerProvider(
      buildProviderRegistrationInput({
        providerName: "مغسلة انتظار الاعتماد",
        businessPhone: "0560000000",
        businessEmail: "pending-ops@wash.sa",
        accountFullName: "ليان",
        accountPhone: "0560000000",
        accountEmail: "pending@wash.sa",
        dailyCapacityKg: 300,
      }),
    );

    const registrations = await listProviderRegistrations();
    const pendingProvider = registrations.find((provider) => provider.displayName.ar === "مغسلة انتظار الاعتماد");

    expect(pendingProvider).toBeDefined();

    await signInAs("hotel.ops@washoff.sa");
    const order = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1601",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 30 }],
        notes: "Standard batch",
      }),
    });

    const pendingProviderLog = order.matchingLogs.find((log) => log.providerId === pendingProvider?.id);
    expect(pendingProviderLog?.eligibilityResult.reasonCodes).toContain(EligibilityReasonCode.ProviderNotApproved);

    await signInAs("mmekawe@hotmail.com", DEFAULT_ADMIN_PASSWORD);
    const approvalResult = await approveProviderRegistration(
      pendingProvider!.id,
      "تمت مراجعة المزود واعتماده.",
    );

    await approvePendingPricingForProvider(pendingProvider!.id);
    expect(approvalResult.account.activationPath).toContain("/activate-account?token=");

    await signInAs("hotel.ops@washoff.sa");
    const nextOrder = await createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1602",
        pickupAt: "2030-03-21T10:00:00+03:00",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 30 }],
        notes: "Standard batch",
      }),
    });

    const approvedProviderLog = nextOrder.matchingLogs.find((log) => log.providerId === pendingProvider?.id);
    expect(approvedProviderLog?.eligibilityResult.reasonCodes).not.toContain(EligibilityReasonCode.ProviderNotApproved);
  });

  it("keeps pending hotel accounts blocked until approval and activation are completed", async () => {
    const hotelRegistration = await registerHotel(
      buildHotelRegistrationInput({
        hotelName: "فندق قيد الاعتماد",
        contactPersonName: "أحمد",
        contactEmail: "pending-hotel@washoff.sa",
        contactPhone: "0570000000",
      }),
    );

    expect(hotelRegistration.hotel.onboarding.status).toBe(OnboardingStatus.PendingApproval);

    await expect(
      login({
        email: "pending-hotel@washoff.sa",
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toThrow();

    const approvalResult = await approveHotelRegistration(
      hotelRegistration.hotel.id,
      "تم اعتماد الفندق للتشغيل.",
    );

    expect(approvalResult.hotel.onboarding.status).toBe(OnboardingStatus.Approved);
    expect(approvalResult.account.activationPath).toContain("/activate-account?token=");

    await expect(
      login({
        email: "pending-hotel@washoff.sa",
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toThrow();

    const activatedSession = await activateAccount({
      token: extractActivationToken(approvalResult.account.activationPath!),
      password: DEFAULT_PASSWORD,
      fullName: "أحمد التشغيل",
      phone: "0570000000",
    });
    storeClientSession(activatedSession);

    await expect(getHotelProfile(hotelRegistration.hotel.id)).resolves.toMatchObject({
      id: hotelRegistration.hotel.id,
      onboarding: expect.objectContaining({
        status: OnboardingStatus.Approved,
      }),
    });

    await expect(
      createHotelOrder({
        ...buildHotelOrderCommand({
          hotelId: hotelRegistration.hotel.id,
          roomNumber: "1701",
          pickupAt: "2030-03-22T10:00:00+03:00",
          items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 18 }],
          notes: "Activation-linked hotel order",
        }),
      }),
    ).resolves.toMatchObject({
      hotelId: hotelRegistration.hotel.id,
    });
  });

  it("activates approved provider accounts and unlocks provider operational access", async () => {
    const providerRegistration = await registerProvider(
      buildProviderRegistrationInput({
        providerName: "مغسلة بوابة التفعيل",
        businessPhone: "0580000000",
        businessEmail: "activation-provider-ops@washoff.sa",
        accountFullName: "نور",
        accountPhone: "0580000000",
        accountEmail: "activation-provider@washoff.sa",
        dailyCapacityKg: 220,
      }),
    );

    await expect(
      login({
        email: "activation-provider@washoff.sa",
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toThrow();

    const approvalResult = await approveProviderRegistration(
      providerRegistration.provider.id,
      "تم إعداد المزود للتفعيل.",
    );

    expect(approvalResult.provider.onboarding.status).toBe(OnboardingStatus.Approved);
    expect(approvalResult.account.activationPath).toContain("/activate-account?token=");

    const activatedSession = await activateAccount({
      token: extractActivationToken(approvalResult.account.activationPath!),
      password: DEFAULT_PASSWORD,
      fullName: "نور التشغيل",
      phone: "0580000000",
    });
    storeClientSession(activatedSession);

    await expect(getProviderProfile(providerRegistration.provider.id)).resolves.toMatchObject({
      id: providerRegistration.provider.id,
      onboarding: expect.objectContaining({
        status: OnboardingStatus.Approved,
      }),
    });

    await expect(listProviderIncomingOrders(providerRegistration.provider.id)).resolves.toEqual([]);
  });

  it("marks activation tokens as ready, then used after successful activation", async () => {
    const hotelRegistration = await registerHotel(
      buildHotelRegistrationInput({
        hotelName: "فندق دورة التفعيل",
        contactPersonName: "ليان",
        contactEmail: "activation-flow@washoff.sa",
        contactPhone: "0590000000",
      }),
    );

    const approvalResult = await approveHotelRegistration(hotelRegistration.hotel.id);
    const token = extractActivationToken(approvalResult.account.activationPath!);

    await expect(validateActivationToken({ token })).resolves.toMatchObject({
      status: AccountTokenValidationStatus.Ready,
      accountEmail: "activation-flow@washoff.sa",
    });

    await activateAccount({
      token,
      password: DEFAULT_PASSWORD,
      fullName: "ليان التفعيل",
      phone: "0590000000",
    });

    await expect(validateActivationToken({ token })).resolves.toMatchObject({
      status: AccountTokenValidationStatus.Used,
    });
  });

  it("issues one-time password reset tokens and revokes older sessions after reset", async () => {
    const oldSession = await login({
      email: "hotel.ops@washoff.sa",
      password: DEFAULT_PASSWORD,
    });

    const resetRequest = await requestPasswordReset({
      email: "hotel.ops@washoff.sa",
    });
    const token = extractResetToken(resetRequest.resetPath!);

    await expect(validateResetPasswordToken({ token })).resolves.toMatchObject({
      status: AccountTokenValidationStatus.Ready,
      accountEmail: "hotel.ops@washoff.sa",
    });

    const resetSession = await resetPassword({
      token,
      password: "WashoffReset123!",
    });

    expect(resetSession.account.email).toBe("hotel.ops@washoff.sa");
    await expect(resolveAccountSession(oldSession.token)).resolves.toBeNull();
    await expect(validateResetPasswordToken({ token })).resolves.toMatchObject({
      status: AccountTokenValidationStatus.Used,
    });

    await expect(
      login({
        email: "hotel.ops@washoff.sa",
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toThrow();

    await expect(
      login({
        email: "hotel.ops@washoff.sa",
        password: "WashoffReset123!",
      }),
    ).resolves.toMatchObject({
      account: expect.objectContaining({
        email: "hotel.ops@washoff.sa",
      }),
    });
  });

  it("suspends accounts, revokes active sessions, and restores access after reactivation", async () => {
    const hotelSession = await login({
      email: "hotel.ops@washoff.sa",
      password: DEFAULT_PASSWORD,
    });
    storeClientSession(hotelSession);

    const adminSession = await login({
      email: "mmekawe@hotmail.com",
      password: DEFAULT_ADMIN_PASSWORD,
    });
    storeClientSession(adminSession);

    const suspendedAccount = await suspendAccount("account-hotel-1");
    expect(suspendedAccount.status).toBeDefined();

    await expect(resolveAccountSession(hotelSession.token)).resolves.toBeNull();
    await expect(
      login({
        email: "hotel.ops@washoff.sa",
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toThrow();

    const reactivatedAccount = await reactivateAccount("account-hotel-1");
    expect(reactivatedAccount.status).toBeDefined();

    await expect(
      login({
        email: "hotel.ops@washoff.sa",
        password: DEFAULT_PASSWORD,
      }),
    ).resolves.toMatchObject({
      account: expect.objectContaining({
        email: "hotel.ops@washoff.sa",
      }),
    });
  });

  it("records identity audit events for activation, reset, suspension, and reactivation flows", async () => {
    const hotelRegistration = await registerHotel(
      buildHotelRegistrationInput({
        hotelName: "فندق السجل الأمني",
        city: "جدة",
        contactPersonName: "سلمان",
        contactEmail: "audit-hotel@washoff.sa",
        contactPhone: "0511111111",
        addressText: "طريق الكورنيش - جدة",
        latitude: 21.5433,
        longitude: 39.1728,
      }),
    );
    const approvalResult = await approveHotelRegistration(hotelRegistration.hotel.id);
    await activateAccount({
      token: extractActivationToken(approvalResult.account.activationPath!),
      password: DEFAULT_PASSWORD,
    });

    await requestPasswordReset({
      email: "audit-hotel@washoff.sa",
    });

    const adminSession = await login({
      email: "mmekawe@hotmail.com",
      password: DEFAULT_ADMIN_PASSWORD,
    });
    storeClientSession(adminSession);
    await suspendAccount(hotelRegistration.account.accountId);
    await reactivateAccount(hotelRegistration.account.accountId);

    const events = await listIdentityAuditEvents();
    const eventTypes = events.map((event) => event.type);

    expect(eventTypes).toContain("account_created");
    expect(eventTypes).toContain("activation_issued");
    expect(eventTypes).toContain("account_activated");
    expect(eventTypes).toContain("password_reset_requested");
    expect(eventTypes).toContain("account_suspended");
    expect(eventTypes).toContain("account_reactivated");
  });

  it("updates platform settings and records an audit entry", async () => {
    const adminSession = await login({
      email: "mmekawe@hotmail.com",
      password: DEFAULT_ADMIN_PASSWORD,
    });
    storeClientSession(adminSession);

    const originalSettings = await getPlatformSettings();
    const updatedSettings = await updatePlatformSettings({
      ...originalSettings,
      siteNameAr: "منصة WashOff QA",
      siteNameEn: "WashOff QA Platform",
      notesAr: "اختبار تحديث الإعدادات",
    });
    const auditEntries = await listPlatformSettingsAudit();

    expect(updatedSettings.siteNameAr).toBe("منصة WashOff QA");
    expect(updatedSettings.siteNameEn).toBe("WashOff QA Platform");
    expect(auditEntries[0]?.notesAr).toBe("اختبار تحديث الإعدادات");
  });

  it("updates managed content, exposes the override, and records a content audit entry", async () => {
    const adminSession = await login({
      email: "mmekawe@hotmail.com",
      password: DEFAULT_ADMIN_PASSWORD,
    });
    storeClientSession(adminSession);

    const contentEntries = await listPlatformContentEntries();
    const heroTitleEntry = contentEntries.find((entry) => entry.id === "landing.hero.title");

    expect(heroTitleEntry).toBeDefined();

    await updatePlatformContentEntry({
      id: "landing.hero.title",
      valueAr: "عنوان عربي مُدار",
      valueEn: "Managed English title",
      active: true,
      notesAr: "اختبار تحديث نص الهيرو",
    });

    const pageContentAr = await getPlatformPageContent("landing", "ar");
    const pageContentEn = await getPlatformPageContent("landing", "en");
    const contentAudit = await listPlatformContentAudit();

    expect(pageContentAr.values["landing.hero.title"]).toBe("عنوان عربي مُدار");
    expect(pageContentEn.values["landing.hero.title"]).toBe("Managed English title");
    expect(contentAudit[0]?.contentEntryId).toBe("landing.hero.title");
    expect(contentAudit[0]?.notesAr).toBe("اختبار تحديث نص الهيرو");
  });
});
