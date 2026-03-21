import type { ReactNode } from "react";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import AppNavbar from "@/shared/components/navigation/AppNavbar";

interface AppShellProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export const AppShell = ({ children, showNavbar = true }: AppShellProps) => {
  const { direction, language } = usePlatformLanguage();

  return (
    <div
      className="app-grid-background min-h-screen bg-background text-foreground"
      dir={direction}
      lang={language}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[420px] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
      {showNavbar ? <AppNavbar /> : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
