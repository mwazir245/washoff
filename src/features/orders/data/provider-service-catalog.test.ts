import { beforeEach, describe, expect, it } from "vitest";
import { clearClientSession, storeClientSession } from "@/features/auth/infrastructure/client-auth-storage";
import {
  buildDefaultPlatformServiceCatalog,
  buildHotelFacingServiceCatalog,
  normalizePlatformProductNames,
} from "@/features/orders/model/platform-service-catalog";
import {
  PlatformServiceCurrentStatus,
  PlatformServiceTypeCode,
  ProviderServiceProposalStatus,
  ServicePricingUnit,
  type ProviderServiceOffering,
} from "@/features/orders/model/service";
import {
  approveProviderRegistration,
  approveProviderServicePricing,
  getPlatformServiceCatalogAdminData,
  getProviderPricingAdminData,
  getProviderServiceManagement,
  login,
  registerProvider,
  rejectProviderServicePricing,
  resetMockOrdersRepository,
  submitProviderServicePricing,
  updatePlatformServiceMatrix,
  upsertPlatformProduct,
} from "@/features/orders/data/mock-orders.repository";

const DEFAULT_ADMIN_PASSWORD = "Zajillema2@123";
const DEFAULT_REQUESTED_SERVICE_ID = "svc-thobe-dry_clean";

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
  servicePricing: [
    { serviceId: DEFAULT_REQUESTED_SERVICE_ID, proposedPriceSar: 12.65 },
    { serviceId: "svc-shirt-iron", proposedPriceSar: 3.45 },
  ],
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
  accountEmail: "provider-catalog@washoff.sa",
  ...overrides,
});

describe("provider service catalog and pricing approval", () => {
  beforeEach(() => {
    resetMockOrdersRepository();
    clearClientSession();
  });

  it("normalizes duplicate product names and hides unavailable or pending-only combinations from the hotel-facing catalog", () => {
    expect(
      normalizePlatformProductNames(["ملابس أطفال", "  ملابس أطفال  ", "ثوب", "", "ثوب"]),
    ).toEqual(["ملابس أطفال", "ثوب"]);

    const catalog = buildDefaultPlatformServiceCatalog();
    const unavailableWeddingIron = catalog.matrixRows.find((row) => row.id === "svc-wedding_dress-iron");

    expect(unavailableWeddingIron).toMatchObject({
      isAvailable: false,
      active: false,
    });

    const hotelFacingCatalog = buildHotelFacingServiceCatalog({
      ...catalog,
      offerings: [
        {
          id: "offering-active",
          providerId: "provider-test",
          serviceId: DEFAULT_REQUESTED_SERVICE_ID,
          productId: "product-thobe",
          productName: { ar: "ثوب" },
          serviceType: PlatformServiceTypeCode.DryClean,
          serviceTypeName: { ar: "غسيل جاف" },
          pricingUnit: ServicePricingUnit.Piece,
          currentApprovedPriceSar: 12.65,
          currentStatus: PlatformServiceCurrentStatus.Active,
          currentStatusLabelAr: "نشط",
          proposedPriceSar: 18.5,
          proposedStatus: ProviderServiceProposalStatus.PendingApproval,
          proposedStatusLabelAr: "بانتظار الاعتماد",
          activeMatrix: true,
          availableMatrix: true,
          createdAt: "2030-03-20T10:00:00.000Z",
          updatedAt: "2030-03-20T10:00:00.000Z",
        },
        {
          id: "offering-pending-only",
          providerId: "provider-test",
          serviceId: "svc-wedding_dress-dry_clean",
          productId: "product-wedding_dress",
          productName: { ar: "فستان زواج" },
          serviceType: PlatformServiceTypeCode.DryClean,
          serviceTypeName: { ar: "غسيل جاف" },
          pricingUnit: ServicePricingUnit.Piece,
          currentStatus: PlatformServiceCurrentStatus.Inactive,
          currentStatusLabelAr: "غير نشط",
          proposedPriceSar: 80.5,
          proposedStatus: ProviderServiceProposalStatus.PendingApproval,
          proposedStatusLabelAr: "بانتظار الاعتماد",
          activeMatrix: true,
          availableMatrix: true,
          createdAt: "2030-03-20T10:00:00.000Z",
          updatedAt: "2030-03-20T10:00:00.000Z",
        },
      ] satisfies ProviderServiceOffering[],
    });

    expect(
      hotelFacingCatalog.find((service) => service.id === DEFAULT_REQUESTED_SERVICE_ID)?.defaultUnitPriceSar,
    ).toBe(12.65);
    expect(hotelFacingCatalog.some((service) => service.id === "svc-wedding_dress-dry_clean")).toBe(false);
  });

  it("allows admin to add a platform product and deactivate a matrix row", async () => {
    const adminSession = await login({
      email: "mmekawe@hotmail.com",
      password: DEFAULT_ADMIN_PASSWORD,
    });
    storeClientSession(adminSession);

    const createdProduct = await upsertPlatformProduct({
      nameAr: "مفرش طاولة",
      active: true,
    });
    const catalogAfterCreate = await getPlatformServiceCatalogAdminData();
    const createdProductRows = catalogAfterCreate.matrixRows.filter((row) => row.productId === createdProduct.id);

    expect(createdProductRows).toHaveLength(3);
    expect(createdProductRows.every((row) => row.pricingUnit === ServicePricingUnit.Piece)).toBe(true);

    await updatePlatformServiceMatrix({
      matrixRowId: DEFAULT_REQUESTED_SERVICE_ID,
      active: false,
      isAvailable: false,
    });

    const catalogAfterDeactivate = await getPlatformServiceCatalogAdminData();
    expect(catalogAfterDeactivate.matrixRows.find((row) => row.id === DEFAULT_REQUESTED_SERVICE_ID)).toMatchObject({
      active: false,
      isAvailable: false,
    });
  });

  it("accepts only platform-managed combinations and stores first provider prices as pending approval", async () => {
    await expect(
      registerProvider(
        buildProviderRegistrationInput({
          providerName: "مغسلة خدمة غير مدارة",
          businessPhone: "0554444444",
          businessEmail: "catalog-invalid-ops@washoff.sa",
          accountFullName: "سلمان",
          accountPhone: "0554444444",
          accountEmail: "catalog-invalid@washoff.sa",
          servicePricing: [{ serviceId: "custom-free-text-service", proposedPriceSar: 22 }],
        }),
      ),
    ).rejects.toThrow("تعذر العثور على الخدمة القياسية");

    const registration = await registerProvider(
      buildProviderRegistrationInput({
        providerName: "مغسلة تسعير موحد",
        businessPhone: "0553333333",
        businessEmail: "catalog-pricing-ops@washoff.sa",
        accountFullName: "ريان",
        accountPhone: "0553333333",
        accountEmail: "catalog-pricing@washoff.sa",
      }),
    );

    expect(
      registration.provider.serviceOfferings.every(
        (offering) => offering.proposedStatus === ProviderServiceProposalStatus.PendingApproval,
      ),
    ).toBe(true);
    expect(
      registration.provider.serviceOfferings.every(
        (offering) => offering.currentStatus === PlatformServiceCurrentStatus.Inactive,
      ),
    ).toBe(true);
  });

  it("keeps the approved active price when admin rejects a newly proposed provider price", async () => {
    const registration = await registerProvider(
      buildProviderRegistrationInput({
        providerName: "مغسلة مراجعة الأسعار",
        businessPhone: "0555555555",
        businessEmail: "pricing-review-ops@washoff.sa",
        accountFullName: "مشاعل",
        accountPhone: "0555555555",
        accountEmail: "pricing-review@washoff.sa",
      }),
    );
    const providerId = registration.provider.id;

    await approveProviderRegistration(providerId, "اعتماد أولي للمزوّد");
    const initialReview = await getProviderPricingAdminData();

    for (const reviewEntry of initialReview.pendingReviews.filter((entry) => entry.providerId === providerId)) {
      await approveProviderServicePricing(reviewEntry.offeringId);
    }

    await submitProviderServicePricing({
      providerId,
      offerings: [{ serviceId: DEFAULT_REQUESTED_SERVICE_ID, proposedPriceSar: 14.25 }],
    });

    const pricingReview = await getProviderPricingAdminData();
    const pendingReview = pricingReview.pendingReviews.find(
      (entry) => entry.providerId === providerId && entry.proposedPriceSar === 14.25,
    );

    expect(pendingReview?.currentApprovedPriceSar).toBe(12.65);
    expect(pendingReview?.proposedPriceSar).toBe(14.25);

    await rejectProviderServicePricing({
      offeringId: pendingReview!.offeringId,
      rejectionReasonAr: "السعر المقترح يحتاج مراجعة إضافية.",
    });

    const providerServiceManagement = await getProviderServiceManagement(providerId);
    const reviewedOffering = providerServiceManagement.offerings.find(
      (offering) => offering.id === pendingReview!.offeringId,
    );

    expect(reviewedOffering).toMatchObject({
      currentApprovedPriceSar: 12.65,
      currentStatus: PlatformServiceCurrentStatus.Active,
      proposedPriceSar: 14.25,
      proposedStatus: ProviderServiceProposalStatus.Rejected,
      rejectionReasonAr: "السعر المقترح يحتاج مراجعة إضافية.",
    });
  });
});
