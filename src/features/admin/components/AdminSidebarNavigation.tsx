import {
  ClipboardCheck,
  FilePenLine,
  LayoutDashboard,
  Network,
  PackageSearch,
  Settings2,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { cn } from "@/lib/utils";
import { appRoutes } from "@/shared/config/navigation";

const adminNavigationItems = [
  {
    to: appRoutes.adminDashboard,
    labelAr: "نظرة عامة",
    labelEn: "Overview",
    descriptionAr: "المؤشرات التشغيلية وحالة الشبكة الحالية.",
    descriptionEn: "Operational KPIs and current network status.",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: appRoutes.adminOnboarding,
    labelAr: "الاعتماد",
    labelEn: "Onboarding",
    descriptionAr: "مراجعة طلبات الفنادق والمزوّدين واعتمادها.",
    descriptionEn: "Review and approve hotel and provider requests.",
    icon: ClipboardCheck,
  },
  {
    to: appRoutes.adminOrders,
    labelAr: "الطلبات",
    labelEn: "Orders",
    descriptionAr: "جدول الطلبات الكامل مع التصفية والتفاصيل التشغيلية.",
    descriptionEn: "Full orders table with filtering and operational details.",
    icon: PackageSearch,
  },
  {
    to: appRoutes.adminMatching,
    labelAr: "المطابقة",
    labelEn: "Matching",
    descriptionAr: "نتائج المطابقة والشفافية التشغيلية لكل طلب.",
    descriptionEn: "Matching outcomes and operational transparency for each order.",
    icon: Network,
  },
  {
    to: appRoutes.adminSettings,
    labelAr: "إعدادات المنصة",
    labelEn: "Platform settings",
    descriptionAr: "الهوية العامة، التسجيل، وحالة التشغيل.",
    descriptionEn: "Brand identity, registration, and runtime visibility.",
    icon: Settings2,
  },
  {
    to: appRoutes.adminContent,
    labelAr: "إدارة النصوص",
    labelEn: "Content",
    descriptionAr: "تعديل النصوص العربية والإنجليزية للصفحات المدعومة.",
    descriptionEn: "Edit Arabic and English copy for supported pages.",
    icon: FilePenLine,
  },
] as const;

const AdminSidebarNavigation = () => {
  const { language } = usePlatformLanguage();

  return (
    <aside className="surface-card h-fit px-4 py-4 sm:px-5 xl:sticky xl:top-28">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold tracking-[0.12em] text-muted-foreground">
          {language === "en" ? "Admin navigation" : "تنقل الإدارة"}
        </p>
        <p className="px-3 text-sm leading-7 text-muted-foreground">
          {language === "en"
            ? "Move between admin pages from one clear sidebar."
            : "تنقل بين صفحات المدير من قائمة جانبية واضحة بدل الاعتماد على روابط داخلية متفرقة."}
        </p>
      </div>

      <nav className="mt-5 space-y-2">
        {adminNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group block rounded-[1.35rem] border px-4 py-4 transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/10 shadow-[0_16px_40px_-28px_rgba(30,64,175,0.45)]"
                    : "border-border/70 bg-background/70 hover:border-primary/20 hover:bg-primary/5",
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "landing-icon-badge mt-0.5 h-10 w-10 rounded-2xl transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {language === "en" ? item.labelEn : item.labelAr}
                    </p>
                    <p className="text-xs leading-6 text-muted-foreground">
                      {language === "en" ? item.descriptionEn : item.descriptionAr}
                    </p>
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebarNavigation;
