import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "@/features/landing/pages/LandingPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import ActivateAccountPage from "@/features/auth/pages/ActivateAccountPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import AdminContentPage from "@/features/content/pages/AdminContentPage";
import AdminMatchingPage from "@/features/admin/pages/AdminMatchingPage";
import AdminOrdersPage from "@/features/admin/pages/AdminOrdersPage";
import RequireAccountAccess from "@/features/auth/components/RequireAccountAccess";
import { AccountRole } from "@/features/auth/model";
import HotelDashboardPage from "@/features/hotel/pages/HotelDashboardPage";
import ProviderDashboardPage from "@/features/provider/pages/ProviderDashboardPage";
import AdminDashboardPage from "@/features/admin/pages/AdminDashboardPage";
import HotelRegistrationPage from "@/features/onboarding/pages/HotelRegistrationPage";
import ProviderRegistrationPage from "@/features/onboarding/pages/ProviderRegistrationPage";
import AdminOnboardingPage from "@/features/onboarding/pages/AdminOnboardingPage";
import AdminSettingsPage from "@/features/platform-settings/pages/AdminSettingsPage";
import NotFoundPage from "@/app/router/NotFoundPage";
import { appRoutes } from "@/shared/config/navigation";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={appRoutes.landing} element={<LandingPage />} />
        <Route path={appRoutes.login} element={<LoginPage />} />
        <Route path={appRoutes.activateAccount} element={<ActivateAccountPage />} />
        <Route path={appRoutes.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={appRoutes.resetPassword} element={<ResetPasswordPage />} />
        <Route path={appRoutes.hotelRegistration} element={<HotelRegistrationPage />} />
        <Route path={appRoutes.providerRegistration} element={<ProviderRegistrationPage />} />
        <Route
          path={appRoutes.hotelDashboard}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Hotel, AccountRole.Admin]}>
              <HotelDashboardPage />
            </RequireAccountAccess>
          }
        />
        <Route
          path={appRoutes.providerDashboard}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Provider, AccountRole.Admin]}>
              <ProviderDashboardPage />
            </RequireAccountAccess>
          }
        />
        <Route
          path={appRoutes.adminDashboard}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Admin]}>
              <AdminDashboardPage />
            </RequireAccountAccess>
          }
        />
        <Route
          path={appRoutes.adminOrders}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Admin]}>
              <AdminOrdersPage />
            </RequireAccountAccess>
          }
        />
        <Route
          path={appRoutes.adminMatching}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Admin]}>
              <AdminMatchingPage />
            </RequireAccountAccess>
          }
        />
        <Route
          path={appRoutes.adminOnboarding}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Admin]}>
              <AdminOnboardingPage />
            </RequireAccountAccess>
          }
        />
        <Route
          path={appRoutes.adminSettings}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Admin]}>
              <AdminSettingsPage />
            </RequireAccountAccess>
          }
        />
        <Route
          path={appRoutes.adminContent}
          element={
            <RequireAccountAccess allowedRoles={[AccountRole.Admin]}>
              <AdminContentPage />
            </RequireAccountAccess>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
