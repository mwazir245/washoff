import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Package,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminKpiCard from "@/features/admin/components/AdminKpiCard";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard";
import { usePlatformPageContent } from "@/features/content/hooks/usePlatformContent";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { useAdminOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { OnboardingStatus } from "@/features/orders/model";
import EmptyState from "@/shared/components/feedback/EmptyState";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";

const kpiIcons = [
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  XCircle,
  Clock3,
  Gauge,
  Package,
  AlertTriangle,
] as const;

const AdminDashboardPage = () => {
  const { language } = usePlatformLanguage();
  const pageContent = usePlatformPageContent("admin_dashboard");
  const dashboardQuery = useAdminDashboard();
  const onboardingQuery = useAdminOnboarding();

  const pageTitle = pageContent.getText("page", "title", "لوحة الإدارة");
  const pageSubtitle = pageContent.getText(
    "page",
    "subtitle",
    "ملخص تنفيذي سريع لصحة الشبكة التشغيلية، مع إبقاء التفاصيل الثقيلة داخل صفحات العمليات المنفصلة.",
  );
  const onboardingAlertTitle = pageContent.getText(
    "onboarding_alert",
    "title",
    "تنبيه إداري: توجد طلبات جديدة بانتظار الاعتماد",
  );
  const onboardingAlertDescription = pageContent.getText(
    "onboarding_alert",
    "description",
    "راجع طلبات الاعتماد من قائمة الإدارة الجانبية حتى لا تتأخر الجهات الجاهزة عن الدخول إلى التشغيل.",
  );

  if (dashboardQuery.isError) {
    return (
      <AdminWorkspaceLayout
        title={pageTitle}
        subtitle={language === "en" ? "Unable to load admin summary data." : "تعذر تحميل ملخص الإدارة الحالي."}
        eyebrow={language === "en" ? "Admin summary" : "ملخص الإدارة"}
      >
        <EmptyState
          title={language === "en" ? "Unable to load admin dashboard" : "تعذر تحميل لوحة الإدارة"}
          description={
            dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : language === "en"
                ? "An error occurred while loading the admin summary."
                : "حدث خطأ أثناء تحميل ملخص الإدارة."
          }
          action={<Button onClick={() => void dashboardQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </AdminWorkspaceLayout>
    );
  }

  if (dashboardQuery.isLoading || !dashboardQuery.data) {
    return (
      <AdminWorkspaceLayout
        title={pageTitle}
        subtitle={language === "en" ? "Loading admin summary and charts." : "جارٍ تحميل ملخص الإدارة والرسوم البيانية."}
        eyebrow={language === "en" ? "Admin summary" : "ملخص الإدارة"}
      >
        <div className="surface-card px-6 py-6 text-sm text-muted-foreground">
          {language === "en"
            ? "Preparing KPI summaries, trend charts, and alert cards."
            : "يتم الآن تجهيز المؤشرات العليا والرسوم والبطاقات التنبيهية."}
        </div>
      </AdminWorkspaceLayout>
    );
  }

  const { kpis, monthlyOrders, recentReassignments, statusBreakdown, topProviders } = dashboardQuery.data;

  const pendingHotelCount =
    onboardingQuery.data?.hotels.filter((item) => item.status === OnboardingStatus.PendingApproval).length ?? 0;
  const pendingProviderCount =
    onboardingQuery.data?.providers.filter((item) => item.status === OnboardingStatus.PendingApproval).length ?? 0;
  const totalPendingOnboarding = pendingHotelCount + pendingProviderCount;

  const unresolvedOrdersKpi = kpis.find((kpi) => kpi.id === "unresolved-orders");
  const reassignmentKpi = kpis.find((kpi) => kpi.id === "reassignment-rate");
  const fallbackKpi = kpis.find((kpi) => kpi.id === "fallback-success-rate");

  return (
    <AdminWorkspaceLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      eyebrow={language === "en" ? "Admin summary" : "ملخص الإدارة"}
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "The admin dashboard is now intentionally summary-only. Orders and matching review moved into dedicated operations pages."
            : "لوحة الإدارة أصبحت مخصصة للملخص التنفيذي فقط. تفاصيل الطلبات والمطابقة انتقلت إلى صفحات عمليات مستقلة من القائمة الجانبية."
        }
      />

      <section className="surface-card px-6 py-6 sm:px-8">
        <SectionHeader
          eyebrow={language === "en" ? "Operational alerts" : "تنبيهات تشغيلية"}
          title={language === "en" ? "What needs attention now?" : "ما الذي يحتاج انتباه الإدارة الآن؟"}
          description={
            language === "en"
              ? "These cards summarize the most urgent admin checks without turning the dashboard into a long operations feed."
              : "هذه البطاقات تلخص أهم ما يحتاج مراجعة فورية من الإدارة دون تحويل اللوحة إلى قائمة عمليات طويلة."
          }
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-[1.4rem] border border-warning/25 bg-warning/10 px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="landing-icon-badge h-11 w-11 rounded-2xl bg-warning/15 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-foreground">{onboardingAlertTitle}</p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {onboardingAlertDescription}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {language === "en"
                    ? `${totalPendingOnboarding} pending requests`
                    : `${totalPendingOnboarding} طلبات معلقة`}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="landing-icon-badge h-11 w-11 rounded-2xl">
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-foreground">
                  {language === "en" ? "Unresolved orders" : "الطلبات غير المحسومة"}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {unresolvedOrdersKpi?.description ??
                    (language === "en"
                      ? "Orders still waiting for capacity or a viable provider path."
                      : "طلبات ما زالت بانتظار سعة أو مسار إسناد قابل للتنفيذ.")}
                </p>
                <p className="text-sm font-semibold text-foreground">{unresolvedOrdersKpi?.value ?? "0"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="landing-icon-badge h-11 w-11 rounded-2xl">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-foreground">
                  {language === "en" ? "Reassignment pressure" : "ضغط إعادة الإسناد"}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {reassignmentKpi?.description ??
                    (language === "en"
                      ? "Tracks how often the platform needed to redirect an order."
                      : "يراقب عدد المرات التي احتاجت فيها المنصة إلى تحويل الطلب لمزوّد بديل.")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {reassignmentKpi?.value ?? "0"} •{" "}
                  {language === "en"
                    ? `${recentReassignments.length} recent events`
                    : `${recentReassignments.length} أحداث حديثة`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {kpis.map((kpi, index) => {
          const Icon = kpiIcons[index] ?? Gauge;

          return (
            <AdminKpiCard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              tone={kpi.tone}
              icon={<Icon className="h-5 w-5" />}
            />
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Demand trend" : "اتجاهات الطلب"}
            title={language === "en" ? "Monthly order volume" : "الحجم الشهري للطلبات"}
            description={
              language === "en"
                ? "Executive trend view for overall order flow."
                : "عرض تنفيذي سريع لاتجاه الطلب العام عبر الشهور."
            }
            className="mb-6"
          />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 26% 90%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(218 14% 43%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(218 14% 43%)", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="hsl(221 83% 53%)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Status mix" : "توزيع الحالات"}
            title={language === "en" ? "Current operational distribution" : "التوزيع التشغيلي الحالي"}
            description={
              language === "en"
                ? "Snapshot of how the network is currently spread across statuses."
                : "لقطة سريعة لتوزيع الطلبات على الحالات التشغيلية الحالية."
            }
            className="mb-6"
          />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
              >
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 grid gap-2">
            {statusBreakdown.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                  <span className="text-foreground">{entry.name}</span>
                </div>
                <span className="font-semibold text-muted-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Provider overview" : "نظرة على المزوّدين"}
            title={language === "en" ? "Top provider performance" : "أفضل أداء للمزوّدين"}
            description={
              language === "en"
                ? "A chart view instead of a long ranked list."
                : "عرض بياني مختصر بدل قائمة ترتيب طويلة داخل لوحة الإدارة."
            }
            className="mb-6"
          />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topProviders.slice(0, 6)} layout="vertical" margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 26% 90%)" />
              <XAxis type="number" tick={{ fill: "hsl(218 14% 43%)", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: "hsl(218 14% 43%)", fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(142 71% 45%)" radius={[10, 10, 10, 10]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Executive notes" : "مؤشرات مختصرة"}
            title={language === "en" ? "Read this before moving into operations" : "ملخص سريع قبل الدخول إلى صفحات العمليات"}
            description={
              language === "en"
                ? "Use these summaries to decide whether you need orders, matching, or onboarding review."
                : "استخدم هذا الملخص لتحديد ما إذا كنت بحاجة للانتقال إلى الطلبات أو المطابقة أو الاعتماد."
            }
          />

          <div className="mt-5 space-y-4">
            <div className="info-panel px-4 py-4">
              <p className="text-sm font-semibold text-foreground">
                {language === "en" ? "Onboarding review" : "مراجعة الاعتماد"}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {language === "en"
                  ? `${pendingHotelCount} hotel requests and ${pendingProviderCount} provider requests are waiting for review.`
                  : `هناك ${pendingHotelCount} طلبات فنادق و${pendingProviderCount} طلبات مزوّدين بانتظار المراجعة.`}
              </p>
            </div>

            <div className="info-panel px-4 py-4">
              <p className="text-sm font-semibold text-foreground">
                {language === "en" ? "Fallback effectiveness" : "فعالية المزوّد البديل"}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {fallbackKpi?.description ??
                  (language === "en"
                    ? "Shows how often reassignment still ended with a viable provider."
                    : "يوضح عدد المرات التي انتهت فيها إعادة الإسناد إلى مزوّد بديل ناجح.")}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{fallbackKpi?.value ?? "0"}</p>
            </div>

            <div className="info-panel px-4 py-4">
              <p className="text-sm font-semibold text-foreground">
                {language === "en" ? "Next step" : "الخطوة التالية"}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {language === "en"
                  ? "Use the admin sidebar to open the orders table for operational follow-up, or the matching page for transparency review."
                  : "استخدم القائمة الجانبية الإدارية لفتح جدول الطلبات للمتابعة التشغيلية، أو صفحة المطابقة لمراجعة الشفافية التفصيلية."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </AdminWorkspaceLayout>
  );
};

export default AdminDashboardPage;
