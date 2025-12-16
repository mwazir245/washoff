import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const { t, isRTL } = useLanguage();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const getErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || "";
    
    if (message.includes("invalid login credentials")) {
      return t("auth.errorInvalidCredentials");
    }
    if (message.includes("user already registered") || message.includes("already registered")) {
      return t("auth.errorEmailTaken");
    }
    if (message.includes("password") && message.includes("6")) {
      return t("auth.errorWeakPassword");
    }
    return t("auth.errorGeneral");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInEmail, signInPassword);
    
    if (error) {
      toast({
        variant: "destructive",
        title: t("auth.signIn"),
        description: getErrorMessage(error),
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (signUpPassword.length < 6) {
      toast({
        variant: "destructive",
        title: t("auth.signUp"),
        description: t("auth.errorWeakPassword"),
      });
      setIsLoading(false);
      return;
    }
    
    const { error } = await signUp(signUpEmail, signUpPassword, signUpName);
    
    if (error) {
      toast({
        variant: "destructive",
        title: t("auth.signUp"),
        description: getErrorMessage(error),
      });
    } else {
      toast({
        title: t("auth.signUpSuccess"),
        description: t("auth.signUpSuccessDesc"),
      });
      // Clear form
      setSignUpName("");
      setSignUpEmail("");
      setSignUpPassword("");
    }
    
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 ${isRTL ? '-left-40' : '-right-40'} w-96 h-96 bg-primary/10 rounded-full blur-3xl`} />
        <div className={`absolute -bottom-40 ${isRTL ? '-right-40' : '-left-40'} w-96 h-96 bg-accent/50 rounded-full blur-3xl`} />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
        </Link>
        <LanguageToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="Wash Off" className="h-12 w-auto" />
              <span className="text-2xl font-bold text-secondary">{t("app.name")}</span>
            </Link>
          </div>

          <Card className="shadow-xl">
            <Tabs defaultValue={defaultTab}>
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                  <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Sign In Form */}
                <TabsContent value="signin" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("auth.email")}</Label>
                      <div className="relative">
                        <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("auth.email")}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t("auth.password")}</Label>
                        <Button variant="link" className="p-0 h-auto text-sm">
                          {t("auth.forgotPassword")}
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.password")}
                          className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? t("auth.signingIn") : t("auth.signIn")}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {t("auth.or")}
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" disabled>
                    {t("auth.continueWithGoogle")}
                  </Button>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("auth.fullName")}</Label>
                      <div className="relative">
                        <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="name"
                          type="text"
                          placeholder={t("auth.fullNamePlaceholder")}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t("auth.email")}</Label>
                      <div className="relative">
                        <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={t("auth.email")}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t("auth.password")}</Label>
                      <div className="relative">
                        <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.password")}
                          className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("auth.errorWeakPassword")}
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? t("auth.signingUp") : t("auth.signUp")}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Business Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t("footer.forBusiness")}</p>
            <div className="flex justify-center gap-4">
              <Link to="/provider/register">
                <Button variant="link" size="sm">
                  {t("provider.register")}
                </Button>
              </Link>
              <Link to="/delivery/register">
                <Button variant="link" size="sm">
                  {t("footer.becomeDriver")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
