import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearClientSession, storeClientSession } from "@/features/auth/infrastructure/client-auth-storage";
import {
  AccountRole,
  IdentityAuditEventType,
  IdentityEmailDeliveryStatus,
  LinkedEntityType,
  type IdentityEmailDeliverySummary,
} from "@/features/auth/model";
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

    const registration = await service.registerProvider({
      providerName: "مغسلة إعادة التفعيل",
      city: "الرياض",
      contactPersonName: "محمود",
      contactEmail: "resend-activation@washoff.sa",
      contactPhone: "0550000099",
      supportedServiceIds: ["wash_fold"],
      dailyCapacityKg: 120,
    });

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
});
