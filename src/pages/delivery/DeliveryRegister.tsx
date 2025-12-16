import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

const DeliveryRegister = () => {
  const { t, isRTL } = useLanguage();
  const [partnerType, setPartnerType] = useState("individual");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const benefits = [
    { icon: "💰", label: t("deliveryRegister.earnMore") },
    { icon: "⏰", label: t("deliveryRegister.flexibleHours") },
    { icon: "📍", label: t("deliveryRegister.workLocally") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt={t("app.name")} className="h-8 w-auto" />
              <span className="text-lg font-bold text-secondary">{t("app.name")}</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <BackArrow className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t("deliveryRegister.backToHome")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Truck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("deliveryRegister.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("deliveryRegister.subtitle")}
            </p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t("deliveryRegister.cardTitle")}</CardTitle>
              <CardDescription>
                {t("deliveryRegister.cardDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Partner Type */}
                <div className="space-y-3">
                  <Label>{t("deliveryRegister.partnerType")}</Label>
                  <RadioGroup
                    value={partnerType}
                    onValueChange={setPartnerType}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        partnerType === "individual"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPartnerType("individual")}
                    >
                      <RadioGroupItem value="individual" id="individual" />
                      <div>
                        <Label htmlFor="individual" className="cursor-pointer font-medium">
                          {t("deliveryRegister.individual")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t("deliveryRegister.individualDesc")}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        partnerType === "company"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPartnerType("company")}
                    >
                      <RadioGroupItem value="company" id="company" />
                      <div>
                        <Label htmlFor="company" className="cursor-pointer font-medium">
                          {t("deliveryRegister.company")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t("deliveryRegister.companyDesc")}
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("deliveryRegister.fullName")}</Label>
                    <div className="relative">
                      <User className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input
                        id="name"
                        placeholder={t("deliveryRegister.fullNamePlaceholder")}
                        className={isRTL ? "pr-10" : "pl-10"}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("deliveryRegister.email")}</Label>
                    <div className="relative">
                      <Mail className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("deliveryRegister.emailPlaceholder")}
                        className={isRTL ? "pr-10" : "pl-10"}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("deliveryRegister.phone")}</Label>
                    <div className="relative">
                      <Phone className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t("deliveryRegister.phonePlaceholder")}
                        className={isRTL ? "pr-10" : "pl-10"}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t("deliveryRegister.city")}</Label>
                    <div className="relative">
                      <MapPin className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input
                        id="city"
                        placeholder={t("deliveryRegister.cityPlaceholder")}
                        className={isRTL ? "pr-10" : "pl-10"}
                        required
                      />
                    </div>
                  </div>

                  {partnerType === "company" && (
                    <div className="space-y-2">
                      <Label htmlFor="company">{t("deliveryRegister.companyName")}</Label>
                      <div className="relative">
                        <Building2 className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="company"
                          placeholder={t("deliveryRegister.companyNamePlaceholder")}
                          className={isRTL ? "pr-10" : "pl-10"}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("deliveryRegister.submitting") : t("deliveryRegister.submitApplication")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {benefits.map((benefit) => (
              <div
                key={benefit.label}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="text-2xl mb-2">{benefit.icon}</div>
                <div className="text-sm font-medium">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeliveryRegister;
