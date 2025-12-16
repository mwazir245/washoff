import { Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Truck,
  Sparkles,
  Clock,
  Shield,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorks = () => {
  const { t, isRTL } = useLanguage();

  const steps = [
    {
      number: "01",
      icon: MapPin,
      title: t("howItWorksPage.step1.title"),
      description: t("howItWorksPage.step1.desc"),
    },
    {
      number: "02",
      icon: Calendar,
      title: t("howItWorksPage.step2.title"),
      description: t("howItWorksPage.step2.desc"),
    },
    {
      number: "03",
      icon: Sparkles,
      title: t("howItWorksPage.step3.title"),
      description: t("howItWorksPage.step3.desc"),
    },
    {
      number: "04",
      icon: Truck,
      title: t("howItWorksPage.step4.title"),
      description: t("howItWorksPage.step4.desc"),
    },
  ];

  const features = [
    {
      icon: Clock,
      title: t("howItWorksPage.sameDayService"),
      description: t("howItWorksPage.sameDayServiceDesc"),
    },
    {
      icon: Shield,
      title: t("howItWorksPage.qualityGuarantee"),
      description: t("howItWorksPage.qualityGuaranteeDesc"),
    },
    {
      icon: CreditCard,
      title: t("howItWorksPage.flexiblePayments"),
      description: t("howItWorksPage.flexiblePaymentsDesc"),
    },
    {
      icon: Smartphone,
      title: t("howItWorksPage.realTimeTracking"),
      description: t("howItWorksPage.realTimeTrackingDesc"),
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-hero py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="soft" className="mb-4">
              {t("howItWorksPage.badge")}
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t("howItWorksPage.title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("howItWorksPage.subtitle")}
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`flex flex-col md:flex-row gap-8 items-center mb-16 last:mb-0 ${
                    index % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className={`text-6xl font-bold text-primary/20 mb-4 ${isRTL ? "text-right" : "text-left"}`}>
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center shadow-card">
                      <step.icon className="h-20 w-20 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t("howItWorksPage.whyChoose")}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("howItWorksPage.whyChooseDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("howItWorksPage.ctaTitle")}
            </h2>
            <p className="text-secondary-foreground/80 mb-8 max-w-xl mx-auto">
              {t("howItWorksPage.ctaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/laundries">
                <Button
                  size="xl"
                  className="bg-primary-foreground text-secondary hover:bg-primary-foreground/90"
                >
                  {t("howItWorksPage.findLaundries")}
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-secondary-foreground/50 text-secondary-foreground hover:bg-secondary-foreground/10"
                >
                  {t("howItWorksPage.createAccount")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HowItWorks;
