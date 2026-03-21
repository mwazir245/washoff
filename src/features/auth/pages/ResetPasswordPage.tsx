import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthPageLayout from "@/features/auth/components/AuthPageLayout";
import {
  resolveAccountHomeRoute,
  useCurrentAccountSession,
  useResetPasswordMutation,
  useResetPasswordTokenStatus,
} from "@/features/auth/hooks/useAccountAuth";
import { AccountTokenValidationStatus } from "@/features/auth/model";
import { appRoutes } from "@/shared/config/navigation";

const resolveTokenMessage = (status?: AccountTokenValidationStatus) => {
  switch (status) {
    case AccountTokenValidationStatus.Expired:
      return {
        title: "رابط إعادة الضبط منتهي الصلاحية",
        description: "انتهت صلاحية هذا الرابط. اطلب رابطًا جديدًا لإعادة ضبط كلمة المرور.",
      };
    case AccountTokenValidationStatus.Used:
      return {
        title: "تم استخدام الرابط مسبقًا",
        description: "هذا الرابط لم يعد صالحًا لأنه استُخدم من قبل. اطلب رابطًا جديدًا إذا احتجت إلى إعادة الضبط مرة أخرى.",
      };
    case AccountTokenValidationStatus.Invalid:
    default:
      return {
        title: "رابط إعادة الضبط غير صالح",
        description: "تحقق من الرابط كاملًا أو اطلب رابطًا جديدًا لإعادة ضبط كلمة المرور.",
      };
  }
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const sessionQuery = useCurrentAccountSession();
  const tokenStatusQuery = useResetPasswordTokenStatus(token);
  const resetPasswordMutation = useResetPasswordMutation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionQuery.data?.account.role) {
      navigate(resolveAccountHomeRoute(sessionQuery.data.account.role), { replace: true });
    }
  }, [navigate, sessionQuery.data]);

  const tokenStatus = tokenStatusQuery.data?.status;
  const tokenReady = tokenStatus === AccountTokenValidationStatus.Ready;
  const errorMessage =
    validationMessage ??
    (resetPasswordMutation.error instanceof Error ? resetPasswordMutation.error.message : undefined);

  const invalidStateCopy = useMemo(() => resolveTokenMessage(tokenStatus), [tokenStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setValidationMessage("رابط إعادة الضبط غير مكتمل.");
      return;
    }

    if (!tokenReady) {
      setValidationMessage("لا يمكن متابعة إعادة الضبط لأن حالة الرابط الحالية غير صالحة.");
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
    const session = await resetPasswordMutation.mutateAsync({
      token,
      password,
    });
    navigate(resolveAccountHomeRoute(session.account.role), { replace: true });
  };

  const showInvalidState = !token || (!tokenStatusQuery.isLoading && !tokenReady);

  return (
    <AuthPageLayout
      eyebrow="كلمة مرور جديدة"
      title="أكمل إعادة ضبط كلمة المرور"
      description="أدخل كلمة المرور الجديدة للحساب. عند نجاح العملية سيتم إلغاء الجلسات القديمة وفتح جلسة جديدة آمنة."
      sideTitle="ضبط آمن للجلسات"
      sideDescription="WashOff يبطل الجلسات السابقة عند إعادة ضبط كلمة المرور، حتى لا تبقى أي جلسة قديمة صالحة بعد تغيير بيانات الدخول."
      sidePoints={[
        "الرابط صالح لفترة محدودة فقط.",
        "لا يمكن استخدام الرابط بعد نجاح العملية.",
        "الجلسات القديمة تُلغى تلقائيًا عند تعيين كلمة المرور الجديدة.",
      ]}
    >
      {showInvalidState ? (
        <div className="space-y-5">
          <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-5 py-5 text-sm leading-7 text-destructive">
            <div className="font-semibold">{invalidStateCopy.title}</div>
            <p className="mt-2">{invalidStateCopy.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={appRoutes.forgotPassword}>طلب رابط جديد</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={appRoutes.login}>العودة إلى تسجيل الدخول</Link>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <span className="section-kicker">تحقق من الرابط</span>
            <div>
              <h2 className="text-2xl font-bold text-foreground">عيّن كلمة مرور جديدة</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                الحساب المرتبط: {tokenStatusQuery.data?.accountEmail ?? "غير معروف"}
              </p>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-5">
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to={appRoutes.login} className="text-sm font-semibold text-primary hover:text-primary/80">
              العودة إلى تسجيل الدخول
            </Link>
            <Button type="submit" disabled={resetPasswordMutation.isPending || tokenStatusQuery.isLoading}>
              {resetPasswordMutation.isPending ? "جارٍ تحديث كلمة المرور..." : "حفظ كلمة المرور الجديدة"}
            </Button>
          </div>
        </form>
      )}
    </AuthPageLayout>
  );
};

export default ResetPasswordPage;
