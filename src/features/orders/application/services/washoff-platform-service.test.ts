import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearClientSession, storeClientSession } from "@/features/auth/infrastructure/client-auth-storage";
import {
  AccountRole,
  IdentityAuditEventType,
  IdentityEmailDeliveryStatus,
  LinkedEntityType,
  type IdentityEmailDeliverySummary,
} from "@/features/auth/model";
import { PlatformServiceTypeCode } from "@/features/orders/model/service";
import { resetMockOrdersRepository } from "@/features/orders/data/mock-orders.repository";
import { createPreviewWashoffPlatformRepository } from "@/features/orders/infrastructure/adapters/preview-platform-repository";
import { createWashoffPlatformApplicationService } from "./washoff-platform-service";

const buildDeliverySummary = (
  kind: IdentityEmailDeliverySummary["kind"],
): IdentityEmailDeliverySummary => ({
  kind,
  status: IdentityEmailDeliveryStatus.Sent,
  statusLabelAr: "تم الإرسال",
  providerLabelAr: "صندوق بريد التطوير",
  providerMessageId: `message-${kind}`,
  occurredAt: new Date("2030-03-20T09:00:00.000Z").toISOString(),
  sentAt: new Date("2030-03-20T09:00:00.000Z").toISOString(),
  outboxFilePath: `data/mail-outbox/${kind}`,
});

const DEFAULT_PROVIDER_SERVICE_PRICING = [
  { serviceId: "svc-thobe-dry_clean", proposedPriceSar: 12.65 },
  { serviceId: "svc-shirt-iron", proposedPriceSar: 3.45 },
];

const buildHotelRegistrationCommand = (
  overrides: Record<string, unknown> = {},
) => ({
  hotelName: "فندق بريد التفعيل",
  legalEntityName: "شركة الفندق التشغيلية",
  city: "الرياض",
  hotelClassification: "five_star" as const,
  roomCount: 180,
  taxRegistrationNumber: "300112223300003",
  commercialRegistrationNumber: "1010998877",
  serviceLevel: "express" as const,
  operatingHours: "24/7",
  requiresDailyPickup: true,
  addressText: "حي العليا - الرياض",
  latitude: 24.7136,
  longitude: 46.6753,
  pickupLocation: "منطقة الخدمات الخلفية",
  hasLoadingArea: true,
  accessNotes: "التنسيق مع الأمن قبل الوصول.",
  commercialRegistrationFile: {
    fileName: "commercial-registration.pdf",
    mimeType: "application/pdf",
    sizeBytes: 128_000,
    contentBase64: "JVBERi0xLjQKJcTl8uXr",
  },
  contactPersonName: "هالة",
  contactEmail: "activation-delivery@washoff.sa",
  contactPhone: "0500000011",
  ...overrides,
});

const buildProviderRegistrationCommand = (
  overrides: Record<string, unknown> = {},
) => ({
  providerName: "مغسلة بريد التفعيل",
  legalEntityName: "شركة تشغيل المغسلة",
  commercialRegistrationNumber: "1010776655",
  taxRegistrationNumber: "300998877660003",
  city: "الرياض",
  businessPhone: "0550000099",
  businessEmail: "ops-provider@washoff.sa",
  addressText: "المنطقة الصناعية الثانية - الرياض",
  latitude: 24.774265,
  longitude: 46.738586,
  servicePricing: DEFAULT_PROVIDER_SERVICE_PRICING,
  dailyCapacityKg: 120,
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
  bankAccountHolderName: "شركة تشغيل المغسلة",
  accountFullName: "محمود",
  accountPhone: "0550000099",
  accountEmail: "resend-activation@washoff.sa",
  ...overrides,
});

const buildHotelOrderCommand = (
  overrides: Partial<{
    roomNumber: string;
    pickupAt: string;
    notes: string;
    items: Array<{ serviceId: string; quantity: number }>;
  }> = {},
) => ({
  roomNumber: overrides.roomNumber ?? "1208",
  items: overrides.items ?? [{ serviceId: "svc-thobe-dry_clean", quantity: 12 }],
  pickupAt: overrides.pickupAt ?? "2030-03-23T10:00:00+03:00",
  notes: overrides.notes ?? "طلب تشغيلي من لوحة الفندق",
});

const approvePendingPricingForProvider = async (
  service: ReturnType<typeof createWashoffPlatformApplicationService>,
  providerId: string,
) => {
  const pricingReview = await service.getProviderPricingAdminData();

  for (const submission of pricingReview.pendingReviews.filter((entry) => entry.providerId === providerId)) {
    await service.approveProviderServicePricing({
      offeringId: submission.offeringId,
    });
  }
};

describe("Washoff platform application service identity delivery", () => {
  beforeEach(() => {
    resetMockOrdersRepository();
    clearClientSession();
  });

  it("sends activation email after approving hotel registration and records an audit event", async () => {
    const sendActivationEmail = vi.fn(async () => buildDeliverySummary("activation"));
    const sendPasswordResetEmail = vi.fn(async () => buildDeliverySummary("password_reset"));
    const recordIdentityAuditEvent = vi.fn(async () => undefined);
    const service = createWashoffPlatformApplicationService(createPreviewWashoffPlatformRepository(), {
      publicAppUrl: "http://localhost:8080",
      identityMailDelivery: {
        sendActivationEmail,
        sendPasswordResetEmail,
      },
      identityAuditRecorder: {
        recordIdentityAuditEvent,
      },
    });
    storeClientSession(
      await service.login({
        email: "mmekawe@hotmail.com",
        password: "Zajillema2@123",
      }),
    );

    const registration = await service.registerHotel(buildHotelRegistrationCommand());

    const approval = await service.approveHotelRegistration({
      entityId: registration.hotel.id,
    });

    expect(approval.delivery?.status).toBe(IdentityEmailDeliveryStatus.Sent);
    expect(sendActivationEmail).toHaveBeenCalledOnce();
    expect(sendActivationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "activation-delivery@washoff.sa",
        recipientName: "هالة",
        role: AccountRole.Hotel,
        linkedEntityType: LinkedEntityType.Hotel,
        activationPath: expect.stringContaining("http://localhost:8080/activate-account?token="),
      }),
    );
    expect(recordIdentityAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: approval.account.accountId,
        type: IdentityAuditEventType.ActivationEmailSent,
      }),
    );
  });

  it("keeps forgot-password responses neutral while still issuing delivery for active accounts", async () => {
    const sendActivationEmail = vi.fn(async () => buildDeliverySummary("activation"));
    const sendPasswordResetEmail = vi.fn(async () => buildDeliverySummary("password_reset"));
    const service = createWashoffPlatformApplicationService(createPreviewWashoffPlatformRepository(), {
      publicAppUrl: "http://localhost:8080",
      identityMailDelivery: {
        sendActivationEmail,
        sendPasswordResetEmail,
      },
    });

    const result = await service.requestPasswordReset({
      email: "hotel.ops@washoff.sa",
    });

    expect(result.accepted).toBe(true);
    expect(result.messageAr).toContain("WashOff");
    expect("resetPath" in result && result.resetPath).toBeFalsy();
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "hotel.ops@washoff.sa",
        role: AccountRole.Hotel,
        linkedEntityType: LinkedEntityType.Hotel,
        resetPath: expect.stringContaining("http://localhost:8080/reset-password?token="),
      }),
    );
  });

  it("does not send password reset email for unknown accounts and still returns a neutral response", async () => {
    const sendActivationEmail = vi.fn(async () => buildDeliverySummary("activation"));
    const sendPasswordResetEmail = vi.fn(async () => buildDeliverySummary("password_reset"));
    const service = createWashoffPlatformApplicationService(createPreviewWashoffPlatformRepository(), {
      publicAppUrl: "http://localhost:8080",
      identityMailDelivery: {
        sendActivationEmail,
        sendPasswordResetEmail,
      },
    });

    const result = await service.requestPasswordReset({
      email: "missing-account@washoff.sa",
    });

    expect(result.accepted).toBe(true);
    expect(result.messageAr).toContain("WashOff");
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("resends activation email for pending accounts and records the delivery event", async () => {
    const sendActivationEmail = vi.fn(async () => buildDeliverySummary("activation"));
    const sendPasswordResetEmail = vi.fn(async () => buildDeliverySummary("password_reset"));
    const recordIdentityAuditEvent = vi.fn(async () => undefined);
    const service = createWashoffPlatformApplicationService(createPreviewWashoffPlatformRepository(), {
      publicAppUrl: "http://localhost:8080",
      identityMailDelivery: {
        sendActivationEmail,
        sendPasswordResetEmail,
      },
      identityAuditRecorder: {
        recordIdentityAuditEvent,
      },
    });
    storeClientSession(
      await service.login({
        email: "mmekawe@hotmail.com",
        password: "Zajillema2@123",
      }),
    );

    const registration = await service.registerProvider(
      buildProviderRegistrationCommand({
        providerName: "مغسلة إعادة التفعيل",
        businessEmail: "resend-provider-ops@washoff.sa",
      }),
    );

    await service.approveProviderRegistration({
      entityId: registration.provider.id,
    });

    sendActivationEmail.mockClear();
    recordIdentityAuditEvent.mockClear();

    const resent = await service.resendActivationEmail({
      accountId: registration.account.accountId,
    });

    expect(resent.delivery?.status).toBe(IdentityEmailDeliveryStatus.Sent);
    expect(sendActivationEmail).toHaveBeenCalledOnce();
    expect(recordIdentityAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: registration.account.accountId,
        type: IdentityAuditEventType.ActivationEmailSent,
      }),
    );
  });

  it("loads the hotel-facing catalog from approved active offerings only and hides pending-only combinations", async () => {
    const service = createWashoffPlatformApplicationService(createPreviewWashoffPlatformRepository(), {
      publicAppUrl: "http://localhost:8080",
    });

    storeClientSession(
      await service.login({
        email: "mmekawe@hotmail.com",
        password: "Zajillema2@123",
      }),
    );

    const createdProduct = await service.upsertPlatformProduct({
      nameAr: "مفرش مجلس",
      active: true,
    });
    const adminCatalog = await service.getPlatformServiceCatalogAdminData();
    const pendingOnlyMatrixRow = adminCatalog.matrixRows.find(
      (row) =>
        row.productId === createdProduct.id && row.serviceTypeId === PlatformServiceTypeCode.DryClean,
    );

    expect(pendingOnlyMatrixRow).toBeDefined();

    await service.updatePlatformServiceMatrix({
      matrixRowId: pendingOnlyMatrixRow!.id,
      active: true,
      isAvailable: true,
      suggestedPriceSar: 18.75,
    });

    const providerRegistration = await service.registerProvider(
      buildProviderRegistrationCommand({
        providerName: "مغسلة التسعير المعلق",
        businessPhone: "0551111188",
        businessEmail: "pending-only-provider-ops@washoff.sa",
        accountFullName: "مراجع الأسعار",
        accountPhone: "0551111188",
        accountEmail: "pending-only-provider@washoff.sa",
        servicePricing: [{ serviceId: pendingOnlyMatrixRow!.id, proposedPriceSar: 18.75 }],
      }),
    );

    clearClientSession();
    storeClientSession(
      await service.login({
        email: "hotel.ops@washoff.sa",
        password: "Washoff123!",
      }),
    );

    const hotelCatalogBeforeApproval = await service.getHotelDashboardData();

    expect(hotelCatalogBeforeApproval.serviceCatalog.some((entry) => entry.id === pendingOnlyMatrixRow!.id)).toBe(
      false,
    );
    expect(hotelCatalogBeforeApproval.serviceCatalog.every((entry) => entry.id.startsWith("svc-"))).toBe(true);
    expect(
      hotelCatalogBeforeApproval.serviceCatalog.every(
        (entry) =>
          Boolean(entry.productId) &&
          Boolean(entry.productName?.ar) &&
          Boolean(entry.serviceType) &&
          Boolean(entry.serviceTypeName?.ar) &&
          (entry.operationalProviderCount ?? 0) > 0,
      ),
    ).toBe(true);

    clearClientSession();
    storeClientSession(
      await service.login({
        email: "mmekawe@hotmail.com",
        password: "Zajillema2@123",
      }),
    );

    await service.approveProviderRegistration({
      entityId: providerRegistration.provider.id,
    });
    await approvePendingPricingForProvider(service, providerRegistration.provider.id);

    clearClientSession();
    storeClientSession(
      await service.login({
        email: "hotel.ops@washoff.sa",
        password: "Washoff123!",
      }),
    );

    const hotelCatalogAfterApproval = await service.getHotelDashboardData();
    const newlyAvailableEntry = hotelCatalogAfterApproval.serviceCatalog.find(
      (entry) => entry.id === pendingOnlyMatrixRow!.id,
    );

    expect(newlyAvailableEntry).toMatchObject({
      id: pendingOnlyMatrixRow!.id,
      productId: createdProduct.id,
      serviceType: PlatformServiceTypeCode.DryClean,
      operationalProviderCount: 1,
      lowestApprovedPriceSar: 18.75,
    });
  });

  it("rejects legacy service ids and creates hotel orders with canonical catalog references", async () => {
    const service = createWashoffPlatformApplicationService(createPreviewWashoffPlatformRepository(), {
      publicAppUrl: "http://localhost:8080",
    });

    storeClientSession(
      await service.login({
        email: "hotel.ops@washoff.sa",
        password: "Washoff123!",
      }),
    );

    const hotelDashboard = await service.getHotelDashboardData();
    const requestedService = hotelDashboard.serviceCatalog[0];

    expect(requestedService).toBeDefined();
    expect(requestedService.id.startsWith("svc-")).toBe(true);
    expect(requestedService.productId).toBeTruthy();
    expect(requestedService.serviceType).toBeTruthy();

    await expect(
      service.createHotelOrder({
        ...buildHotelOrderCommand({
          items: [{ serviceId: "wash_fold", quantity: 12 }],
          notes: "اختبار خدمة قديمة",
        }),
        notes: "اختبار خدمة قديمة",
      }),
    ).rejects.toThrow("كتالوج WashOff");

    const order = await service.createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1210",
        items: [{ serviceId: requestedService.id, quantity: 12 }],
        notes: "اختبار خدمة قياسية",
      }),
      notes: "اختبار خدمة قياسية",
    });

    expect(order.items).toHaveLength(1);
    expect(order.roomNumber).toBe("1210");
    expect(order.items[0]?.serviceId).toBe(requestedService.id);
    expect(order.items[0]?.serviceName.ar).toBe(requestedService.name.ar);
    expect(order.items[0]?.quantity).toBe(12);
    expect(order.matchingLogs.length).toBeGreaterThan(0);
  });
});
