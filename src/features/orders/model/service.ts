import type { ISODateString, LocalizedText } from "@/features/orders/model/common";

export enum ServiceCategory {
  Laundry = "laundry",
  DryCleaning = "dry_cleaning",
  Pressing = "pressing",
  Specialty = "specialty",
}

export enum ServiceBillingUnit {
  Kilogram = "kilogram",
  Piece = "piece",
}

export enum ServicePricingUnit {
  Piece = "piece",
}

export enum PlatformServiceTypeCode {
  DryClean = "dry_clean",
  Iron = "iron",
  WashAndIron = "wash_and_iron",
}

export const platformServiceTypeLabelsAr: Record<PlatformServiceTypeCode, string> = {
  [PlatformServiceTypeCode.DryClean]: "غسيل جاف",
  [PlatformServiceTypeCode.Iron]: "كوي",
  [PlatformServiceTypeCode.WashAndIron]: "غسيل وكوي",
};

export const platformServiceTypeLabelsEn: Record<PlatformServiceTypeCode, string> = {
  [PlatformServiceTypeCode.DryClean]: "Dry clean",
  [PlatformServiceTypeCode.Iron]: "Iron",
  [PlatformServiceTypeCode.WashAndIron]: "Wash & iron",
};

export interface PlatformServiceType {
  id: string;
  code: PlatformServiceTypeCode;
  name: LocalizedText;
  fixed: boolean;
  active: boolean;
  sortOrder: number;
}

export interface PlatformProduct {
  id: string;
  code: string;
  name: LocalizedText;
  active: boolean;
  sortOrder: number;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface PlatformServiceMatrixRow {
  id: string;
  code: string;
  productId: string;
  serviceTypeId: string;
  pricingUnit: ServicePricingUnit;
  suggestedPriceSar?: number;
  isAvailable: boolean;
  active: boolean;
  sortOrder: number;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface ProviderServicePricingInput {
  serviceId: string;
  proposedPriceSar: number;
}

export enum ProviderServiceCurrentStatus {
  Active = "active",
  Inactive = "inactive",
}

export enum ProviderServiceProposalStatus {
  PendingApproval = "pending_approval",
  Rejected = "rejected",
}

export const providerServiceCurrentStatusLabelsAr: Record<ProviderServiceCurrentStatus, string> = {
  [ProviderServiceCurrentStatus.Active]: "نشط",
  [ProviderServiceCurrentStatus.Inactive]: "غير نشط",
};

export const providerServiceProposalStatusLabelsAr: Record<ProviderServiceProposalStatus, string> = {
  [ProviderServiceProposalStatus.PendingApproval]: "بانتظار الاعتماد",
  [ProviderServiceProposalStatus.Rejected]: "مرفوض",
};

export {
  ProviderServiceCurrentStatus as PlatformServiceCurrentStatus,
  providerServiceCurrentStatusLabelsAr as platformServiceCurrentStatusLabelsAr,
};

export interface ProviderServiceOffering {
  id: string;
  providerId: string;
  serviceId: string;
  productId: string;
  productName: LocalizedText;
  serviceType: PlatformServiceTypeCode;
  serviceTypeName: LocalizedText;
  pricingUnit: ServicePricingUnit;
  currentApprovedPriceSar?: number;
  currentStatus: ProviderServiceCurrentStatus;
  currentStatusLabelAr: string;
  proposedPriceSar?: number;
  proposedStatus?: ProviderServiceProposalStatus;
  proposedStatusLabelAr?: string;
  proposedSubmittedAt?: ISODateString;
  approvedAt?: ISODateString;
  approvedByAccountId?: string;
  approvedByRole?: string;
  rejectionReasonAr?: string;
  suggestedPriceSar?: number;
  activeMatrix: boolean;
  availableMatrix: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Service {
  id: string;
  code: string;
  name: LocalizedText;
  description?: LocalizedText;
  category: ServiceCategory;
  billingUnit: ServiceBillingUnit;
  defaultUnitPriceSar: number;
  defaultTurnaroundHours: number;
  supportsRush: boolean;
  active: boolean;
  productId?: string;
  productName?: LocalizedText;
  serviceType?: PlatformServiceTypeCode;
  serviceTypeName?: LocalizedText;
  pricingUnit?: ServicePricingUnit;
  suggestedPriceSar?: number;
  isAvailable?: boolean;
  operationalProviderCount?: number;
  lowestApprovedPriceSar?: number;
}

export const getServiceName = (service: Pick<Service, "name">) => {
  return service.name.ar;
};

export const getServiceTypeLabelAr = (serviceType: PlatformServiceTypeCode) =>
  platformServiceTypeLabelsAr[serviceType];

export const getServiceTypeLabelEn = (serviceType: PlatformServiceTypeCode) =>
  platformServiceTypeLabelsEn[serviceType];

export const buildServiceCatalogItemName = (
  productNameAr: string,
  serviceType: PlatformServiceTypeCode,
): LocalizedText => ({
  ar: `${productNameAr} - ${platformServiceTypeLabelsAr[serviceType]}`,
  en: undefined,
});

export const buildServiceCatalogItemDescription = (
  productNameAr: string,
  serviceType: PlatformServiceTypeCode,
): LocalizedText => ({
  ar: `${platformServiceTypeLabelsAr[serviceType]} للقطعة الواحدة من ${productNameAr}`,
  en: undefined,
});

export const mapServiceTypeToCategory = (serviceType: PlatformServiceTypeCode): ServiceCategory => {
  switch (serviceType) {
    case PlatformServiceTypeCode.DryClean:
      return ServiceCategory.DryCleaning;
    case PlatformServiceTypeCode.Iron:
      return ServiceCategory.Pressing;
    case PlatformServiceTypeCode.WashAndIron:
      return ServiceCategory.Laundry;
    default:
      return ServiceCategory.Specialty;
  }
};

export const getDefaultTurnaroundHoursForServiceType = (
  serviceType: PlatformServiceTypeCode,
): number => {
  switch (serviceType) {
    case PlatformServiceTypeCode.Iron:
      return 12;
    case PlatformServiceTypeCode.WashAndIron:
      return 24;
    case PlatformServiceTypeCode.DryClean:
      return 48;
    default:
      return 24;
  }
};

export const getDefaultRushSupportForServiceType = (serviceType: PlatformServiceTypeCode) => {
  return serviceType !== PlatformServiceTypeCode.DryClean;
};

export type ServiceCatalogItem = Service;
