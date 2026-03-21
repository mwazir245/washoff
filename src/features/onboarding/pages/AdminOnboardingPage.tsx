import { useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock3, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import AdminOnboardingQueue from "@/features/onboarding/components/AdminOnboardingQueue";
import {
  useAdminIdentityData,
  useAdminOnboarding,
  useApproveHotelRegistrationMutation,
  useApproveProviderRegistrationMutation,
  useReactivateAccountMutation,
  useRejectHotelRegistrationMutation,
  useRejectProviderRegistrationMutation,
  useResendActivationMutation,
  useSuspendAccountMutation,
} from "@/features/onboarding/hooks/useOnboarding";
import { OnboardingStatus } from "@/features/orders/model";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import MetricCard from "@/shared/components/metrics/MetricCard";
import { toast } from "@/hooks/use-toast";

const metricIcons = [Clock3, Factory, Building2, CheckCircle2] as const;
type ApprovalActionResult = {
  account?: {
    activationPath?: string;
  };
  delivery?: {
    status?: string;
    statusLabelAr?: string;
    providerLabelAr?: string;
    failureReasonAr?: string;
    outboxFilePath?: string;
  };
};

const formatArabicDateTime = (value?: string) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ar-SA");
};

const AdminOnboardingPage = () => {
  const { language } = usePlatformLanguage();
  const pageContent = usePlatformPageContent("admin_onboarding");
  const onboardingQuery = useAdminOnboarding();
  const approveHotelMutation = useApproveHotelRegistrationMutation();
  const rejectHotelMutation = useRejectHotelRegistrationMutation();
  const approveProviderMutation = useApproveProviderRegistrationMutation();
  const rejectProviderMutation = useRejectProviderRegistrationMutation();
  const identityQuery = useAdminIdentityData();
  const suspendAccountMutation = useSuspendAccountMutation();
  const reactivateAccountMutation = useReactivateAccountMutation();
  const resendActivationMutation = useResendActivationMutation();
  const [activeActionKey, setActiveActionKey] = useState<string | undefined>();
  const pageTitle = pageContent.getText("page", "title", "إدارة الاعتماد");
  const pageSubtitle = pageContent.getText(
    "page",
    "subtitle",
    "راجع طلبات انضمام الفنادق والمزوّدين، ثم فعّل الجهات المعتمدة فقط داخل تشغيل WashOff.",
  );
  const policyTitle = pageContent.getText("policy", "title", "اعتماد مركزي قبل التفعيل التشغيلي");
  const policyDescription = pageContent.getText(
    "policy",
    "description",
    "تبقى طلبات التسجيل الجديدة بحالة بانتظار الاعتماد. بعد الموافقة فقط يصبح الفندق قادرًا على إرسال الطلبات، ويصبح المزوّد مؤهلًا للدخول في محرك الإسناد الذكي.",
  );

  const metrics = useMemo(() => {
    if (!onboardingQuery.data) {
      return [];
    }

    const { hotels, providers } = onboardingQuery.data;

    return [
      {
        title: "فنادق بانتظار الاعتماد",
        value: hotels.filter((item) => item.status === OnboardingStatus.PendingApproval).length,
      },
      {
        title: "مزودون بانتظار الاعتماد",
        value: providers.filter((item) => item.status === OnboardingStatus.PendingApproval).length,
      },
      {
        title: "إجمالي طلبات الفنادق",
        value: hotels.length,
      },
      {
        title: "إجمالي طلبات المزودين",
        value: providers.length,
      },
    ];
  }, [onboardingQuery.data]);

  const handleAction = async (
    actionKey: string,
    action: () => Promise<ApprovalActionResult>,
    successTitle: string,
    successDescription: string,
  ) => {
    try {
      setActiveActionKey(actionKey);
      const result = await action();
      const activationPath = result.account?.activationPath;
      const delivery = result.delivery;

      if (delivery?.statusLabelAr) {
        const deliveryDescription =
          delivery.status === "sent"
            ? `${successDescription} حالة الإرسال: ${delivery.statusLabelAr} عبر ${delivery.providerLabelAr ?? "قناة البريد"}.`
            : `${successDescription} لكن تعذر إرسال الرسالة${delivery.failureReasonAr ? `: ${delivery.failureReasonAr}` : "."}`;

        toast({
          title: successTitle,
          description:
            delivery.outboxFilePath && delivery.status === "sent"
              ? `${deliveryDescription} تم حفظ الرسالة في: ${delivery.outboxFilePath}`
              : deliveryDescription,
        });
        return;
      }

      if (activationPath && typeof window !== "undefined") {
        const activationUrl = new URL(activationPath, window.location.origin).toString();

        try {
          await navigator.clipboard.writeText(activationUrl);
          toast({
            title: successTitle,
            description: `${successDescription} تم نسخ رابط التفعيل المرتبط بالحساب إلى الحافظة.`,
          });
          return;
        } catch {
          toast({
            title: successTitle,
            description: `${successDescription} رابط التفعيل: ${activationUrl}`,
          });
          return;
        }
      }

      toast({
        title: successTitle,
        description: successDescription,
      });
    } catch (error) {
      toast({
        title: "تعذر تحديث حالة الاعتماد",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الطلب.",
        variant: "destructive",
      });
    } finally {
      setActiveActionKey(undefined);
    }
  };

  const handleAccountAction = async (
    actionKey: string,
    action: () => Promise<{ email: string; statusLabelAr: string }>,
    successTitle: string,
  ) => {
    try {
      setActiveActionKey(actionKey);
      const result = await action();
      toast({
        title: successTitle,
        description: `الحساب ${result.email} أصبح الآن بحالة: ${result.statusLabelAr}.`,
      });
    } catch (error) {
      toast({
        title: "تعذر تحديث حالة الحساب",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الحساب.",
        variant: "destructive",
      });
    } finally {
      setActiveActionKey(undefined);
    }
  };

  if (onboardingQuery.isError) {
    return (
      <AdminWorkspaceLayout title={pageTitle} subtitle={language === "en" ? "Unable to load onboarding requests and review states." : "تعذر تحميل طلبات التسجيل وحالات المراجعة."} eyebrow={language === "en" ? "Onboarding management" : "اعتماد الجهات"}>
        <EmptyState
          title={language === "en" ? "Unable to load onboarding management" : "تعذر تحميل إدارة الاعتماد"}
          description={
            onboardingQuery.error instanceof Error
              ? onboardingQuery.error.message
              : language === "en"
                ? "An error occurred while loading onboarding requests."
                : "حدث خطأ أثناء جلب طلبات الانضمام."
          }
          action={<Button onClick={() => void onboardingQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </AdminWorkspaceLayout>
    );
  }

  if (onboardingQuery.isLoading || !onboardingQuery.data) {
    return (
      <AdminWorkspaceLayout title={pageTitle} subtitle={language === "en" ? "Loading hotel and provider onboarding requests." : "جارٍ تحميل طلبات التسجيل للفنادق والمزوّدين."} eyebrow={language === "en" ? "Onboarding management" : "اعتماد الجهات"}>
        <div className="surface-card px-6 py-6 text-sm text-muted-foreground">
          {language === "en"
            ? "Preparing onboarding queues and current admin review decisions."
            : "يتم تجهيز قوائم الاعتماد الحالية وربطها بقرارات الإدارة."}
        </div>
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      eyebrow={language === "en" ? "Onboarding management" : "اعتماد الجهات"}
    >
      <PreviewModeNotice description="لا يشارك أي فندق أو مزوّد جديد في التشغيل قبل اعتماد الإدارة. هذه الشاشة تضبط بوابة الدخول إلى الشبكة التشغيلية دون تغيير منطق الإسناد أو المطابقة الحالي." />

      <section className="metric-grid">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[index] ?? Building2;

          return (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={<Icon className="h-6 w-6" />}
            />
          );
        })}
      </section>

      <section className="surface-card px-6 py-6 sm:px-8">
        <SectionHeader
          eyebrow="سياسة الاعتماد"
          title={policyTitle}
          description={policyDescription}
        />
      </section>

      <section className="space-y-10">
        <AdminOnboardingQueue
          title="طلبات تسجيل الفنادق"
          description="تحكم في تفعيل الجهات الفندقية الجديدة قبل منحها الوصول إلى لوحة الفندق وعمليات الطلبات."
          entityType="hotel"
          entities={onboardingQuery.data.hotels}
          activeActionKey={activeActionKey}
          onApprove={(entityId, reviewNotesAr) =>
            handleAction(
              `hotel:${entityId}:approve`,
              () => approveHotelMutation.mutateAsync({ entityId, reviewNotesAr }),
              "تم اعتماد الفندق",
              "أصبح الفندق مؤهلًا لاستخدام لوحة الفندق وتشغيل الطلبات.",
            )
          }
          onReject={(entityId, reviewNotesAr) =>
            handleAction(
              `hotel:${entityId}:reject`,
              () => rejectHotelMutation.mutateAsync({ entityId, reviewNotesAr }),
              "تم رفض الطلب",
              "بقي الفندق خارج الوصول التشغيلي حتى يتم تقديم طلب جديد أو تحديث البيانات.",
            )
          }
        />

        <AdminOnboardingQueue
          title="طلبات تسجيل المزوّدين"
          description="اعتمد فقط المزوّدين الذين يستوفون التغطية والخدمات والسعة المطلوبة قبل إدخالهم في المطابقة."
          entityType="provider"
          entities={onboardingQuery.data.providers}
          activeActionKey={activeActionKey}
          onApprove={(entityId, reviewNotesAr) =>
            handleAction(
              `provider:${entityId}:approve`,
              () => approveProviderMutation.mutateAsync({ entityId, reviewNotesAr }),
              "تم اعتماد المزوّد",
              "أصبح المزوّد مؤهلًا للظهور داخل الإسناد الذكي واستقبال الطلبات.",
            )
          }
          onReject={(entityId, reviewNotesAr) =>
            handleAction(
              `provider:${entityId}:reject`,
              () => rejectProviderMutation.mutateAsync({ entityId, reviewNotesAr }),
              "تم رفض طلب المزوّد",
              "لن يدخل المزوّد في المطابقة حتى تتم الموافقة عليه لاحقًا.",
            )
          }
        />
      </section>

      <section className="space-y-6">
        <div className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow="إدارة الهوية"
            title="الحسابات المرتبطة والعمليات الأمنية"
            description="راجع حالة الحسابات، أوقف الحسابات عند الحاجة، وتابع سجل الأحداث الأمنية الأساسية دون المساس بمنطق التشغيل."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-card overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5">
              <h3 className="text-lg font-bold text-foreground">الحسابات</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                يتم السماح بالوصول التشغيلي فقط للحسابات النشطة المرتبطة بجهات معتمدة.
              </p>
            </div>

            {identityQuery.isLoading || !identityQuery.data ? (
              <div className="px-6 py-6 text-sm text-muted-foreground">جارٍ تحميل بيانات الحسابات...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/35 text-right text-muted-foreground">
                      <th className="px-6 py-4 font-medium">الحساب</th>
                      <th className="px-4 py-4 font-medium">الدور</th>
                      <th className="px-4 py-4 font-medium">الحالة</th>
                      <th className="px-4 py-4 font-medium">التفعيل</th>
                      <th className="px-4 py-4 font-medium">إرسال التفعيل</th>
                      <th className="px-4 py-4 font-medium">إرسال إعادة الضبط</th>
                      <th className="px-4 py-4 font-medium">آخر عملية</th>
                      <th className="px-6 py-4 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {identityQuery.data.accounts.map((account) => {
                      const actionKeyBase = `account:${account.id}`;
                      const isSuspended = account.status === "suspended";

                      return (
                        <tr key={account.id} className="border-b border-border/60 last:border-b-0">
                          <td className="px-6 py-4 align-top">
                            <div className="font-semibold text-foreground">{account.fullName}</div>
                            <div className="mt-1 text-muted-foreground">{account.email}</div>
                          </td>
                          <td className="px-4 py-4 align-top text-foreground">{account.roleLabelAr}</td>
                          <td className="px-4 py-4 align-top">
                            <span className="inline-flex rounded-full border border-border/80 bg-white px-3 py-1 text-xs font-semibold text-foreground">
                              {account.statusLabelAr}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top text-muted-foreground">
                            {account.activationStateLabelAr}
                          </td>
                          <td className="px-4 py-4 align-top text-xs leading-6 text-muted-foreground">
                            {account.activationDelivery ? (
                              <>
                                <div className="font-semibold text-foreground">
                                  {account.activationDelivery.statusLabelAr}
                                </div>
                                <div>{account.activationDelivery.providerLabelAr}</div>
                                {account.activationDelivery.retryCount ? (
                                  <div>إعادات المحاولة: {account.activationDelivery.retryCount}</div>
                                ) : null}
                              </>
                            ) : (
                              "لا توجد محاولة إرسال"
                            )}
                          </td>
                          <td className="px-4 py-4 align-top text-xs leading-6 text-muted-foreground">
                            {account.passwordResetDelivery ? (
                              <>
                                <div className="font-semibold text-foreground">
                                  {account.passwordResetDelivery.statusLabelAr}
                                </div>
                                <div>{account.passwordResetDelivery.providerLabelAr}</div>
                                {account.passwordResetDelivery.retryCount ? (
                                  <div>إعادات المحاولة: {account.passwordResetDelivery.retryCount}</div>
                                ) : null}
                              </>
                            ) : (
                              "لا توجد محاولة إرسال"
                            )}
                          </td>
                          <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                            {formatArabicDateTime(account.lastIdentityOperationAt)}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              {!isSuspended && account.activationState !== "activated" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={activeActionKey === `${actionKeyBase}:resend-activation`}
                                  onClick={() =>
                                    void handleAction(
                                      `${actionKeyBase}:resend-activation`,
                                      () =>
                                        resendActivationMutation.mutateAsync({
                                          accountId: account.id,
                                        }),
                                      "تمت إعادة إرسال التفعيل",
                                      `تم تحديث دورة التفعيل للحساب ${account.email}.`,
                                    )
                                  }
                                >
                                  إعادة إرسال التفعيل
                                </Button>
                              ) : null}

                              {isSuspended ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={activeActionKey === `${actionKeyBase}:reactivate`}
                                  onClick={() =>
                                    void handleAccountAction(
                                      `${actionKeyBase}:reactivate`,
                                      () =>
                                        reactivateAccountMutation.mutateAsync({
                                          accountId: account.id,
                                        }),
                                      "تمت إعادة تنشيط الحساب",
                                    )
                                  }
                                >
                                  إعادة تنشيط
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={activeActionKey === `${actionKeyBase}:suspend`}
                                  onClick={() =>
                                    void handleAccountAction(
                                      `${actionKeyBase}:suspend`,
                                      () =>
                                        suspendAccountMutation.mutateAsync({
                                          accountId: account.id,
                                        }),
                                      "تم إيقاف الحساب",
                                    )
                                  }
                                >
                                  إيقاف الحساب
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="surface-card">
            <div className="border-b border-border/70 px-6 py-5">
              <h3 className="text-lg font-bold text-foreground">السجل الأمني</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                آخر الأحداث المرتبطة بالتفعيل وتسجيل الدخول وإعادة الضبط وتعليق الحسابات.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              {identityQuery.isLoading || !identityQuery.data ? (
                <p className="text-sm text-muted-foreground">جارٍ تحميل السجل الأمني...</p>
              ) : identityQuery.data.auditEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد أحداث أمنية مسجلة حتى الآن.</p>
              ) : (
                identityQuery.data.auditEvents.map((event) => (
                  <div key={event.id} className="rounded-[1rem] border border-border/70 bg-muted/20 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">{event.typeLabelAr}</span>
                      <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString("ar-SA")}</span>
                    </div>
                    {event.detailsAr ? (
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{event.detailsAr}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </AdminWorkspaceLayout>
  );
};

export default AdminOnboardingPage;
