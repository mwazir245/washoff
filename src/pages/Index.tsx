import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Sparkles, Clock, Heart, Truck, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import LaundryCard from "@/components/laundry/LaundryCard";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

const mockLaundries = [
  {
    id: "1",
    name: "Fresh & Clean Laundry",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=300&fit=crop",
    rating: 4.8,
    reviewCount: 124,
    distance: "0.5 km",
    deliveryTime: "2-3 hrs",
    services: ["Washing", "Ironing", "Dry Clean"],
    priceRange: "$$",
    hasDelivery: true,
    isOpen: true,
  },
  {
    id: "2",
    name: "Sparkle Wash",
    image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 89,
    distance: "1.2 km",
    deliveryTime: "3-4 hrs",
    services: ["Washing", "Dry Clean"],
    priceRange: "$",
    hasDelivery: true,
    isOpen: true,
  },
  {
    id: "3",
    name: "Premium Garment Care",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
    rating: 4.9,
    reviewCount: 203,
    distance: "1.8 km",
    deliveryTime: "Same day",
    services: ["Washing", "Ironing", "Dry Clean", "Alterations"],
    priceRange: "$$$",
    hasDelivery: true,
    isOpen: false,
  },
];

const Index = () => {
  const [location, setLocation] = useState("");
  const { t, isRTL } = useLanguage();

  const features = [
    {
      icon: Clock,
      title: t("features.quickTurnaround"),
      description: t("features.quickTurnaroundDesc"),
    },
    {
      icon: Truck,
      title: t("features.freeDelivery"),
      description: t("features.freeDeliveryDesc"),
    },
    {
      icon: Heart,
      title: t("features.socialImpact"),
      description: t("features.socialImpactDesc"),
    },
    {
      icon: Sparkles,
      title: t("features.ecoFriendly"),
      description: t("features.ecoFriendlyDesc"),
    },
  ];

  const steps = [
    { step: "1", title: t("howItWorks.step1.title"), desc: t("howItWorks.step1.desc") },
    { step: "2", title: t("howItWorks.step2.title"), desc: t("howItWorks.step2.desc") },
    { step: "3", title: t("howItWorks.step3.title"), desc: t("howItWorks.step3.desc") },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero min-h-[600px] flex items-center">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 ${isRTL ? '-left-40' : '-right-40'} w-96 h-96 bg-primary/10 rounded-full blur-3xl`} />
          <div className={`absolute -bottom-40 ${isRTL ? '-right-40' : '-left-40'} w-96 h-96 bg-accent/50 rounded-full blur-3xl`} />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground">
                {t("hero.titleHighlight")}
              </h1>
              <img src={logo} alt="Wash Off" className="h-16 md:h-20 w-auto" />
            </div>
            <p className="text-xl md:text-2xl font-medium text-primary-foreground/90 mb-2 animate-fade-in">
              {t("hero.title")}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in">
              {t("hero.subtitle")}
            </p>

            {/* Search Box */}
            <div className="max-w-xl mx-auto animate-slide-up">
              <Card className="p-2 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      placeholder={t("hero.searchPlaceholder")}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} border-0 shadow-none bg-muted/50`}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <Link to="/laundries">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      <Search className="h-4 w-4" />
                      {t("hero.searchButton")}
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 animate-fade-in">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">{t("stats.laundries")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">{t("stats.happyCustomers")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.8</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                  <Star className="h-4 w-4 fill-warning text-warning" /> {t("stats.averageRating")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="soft" className="mb-4">{t("features.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("features.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                variant="glass"
                className="text-center p-6 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Laundries Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {t("nearby.title")}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t("nearby.subtitle")}
              </p>
            </div>
            <Link to="/laundries">
              <Button variant="ghost" className="gap-2">
                {t("nearby.viewAll")} <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockLaundries.map((laundry, index) => (
              <div
                key={laundry.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <LaundryCard {...laundry} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="soft" className="mb-4 bg-secondary-foreground/10 text-secondary-foreground">
              {t("howItWorks.badge")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              {t("howItWorks.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-foreground/10 flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-secondary-foreground/80">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/laundries">
              <Button variant="hero" size="xl" className="bg-primary-foreground text-secondary hover:bg-primary-foreground/90">
                {t("howItWorks.cta")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-accent/30 border-0">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {t("cta.title")}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {t("cta.description")}
                  </p>
                  <Link to="/provider/register">
                    <Button variant="hero" size="lg">
                      {t("cta.button")}
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:flex justify-center">
                  <div className="relative">
                    <div className={`w-64 h-64 bg-primary/20 rounded-full absolute -top-8 ${isRTL ? '-left-8' : '-right-8'} blur-2xl`} />
                    <img
                      src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=400&fit=crop"
                      alt="Laundry service"
                      className="relative rounded-2xl shadow-xl w-72 h-72 object-cover"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold">{t("app.name")}</span>
                <img src={logo} alt="Wash Off" className="h-10 w-auto" />
              </div>
              <p className="text-secondary-foreground/70 text-sm">
                {t("app.tagline")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.forCustomers")}</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/laundries" className="hover:text-secondary-foreground">{t("footer.findLaundries")}</Link></li>
                <li><Link to="/how-it-works" className="hover:text-secondary-foreground">{t("footer.howItWorks")}</Link></li>
                <li><Link to="/pricing" className="hover:text-secondary-foreground">{t("footer.pricing")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.forBusiness")}</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/provider/register" className="hover:text-secondary-foreground">{t("footer.partnerWithUs")}</Link></li>
                <li><Link to="/delivery/register" className="hover:text-secondary-foreground">{t("footer.becomeDriver")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.support")}</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/help" className="hover:text-secondary-foreground">{t("footer.helpCenter")}</Link></li>
                <li><Link to="/contact" className="hover:text-secondary-foreground">{t("footer.contactUs")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center text-sm text-secondary-foreground/70">
            {t("app.copyright")}
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
