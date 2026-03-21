import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import type { HotelRegistrationResult } from "@/features/orders/application";
import HotelRegistrationForm from "@/features/onboarding/components/HotelRegistrationForm";
import OnboardingStatusBadge from "@/features/onboarding/components/OnboardingStatusBadge";
import PublicRegistrationLayout from "@/features/onboarding/components/PublicRegistrationLayout";
import { useHotelRegistrationMutation } from "@/features/onboarding/hooks/useOnboarding";
import { appRoutes } from "@/shared/config/navigation";
import { formatDateTimeLabel } from "@/shared/lib/formatters";

const HotelRegistrationPage = () => {
  const { language } = usePlatformLanguage();
  const pageContent = usePlatformPageContent("onboarding_hotel");
  const registerMutation = useHotelRegistrationMutation();
  const submittedRegistration = registerMutation.data as HotelRegistrationResult | undefined;
  const submittedHotel = submittedRegistration?.hotel;
  const submittedAccount = submittedRegistration?.account;

  return (
    <PublicRegistrationLayout
      eyebrow="تسجيل فندق"
      title={pageContent.getText("page", "title", "ابدأ انضمام الفندق إلى WashOff")}
      description={pageContent.getText("page", "description", "أرسل بيانات الفندق الأساسية ليتم إنشاء طلب اعتماد رسمي. بعد المراجعة، يصبح الحساب المرتبط بالفندق مؤهلًا للتفعيل ثم يبدأ الوصول إلى لوحة التشغيل.")}
      checklistTitle={pageContent.getText("page", "checklist_title", "ما الذي يحدث بعد التسجيل؟")}
      checklistDescription={pageContent.getText("page", "checklist_description", "WashOff تعتمد الفنادق قبل تفعيل التشغيل حتى تبقى الشبكة موثوقة ومضبوطة تشغيليًا.")}
      checklistItems={[
        language === "en"
          ? "The request is submitted to admin for review."
          : "يصل الطلب إلى فريق الإدارة للمراجعة.",
        language === "en"
          ? "A linked account is created in pending state until approval."
          : "ينشأ حساب مرتبط بالفندق بحالة انتظار حتى يتم الاعتماد.",
        language === "en"
          ? "Only after approval does the account receive an activation path and hotel access."
          : "بعد الاعتماد فقط يحصل الحساب على مسار تفعيل ثم يفتح الوصول إلى لوحة الفندق.",
      ]}
    >
      {submittedHotel ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-success">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-2xl font-bold text-foreground">
              {pageContent.getText("success", "title", "تم إرسال طلب التسجيل بنجاح")}
            </h2>
          </div>

          <div className="info-panel px-5 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-foreground">{submittedHotel.displayName.ar}</p>
              <OnboardingStatusBadge status={submittedHotel.onboarding.status} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <p className="text-sm text-muted-foreground">المدينة: {submittedHotel.address.city}</p>
              <p className="text-sm text-muted-foreground">
                تاريخ الإرسال: {formatDateTimeLabel(submittedHotel.onboarding.submittedAt)}
              </p>
            </div>
          </div>

          {submittedAccount ? (
            <div className="info-panel px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">الحساب المرتبط</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="text-sm text-foreground">البريد: {submittedAccount.email}</p>
                <p className="text-sm text-foreground">الدور: {submittedAccount.roleLabelAr}</p>
                <p className="text-sm text-foreground">حالة الحساب: {submittedAccount.statusLabelAr}</p>
                <p className="text-sm text-foreground">التفعيل: {submittedAccount.activationStateLabelAr}</p>
              </div>
            </div>
          ) : null}

          <div className="accent-panel px-5 py-5 text-sm leading-7 text-muted-foreground">
            {pageContent.getText("success", "description", "ستراجع الإدارة البيانات ثم تُفعّل مسار الحساب المرتبط عند الموافقة. لن يصبح الوصول إلى لوحة الفندق متاحًا إلا بعد الاعتماد ثم تفعيل الحساب.")}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={appRoutes.landing}>
                {language === "en" ? "Back to home" : "العودة للرئيسية"}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={appRoutes.login}>
                {language === "en" ? "Go to login" : "الانتقال إلى تسجيل الدخول"}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <HotelRegistrationForm
          isSubmitting={registerMutation.isPending}
          errorMessage={registerMutation.error instanceof Error ? registerMutation.error.message : undefined}
          onSubmit={async (input) => {
            await registerMutation.mutateAsync(input);
          }}
        />
      )}
    </PublicRegistrationLayout>
  );
};

export default HotelRegistrationPage;
