export interface PlatformSettings {
  id: string;
  siteNameAr: string;
  siteNameEn: string;
  siteTaglineAr: string;
  siteTaglineEn: string;
  sellerLegalNameAr: string;
  sellerVatNumber: string;
  sellerAddressAr: string;
  sellerCityAr: string;
  mailFromNameAr: string;
  mailFromEmail: string;
  supportEmail?: string;
  supportPhone?: string;
  registrationEnabled: boolean;
  hotelRegistrationEnabled: boolean;
  providerRegistrationEnabled: boolean;
  requireAdminApprovalForHotels: boolean;
  requireAdminApprovalForProviders: boolean;
  updatedAt: string;
  updatedByAccountId?: string;
}

export interface PlatformSettingsUpdateCommand {
  siteNameAr: string;
  siteNameEn: string;
  siteTaglineAr: string;
  siteTaglineEn: string;
  sellerLegalNameAr: string;
  sellerVatNumber: string;
  sellerAddressAr: string;
  sellerCityAr: string;
  mailFromNameAr: string;
  mailFromEmail: string;
  supportEmail?: string;
  supportPhone?: string;
  registrationEnabled: boolean;
  hotelRegistrationEnabled: boolean;
  providerRegistrationEnabled: boolean;
  requireAdminApprovalForHotels: boolean;
  requireAdminApprovalForProviders: boolean;
  notesAr?: string;
  updatedByAccountId?: string;
}

export interface PlatformSettingsAuditEntry {
  id: string;
  settingsKey: string;
  oldValueJson?: string;
  newValueJson: string;
  changedByAccountId?: string;
  changedByRole?: "admin" | "system";
  changedAt: string;
  notesAr?: string;
}

export interface PlatformRuntimeStatus {
  environment: string;
  persistenceMode: "file" | "db";
  databaseTargetLabel: string;
  mailMode: "disabled" | "console" | "outbox" | "smtp";
  workerEnabled: boolean;
  workerPollIntervalMs: number;
  requestTimeSweepEnabled: boolean;
  authMode: string;
  publicAppUrl: string;
  serverHost?: string;
  serverPort?: number;
}

export const defaultPlatformSettings: PlatformSettings = {
  id: "platform-settings-default",
  siteNameAr: "منصة واش أوف",
  siteNameEn: "WashOff Platform",
  siteTaglineAr: "منصة تشغيل ذكية لعمليات الغسيل",
  siteTaglineEn: "Smart laundry operations platform",
  sellerLegalNameAr: "مؤسسة واش أوف لتشغيل خدمات الغسيل",
  sellerVatNumber: "300000000000003",
  sellerAddressAr: "الرياض، المملكة العربية السعودية",
  sellerCityAr: "الرياض",
  mailFromNameAr: "منصة واش أوف",
  mailFromEmail: "washoff@outlook.sa",
  supportEmail: "washoff@outlook.sa",
  supportPhone: "+966500000000",
  registrationEnabled: true,
  hotelRegistrationEnabled: true,
  providerRegistrationEnabled: true,
  requireAdminApprovalForHotels: true,
  requireAdminApprovalForProviders: true,
  updatedAt: new Date("2026-03-21T00:00:00.000Z").toISOString(),
};

export const platformRuntimeLabelsAr = {
  environment: "البيئة",
  persistenceMode: "وضع التخزين",
  databaseTargetLabel: "قاعدة البيانات",
  mailMode: "وضع البريد",
  workerEnabled: "العامل",
  workerPollIntervalMs: "زمن فحص العامل",
  requestTimeSweepEnabled: "الفحص اللحظي",
  authMode: "وضع المصادقة",
  publicAppUrl: "رابط المنصة",
  serverHost: "عنوان الخادم",
  serverPort: "منفذ الخادم",
} as const;
