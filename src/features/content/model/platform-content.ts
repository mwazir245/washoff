export type PlatformLanguage = "ar" | "en";

export type PlatformContentType =
  | "headline"
  | "paragraph"
  | "button_label"
  | "helper_text"
  | "section_label"
  | "link_label";

export interface PlatformContentEntry {
  id: string;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  compositeKey: string;
  contentType: PlatformContentType;
  labelAr: string;
  labelEn: string;
  valueAr: string;
  valueEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  active: boolean;
  sortOrder: number;
  updatedAt: string;
  updatedByAccountId?: string;
}

export interface PlatformContentAuditEntry {
  id: string;
  contentEntryId: string;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  oldValueAr?: string;
  oldValueEn?: string;
  newValueAr: string;
  newValueEn: string;
  changedByAccountId?: string;
  changedByRole?: "admin" | "system";
  changedAt: string;
  notesAr?: string;
}

export interface PlatformContentEntryUpdateCommand {
  id: string;
  valueAr: string;
  valueEn: string;
  active: boolean;
  notesAr?: string;
  updatedByAccountId?: string;
}

export interface PlatformPageContent {
  pageKey: string;
  language: PlatformLanguage;
  values: Record<string, string>;
}

export const platformManagedPageLabels: Record<
  string,
  {
    ar: string;
    en: string;
  }
> = {
  landing: { ar: "الصفحة الرئيسية", en: "Landing page" },
  auth_login: { ar: "صفحة تسجيل الدخول", en: "Login page" },
  onboarding_hotel: { ar: "تسجيل الفندق", en: "Hotel registration" },
  onboarding_provider: { ar: "تسجيل المزوّد", en: "Provider registration" },
  admin_dashboard: { ar: "لوحة الإدارة", en: "Admin dashboard" },
  admin_onboarding: { ar: "إدارة الاعتماد", en: "Onboarding management" },
  admin_settings: { ar: "إعدادات المنصة", en: "Platform settings" },
  admin_content: { ar: "إدارة النصوص", en: "Content management" },
};

export interface PlatformContentSeedDefinition {
  id: string;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  contentType: PlatformContentType;
  labelAr: string;
  labelEn: string;
  valueAr: string;
  valueEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  active?: boolean;
  sortOrder: number;
}

const buildEntryId = (pageKey: string, sectionKey: string, contentKey: string) =>
  `${pageKey}.${sectionKey}.${contentKey}`;

const defineSeedEntry = (
  pageKey: string,
  sectionKey: string,
  contentKey: string,
  contentType: PlatformContentType,
  sortOrder: number,
  labelAr: string,
  labelEn: string,
  valueAr: string,
  valueEn: string,
  descriptionAr?: string,
  descriptionEn?: string,
): PlatformContentSeedDefinition => ({
  id: buildEntryId(pageKey, sectionKey, contentKey),
  pageKey,
  sectionKey,
  contentKey,
  contentType,
  sortOrder,
  labelAr,
  labelEn,
  valueAr,
  valueEn,
  descriptionAr,
  descriptionEn,
  active: true,
});

export const platformContentSeedCatalog: PlatformContentSeedDefinition[] = [
  defineSeedEntry(
    "landing",
    "header",
    "brand_tagline",
    "helper_text",
    10,
    "الشعار الفرعي",
    "Brand tagline",
    "منصة ذكية لإدارة وتشغيل خدمات الغسيل",
    "A smart platform to manage and operate laundry services",
  ),
  defineSeedEntry("landing", "header", "login_button", "button_label", 20, "زر تسجيل الدخول", "Login button", "تسجيل الدخول", "Log in"),
  defineSeedEntry("landing", "header", "primary_button", "button_label", 30, "زر الإجراء الرئيسي", "Primary action button", "سجل فندقك الآن", "Register your hotel"),
  defineSeedEntry("landing", "hero", "eyebrow", "section_label", 40, "عنوان تمهيدي", "Hero eyebrow", "تشغيل ذكي ومتكامل لإدارة عمليات الغسيل", "Smart, integrated laundry operations"),
  defineSeedEntry("landing", "hero", "title", "headline", 50, "العنوان الرئيسي", "Hero title", "منصة ذكية لإدارة وتشغيل خدمات الغسيل للفنادق", "A smart platform to manage and operate laundry services for hotels"),
  defineSeedEntry("landing", "hero", "highlight", "paragraph", 60, "النص المميز", "Hero highlight", "أرسل طلبك... ودع النظام يتولى اختيار أفضل مزود خدمة تلقائيًا وفق السعة والأداء والالتزام.", "Send your request and let the system automatically select the best provider based on capacity, performance, and reliability."),
  defineSeedEntry("landing", "hero", "description", "paragraph", 70, "وصف الواجهة", "Hero description", "واش أوف تمكّن الفنادق من إدارة عمليات الغسيل بسهولة ووضوح، بينما يقوم النظام بإسناد الطلبات تلقائيًا دون تدخل يدوي، مع متابعة دقيقة لكل مرحلة من مراحل التنفيذ.", "WashOff helps hotels manage laundry operations with clarity while the system assigns requests automatically and tracks each stage of execution."),
  defineSeedEntry("landing", "hero", "provider_prompt", "helper_text", 80, "رسالة للمزوّد", "Provider prompt", "هل تمثل مغسلة تشغيلية؟", "Are you a laundry operator?"),
  defineSeedEntry("landing", "hero", "provider_link", "link_label", 90, "رابط تسجيل المزوّد", "Provider registration link", "سجل كمزود خدمة", "Register as a provider"),
  defineSeedEntry("landing", "hero", "automation_note", "helper_text", 95, "سطر القيمة التشغيلية", "Automation note", "تشغيل ذكي بالكامل — دون الحاجة لاختيار مزود الخدمة يدويًا", "Fully smart operations without manually choosing a provider"),
  defineSeedEntry("landing", "hero", "flow_title", "headline", 100, "عنوان مخطط العمل", "Hero flow title", "الفندق يرسل الطلب... والمنصة تتكفل بالباقي", "The hotel submits the order and the platform handles the rest"),
  defineSeedEntry("landing", "hero", "no_marketplace_title", "headline", 110, "عنوان نفي السوق المفتوح", "No marketplace title", "بدون سلوك Marketplace", "No marketplace behavior"),
  defineSeedEntry("landing", "hero", "no_marketplace_description", "paragraph", 120, "وصف نفي السوق المفتوح", "No marketplace description", "الفندق لا يتصفح المزودين ولا يقارن عروضًا يدويًا. WashOff تتخذ قرار الإسناد تلقائيًا وفق قواعد تشغيل واضحة.", "Hotels do not browse providers or compare offers manually. WashOff makes assignment decisions automatically using clear operating rules."),
  defineSeedEntry("landing", "trust", "eyebrow", "section_label", 130, "عنوان تمهيدي للمصداقية", "Trust eyebrow", "مصداقية وتشغيل", "Reliability and operations"),
  defineSeedEntry("landing", "trust", "title", "headline", 140, "عنوان قسم المصداقية", "Trust section title", "مصممة خصيصًا لقطاع الضيافة والتشغيل", "Designed for hospitality and operations"),
  defineSeedEntry("landing", "trust", "description", "paragraph", 150, "وصف قسم المصداقية", "Trust section description", "منصة WashOff مبنية لتلائم احتياجات الفنادق والمغاسل، مع تركيز على السرعة، الاعتمادية، والوضوح في كل مرحلة من مراحل الطلب.", "WashOff is built for hotels and laundries with a focus on speed, reliability, and visibility through every order stage."),
  defineSeedEntry("landing", "how_it_works", "eyebrow", "section_label", 160, "عنوان تمهيدي لكيف تعمل المنصة", "How it works eyebrow", "كيف تعمل المنصة", "How it works"),
  defineSeedEntry("landing", "how_it_works", "title", "headline", 170, "عنوان كيف تعمل المنصة", "How it works title", "كيف تعمل WashOff؟", "How does WashOff work?"),
  defineSeedEntry("landing", "how_it_works", "description", "paragraph", 180, "وصف كيف تعمل المنصة", "How it works description", "كل خطوة مصممة لتقليل التعقيد اليدوي وتحويل تشغيل خدمات الغسيل إلى مسار واضح وقابل للمتابعة.", "Every step is designed to reduce manual complexity and turn laundry operations into a clear, trackable workflow."),
  defineSeedEntry("landing", "features", "eyebrow", "section_label", 190, "عنوان تمهيدي للميزات", "Features eyebrow", "التشغيل الذكي", "Smart operations"),
  defineSeedEntry("landing", "features", "title", "headline", 200, "عنوان الميزات", "Features title", "تشغيل ذكي... وليس مجرد طلب خدمة", "Smart operations, not just a service request"),
  defineSeedEntry("landing", "features", "description", "paragraph", 210, "وصف الميزات", "Features description", "WashOff ليست سوق مزودين، بل منصة تشغيل تجعل الإسناد والمتابعة وإدارة الاستثناءات جزءًا من نفس المنظومة.", "WashOff is not a provider marketplace. It is an operations platform where assignment, tracking, and exception handling live in one system."),
  defineSeedEntry("landing", "overview", "eyebrow", "section_label", 220, "عنوان تمهيدي لنظرة المنصة", "Overview eyebrow", "نظرة على المنصة", "Platform overview"),
  defineSeedEntry("landing", "overview", "title", "headline", 230, "عنوان نظرة المنصة", "Overview title", "رؤية واضحة لكل طرف", "Clear visibility for every role"),
  defineSeedEntry("landing", "overview", "description", "paragraph", 240, "وصف نظرة المنصة", "Overview description", "كل واجهة مصممة لتخدم دورًا تشغيليًا واضحًا، مع بقاء القرار المركزي للإسناد داخل المنصة.", "Each interface serves a clear operational role while central assignment decisions remain inside the platform."),
  defineSeedEntry("landing", "final_cta", "title", "headline", 250, "عنوان الدعوة الختامية", "Final CTA title", "ابدأ تشغيل شبكة الغسيل لديك عبر منصة موحدة", "Start operating your laundry network through one platform"),
  defineSeedEntry("landing", "final_cta", "description", "paragraph", 260, "وصف الدعوة الختامية", "Final CTA description", "سجّل الجهة، دع الإدارة تعتمدها، ثم فعّل الحساب وابدأ التشغيل من نفس المنصة.", "Register the entity, let admin approve it, then activate the account and start operating from the same platform."),

  defineSeedEntry("auth_login", "page", "eyebrow", "section_label", 300, "عنوان تمهيدي للصفحة", "Page eyebrow", "دخول الحساب", "Account access"),
  defineSeedEntry("auth_login", "page", "title", "headline", 310, "عنوان الصفحة", "Page title", "سجّل الدخول إلى حساب WashOff", "Sign in to your WashOff account"),
  defineSeedEntry("auth_login", "page", "description", "paragraph", 320, "وصف الصفحة", "Page description", "يتم الوصول التشغيلي الآن عبر حساب فعلي مرتبط بجهة معتمدة. لا يمكن استخدام اللوحات التشغيلية قبل الاعتماد ثم التفعيل.", "Operational access now requires a real account linked to an approved entity. Dashboards remain unavailable until approval and activation are complete."),
  defineSeedEntry("auth_login", "side", "title", "headline", 330, "عنوان الشرح الجانبي", "Side title", "كيف يعمل الوصول الآن؟", "How access works now"),
  defineSeedEntry("auth_login", "side", "description", "paragraph", 340, "وصف الشرح الجانبي", "Side description", "يحافظ WashOff على فصل واضح بين هوية المستخدم والجهة التشغيلية المرتبطة به، حتى تبقى كل لوحة وإجراء محميًا بدور صحيح واعتماد فعلي.", "WashOff separates the user identity from the operational entity so every dashboard and action stays tied to the correct role and approval state."),
  defineSeedEntry("auth_login", "form", "title", "headline", 350, "عنوان النموذج", "Form title", "أدخل بيانات الحساب", "Enter your account details"),
  defineSeedEntry("auth_login", "form", "description", "paragraph", 360, "وصف النموذج", "Form description", "استخدم البريد الإلكتروني المرتبط بحسابك بعد الاعتماد والتفعيل.", "Use the email linked to your account after approval and activation."),
  defineSeedEntry("auth_login", "form", "email_label", "helper_text", 370, "حقل البريد", "Email label", "البريد الإلكتروني", "Email"),
  defineSeedEntry("auth_login", "form", "password_label", "helper_text", 380, "حقل كلمة المرور", "Password label", "كلمة المرور", "Password"),
  defineSeedEntry("auth_login", "form", "forgot_password_link", "link_label", 390, "رابط نسيان كلمة المرور", "Forgot password link", "نسيت كلمة المرور؟", "Forgot your password?"),
  defineSeedEntry("auth_login", "form", "submit_label", "button_label", 400, "زر الدخول", "Submit label", "تسجيل الدخول", "Sign in"),
  defineSeedEntry("auth_login", "messages", "activation_hint", "helper_text", 410, "تنبيه التفعيل", "Activation hint", "إذا تم اعتماد الجهة لكن الحساب لم يُفعّل بعد، استخدم رابط التفعيل الذي وصلك من الإدارة أولًا.", "If the entity was approved but the account has not been activated yet, use the activation link first."),
  defineSeedEntry("auth_login", "links", "register_hotel", "link_label", 420, "رابط تسجيل فندق", "Hotel registration link", "تسجيل فندق جديد", "Register a new hotel"),
  defineSeedEntry("auth_login", "links", "register_provider", "link_label", 430, "رابط تسجيل مزوّد", "Provider registration link", "تسجيل مزوّد جديد", "Register a new provider"),

  defineSeedEntry("onboarding_hotel", "page", "eyebrow", "section_label", 500, "عنوان تمهيدي", "Page eyebrow", "تسجيل فندق", "Hotel registration"),
  defineSeedEntry("onboarding_hotel", "page", "title", "headline", 510, "عنوان الصفحة", "Page title", "ابدأ انضمام الفندق إلى WashOff", "Start your hotel onboarding to WashOff"),
  defineSeedEntry("onboarding_hotel", "page", "description", "paragraph", 520, "وصف الصفحة", "Page description", "أرسل بيانات الفندق الأساسية ليتم إنشاء طلب اعتماد رسمي. بعد المراجعة، يصبح الحساب المرتبط بالفندق مؤهلًا للتفعيل ثم يبدأ الوصول إلى لوحة التشغيل.", "Submit the hotel details to create an approval request. After review, the linked account becomes eligible for activation and hotel access."),
  defineSeedEntry("onboarding_hotel", "page", "checklist_title", "headline", 530, "عنوان القائمة", "Checklist title", "ما الذي يحدث بعد التسجيل؟", "What happens after registration?"),
  defineSeedEntry("onboarding_hotel", "page", "checklist_description", "paragraph", 540, "وصف القائمة", "Checklist description", "WashOff تعتمد الفنادق قبل تفعيل التشغيل حتى تبقى الشبكة موثوقة ومضبوطة تشغيليًا.", "WashOff approves hotels before activation so the network remains controlled and reliable."),
  defineSeedEntry("onboarding_hotel", "success", "title", "headline", 550, "عنوان النجاح", "Success title", "تم إرسال طلب التسجيل بنجاح", "Registration request submitted successfully"),
  defineSeedEntry("onboarding_hotel", "success", "description", "paragraph", 560, "وصف النجاح", "Success description", "ستراجع الإدارة البيانات ثم تُفعّل مسار الحساب المرتبط عند الموافقة. لن يصبح الوصول إلى لوحة الفندق متاحًا إلا بعد الاعتماد ثم تفعيل الحساب.", "Admin will review the information and enable the activation path after approval. Hotel access becomes available only after approval and account activation."),

  defineSeedEntry("onboarding_provider", "page", "eyebrow", "section_label", 600, "عنوان تمهيدي", "Page eyebrow", "تسجيل مزود خدمة", "Provider registration"),
  defineSeedEntry("onboarding_provider", "page", "title", "headline", 610, "عنوان الصفحة", "Page title", "انضم إلى شبكة WashOff كمزوّد معتمد", "Join the WashOff network as an approved provider"),
  defineSeedEntry("onboarding_provider", "page", "description", "paragraph", 620, "وصف الصفحة", "Page description", "أرسل بيانات المغسلة والخدمات والسعة التشغيلية اليومية ليتم تقييمها من الإدارة. لا يدخل أي مزوّد داخل الإسناد الذكي قبل الاعتماد ثم تفعيل الحساب المرتبط.", "Submit the laundry, services, and daily capacity details for admin review. No provider enters smart assignment before approval and account activation."),
  defineSeedEntry("onboarding_provider", "page", "checklist_title", "headline", 630, "عنوان القائمة", "Checklist title", "لماذا يوجد اعتماد للمزوّدين؟", "Why providers must be approved"),
  defineSeedEntry("onboarding_provider", "page", "checklist_description", "paragraph", 640, "وصف القائمة", "Checklist description", "لأن WashOff منصة تشغيل ذكية وليست سوقًا مفتوحًا، لا يشارك في الإسناد إلا المزوّدون المعتمدون تشغيليًا.", "Because WashOff is an operations platform rather than an open marketplace, only approved providers participate in assignment."),
  defineSeedEntry("onboarding_provider", "success", "title", "headline", 650, "عنوان النجاح", "Success title", "تم إرسال طلب المزوّد بنجاح", "Provider request submitted successfully"),
  defineSeedEntry("onboarding_provider", "success", "description", "paragraph", 660, "وصف النجاح", "Success description", "حتى يتم اعتماد المزوّد ثم تفعيل حسابه، لن يدخل في محرّك المطابقة ولن يستقبل أي إسناد تشغيلي من الفنادق.", "Until the provider is approved and activated, it will not enter the matching engine or receive operational assignments."),

  defineSeedEntry("admin_dashboard", "page", "title", "headline", 700, "عنوان الصفحة", "Page title", "لوحة الإدارة", "Admin dashboard"),
  defineSeedEntry("admin_dashboard", "page", "subtitle", "paragraph", 710, "وصف الصفحة", "Page subtitle", "صورة تشغيلية تنفيذية لمسار الإسناد التلقائي، التعثر، والسعة عبر شبكة WashOff.", "An executive operational view of assignment, exceptions, and capacity across WashOff."),
  defineSeedEntry("admin_dashboard", "onboarding", "title", "headline", 720, "عنوان قسم الاعتماد", "Onboarding section title", "طلبات جديدة بانتظار المراجعة", "New requests pending review"),
  defineSeedEntry("admin_dashboard", "onboarding", "description", "paragraph", 730, "وصف قسم الاعتماد", "Onboarding section description", "راجع طلبات الفنادق والمزوّدين الجدد من مكان واضح داخل لوحة الإدارة قبل دخولهم إلى التشغيل.", "Review new hotel and provider requests from one clear place before they enter operations."),
  defineSeedEntry("admin_dashboard", "settings", "title", "headline", 740, "عنوان بطاقة الإعدادات", "Settings card title", "إعدادات المنصة", "Platform settings"),
  defineSeedEntry("admin_dashboard", "settings", "description", "paragraph", 750, "وصف بطاقة الإعدادات", "Settings card description", "تحكم في الإعدادات الآمنة للمنصة، حالة البريد، وسياسات التسجيل من لوحة الإدارة.", "Manage safe platform settings, mail state, and registration policies from admin."),
  defineSeedEntry("admin_dashboard", "content", "title", "headline", 760, "عنوان بطاقة إدارة النصوص", "Content card title", "إدارة النصوص", "Content management"),
  defineSeedEntry("admin_dashboard", "content", "description", "paragraph", 770, "وصف بطاقة إدارة النصوص", "Content card description", "حدّث النصوص العربية والإنجليزية للصفحات المدعومة دون الحاجة لتعديل الكود.", "Update Arabic and English page copy without changing code."),
  defineSeedEntry("admin_dashboard", "onboarding_alert", "title", "headline", 780, "عنوان تنبيه الاعتماد", "Onboarding alert title", "تنبيه إداري: توجد طلبات جديدة بانتظار الاعتماد", "Admin alert: new approval requests are waiting"),
  defineSeedEntry("admin_dashboard", "onboarding_alert", "description", "paragraph", 790, "وصف تنبيه الاعتماد", "Onboarding alert description", "راجع الطلبات الجديدة حتى لا تتأخر الجهات الجاهزة عن الدخول إلى التشغيل.", "Review new requests so ready entities are not delayed from entering operations."),

  defineSeedEntry("admin_onboarding", "page", "title", "headline", 820, "عنوان الصفحة", "Page title", "إدارة الاعتماد", "Onboarding management"),
  defineSeedEntry("admin_onboarding", "page", "subtitle", "paragraph", 830, "وصف الصفحة", "Page subtitle", "راجع طلبات انضمام الفنادق والمزوّدين، ثم فعّل الجهات المعتمدة فقط داخل تشغيل WashOff.", "Review hotel and provider onboarding requests and enable only approved entities inside WashOff operations."),
  defineSeedEntry("admin_onboarding", "policy", "title", "headline", 840, "عنوان سياسة الاعتماد", "Policy title", "اعتماد مركزي قبل التفعيل التشغيلي", "Central approval before operational activation"),
  defineSeedEntry("admin_onboarding", "policy", "description", "paragraph", 850, "وصف سياسة الاعتماد", "Policy description", "تبقى طلبات التسجيل الجديدة بحالة بانتظار الاعتماد. بعد الموافقة فقط يصبح الفندق قادرًا على إرسال الطلبات، ويصبح المزوّد مؤهلًا للدخول في محرّك الإسناد الذكي.", "New registrations remain pending until approval. Only then can hotels submit orders and providers enter the assignment engine."),

  defineSeedEntry("admin_settings", "page", "title", "headline", 900, "عنوان الصفحة", "Page title", "إعدادات المنصة", "Platform settings"),
  defineSeedEntry("admin_settings", "page", "subtitle", "paragraph", 910, "وصف الصفحة", "Page subtitle", "تحكم في الإعدادات التشغيلية الآمنة، راقب حالة البيئة الحالية، واحتفظ بسجل واضح للتعديلات الإدارية.", "Manage safe operational settings, inspect the current runtime environment, and keep a clear audit trail of admin changes."),
  defineSeedEntry("admin_content", "page", "title", "headline", 920, "عنوان الصفحة", "Page title", "إدارة النصوص", "Content management"),
  defineSeedEntry("admin_content", "page", "subtitle", "paragraph", 930, "وصف الصفحة", "Page subtitle", "حدّث النصوص العربية والإنجليزية للصفحات المدعومة، مع بقاء النصوص الافتراضية كمسار احتياطي آمن.", "Update Arabic and English copy for supported pages while keeping code defaults as a safe fallback."),
];

export const buildPlatformContentCompositeKey = (
  pageKey: string,
  sectionKey: string,
  contentKey: string,
) => `${pageKey}.${sectionKey}.${contentKey}`;

export const buildPlatformContentSeedEntry = (
  definition: PlatformContentSeedDefinition,
  nowIso = new Date("2026-03-21T00:00:00.000Z").toISOString(),
): PlatformContentEntry => ({
  id: definition.id,
  pageKey: definition.pageKey,
  sectionKey: definition.sectionKey,
  contentKey: definition.contentKey,
  compositeKey: buildPlatformContentCompositeKey(
    definition.pageKey,
    definition.sectionKey,
    definition.contentKey,
  ),
  contentType: definition.contentType,
  labelAr: definition.labelAr,
  labelEn: definition.labelEn,
  valueAr: definition.valueAr,
  valueEn: definition.valueEn,
  descriptionAr: definition.descriptionAr,
  descriptionEn: definition.descriptionEn,
  active: definition.active ?? true,
  sortOrder: definition.sortOrder,
  updatedAt: nowIso,
});

export const buildAllDefaultPlatformContentEntries = (
  nowIso = new Date("2026-03-21T00:00:00.000Z").toISOString(),
) => platformContentSeedCatalog.map((definition) => buildPlatformContentSeedEntry(definition, nowIso));

export const listManagedPlatformContentPages = () => {
  return Array.from(new Set(platformContentSeedCatalog.map((entry) => entry.pageKey)));
};

export const getPlatformContentEntryDefinition = (id: string) => {
  return platformContentSeedCatalog.find((entry) => entry.id === id);
};

export const getDefaultPlatformPageContentValues = (
  pageKey: string,
  language: PlatformLanguage,
) => {
  return platformContentSeedCatalog
    .filter((entry) => entry.pageKey === pageKey)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .reduce<Record<string, string>>((collection, entry) => {
      collection[buildPlatformContentCompositeKey(entry.pageKey, entry.sectionKey, entry.contentKey)] =
        language === "en" ? entry.valueEn || entry.valueAr : entry.valueAr || entry.valueEn;
      return collection;
    }, {});
};

export const resolvePlatformContentEntryValue = (
  entry: Pick<PlatformContentEntry, "valueAr" | "valueEn">,
  language: PlatformLanguage,
) => {
  if (language === "en") {
    return entry.valueEn.trim() || entry.valueAr.trim();
  }

  return entry.valueAr.trim() || entry.valueEn.trim();
};

export const resolvePlatformPageContent = ({
  entries,
  pageKey,
  language,
}: {
  entries: PlatformContentEntry[];
  pageKey: string;
  language: PlatformLanguage;
}): PlatformPageContent => {
  const defaults = getDefaultPlatformPageContentValues(pageKey, language);
  const overrides = entries
    .filter((entry) => entry.pageKey === pageKey && entry.active)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .reduce<Record<string, string>>((collection, entry) => {
      collection[entry.compositeKey] = resolvePlatformContentEntryValue(entry, language);
      return collection;
    }, {});

  return {
    pageKey,
    language,
    values: {
      ...defaults,
      ...overrides,
    },
  };
};
