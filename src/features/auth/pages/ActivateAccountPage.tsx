import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthPageLayout from "@/features/auth/components/AuthPageLayout";
import {
  resolveAccountHomeRoute,
  useActivateAccountMutation,
  useActivationTokenStatus,
  useCurrentAccountSession,
} from "@/features/auth/hooks/useAccountAuth";
import { AccountTokenValidationStatus } from "@/features/auth/model";
import { appRoutes } from "@/shared/config/navigation";

const renderTokenState = (status?: AccountTokenValidationStatus) => {
  switch (status) {
    case AccountTokenValidationStatus.Expired:
      return {
        title: "رابط التفعيل منتهي الصلاحية",
        description: "انتهت صلاحية هذا الرابط. اطلب من الإدارة إصدار رابط تفعيل جديد للحساب.",
      };
    case AccountTokenValidationStatus.Used:
      return {
        title: "تم استخدام رابط التفعيل",
        description: "يبدو أن هذا الرابط استُخدم مسبقًا. يمكنك تسجيل الدخول مباشرة أو طلب رابط جديد عند الحاجة.",
      };
    case AccountTokenValidationStatus.Invalid:
    default:
      return {
        title: "رابط التفعيل غير صالح",
        description: "تأكد من فتح الرابط الكامل المرسل لك من الإدارة، أو اطلب إعادة إصدار رابط جديد.",
      };
  }
};

const ActivateAccountPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const sessionQuery = useCurrentAccountSession();
  const activationStatusQuery = useActivationTokenStatus(token);
  const activateMutation = useActivateAccountMutation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionQuery.data?.account.role) {
      navigate(resolveAccountHomeRoute(sessionQuery.data.account.role), { replace: true });
    }
  }, [navigate, sessionQuery.data]);

  const activationError = useMemo(() => {
    return activateMutation.error instanceof Error ? activateMutation.error.message : undefined;
  }, [activateMutation.error]);

  const tokenStatus = activationStatusQuery.data?.status;
  const tokenReady = tokenStatus === AccountTokenValidationStatus.Ready;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setValidationMessage("رابط التفعيل غير مكتمل. تأكد من فتح الرابط المرسل من الإدارة.");
      return;
    }

    if (!tokenReady) {
      setValidationMessage("لا يمكن متابعة التفعيل لأن حالة الرابط الحالية غير صالحة.");
      return;
    }

    if (!password.trim()) {
      setValidationMessage("يرجى إدخال كلمة مرور جديدة.");
      return;
    }

    if (password.trim().length < 8) {
      setValidationMessage("يجب أن تكون كلمة المرور 8 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationMessage("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setValidationMessage(null);
    const session = await activateMutation.mutateAsync({
      token,
      password,
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    navigate(resolveAccountHomeRoute(session.account.role), { replace: true });
  };

  const invalidState = !token || (!activationStatusQuery.isLoading && tokenStatus !== AccountTokenValidationStatus.Ready);
  const invalidCopy = renderTokenState(tokenStatus);

  return (
    <AuthPageLayout
      eyebrow="تفعيل الحساب"
      title="أكمل تفعيل حسابك في WashOff"
      description="بعد اعتماد الجهة من الإدارة، يصبح الحساب جاهزًا للتفعيل. أكمل كلمة المرور وبياناتك الأساسية لبدء الوصول التشغيلي."
      sideTitle="ما الذي يفعله التفعيل؟"
      sideDescription="يحوّل التفعيل الحساب من حالة الانتظار إلى حساب نشط قادر على الوصول إلى لوحة الفندق أو المزوّد أو الإدارة حسب الدور المرتبط."
      sidePoints={[
        "لا يتم التفعيل إلا بعد موافقة الإدارة على الجهة.",
        "رابط التفعيل مؤقت ومخصص للحساب نفسه فقط.",
        "بعد اكتمال التفعيل يصبح تسجيل الدخول متاحًا بصورة طبيعية.",
      ]}
    >
      {invalidState ? (
        <div className="space-y-5">
          <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-5 py-5 text-sm leading-7 text-destructive">
            <div className="font-semibold">{invalidCopy.title}</div>
            <p className="mt-2">{invalidCopy.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={appRoutes.login}>الانتقال إلى تسجيل الدخول</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={appRoutes.landing}>العودة للرئيسية</Link>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <span className="section-kicker">تهيئة الحساب</span>
            <div>
              <h2 className="text-2xl font-bold text-foreground">اضبط بياناتك وكلمة المرور</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                بعد الإكمال سيتم تسجيل دخولك مباشرة إلى اللوحة المناسبة لدورك.
              </p>
            </div>
          </div>

          {(validationMessage ?? activationError) ? (
            <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
              {validationMessage ?? activationError}
            </div>
          ) : null}

          {activationStatusQuery.data ? (
            <div className="info-panel px-5 py-5 text-sm text-muted-foreground">
              الحساب المرتبط: {activationStatusQuery.data.accountEmail ?? "غير معروف"}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label">الاسم الكامل</label>
              <input
                className="field-input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="field-label">رقم الجوال</label>
              <input
                className="field-input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="field-label">كلمة المرور الجديدة</label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="field-label">تأكيد كلمة المرور</label>
              <input
                type="password"
                className="field-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="info-panel flex items-start gap-3 px-5 py-5 text-sm text-muted-foreground">
            <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
            <p>
              يبقى وصولك مرتبطًا بجهة واحدة معتمدة فقط، ويُمنع الوصول التشغيلي إذا تغيّرت حالة الجهة أو الحساب لاحقًا.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              بعد التفعيل يمكنك الدخول مباشرة من صفحة تسجيل الدخول.
            </div>

            <Button
              type="submit"
              disabled={activateMutation.isPending || sessionQuery.isLoading || activationStatusQuery.isLoading}
            >
              {activateMutation.isPending ? "جارٍ تفعيل الحساب..." : "تفعيل الحساب"}
            </Button>
          </div>
        </form>
      )}
    </AuthPageLayout>
  );
};

export default ActivateAccountPage;
