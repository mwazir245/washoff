import type { ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Factory,
  Gauge,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Truck,
  WandSparkles,
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

export interface LandingFeatureCard {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface LandingOverviewCard {
  icon: ReactNode;
  title: string;
  description: string;
  points: string[];
}

export interface LandingValueCard {
  title: string;
  description: string;
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

export const landingHeroFlow = [
  {
    title: "الطلب يبدأ من الفندق",
    description: "إرسال الطلب من واجهة الفندق ببيانات تشغيلية واضحة وجاهزة للمعالجة.",
    badge: "01",
  },
  {
    title: "تحليل المزودين المعتمدين",
    description: "المحرك يقيم السعة والالتزام والموقع وجودة الأداء قبل اتخاذ قرار الإسناد.",
    badge: "02",
  },
  {
    title: "إسناد تلقائي للأفضل",
    description: "الفندق لا يختار مزودًا يدويًا، والمنصة تسند الطلب تلقائيًا إلى الأنسب.",
    badge: "03",
  },
  {
    title: "تنفيذ ومتابعة حتى الإغلاق",
    description: "تتبع تشغيلي واضح للحالة والاستثناءات من الاستلام وحتى اكتمال الطلب.",
    badge: "04",
  },
];

export const landingHowItWorks: LandingStep[] = [
  {
    number: "01",
    title: "الفندق يرسل الطلب",
    description: "تبدأ العملية من الفندق بإرسال الطلب من واجهة واحدة واضحة ودون تنسيق يدوي مع عدة مزودين.",
  },
  {
    number: "02",
    title: "المحرك يحلل الجاهزية",
    description: "تقوم المنصة بتقييم المزودين المعتمدين بناءً على السعة والموقع والالتزام والأداء.",
  },
  {
    number: "03",
    title: "الإسناد يتم تلقائيًا",
    description: "يتم اختيار أفضل مزود متاح تلقائيًا وفق قواعد تشغيل واضحة من دون سلوك marketplace.",
  },
  {
    number: "04",
    title: "المتابعة حتى التسليم",
    description: "تستمر المنصة في تتبع التنفيذ والحالة وإدارة الاستثناءات حتى اكتمال الخدمة.",
  },
];

export const landingBenefits: LandingBenefitGroup[] = [
  {
    eyebrow: "للفنادق",
    title: "تشغيل خدمات الغسيل بمنهج أكثر انضباطًا",
    description:
      "بدل التنسيق اليدوي بين الطلبات والمزودين، تمنحك WashOff مسارًا تشغيليًا موحدًا يربط إنشاء الطلب بالإسناد والمتابعة.",
    points: [
      "عدم الحاجة لاختيار مزود لكل طلب بشكل يدوي",
      "وضوح فوري لحالة الطلب والإسناد والتنفيذ",
      "تقليل وقت التنسيق بين الفرق والمزودين",
      "رفع الانضباط التشغيلي في الاستلام والتسليم",
      "رؤية مركزية للطلبات والاستثناءات من لوحة واحدة",
    ],
  },
  {
    eyebrow: "للمغاسل",
    title: "استقبال طلبات أوضح وإدارة أفضل للسعة التشغيلية",
    description:
      "تصل الطلبات إلى المزود المعتمد عندما تكون مناسبة لسعته التشغيلية ومتطلبات التنفيذ، بما يدعم الاستقرار وجودة الخدمة.",
    points: [
      "طلبات جاهزة للتنفيذ ضمن مسار واضح ومحدد",
      "توزيع أكثر اتزانًا للحمل التشغيلي",
      "متابعة أفضل للأولويات ومراحل التنفيذ",
      "تحسن فرص الإسناد مع تحسن الأداء والالتزام",
    ],
  },
];

export const landingPlatformFeatures: LandingFeatureCard[] = [
  {
    icon: <WandSparkles className="h-6 w-6" />,
    title: "محرك مطابقة ذكي",
    description: "يقيّم أفضل قرار إسناد بناءً على السعة والالتزام والموقع وجودة الأداء.",
  },
  {
    icon: <Gauge className="h-6 w-6" />,
    title: "إسناد واعٍ بالسعة",
    description: "يمنع تحميل الشبكة أكثر من طاقتها عبر مراعاة الجاهزية التشغيلية لكل مزود.",
  },
  {
    icon: <TimerReset className="h-6 w-6" />,
    title: "تشغيل يراعي الالتزام الزمني",
    description: "يتابع الرحلة التشغيلية من الاستلام وحتى التسليم ضمن مسار زمني واضح.",
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: "إعادة إسناد تلقائية",
    description: "يعالج الرفض أو التعثر بإعادة الإسناد تلقائيًا وفق نفس منطق التشغيل.",
  },
];

export const landingOverviewCards: LandingOverviewCard[] = [
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "لوحة الفندق",
    description: "مخصصة لإنشاء الطلبات ومتابعة الحالة ومعرفة ما يحدث تشغيليًا دون الدخول في تفاصيل اختيار المزود.",
    points: ["إنشاء الطلب", "متابعة الحالة", "رؤية المزود المعين"],
  },
  {
    icon: <Factory className="h-6 w-6" />,
    title: "لوحة المزود",
    description: "تعرض الطلبات المسندة وتتيح قبولها أو رفضها ومتابعة التنفيذ ضمن مسار تشغيلي واضح.",
    points: ["طلبات واردة", "إدارة التنفيذ", "جاهزية تشغيلية"],
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "لوحة الإدارة",
    description: "توفر رؤية إشرافية للأداء والاعتماد والاستثناءات مع شفافية واضحة في المطابقة والإسناد.",
    points: ["مؤشرات الأداء", "إشراف تشغيلي", "شفافية المطابقة"],
  },
];

export const landingOperationalValues: LandingValueCard[] = [
  {
    title: "قرار إسناد أسرع",
    description: "تقليل الزمن بين إنشاء الطلب ووصوله إلى المزود الأنسب بقرار آلي منضبط.",
  },
  {
    title: "وضوح أعلى للحالة",
    description: "كل طرف يرى ما يخصه بوضوح من دون تضارب أو تبادل معلومات مشتت بين قنوات متعددة.",
  },
  {
    title: "انضباط تشغيلي أفضل",
    description: "تقليل القرارات اليدوية المتكررة التي تستهلك وقت الفرق وتربك سير العمل.",
  },
  {
    title: "استفادة أفضل من الشبكة",
    description: "الإسناد المعتمد على السعة الفعلية يرفع كفاءة الشبكة بدل توزيع الطلبات بشكل عشوائي.",
  },
  {
    title: "إدارة أوضح للاستثناءات",
    description: "إعادة الإسناد والمتابعة الإدارية تصبح جزءًا من المنصة لا عملاً إضافيًا خارجها.",
  },
];

export const landingSmartSignals = [
  {
    icon: <ClipboardList className="h-5 w-5" />,
    title: "إدخال طلب واضح",
    description: "ينطلق الطلب من الفندق ضمن واجهة واحدة واضحة وسريعة الاستخدام.",
  },
  {
    icon: <Layers3 className="h-5 w-5" />,
    title: "قرار إسناد محسوب",
    description: "المطابقة تعتمد على السعة والالتزام والموقع وجودة الأداء.",
  },
  {
    icon: <Truck className="h-5 w-5" />,
    title: "متابعة تنفيذ مستمرة",
    description: "تتبع واضح للحالة والاستثناءات من الاستلام حتى التسليم والإغلاق.",
  },
];

export const landingFooterGroups: LandingFooterGroup[] = [
  {
    title: "المنصة",
    links: [
      { label: "كيف تعمل", href: "#how-it-works" },
      { label: "التميّز التشغيلي", href: "#platform-features" },
      { label: "واجهات المنصة", href: "#platform-overview" },
    ],
  },
  {
    title: "الحلول",
    links: [
      { label: "للفنادق", href: "#hotels" },
      { label: "للمغاسل", href: "#providers" },
      { label: "القيمة التشغيلية", href: "#operational-value" },
    ],
  },
  {
    title: "ابدأ الآن",
    links: [
      { label: "تسجيل فندق", href: appRoutes.hotelRegistration },
      { label: "تسجيل مزود خدمة", href: appRoutes.providerRegistration },
      { label: "تواصل معنا", href: "#contact" },
    ],
  },
];

export const landingPrimaryAction = {
  label: "سجّل جهة فندقية",
  to: appRoutes.hotelRegistration,
  icon: <ArrowLeft className="h-4 w-4" />,
};

export const landingSecondaryAction = {
  label: "سجّل مزود خدمة",
  href: appRoutes.providerRegistration,
};
