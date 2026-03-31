import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ProviderRegistrationResult } from "@/features/orders/application";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import EmptyState from "@/shared/components/feedback/EmptyState";
import OnboardingStatusBadge from "@/features/onboarding/components/OnboardingStatusBadge";
import ProviderRegistrationForm from "@/features/onboarding/components/ProviderRegistrationForm";
import PublicRegistrationLayout from "@/features/onboarding/components/PublicRegistrationLayout";
import {
  useProviderRegistrationMutation,
  useRegistrationServiceCatalog,
} from "@/features/onboarding/hooks/useOnboarding";
import { appRoutes } from "@/shared/config/navigation";
import { formatDateTimeLabel } from "@/shared/lib/formatters";

const ProviderRegistrationPage = () => {
  const { language } = usePlatformLanguage();
  const pageContent = usePlatformPageContent("onboarding_provider");
  const catalogQuery = useRegistrationServiceCatalog();
  const registerMutation = useProviderRegistrationMutation();
  const submittedRegistration = registerMutation.data as ProviderRegistrationResult | undefined;
  const submittedProvider = submittedRegistration?.provider;
  const submittedAccount = submittedRegistration?.account;
  const submittedOfferingNames = submittedProvider?.serviceOfferings
    ?.map((offering) => `${offering.productName.ar} - ${offering.serviceTypeName.ar}`)
    .join(" - ");

  return (
    <PublicRegistrationLayout
      eyebrow="تسجيل مزود خدمة"
      title={pageContent.getText("page", "title", "انضم إلى شبكة واش أوف كمزوّد معتمد")}
      description={pageContent.getText(
        "page",
        "description",
        "أدخل بيانات المنشأة والموقع والخدمات القياسية والسعة التشغيلية والمستندات النظامية ليتم تقييمها من الإدارة. لا يدخل أي مزوّد داخل الإسناد الذكي قبل الاعتماد ثم تفعيل الحساب المرتبط.",
      )}
      checklistTitle={pageContent.getText("page", "checklist_title", "لماذا يوجد اعتماد للمزوّدين؟")}
      checklistDescription={pageContent.getText(
        "page",
        "checklist_description",
        "لأن واش أوف منصة تشغيل ذكية وليست سوقًا مفتوحًا، لا يشارك في الإسناد إلا المزوّدون المعتمدون تشغيليًا.",
      )}
      checklistItems={[
        language === "en"
          ? "City coverage, service matrix, and daily capacity are reviewed."
          : "تُراجع المدينة ومصفوفة الخدمات والسعة اليومية.",
        language === "en"
          ? "Linked account access stays pending until approval and activation."
          : "يبقى الحساب المرتبط بانتظار الاعتماد ثم التفعيل.",
        language === "en"
          ? "Only approved provider offerings become eligible for automatic assignments."
          : "بعد اعتماد الأسعار والخدمات فقط يصبح المزوّد مؤهلًا لاستقبال الإسنادات التلقائية.",
      ]}
    >
      {submittedProvider ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-success">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-2xl font-bold text-foreground">
              {pageContent.getText("success", "title", "تم إرسال طلب المزوّد بنجاح")}
            </h2>
          </div>

          <div className="info-panel px-5 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-foreground">{submittedProvider.displayName.ar}</p>
              <OnboardingStatusBadge status={submittedProvider.onboarding.status} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <p className="text-sm text-muted-foreground">المدينة: {submittedProvider.address.city}</p>
              <p className="text-sm text-muted-foreground">
                السعة الأولية: {submittedProvider.currentCapacity.totalKg} كجم / يوم
              </p>
              <p className="text-sm text-muted-foreground">
                تاريخ الإرسال: {formatDateTimeLabel(submittedProvider.onboarding.submittedAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                الخدمات: {submittedOfferingNames || "تم حفظ عروض التسعير القياسية بانتظار الاعتماد."}
              </p>
            </div>
          </div>

          {submittedAccount ? (
            <div className="info-panel px-5 py-5">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                الحساب المرتبط
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="text-sm text-foreground">البريد: {submittedAccount.email}</p>
                <p className="text-sm text-foreground">الدور: {submittedAccount.roleLabelAr}</p>
                <p className="text-sm text-foreground">حالة الحساب: {submittedAccount.statusLabelAr}</p>
                <p className="text-sm text-foreground">التفعيل: {submittedAccount.activationStateLabelAr}</p>
              </div>
            </div>
          ) : null}

          <div className="accent-panel px-5 py-5 text-sm leading-7 text-muted-foreground">
            {pageContent.getText(
              "success",
              "description",
              "حتى يتم اعتماد المزوّد ثم تفعيل حسابه واعتماد أسعار الخدمات، لن يدخل في محرك المطابقة ولن يستقبل أي إسناد تشغيلي من الفنادق. ستراجع الإدارة بيانات المنشأة والموقع والمستندات وعروض الأسعار قبل فتح التشغيل.",
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={appRoutes.landing}>
                {language === "en" ? "Back to home" : "العودة إلى الرئيسية"}
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
      ) : catalogQuery.isError ? (
        <EmptyState
          title={language === "en" ? "Unable to load service catalog" : "تعذر تحميل كتالوج الخدمات"}
          description={
            catalogQuery.error instanceof Error
              ? catalogQuery.error.message
              : language === "en"
                ? "An error occurred while preparing the provider registration data."
                : "حدث خطأ أثناء تجهيز بيانات تسجيل المزوّد."
          }
          action={
            <Button onClick={() => void catalogQuery.refetch()}>
              {language === "en" ? "Retry" : "إعادة المحاولة"}
            </Button>
          }
        />
      ) : catalogQuery.isLoading || !catalogQuery.data ? (
        <div className="info-panel flex items-start gap-3 px-5 py-5 text-sm text-muted-foreground">
          <AlertTriangle className="mt-1 h-5 w-5 text-primary" />
          <p>
            {language === "en"
              ? "Preparing the standardized service catalog and provider onboarding form."
              : "جارٍ تجهيز كتالوج الخدمات القياسي ونموذج تسجيل المزوّد."}
          </p>
        </div>
      ) : (
        <ProviderRegistrationForm
          catalog={catalogQuery.data}
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

export default ProviderRegistrationPage;
