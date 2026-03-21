import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { resolveAccountHomeRoute, useCurrentAccountSession } from "@/features/auth/hooks/useAccountAuth";
import { AccountRole } from "@/features/auth/model";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { appRoutes } from "@/shared/config/navigation";
import { localizeWashoffBrandText } from "@/shared/lib/brand";

interface RequireAccountAccessProps {
  children: ReactNode;
  allowedRoles?: AccountRole[];
}

const RequireAccountAccess = ({ children, allowedRoles }: RequireAccountAccessProps) => {
  const location = useLocation();
  const { language } = usePlatformLanguage();
  const sessionQuery = useCurrentAccountSession();

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-border/70 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-primary">جارٍ التحقق من الجلسة</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {localizeWashoffBrandText("يتم الآن تجهيز صلاحيات الوصول إلى منصة WashOff.", language)}
          </p>
        </div>
      </div>
    );
  }

  if (!sessionQuery.data?.account) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`;
    const nextParam = requestedPath !== appRoutes.login ? `?next=${encodeURIComponent(requestedPath)}` : "";

    return <Navigate to={`${appRoutes.login}${nextParam}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(sessionQuery.data.account.role)) {
    return <Navigate to={resolveAccountHomeRoute(sessionQuery.data.account.role)} replace />;
  }

  return <>{children}</>;
};

export default RequireAccountAccess;
