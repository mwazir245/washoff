import type { LocalizedText } from "@/features/orders/model/common";

export enum ServiceCategory {
  Laundry = "laundry",
  DryCleaning = "dry_cleaning",
  Pressing = "pressing",
  Specialty = "specialty",
}

export enum ServiceBillingUnit {
  Kilogram = "kilogram",
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
}

export const getServiceName = (service: Pick<Service, "name">) => {
  return service.name.ar;
};

export type ServiceCatalogItem = Service;
