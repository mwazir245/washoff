import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Grid2X2, PackageCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PlatformServiceTypeCode,
  type ServiceCatalogItem,
} from "@/features/orders/model/service";
import { formatDateTimeLabel, formatSar } from "@/shared/lib/formatters";

interface HotelOrderFormProps {
  services: ServiceCatalogItem[];
  isSubmitting?: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (input: {
    roomNumber: string;
    items: Array<{
      serviceId: string;
      quantity: number;
    }>;
    pickupAt: string;
    notes: string;
  }) => Promise<void> | void;
}

interface HotelCatalogProductRow {
  id: string;
  nameAr: string;
  minimumPriceSar: number;
  servicesByType: Partial<Record<PlatformServiceTypeCode, ServiceCatalogItem>>;
}

const HOTEL_SERVICE_COLUMN_ORDER = [
  PlatformServiceTypeCode.Iron,
  PlatformServiceTypeCode.WashAndIron,
  PlatformServiceTypeCode.DryClean,
] as const;

const HOTEL_SERVICE_COLUMN_LABELS: Record<(typeof HOTEL_SERVICE_COLUMN_ORDER)[number], string> = {
  [PlatformServiceTypeCode.Iron]: "كوي",
  [PlatformServiceTypeCode.WashAndIron]: "غسيل وكوي",
  [PlatformServiceTypeCode.DryClean]: "غسيل جاف",
};

const buildDefaultPickupAt = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
};

const buildCanonicalServiceCatalog = (services: ServiceCatalogItem[]) => {
  return services
    .filter(
      (service) =>
        service.active &&
        service.isAvailable !== false &&
        Boolean(service.productId) &&
        Boolean(service.productName?.ar) &&
        Boolean(service.serviceType) &&
        Boolean(service.serviceTypeName?.ar) &&
        (service.operationalProviderCount ?? 0) > 0,
    )
    .sort((left, right) => {
      const productComparison = (left.productName?.ar ?? "").localeCompare(right.productName?.ar ?? "", "ar");

      if (productComparison !== 0) {
        return productComparison;
      }

      return (
        HOTEL_SERVICE_COLUMN_ORDER.indexOf(left.serviceType ?? PlatformServiceTypeCode.Iron) -
        HOTEL_SERVICE_COLUMN_ORDER.indexOf(right.serviceType ?? PlatformServiceTypeCode.Iron)
      );
    });
};

const HotelOrderForm = ({
  services,
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSubmit,
}: HotelOrderFormProps) => {
  const [roomNumber, setRoomNumber] = useState("");
  const [pickupAt, setPickupAt] = useState(buildDefaultPickupAt);
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [quantityByServiceId, setQuantityByServiceId] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const canonicalServices = useMemo(() => buildCanonicalServiceCatalog(services), [services]);

  const serviceById = useMemo(
    () => new Map(canonicalServices.map((service) => [service.id, service])),
    [canonicalServices],
  );

  const productRows = useMemo<HotelCatalogProductRow[]>(() => {
    const productMap = new Map<string, HotelCatalogProductRow>();

    canonicalServices.forEach((service) => {
      if (!service.productId || !service.productName?.ar || !service.serviceType) {
        return;
      }

      const current = productMap.get(service.productId);

      if (current) {
        current.servicesByType[service.serviceType] = service;
        current.minimumPriceSar = Math.min(current.minimumPriceSar, service.defaultUnitPriceSar);
        return;
      }

      productMap.set(service.productId, {
        id: service.productId,
        nameAr: service.productName.ar,
        minimumPriceSar: service.defaultUnitPriceSar,
        servicesByType: {
          [service.serviceType]: service,
        },
      });
    });

    return Array.from(productMap.values()).sort((left, right) => left.nameAr.localeCompare(right.nameAr, "ar"));
  }, [canonicalServices]);

  const filteredProductRows = useMemo(() => {
    const normalizedSearch = productSearch.trim();

    if (!normalizedSearch) {
      return productRows;
    }

    return productRows.filter((product) => product.nameAr.includes(normalizedSearch));
  }, [productRows, productSearch]);

  useEffect(() => {
    setQuantityByServiceId((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([serviceId]) => serviceById.has(serviceId)),
      ),
    );
  }, [serviceById]);

  const selectedItems = useMemo(() => {
    return Object.entries(quantityByServiceId)
      .map(([serviceId, quantityValue]) => ({
        serviceId,
        quantity: Number(quantityValue),
        service: serviceById.get(serviceId),
      }))
      .filter(
        (item): item is { serviceId: string; quantity: number; service: ServiceCatalogItem } =>
          Boolean(item.service) && Number.isFinite(item.quantity) && item.quantity > 0,
      );
  }, [quantityByServiceId, serviceById]);

  const totalSelectedQuantity = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems],
  );

  const estimatedPrice = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity * item.service.defaultUnitPriceSar, 0),
    [selectedItems],
  );

  const pickupPreview = useMemo(() => {
    const parsed = new Date(pickupAt);
    return Number.isNaN(parsed.getTime()) ? "يرجى تحديد موعد صالح" : formatDateTimeLabel(parsed.toISOString());
  }, [pickupAt]);

  const updateQuantity = (serviceId: string, rawValue: string) => {
    const normalizedValue = rawValue.replace(/[^\d]/g, "");
    setValidationMessage(null);
    setQuantityByServiceId((current) => ({
      ...current,
      [serviceId]: normalizedValue,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (canonicalServices.length === 0) {
      setValidationMessage("لا توجد خدمات تشغيلية معتمدة ومتاحة حاليًا لطلبها من لوحة الفندق.");
      return;
    }

    if (!roomNumber.trim()) {
      setValidationMessage("يرجى إدخال رقم الغرفة قبل إرسال الطلب.");
      return;
    }

    if (selectedItems.length === 0) {
      setValidationMessage("أدخل كمية لخدمة واحدة على الأقل قبل إرسال الطلب.");
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
      roomNumber: roomNumber.trim(),
      items: selectedItems.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
      })),
      pickupAt,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card overflow-hidden">
      <div className="grid gap-0 xl:grid-cols-[1.5fr_0.78fr]">
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <span className="section-kicker">إدخال طلب تشغيلي</span>
              <div>
                <h3 className="text-2xl font-bold text-foreground">أنشئ الطلب بسرعة حسب الغرفة ثم أدخل كميات القطع مباشرة من المصفوفة</h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                  يعتمد هذا النموذج على كتالوج WashOff التشغيلي القياسي فقط. تظهر لك المنتجات وأنواع الخدمة المتاحة
                  فعليًا والتي تملك عروضًا معتمدة ونشطة من المزوّدين.
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="self-start rounded-full px-3 py-1.5">
              إسناد تلقائي
            </Badge>
          </div>

          {(validationMessage ?? errorMessage) ? (
            <div className="mb-6 rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm leading-7 text-destructive">
              {validationMessage ?? errorMessage}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label">رقم الغرفة</label>
              <Input
                value={roomNumber}
                onChange={(event) => {
                  setValidationMessage(null);
                  setRoomNumber(event.target.value);
                }}
                placeholder="مثال: 1208"
                className="field-input"
              />
              <p className="field-help">رقم الغرفة هو المعرّف التشغيلي الأساسي للطلب داخل الفندق.</p>
            </div>

            <div>
              <label className="field-label">موعد الاستلام المطلوب</label>
              <Input
                type="datetime-local"
                value={pickupAt}
                onChange={(event) => {
                  setValidationMessage(null);
                  setPickupAt(event.target.value);
                }}
                className="field-input"
              />
              <p className="field-help">يُستخدم الموعد عند احتساب أهلية المزوّد والاستجابة التشغيلية.</p>
            </div>
          </div>

          <div className="mt-5">
            <label className="field-label">ملاحظات تشغيلية</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => {
                setValidationMessage(null);
                setNotes(event.target.value);
              }}
              placeholder="أضف أي تعليمات خاصة بالتجهيز أو أولوية التسليم أو ملاحظات للقسم التشغيلي."
              className="field-textarea"
            />
          </div>

          <div className="mt-6 rounded-[1.35rem] border border-border/70 bg-white/80 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">مصفوفة المنتجات والخدمات</p>
                <p className="text-sm leading-7 text-muted-foreground">
                  أدخل الكمية لكل منتج ونوع خدمة. ترتيب الأعمدة ثابت داخل الفندق: كوي، غسيل وكوي، غسيل جاف.
                </p>
              </div>

              <div className="w-full lg:max-w-xs">
                <label className="field-label">البحث عن منتج</label>
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="ابحث باسم المنتج"
                  className="field-input"
                />
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-border/70 bg-background">
              <div className="max-h-[430px] overflow-auto">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow className="bg-muted/35 hover:bg-muted/35">
                      <TableHead className="min-w-[180px] text-start text-xs font-semibold tracking-[0.08em]">
                        المنتج
                      </TableHead>
                      {HOTEL_SERVICE_COLUMN_ORDER.map((serviceType) => (
                        <TableHead
                          key={serviceType}
                          data-testid={`hotel-order-column-${serviceType}`}
                          className="min-w-[185px] text-start text-xs font-semibold tracking-[0.08em]"
                        >
                          {HOTEL_SERVICE_COLUMN_LABELS[serviceType]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductRows.length > 0 ? (
                      filteredProductRows.map((product) => (
                        <TableRow key={product.id} className="align-top">
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{product.nameAr}</p>
                              <p className="text-xs leading-6 text-muted-foreground">
                                يبدأ السعر المرجعي من {formatSar(product.minimumPriceSar)}
                              </p>
                            </div>
                          </TableCell>

                          {HOTEL_SERVICE_COLUMN_ORDER.map((serviceType) => {
                            const service = product.servicesByType[serviceType];

                            if (!service) {
                              return (
                                <TableCell key={`${product.id}-${serviceType}`} className="align-middle text-center">
                                  <span className="text-sm text-muted-foreground">—</span>
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell key={service.id} className="align-top">
                                <div className="space-y-2 rounded-[1rem] border border-border/70 bg-muted/20 p-3">
                                  <label htmlFor={`hotel-order-quantity-${service.id}`} className="block text-xs font-semibold text-foreground">
                                    {HOTEL_SERVICE_COLUMN_LABELS[serviceType]}
                                  </label>
                                  <Input
                                    id={`hotel-order-quantity-${service.id}`}
                                    data-testid={`hotel-order-quantity-${service.id}`}
                                    inputMode="numeric"
                                    min={0}
                                    value={quantityByServiceId[service.id] ?? ""}
                                    onChange={(event) => updateQuantity(service.id, event.target.value)}
                                    placeholder="0"
                                    className="field-input h-11"
                                  />
                                  <p className="text-[11px] leading-5 text-muted-foreground">
                                    مرجع تشغيلي {formatSar(service.defaultUnitPriceSar)} للقطعة
                                  </p>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} className="px-6 py-8 text-center text-sm leading-7 text-muted-foreground">
                          لا توجد منتجات مطابقة للبحث الحالي.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جارٍ تشغيل المطابقة الذكية..." : "إرسال الطلب"}
            </Button>
          </div>
        </div>

        <aside className="border-t border-border/70 bg-muted/35 px-6 py-6 sm:px-8 xl:border-r xl:border-t-0">
          <div className="space-y-5">
            <div className="rounded-[1.35rem] border border-secondary/15 bg-secondary/5 p-5">
              <div className="flex items-center gap-2 text-secondary">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-semibold">سياسة الإسناد</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                يتم إسناد الطلب تلقائيًا لأفضل مزوّد خدمة مؤهل وفق السعة والتشغيل. لا يحتاج الفندق إلى اختيار
                المزوّد يدويًا من هذه الشاشة.
              </p>
            </div>

            <div className="surface-card-muted px-5 py-5">
              <div className="mb-4 flex items-center gap-2 text-primary">
                <PackageCheck className="h-5 w-5" />
                <p className="font-semibold">ملخص الطلب</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">رقم الغرفة</span>
                  <span className="font-semibold text-foreground">{roomNumber.trim() || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">المنتجات المختارة</span>
                  <span className="font-semibold text-foreground">{selectedItems.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">إجمالي القطع</span>
                  <span className="font-semibold text-foreground">{totalSelectedQuantity}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">السعر المرجعي</span>
                  <span className="font-semibold text-foreground">{formatSar(estimatedPrice)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">موعد الاستلام</span>
                  <span className="max-w-[13rem] text-left font-semibold text-foreground">{pickupPreview}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-border/80 bg-background/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Grid2X2 className="h-5 w-5" />
                <p className="font-semibold">العناصر المدرجة</p>
              </div>
              <div className="mt-4 space-y-3">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <div
                      key={item.serviceId}
                      className="flex items-start justify-between gap-3 rounded-[1rem] border border-border/70 bg-muted/30 px-3 py-3"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{item.service.productName?.ar ?? item.service.name.ar}</p>
                        <p className="text-xs leading-6 text-muted-foreground">
                          {item.service.serviceTypeName?.ar ?? item.service.name.ar}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{item.quantity} قطعة</p>
                        <p className="text-xs leading-6 text-muted-foreground">
                          {formatSar(item.quantity * item.service.defaultUnitPriceSar)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-muted-foreground">لم يتم إدخال أي كميات بعد.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-border/80 bg-background/80 p-5">
              <div className="flex items-center gap-2 text-primary">
                <CalendarClock className="h-5 w-5" />
                <p className="font-semibold">معلومة تشغيلية</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                يعتمد الطلب على المصفوفة القياسية نفسها التي تديرها الإدارة ويستخدم فقط التركيبات التي يملك
                المزوّدون عليها عروضًا معتمدة ونشطة.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
};

export default HotelOrderForm;
