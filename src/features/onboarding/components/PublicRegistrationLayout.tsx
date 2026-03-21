import type { ReactNode } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { PlatformLanguageToggle } from "@/features/content/components/PlatformLanguageToggle";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { appRoutes } from "@/shared/config/navigation";
import { localizeWashoffBrandText, resolveWashoffBrandName } from "@/shared/lib/brand";
import { AppShell } from "@/shared/layout/AppShell";

interface PublicRegistrationLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  checklistTitle: string;
  checklistDescription: string;
  checklistItems: string[];
  footerNote?: string;
  children: ReactNode;
}

const PublicRegistrationLayout = ({
  eyebrow,
  title,
  description,
  checklistTitle,
  checklistDescription,
  checklistItems,
  footerNote,
  children,
}: PublicRegistrationLayoutProps) => {
  const { language } = usePlatformLanguage();
  const brandName = resolveWashoffBrandName(language);
  const footerFallback = localizeWashoffBrandText(
    language === "en"
      ? "Every new request goes through admin review before the entity is activated inside WashOff operations."
      : "جميع الطلبات الجديدة تمر بمراجعة الإدارة قبل تفعيل الجهة داخل عمليات WashOff.",
    language,
  );

  return (
    <AppShell showNavbar={false}>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="page-shell">
          <div className="landing-header-bar flex flex-wrap items-center justify-between gap-4">
            <Link to={appRoutes.landing} className="flex items-center gap-3">
              <img
                src={logo}
                alt={brandName}
                className="h-11 w-11 rounded-2xl border border-primary/10 bg-white p-2 shadow-sm"
              />
              <div className="space-y-1">
                <span className="block text-lg font-bold text-primary">{brandName}</span>
                <span className="text-xs text-muted-foreground">
                  {language === "en"
                    ? "Smart laundry operations platform"
                    : "منصة تشغيل ذكية لعمليات الغسيل"}
                </span>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <PlatformLanguageToggle />
              <Button asChild variant="outline">
                <Link to={appRoutes.landing}>
                  {language === "en" ? "Back to home" : "العودة للرئيسية"}
                </Link>
              </Button>
              <Button asChild>
                <Link to={appRoutes.login}>
                  {language === "en" ? "Log in" : "تسجيل الدخول"}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-16 pt-32 sm:pt-36">
        <div className="page-shell">
          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
            <div className="space-y-6">
              <div className="page-header-card">
                <div className="space-y-4">
                  <span className="page-header-eyebrow">{eyebrow}</span>
                  <div className="space-y-3">
                    <h1 className="page-title max-w-3xl">{title}</h1>
                    <p className="page-subtitle max-w-3xl">{description}</p>
                  </div>
                </div>
              </div>

              <div className="surface-card px-6 py-6 sm:px-8 sm:py-8">{children}</div>
            </div>

            <aside className="space-y-5">
              <div className="landing-panel p-6 sm:p-7">
                <div className="landing-icon-badge">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-foreground">{checklistTitle}</h2>
                <p className="mt-3 text-sm leading-8 text-muted-foreground">{checklistDescription}</p>

                <div className="landing-list mt-6">
                  {checklistItems.map((item) => (
                    <div key={item} className="landing-list-item">
                      <span className="gold-dot mt-2 shrink-0" />
                      <span className="leading-7 text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="accent-panel px-5 py-5 text-sm leading-7 text-muted-foreground">
                {footerNote ? localizeWashoffBrandText(footerNote, language) : footerFallback}
              </div>
            </aside>
          </section>
        </div>
      </main>
    </AppShell>
  );
};

export default PublicRegistrationLayout;
