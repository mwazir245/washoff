export const appRoutes = {
  landing: "/",
  login: "/login",
  activateAccount: "/activate-account",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  hotelRegistration: "/register/hotel",
  providerRegistration: "/register/provider",
  hotelDashboard: "/hotel",
  providerDashboard: "/provider",
  adminDashboard: "/admin",
  adminOrders: "/admin/orders",
  adminMatching: "/admin/matching",
  adminOnboarding: "/admin/onboarding",
  adminSettings: "/admin/settings",
  adminContent: "/admin/content",
} as const;

export const primaryNavigation = [
  { labelAr: "لوحة الفندق", labelEn: "Hotel", to: appRoutes.hotelDashboard },
  { labelAr: "لوحة المزوّد", labelEn: "Provider", to: appRoutes.providerDashboard },
  { labelAr: "الإدارة", labelEn: "Admin", to: appRoutes.adminDashboard },
] as const;
