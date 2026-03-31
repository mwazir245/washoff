import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Cog, Mail, Save, ServerCog, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import {
  usePlatformRuntimeStatus,
  usePlatformSettings,
  usePlatformSettingsAudit,
  useUpdatePlatformSettingsMutation,
} from "@/features/platform-settings/hooks/usePlatformSettings";
import type { PlatformSettings } from "@/features/platform-settings/model/platform-settings";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import EmptyState from "@/shared/components/feedback/EmptyState";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import { toast } from "@/hooks/use-toast";

const formatBooleanLabel = (value: boolean, language: "ar" | "en") =>
  language === "en" ? (value ? "Enabled" : "Disabled") : value ? "مفعّل" : "متوقف";

const formatDateTime = (value?: string, language: "ar" | "en" = "ar") => {
  if (!value) {
    return language === "en" ? "Not available" : "غير متاح";
  }

  return new Date(value).toLocaleString(language === "en" ? "en-US" : "ar-SA");
};

const buildEditableState = (settings: PlatformSettings) => ({
  siteNameAr: settings.siteNameAr,
  siteNameEn: settings.siteNameEn,
  siteTaglineAr: settings.siteTaglineAr,
  siteTaglineEn: settings.siteTaglineEn,
  sellerLegalNameAr: settings.sellerLegalNameAr,
  sellerVatNumber: settings.sellerVatNumber,
  sellerAddressAr: settings.sellerAddressAr,
  sellerCityAr: settings.sellerCityAr,
  mailFromNameAr: settings.mailFromNameAr,
  mailFromEmail: settings.mailFromEmail,
  supportEmail: settings.supportEmail ?? "",
  supportPhone: settings.supportPhone ?? "",
  registrationEnabled: settings.registrationEnabled,
  hotelRegistrationEnabled: settings.hotelRegistrationEnabled,
  providerRegistrationEnabled: settings.providerRegistrationEnabled,
  requireAdminApprovalForHotels: settings.requireAdminApprovalForHotels,
  requireAdminApprovalForProviders: settings.requireAdminApprovalForProviders,
});

const AdminSettingsPage = () => {
  const { language } = usePlatformLanguage();
  const pageContent = usePlatformPageContent("admin_settings");
  const settingsQuery = usePlatformSettings();
  const runtimeQuery = usePlatformRuntimeStatus();
  const auditQuery = usePlatformSettingsAudit();
  const updateSettingsMutation = useUpdatePlatformSettingsMutation();
  const [formState, setFormState] = useState<ReturnType<typeof buildEditableState> | null>(null);
  const [notesAr, setNotesAr] = useState("");

  useEffect(() => {
    if (settingsQuery.data) {
      setFormState(buildEditableState(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  const title = pageContent.getText("page", "title", "إعدادات المنصة");
  const subtitle = pageContent.getText(
    "page",
    "subtitle",
    "تحكم في الإعدادات التشغيلية الآمنة، راقب حالة البيئة الحالية، واحتفظ بسجل واضح للتعديلات الإدارية.",
  );

  const runtimeCards = useMemo(() => {
    if (!runtimeQuery.data) {
      return [];
    }

    return [
      {
        labelAr: "البيئة",
        labelEn: "Environment",
        value: runtimeQuery.data.environment,
      },
      {
        labelAr: "قاعدة البيانات",
        labelEn: "Database target",
        value: runtimeQuery.data.databaseTargetLabel,
      },
      {
        labelAr: "وضع البريد",
        labelEn: "Mail mode",
        value: runtimeQuery.data.mailMode,
      },
      {
        labelAr: "العامل",
        labelEn: "Worker mode",
        value: formatBooleanLabel(runtimeQuery.data.workerEnabled, language),
      },
      {
        labelAr: "الفحص اللحظي",
        labelEn: "Request-time sweep",
        value: formatBooleanLabel(runtimeQuery.data.requestTimeSweepEnabled, language),
      },
      {
        labelAr: "وضع التخزين",
        labelEn: "Persistence mode",
        value: runtimeQuery.data.persistenceMode,
      },
    ];
  }, [language, runtimeQuery.data]);

  const handleSave = async () => {
    if (!formState) {
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        ...formState,
        supportEmail: formState.supportEmail.trim() || undefined,
        supportPhone: formState.supportPhone.trim() || undefined,
        notesAr: notesAr.trim() || "تم تحديث إعدادات المنصة من صفحة الإعدادات.",
      });
      setNotesAr("");
      toast({
        title: language === "en" ? "Settings updated" : "تم تحديث الإعدادات",
        description:
          language === "en"
            ? "The safe platform settings were saved successfully."
            : "تم حفظ الإعدادات التشغيلية الآمنة بنجاح.",
      });
    } catch (error) {
      toast({
        title: language === "en" ? "Unable to save settings" : "تعذر حفظ الإعدادات",
        description:
          error instanceof Error
            ? error.message
            : language === "en"
              ? "An unexpected error occurred."
              : "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
  };

  if (settingsQuery.isError) {
    return (
      <AdminWorkspaceLayout title={title} subtitle={subtitle} eyebrow={language === "en" ? "Admin settings" : "إعدادات الإدارة"}>
        <EmptyState
          title={language === "en" ? "Unable to load settings" : "تعذر تحميل الإعدادات"}
          description={
            settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : language === "en"
                ? "The platform settings could not be loaded."
                : "تعذر تحميل إعدادات المنصة الحالية."
          }
          action={<Button onClick={() => void settingsQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </AdminWorkspaceLayout>
    );
  }

  if (settingsQuery.isLoading || !settingsQuery.data || !formState) {
    return (
      <AdminWorkspaceLayout title={title} subtitle={subtitle} eyebrow={language === "en" ? "Admin settings" : "إعدادات الإدارة"}>
        <div className="surface-card px-6 py-6 text-sm text-muted-foreground">
          {language === "en"
            ? "Preparing platform settings, runtime visibility, and audit details."
            : "جارٍ تجهيز إعدادات المنصة، حالة التشغيل الحالية، وسجل التعديلات."}
        </div>
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={title}
      subtitle={subtitle}
      eyebrow={language === "en" ? "Admin settings" : "إعدادات الإدارة"}
      actions={
        <Button onClick={() => void handleSave()} disabled={updateSettingsMutation.isPending}>
          <Save className="h-4 w-4" />
          {updateSettingsMutation.isPending
            ? language === "en"
              ? "Saving..."
              : "جارٍ الحفظ..."
            : language === "en"
              ? "Save settings"
              : "حفظ الإعدادات"}
        </Button>
      }
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "Only safe admin-managed settings are editable here. Secrets such as database and SMTP credentials remain in environment configuration."
            : "الواجهة هنا تدير الإعدادات الآمنة فقط. أسرار البنية التحتية مثل قاعدة البيانات وكلمات مرور SMTP تبقى داخل ملفات البيئة."
        }
      />

      <section className="grid gap-5 lg:grid-cols-3">
        {runtimeCards.map((card) => (
          <div key={`${card.labelAr}-${card.value}`} className="surface-card px-5 py-5">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              {language === "en" ? card.labelEn : card.labelAr}
            </p>
            <p className="mt-2 text-lg font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-2xl bg-muted/50 p-2">
          <TabsTrigger value="general">{language === "en" ? "General" : "عام"}</TabsTrigger>
          <TabsTrigger value="mail">{language === "en" ? "Mail" : "البريد"}</TabsTrigger>
          <TabsTrigger value="registration">{language === "en" ? "Registration" : "الاعتماد"}</TabsTrigger>
          <TabsTrigger value="runtime">{language === "en" ? "Runtime" : "التشغيل"}</TabsTrigger>
          <TabsTrigger value="audit">{language === "en" ? "Audit" : "السجل"}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "General settings" : "الإعدادات العامة"}
            title={language === "en" ? "Platform identity" : "هوية المنصة"}
            description={
              language === "en"
                ? "These fields define the visible brand and support identity shown across supported pages."
                : "هذه الحقول تضبط هوية المنصة الظاهرة وبيانات الدعم الأساسية التي تُستخدم في الصفحات المدعومة."
            }
            className="mb-6"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteNameAr">اسم المنصة بالعربية</Label>
              <Input
                id="siteNameAr"
                value={formState.siteNameAr}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, siteNameAr: event.target.value } : current))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteNameEn">Platform name in English</Label>
              <Input
                id="siteNameEn"
                value={formState.siteNameEn}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, siteNameEn: event.target.value } : current))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTaglineAr">الشعار الفرعي بالعربية</Label>
              <Input
                id="siteTaglineAr"
                value={formState.siteTaglineAr}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, siteTaglineAr: event.target.value } : current))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTaglineEn">English tagline</Label>
              <Input
                id="siteTaglineEn"
                value={formState.siteTaglineEn}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, siteTaglineEn: event.target.value } : current))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerLegalNameAr">
                {language === "en" ? "Seller legal name (Arabic)" : "الاسم النظامي للبائع"}
              </Label>
              <Input
                id="sellerLegalNameAr"
                value={formState.sellerLegalNameAr}
                onChange={(event) =>
                  setFormState((current) =>
                    current ? { ...current, sellerLegalNameAr: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerVatNumber">
                {language === "en" ? "Seller VAT number" : "الرقم الضريبي للمنصة"}
              </Label>
              <Input
                id="sellerVatNumber"
                value={formState.sellerVatNumber}
                onChange={(event) =>
                  setFormState((current) =>
                    current ? { ...current, sellerVatNumber: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerAddressAr">
                {language === "en" ? "Seller address (Arabic)" : "عنوان البائع"}
              </Label>
              <Textarea
                id="sellerAddressAr"
                value={formState.sellerAddressAr}
                onChange={(event) =>
                  setFormState((current) =>
                    current ? { ...current, sellerAddressAr: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerCityAr">
                {language === "en" ? "Seller city (Arabic)" : "مدينة البائع"}
              </Label>
              <Input
                id="sellerCityAr"
                value={formState.sellerCityAr}
                onChange={(event) =>
                  setFormState((current) =>
                    current ? { ...current, sellerCityAr: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">{language === "en" ? "Support email" : "بريد الدعم"}</Label>
              <Input
                id="supportEmail"
                type="email"
                value={formState.supportEmail}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, supportEmail: event.target.value } : current))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportPhone">{language === "en" ? "Support phone" : "هاتف الدعم"}</Label>
              <Input
                id="supportPhone"
                value={formState.supportPhone}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, supportPhone: event.target.value } : current))
                }
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mail" className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Mail identity" : "هوية البريد"}
            title={language === "en" ? "Visible sender settings" : "إعدادات المرسل الظاهرة"}
            description={
              language === "en"
                ? "Mail sender identity can be adjusted here, while SMTP credentials stay in environment variables."
                : "يمكن تعديل هوية المرسل الظاهرة من هنا، بينما تبقى بيانات SMTP السرية داخل ملفات البيئة."
            }
            className="mb-6"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mailFromNameAr">{language === "en" ? "Sender name (Arabic)" : "اسم المرسل بالعربية"}</Label>
              <Input
                id="mailFromNameAr"
                value={formState.mailFromNameAr}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, mailFromNameAr: event.target.value } : current))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailFromEmail">{language === "en" ? "Sender email" : "البريد الظاهر للمرسل"}</Label>
              <Input
                id="mailFromEmail"
                type="email"
                value={formState.mailFromEmail}
                onChange={(event) =>
                  setFormState((current) => (current ? { ...current, mailFromEmail: event.target.value } : current))
                }
              />
            </div>
          </div>

          <div className="info-panel mt-6 flex items-start gap-3 px-5 py-5 text-sm text-muted-foreground">
            <Mail className="mt-1 h-5 w-5 text-primary" />
            <p>
              {language === "en"
                ? "SMTP host, username, password, and other secrets are intentionally read-only here and remain managed by environment configuration."
                : "مضيف SMTP واسم المستخدم وكلمة المرور وأي أسرار تشغيلية تبقى للتهيئة البيئية فقط، ولا يتم تعديلها من هذه الشاشة."}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="registration" className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Registration policy" : "سياسة التسجيل"}
            title={language === "en" ? "Control onboarding access" : "تحكم في انضمام الجهات"}
            description={
              language === "en"
                ? "These safe toggles control whether registration is visible and whether approval remains mandatory."
                : "هذه المفاتيح الآمنة تضبط ظهور التسجيل واستمرار الاعتماد الإلزامي للفنادق والمزوّدين."
            }
            className="mb-6"
          />

          <div className="grid gap-4">
            {[
              {
                key: "registrationEnabled" as const,
                labelAr: "تفعيل التسجيل العام",
                labelEn: "Enable public registration",
              },
              {
                key: "hotelRegistrationEnabled" as const,
                labelAr: "فتح تسجيل الفنادق",
                labelEn: "Enable hotel registration",
              },
              {
                key: "providerRegistrationEnabled" as const,
                labelAr: "فتح تسجيل المزوّدين",
                labelEn: "Enable provider registration",
              },
              {
                key: "requireAdminApprovalForHotels" as const,
                labelAr: "إلزام اعتماد الفنادق",
                labelEn: "Require hotel approval",
              },
              {
                key: "requireAdminApprovalForProviders" as const,
                labelAr: "إلزام اعتماد المزوّدين",
                labelEn: "Require provider approval",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-4">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {language === "en" ? item.labelEn : item.labelAr}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatBooleanLabel(formState[item.key], language)}
                  </p>
                </div>
                <Switch
                  checked={formState[item.key]}
                  onCheckedChange={(checked) =>
                    setFormState((current) => (current ? { ...current, [item.key]: checked } : current))
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="settingsNotes">{language === "en" ? "Audit note (Arabic)" : "ملاحظة للسجل"}</Label>
            <Textarea
              id="settingsNotes"
              value={notesAr}
              onChange={(event) => setNotesAr(event.target.value)}
              placeholder={
                language === "en"
                  ? "Optional note saved in the admin audit log."
                  : "ملاحظة اختيارية تُحفظ في سجل الإعدادات."
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="runtime" className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Runtime visibility" : "حالة التشغيل"}
            title={language === "en" ? "Current environment snapshot" : "لقطة من البيئة الحالية"}
            description={
              language === "en"
                ? "This section is read-only and reflects the active environment and runtime behavior."
                : "هذا القسم للعرض فقط، ويعكس البيئة الفعلية الحالية وسلوك التشغيل النشط."
            }
            className="mb-6"
          />

          {runtimeQuery.isLoading || !runtimeQuery.data ? (
            <div className="text-sm text-muted-foreground">
              {language === "en" ? "Loading runtime status..." : "جارٍ تحميل حالة التشغيل..."}
            </div>
          ) : runtimeQuery.isError ? (
            <EmptyState
              title={language === "en" ? "Unable to load runtime status" : "تعذر تحميل حالة التشغيل"}
              description={
                runtimeQuery.error instanceof Error
                  ? runtimeQuery.error.message
                  : language === "en"
                    ? "Runtime information is unavailable."
                    : "معلومات التشغيل غير متاحة حاليًا."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: <ServerCog className="h-5 w-5" />,
                  labelAr: "رابط المنصة العام",
                  labelEn: "Public app URL",
                  value: runtimeQuery.data.publicAppUrl,
                },
                {
                  icon: <Cog className="h-5 w-5" />,
                  labelAr: "منفذ الخادم",
                  labelEn: "Server port",
                  value: runtimeQuery.data.serverPort ? String(runtimeQuery.data.serverPort) : "—",
                },
                {
                  icon: <ShieldCheck className="h-5 w-5" />,
                  labelAr: "وضع المصادقة",
                  labelEn: "Auth mode",
                  value: runtimeQuery.data.authMode,
                },
                {
                  icon: <AlertTriangle className="h-5 w-5" />,
                  labelAr: "فاصل العامل",
                  labelEn: "Worker interval",
                  value: `${runtimeQuery.data.workerPollIntervalMs} ms`,
                },
              ].map((item) => (
                <div key={item.labelAr} className="info-panel px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="landing-icon-badge h-10 w-10 rounded-xl">{item.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {language === "en" ? item.labelEn : item.labelAr}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Admin audit" : "سجل التعديلات"}
            title={language === "en" ? "Latest settings changes" : "أحدث تغييرات الإعدادات"}
            description={
              language === "en"
                ? "Each platform settings change is recorded with the actor and timestamp."
                : "كل تعديل على إعدادات المنصة يُسجل مع الفاعل والتوقيت لسهولة المراجعة لاحقًا."
            }
            className="mb-6"
          />

          {auditQuery.isLoading || !auditQuery.data ? (
            <div className="text-sm text-muted-foreground">
              {language === "en" ? "Loading audit records..." : "جارٍ تحميل سجل الإعدادات..."}
            </div>
          ) : auditQuery.data.length === 0 ? (
            <EmptyState
              title={language === "en" ? "No settings changes yet" : "لا توجد تعديلات مسجلة بعد"}
              description={
                language === "en"
                  ? "The audit table will appear here after the first saved update."
                  : "سيظهر سجل التعديلات هنا بعد أول عملية حفظ على الإعدادات."
              }
            />
          ) : (
            <div className="space-y-4">
              {auditQuery.data.slice(0, 12).map((entry) => (
                <div key={entry.id} className="rounded-[1.2rem] border border-border/70 bg-muted/15 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{entry.settingsKey}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.changedAt, language)}</p>
                  </div>
                  {entry.notesAr ? (
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{entry.notesAr}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminWorkspaceLayout>
  );
};

export default AdminSettingsPage;
