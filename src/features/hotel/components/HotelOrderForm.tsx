import { type FormEvent, useMemo, useState } from "react";
import { CalendarClock, Package2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ServiceCatalogItem } from "@/features/orders/model/service";
import { formatDateTimeLabel, formatSar } from "@/shared/lib/formatters";

interface HotelOrderFormProps {
  services: ServiceCatalogItem[];
  isSubmitting?: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (input: {
    serviceIds: string[];
    itemCount: number;
    pickupAt: string;
    notes: string;
  }) => Promise<void> | void;
}

const buildDefaultPickupAt = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const HotelOrderForm = ({
  services,
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSubmit,
}: HotelOrderFormProps) => {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [itemCount, setItemCount] = useState(50);
  const [pickupAt, setPickupAt] = useState(buildDefaultPickupAt);
  const [notes, setNotes] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [selectedServiceIds, services],
  );

  const estimatedPrice = useMemo(() => {
    return itemCount * selectedServices.reduce((sum, service) => sum + service.defaultUnitPriceSar, 0);
  }, [itemCount, selectedServices]);

  const pickupPreview = useMemo(() => {
    const parsed = new Date(pickupAt);
    return Number.isNaN(parsed.getTime()) ? "يرجى تحديد موعد صالح" : formatDateTimeLabel(parsed.toISOString());
  }, [pickupAt]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedServiceIds.length === 0) {
      setValidationMessage("اختر خدمة واحدة على الأقل قبل إرسال الطلب.");
      return;
    }

    if (itemCount <= 0) {
      setValidationMessage("أدخل كمية صحيحة أكبر من صفر.");
      return;
    }

    if (!pickupAt || Number.isNaN(new Date(pickupAt).getTime())) {
      setValidationMessage("يرجى إدخال موعد استلام صالح.");
      return;
    }

    if (new Date(pickupAt).getTime() <= Date.now()) {
      setValidationMessage("يجب أن يكون موعد الاستلام في المستقبل.");
      return;
    }

    setValidationMessage(null);

    await onSubmit({
      serviceIds: selectedServiceIds,
      itemCount,
      pickupAt,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card overflow-hidden">
      <div className="grid gap-0 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <span className="section-kicker">إنشاء طلب جديد</span>
              <div>
                <h3 className="text-2xl font-bold text-foreground">أدخل متطلبات الطلب ودع النظام يخصص أفضل مزود</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  لا يحتاج الفندق إلى اختيار مزود الخدمة يدويًا. بمجرد اعتماد الخدمات والكمية وموعد
                  الاستلام، يطبق النظام قواعد المطابقة الحالية ويحدد أفضل مزود متاح.
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="self-start rounded-full px-3 py-1.5">
              مطابقة تلقائية فقط
            </Badge>
          </div>

          {(validationMessage ?? errorMessage) ? (
            <div className="mb-6 rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
              {validationMessage ?? errorMessage}
            </div>
          ) : null}

          <div className="space-y-6">
            <div>
              <label className="field-label">الخدمات المطلوبة</label>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => {
                  const selected = selectedServiceIds.includes(service.id);

                  return (
                    <button
                      key={service.id}
                      type="button"
                      data-selected={selected}
                      onClick={() => {
                        setValidationMessage(null);
                        setSelectedServiceIds((current) =>
                          current.includes(service.id)
                            ? current.filter((value) => value !== service.id)
                            : [...current, service.id],
                        );
                      }}
                      className={[
                        "rounded-[1.35rem] border px-4 py-4 text-right transition-all",
                        selected
                          ? "border-secondary/35 bg-secondary/8 shadow-sm"
                          : "border-border/80 bg-background/70 hover:border-secondary/25 hover:bg-secondary/5",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{service.name.ar}</p>
                          <p className="mt-1 text-xs leading-6 text-muted-foreground">
                            {formatSar(service.defaultUnitPriceSar)} لكل كجم
                          </p>
                        </div>
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            selected ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
                          ].join(" ")}
                        >
                          {selected ? "محدد" : "إضافة"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="field-help">اختر الخدمة أو مجموعة الخدمات التي يجب أن يحتويها الطلب الواحد.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="field-label">الكمية التقديرية (كجم)</label>
                <input
                  type="number"
                  min={1}
                  value={itemCount}
                  onChange={(event) => {
                    setValidationMessage(null);
                    setItemCount(Number(event.target.value));
                  }}
                  className="field-input"
                />
                <p className="field-help">تستخدم الكمية لتقدير التكلفة وفحص السعة المتاحة لدى المزودين.</p>
              </div>

              <div>
                <label className="field-label">موعد الاستلام المطلوب</label>
                <input
                  type="datetime-local"
                  value={pickupAt}
                  onChange={(event) => {
                    setValidationMessage(null);
                    setPickupAt(event.target.value);
                  }}
                  className="field-input"
                />
                <p className="field-help">يتحقق النظام من دعم المزودين لنافذة الاستلام قبل الإسناد.</p>
              </div>
            </div>

            <div>
              <label className="field-label">ملاحظات تشغيلية</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => {
                  setValidationMessage(null);
                  setNotes(event.target.value);
                }}
                placeholder="أضف تعليمات خاصة بالتجهيز أو أولوية التسليم أو شروط المعالجة."
                className="field-textarea"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
              <Button type="submit" disabled={selectedServiceIds.length === 0 || itemCount <= 0 || isSubmitting}>
                {isSubmitting ? "جارٍ تشغيل المطابقة الذكية..." : "إرسال الطلب"}
              </Button>
            </div>
          </div>
        </div>

        <aside className="border-t border-border/70 bg-muted/35 px-6 py-6 sm:px-8 xl:border-r xl:border-t-0">
          <div className="space-y-5">
            <div className="rounded-[1.35rem] border border-secondary/15 bg-secondary/5 p-5">
              <div className="flex items-center gap-2 text-secondary">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-semibold">سياسة الطلب</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                لا يمكن اختيار مزود الخدمة يدويًا من هذه الشاشة. النظام يطبق قواعد الأهلية والتقييم
                الحالية ثم يخصص المزود الأنسب تلقائيًا.
              </p>
            </div>

            <div className="surface-card-muted px-5 py-5">
              <div className="mb-4 flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <p className="font-semibold">ملخص الطلب</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">الخدمات المحددة</span>
                  <span className="font-semibold text-foreground">{selectedServices.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">التكلفة التقديرية</span>
                  <span className="font-semibold text-foreground">{formatSar(estimatedPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">الكمية</span>
                  <span className="font-semibold text-foreground">{itemCount} كجم</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">الاستلام المطلوب</span>
                  <span className="max-w-[13rem] text-left font-semibold text-foreground">
                    {pickupPreview}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-border/80 bg-background/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Package2 className="h-5 w-5" />
                <p className="font-semibold">الخدمات المختارة</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedServices.length > 0 ? (
                  selectedServices.map((service) => (
                    <Badge key={service.id} variant="outline" className="rounded-full px-3 py-1.5">
                      {service.name.ar}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-muted-foreground">لم يتم تحديد خدمات بعد.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-border/80 bg-background/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <CalendarClock className="h-5 w-5" />
                <p className="font-semibold">تجربة التنفيذ</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                بعد الإرسال ستظهر لك نتيجة الإسناد مباشرة: المزود المعين، مهلة الرد، أو أسباب التعذر
                إن لم تتوفر سعة أو أهلية كافية.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
};

export default HotelOrderForm;
