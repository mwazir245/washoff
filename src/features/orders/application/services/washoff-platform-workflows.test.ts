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
import { resetMockOrdersRepository } from "@/features/orders/data/mock-orders.repository";
import { createPreviewWashoffPlatformRepository } from "@/features/orders/infrastructure/adapters/preview-platform-repository";
import { createWashoffPlatformApplicationService } from "./washoff-platform-service";

const DEFAULT_PASSWORD = "Washoff123!";
const DEFAULT_ADMIN_PASSWORD = "Zajillema2@123";
const DEFAULT_ADMIN_EMAIL = "mmekawe@hotmail.com";
const DEFAULT_REQUESTED_SERVICE_ID = "svc-thobe-dry_clean";
const MULTI_SERVICE_REQUEST_IDS = ["svc-bedsheet-wash_and_iron", "svc-shirt-iron"];
const DEFAULT_PROVIDER_SERVICE_PRICING = [
  { serviceId: DEFAULT_REQUESTED_SERVICE_ID, proposedPriceSar: 12.65 },
  { serviceId: "svc-shirt-iron", proposedPriceSar: 3.45 },
  { serviceId: "svc-bedsheet-wash_and_iron", proposedPriceSar: 11.5 },
];

const extractToken = (actionPath?: string) => {
  return new URL(actionPath ?? "", "https://washoff.local").searchParams.get("token") ?? "";
};

const createServiceContext = () => {
  const repository = createPreviewWashoffPlatformRepository();
  const service = createWashoffPlatformApplicationService(repository, {
    publicAppUrl: "http://localhost:8080",
  });

  return {
    repository,
    service,
  };
};

const signInAs = async (
  service: ReturnType<typeof createServiceContext>["service"],
  email: string,
  password = DEFAULT_PASSWORD,
) => {
  const session = await service.login({
    email,
    password,
  });
  storeClientSession(session);
  return session;
};

const buildHotelRegistrationInput = (overrides: Record<string, unknown> = {}) => ({
  hotelName: "فندق التشغيل المتكامل",
  legalEntityName: "شركة الفندق التشغيلية",
  city: "الرياض",
  hotelClassification: "five_star" as const,
  roomCount: 240,
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
  contactPersonName: "مدير التشغيل",
  contactEmail: "hotel-e2e@washoff.sa",
  contactPhone: "0501001001",
  ...overrides,
});

const buildProviderRegistrationInput = (overrides: Record<string, unknown> = {}) => ({
  providerName: "مغسلة التشغيل المتكامل",
  legalEntityName: "شركة تشغيل المغسلة",
  commercialRegistrationNumber: "1010776655",
  taxRegistrationNumber: "300998877660003",
  city: "الرياض",
  businessPhone: "0552002002",
  businessEmail: "provider-ops@washoff.sa",
  addressText: "المنطقة الصناعية الثانية - الرياض",
  latitude: 24.774265,
  longitude: 46.738586,
  servicePricing: DEFAULT_PROVIDER_SERVICE_PRICING,
  dailyCapacityKg: 200,
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
  accountFullName: "مشرف المناوبة",
  accountPhone: "0552002002",
  accountEmail: "provider-e2e@washoff.sa",
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
  pickupAt: overrides.pickupAt ?? "2030-03-23T10:00:00+03:00",
  notes: overrides.notes ?? "طلب تشغيلي من لوحة الفندق",
});

const activateFromPath = async (
  service: ReturnType<typeof createServiceContext>["service"],
  activationPath?: string,
  fullName?: string,
  phone?: string,
) => {
  const token = extractToken(activationPath);
  const validation = await service.validateActivationToken({
    token,
  });

  expect(validation.status).toBe(AccountTokenValidationStatus.Ready);

  return service.activateAccount({
    token,
    password: DEFAULT_PASSWORD,
    fullName,
    phone,
  });
};

const registerAndActivateHotel = async (
  service: ReturnType<typeof createServiceContext>["service"],
  input?: {
    hotelName?: string;
    contactEmail?: string;
    contactPersonName?: string;
    contactPhone?: string;
  },
) => {
  const registration = await service.registerHotel(
    buildHotelRegistrationInput({
      hotelName: input?.hotelName ?? "فندق التشغيل المتكامل",
      contactPersonName: input?.contactPersonName ?? "مدير التشغيل",
      contactEmail: input?.contactEmail ?? "hotel-e2e@washoff.sa",
      contactPhone: input?.contactPhone ?? "0501001001",
    }),
  );

  await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
  const approval = await service.approveHotelRegistration({
    entityId: registration.hotel.id,
  });

  await activateFromPath(
    service,
    approval.account.activationPath,
    registration.hotel.contact.name,
    registration.hotel.contact.phone,
  );

  clearClientSession();
  const hotelSession = await signInAs(service, registration.account.email);

  return {
    registration,
    approval,
    hotelSession,
  };
};

const registerAndActivateProvider = async (
  service: ReturnType<typeof createServiceContext>["service"],
  input?: {
    providerName?: string;
    contactEmail?: string;
    contactPersonName?: string;
    contactPhone?: string;
    dailyCapacityKg?: number;
  },
) => {
  const registration = await service.registerProvider(
    buildProviderRegistrationInput({
      providerName: input?.providerName ?? "مغسلة التشغيل المتكامل",
      businessPhone: input?.contactPhone ?? "0552002002",
      businessEmail: input?.contactEmail ? `ops-${input.contactEmail}` : "provider-ops@washoff.sa",
      accountFullName: input?.contactPersonName ?? "مشرف المناوبة",
      accountPhone: input?.contactPhone ?? "0552002002",
      accountEmail: input?.contactEmail ?? "provider-e2e@washoff.sa",
      dailyCapacityKg: input?.dailyCapacityKg ?? 200,
    }),
  );

  await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
  const approval = await service.approveProviderRegistration({
    entityId: registration.provider.id,
  });
  const pricingReview = await service.getProviderPricingAdminData();

  for (const submission of pricingReview.pendingReviews.filter(
    (entry) => entry.providerId === registration.provider.id,
  )) {
    await service.approveProviderServicePricing({
      offeringId: submission.offeringId,
    });
  }

  await activateFromPath(
    service,
    approval.account.activationPath,
    registration.provider.contact.name,
    registration.provider.contact.phone,
  );

  clearClientSession();
  const providerSession = await signInAs(service, registration.account.email);

  return {
    registration,
    approval,
    providerSession,
  };
};

describe("Washoff platform end-to-end workflow validation", () => {
  beforeEach(() => {
    resetMockOrdersRepository();
    clearClientSession();
  });

  it("registers, approves, activates, and logs in a hotel account before hotel operational access succeeds", async () => {
    const { service } = createServiceContext();

    const registration = await service.registerHotel(
      buildHotelRegistrationInput({
        hotelName: "فندق التحقق من التسجيل",
        contactPersonName: "أمينة",
        contactEmail: "hotel-onboarding-e2e@washoff.sa",
        contactPhone: "0503003003",
        notes: "اختبار تسجيل فندق كامل",
      }),
    );

    expect(registration.hotel.onboarding.status).toBe(OnboardingStatus.PendingApproval);
    expect(registration.hotel.active).toBe(false);

    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const onboardingBeforeApproval = await service.getAdminOnboardingData();
    const hotelSummary = onboardingBeforeApproval.hotels.find(
      (hotel) => hotel.id === registration.hotel.id,
    );
    expect(hotelSummary).toBeDefined();
    expect(hotelSummary).toMatchObject({
      hotelClassification: "five_star",
      roomCount: 240,
      taxRegistrationNumber: "300112223300003",
      serviceLevel: "express",
      commercialRegistrationNumber: "1010998877",
      addressText: "حي العليا - الرياض",
      latitude: 24.7136,
      longitude: 46.6753,
      delegationStatus: "not_provided",
    });

    const approval = await service.approveHotelRegistration({
      entityId: registration.hotel.id,
    });

    expect(approval.hotel.onboarding.status).toBe(OnboardingStatus.Approved);
    expect(approval.account.activationPath).toContain("/activate-account?token=");

    await activateFromPath(
      service,
      approval.account.activationPath,
      registration.hotel.contact.name,
      registration.hotel.contact.phone,
    );

    clearClientSession();
    const hotelSession = await signInAs(service, registration.account.email);
    const hotelDashboard = await service.getHotelDashboardData();

    expect(hotelSession.account.linkedHotelId).toBe(registration.hotel.id);
    expect(hotelDashboard.hotelName).toBe("فندق التحقق من التسجيل");
    expect(hotelDashboard.recentOrders).toEqual([]);
  });

  it("registers, approves, activates, and logs in a provider account before provider operational access succeeds", async () => {
    const { service } = createServiceContext();

    const registration = await service.registerProvider(
      buildProviderRegistrationInput({
        providerName: "مغسلة التحقق من التسجيل",
        businessPhone: "0554004004",
        businessEmail: "provider-onboarding-ops@washoff.sa",
        servicePricing: [
          { serviceId: DEFAULT_REQUESTED_SERVICE_ID, proposedPriceSar: 12.65 },
          { serviceId: "svc-shirt-iron", proposedPriceSar: 3.45 },
        ],
        dailyCapacityKg: 240,
        accountFullName: "نايف",
        accountPhone: "0554004004",
        accountEmail: "provider-onboarding-e2e@washoff.sa",
        notes: "اختبار تسجيل مزود كامل",
      }),
    );

    expect(registration.provider.onboarding.status).toBe(OnboardingStatus.PendingApproval);
    expect(registration.provider.active).toBe(false);

    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const onboardingBeforeApproval = await service.getAdminOnboardingData();
    const providerSummary = onboardingBeforeApproval.providers.find(
      (provider) => provider.id === registration.provider.id,
    );
    expect(providerSummary).toBeDefined();
    expect(providerSummary).toMatchObject({
      commercialRegistrationNumber: "1010776655",
      taxRegistrationNumber: "300998877660003",
      addressText: "المنطقة الصناعية الثانية - الرياض",
      latitude: 24.774265,
      longitude: 46.738586,
      dailyCapacityKg: 240,
      pickupLeadTimeHours: 2,
      executionTimeHours: 18,
      deliveryTimeHours: 4,
      bankName: "البنك الأهلي السعودي",
      accountSetupEmail: "provider-onboarding-e2e@washoff.sa",
    });

    const approval = await service.approveProviderRegistration({
      entityId: registration.provider.id,
    });

    expect(approval.provider.onboarding.status).toBe(OnboardingStatus.Approved);
    expect(approval.account.activationPath).toContain("/activate-account?token=");

    await activateFromPath(
      service,
      approval.account.activationPath,
      registration.provider.contact.name,
      registration.provider.contact.phone,
    );

    clearClientSession();
    const providerSession = await signInAs(service, registration.account.email);
    const providerDashboard = await service.getProviderDashboardData();

    expect(providerSession.account.linkedProviderId).toBe(registration.provider.id);
    expect(providerDashboard.providerName).toBe("مغسلة التحقق من التسجيل");
    expect(providerDashboard.incomingOrders).toEqual([]);
  });

  it("creates an order, auto-assigns an eligible provider, supports provider acceptance, and keeps dashboards consistent", async () => {
    const { repository, service } = createServiceContext();
    const { registration: hotelRegistration } = await registerAndActivateHotel(service, {
      hotelName: "فندق رحلة الطلب",
      contactEmail: "hotel-order-e2e@washoff.sa",
      contactPhone: "0505005005",
    });

    const createdOrder = await service.createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1208",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 24 }],
        pickupAt: "2030-03-23T10:00:00+03:00",
        notes: "طلب تشغيلي من رحلة التحقق",
      }),
      notes: "طلب تشغيلي من رحلة التحقق",
    });

    expect(createdOrder.hotelId).toBe(hotelRegistration.hotel.id);
    expect(createdOrder.roomNumber).toBe("1208");
    expect(createdOrder.status).toBe(OrderStatus.Assigned);
    expect(createdOrder.providerId).toBeTruthy();
    expect(createdOrder.activeAssignment?.status).toBe(AssignmentStatus.PendingAcceptance);
    expect(createdOrder.matchingLogs.length).toBeGreaterThan(0);

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const assignedProviderAccount = (await repository.listAccounts()).find(
      (account) => account.role === "provider" && account.linkedProviderId === createdOrder.providerId,
    );
    const providerBeforeAccept = await repository.getProviderProfile(createdOrder.providerId);
    const hotelOrdersBeforeAccept = await repository.listHotelOrders(hotelRegistration.hotel.id);

    expect(assignedProviderAccount?.email).toBeDefined();
    expect(hotelOrdersBeforeAccept.some((order) => order.id === createdOrder.id)).toBe(true);

    clearClientSession();
    await signInAs(service, assignedProviderAccount!.email);
    const providerDashboardBeforeAccept = await service.getProviderDashboardData();

    expect(providerDashboardBeforeAccept.incomingOrders.some((order) => order.id === createdOrder.id)).toBe(true);

    const acceptedOrder = await service.acceptIncomingOrder(createdOrder.id);

    expect(acceptedOrder.status).toBe(OrderStatus.Accepted);
    expect(acceptedOrder.activeAssignment?.status).toBe(AssignmentStatus.Accepted);
    expect(acceptedOrder.assignmentHistory.some((history) => history.toStatus === AssignmentStatus.Accepted)).toBe(
      true,
    );

    const providerDashboardAfterAccept = await service.getProviderDashboardData();
    expect(providerDashboardAfterAccept.incomingOrders.some((order) => order.id === createdOrder.id)).toBe(false);
    expect(providerDashboardAfterAccept.activeOrders.some((order) => order.id === createdOrder.id)).toBe(true);

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const providerAfterAccept = await repository.getProviderProfile(createdOrder.providerId);
    const persistedOrder = (await repository.listAllOrders()).find((order) => order.id === createdOrder.id);

    expect(persistedOrder?.status).toBe(OrderStatus.Accepted);
    expect(providerAfterAccept.currentCapacity.availableKg).toBe(providerBeforeAccept.currentCapacity.availableKg);
    expect(providerAfterAccept.currentCapacity.reservedKg).toBeLessThan(providerBeforeAccept.currentCapacity.reservedKg);
    expect(providerAfterAccept.currentCapacity.committedKg).toBeGreaterThan(
      providerBeforeAccept.currentCapacity.committedKg,
    );

    clearClientSession();
    await signInAs(service, hotelRegistration.account.email);
    const hotelDashboardAfterAccept = await service.getHotelDashboardData();
    expect(hotelDashboardAfterAccept.recentOrders.find((order) => order.id === createdOrder.id)?.status).toBe(
      OrderStatus.Accepted,
    );

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const adminDashboard = await service.getAdminDashboardData();
    expect(adminDashboard.matchingTransparency.find((entry) => entry.orderId === createdOrder.id)?.currentStatus).toBe(
      OrderStatus.Accepted,
    );
  });

  it("reassigns after provider rejection, persists logs/history/events, and exposes the order to the next provider", async () => {
    const { repository, service } = createServiceContext();
    const { registration: hotelRegistration } = await registerAndActivateHotel(service, {
      hotelName: "فندق رحلة إعادة الإسناد",
      contactEmail: "hotel-reassign-e2e@washoff.sa",
      contactPhone: "0506006006",
    });

    const createdOrder = await service.createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1301",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 40 }],
        pickupAt: "2030-03-24T10:00:00+03:00",
        notes: "طلب مخصص لاختبار إعادة الإسناد",
      }),
      notes: "طلب مخصص لاختبار إعادة الإسناد",
    });

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const firstProviderAccount = (await repository.listAccounts()).find(
      (account) => account.role === "provider" && account.linkedProviderId === createdOrder.providerId,
    );

    clearClientSession();
    await signInAs(service, firstProviderAccount!.email);
    const reassignedOrder = await service.rejectAssignment({
      orderId: createdOrder.id,
    });

    expect(reassignedOrder.status).toBe(OrderStatus.Assigned);
    expect(reassignedOrder.providerId).toBeTruthy();
    expect(reassignedOrder.providerId).not.toBe(createdOrder.providerId);
    expect(reassignedOrder.activeAssignment?.attemptNumber).toBe(2);
    expect(reassignedOrder.activeAssignment?.status).toBe(AssignmentStatus.PendingAcceptance);
    expect(reassignedOrder.assignmentHistory.some((history) => history.toStatus === AssignmentStatus.Rejected)).toBe(
      true,
    );
    expect(reassignedOrder.reassignmentEvents.at(-1)?.reason).toBe(ReassignmentReason.ProviderRejected);
    expect(reassignedOrder.matchingLogs.length).toBeGreaterThan(createdOrder.matchingLogs.length);

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const persistedOrder = (await repository.listAllOrders()).find((order) => order.id === createdOrder.id);
    const nextProviderAccount = (await repository.listAccounts()).find(
      (account) => account.role === "provider" && account.linkedProviderId === reassignedOrder.providerId,
    );

    expect(persistedOrder?.assignmentHistory.some((history) => history.toStatus === AssignmentStatus.Rejected)).toBe(
      true,
    );
    expect(persistedOrder?.reassignmentEvents.at(-1)?.reason).toBe(ReassignmentReason.ProviderRejected);
    expect(persistedOrder?.providerId).toBe(reassignedOrder.providerId);

    clearClientSession();
    await signInAs(service, nextProviderAccount!.email);
    const nextProviderDashboard = await service.getProviderDashboardData();
    expect(nextProviderDashboard.incomingOrders.some((order) => order.id === createdOrder.id)).toBe(true);

    clearClientSession();
    await signInAs(service, hotelRegistration.account.email);
    const hotelDashboardAfterReassignment = await service.getHotelDashboardData();
    expect(hotelDashboardAfterReassignment.recentOrders.find((order) => order.id === createdOrder.id)?.providerId).toBe(
      reassignedOrder.providerId,
    );

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const adminDashboard = await service.getAdminDashboardData();
    expect(adminDashboard.recentReassignments.some((item) => item.orderId === createdOrder.id)).toBe(true);
  });

  it("advances an accepted order through the full execution lifecycle and completes it from the hotel side", async () => {
    const { repository, service } = createServiceContext();
    const { registration: hotelRegistration } = await registerAndActivateHotel(service, {
      hotelName: "فندق دورة التنفيذ الكاملة",
      contactEmail: "hotel-execution-e2e@washoff.sa",
      contactPhone: "0508008008",
    });

    const createdOrder = await service.createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1410",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 18 }],
        pickupAt: "2030-03-27T10:00:00+03:00",
        notes: "طلب مخصص للتحقق من دورة التنفيذ الكاملة",
      }),
      notes: "طلب مخصص للتحقق من دورة التنفيذ الكاملة",
    });

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const assignedProviderAccount = (await repository.listAccounts()).find(
      (account) => account.role === "provider" && account.linkedProviderId === createdOrder.providerId,
    );

    clearClientSession();
    await signInAs(service, assignedProviderAccount!.email);
    await service.acceptIncomingOrder(createdOrder.id);

    const lifecycleStatuses = [
      OrderStatus.PickupScheduled,
      OrderStatus.PickedUp,
      OrderStatus.InProcessing,
      OrderStatus.QualityCheck,
      OrderStatus.OutForDelivery,
      OrderStatus.Delivered,
    ] as const;

    let progressedOrder = await service.getProviderDashboardData().then((dashboard) =>
      dashboard.activeOrders.find((order) => order.id === createdOrder.id)!,
    );

    for (const nextStatus of lifecycleStatuses) {
      progressedOrder = await service.advanceProviderOrderExecution({
        orderId: createdOrder.id,
        nextStatus,
      });
      expect(progressedOrder.status).toBe(nextStatus);
    }

    expect(progressedOrder.statusHistory?.map((entry) => entry.toStatus)).toEqual(
      expect.arrayContaining([
        OrderStatus.Submitted,
        OrderStatus.AutoMatching,
        OrderStatus.Assigned,
        OrderStatus.Accepted,
        OrderStatus.PickupScheduled,
        OrderStatus.PickedUp,
        OrderStatus.InProcessing,
        OrderStatus.QualityCheck,
        OrderStatus.OutForDelivery,
        OrderStatus.Delivered,
      ]),
    );

    clearClientSession();
    await signInAs(service, hotelRegistration.account.email);
    const hotelDashboardBeforeCompletion = await service.getHotelDashboardData();
    expect(hotelDashboardBeforeCompletion.recentOrders.find((order) => order.id === createdOrder.id)?.roomNumber).toBe(
      "1410",
    );
    expect(hotelDashboardBeforeCompletion.recentOrders.find((order) => order.id === createdOrder.id)?.status).toBe(
      OrderStatus.Delivered,
    );

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const providerBeforeCompletion = await repository.getProviderProfile(createdOrder.providerId);

    clearClientSession();
    await signInAs(service, hotelRegistration.account.email);
    const completedOrder = await service.confirmHotelOrderCompletion({
      orderId: createdOrder.id,
    });

    expect(completedOrder.status).toBe(OrderStatus.Completed);
    expect(completedOrder.statusHistory?.at(-1)?.toStatus).toBe(OrderStatus.Completed);

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const persistedOrder = (await repository.listAllOrders()).find((order) => order.id === createdOrder.id);
    const providerAfterCompletion = await repository.getProviderProfile(createdOrder.providerId);
    const adminDashboard = await service.getAdminDashboardData();

    expect(persistedOrder?.status).toBe(OrderStatus.Completed);
    expect(persistedOrder?.statusHistory?.at(-1)?.actorRole).toBe("hotel");
    expect(providerAfterCompletion.performance.completedOrders).toBe(
      providerBeforeCompletion.performance.completedOrders + 1,
    );
    expect(adminDashboard.matchingTransparency.find((entry) => entry.orderId === createdOrder.id)?.currentStatus).toBe(
      OrderStatus.Completed,
    );
  });

  it("rejects invalid execution transitions, blocks wrong providers, and prevents premature hotel completion", async () => {
    const { repository, service } = createServiceContext();
    const { registration: hotelRegistration } = await registerAndActivateHotel(service, {
      hotelName: "فندق تحقق الانتقالات",
      contactEmail: "hotel-transition-e2e@washoff.sa",
      contactPhone: "0509009009",
    });

    const createdOrder = await service.createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1502",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 14 }],
        pickupAt: "2030-03-28T10:00:00+03:00",
        notes: "طلب لاختبار الانتقالات غير الصالحة",
      }),
      notes: "طلب لاختبار الانتقالات غير الصالحة",
    });

    clearClientSession();
    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    const accounts = await repository.listAccounts();
    const assignedProviderAccount = accounts.find(
      (account) => account.role === "provider" && account.linkedProviderId === createdOrder.providerId,
    );
    const otherProviderAccount = accounts.find(
      (account) =>
        account.role === "provider" &&
        account.linkedProviderId &&
        account.linkedProviderId !== createdOrder.providerId,
    );

    clearClientSession();
    await signInAs(service, assignedProviderAccount!.email);
    await service.acceptIncomingOrder(createdOrder.id);

    await expect(
      service.advanceProviderOrderExecution({
        orderId: createdOrder.id,
        nextStatus: OrderStatus.Delivered,
      }),
    ).rejects.toThrow("مقبول");

    clearClientSession();
    await signInAs(service, otherProviderAccount!.email);
    await expect(
      service.advanceProviderOrderExecution({
        orderId: createdOrder.id,
        nextStatus: OrderStatus.PickupScheduled,
      }),
    ).rejects.toThrow();

    clearClientSession();
    await signInAs(service, hotelRegistration.account.email);
    await expect(
      service.confirmHotelOrderCompletion({
        orderId: createdOrder.id,
      }),
    ).rejects.toThrow("التسليم");
  });

  it("blocks unapproved entities from operational access and excludes unapproved providers from matching", async () => {
    const { repository, service } = createServiceContext();

    const hotelRegistration = await service.registerHotel(
      buildHotelRegistrationInput({
        hotelName: "فندق غير معتمد",
        contactPersonName: "هدى",
        contactEmail: "hotel-pending-e2e@washoff.sa",
        contactPhone: "0507007007",
      }),
    );
    const providerRegistration = await service.registerProvider(
      buildProviderRegistrationInput({
        providerName: "مغسلة غير معتمدة",
        businessPhone: "0557007007",
        businessEmail: "provider-pending-ops@washoff.sa",
        accountFullName: "رائد",
        accountPhone: "0557007007",
        accountEmail: "provider-pending-e2e@washoff.sa",
        dailyCapacityKg: 260,
      }),
    );

    expect(hotelRegistration.hotel.onboarding.status).toBe(OnboardingStatus.PendingApproval);
    expect(providerRegistration.provider.onboarding.status).toBe(OnboardingStatus.PendingApproval);

    await expect(
      service.login({
        email: hotelRegistration.account.email,
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toThrow();
    await expect(
      service.login({
        email: providerRegistration.account.email,
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toThrow();

    await signInAs(service, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
    await expect(
      service.createHotelOrder({
        ...buildHotelOrderCommand({
          hotelId: hotelRegistration.hotel.id,
          roomNumber: "1601",
          items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 12 }],
          pickupAt: "2030-03-25T10:00:00+03:00",
        }),
      }),
    ).rejects.toThrow("اعتماد");
    await expect(repository.listProviderIncomingOrders(providerRegistration.provider.id)).rejects.toThrow("اعتماد");

    clearClientSession();
    await signInAs(service, "hotel.ops@washoff.sa");
    const order = await service.createHotelOrder({
      ...buildHotelOrderCommand({
        roomNumber: "1608",
        items: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, quantity: 22 }],
        pickupAt: "2030-03-26T10:00:00+03:00",
        notes: "تحقق من استبعاد المزود غير المعتمد",
      }),
      notes: "تحقق من استبعاد المزوّد غير المعتمد",
    });
    const pendingProviderLog = order.matchingLogs.find((log) => log.providerId === providerRegistration.provider.id);

    expect(pendingProviderLog?.eligibilityResult.reasonCodes).toContain(EligibilityReasonCode.ProviderNotApproved);
  });
});
