import { motion } from "framer-motion";
import { ArrowLeft, Building2, CheckCircle2, Factory } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import {
  resolveAccountHomeRoute,
  useCurrentAccountSession,
  useLogoutMutation,
} from "@/features/auth/hooks/useAccountAuth";
import { PlatformLanguageToggle } from "@/features/content/components/PlatformLanguageToggle";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import {
  landingBenefits,
  landingFooterGroups,
  landingHeaderLinks,
  landingHowItWorks,
  landingOverviewCards,
  landingPrimaryAction,
  landingSecondaryAction,
  landingTrustPoints,
} from "@/features/landing/content/landing-content";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import { appRoutes } from "@/shared/config/navigation";
import { localizeWashoffBrandText, resolveWashoffBrandName } from "@/shared/lib/brand";
import { AppShell } from "@/shared/layout/AppShell";

const sectionAnimation = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45 },
} as const;

const LandingPage = () => {
  const navigate = useNavigate();
  const { language } = usePlatformLanguage();
  const sessionQuery = useCurrentAccountSession();
  const logoutMutation = useLogoutMutation();
  const brandName = resolveWashoffBrandName(language);
  const brandText = (value: string) => localizeWashoffBrandText(value, language);
  const pageContent = usePlatformPageContent("landing");
  const brandTagline = pageContent.getText(
    "header",
    "brand_tagline",
    "منصة ذكية لإدارة وتشغيل خدمات الغسيل",
  );
  const loginLabel = pageContent.getText("header", "login_button", "تسجيل الدخول");
  const primaryLabel = pageContent.getText("header", "primary_button", landingPrimaryAction.label);
  const heroEyebrow = pageContent.getText(
    "hero",
    "eyebrow",
    "تشغيل ذكي ومتكامل لإدارة عمليات الغسيل",
  );
  const heroTitle = pageContent.getText(
    "hero",
    "title",
    "منصة ذكية لإدارة وتشغيل خدمات الغسيل للفنادق",
  );
  const heroHighlight = pageContent.getText(
    "hero",
    "highlight",
    "أرسل طلبك... ودع النظام يتولى اختيار أفضل مزود خدمة تلقائيًا وفق السعة والأداء والالتزام.",
  );
  const heroDescription = pageContent.getText(
    "hero",
    "description",
    "واش أوف تمكّن الفنادق من إدارة عمليات الغسيل بسهولة ووضوح، بينما يقوم النظام بإسناد الطلبات تلقائيًا دون تدخل يدوي، مع متابعة دقيقة لكل مرحلة من مراحل التنفيذ.",
  );
  const providerLink = pageContent.getText("hero", "provider_link", landingSecondaryAction.label);
  const heroAutomationNote = pageContent.getText(
    "hero",
    "automation_note",
    "تشغيل ذكي بالكامل — دون الحاجة لاختيار مزود الخدمة يدويًا",
  );
  const trustEyebrow = pageContent.getText("trust", "eyebrow", "مصداقية وتشغيل");
  const trustTitle = pageContent.getText("trust", "title", "تشغيل موثوق وسهل القراءة");
  const trustDescription = pageContent.getText(
    "trust",
    "description",
    "مؤشرات تشغيل سريعة تشرح قيمة المنصة من أول نظرة.",
  );
  const howItWorksEyebrow = pageContent.getText("how_it_works", "eyebrow", "كيف تعمل المنصة");
  const howItWorksTitle = pageContent.getText("how_it_works", "title", `كيف تعمل ${brandName}؟`);
  const howItWorksDescription = pageContent.getText(
    "how_it_works",
    "description",
    "أربع خطوات واضحة تحوّل تشغيل خدمات الغسيل من تنسيق متكرر إلى مسار تشغيلي منظم وقابل للمتابعة.",
  );
  const overviewEyebrow = pageContent.getText("overview", "eyebrow", "نظرة على المنصة");
  const overviewTitle = pageContent.getText("overview", "title", "ثلاث واجهات بوضوح أكبر");
  const overviewDescription = pageContent.getText(
    "overview",
    "description",
    "عرض خفيف يوضح ما يراه كل طرف داخل المنصة من دون شرح ثقيل أو تفاصيل مشتتة.",
  );
  const finalCtaTitle = pageContent.getText("final_cta", "title", "ابدأ تشغيل خدمات الغسيل عبر منصة واحدة");
  const finalCtaDescription = pageContent.getText(
    "final_cta",
    "description",
    "سجّل الجهة المناسبة، أكمل الاعتماد، ثم ابدأ التشغيل من نفس المنصة.",
  );
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate(appRoutes.login, { replace: true });
  };

  const authenticatedRole = sessionQuery.data?.account.role;
  const authenticatedHomeRoute = authenticatedRole
    ? resolveAccountHomeRoute(authenticatedRole)
    : appRoutes.login;

  const renderHeaderActions = () => {
    if (sessionQuery.isLoading && !sessionQuery.data) {
      return (
        <Button type="button" variant="outline" disabled>
          {language === "en" ? "Checking..." : "جارٍ التحقق..."}
        </Button>
      );
    }

    if (sessionQuery.data?.account.role) {
      return (
        <>
          <Button asChild variant="outline">
            <Link to={resolveAccountHomeRoute(sessionQuery.data.account.role)}>
              {sessionQuery.data.account.fullName}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
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
          </Button>
        </>
      );
    }

    return (
      <>
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link to={appRoutes.login}>{loginLabel}</Link>
        </Button>
        <Button asChild>
          <Link to={landingPrimaryAction.to}>
            {primaryLabel}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </>
    );
  };

  return (
    <AppShell showNavbar={false}>
      <header id="top" className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="page-shell">
          <div className="landing-header-bar flex items-center justify-between gap-4">
            <Link to={appRoutes.landing} className="flex items-center gap-3">
              <img src={logo} alt={brandName} className="h-12 w-12 rounded-2xl border border-primary/10 bg-white p-2 shadow-sm" />
              <div className="space-y-1">
                <span className="block text-lg font-bold text-primary">{brandName}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="gold-dot" />
                  {brandTagline}
                </span>
              </div>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex lg:gap-2">
              {landingHeaderLinks.map((item) => (
                <a key={item.href} href={item.href} className="landing-nav-link">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <PlatformLanguageToggle />
              {renderHeaderActions()}
            </div>
          </div>
        </div>
      </header>

      <main className="overflow-hidden pb-16 pt-32 sm:pt-36">
        <section className="hero-band pb-12 pt-8 sm:pb-14 sm:pt-10">
          <div className="page-shell">
            <motion.div {...sectionAnimation} className="mx-auto max-w-5xl space-y-6">
              <div className="space-y-5 text-center lg:text-right">
                <span className="section-kicker">{heroEyebrow}</span>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-bold leading-[1.18] text-foreground sm:text-5xl lg:text-[3.7rem] lg:leading-[1.12]">
                    {heroTitle}
                  </h1>
                  <p className="max-w-3xl text-lg font-medium leading-8 text-primary">{heroHighlight}</p>
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                    {heroDescription}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm">
                  <span className="landing-status-chip">إسناد تلقائي</span>
                  <span className="font-medium">{heroAutomationNote}</span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to={authenticatedHomeRoute}>
                      {authenticatedRole
                        ? language === "en"
                          ? "Go to your dashboard"
                          : "الانتقال إلى لوحتك"
                        : primaryLabel}
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  {authenticatedRole ? (
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
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
                    </Button>
                  ) : (
                    <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                      <Link to={landingSecondaryAction.href}>{providerLink}</Link>
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <a href="#how-it-works" className="font-semibold text-primary hover:text-primary/80">
                    شاهد كيف تعمل المنصة
                  </a>
                  <span className="hidden sm:inline text-border">•</span>
                  <Link to={authenticatedHomeRoute} className="font-semibold text-foreground hover:text-primary">
                    {authenticatedRole ? sessionQuery.data.account.fullName : loginLabel}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="page-shell">
            <SectionHeader
              eyebrow={trustEyebrow}
              title={trustTitle}
              description={brandText(trustDescription)}
              className="mb-7"
              centered
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {landingTrustPoints.map((point) => (
                <motion.article key={point.title} {...sectionAnimation} className="landing-outline-card p-4 sm:p-5">
                  <div className="landing-icon-badge h-10 w-10 rounded-xl">{point.icon}</div>
                  <p className="mt-4 text-sm font-semibold text-foreground">{point.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{point.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <div className="page-shell">
            <SectionHeader
              eyebrow={howItWorksEyebrow}
              title={howItWorksTitle}
              description={howItWorksDescription}
              className="mb-8"
              centered
            />

            <div className="grid gap-4 lg:grid-cols-4">
              {landingHowItWorks.map((step) => (
                <motion.article key={step.number} {...sectionAnimation} className="landing-premium-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-4xl font-bold text-primary/12">{step.number}</span>
                    <span className="landing-status-chip">
                      الخطوة {step.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="hotels" className="py-16">
          <div className="page-shell">
            <SectionHeader
              eyebrow="الفوائد"
              title="قيمة واضحة لكل طرف"
              description="فوائد مباشرة ومختصرة للفنادق والمزوّدين داخل نفس المسار التشغيلي."
              className="mb-8"
              centered
            />

            <div className="grid gap-6 lg:grid-cols-2">
              {landingBenefits.map((group, index) => (
                <motion.article
                  key={group.title}
                  {...sectionAnimation}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="landing-premium-card p-6 sm:p-8"
                  id={index === 1 ? "providers" : undefined}
                  style={index === 1 ? { borderColor: "hsl(var(--brand-gold) / 0.2)" } : undefined}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-3">
                      <span className="section-kicker">{group.eyebrow}</span>
                      <h2 className="text-2xl font-bold text-foreground">{group.title}</h2>
                    </div>
                    <div className="landing-icon-badge">
                      {index === 0 ? <Building2 className="h-5 w-5" /> : <Factory className="h-5 w-5" />}
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                    {brandText(group.description)}
                  </p>

                  <div className="landing-list mt-5">
                    {group.points.map((point) => (
                      <div key={point} className="landing-list-item bg-white/90">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="leading-7 text-foreground">{point}</span>
                      </div>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="platform-overview" className="py-16">
          <div className="page-shell">
            <SectionHeader
              eyebrow={overviewEyebrow}
              title={overviewTitle}
              description={brandText(overviewDescription)}
              className="mb-8"
              centered
            />

            <div className="grid gap-5 lg:grid-cols-3">
              {landingOverviewCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  {...sectionAnimation}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="landing-premium-card p-6"
                >
                  <div className="landing-icon-badge">{card.icon}</div>
                  <h3 className="mt-5 text-xl font-bold text-foreground">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.description}</p>

                  <div className="landing-list mt-5">
                    {card.points.map((point) => (
                      <div key={point} className="landing-list-item">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="leading-7 text-foreground">{point}</span>
                      </div>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="final-cta" className="py-16">
          <div className="page-shell">
            <div className="landing-cta-panel">
              <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
                <div className="space-y-4">
                  <span className="section-kicker">ابدأ مع {brandName}</span>
                  <h2 className="text-3xl font-bold leading-tight text-foreground">{finalCtaTitle}</h2>
                  <p className="max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
                    {brandText(finalCtaDescription)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to={landingPrimaryAction.to}>
                      {primaryLabel}
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <Link to={appRoutes.providerRegistration}>{providerLink}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-border/80 bg-white/95 py-12">
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={logo} alt={brandName} className="h-11 w-11 rounded-2xl border border-primary/10 bg-white p-2 shadow-sm" />
                <div>
                  <p className="text-lg font-bold text-primary">{brandName}</p>
                  <p className="text-sm text-muted-foreground">منصة تشغيل ذكية لخدمات الغسيل في قطاع الضيافة</p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-muted-foreground">
                {brandText("WashOff توحد إرسال الطلبات، الإسناد الذكي، التنفيذ، والمتابعة ضمن تجربة تشغيل عربية واضحة وموثوقة.")}
              </p>
            </div>

            {landingFooterGroups.map((group) => (
              <div key={group.title} className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{group.title}</p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {group.links.map((link) =>
                    link.href.startsWith("/") ? (
                      <Link key={link.label} to={link.href} className="landing-footer-link">
                        {link.label}
                      </Link>
                    ) : (
                      <a key={link.label} href={link.href} className="landing-footer-link">
                        {link.label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-border/80 pt-6 text-sm text-muted-foreground">
            © {brandName} - جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </AppShell>
  );
};

export default LandingPage;
