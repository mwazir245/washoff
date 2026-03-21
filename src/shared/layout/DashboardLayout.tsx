import type { ReactNode } from "react";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { localizeWashoffBrandText } from "@/shared/lib/brand";
import { AppShell } from "@/shared/layout/AppShell";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
}

export const DashboardLayout = ({
  title,
  subtitle,
  actions,
  eyebrow,
  children,
}: DashboardLayoutProps) => {
  const { language } = usePlatformLanguage();
  const resolvedEyebrow = eyebrow
    ? localizeWashoffBrandText(eyebrow, language)
    : localizeWashoffBrandText("منصة تشغيل WashOff", language);

  return (
    <AppShell>
      <main className="pb-16 pt-28 sm:pt-32">
        <div className="page-shell">
          <header className="page-header-card mb-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <span className="page-header-eyebrow">{resolvedEyebrow}</span>
                <div className="space-y-2">
                  <h1 className="page-title">{title}</h1>
                  {subtitle ? <p className="page-subtitle max-w-3xl">{subtitle}</p> : null}
                </div>
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </div>
          </header>
          <div className="space-y-10">{children}</div>
        </div>
      </main>
    </AppShell>
  );
};
