import { type FormEvent, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { ProviderRegistrationInput } from "@/features/orders/model/provider";
import type { ServiceCatalogItem } from "@/features/orders/model/service";

interface ProviderRegistrationFormProps {
  services: ServiceCatalogItem[];
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (input: ProviderRegistrationInput) => Promise<void> | void;
}

const ProviderRegistrationForm = ({
  services,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: ProviderRegistrationFormProps) => {
  const [providerName, setProviderName] = useState("");
  const [city, setCity] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dailyCapacityKg, setDailyCapacityKg] = useState(250);
  const [supportedServiceIds, setSupportedServiceIds] = useState<string[]>([]);
  const [notesAr, setNotesAr] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const toggleService = (serviceId: string) => {
    setSupportedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((value) => value !== serviceId)
        : [...current, serviceId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!providerName.trim()) {
      setValidationMessage("يرجى إدخال اسم المغسلة أو المزوّد.");
      return;
    }

    if (!city.trim()) {
      setValidationMessage("يرجى إدخال المدينة.");
      return;
    }

    if (!contactPersonName.trim()) {
      setValidationMessage("يرجى إدخال اسم مسؤول التواصل.");
      return;
    }

    if (!contactEmail.trim()) {
      setValidationMessage("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    if (!contactPhone.trim()) {
      setValidationMessage("يرجى إدخال رقم الجوال.");
      return;
    }

    if (supportedServiceIds.length === 0) {
      setValidationMessage("يرجى اختيار خدمة واحدة على الأقل.");
      return;
    }

    if (!Number.isFinite(dailyCapacityKg) || dailyCapacityKg <= 0) {
      setValidationMessage("يرجى إدخال سعة تشغيلية يومية صحيحة.");
      return;
    }

    setValidationMessage(null);

    await onSubmit({
      providerName,
      city,
      contactPersonName,
      contactEmail,
      contactPhone,
      supportedServiceIds,
      dailyCapacityKg,
      notesAr: notesAr.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <span className="section-kicker">انضمام مزوّد جديد</span>
        <div>
          <h2 className="text-2xl font-bold text-foreground">سجّل المغسلة وشارك بياناتك التشغيلية</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            يعتمد WashOff على مزودين معتمدين فقط. بعد التسجيل، تراجع الإدارة السعة والخدمات قبل إتاحة الظهور في محرك الإسناد.
          </p>
        </div>
      </div>

      {(validationMessage ?? errorMessage) ? (
        <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
          {validationMessage ?? errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="field-label">اسم المغسلة / المزوّد</label>
          <input className="field-input" value={providerName} onChange={(event) => setProviderName(event.target.value)} />
        </div>

        <div>
          <label className="field-label">المدينة</label>
          <input className="field-input" value={city} onChange={(event) => setCity(event.target.value)} />
        </div>

        <div>
          <label className="field-label">اسم مسؤول التواصل</label>
          <input
            className="field-input"
            value={contactPersonName}
            onChange={(event) => setContactPersonName(event.target.value)}
          />
        </div>

        <div>
          <label className="field-label">البريد الإلكتروني</label>
          <input
            type="email"
            className="field-input"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </div>

        <div>
          <label className="field-label">رقم الجوال</label>
          <input
            className="field-input"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </div>

        <div>
          <label className="field-label">السعة اليومية (كجم/يوم)</label>
          <input
            type="number"
            min={1}
            className="field-input"
            value={dailyCapacityKg}
            onChange={(event) => setDailyCapacityKg(Number(event.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="field-label">الخدمات المدعومة</label>
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service) => {
            const checked = supportedServiceIds.includes(service.id);

            return (
              <label
                key={service.id}
                className="flex items-start gap-3 rounded-[1.2rem] border border-border/80 bg-background/80 px-4 py-4 transition-colors hover:border-primary/20 hover:bg-primary/5"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleService(service.id)} className="mt-1" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{service.name.ar}</p>
                  <p className="text-xs leading-6 text-muted-foreground">
                    سعر مرجعي {service.defaultUnitPriceSar} ريال - زمن افتراضي {service.defaultTurnaroundHours} ساعة
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="field-label">ملاحظات إضافية</label>
        <textarea
          rows={4}
          className="field-textarea"
          placeholder="أضف أي ملاحظات تشغيلية تساعد الإدارة على تقييم السعة أو التغطية أو تجهيز الخدمة."
          value={notesAr}
          onChange={(event) => setNotesAr(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "جارٍ إرسال الطلب..." : "إرسال طلب التسجيل"}
        </Button>
      </div>
    </form>
  );
};

export default ProviderRegistrationForm;
