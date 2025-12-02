import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  en: {
    // Common
    "app.name": "Wash Off",
    "app.tagline": "The smarter way to get your laundry done",
    "app.copyright": "© 2024 Wash Off. All rights reserved.",
    
    // Navigation
    "nav.home": "Home",
    "nav.findLaundries": "Find Laundries",
    "nav.howItWorks": "How It Works",
    "nav.forProviders": "For Providers",
    "nav.explore": "Explore",
    "nav.orders": "Orders",
    "nav.profile": "Profile",
    "nav.setLocation": "Set Location",
    "nav.signIn": "Sign In",
    "nav.getStarted": "Get Started",
    
    // Hero Section
    "hero.title": "Laundry Made",
    "hero.titleHighlight": "Simple",
    "hero.subtitle": "Connect with trusted laundry services near you. Fresh, clean clothes delivered to your door.",
    "hero.searchPlaceholder": "Enter your location",
    "hero.searchButton": "Find Laundries",
    
    // Stats
    "stats.laundries": "Laundries",
    "stats.happyCustomers": "Happy Customers",
    "stats.averageRating": "Average Rating",
    
    // Features
    "features.badge": "Why Choose Us",
    "features.title": "The Smarter Way to Do Laundry",
    "features.quickTurnaround": "Quick Turnaround",
    "features.quickTurnaroundDesc": "Get your clothes back clean and fresh within hours",
    "features.freeDelivery": "Discounted Delivery",
    "features.freeDeliveryDesc": "We come to you - no need to leave your home",
    "features.socialImpact": "Social Impact",
    "features.socialImpactDesc": "Donate clothes - we clean, iron & deliver to those in need",
    "features.ecoFriendly": "Eco-Friendly",
    "features.ecoFriendlyDesc": "Sustainable cleaning practices and products",
    
    // Nearby Section
    "nearby.title": "Laundries Near You",
    "nearby.subtitle": "Top-rated services in your area",
    "nearby.viewAll": "View All",
    
    // How It Works
    "howItWorks.badge": "How It Works",
    "howItWorks.title": "Fresh Clothes in 3 Easy Steps",
    "howItWorks.step1.title": "Schedule Pickup",
    "howItWorks.step1.desc": "Choose a time that works for you",
    "howItWorks.step2.title": "We Clean",
    "howItWorks.step2.desc": "Professional care for your garments",
    "howItWorks.step3.title": "Delivered Fresh",
    "howItWorks.step3.desc": "Clean clothes right to your door",
    "howItWorks.cta": "Get Started Now",
    
    // CTA Section
    "cta.title": "Own a Laundry Business?",
    "cta.description": "Join Wash Off and reach thousands of customers looking for quality laundry services. Grow your business with our platform.",
    "cta.button": "Partner With Us",
    
    // Footer
    "footer.forCustomers": "For Customers",
    "footer.findLaundries": "Find Laundries",
    "footer.howItWorks": "How It Works",
    "footer.pricing": "Pricing",
    "footer.forBusiness": "For Business",
    "footer.partnerWithUs": "Partner With Us",
    "footer.becomeDriver": "Become a Driver",
    "footer.support": "Support",
    "footer.helpCenter": "Help Center",
    "footer.contactUs": "Contact Us",
    
    // Laundry Card
    "laundry.open": "Open",
    "laundry.closed": "Closed",
    "laundry.delivery": "Delivery",
    "laundry.reviews": "reviews",
    "laundry.away": "away",
    
    // Services
    "service.washing": "Washing",
    "service.ironing": "Ironing",
    "service.dryClean": "Dry Clean",
    "service.alterations": "Alterations",
    
    // Auth
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.forgotPassword": "Forgot Password?",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.or": "or",
    "auth.continueWithGoogle": "Continue with Google",
    
    // Orders
    "orders.title": "My Orders",
    "orders.active": "Active",
    "orders.completed": "Completed",
    "orders.noOrders": "No orders yet",
    "orders.trackOrder": "Track Order",
    
    // Order Status
    "status.orderReceived": "Order Received",
    "status.onWayPickup": "On the Way to Pickup",
    "status.clothesCollected": "Clothes Collected",
    "status.inWashing": "In Washing",
    "status.inIroning": "In Ironing",
    "status.inDryClean": "In Dry Clean",
    "status.ready": "Ready",
    "status.outForDelivery": "Out for Delivery",
    "status.delivered": "Delivered",
    
    // Profile
    "profile.title": "Profile",
    "profile.myOrders": "My Orders",
    "profile.settings": "Settings",
    "profile.language": "Language",
    "profile.logout": "Logout",
    
    // Provider
    "provider.register": "Register as Provider",
    "provider.dashboard": "Provider Dashboard",
    "provider.laundryName": "Laundry Name",
    "provider.commercialReg": "Commercial Registration Number",
    "provider.address": "Address",
    "provider.contact": "Contact Info",
    "provider.workingHours": "Working Hours",
    "provider.services": "Services",
    
    // Delivery
    "delivery.register": "Register as Delivery Partner",
    "delivery.dashboard": "Delivery Dashboard",
    "delivery.name": "Full Name",
    "delivery.phone": "Phone Number",
    "delivery.city": "City",
    "delivery.vehicleType": "Vehicle Type",
    
    // Admin
    "admin.dashboard": "Admin Dashboard",
    "admin.customers": "Customers",
    "admin.providers": "Providers",
    "admin.deliveryPartners": "Delivery Partners",
    "admin.orders": "Orders",
    "admin.reports": "Reports",
    
    // Currency
    "currency.sar": "SAR",
    "currency.symbol": "SAR",
    
    // Donation
    "donation.badge": "Social Impact",
    "donation.title": "Donate Your Clothes",
    "donation.subtitle": "Give your clothes a second life. We collect, clean, iron, and deliver them to those in need.",
    "donation.howItWorks": "How Donation Works",
    "donation.step1.title": "Schedule Pickup",
    "donation.step1.desc": "Fill out the form and we'll schedule a convenient pickup time",
    "donation.step2.title": "We Collect",
    "donation.step2.desc": "Our team picks up the clothes from your location",
    "donation.step3.title": "Clean & Iron",
    "donation.step3.desc": "We professionally clean and iron all donated clothes",
    "donation.step4.title": "Deliver to Those in Need",
    "donation.step4.desc": "Clothes are distributed to families and individuals in need",
    "donation.formTitle": "Donate Now",
    "donation.formSubtitle": "Fill out the form below and we'll arrange pickup",
    "donation.name": "Full Name",
    "donation.phone": "Phone Number",
    "donation.address": "Pickup Address",
    "donation.clothesDescription": "Describe Your Donation",
    "donation.clothesPlaceholder": "e.g., 5 shirts, 3 pants, 2 jackets...",
    "donation.preferredDate": "Preferred Pickup Date",
    "donation.submitButton": "Submit Donation",
    "donation.successMessage": "Thank you! We'll contact you to arrange pickup.",
    "donation.stats.families": "Families Helped",
    "donation.stats.clothes": "Clothes Donated",
    "donation.stats.partners": "Charity Partners",
    "nav.donation": "Donate",

    // Common Actions
    "action.submit": "Submit",
    "action.cancel": "Cancel",
    "action.save": "Save",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "action.confirm": "Confirm",
    "action.back": "Back",
    "action.next": "Next",
    "action.continue": "Continue",
    "action.placeOrder": "Place Order",
    "action.rateOrder": "Rate Order",
    "action.call": "Call",
    "action.chat": "Chat",
    "action.change": "Change",
    "action.skipForNow": "Skip for now",

    // Laundries Page
    "laundries.title": "Laundries Found",
    "laundries.searchPlaceholder": "Search laundries...",
    "laundries.deliveringTo": "Delivering to:",
    "laundries.currentLocation": "Current Location",
    "laundries.noResults": "No laundries found",
    "laundries.noResultsDesc": "Try adjusting your search or filters",
    "laundries.sortBy": "Sort By",
    "laundries.all": "All",
    "laundries.nearest": "Nearest",
    "laundries.topRated": "Top Rated",
    "laundries.fastest": "Fastest",
    "laundries.priceLowHigh": "Price: Low to High",

    // Order Page
    "order.checkout": "Checkout",
    "order.deliveryAddress": "Delivery Address",
    "order.useCurrentLocation": "Use current location",
    "order.pickupSchedule": "Pickup Schedule",
    "order.pickupDate": "Pickup Date",
    "order.pickupTime": "Pickup Time",
    "order.deliverySchedule": "Delivery Schedule",
    "order.deliveryDate": "Delivery Date",
    "order.deliveryTime": "Delivery Time",
    "order.paymentMethod": "Payment Method",
    "order.creditCard": "Credit / Debit Card",
    "order.applePay": "Apple Pay / STC Pay",
    "order.cashOnDelivery": "Cash on Delivery",
    "order.orderSummary": "Order Summary",
    "order.subtotal": "Subtotal",
    "order.deliveryFee": "Delivery Fee",
    "order.total": "Total",

    // Order Tracking
    "tracking.orderStatus": "Order Status",
    "tracking.estimatedDelivery": "Estimated delivery",
    "tracking.today": "Today",
    "tracking.inProgress": "In Progress",
    "tracking.laundryService": "Laundry Service",
    "tracking.deliveryPartner": "Delivery Partner",
    "tracking.onTheWay": "On the way",
    "tracking.orderDetails": "Order Details",
    "tracking.liveMap": "Live tracking map",

    // LaundryProfile
    "laundryProfile.services": "Services",
    "laundryProfile.reviews": "Reviews",
    "laundryProfile.item": "item",
    "laundryProfile.items": "items",

    // Rating Page
    "rating.title": "Rate Your Order",
    "rating.question": "How was your experience?",
    "rating.tapToRate": "Tap to rate",
    "rating.poor": "Poor",
    "rating.fair": "Fair",
    "rating.good": "Good",
    "rating.veryGood": "Very Good",
    "rating.excellent": "Excellent!",
    "rating.feedbackLabel": "Share your experience (optional)",
    "rating.feedbackPlaceholder": "Tell us what you liked or what we can improve...",
    "rating.submit": "Submit Rating",
    "rating.thankYou": "Thank you for your feedback!",
    "rating.submitted": "Your rating has been submitted successfully.",
    "rating.selectRating": "Please select a rating",

    // Profile Page
    "profile.addresses": "Saved Addresses",
    "profile.payments": "Payment Methods",
    "profile.favorites": "Favorites",
    "profile.notifications": "Notifications",
    "profile.terms": "Terms & Conditions",
  },
  ar: {
    // Common
    "app.name": "واش أوف",
    "app.tagline": "الطريقة الأذكى لغسيل ملابسك",
    "app.copyright": "© 2024 واش أوف. جميع الحقوق محفوظة.",
    
    // Navigation
    "nav.home": "الرئيسية",
    "nav.findLaundries": "ابحث عن مغاسل",
    "nav.howItWorks": "كيف يعمل",
    "nav.forProviders": "لمقدمي الخدمات",
    "nav.explore": "استكشف",
    "nav.orders": "الطلبات",
    "nav.profile": "الملف الشخصي",
    "nav.setLocation": "تحديد الموقع",
    "nav.signIn": "تسجيل الدخول",
    "nav.getStarted": "ابدأ الآن",
    
    // Hero Section
    "hero.title": "الغسيل صار",
    "hero.titleHighlight": "سهل",
    "hero.subtitle": "تواصل مع خدمات الغسيل الموثوقة بالقرب منك. ملابس نظيفة ومنعشة توصل إلى بابك.",
    "hero.searchPlaceholder": "أدخل موقعك",
    "hero.searchButton": "ابحث عن مغاسل",
    
    // Stats
    "stats.laundries": "مغسلة",
    "stats.happyCustomers": "عميل سعيد",
    "stats.averageRating": "متوسط التقييم",
    
    // Features
    "features.badge": "لماذا تختارنا",
    "features.title": "الطريقة الأذكى للغسيل",
    "features.quickTurnaround": "سرعة في الإنجاز",
    "features.quickTurnaroundDesc": "احصل على ملابسك نظيفة ومنعشة خلال ساعات",
    "features.freeDelivery": "توصيل مُخفّض",
    "features.freeDeliveryDesc": "نأتي إليك - لا حاجة لمغادرة منزلك",
    "features.socialImpact": "الأثر المجتمعي",
    "features.socialImpactDesc": "تبرع بملابسك - ننظفها ونكويها ونوصلها للمحتاجين",
    "features.ecoFriendly": "صديق للبيئة",
    "features.ecoFriendlyDesc": "ممارسات ومنتجات تنظيف مستدامة",
    
    // Nearby Section
    "nearby.title": "مغاسل بالقرب منك",
    "nearby.subtitle": "أفضل الخدمات في منطقتك",
    "nearby.viewAll": "عرض الكل",
    
    // How It Works
    "howItWorks.badge": "كيف يعمل",
    "howItWorks.title": "ملابس نظيفة في 3 خطوات سهلة",
    "howItWorks.step1.title": "حدد موعد الاستلام",
    "howItWorks.step1.desc": "اختر الوقت المناسب لك",
    "howItWorks.step2.title": "نقوم بالتنظيف",
    "howItWorks.step2.desc": "عناية احترافية بملابسك",
    "howItWorks.step3.title": "التوصيل منعش",
    "howItWorks.step3.desc": "ملابس نظيفة إلى بابك",
    "howItWorks.cta": "ابدأ الآن",
    
    // CTA Section
    "cta.title": "تملك مغسلة؟",
    "cta.description": "انضم إلى واش أوف وتواصل مع آلاف العملاء الذين يبحثون عن خدمات غسيل عالية الجودة. نمِّ عملك مع منصتنا.",
    "cta.button": "كن شريكاً معنا",
    
    // Footer
    "footer.forCustomers": "للعملاء",
    "footer.findLaundries": "ابحث عن مغاسل",
    "footer.howItWorks": "كيف يعمل",
    "footer.pricing": "الأسعار",
    "footer.forBusiness": "للأعمال",
    "footer.partnerWithUs": "كن شريكاً معنا",
    "footer.becomeDriver": "كن سائق توصيل",
    "footer.support": "الدعم",
    "footer.helpCenter": "مركز المساعدة",
    "footer.contactUs": "اتصل بنا",
    
    // Laundry Card
    "laundry.open": "مفتوح",
    "laundry.closed": "مغلق",
    "laundry.delivery": "توصيل",
    "laundry.reviews": "تقييم",
    "laundry.away": "بعيد",
    
    // Services
    "service.washing": "غسيل",
    "service.ironing": "كي",
    "service.dryClean": "تنظيف جاف",
    "service.alterations": "تعديلات",
    
    // Auth
    "auth.signIn": "تسجيل الدخول",
    "auth.signUp": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.confirmPassword": "تأكيد كلمة المرور",
    "auth.forgotPassword": "نسيت كلمة المرور؟",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.hasAccount": "لديك حساب بالفعل؟",
    "auth.or": "أو",
    "auth.continueWithGoogle": "المتابعة مع جوجل",
    
    // Orders
    "orders.title": "طلباتي",
    "orders.active": "نشطة",
    "orders.completed": "مكتملة",
    "orders.noOrders": "لا توجد طلبات بعد",
    "orders.trackOrder": "تتبع الطلب",
    
    // Order Status
    "status.orderReceived": "تم استلام الطلب",
    "status.onWayPickup": "في الطريق للاستلام",
    "status.clothesCollected": "تم جمع الملابس",
    "status.inWashing": "قيد الغسيل",
    "status.inIroning": "قيد الكي",
    "status.inDryClean": "قيد التنظيف الجاف",
    "status.ready": "جاهز",
    "status.outForDelivery": "خرج للتوصيل",
    "status.delivered": "تم التوصيل",
    
    // Profile
    "profile.title": "الملف الشخصي",
    "profile.myOrders": "طلباتي",
    "profile.settings": "الإعدادات",
    "profile.language": "اللغة",
    "profile.logout": "تسجيل الخروج",
    
    // Provider
    "provider.register": "التسجيل كمقدم خدمة",
    "provider.dashboard": "لوحة تحكم المغسلة",
    "provider.laundryName": "اسم المغسلة",
    "provider.commercialReg": "رقم السجل التجاري",
    "provider.address": "العنوان",
    "provider.contact": "معلومات الاتصال",
    "provider.workingHours": "ساعات العمل",
    "provider.services": "الخدمات",
    
    // Delivery
    "delivery.register": "التسجيل كشريك توصيل",
    "delivery.dashboard": "لوحة تحكم التوصيل",
    "delivery.name": "الاسم الكامل",
    "delivery.phone": "رقم الهاتف",
    "delivery.city": "المدينة",
    "delivery.vehicleType": "نوع المركبة",
    
    // Admin
    "admin.dashboard": "لوحة تحكم المدير",
    "admin.customers": "العملاء",
    "admin.providers": "مقدمو الخدمات",
    "admin.deliveryPartners": "شركاء التوصيل",
    "admin.orders": "الطلبات",
    "admin.reports": "التقارير",
    
    // Currency
    "currency.sar": "ر.س",
    "currency.symbol": "ر.س",
    
    // Donation
    "donation.badge": "الأثر المجتمعي",
    "donation.title": "تبرع بملابسك",
    "donation.subtitle": "امنح ملابسك حياة جديدة. نجمعها وننظفها ونكويها ونوصلها للمحتاجين.",
    "donation.howItWorks": "كيف يعمل التبرع",
    "donation.step1.title": "حدد موعد الاستلام",
    "donation.step1.desc": "املأ النموذج وسنحدد موعداً مناسباً للاستلام",
    "donation.step2.title": "نقوم بالجمع",
    "donation.step2.desc": "فريقنا يستلم الملابس من موقعك",
    "donation.step3.title": "التنظيف والكي",
    "donation.step3.desc": "ننظف ونكوي جميع الملابس المتبرع بها بشكل احترافي",
    "donation.step4.title": "التوصيل للمحتاجين",
    "donation.step4.desc": "توزع الملابس على العائلات والأفراد المحتاجين",
    "donation.formTitle": "تبرع الآن",
    "donation.formSubtitle": "املأ النموذج أدناه وسنرتب الاستلام",
    "donation.name": "الاسم الكامل",
    "donation.phone": "رقم الهاتف",
    "donation.address": "عنوان الاستلام",
    "donation.clothesDescription": "وصف التبرع",
    "donation.clothesPlaceholder": "مثال: 5 قمصان، 3 بناطيل، 2 جاكيت...",
    "donation.preferredDate": "تاريخ الاستلام المفضل",
    "donation.submitButton": "إرسال التبرع",
    "donation.successMessage": "شكراً لك! سنتواصل معك لترتيب الاستلام.",
    "donation.stats.families": "عائلة تم مساعدتها",
    "donation.stats.clothes": "قطعة ملابس تم التبرع بها",
    "donation.stats.partners": "شريك خيري",
    "nav.donation": "تبرع",

    // Common Actions
    "action.submit": "إرسال",
    "action.cancel": "إلغاء",
    "action.save": "حفظ",
    "action.edit": "تعديل",
    "action.delete": "حذف",
    "action.confirm": "تأكيد",
    "action.back": "رجوع",
    "action.next": "التالي",
    "action.continue": "متابعة",
    "action.placeOrder": "تأكيد الطلب",
    "action.rateOrder": "تقييم الطلب",
    "action.call": "اتصال",
    "action.chat": "محادثة",
    "action.change": "تغيير",
    "action.skipForNow": "تخطي الآن",

    // Laundries Page
    "laundries.title": "مغسلة موجودة",
    "laundries.searchPlaceholder": "ابحث عن مغاسل...",
    "laundries.deliveringTo": "التوصيل إلى:",
    "laundries.currentLocation": "الموقع الحالي",
    "laundries.noResults": "لا توجد مغاسل",
    "laundries.noResultsDesc": "جرب تعديل البحث أو الفلاتر",
    "laundries.sortBy": "ترتيب حسب",
    "laundries.all": "الكل",
    "laundries.nearest": "الأقرب",
    "laundries.topRated": "الأعلى تقييماً",
    "laundries.fastest": "الأسرع",
    "laundries.priceLowHigh": "السعر: من الأقل للأعلى",

    // Order Page
    "order.checkout": "إتمام الطلب",
    "order.deliveryAddress": "عنوان التوصيل",
    "order.useCurrentLocation": "استخدم الموقع الحالي",
    "order.pickupSchedule": "جدول الاستلام",
    "order.pickupDate": "تاريخ الاستلام",
    "order.pickupTime": "وقت الاستلام",
    "order.deliverySchedule": "جدول التوصيل",
    "order.deliveryDate": "تاريخ التوصيل",
    "order.deliveryTime": "وقت التوصيل",
    "order.paymentMethod": "طريقة الدفع",
    "order.creditCard": "بطاقة ائتمان / مدى",
    "order.applePay": "Apple Pay / STC Pay",
    "order.cashOnDelivery": "الدفع عند الاستلام",
    "order.orderSummary": "ملخص الطلب",
    "order.subtotal": "المجموع الفرعي",
    "order.deliveryFee": "رسوم التوصيل",
    "order.total": "الإجمالي",

    // Order Tracking
    "tracking.orderStatus": "حالة الطلب",
    "tracking.estimatedDelivery": "التوصيل المتوقع",
    "tracking.today": "اليوم",
    "tracking.inProgress": "قيد التنفيذ",
    "tracking.laundryService": "خدمة الغسيل",
    "tracking.deliveryPartner": "شريك التوصيل",
    "tracking.onTheWay": "في الطريق",
    "tracking.orderDetails": "تفاصيل الطلب",
    "tracking.liveMap": "خريطة التتبع المباشر",

    // LaundryProfile
    "laundryProfile.services": "الخدمات",
    "laundryProfile.reviews": "التقييمات",
    "laundryProfile.item": "قطعة",
    "laundryProfile.items": "قطع",

    // Rating Page
    "rating.title": "قيّم طلبك",
    "rating.question": "كيف كانت تجربتك؟",
    "rating.tapToRate": "اضغط للتقييم",
    "rating.poor": "سيء",
    "rating.fair": "مقبول",
    "rating.good": "جيد",
    "rating.veryGood": "جيد جداً",
    "rating.excellent": "ممتاز!",
    "rating.feedbackLabel": "شاركنا تجربتك (اختياري)",
    "rating.feedbackPlaceholder": "أخبرنا ما أعجبك أو ما يمكننا تحسينه...",
    "rating.submit": "إرسال التقييم",
    "rating.thankYou": "شكراً على تقييمك!",
    "rating.submitted": "تم إرسال تقييمك بنجاح.",
    "rating.selectRating": "يرجى اختيار تقييم",

    // Profile Page
    "profile.addresses": "العناوين المحفوظة",
    "profile.payments": "طرق الدفع",
    "profile.favorites": "المفضلة",
    "profile.notifications": "الإشعارات",
    "profile.terms": "الشروط والأحكام",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("wash-off-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("wash-off-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    
    if (isRTL) {
      document.body.classList.add("font-arabic");
    } else {
      document.body.classList.remove("font-arabic");
    }
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
