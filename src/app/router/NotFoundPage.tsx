import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { appRoutes } from "@/shared/config/navigation";
import { localizeWashoffBrandText } from "@/shared/lib/brand";
import { AppShell } from "@/shared/layout/AppShell";

const NotFoundPage = () => {
  const location = useLocation();
  const { language } = usePlatformLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppShell>
      <main className="flex min-h-screen items-center justify-center px-6 py-24 pt-32">
        <div className="max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-card">
          <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">الصفحة غير موجودة</p>
          <p className="mb-6 text-sm text-muted-foreground">
            {localizeWashoffBrandText(
              "المسار المطلوب غير متاح حاليًا داخل النسخة التمهيدية من WashOff.",
              language,
            )}
          </p>
          <Link
            to={appRoutes.landing}
            className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/10"
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </main>
    </AppShell>
  );
};

export default NotFoundPage;
