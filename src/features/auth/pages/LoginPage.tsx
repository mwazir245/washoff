import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthPageLayout from "@/features/auth/components/AuthPageLayout";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import {
  resolveAccountHomeRoute,
  useCurrentAccountSession,
  useLoginMutation,
} from "@/features/auth/hooks/useAccountAuth";
import { appRoutes } from "@/shared/config/navigation";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = usePlatformLanguage();
  const pageContent = usePlatformPageContent("auth_login");
  const sessionQuery = useCurrentAccountSession();
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const nextRoute = searchParams.get("next")?.trim();
  const title = pageContent.getText("page", "title", "سجّل الدخول إلى حساب WashOff");
  const description = pageContent.getText(
    "page",
    "description",
    "يتم الوصول التشغيلي الآن عبر حساب فعلي مرتبط بجهة معتمدة. لا يمكن استخدام اللوحات التشغيلية قبل الاعتماد ثم التفعيل.",
  );
  const sideTitle = pageContent.getText("side", "title", "كيف يعمل الوصول الآن؟");
  const sideDescription = pageContent.getText(
    "side",
    "description",
    "يحافظ WashOff على فصل واضح بين هوية المستخدم والجهة التشغيلية المرتبطة به، حتى تبقى كل لوحة وإجراء محميًا بدور صحيح واعتماد فعلي.",
  );
  const formTitle = pageContent.getText("form", "title", "أدخل بيانات الحساب");
  const formDescription = pageContent.getText(
    "form",
    "description",
    "استخدم البريد الإلكتروني المرتبط بحسابك بعد الاعتماد والتفعيل.",
  );
  const emailLabel = pageContent.getText("form", "email_label", "البريد الإلكتروني");
  const passwordLabel = pageContent.getText("form", "password_label", "كلمة المرور");
  const forgotPasswordLabel = pageContent.getText("form", "forgot_password_link", "نسيت كلمة المرور؟");
  const submitLabel = pageContent.getText("form", "submit_label", "تسجيل الدخول");
  const activationHint = pageContent.getText(
    "messages",
    "activation_hint",
    "إذا تم اعتماد الجهة لكن الحساب لم يُفعّل بعد، استخدم رابط التفعيل الذي وصلك من الإدارة أولًا.",
  );
  const registerHotelLabel = pageContent.getText("links", "register_hotel", "تسجيل فندق جديد");
  const registerProviderLabel = pageContent.getText("links", "register_provider", "تسجيل مزوّد جديد");

  useEffect(() => {
    if (sessionQuery.data?.account.role) {
      navigate(nextRoute || resolveAccountHomeRoute(sessionQuery.data.account.role), { replace: true });
    }
  }, [navigate, nextRoute, sessionQuery.data]);

  const errorMessage =
    validationMessage ?? (loginMutation.error instanceof Error ? loginMutation.error.message : undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setValidationMessage(language === "en" ? "Please enter your email." : "يرجى إدخال البريد الإلكتروني.");
      return;
    }

    if (!password.trim()) {
      setValidationMessage(language === "en" ? "Please enter your password." : "يرجى إدخال كلمة المرور.");
      return;
    }

    setValidationMessage(null);
    const session = await loginMutation.mutateAsync({
      email: email.trim(),
      password,
    });
    navigate(nextRoute || resolveAccountHomeRoute(session.account.role), { replace: true });
  };

  return (
    <AuthPageLayout
      eyebrow={language === "en" ? "Account access" : "دخول الحساب"}
      title={title}
      description={description}
      sideTitle={sideTitle}
      sideDescription={sideDescription}
      sidePoints={[
        language === "en"
          ? "A hotel account is linked to one approved hotel only."
          : "حساب الفندق يرتبط بفندق واحد معتمد فقط.",
        language === "en"
          ? "A provider account is linked to one approved provider only."
          : "حساب المزوّد يرتبط بمزوّد واحد معتمد فقط.",
        language === "en"
          ? "Admin approval comes first, then the account becomes eligible for activation and login."
          : "الإدارة تراجع الاعتماد أولًا، ثم يصبح الحساب مؤهلًا للتفعيل والدخول.",
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <span className="section-kicker">{language === "en" ? "Secure access session" : "جلسة تشغيل آمنة"}</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{formTitle}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{formDescription}</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-5">
          <div>
            <label className="field-label">{emailLabel}</label>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="field-label mb-0">{passwordLabel}</label>
              <Link
                to={appRoutes.forgotPassword}
                className="text-sm font-semibold text-primary hover:text-primary/80"
              >
                {forgotPasswordLabel}
              </Link>
            </div>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="accent-panel px-5 py-5 text-sm leading-7 text-muted-foreground">
          {activationHint}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link to={appRoutes.hotelRegistration} className="font-semibold text-primary hover:text-primary/80">
              {registerHotelLabel}
            </Link>
            <Link to={appRoutes.providerRegistration} className="font-semibold text-primary hover:text-primary/80">
              {registerProviderLabel}
            </Link>
          </div>

          <Button type="submit" disabled={loginMutation.isPending || sessionQuery.isLoading}>
            <KeyRound className="h-4 w-4" />
            {loginMutation.isPending
              ? language === "en"
                ? "Signing in..."
                : "جارٍ تسجيل الدخول..."
              : submitLabel}
          </Button>
        </div>

        <div className="info-panel flex items-start gap-3 px-5 py-5 text-sm text-muted-foreground">
          <ArrowLeft className="mt-1 h-4 w-4 text-primary" />
          <p>
            {language === "en"
              ? "Public registration is still available from the landing page, but dashboard access now requires a real account."
              : "ما يزال التسجيل العام متاحًا من الصفحة الرئيسية، لكن الوصول للوحة التشغيل أصبح عبر حساب فعلي فقط."}
          </p>
        </div>
      </form>
    </AuthPageLayout>
  );
};

export default LoginPage;
