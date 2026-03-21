import { type FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import HotelLocationPicker from "@/features/onboarding/components/HotelLocationPicker";
import {
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS,
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES,
  HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES,
  HOTEL_REGISTRATION_SAUDI_CITIES_AR,
  hotelClassificationLabelsAr,
  hotelServiceLevelLabelsAr,
  type HotelRegistrationDocumentUploadInput,
  type HotelRegistrationInput,
  type HotelRegistrationSaudiCity,
} from "@/features/orders/model/hotel";

interface HotelRegistrationFormProps {
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (input: HotelRegistrationInput) => Promise<void> | void;
}

type StepKey = "basic" | "operational" | "location" | "documents" | "contact";

interface RegistrationDocumentState {
  file: File | null;
  error?: string;
}

interface HotelRegistrationFormState {
  hotelName: string;
  legalEntityName: string;
  city: HotelRegistrationSaudiCity | "";
  hotelClassification: keyof typeof hotelClassificationLabelsAr;
  roomCount: string;
  taxRegistrationNumber: string;
  commercialRegistrationNumber: string;
  serviceLevel: keyof typeof hotelServiceLevelLabelsAr;
  operatingHours: string;
  requiresDailyPickup: "yes" | "no" | "";
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  pickupLocation: string;
  hasLoadingArea: "yes" | "no" | "";
  accessNotes: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  notesAr: string;
}

const FORM_STEPS: Array<{ key: StepKey; title: string; description: string }> = [
  {
    key: "basic",
    title: "البيانات الأساسية",
    description: "عرّف الفندق والبيانات النظامية الأساسية التي يحتاجها فريق الاعتماد.",
  },
  {
    key: "operational",
    title: "الملف التشغيلي",
    description: "حدد مستوى الخدمة وساعات التشغيل واحتياج الفندق للاستلام اليومي.",
  },
  {
    key: "location",
    title: "الموقع واللوجستيات",
    description: "حدد موقع الفندق على الخريطة وأضف عنوانه وملاحظات الوصول والاستلام.",
  },
  {
    key: "documents",
    title: "المستندات",
    description: "أرفق المستندات النظامية المطلوبة لمراجعة طلب الانضمام.",
  },
  {
    key: "contact",
    title: "الحساب ووسائل التواصل",
    description: "بيانات الشخص المسؤول الذي سيتابع التفعيل والتواصل التشغيلي.",
  },
];

const INITIAL_FORM_STATE: HotelRegistrationFormState = {
  hotelName: "",
  legalEntityName: "",
  city: "",
  hotelClassification: "four_star",
  roomCount: "",
  taxRegistrationNumber: "",
  commercialRegistrationNumber: "",
  serviceLevel: "standard",
  operatingHours: "",
  requiresDailyPickup: "",
  addressText: "",
  latitude: null,
  longitude: null,
  pickupLocation: "",
  hasLoadingArea: "",
  accessNotes: "",
  contactPersonName: "",
  contactEmail: "",
  contactPhone: "",
  notesAr: "",
};

const ACCEPT_ATTRIBUTE = HOTEL_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS.join(",");

const formatFileSize = (sizeBytes: number) => {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(2)} م.ب`;
  }

  return `${Math.ceil(sizeBytes / 1024)} ك.ب`;
};

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("تعذر قراءة الملف المحدد."));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("تعذر قراءة الملف المحدد."));
    reader.readAsDataURL(file);
  });

const isAllowedDocumentType = (file: File) => {
  if (HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as never)) {
    return true;
  }

  const normalizedName = file.name.toLowerCase();
  return HOTEL_REGISTRATION_ALLOWED_DOCUMENT_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
};

const buildUploadInput = async (file: File): Promise<HotelRegistrationDocumentUploadInput> => ({
  fileName: file.name,
  mimeType: file.type || "application/octet-stream",
  sizeBytes: file.size,
  contentBase64: await readFileAsBase64(file),
});

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const validatePhone = (value: string) => value.replace(/[^0-9+]/g, "").length >= 8;

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

const StepIndicator = ({
  stepIndex,
  currentStepIndex,
  title,
}: {
  stepIndex: number;
  currentStepIndex: number;
  title: string;
}) => {
  const isCompleted = stepIndex < currentStepIndex;
  const isActive = stepIndex === currentStepIndex;

  return (
    <div className="flex min-w-[120px] flex-1 items-center gap-3">
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
        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepIndex + 1}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      </div>
    </div>
  );
};

const DocumentUploadCard = ({
  title,
  description,
  required = false,
  document,
  onChange,
}: {
  title: string;
  description: string;
  required?: boolean;
  document: RegistrationDocumentState;
  onChange: (file: File | null) => void;
}) => (
  <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
    <FieldLabel required={required}>{title}</FieldLabel>
    <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
    <div className="mt-3 rounded-[1.1rem] border border-dashed border-primary/30 bg-primary/5 p-4">
      <label className="flex cursor-pointer flex-col gap-2 text-sm text-foreground">
        <div className="flex items-center gap-3 text-primary">
          <UploadCloud className="h-5 w-5" />
          <span className="font-semibold">اختر ملفًا أو استبدل الملف الحالي</span>
        </div>
        <span className="text-muted-foreground">
          الصيغ المسموحة: PDF, JPG, PNG. الحد الأقصى لحجم الملف هو 5 ميجابايت.
        </span>
        <input
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {document.file ? (
        <div className="mt-4 rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">{document.file.name}</p>
          <p className="mt-1 text-muted-foreground">{formatFileSize(document.file.size)}</p>
        </div>
      ) : null}
      {document.error ? <p className="mt-3 text-sm text-destructive">{document.error}</p> : null}
    </div>
  </div>
);

const ChoicePills = <Value extends string>({
  value,
  onChange,
  options,
}: {
  value: Value | "";
  onChange: (nextValue: Value) => void;
  options: Array<{ value: Value; label: string }>;
}) => (
  <div className="mt-3 flex flex-wrap gap-3">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className={[
          "rounded-full border px-4 py-2 text-sm font-semibold transition",
          value === option.value
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground hover:border-primary/50",
        ].join(" ")}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const HotelRegistrationForm = ({
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: HotelRegistrationFormProps) => {
  const [formState, setFormState] = useState<HotelRegistrationFormState>(INITIAL_FORM_STATE);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [commercialRegistrationDocument, setCommercialRegistrationDocument] =
    useState<RegistrationDocumentState>({ file: null });
  const [delegationLetterDocument, setDelegationLetterDocument] = useState<RegistrationDocumentState>({
    file: null,
  });

  const currentStep = FORM_STEPS[currentStepIndex];
  const progressPercent = useMemo(
    () => Math.round(((currentStepIndex + 1) / FORM_STEPS.length) * 100),
    [currentStepIndex],
  );

  const updateField = <Key extends keyof HotelRegistrationFormState>(
    key: Key,
    value: HotelRegistrationFormState[Key],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
    setValidationMessage(null);
  };

  const handleDocumentSelection = (
    setter: (state: RegistrationDocumentState) => void,
    file: File | null,
  ) => {
    if (!file) {
      setter({ file: null });
      return;
    }

    if (!isAllowedDocumentType(file)) {
      setter({ file: null, error: "الصيغ المسموحة: PDF, JPG, PNG." });
      return;
    }

    if (file.size > HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
      setter({ file: null, error: "الحد الأقصى لحجم الملف هو 5 ميجابايت." });
      return;
    }

    setter({ file });
    setValidationMessage(null);
  };

  const resolveStepValidationMessage = (stepIndex: number) => {
    switch (FORM_STEPS[stepIndex]?.key) {
      case "basic":
        if (!formState.hotelName.trim()) {
          return "يرجى إدخال اسم الفندق.";
        }
        if (!formState.city) {
          return "يرجى اختيار المدينة.";
        }
        if (!formState.roomCount.trim() || Number(formState.roomCount) <= 0) {
          return "يرجى إدخال عدد الغرف بقيمة صحيحة.";
        }
        if (!formState.taxRegistrationNumber.trim()) {
          return "يرجى إدخال الرقم الضريبي.";
        }
        if (!formState.commercialRegistrationNumber.trim()) {
          return "يرجى إدخال رقم السجل التجاري.";
        }
        return null;
      case "operational":
        if (!formState.operatingHours.trim()) {
          return "يرجى إدخال ساعات التشغيل.";
        }
        if (!formState.requiresDailyPickup) {
          return "يرجى تحديد ما إذا كان الفندق يحتاج إلى استلام يومي.";
        }
        return null;
      case "location":
        if (!formState.addressText.trim()) {
          return "يرجى إدخال العنوان.";
        }
        if (typeof formState.latitude !== "number" || typeof formState.longitude !== "number") {
          return "يرجى تحديد موقع الفندق على الخريطة.";
        }
        if (!formState.hasLoadingArea) {
          return "يرجى تحديد ما إذا كانت هناك منطقة تحميل.";
        }
        return null;
      case "documents": {
        if (!commercialRegistrationDocument.file) {
          return "يجب إرفاق ملف السجل التجاري.";
        }

        const totalDocumentsSize =
          (commercialRegistrationDocument.file?.size ?? 0) +
          (delegationLetterDocument.file?.size ?? 0);

        if (totalDocumentsSize > HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES) {
          return "الحد الأقصى لإجمالي مرفقات التسجيل هو 10 ميجابايت.";
        }

        return commercialRegistrationDocument.error ?? delegationLetterDocument.error ?? null;
      }
      case "contact":
        if (!formState.contactPersonName.trim()) {
          return "يرجى إدخال اسم مسؤول التواصل.";
        }
        if (!validateEmail(formState.contactEmail)) {
          return "يرجى إدخال بريد إلكتروني صالح.";
        }
        if (!validatePhone(formState.contactPhone)) {
          return "يرجى إدخال رقم جوال صالح.";
        }
        return null;
      default:
        return null;
    }
  };

  const handleNextStep = () => {
    const nextValidationMessage = resolveStepValidationMessage(currentStepIndex);
    if (nextValidationMessage) {
      setValidationMessage(nextValidationMessage);
      return;
    }

    setValidationMessage(null);
    setCurrentStepIndex((current) => Math.min(current + 1, FORM_STEPS.length - 1));
  };

  const handlePreviousStep = () => {
    setValidationMessage(null);
    setCurrentStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const finalValidationMessage = resolveStepValidationMessage(currentStepIndex);
    if (finalValidationMessage) {
      setValidationMessage(finalValidationMessage);
      return;
    }

    if (!commercialRegistrationDocument.file) {
      setValidationMessage("يجب إرفاق ملف السجل التجاري.");
      return;
    }

    if (typeof formState.latitude !== "number" || typeof formState.longitude !== "number") {
      setValidationMessage("يرجى تحديد موقع الفندق على الخريطة.");
      return;
    }

    try {
      setValidationMessage(null);
      await onSubmit({
        hotelName: formState.hotelName.trim(),
        legalEntityName: formState.legalEntityName.trim() || undefined,
        city: formState.city as HotelRegistrationSaudiCity,
        hotelClassification: formState.hotelClassification,
        roomCount: Number(formState.roomCount),
        taxRegistrationNumber: formState.taxRegistrationNumber.trim(),
        commercialRegistrationNumber: formState.commercialRegistrationNumber.trim(),
        serviceLevel: formState.serviceLevel,
        operatingHours: formState.operatingHours.trim(),
        requiresDailyPickup: formState.requiresDailyPickup === "yes",
        addressText: formState.addressText.trim(),
        latitude: formState.latitude,
        longitude: formState.longitude,
        pickupLocation: formState.pickupLocation.trim() || undefined,
        hasLoadingArea: formState.hasLoadingArea === "yes",
        accessNotes: formState.accessNotes.trim() || undefined,
        commercialRegistrationFile: await buildUploadInput(commercialRegistrationDocument.file),
        delegationLetterFile: delegationLetterDocument.file
          ? await buildUploadInput(delegationLetterDocument.file)
          : undefined,
        contactPersonName: formState.contactPersonName.trim(),
        contactEmail: formState.contactEmail.trim(),
        contactPhone: formState.contactPhone.trim(),
        notesAr: formState.notesAr.trim() || undefined,
      });
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : "تعذر تجهيز طلب التسجيل.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <span className="section-kicker">الانضمام التشغيلي للفنادق</span>
        <div>
          <h2 className="text-2xl font-bold text-foreground">سجل الفندق بخطوات واضحة ومتدرجة</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            يجمع هذا النموذج البيانات النظامية والتشغيلية الأساسية التي يحتاجها فريق WashOff
            لمراجعة الفندق قبل فتح الوصول التشغيلي.
          </p>
        </div>
      </div>

      <div className="surface-card px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              الخطوة {currentStepIndex + 1} من {FORM_STEPS.length}
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
          {FORM_STEPS.map((step, index) => (
            <StepIndicator
              key={step.key}
              stepIndex={index}
              currentStepIndex={currentStepIndex}
              title={step.title}
            />
          ))}
        </div>
      </div>

      {(validationMessage ?? errorMessage) ? (
        <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
          {validationMessage ?? errorMessage}
        </div>
      ) : null}

      <section className="surface-card px-5 py-6 sm:px-7">
        <div className="mb-5 space-y-1">
          <h3 className="text-xl font-bold text-foreground">{currentStep.title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{currentStep.description}</p>
        </div>

        {currentStep.key === "basic" ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel required>اسم الفندق</FieldLabel>
              <input
                className="field-input"
                value={formState.hotelName}
                onChange={(event) => updateField("hotelName", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel optional>الاسم القانوني للجهة</FieldLabel>
              <input
                className="field-input"
                value={formState.legalEntityName}
                onChange={(event) => updateField("legalEntityName", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>المدينة</FieldLabel>
              <select
                className="field-input"
                value={formState.city}
                onChange={(event) =>
                  updateField("city", event.target.value as HotelRegistrationSaudiCity | "")
                }
              >
                <option value="">اختر المدينة</option>
                {HOTEL_REGISTRATION_SAUDI_CITIES_AR.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>تصنيف الفندق</FieldLabel>
              <select
                className="field-input"
                value={formState.hotelClassification}
                onChange={(event) =>
                  updateField(
                    "hotelClassification",
                    event.target.value as HotelRegistrationFormState["hotelClassification"],
                  )
                }
              >
                {Object.entries(hotelClassificationLabelsAr).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>عدد الغرف</FieldLabel>
              <input
                type="number"
                min="1"
                className="field-input"
                value={formState.roomCount}
                onChange={(event) => updateField("roomCount", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel required>الرقم الضريبي</FieldLabel>
              <input
                className="field-input"
                value={formState.taxRegistrationNumber}
                onChange={(event) => updateField("taxRegistrationNumber", event.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel required>رقم السجل التجاري</FieldLabel>
              <input
                className="field-input"
                value={formState.commercialRegistrationNumber}
                onChange={(event) => updateField("commercialRegistrationNumber", event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {currentStep.key === "operational" ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel required>مستوى الخدمة</FieldLabel>
              <select
                className="field-input"
                value={formState.serviceLevel}
                onChange={(event) =>
                  updateField(
                    "serviceLevel",
                    event.target.value as HotelRegistrationFormState["serviceLevel"],
                  )
                }
              >
                {Object.entries(hotelServiceLevelLabelsAr).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>ساعات التشغيل</FieldLabel>
              <input
                className="field-input"
                placeholder="مثال: 24/7 أو 06:00 - 23:00"
                value={formState.operatingHours}
                onChange={(event) => updateField("operatingHours", event.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel required>هل يحتاج الفندق إلى استلام يومي؟</FieldLabel>
              <ChoicePills
                value={formState.requiresDailyPickup}
                onChange={(value) =>
                  updateField(
                    "requiresDailyPickup",
                    value as HotelRegistrationFormState["requiresDailyPickup"],
                  )
                }
                options={[
                  { value: "yes", label: "نعم" },
                  { value: "no", label: "لا" },
                ]}
              />
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
            />

            <div>
              <FieldLabel required>العنوان التفصيلي</FieldLabel>
              <textarea
                rows={4}
                className="field-textarea"
                value={formState.addressText}
                onChange={(event) => updateField("addressText", event.target.value)}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel optional>نقطة الاستلام إذا كانت مختلفة</FieldLabel>
                <input
                  className="field-input"
                  value={formState.pickupLocation}
                  onChange={(event) => updateField("pickupLocation", event.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>هل توجد منطقة تحميل؟</FieldLabel>
                <ChoicePills
                  value={formState.hasLoadingArea}
                  onChange={(value) =>
                    updateField("hasLoadingArea", value as HotelRegistrationFormState["hasLoadingArea"])
                  }
                  options={[
                    { value: "yes", label: "نعم" },
                    { value: "no", label: "لا" },
                  ]}
                />
              </div>
            </div>

            <div>
              <FieldLabel optional>ملاحظات الوصول</FieldLabel>
              <textarea
                rows={4}
                className="field-textarea"
                placeholder="أوقات الدخول، البوابة المناسبة، تعليمات الأمن..."
                value={formState.accessNotes}
                onChange={(event) => updateField("accessNotes", event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {currentStep.key === "documents" ? (
          <div className="space-y-5">
            <DocumentUploadCard
              title="مرفق السجل التجاري"
              required
              description="هذا المرفق مطلوب لإثبات الصفة النظامية للفندق. الصيغ المسموحة: PDF, JPG, PNG."
              document={commercialRegistrationDocument}
              onChange={(file) => handleDocumentSelection(setCommercialRegistrationDocument, file)}
            />

            <DocumentUploadCard
              title="مرفق خطاب التفويض"
              description="خطاب رسمي من الفندق يفوض المستخدم باستخدام منصة WashOff. هذا الحقل اختياري في التسجيل الحالي."
              document={delegationLetterDocument}
              onChange={(file) => handleDocumentSelection(setDelegationLetterDocument, file)}
            />

            <p className="text-sm leading-7 text-muted-foreground">
              الحد الأقصى لحجم الملف هو 5 ميجابايت لكل مرفق، وبحد أقصى 10 ميجابايت لإجمالي
              مرفقات التسجيل.
            </p>
          </div>
        ) : null}

        {currentStep.key === "contact" ? (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel required>اسم مسؤول التواصل</FieldLabel>
                <input
                  className="field-input"
                  value={formState.contactPersonName}
                  onChange={(event) => updateField("contactPersonName", event.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>البريد الإلكتروني</FieldLabel>
                <input
                  type="email"
                  className="field-input"
                  value={formState.contactEmail}
                  onChange={(event) => updateField("contactEmail", event.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>رقم الجوال</FieldLabel>
                <input
                  className="field-input"
                  value={formState.contactPhone}
                  onChange={(event) => updateField("contactPhone", event.target.value)}
                />
              </div>
            </div>

            <div>
              <FieldLabel optional>ملاحظات إضافية</FieldLabel>
              <textarea
                rows={4}
                className="field-textarea"
                placeholder="أي تفاصيل إضافية تساعد فريق الاعتماد."
                value={formState.notesAr}
                onChange={(event) => updateField("notesAr", event.target.value)}
              />
            </div>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStepIndex === 0 || isSubmitting}
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>

        <div className="flex flex-wrap gap-3">
          {currentStepIndex < FORM_STEPS.length - 1 ? (
            <Button type="button" onClick={handleNextStep} disabled={isSubmitting}>
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

export default HotelRegistrationForm;
