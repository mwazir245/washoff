import type { SaudiCityId, SaudiDistrictId } from "@/features/orders/model/location-catalog";

export type ISODateString = string;
export type CurrencyCode = "SAR";

export type ActorRole = "hotel" | "provider" | "admin" | "system";

export interface LocalizedText {
  ar: string;
  en?: string;
}

export interface Address {
  countryCode: string;
  cityId?: SaudiCityId;
  city: string;
  districtId?: SaudiDistrictId;
  district?: string;
  line1?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ContactPoint {
  name?: string;
  phone?: string;
  email?: string;
}

export interface AuditFields {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
