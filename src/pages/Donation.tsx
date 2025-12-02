import { useState } from "react";
import { Heart, Package, Truck, Users, CheckCircle, MapPin, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import { toast } from "sonner";

const Donation = () => {
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    clothesDescription: "",
    preferredDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("donation.successMessage"));
    setFormData({
      name: "",
      phone: "",
      address: "",
      clothesDescription: "",
      preferredDate: "",
    });
  };

  const steps = [
    {
      icon: Package,
      title: t("donation.step1.title"),
      description: t("donation.step1.desc"),
    },
    {
      icon: Truck,
      title: t("donation.step2.title"),
      description: t("donation.step2.desc"),
    },
    {
      icon: Heart,
      title: t("donation.step3.title"),
      description: t("donation.step3.desc"),
    },
    {
      icon: Users,
      title: t("donation.step4.title"),
      description: t("donation.step4.desc"),
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                {t("donation.badge")}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                {t("donation.title")}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {t("donation.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
              {t("donation.howItWorks")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <Card key={index} className="relative border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute top-4 left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Donation Form */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    {t("donation.formTitle")}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {t("donation.formSubtitle")}
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("donation.name")}</Label>
                        <div className="relative">
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            required
                            className={isRTL ? "pr-10" : "pl-10"}
                          />
                          <Users className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("donation.phone")}</Label>
                        <div className="relative">
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            required
                            className={isRTL ? "pr-10" : "pl-10"}
                          />
                          <Phone className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">{t("donation.address")}</Label>
                      <div className="relative">
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          required
                          className={isRTL ? "pr-10" : "pl-10"}
                        />
                        <MapPin className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clothesDescription">
                        {t("donation.clothesDescription")}
                      </Label>
                      <Textarea
                        id="clothesDescription"
                        value={formData.clothesDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clothesDescription: e.target.value,
                          })
                        }
                        required
                        rows={4}
                        placeholder={t("donation.clothesPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">
                        {t("donation.preferredDate")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="preferredDate"
                          type="date"
                          value={formData.preferredDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preferredDate: e.target.value,
                            })
                          }
                          required
                          className={isRTL ? "pr-10" : "pl-10"}
                        />
                        <Calendar className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <Heart className="w-5 h-5 me-2" />
                      {t("donation.submitButton")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-primary-foreground/80">{t("donation.stats.families")}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">2,000+</div>
                <div className="text-primary-foreground/80">{t("donation.stats.clothes")}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-primary-foreground/80">{t("donation.stats.partners")}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Donation;
