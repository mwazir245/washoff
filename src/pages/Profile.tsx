import { Link } from "react-router-dom";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Star,
  Package,
  Heart,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();

  const menuItems = [
    {
      icon: MapPin,
      label: t("profile.settings"),
      href: "/profile/addresses",
      badge: "2",
    },
    {
      icon: CreditCard,
      label: t("footer.pricing"),
      href: "/profile/payments",
      badge: null,
    },
    {
      icon: Heart,
      label: t("footer.forCustomers"),
      href: "/profile/favorites",
      badge: "3",
    },
    {
      icon: Bell,
      label: t("profile.settings"),
      href: "/profile/notifications",
      badge: null,
    },
    {
      icon: HelpCircle,
      label: t("footer.helpCenter"),
      href: "/help",
      badge: null,
    },
    {
      icon: FileText,
      label: t("footer.support"),
      href: "/terms",
      badge: null,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-secondary" />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                <div className="h-24 w-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-foreground">John Doe</h1>
                  <p className="text-muted-foreground">john.doe@email.com</p>
                </div>
                <Button variant="outline" size="sm">
                  {t("action.edit")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-muted-foreground">{t("nav.orders")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 text-warning mx-auto mb-2" />
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">{t("laundry.reviews")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-6 w-6 text-destructive mx-auto mb-2" />
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-muted-foreground">{t("stats.laundries")}</div>
              </CardContent>
            </Card>
          </div>

          {/* Language Selector */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                  <Globe className="h-5 w-5 text-accent-foreground" />
                </div>
                <span className="flex-1 font-medium">{t("profile.language")}</span>
                <div className="flex gap-2">
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === "ar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("ar")}
                  >
                    العربية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardContent className="p-2">
              {menuItems.map((item, index) => (
                <Link key={item.label + index} to={item.href}>
                  <div
                    className={`flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors ${
                      index < menuItems.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="soft">{item.badge}</Badge>
                    )}
                    <ChevronRight className={`h-5 w-5 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Link to="/auth">
            <Button
              variant="ghost"
              className="w-full mt-6 gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              {t("profile.logout")}
            </Button>
          </Link>

          {/* App Version */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("app.name")} v1.0.0
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
