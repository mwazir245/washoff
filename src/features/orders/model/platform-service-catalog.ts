import {
  type LocalizedText,
  ServiceBillingUnit,
  type PlatformProduct,
  type PlatformServiceMatrixRow,
  type PlatformServiceType,
  PlatformServiceTypeCode,
  ServicePricingUnit,
  buildServiceCatalogItemDescription,
  buildServiceCatalogItemName,
  getDefaultRushSupportForServiceType,
  getDefaultTurnaroundHoursForServiceType,
  getServiceTypeLabelAr,
  getServiceTypeLabelEn,
  mapServiceTypeToCategory,
  type ProviderServiceCurrentStatus,
  ProviderServiceProposalStatus,
  type ProviderServiceOffering,
  type ServiceCatalogItem,
} from "@/features/orders/model/service";

interface PlatformProductSeed {
  code: string;
  nameAr: string;
  suggestedPrices: Partial<Record<PlatformServiceTypeCode, number>>;
}

const productSeeds: PlatformProductSeed[] = [
  { code: "thobe", nameAr: "ثوب", suggestedPrices: { dry_clean: 12.65, iron: 3.45, wash_and_iron: 5.75 } },
  { code: "sirwal", nameAr: "سروال", suggestedPrices: { dry_clean: 5.75, iron: 2.88, wash_and_iron: 3.45 } },
  { code: "winter_thobe", nameAr: "ثوب شتوي", suggestedPrices: { dry_clean: 12.65, iron: 3.45, wash_and_iron: 6.9 } },
  { code: "shemagh_ghutra", nameAr: "شماغ - غترة", suggestedPrices: { dry_clean: 27.6, iron: 9.2, wash_and_iron: 13.8 } },
  { code: "mishlah", nameAr: "مشلح", suggestedPrices: { dry_clean: 9.2, iron: 3.45, wash_and_iron: 5.75 } },
  { code: "shirt", nameAr: "قميص", suggestedPrices: { dry_clean: 11.5, iron: 3.45, wash_and_iron: 5.75 } },
  { code: "pants", nameAr: "بنطلون", suggestedPrices: { dry_clean: 11.5, iron: 3.45, wash_and_iron: 5.75 } },
  { code: "tie", nameAr: "ربطة عنق", suggestedPrices: { dry_clean: 5.75, iron: 2.3, wash_and_iron: 4.6 } },
  { code: "jacket", nameAr: "جاكيت", suggestedPrices: { dry_clean: 21.85, iron: 4.6, wash_and_iron: 13.8 } },
  { code: "long_jacket", nameAr: "جاكيت طويل", suggestedPrices: { dry_clean: 25.3, iron: 6.9, wash_and_iron: 13.8 } },
  { code: "socks", nameAr: "شراريب", suggestedPrices: { dry_clean: 3.45, wash_and_iron: 1.73 } },
  { code: "blouse", nameAr: "بلوزة", suggestedPrices: { dry_clean: 11.5, iron: 3.45, wash_and_iron: 5.75 } },
  { code: "skirt", nameAr: "تنورة", suggestedPrices: { dry_clean: 13.8, iron: 4.6, wash_and_iron: 5.75 } },
  { code: "abaya", nameAr: "عباية", suggestedPrices: { dry_clean: 27.6, iron: 6.9, wash_and_iron: 14.95 } },
  { code: "niqab_hijab", nameAr: "نقاب - حجاب", suggestedPrices: { dry_clean: 9.2, iron: 3.45, wash_and_iron: 4.02 } },
  { code: "wedding_dress", nameAr: "فستان زواج", suggestedPrices: { dry_clean: 80.5 } },
  { code: "dress", nameAr: "فستان", suggestedPrices: { dry_clean: 24, iron: 8, wash_and_iron: 12 } },
  { code: "shorts", nameAr: "شورت", suggestedPrices: { dry_clean: 11.5, iron: 3.45, wash_and_iron: 4.6 } },
  { code: "shawl", nameAr: "شال", suggestedPrices: { dry_clean: 8, iron: 3, wash_and_iron: 3.5 } },
  { code: "cap_prayer", nameAr: "طاقية", suggestedPrices: { dry_clean: 2.3, wash_and_iron: 1.73 } },
  { code: "undershirt", nameAr: "فنيلة داخلية", suggestedPrices: { dry_clean: 5.75, iron: 1.73, wash_and_iron: 2.88 } },
  { code: "underpants", nameAr: "سروال داخلي", suggestedPrices: { dry_clean: 5.75, iron: 1.73, wash_and_iron: 2.88 } },
  { code: "towel", nameAr: "منشفة", suggestedPrices: { dry_clean: 13.8, wash_and_iron: 8.05 } },
  { code: "small_towel", nameAr: "منشفة صغيرة", suggestedPrices: { dry_clean: 9.2, wash_and_iron: 4.6 } },
  { code: "bathrobe", nameAr: "روب حمام", suggestedPrices: { dry_clean: 16.1, wash_and_iron: 12.65 } },
  { code: "blanket_small", nameAr: "بطانية صغيرة", suggestedPrices: { dry_clean: 40.25, wash_and_iron: 24.15 } },
  { code: "blanket_medium", nameAr: "بطانية وسط", suggestedPrices: { dry_clean: 51.75, wash_and_iron: 32.2 } },
  { code: "blanket_large", nameAr: "بطانية كبيرة", suggestedPrices: { dry_clean: 41.96, wash_and_iron: 32.76 } },
  { code: "bed_cover", nameAr: "غطاء سرير", suggestedPrices: { dry_clean: 18.4, iron: 5.75, wash_and_iron: 9.2 } },
  { code: "bedsheet", nameAr: "شرشف", suggestedPrices: { dry_clean: 11.5, iron: 8.05, wash_and_iron: 11.5 } },
  { code: "pillow_cover", nameAr: "غطاء مخدة", suggestedPrices: { dry_clean: 10.35, iron: 2.3, wash_and_iron: 4.03 } },
  { code: "cap", nameAr: "كاب", suggestedPrices: { dry_clean: 9.2, wash_and_iron: 2.88 } },
  { code: "winter_shirt", nameAr: "قميص شتوي", suggestedPrices: { dry_clean: 13.8, iron: 4.6, wash_and_iron: 8.05 } },
  { code: "pillow", nameAr: "مخدة", suggestedPrices: { dry_clean: 13.8, wash_and_iron: 11.5 } },
  { code: "kids_clothes", nameAr: "ملابس أطفال", suggestedPrices: { dry_clean: 13.8, iron: 3.45, wash_and_iron: 8.05 } },
  { code: "three_piece_suit", nameAr: "بدلة 3 قطع", suggestedPrices: { dry_clean: 35.36, iron: 11.21, wash_and_iron: 23.56 } },
  { code: "overall", nameAr: "أفرول", suggestedPrices: { dry_clean: 18.4, iron: 6.9, wash_and_iron: 10.35 } },
  { code: "pakistani_suit", nameAr: "بدلة باكستاني", suggestedPrices: { dry_clean: 21.85, iron: 5.75, wash_and_iron: 9.2 } },
  { code: "carpet", nameAr: "سجادة", suggestedPrices: { wash_and_iron: 11.49 } },
  { code: "pair_of_shoes", nameAr: "زوج أحذية", suggestedPrices: { wash_and_iron: 23 } },
  { code: "fur_coat", nameAr: "فروة", suggestedPrices: { dry_clean: 39.66 } },
];

const serviceTypeSortOrder: PlatformServiceTypeCode[] = [
  PlatformServiceTypeCode.DryClean,
  PlatformServiceTypeCode.Iron,
  PlatformServiceTypeCode.WashAndIron,
];

export const buildDefaultPlatformServiceTypes = (): PlatformServiceType[] =>
  serviceTypeSortOrder.map((code, index) => ({
    id: code,
    code,
    name: {
      ar: getServiceTypeLabelAr(code),
      en: getServiceTypeLabelEn(code),
    },
    fixed: true,
    active: true,
    sortOrder: index + 1,
  }));

export const buildDefaultPlatformProducts = (): PlatformProduct[] =>
  productSeeds.map((seed, index) => ({
    id: `product-${seed.code}`,
    code: seed.code,
    name: { ar: seed.nameAr },
    active: true,
    sortOrder: index + 1,
  }));

export const normalizePlatformProductNames = (names: string[]) => {
  const seen = new Set<string>();

  return names
    .map((name) => name.trim().replace(/\s+/g, " "))
    .filter((name) => {
      if (!name.length || seen.has(name)) {
        return false;
      }

      seen.add(name);
      return true;
    });
};

export const buildDefaultPlatformServiceMatrix = (): PlatformServiceMatrixRow[] => {
  const products = buildDefaultPlatformProducts();
  const productByCode = new Map(products.map((product) => [product.code, product]));
  let sortOrder = 1;

  return productSeeds.flatMap((seed) => {
    const product = productByCode.get(seed.code);

    if (!product) {
      return [];
    }

    return serviceTypeSortOrder.map<PlatformServiceMatrixRow>((serviceTypeCode) => {
      const suggestedPriceSar = seed.suggestedPrices[serviceTypeCode];
      const available = typeof suggestedPriceSar === "number";

      return {
        id: `svc-${product.code}-${serviceTypeCode}`,
        code: `svc_${product.code}_${serviceTypeCode}`,
        productId: product.id,
        serviceTypeId: serviceTypeCode,
        pricingUnit: ServicePricingUnit.Piece,
        suggestedPriceSar,
        isAvailable: available,
        active: available,
        sortOrder: sortOrder++,
      };
    });
  });
};

export const buildPlatformServiceTypeLookup = (serviceTypes: PlatformServiceType[]) =>
  new Map(serviceTypes.map((serviceType) => [serviceType.id, serviceType]));

export const buildPlatformProductLookup = (products: PlatformProduct[]) =>
  new Map(products.map((product) => [product.id, product]));

export const buildPlatformMatrixLookup = (matrixRows: PlatformServiceMatrixRow[]) =>
  new Map(matrixRows.map((row) => [row.id, row]));

export interface PlatformServiceCatalogSummary {
  serviceTypes: PlatformServiceType[];
  products: PlatformProduct[];
  matrixRows: PlatformServiceMatrixRow[];
}

export const buildDefaultPlatformServiceCatalog = (): PlatformServiceCatalogSummary => ({
  serviceTypes: buildDefaultPlatformServiceTypes(),
  products: buildDefaultPlatformProducts(),
  matrixRows: buildDefaultPlatformServiceMatrix(),
});

const buildLocalizedPlatformServiceName = (
  productNameAr: string,
  serviceTypeCode: PlatformServiceTypeCode,
) => buildServiceCatalogItemName(productNameAr, serviceTypeCode);

export const buildHotelFacingServiceCatalog = ({
  serviceTypes,
  products,
  matrixRows,
  offerings,
  hotelContractPricesByServiceId,
}: PlatformServiceCatalogSummary & {
  offerings: ProviderServiceOffering[];
  hotelContractPricesByServiceId?: Map<string, number>;
}): ServiceCatalogItem[] => {
  const productById = buildPlatformProductLookup(products);
  const serviceTypeById = buildPlatformServiceTypeLookup(serviceTypes);
  const activeOfferingsByServiceId = new Map<
    string,
    Array<ProviderServiceOffering & { currentApprovedPriceSar: number }>
  >();

  offerings.forEach((offering) => {
    if (
      offering.currentStatus !== "active" ||
      typeof offering.currentApprovedPriceSar !== "number" ||
      !offering.activeMatrix ||
      !offering.availableMatrix
    ) {
      return;
    }

    const list = activeOfferingsByServiceId.get(offering.serviceId) ?? [];
    list.push(offering as ProviderServiceOffering & { currentApprovedPriceSar: number });
    activeOfferingsByServiceId.set(offering.serviceId, list);
  });

  return matrixRows
    .filter((row) => row.active && row.isAvailable)
    .map((row) => {
      const product = productById.get(row.productId);
      const serviceType = serviceTypeById.get(row.serviceTypeId);
      const activeOfferings = activeOfferingsByServiceId.get(row.id) ?? [];

      if (!product || !serviceType || activeOfferings.length === 0) {
        return undefined;
      }

      const hotelContractUnitPriceSar = hotelContractPricesByServiceId?.get(row.id);

      if (hotelContractPricesByServiceId && typeof hotelContractUnitPriceSar !== "number") {
        return undefined;
      }

      const lowestApprovedPriceSar = activeOfferings.reduce(
        (current, offering) => Math.min(current, offering.currentApprovedPriceSar),
        Number.POSITIVE_INFINITY,
      );
      const category = mapServiceTypeToCategory(serviceType.code);
      const resolvedHotelUnitPriceSar =
        typeof hotelContractUnitPriceSar === "number"
          ? hotelContractUnitPriceSar
          : typeof row.suggestedPriceSar === "number"
            ? row.suggestedPriceSar
            : lowestApprovedPriceSar;

      return {
        id: row.id,
        code: row.code,
        name: buildLocalizedPlatformServiceName(product.name.ar, serviceType.code),
        description: buildServiceCatalogItemDescription(product.name.ar, serviceType.code),
        category,
        billingUnit: ServiceBillingUnit.Piece,
        defaultUnitPriceSar: resolvedHotelUnitPriceSar,
        defaultTurnaroundHours: getDefaultTurnaroundHoursForServiceType(serviceType.code),
        supportsRush: getDefaultRushSupportForServiceType(serviceType.code),
        active: true,
        productId: product.id,
        productName: product.name,
        serviceType: serviceType.code,
        serviceTypeName: serviceType.name,
        pricingUnit: row.pricingUnit,
        suggestedPriceSar: row.suggestedPriceSar,
        isAvailable: row.isAvailable,
        operationalProviderCount: activeOfferings.length,
        lowestApprovedPriceSar,
      } satisfies ServiceCatalogItem;
    })
    .filter((entry): entry is ServiceCatalogItem => Boolean(entry))
    .sort((left, right) => {
      const leftProduct = productById.get(left.productId ?? "");
      const rightProduct = productById.get(right.productId ?? "");

      if ((leftProduct?.sortOrder ?? 0) !== (rightProduct?.sortOrder ?? 0)) {
        return (leftProduct?.sortOrder ?? 0) - (rightProduct?.sortOrder ?? 0);
      }

      return left.name.ar.localeCompare(right.name.ar, "ar");
    });
};

export const buildProviderCapabilitiesFromApprovedOfferings = ({
  providerId,
  serviceTypes,
  products,
  matrixRows,
  offerings,
}: {
  providerId: string;
  serviceTypes: PlatformServiceType[];
  products: PlatformProduct[];
  matrixRows: PlatformServiceMatrixRow[];
  offerings: ProviderServiceOffering[];
}) => {
  const productById = buildPlatformProductLookup(products);
  const serviceTypeById = buildPlatformServiceTypeLookup(serviceTypes);
  const matrixById = buildPlatformMatrixLookup(matrixRows);

  return offerings
    .filter(
      (offering) =>
        offering.providerId === providerId &&
        offering.currentStatus === "active" &&
        typeof offering.currentApprovedPriceSar === "number" &&
        offering.activeMatrix &&
        offering.availableMatrix,
    )
    .map((offering) => {
      const matrixRow = matrixById.get(offering.serviceId);
      const serviceType = serviceTypeById.get(offering.serviceType);
      const product = productById.get(offering.productId);

      if (!matrixRow || !serviceType || !product) {
        return undefined;
      }

      return {
        serviceId: matrixRow.id,
        serviceName: buildLocalizedPlatformServiceName(product.name.ar, serviceType.code),
        active: true,
        unitPriceSar: offering.currentApprovedPriceSar,
        rushSupported: getDefaultRushSupportForServiceType(serviceType.code),
        defaultTurnaroundHours: getDefaultTurnaroundHoursForServiceType(serviceType.code),
        sourceOfferingId: offering.id,
        hasApprovedActivePrice: true,
      };
    })
    .filter((capability): capability is NonNullable<typeof capability> => Boolean(capability));
};

export const buildPlatformCatalogMatrixLabel = ({
  productName,
  serviceTypeName,
}: {
  productName: LocalizedText;
  serviceTypeName: LocalizedText;
}) => `${productName.ar} - ${serviceTypeName.ar}`;

export const resolveProviderOfferingStatusBadgeTone = (
  currentStatus: ProviderServiceCurrentStatus,
  proposedStatus?: ProviderServiceProposalStatus,
) => {
  if (proposedStatus === ProviderServiceProposalStatus.PendingApproval) {
    return "warning";
  }

  if (proposedStatus === ProviderServiceProposalStatus.Rejected) {
    return "danger";
  }

  return currentStatus === "active" ? "success" : "default";
};
