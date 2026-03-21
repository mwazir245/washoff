import { motion } from "framer-motion";
import { ArrowLeft, Building2, CheckCircle2, Factory, WandSparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { PlatformLanguageToggle } from "@/features/content/components/PlatformLanguageToggle";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import {
  landingBenefits,
  landingFooterGroups,
  landingHeaderLinks,
  landingHeroFlow,
  landingHowItWorks,
  landingOperationalValues,
  landingOverviewCards,
  landingPlatformFeatures,
  landingPrimaryAction,
  landingSecondaryAction,
  landingSmartSignals,
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
  const { language } = usePlatformLanguage();
  const brandName = resolveWashoffBrandName(language);
  const brandText = (value: string) => localizeWashoffBrandText(value, language);
  const pageContent = usePlatformPageContent("landing");
  const brandTagline = pageContent.getText("header", "brand_tagline", "منصة تشغيل ذكية لعمليات الغسيل");
  const loginLabel = pageContent.getText("header", "login_button", "تسجيل الدخول");
  const primaryLabel = pageContent.getText("header", "primary_button", landingPrimaryAction.label);
  const heroEyebrow = pageContent.getText("hero", "eyebrow", "منصة تشغيل عربية مخصصة لقطاع الضيافة");
  const heroTitle = pageContent.getText(
    "hero",
    "title",
    "شغّل خدمات الغسيل الفندقي بمنصة واحدة أكثر وضوحًا وانضباطًا",
  );
  const heroHighlight = pageContent.getText(
    "hero",
    "highlight",
    "الفندق يرسل الطلب فقط، والمنصة تسند التنفيذ تلقائيًا إلى أفضل مزود معتمد.",
  );
  const heroDescription = pageContent.getText(
    "hero",
    "description",
    "WashOff تربط الفندق والمزود والإدارة ضمن رحلة تشغيلية واحدة: طلب واضح، مطابقة ذكية، إسناد تلقائي، متابعة تنفيذ، وشفافية مستمرة دون تنسيق يدوي مرهق.",
  );
  const providerPrompt = pageContent.getText("hero", "provider_prompt", "هل تمثل مزود خدمة معتمدًا؟");
  const providerLink = pageContent.getText("hero", "provider_link", landingSecondaryAction.label);
  const heroFlowTitle = pageContent.getText("hero", "flow_title", "من لحظة إنشاء الطلب حتى الإغلاق التشغيلي");
  const noMarketplaceTitle = pageContent.getText("hero", "no_marketplace_title", "ليست سوق مزودين");
  const noMarketplaceDescription = pageContent.getText(
    "hero",
    "no_marketplace_description",
    "الفنادق لا تختار مزودًا يدويًا. المنصة تتولى قرار الإسناد تلقائيًا وفق السعة والالتزام والموقع وجودة الأداء.",
  );
  const trustEyebrow = pageContent.getText("trust", "eyebrow", "مصداقية وتشغيل");
  const trustTitle = pageContent.getText("trust", "title", "تشغيل واضح يمكن الاعتماد عليه");
  const trustDescription = pageContent.getText(
    "trust",
    "description",
    "مصممة لفرق الضيافة والعمليات التي تحتاج إلى قرار أسرع، متابعة أوضح، وتنسيق أقل بين الأطراف.",
  );
  const howItWorksEyebrow = pageContent.getText("how_it_works", "eyebrow", "كيف تعمل المنصة");
  const howItWorksTitle = pageContent.getText("how_it_works", "title", `كيف تعمل ${brandName}؟`);
  const howItWorksDescription = pageContent.getText(
    "how_it_works",
    "description",
    "أربع خطوات واضحة تحوّل تشغيل خدمات الغسيل من تنسيق متكرر إلى مسار تشغيلي منظم وقابل للمتابعة.",
  );
  const featuresEyebrow = pageContent.getText("features", "eyebrow", "التشغيل الذكي");
  const featuresTitle = pageContent.getText("features", "title", "منصة تشغيل ذكية لا مجرد واجهة طلب");
  const featuresDescription = pageContent.getText(
    "features",
    "description",
    "WashOff لا تكتفي بإنشاء الطلبات، بل تدير قرار الإسناد والمتابعة وإدارة الاستثناءات ضمن منظومة تشغيلية متكاملة.",
  );
  const overviewEyebrow = pageContent.getText("overview", "eyebrow", "نظرة على المنصة");
  const overviewTitle = pageContent.getText("overview", "title", "ثلاث واجهات، قرار تشغيلي واحد");
  const overviewDescription = pageContent.getText(
    "overview",
    "description",
    "كل واجهة تخدم دورًا تشغيليًا محددًا، بينما يظل قرار الإسناد الذكي داخل المنصة لا بيد المستخدم النهائي.",
  );
  const finalCtaTitle = pageContent.getText("final_cta", "title", "ابدأ تفعيل شبكة الغسيل لديك عبر منصة موحدة");
  const finalCtaDescription = pageContent.getText(
    "final_cta",
    "description",
    "سجّل الجهة، دع الإدارة تعتمدها، ثم فعّل الحساب وابدأ تشغيل الطلبات من نفس المنصة بوضوح أكبر وثقة أعلى.",
  );
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
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link to={appRoutes.login}>{loginLabel}</Link>
              </Button>
              <Button asChild>
                <Link to={landingPrimaryAction.to}>
                  {primaryLabel}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="overflow-hidden pb-24 pt-32 sm:pt-36">
        <section className="hero-band pb-12 pt-8 sm:pb-16 sm:pt-10">
          <div className="page-shell">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <motion.div {...sectionAnimation} className="space-y-7">
                <span className="section-kicker">{heroEyebrow}</span>

                <div className="space-y-5">
                  <h1 className="max-w-4xl text-4xl font-bold leading-[1.18] text-foreground sm:text-5xl lg:text-6xl">
                    {heroTitle}
                  </h1>
                  <p className="text-lg font-medium leading-8 text-primary">{heroHighlight}</p>
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                    {brandText(heroDescription)}
                  </p>
                </div>

                <div className="landing-callout-card">
                  <div className="flex items-start gap-3">
                    <div className="landing-icon-badge h-11 w-11 shrink-0 rounded-2xl">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{noMarketplaceTitle}</p>
                      <p className="text-sm leading-7 text-muted-foreground">{noMarketplaceDescription}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link to={landingPrimaryAction.to}>
                      {primaryLabel}
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to={landingSecondaryAction.href}>{providerLink}</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{providerPrompt}</span>
                  <a href="#how-it-works" className="font-semibold text-primary hover:text-primary/80">
                    شاهد كيف تعمل المنصة
                  </a>
                  <span className="hidden sm:inline text-border">•</span>
                  <Link to={appRoutes.login} className="font-semibold text-foreground hover:text-primary">
                    {loginLabel}
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {landingSmartSignals.map((signal) => (
                    <div key={signal.title} className="landing-outline-card p-4">
                      <div className="landing-icon-badge h-10 w-10 rounded-xl">{signal.icon}</div>
                      <p className="mt-4 text-sm font-semibold text-foreground">{signal.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{signal.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="landing-premium-card space-y-6 p-6 sm:p-8"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <span className="section-kicker">رؤية تشغيلية مختصرة</span>
                    <h2 className="text-2xl font-bold text-foreground">{heroFlowTitle}</h2>
                  </div>
                  <div className="landing-icon-badge">
                    <WandSparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="landing-callout-card">
                  <p className="text-sm font-semibold text-primary">إسناد تلقائي إلى أفضل مزود معتمد</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    القرار التشغيلي في {brandName} لا يعتمد على تصفح الفنادق للمزودين، بل على محرك يختار الأنسب
                    وفق السعة والجاهزية والالتزام.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {landingHeroFlow.map((item) => (
                    <div key={item.title} className="landing-stage-card">
                      <div className="flex items-start gap-4">
                        <span className="landing-stage-index">{item.badge}</span>
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {landingTrustPoints.slice(0, 3).map((point) => (
                    <div key={point.title} className="landing-outline-card p-4">
                      <p className="text-sm font-semibold text-foreground">{point.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{point.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div {...sectionAnimation} className="mt-8">
              <div className="landing-panel p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                  <div className="space-y-3">
                    <span className="section-kicker">{trustEyebrow}</span>
                    <h2 className="text-2xl font-bold text-foreground">{trustTitle}</h2>
                    <p className="text-sm leading-7 text-muted-foreground sm:text-base">{brandText(trustDescription)}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {landingTrustPoints.map((point) => (
                      <div key={point.title} className="landing-outline-card p-4">
                        <div className="landing-icon-badge h-10 w-10 rounded-xl">{point.icon}</div>
                        <p className="mt-4 text-sm font-semibold text-foreground">{point.title}</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{point.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="page-shell">
            <SectionHeader
              eyebrow={howItWorksEyebrow}
              title={howItWorksTitle}
              description={howItWorksDescription}
              className="mb-10"
              centered
            />

            <div className="grid gap-5 lg:grid-cols-4">
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

        <section id="hotels" className="py-20">
          <div className="page-shell">
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

                  <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
                    {brandText(group.description)}
                  </p>

                  <div className="landing-list mt-6">
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

        <section id="platform-features" className="py-20">
          <div className="page-shell">
            <div className="landing-premium-card p-6 sm:p-8 lg:p-10">
              <SectionHeader
                eyebrow={featuresEyebrow}
                title={featuresTitle}
                description={brandText(featuresDescription)}
                className="mb-8"
              />

              <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
                <motion.div {...sectionAnimation} className="landing-callout-card h-full">
                  <div className="landing-icon-badge">
                    <WandSparkles className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold leading-tight text-foreground">
                    {brandName} منصة تشغيل ذكية وليست مجرد واجهة لرفع الطلبات
                  </h3>
                  <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
                    عندما يُنشئ الفندق الطلب، تبدأ المنصة مباشرة في تقييم الجاهزية التشغيلية داخل الشبكة، ثم
                    تتخذ قرار الإسناد وتواصل المتابعة حتى الإغلاق. هذا ما يجعل التجربة أوضح وأكثر قابلية للضبط من
                    أي نموذج يعتمد على التنسيق اليدوي بين الأطراف.
                  </p>
                </motion.div>

                <div className="grid gap-5 md:grid-cols-2">
                  {landingPlatformFeatures.map((feature) => (
                    <motion.article key={feature.title} {...sectionAnimation} className="landing-outline-card p-6">
                      <div className="landing-icon-badge">{feature.icon}</div>
                      <h3 className="mt-5 text-lg font-bold text-foreground">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform-overview" className="py-20">
          <div className="page-shell">
            <div className="landing-panel p-6 sm:p-8">
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
          </div>
        </section>

        <section id="operational-value" className="py-20">
          <div className="page-shell">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <motion.div {...sectionAnimation} className="landing-premium-card p-6 sm:p-8">
                <span className="section-kicker">قيمة تشغيلية</span>
                <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground">نتائج تشغيلية مقنعة دون ادعاءات رقمية مبالغ فيها</h2>
                <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
                  القيمة التي تقدمها المنصة تظهر في وضوح القرار، انخفاض الاعتماد على التنسيق اليدوي، وتحسن القدرة
                  على متابعة الحالات والاستثناءات عبر شبكة تشغيل واحدة.
                </p>
              </motion.div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {landingOperationalValues.map((value) => (
                  <motion.article key={value.title} {...sectionAnimation} className="landing-outline-card p-5">
                    <p className="text-sm font-semibold text-foreground">{value.title}</p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{value.description}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="final-cta" className="py-20">
          <div className="page-shell">
            <div className="landing-cta-panel">
              <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
                <div className="space-y-4">
                  <span className="section-kicker">انطلق الآن</span>
                  <h2 className="text-3xl font-bold leading-tight text-foreground">{finalCtaTitle}</h2>
                  <p className="max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
                    {brandText(finalCtaDescription)}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="landing-outline-card p-4">
                      <p className="text-sm font-semibold text-foreground">اعتماد إداري واضح</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">الفنادق والمزودون يمرون عبر دورة اعتماد قبل الدخول التشغيلي.</p>
                    </div>
                    <div className="landing-outline-card p-4">
                      <p className="text-sm font-semibold text-foreground">تشغيل موحد</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">طلب، إسناد، تنفيذ، ومتابعة داخل منظومة واحدة واضحة.</p>
                    </div>
                    <div className="landing-outline-card p-4">
                      <p className="text-sm font-semibold text-foreground">جاهزية للعروض والـ pilot</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">واجهة أوضح لعرض القيمة التشغيلية على أصحاب القرار والفرق التنفيذية.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <Button asChild size="lg">
                    <Link to={landingPrimaryAction.to}>
                      {primaryLabel}
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to={appRoutes.providerRegistration}>{providerLink}</Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                    <a href="#contact">تواصل معنا</a>
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
