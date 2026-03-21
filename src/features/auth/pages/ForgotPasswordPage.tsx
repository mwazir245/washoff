import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthPageLayout from "@/features/auth/components/AuthPageLayout";
import { useForgotPasswordMutation } from "@/features/auth/hooks/useAccountAuth";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { appRoutes } from "@/shared/config/navigation";
import { localizeWashoffBrandText } from "@/shared/lib/brand";

const ForgotPasswordPage = () => {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const { language } = usePlatformLanguage();
  const [email, setEmail] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const brandText = (value: string) => localizeWashoffBrandText(value, language);

  const errorMessage = useMemo(() => {
    return validationMessage ?? (forgotPasswordMutation.error instanceof Error ? forgotPasswordMutation.error.message : null);
  }, [forgotPasswordMutation.error, validationMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setValidationMessage("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    setValidationMessage(null);
    await forgotPasswordMutation.mutateAsync({
      email: email.trim(),
    });
  };

  return (
    <AuthPageLayout
      eyebrow="إعادة ضبط كلمة المرور"
      title="استعد الوصول إلى حسابك"
      description={brandText(
        "إذا كان البريد مرتبطًا بحساب نشط ومفعّل في WashOff، فسيتم إرسال تعليمات إعادة الضبط عبر البريد الإلكتروني أو صندوق التطوير الآمن وفق إعدادات البيئة.",
      )}
      sideTitle="ماذا يحدث بعد الطلب؟"
      sideDescription={brandText(
        "يعتمد WashOff في هذه المرحلة على طبقة بريد مخصصة للهوية. في بيئة التطوير يمكن حفظ الرسائل داخل outbox آمن، وفي البيئات الأعلى يمكن استبدالها بمزوّد بريد فعلي دون تغيير منطق المصادقة.",
      )}
      sidePoints={[
        "الرابط مؤقت وله صلاحية محدودة.",
        "لا يمكن استخدام الرابط بعد إكمال إعادة الضبط.",
        "يتم إلغاء الجلسات القديمة بعد تعيين كلمة مرور جديدة.",
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <span className="section-kicker">طلب جديد</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">أدخل بريد الحساب</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              سنعالج الطلب بطريقة لا تكشف ما إذا كان الحساب موجودًا أو لا.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {forgotPasswordMutation.data ? (
          <div className="space-y-4 rounded-[1.2rem] border border-primary/10 bg-primary/[0.04] px-5 py-5 text-sm leading-7 text-foreground">
            <p>{forgotPasswordMutation.data.messageAr}</p>
            <p className="text-muted-foreground">
              إذا لم تصلك الرسالة خلال وقت قصير، راجع البريد غير المرغوب فيه أو تواصل مع إدارة المنصة للتأكد من حالة الحساب.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5">
          <div>
            <label className="field-label">البريد الإلكتروني</label>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to={appRoutes.login} className="text-sm font-semibold text-primary hover:text-primary/80">
            العودة إلى تسجيل الدخول
          </Link>
          <Button type="submit" disabled={forgotPasswordMutation.isPending}>
            {forgotPasswordMutation.isPending ? "جارٍ تجهيز الرابط..." : "إرسال طلب إعادة الضبط"}
          </Button>
        </div>
      </form>
    </AuthPageLayout>
  );
};

export default ForgotPasswordPage;
