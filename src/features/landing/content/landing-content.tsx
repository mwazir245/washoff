import type { ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Factory,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { appRoutes } from "@/shared/config/navigation";

export interface LandingNavItem {
  label: string;
  href: string;
}

export interface LandingPoint {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface LandingStep {
  number: string;
  title: string;
  description: string;
}

export interface LandingBenefitGroup {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}

export interface LandingOverviewCard {
  icon: ReactNode;
  title: string;
  description: string;
  points: string[];
}

export interface LandingFooterGroup {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export const landingHeaderLinks: LandingNavItem[] = [
  { label: "الرؤية العامة", href: "#top" },
  { label: "كيف تعمل", href: "#how-it-works" },
  { label: "للفنادق", href: "#hotels" },
  { label: "للمغاسل", href: "#providers" },
  { label: "تواصل", href: "#contact" },
];

export const landingTrustPoints: LandingPoint[] = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "تشغيل موثوق",
    description: "سير عمل واضح يربط الطلب بالإسناد والتنفيذ والمتابعة من مكان واحد.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "مطابقة تلقائية ذكية",
    description: "الإسناد يتم تلقائيًا وفق السعة والالتزام والجودة والموقع، لا بالاختيار اليدوي.",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "مزودون معتمدون",
    description: "المشاركة التشغيلية تمر عبر اعتماد إداري واضح قبل دخول المزود إلى شبكة التنفيذ.",
  },
  {
    icon: <Gauge className="h-5 w-5" />,
    title: "متابعة تشغيلية واضحة",
    description: "رؤية مستمرة للحالة من إنشاء الطلب وحتى التسليم والإغلاق دون ضبابية تشغيلية.",
  },
];

export const landingHowItWorks: LandingStep[] = [
  {
    number: "01",
    title: "الفندق يرسل الطلب",
    description: "يبدأ التشغيل من الفندق عبر طلب واضح من واجهة واحدة.",
  },
  {
    number: "02",
    title: "المحرك يحلل الجاهزية",
    description: "تقيّم المنصة المزودين المعتمدين وفق السعة والموقع والالتزام.",
  },
  {
    number: "03",
    title: "الإسناد يتم تلقائيًا",
    description: "يتم اختيار أفضل مزود متاح تلقائيًا من دون اختيار يدوي.",
  },
  {
    number: "04",
    title: "المتابعة حتى التسليم",
    description: "تستمر المتابعة التشغيلية حتى التسليم وإغلاق الحالة.",
  },
];

export const landingBenefits: LandingBenefitGroup[] = [
  {
    eyebrow: "للفنادق",
    title: "تحكم أوضح في تشغيل الطلبات",
    description: "واجهة واحدة لإرسال الطلبات ومتابعة الإسناد والتنفيذ دون تنسيق يدوي متكرر.",
    points: [
      "الإسناد يتم تلقائيًا دون اختيار يدوي للمزوّد",
      "وضوح مباشر لحالة الطلب والتنفيذ",
      "تقليل وقت التنسيق بين الفريق والمزوّد",
      "رؤية موحدة للطلبات والاستثناءات",
    ],
  },
  {
    eyebrow: "للمغاسل",
    title: "طلبات أنسب وجاهزية تشغيلية أفضل",
    description: "طلبات أوضح تصل إلى المزود المعتمد عندما تكون مناسبة لسعته ومتطلبات التنفيذ.",
    points: [
      "طلبات جاهزة ضمن مسار تنفيذ واضح",
      "توزيع أكثر اتزانًا للحمل التشغيلي",
      "متابعة أفضل للأولويات ومراحل التنفيذ",
      "زيادة فرص الإسناد مع تحسن الأداء",
    ],
  },
];

export const landingOverviewCards: LandingOverviewCard[] = [
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "واجهة الفندق",
    description: "لإنشاء الطلبات ومتابعة الحالة من دون الدخول في تفاصيل اختيار المزوّد.",
    points: ["إنشاء الطلب", "متابعة الحالة"],
  },
  {
    icon: <Factory className="h-6 w-6" />,
    title: "واجهة المزوّد",
    description: "تعرض الطلبات المسندة وتدعم القبول والتنفيذ ضمن مسار تشغيلي واضح.",
    points: ["طلبات مسندة", "إدارة التنفيذ"],
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "واجهة الإدارة",
    description: "رؤية إشرافية للأداء والاعتماد والحالات التشغيلية عبر لوحة واضحة ومختصرة.",
    points: ["مؤشرات الأداء", "إشراف تشغيلي"],
  },
];

export const landingFooterGroups: LandingFooterGroup[] = [
  {
    title: "المنصة",
    links: [
      { label: "كيف تعمل", href: "#how-it-works" },
      { label: "واجهات المنصة", href: "#platform-overview" },
      { label: "ابدأ الآن", href: "#final-cta" },
    ],
  },
  {
    title: "الحلول",
    links: [
      { label: "للفنادق", href: "#hotels" },
      { label: "للمغاسل", href: "#providers" },
      { label: "تواصل معنا", href: "#contact" },
    ],
  },
  {
    title: "التسجيل",
    links: [
      { label: "تسجيل فندق", href: appRoutes.hotelRegistration },
      { label: "تسجيل مزود خدمة", href: appRoutes.providerRegistration },
      { label: "تسجيل الدخول", href: appRoutes.login },
    ],
  },
];

export const landingPrimaryAction = {
  label: "سجل فندقك الآن",
  to: appRoutes.hotelRegistration,
  icon: <ArrowLeft className="h-4 w-4" />,
};

export const landingSecondaryAction = {
  label: "سجل كمزود خدمة",
  href: appRoutes.providerRegistration,
};
