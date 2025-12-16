import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MapPin, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { user, signOut, loading } = useAuth();

  const navItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.findLaundries"), href: "/laundries" },
    { label: t("nav.howItWorks"), href: "/how-it-works" },
    { label: t("nav.donation"), href: "/donation" },
    { label: t("nav.forProviders"), href: "/provider/register" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Wash Off" className="h-10 w-auto" />
            <span className="text-xl font-bold text-secondary">{t("app.name")}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" className="gap-2">
              <MapPin className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-0"}`} />
              <span className="text-sm">{t("nav.setLocation")}</span>
            </Button>
            
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="max-w-[120px] truncate">
                          {user.user_metadata?.full_name || user.email?.split("@")[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? "start" : "end"}>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                          {t("nav.profile")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer">
                          {t("nav.orders")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                        <LogOut className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("profile.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="outline" size="sm">
                        {t("nav.signIn")}
                      </Button>
                    </Link>
                    <Link to="/auth?mode=signup">
                      <Button size="sm">{t("nav.getStarted")}</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <button
              className="p-2 rounded-lg hover:bg-muted"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Link to="/profile" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full gap-2">
                            <User className="h-4 w-4" />
                            {t("nav.profile")}
                          </Button>
                        </Link>
                        <Link to="/orders" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full">
                            {t("nav.orders")}
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          className="w-full gap-2"
                          onClick={() => {
                            handleSignOut();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          {t("profile.logout")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/auth" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full">
                            {t("nav.signIn")}
                          </Button>
                        </Link>
                        <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>
                          <Button className="w-full">{t("nav.getStarted")}</Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
