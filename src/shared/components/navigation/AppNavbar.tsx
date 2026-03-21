import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { PlatformLanguageToggle } from "@/features/content/components/PlatformLanguageToggle";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import {
  resolveAccountHomeRoute,
  useCurrentAccountSession,
  useLogoutMutation,
} from "@/features/auth/hooks/useAccountAuth";
import { appRoutes, primaryNavigation } from "@/shared/config/navigation";
import { resolveWashoffBrandName } from "@/shared/lib/brand";

const AppNavbar = () => {
  const navigate = useNavigate();
  const { language } = usePlatformLanguage();
  const brandName = resolveWashoffBrandName(language);
  const sessionQuery = useCurrentAccountSession();
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate(appRoutes.login, { replace: true });
  };

  const renderSessionAction = () => {
    if (sessionQuery.isLoading) {
      return (
        <button type="button" className="app-button-primary opacity-70" disabled>
          {language === "en" ? "Checking..." : "جارٍ التحقق..."}
        </button>
      );
    }

    if (sessionQuery.data?.account.role) {
      return (
        <div className="flex items-center gap-2">
          <Link
            to={resolveAccountHomeRoute(sessionQuery.data.account.role)}
            className="rounded-2xl border border-primary/12 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary/10"
          >
            {sessionQuery.data.account.fullName}
          </Link>
          <button
            type="button"
            className="app-button-primary"
            disabled={logoutMutation.isPending}
            onClick={() => void handleLogout()}
          >
            {logoutMutation.isPending
              ? language === "en"
                ? "Signing out..."
                : "جارٍ تسجيل الخروج..."
              : language === "en"
                ? "Log out"
                : "تسجيل الخروج"}
          </button>
        </div>
      );
    }

    return (
      <Link to={appRoutes.login} className="app-button-primary">
        {language === "en" ? "Log in" : "تسجيل الدخول"}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="page-shell">
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-[1.35rem] px-4 py-3 sm:px-5">
          <Link to={appRoutes.landing} className="flex items-center gap-3">
            <img src={logo} alt={brandName} className="h-11 w-11 rounded-2xl shadow-sm" />
            <div>
              <span className="block text-lg font-bold text-primary">{brandName}</span>
              <span className="text-xs font-medium tracking-[0.08em] text-muted-foreground">
                {language === "en"
                  ? "Smart laundry operations platform"
                  : "منصة تشغيل ذكية لعمليات الغسيل"}
              </span>
            </div>
          </Link>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <PlatformLanguageToggle />

            {primaryNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-2xl border px-4 py-2 text-sm font-semibold transition-all",
                    isActive
                      ? "border-primary/12 bg-primary/5 text-primary shadow-sm"
                      : "border-transparent text-muted-foreground hover:border-primary/10 hover:bg-white hover:text-foreground",
                  ].join(" ")
                }
              >
                {language === "en" ? item.labelEn : item.labelAr}
              </NavLink>
            ))}

            {renderSessionAction()}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
