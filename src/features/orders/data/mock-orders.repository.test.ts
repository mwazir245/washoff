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
  activateAccount,
  approveHotelRegistration,
  approveProviderRegistration,
  createHotelOrder,
  expirePendingAssignment,
  getHotelProfile,
  getPlatformPageContent,
  getPlatformSettings,
  getProviderProfile,
  listIdentityAuditEvents,
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

describe("mockOrdersRepository reassignment and identity flow", () => {
  beforeEach(() => {
    resetMockOrdersRepository();
    clearClientSession();
  });

  it("creates a hotel order, runs auto-matching, and assigns the best provider when eligible", async () => {
    await signInAs("hotel.ops@washoff.sa");

    const createdOrder = await createHotelOrder({
      serviceIds: ["wash_fold"],
      itemCount: 40,
      pickupAt: "2030-03-20T10:00:00+03:00",
      notes: "Handle with care",
    });

    expect(createdOrder.status).toBe(OrderStatus.Assigned);
    expect(createdOrder.providerId).toBe("provider-1");
    expect(createdOrder.providerSnapshot?.displayName.ar).toBeDefined();
    expect(createdOrder.activeAssignment?.status).toBe(AssignmentStatus.PendingAcceptance);
    expect(createdOrder.slaWindow.responseDueAt).toBeDefined();
    expect(createdOrder.matchingLogs.length).toBeGreaterThan(0);
  });

  it("stores unresolved submissions in pending capacity when no provider is initially eligible", async () => {
    await signInAs("hotel.ops@washoff.sa");

    const createdOrder = await createHotelOrder({
      serviceIds: ["wash_fold"],
      itemCount: 340,
      pickupAt: "2030-03-20T10:00:00+03:00",
      notes: "Oversized batch",
    });

    expect(createdOrder.status).toBe(OrderStatus.PendingCapacity);
    expect(createdOrder.providerId).toBeUndefined();
    expect(createdOrder.activeAssignment).toBeUndefined();
    expect(createdOrder.matchingLogs.some((log) => log.eligibilityResult.blockingReasonsAr.length > 0)).toBe(true);
  });

  it("reassigns to the next eligible provider when the current provider rejects", async () => {
    await signInAs("hotel.ops@washoff.sa");
    const createdOrder = await createHotelOrder({
      serviceIds: ["wash_fold"],
      itemCount: 40,
      pickupAt: "2030-03-20T10:00:00+03:00",
      notes: "Handle with care",
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
      serviceIds: ["wash_fold"],
      itemCount: 40,
      pickupAt: "2030-03-20T10:00:00+03:00",
      notes: "Handle with care",
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
      serviceIds: ["wash_fold"],
      itemCount: 260,
      pickupAt: "2030-03-20T10:00:00+03:00",
      notes: "Large urgent batch",
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
    const providerRegistration = await registerProvider({
      providerName: "مغسلة السعة الذكية",
      city: "الرياض",
      contactPersonName: "عبدالله",
      contactEmail: "ops@smartwash.sa",
      contactPhone: "0550000000",
      supportedServiceIds: ["wash_fold"],
      dailyCapacityKg: 180,
    });

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
    expect(providerRegistration.account.statusLabelAr).toBeDefined();
    expect(providerRegistration.account.activationPath).toBeUndefined();
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
    await registerProvider({
      providerName: "مغسلة انتظار الاعتماد",
      city: "الرياض",
      contactPersonName: "ليان",
      contactEmail: "pending@wash.sa",
      contactPhone: "0560000000",
      supportedServiceIds: ["wash_fold"],
      dailyCapacityKg: 300,
    });

    const registrations = await listProviderRegistrations();
    const pendingProvider = registrations.find((provider) => provider.displayName.ar === "مغسلة انتظار الاعتماد");

    expect(pendingProvider).toBeDefined();

    await signInAs("hotel.ops@washoff.sa");
    const order = await createHotelOrder({
      serviceIds: ["wash_fold"],
      itemCount: 30,
      pickupAt: "2030-03-20T10:00:00+03:00",
      notes: "Standard batch",
    });

    const pendingProviderLog = order.matchingLogs.find((log) => log.providerId === pendingProvider?.id);
    expect(pendingProviderLog?.eligibilityResult.reasonCodes).toContain(EligibilityReasonCode.ProviderNotApproved);

    const approvalResult = await approveProviderRegistration(
      pendingProvider!.id,
      "تمت مراجعة المزود واعتماده.",
    );

    expect(approvalResult.account.activationPath).toContain("/activate-account?token=");

    const nextOrder = await createHotelOrder({
      serviceIds: ["wash_fold"],
      itemCount: 30,
      pickupAt: "2030-03-21T10:00:00+03:00",
      notes: "Standard batch",
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
        hotelId: hotelRegistration.hotel.id,
        serviceIds: ["wash_fold"],
        itemCount: 18,
        pickupAt: "2030-03-22T10:00:00+03:00",
        notes: "Activation-linked hotel order",
      }),
    ).resolves.toMatchObject({
      hotelId: hotelRegistration.hotel.id,
    });
  });

  it("activates approved provider accounts and unlocks provider operational access", async () => {
    const providerRegistration = await registerProvider({
      providerName: "مغسلة بوابة التفعيل",
      city: "الرياض",
      contactPersonName: "نور",
      contactEmail: "activation-provider@washoff.sa",
      contactPhone: "0580000000",
      supportedServiceIds: ["wash_fold"],
      dailyCapacityKg: 220,
    });

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
