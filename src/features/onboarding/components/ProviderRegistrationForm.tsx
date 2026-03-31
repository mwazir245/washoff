import { type FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ProviderServicePricingMatrix from "@/features/provider/components/ProviderServicePricingMatrix";
import HotelLocationPicker from "@/features/onboarding/components/HotelLocationPicker";
import type { PlatformServiceCatalogAdminData } from "@/features/orders/application";
import {
  PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS,
  PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES,
  PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  PROVIDER_REGISTRATION_SAUDI_CITIES_AR,
  providerWorkingDayLabelsAr,
  type ProviderRegistrationDocumentUploadInput,
  type ProviderRegistrationInput,
  type ProviderRegistrationSaudiCity,
  type ProviderWorkingDay,
} from "@/features/orders/model/provider";

interface ProviderRegistrationFormProps {
  catalog: PlatformServiceCatalogAdminData;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (input: ProviderRegistrationInput) => Promise<void> | void;
}

type StepKey = "basic" | "location" | "services" | "documents" | "account";

type FormState = {
  providerName: string;
  legalEntityName: string;
  commercialRegistrationNumber: string;
  taxRegistrationNumber: string;
  city: ProviderRegistrationSaudiCity | "";
  businessPhone: string;
  businessEmail: string;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  dailyCapacityKg: string;
  pickupLeadTimeHours: string;
  executionTimeHours: string;
  deliveryTimeHours: string;
  workingDays: ProviderWorkingDay[];
  workingHoursFrom: string;
  workingHoursTo: string;
  bankName: string;
  iban: string;
  bankAccountHolderName: string;
  accountFullName: string;
  accountPhone: string;
  accountEmail: string;
  notesAr: string;
};

type MatrixState = Record<string, { enabled: boolean; price: string }>;

const STEPS: Array<{ key: StepKey; title: string; description: string }> = [
  { key: "basic", title: "البيانات الأساسية", description: "بيانات المنشأة القانونية الأساسية." },
  { key: "location", title: "الموقع", description: "حدد موقع المغسلة وعنوانها التشغيلي." },
  { key: "services", title: "الخدمات والسعة", description: "اختر الخدمات القياسية وحدد أسعارك وسعتك التشغيلية." },
  { key: "documents", title: "المستندات", description: "أرفق السجل التجاري بصيغة واضحة." },
  { key: "account", title: "إعداد الحساب", description: "بيانات البنك ومسؤول الحساب." },
];

const INITIAL_STATE: FormState = {
  providerName: "",
  legalEntityName: "",
  commercialRegistrationNumber: "",
  taxRegistrationNumber: "",
  city: "",
  businessPhone: "",
  businessEmail: "",
  addressText: "",
  latitude: null,
  longitude: null,
  dailyCapacityKg: "",
  pickupLeadTimeHours: "",
  executionTimeHours: "",
  deliveryTimeHours: "",
  workingDays: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
  workingHoursFrom: "08:00",
  workingHoursTo: "22:00",
  bankName: "",
  iban: "",
  bankAccountHolderName: "",
  accountFullName: "",
  accountPhone: "",
  accountEmail: "",
  notesAr: "",
};

const ACCEPT_ATTRIBUTE = PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS.join(",");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const formatFileSize = (sizeBytes: number) =>
  sizeBytes >= 1024 * 1024 ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} م.ب` : `${Math.ceil(sizeBytes / 1024)} ك.ب`;

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("تعذر قراءة الملف المحدد."));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف المحدد."));
    reader.readAsDataURL(file);
  });

const buildUploadInput = async (file: File): Promise<ProviderRegistrationDocumentUploadInput> => ({
  fileName: file.name,
  mimeType: file.type || "application/octet-stream",
  sizeBytes: file.size,
  contentBase64: await readFileAsBase64(file),
});

const isAllowedDocumentType = (file: File) =>
  PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as never) ||
  PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS.some((extension) =>
    file.name.toLowerCase().endsWith(extension),
  );

const FieldLabel = ({
  children,
  required = false,
  optional = false,
}: {
  children: string;
  required?: boolean;
  optional?: boolean;
}) => (
  <label className="field-label flex items-center gap-2">
    <span>{children}</span>
    {required ? <span className="text-destructive">*</span> : null}
    {optional ? <span className="text-xs text-muted-foreground">(اختياري)</span> : null}
  </label>
);

const buildInitialMatrixState = (catalog: PlatformServiceCatalogAdminData): MatrixState =>
  Object.fromEntries(
    catalog.matrixRows
      .filter((row) => row.active && row.isAvailable)
      .map((row) => [row.id, { enabled: false, price: row.suggestedPriceSar?.toFixed(2) ?? "" }]),
  );

const ProviderRegistrationForm = ({
  catalog,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: ProviderRegistrationFormProps) => {
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);
  const [pricingState, setPricingState] = useState<MatrixState>(() => buildInitialMatrixState(catalog));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [commercialRegistrationDocument, setCommercialRegistrationDocument] = useState<{
    file: File | null;
    error?: string;
  }>({ file: null });

  const currentStep = STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);

  const selectedServicePricing = useMemo(
    () =>
      Object.entries(pricingState)
        .filter(([, value]) => value.enabled)
        .map(([serviceId, value]) => ({
          serviceId,
          proposedPriceSar: Number(value.price),
        })),
    [pricingState],
  );

  const updateField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setFormState((current) => ({ ...current, [key]: value }));
    setValidationMessage(null);
  };

  const toggleWorkingDay = (workingDay: ProviderWorkingDay, checked: boolean) =>
    updateField(
      "workingDays",
      checked
        ? Array.from(new Set([...formState.workingDays, workingDay]))
        : formState.workingDays.filter((current) => current !== workingDay),
    );

  const updateMatrixState = (serviceId: string, partial: Partial<{ enabled: boolean; price: string }>) => {
    setPricingState((current) => ({
      ...current,
      [serviceId]: {
        ...(current[serviceId] ?? { enabled: false, price: "" }),
        ...partial,
      },
    }));
    setValidationMessage(null);
  };

  const validateStep = (stepIndex: number) => {
    switch (STEPS[stepIndex]?.key) {
      case "basic":
        if (!formState.providerName.trim()) return "يرجى إدخال اسم المغسلة.";
        if (!formState.commercialRegistrationNumber.trim()) return "يرجى إدخال رقم السجل التجاري.";
        if (!formState.taxRegistrationNumber.trim()) return "يرجى إدخال الرقم الضريبي.";
        if (!formState.city) return "يرجى اختيار المدينة.";
        if (formState.businessPhone.replace(/[^0-9+]/g, "").length < 8)
          return "يرجى إدخال رقم جوال صالح للمنشأة.";
        if (!EMAIL_REGEX.test(formState.businessEmail.trim()))
          return "يرجى إدخال بريد إلكتروني صالح للمنشأة.";
        return null;
      case "location":
        if (!formState.addressText.trim()) return "يرجى إدخال العنوان التشغيلي للمغسلة.";
        if (typeof formState.latitude !== "number" || typeof formState.longitude !== "number")
          return "يرجى تحديد موقع المغسلة على الخريطة.";
        return null;
      case "services":
        if (selectedServicePricing.length === 0)
          return "اختر خدمة قياسية واحدة على الأقل وحدد لها سعرًا.";
        if (selectedServicePricing.some((entry) => !Number.isFinite(entry.proposedPriceSar) || entry.proposedPriceSar <= 0))
          return "يرجى إدخال سعر صالح وموجب لكل خدمة مفعلة.";
        if (!formState.dailyCapacityKg.trim() || Number(formState.dailyCapacityKg) <= 0)
          return "يرجى إدخال السعة اليومية بالكيلوجرام.";
        if (!formState.pickupLeadTimeHours.trim() || Number(formState.pickupLeadTimeHours) <= 0)
          return "يرجى إدخال زمن الاستلام بالساعات.";
        if (!formState.executionTimeHours.trim() || Number(formState.executionTimeHours) <= 0)
          return "يرجى إدخال زمن التنفيذ بالساعات.";
        if (!formState.deliveryTimeHours.trim() || Number(formState.deliveryTimeHours) <= 0)
          return "يرجى إدخال زمن التسليم بالساعات.";
        if (formState.workingDays.length === 0) return "يرجى اختيار يوم عمل واحد على الأقل.";
        if (!TIME_REGEX.test(formState.workingHoursFrom) || !TIME_REGEX.test(formState.workingHoursTo))
          return "يرجى تحديد ساعات العمل من وإلى بصيغة صحيحة.";
        return null;
      case "documents":
        if (!commercialRegistrationDocument.file) return "يجب إرفاق ملف السجل التجاري.";
        return commercialRegistrationDocument.error ?? null;
      case "account":
        if (!formState.bankName.trim()) return "يرجى إدخال اسم البنك.";
        if (!formState.iban.trim()) return "يرجى إدخال رقم الآيبان.";
        if (!formState.bankAccountHolderName.trim()) return "يرجى إدخال اسم صاحب الحساب.";
        if (!formState.accountFullName.trim()) return "يرجى إدخال اسم مسؤول الحساب.";
        if (formState.accountPhone.replace(/[^0-9+]/g, "").length < 8)
          return "يرجى إدخال رقم جوال صالح لمسؤول الحساب.";
        if (!EMAIL_REGEX.test(formState.accountEmail.trim()))
          return "يرجى إدخال بريد إلكتروني صالح لمسؤول الحساب.";
        return null;
      default:
        return null;
    }
  };

  const handleDocumentSelection = (file: File | null) => {
    if (!file) {
      setCommercialRegistrationDocument({ file: null });
      return;
    }

    if (!isAllowedDocumentType(file)) {
      setCommercialRegistrationDocument({ file: null, error: "الصيغ المسموحة: PDF, JPG, PNG." });
      return;
    }

    if (file.size > PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
      setCommercialRegistrationDocument({
        file: null,
        error: "الحد الأقصى لحجم الملف هو 5 ميجابايت.",
      });
      return;
    }

    setCommercialRegistrationDocument({ file });
    setValidationMessage(null);
  };

  const goNext = () => {
    const message = validateStep(currentStepIndex);

    if (message) {
      setValidationMessage(message);
      return;
    }

    setValidationMessage(null);
    setCurrentStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    for (let stepIndex = 0; stepIndex < STEPS.length; stepIndex += 1) {
      const message = validateStep(stepIndex);

      if (message) {
        setCurrentStepIndex(stepIndex);
        setValidationMessage(message);
        return;
      }
    }

    if (
      !commercialRegistrationDocument.file ||
      typeof formState.latitude !== "number" ||
      typeof formState.longitude !== "number"
    ) {
      setValidationMessage("يرجى استكمال المستندات وتحديد الموقع على الخريطة.");
      return;
    }

    try {
      setValidationMessage(null);
      await onSubmit({
        providerName: formState.providerName.trim(),
        legalEntityName: formState.legalEntityName.trim() || undefined,
        commercialRegistrationNumber: formState.commercialRegistrationNumber.trim(),
        taxRegistrationNumber: formState.taxRegistrationNumber.trim(),
        city: formState.city as ProviderRegistrationSaudiCity,
        businessPhone: formState.businessPhone.trim(),
        businessEmail: formState.businessEmail.trim(),
        addressText: formState.addressText.trim(),
        latitude: formState.latitude,
        longitude: formState.longitude,
        servicePricing: selectedServicePricing,
        dailyCapacityKg: Number(formState.dailyCapacityKg),
        pickupLeadTimeHours: Number(formState.pickupLeadTimeHours),
        executionTimeHours: Number(formState.executionTimeHours),
        deliveryTimeHours: Number(formState.deliveryTimeHours),
        workingDays: formState.workingDays,
        workingHoursFrom: formState.workingHoursFrom,
        workingHoursTo: formState.workingHoursTo,
        commercialRegistrationFile: await buildUploadInput(commercialRegistrationDocument.file),
        bankName: formState.bankName.trim(),
        iban: formState.iban.trim().toUpperCase(),
        bankAccountHolderName: formState.bankAccountHolderName.trim(),
        accountFullName: formState.accountFullName.trim(),
        accountPhone: formState.accountPhone.trim(),
        accountEmail: formState.accountEmail.trim(),
        notesAr: formState.notesAr.trim() || undefined,
      });
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : "تعذر تجهيز طلب تسجيل المزوّد.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <span className="section-kicker">الانضمام التشغيلي للمزوّدين</span>
        <div>
          <h2 className="text-2xl font-bold text-foreground">سجل المغسلة عبر كتالوج خدمات قياسي واضح</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            يجمع هذا النموذج بيانات المنشأة والموقع والسعة والمستندات، ثم يربط المزوّد بمصفوفة خدمات
            موحدة تديرها المنصة ليتم اعتماد الأسعار قبل المشاركة التشغيلية.
          </p>
        </div>
      </div>

      <div className="surface-card px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              الخطوة {currentStepIndex + 1} من {STEPS.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{currentStep.description}</p>
          </div>
          <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            {progressPercent}% مكتمل
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;

            return (
              <div key={step.key} className="flex min-w-[120px] flex-1 items-center gap-3">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground",
                  ].join(" ")}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                <p className="truncate text-sm font-semibold text-foreground">{step.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {validationMessage ?? errorMessage ? (
        <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
          {validationMessage ?? errorMessage}
        </div>
      ) : null}

      <section className="surface-card space-y-5 px-5 py-6 sm:px-7">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground">{currentStep.title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{currentStep.description}</p>
        </div>

        {currentStep.key === "basic" ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel required>اسم المغسلة</FieldLabel>
              <input className="field-input" value={formState.providerName} onChange={(event) => updateField("providerName", event.target.value)} />
            </div>
            <div>
              <FieldLabel optional>اسم المنشأة القانونية</FieldLabel>
              <input className="field-input" value={formState.legalEntityName} onChange={(event) => updateField("legalEntityName", event.target.value)} />
            </div>
            <div>
              <FieldLabel required>رقم السجل التجاري</FieldLabel>
              <input className="field-input" value={formState.commercialRegistrationNumber} onChange={(event) => updateField("commercialRegistrationNumber", event.target.value)} />
            </div>
            <div>
              <FieldLabel required>الرقم الضريبي</FieldLabel>
              <input className="field-input" value={formState.taxRegistrationNumber} onChange={(event) => updateField("taxRegistrationNumber", event.target.value)} />
            </div>
            <div>
              <FieldLabel required>المدينة</FieldLabel>
              <select className="field-input" value={formState.city} onChange={(event) => updateField("city", event.target.value as ProviderRegistrationSaudiCity | "")}>
                <option value="">اختر المدينة</option>
                {PROVIDER_REGISTRATION_SAUDI_CITIES_AR.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel required>رقم الجوال</FieldLabel>
              <input className="field-input" value={formState.businessPhone} onChange={(event) => updateField("businessPhone", event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel required>البريد الإلكتروني</FieldLabel>
              <input type="email" className="field-input" value={formState.businessEmail} onChange={(event) => updateField("businessEmail", event.target.value)} />
            </div>
          </div>
        ) : null}

        {currentStep.key === "location" ? (
          <div className="space-y-5">
            <HotelLocationPicker
              latitude={formState.latitude ?? undefined}
              longitude={formState.longitude ?? undefined}
              onChange={({ latitude, longitude }) => {
                updateField("latitude", latitude);
                updateField("longitude", longitude);
              }}
              title="حدد موقع المغسلة على الخريطة. سيتم استخدام الموقع لتسهيل التشغيل والاستلام."
              description="سنحاول تحديد موقعك الحالي تلقائيًا عند فتح هذه الخطوة، ويمكنك تعديل النقطة يدويًا بالضغط على الخريطة."
              locateButtonLabel="استخدام موقعي الحالي"
            />
            <div>
              <FieldLabel required>العنوان التشغيلي</FieldLabel>
              <textarea
                rows={4}
                className="field-textarea"
                placeholder="مثال: المنطقة الصناعية الثانية - الرياض"
                value={formState.addressText}
                onChange={(event) => updateField("addressText", event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {currentStep.key === "services" ? (
          <div className="space-y-6">
            <ProviderServicePricingMatrix
              catalog={catalog}
              values={pricingState}
              onToggle={(serviceId, enabled) => updateMatrixState(serviceId, { enabled })}
              onPriceChange={(serviceId, price) => updateMatrixState(serviceId, { price })}
              helperText="اختر فقط الخدمات القياسية التي تقدمها المغسلة، ثم أدخل سعرك المقترح لكل خدمة. ستبقى الأسعار المقترحة بانتظار الاعتماد قبل تفعيلها تشغيلّيًا."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel required>السعة اليومية (كجم)</FieldLabel>
                <input type="number" min="1" className="field-input" value={formState.dailyCapacityKg} onChange={(event) => updateField("dailyCapacityKg", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <FieldLabel required>زمن الاستلام (بالساعات)</FieldLabel>
                <input type="number" min="1" className="field-input" value={formState.pickupLeadTimeHours} onChange={(event) => updateField("pickupLeadTimeHours", event.target.value)} />
              </div>
              <div>
                <FieldLabel required>زمن التنفيذ (بالساعات)</FieldLabel>
                <input type="number" min="1" className="field-input" value={formState.executionTimeHours} onChange={(event) => updateField("executionTimeHours", event.target.value)} />
              </div>
              <div>
                <FieldLabel required>زمن التسليم (بالساعات)</FieldLabel>
                <input type="number" min="1" className="field-input" value={formState.deliveryTimeHours} onChange={(event) => updateField("deliveryTimeHours", event.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <FieldLabel required>أيام العمل</FieldLabel>
              <div className="grid gap-3 md:grid-cols-4">
                {Object.entries(providerWorkingDayLabelsAr).map(([workingDay, label]) => (
                  <label key={workingDay} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-4 text-sm font-medium text-foreground transition hover:border-primary/40">
                    <Checkbox
                      checked={formState.workingDays.includes(workingDay as ProviderWorkingDay)}
                      onCheckedChange={(value) => toggleWorkingDay(workingDay as ProviderWorkingDay, Boolean(value))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel required>من</FieldLabel>
                <input type="time" className="field-input" value={formState.workingHoursFrom} onChange={(event) => updateField("workingHoursFrom", event.target.value)} />
              </div>
              <div>
                <FieldLabel required>إلى</FieldLabel>
                <input type="time" className="field-input" value={formState.workingHoursTo} onChange={(event) => updateField("workingHoursTo", event.target.value)} />
              </div>
            </div>
          </div>
        ) : null}

        {currentStep.key === "documents" ? (
          <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
            <FieldLabel required>مرفق السجل التجاري</FieldLabel>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              أرفق نسخة واضحة من السجل التجاري. الصيغ المسموحة: PDF, JPG, PNG وبحد أقصى 5 ميجابايت.
            </p>
            <div className="mt-3 rounded-[1.1rem] border border-dashed border-primary/30 bg-primary/5 p-4">
              <label className="flex cursor-pointer flex-col gap-2 text-sm text-foreground">
                <div className="flex items-center gap-3 text-primary">
                  <UploadCloud className="h-5 w-5" />
                  <span className="font-semibold">اختر الملف أو استبدله</span>
                </div>
                <span className="text-muted-foreground">
                  الصيغ المسموحة: PDF, JPG, PNG. الحد الأقصى لحجم الملف هو 5 ميجابايت.
                </span>
                <input
                  type="file"
                  accept={ACCEPT_ATTRIBUTE}
                  className="sr-only"
                  onChange={(event) => handleDocumentSelection(event.target.files?.[0] ?? null)}
                />
              </label>
              {commercialRegistrationDocument.file ? (
                <div className="mt-4 rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm">
                  <p className="font-semibold text-foreground">{commercialRegistrationDocument.file.name}</p>
                  <p className="mt-1 text-muted-foreground">{formatFileSize(commercialRegistrationDocument.file.size)}</p>
                </div>
              ) : null}
              {commercialRegistrationDocument.error ? (
                <p className="mt-3 text-sm text-destructive">{commercialRegistrationDocument.error}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {currentStep.key === "account" ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-base font-bold text-foreground">البيانات البنكية</h4>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel required>اسم البنك</FieldLabel>
                  <input className="field-input" value={formState.bankName} onChange={(event) => updateField("bankName", event.target.value)} />
                </div>
                <div>
                  <FieldLabel required>رقم الآيبان</FieldLabel>
                  <input className="field-input ltr" value={formState.iban} onChange={(event) => updateField("iban", event.target.value.toUpperCase())} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel required>اسم صاحب الحساب</FieldLabel>
                  <input className="field-input" value={formState.bankAccountHolderName} onChange={(event) => updateField("bankAccountHolderName", event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-foreground">مسؤول الحساب</h4>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel required>الاسم</FieldLabel>
                  <input className="field-input" value={formState.accountFullName} onChange={(event) => updateField("accountFullName", event.target.value)} />
                </div>
                <div>
                  <FieldLabel required>رقم الجوال</FieldLabel>
                  <input className="field-input" value={formState.accountPhone} onChange={(event) => updateField("accountPhone", event.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel required>البريد الإلكتروني</FieldLabel>
                  <input type="email" className="field-input" value={formState.accountEmail} onChange={(event) => updateField("accountEmail", event.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel optional>ملاحظات إضافية</FieldLabel>
              <textarea rows={4} className="field-textarea" placeholder="أي تفاصيل إضافية تساعد فريق الاعتماد." value={formState.notesAr} onChange={(event) => updateField("notesAr", event.target.value)} />
            </div>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setValidationMessage(null);
            setCurrentStepIndex((current) => Math.max(current - 1, 0));
          }}
          disabled={currentStepIndex === 0 || isSubmitting}
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        <div className="flex flex-wrap gap-3">
          {currentStepIndex < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={isSubmitting}>
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جارٍ إرسال طلب التسجيل..." : "إرسال طلب التسجيل"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProviderRegistrationForm;
