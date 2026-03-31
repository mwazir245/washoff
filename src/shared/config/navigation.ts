export const appRoutes = {
  landing: "/",
  login: "/login",
  activateAccount: "/activate-account",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  hotelRegistration: "/register/hotel",
  providerRegistration: "/register/provider",
  hotelDashboard: "/hotel",
  hotelBilling: "/hotel/billing",
  providerDashboard: "/provider",
  providerSettlements: "/provider/settlements",
  adminDashboard: "/admin",
  adminOrders: "/admin/orders",
  adminMatching: "/admin/matching",
  adminFinance: "/admin/finance",
  adminServices: "/admin/services",
  adminProviderPricing: "/admin/provider-pricing",
  adminOnboarding: "/admin/onboarding",
  adminSettings: "/admin/settings",
  adminContent: "/admin/content",
} as const;

export const primaryNavigation = [
  { labelAr: "لوحة الفندق", labelEn: "Hotel", to: appRoutes.hotelDashboard },
  { labelAr: "لوحة المزوّد", labelEn: "Provider", to: appRoutes.providerDashboard },
  { labelAr: "الإدارة", labelEn: "Admin", to: appRoutes.adminDashboard },
] as const;
