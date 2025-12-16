import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

const ProviderRegister = () => {
  const { t, isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([
    { name: t("providerRegister.regularWashing"), price: "" },
    { name: t("providerRegister.ironing"), price: "" },
    { name: t("providerRegister.dryCleaning"), price: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const days = [
    { key: "mon", label: t("providerRegister.days.mon") },
    { key: "tue", label: t("providerRegister.days.tue") },
    { key: "wed", label: t("providerRegister.days.wed") },
    { key: "thu", label: t("providerRegister.days.thu") },
    { key: "fri", label: t("providerRegister.days.fri") },
    { key: "sat", label: t("providerRegister.days.sat") },
    { key: "sun", label: t("providerRegister.days.sun") },
  ];

  const addService = () => {
    setServices([...services, { name: "", price: "" }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      // Simulate submission
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

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
                {t("providerRegister.backToHome")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card className="shadow-xl">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Business Info */}
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {t("providerRegister.businessInfo")}
                    </CardTitle>
                    <CardDescription>
                      {t("providerRegister.businessInfoDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">{t("providerRegister.businessName")}</Label>
                      <Input
                        id="businessName"
                        placeholder={t("providerRegister.businessNamePlaceholder")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registration">{t("providerRegister.commercialReg")}</Label>
                      <div className="relative">
                        <FileText className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="registration"
                          placeholder={t("providerRegister.commercialRegPlaceholder")}
                          className={isRTL ? "pr-10" : "pl-10"}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t("providerRegister.businessEmail")}</Label>
                      <div className="relative">
                        <Mail className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("providerRegister.businessEmailPlaceholder")}
                          className={isRTL ? "pr-10" : "pl-10"}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("providerRegister.contactPhone")}</Label>
                      <div className="relative">
                        <Phone className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={t("providerRegister.contactPhonePlaceholder")}
                          className={isRTL ? "pr-10" : "pl-10"}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t("providerRegister.businessDescription")}</Label>
                      <Textarea
                        id="description"
                        placeholder={t("providerRegister.businessDescPlaceholder")}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 2: Location & Hours */}
              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {t("providerRegister.locationHours")}
                    </CardTitle>
                    <CardDescription>
                      {t("providerRegister.locationHoursDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">{t("providerRegister.businessAddress")}</Label>
                      <div className="relative">
                        <MapPin className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="address"
                          placeholder={t("providerRegister.businessAddressPlaceholder")}
                          className={isRTL ? "pr-10" : "pl-10"}
                          required
                        />
                      </div>
                    </div>

                    {/* Map placeholder */}
                    <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t("providerRegister.pinLocation")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="openTime">{t("providerRegister.openingTime")}</Label>
                        <div className="relative">
                          <Clock className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                          <Input
                            id="openTime"
                            type="time"
                            className={isRTL ? "pr-10" : "pl-10"}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closeTime">{t("providerRegister.closingTime")}</Label>
                        <div className="relative">
                          <Clock className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                          <Input
                            id="closeTime"
                            type="time"
                            className={isRTL ? "pr-10" : "pl-10"}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("providerRegister.workingDays")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {days.map((day) => (
                          <Badge
                            key={day.key}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 3: Services */}
              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      ✨ {t("providerRegister.servicesPricing")}
                    </CardTitle>
                    <CardDescription>
                      {t("providerRegister.servicesPricingDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Input
                          placeholder={t("providerRegister.serviceName")}
                          value={service.name}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index].name = e.target.value;
                            setServices(newServices);
                          }}
                          className="flex-1"
                        />
                        <Input
                          placeholder={t("providerRegister.price")}
                          type="number"
                          value={service.price}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index].price = e.target.value;
                            setServices(newServices);
                          }}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">{t("currency.sar")}</span>
                        {services.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {t("providerRegister.addService")}
                    </Button>
                  </CardContent>
                </>
              )}

              {/* Navigation */}
              <CardContent className="flex justify-between pt-6 border-t border-border">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    {t("action.back")}
                  </Button>
                ) : (
                  <div />
                )}
                <Button type="submit" disabled={isLoading}>
                  {step < 3
                    ? t("action.continue")
                    : isLoading
                    ? t("providerRegister.submitting")
                    : t("providerRegister.submitApplication")}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProviderRegister;
