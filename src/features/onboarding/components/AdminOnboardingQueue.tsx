import { type ReactNode, useMemo, useState } from "react";
import { Building2, Factory, FileCheck2, MapPinned, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  HotelOnboardingSummary,
  ProviderOnboardingSummary,
} from "@/features/orders/application";
import { OnboardingStatus } from "@/features/orders/model";
import OnboardingDocumentDownloadButton from "@/features/onboarding/components/OnboardingDocumentDownloadButton";
import OnboardingStatusBadge from "@/features/onboarding/components/OnboardingStatusBadge";
import EmptyState from "@/shared/components/feedback/EmptyState";
import { formatDateTimeLabel } from "@/shared/lib/formatters";

type OnboardingEntity = HotelOnboardingSummary | ProviderOnboardingSummary;

interface AdminOnboardingQueueProps {
  title: string;
  description: string;
  entityType: "hotel" | "provider";
  entities: OnboardingEntity[];
  activeActionKey?: string;
  onApprove: (entityId: string, reviewNotesAr?: string) => Promise<unknown> | unknown;
  onReject: (entityId: string, reviewNotesAr?: string) => Promise<unknown> | unknown;
}

const isProviderEntity = (entity: OnboardingEntity): entity is ProviderOnboardingSummary => {
  return "supportedServiceNamesAr" in entity;
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold text-foreground">{value || "غير متوفر"}</p>
  </div>
);

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <div className="rounded-[1.25rem] border border-border/80 bg-background/80 p-4">
    <div className="mb-4 flex items-center gap-3">
      <div className="landing-icon-badge h-10 w-10 rounded-2xl">{icon}</div>
      <p className="text-sm font-bold text-foreground">{title}</p>
    </div>
    {children}
  </div>
);

const AdminOnboardingQueue = ({
  title,
  description,
  entityType,
  entities,
  activeActionKey,
  onApprove,
  onReject,
}: AdminOnboardingQueueProps) => {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const sortedEntities = useMemo(
    () =>
      entities.slice().sort((left, right) => {
        if (left.status === OnboardingStatus.PendingApproval && right.status !== OnboardingStatus.PendingApproval) {
          return -1;
        }

        if (right.status === OnboardingStatus.PendingApproval && left.status !== OnboardingStatus.PendingApproval) {
          return 1;
        }

        return right.submittedAt.localeCompare(left.submittedAt);
      }),
    [entities],
  );

  if (sortedEntities.length === 0) {
    return (
      <EmptyState
        title={`لا توجد طلبات ${entityType === "hotel" ? "فنادق" : "مزودين"} حالياً`}
        description="ستظهر هنا طلبات التسجيل الجديدة والجهات التي تمت مراجعتها عبر الإدارة."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4">
        {sortedEntities.map((entity) => {
          const approveKey = `${entityType}:${entity.id}:approve`;
          const rejectKey = `${entityType}:${entity.id}:reject`;
          const approveDisabled =
            entity.status === OnboardingStatus.Approved || activeActionKey === rejectKey;
          const rejectDisabled =
            entity.status === OnboardingStatus.Rejected || activeActionKey === approveKey;

          return (
            <article key={entity.id} className="surface-card px-6 py-6 sm:px-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1 space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="landing-icon-badge h-11 w-11 rounded-2xl">
                      {entityType === "hotel" ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        <Factory className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{entity.displayNameAr}</h3>
                        <OnboardingStatusBadge status={entity.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entity.city} - {formatDateTimeLabel(entity.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <SectionCard title="الحساب والتواصل" icon={<MessageSquareText className="h-5 w-5" />}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <DetailItem label="مسؤول التواصل" value={entity.contactPersonName} />
                        <DetailItem label="البريد الإلكتروني" value={entity.contactEmail} />
                        <DetailItem label="رقم الجوال" value={entity.contactPhone} />
                        <DetailItem label="حالة الاعتماد" value={entity.statusLabelAr} />
                        <DetailItem label="الحساب المرتبط" value={entity.accountEmail} />
                        <DetailItem label="حالة التفعيل" value={entity.activationStateLabelAr} />
                      </div>
                    </SectionCard>

                    {isProviderEntity(entity) ? (
                      <SectionCard title="ملخص المزوّد" icon={<Factory className="h-5 w-5" />}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <DetailItem label="السعة اليومية" value={`${entity.dailyCapacityKg} كجم / يوم`} />
                          <DetailItem
                            label="الخدمات المدعومة"
                            value={entity.supportedServiceNamesAr.join(" - ")}
                          />
                        </div>
                      </SectionCard>
                    ) : (
                      <>
                        <SectionCard title="البيانات الأساسية" icon={<Building2 className="h-5 w-5" />}>
                          <div className="grid gap-4 md:grid-cols-2">
                            <DetailItem label="الاسم القانوني" value={entity.legalEntityName} />
                            <DetailItem label="المدينة" value={entity.city} />
                            <DetailItem label="تصنيف الفندق" value={entity.hotelClassificationLabelAr} />
                            <DetailItem label="عدد الغرف" value={entity.roomCount} />
                            <DetailItem label="الرقم الضريبي" value={entity.taxRegistrationNumber} />
                            <DetailItem
                              label="رقم السجل التجاري"
                              value={entity.commercialRegistrationNumber}
                            />
                            <DetailItem label="الخدمات المتوقعة" value={entity.contractedServiceCount} />
                          </div>
                        </SectionCard>

                        <SectionCard title="الملف التشغيلي" icon={<ShieldCheck className="h-5 w-5" />}>
                          <div className="grid gap-4 md:grid-cols-2">
                            <DetailItem label="مستوى الخدمة" value={entity.serviceLevelLabelAr} />
                            <DetailItem label="ساعات التشغيل" value={entity.operatingHours} />
                            <DetailItem
                              label="استلام يومي"
                              value={entity.requiresDailyPickup ? "نعم" : "لا"}
                            />
                          </div>
                        </SectionCard>

                        <SectionCard title="الموقع واللوجستيات" icon={<MapPinned className="h-5 w-5" />}>
                          <div className="grid gap-4 md:grid-cols-2">
                            <DetailItem label="العنوان" value={entity.addressText} />
                            <DetailItem label="نقطة الاستلام" value={entity.pickupLocation} />
                            <DetailItem label="خط العرض" value={entity.latitude} />
                            <DetailItem label="خط الطول" value={entity.longitude} />
                            <DetailItem
                              label="منطقة تحميل"
                              value={entity.hasLoadingArea ? "متوفرة" : "غير متوفرة"}
                            />
                            <DetailItem label="ملاحظات الوصول" value={entity.accessNotes} />
                          </div>
                        </SectionCard>

                        <SectionCard title="المستندات والامتثال" icon={<FileCheck2 className="h-5 w-5" />}>
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <DetailItem
                                label="حالة التفويض"
                                value={entity.delegationStatusLabelAr}
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                                  السجل التجاري
                                </p>
                                <p className="mt-2 text-sm font-semibold text-foreground">
                                  {entity.commercialRegistrationFile.fileName}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {Math.ceil(entity.commercialRegistrationFile.sizeBytes / 1024)} ك.ب
                                </p>
                                <div className="mt-3">
                                  <OnboardingDocumentDownloadButton
                                    downloadPath={entity.commercialRegistrationFile.downloadPath}
                                    fileName={entity.commercialRegistrationFile.fileName}
                                  />
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                                  خطاب التفويض
                                </p>
                                {entity.delegationLetterFile ? (
                                  <>
                                    <p className="mt-2 text-sm font-semibold text-foreground">
                                      {entity.delegationLetterFile.fileName}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {Math.ceil(entity.delegationLetterFile.sizeBytes / 1024)} ك.ب
                                    </p>
                                    <div className="mt-3">
                                      <OnboardingDocumentDownloadButton
                                        downloadPath={entity.delegationLetterFile.downloadPath}
                                        fileName={entity.delegationLetterFile.fileName}
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <p className="mt-2 text-sm text-muted-foreground">لم يتم إرفاق خطاب تفويض.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </SectionCard>
                      </>
                    )}
                  </div>

                  {entity.notesAr || entity.reviewNotesAr ? (
                    <div className="accent-panel px-4 py-4 text-sm leading-7 text-muted-foreground">
                      {entity.notesAr ? <p>ملاحظات الجهة: {entity.notesAr}</p> : null}
                      {entity.reviewNotesAr ? <p>ملاحظات الإدارة: {entity.reviewNotesAr}</p> : null}
                    </div>
                  ) : null}
                </div>

                <div className="w-full max-w-[360px] space-y-4">
                  <div className="rounded-[1.25rem] border border-border/80 bg-background/80 p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <MessageSquareText className="h-4 w-4" />
                      <p className="text-sm font-semibold">ملاحظة داخلية</p>
                    </div>
                    <textarea
                      rows={4}
                      className="field-textarea mt-3 min-h-[110px]"
                      placeholder="أضف سبب الرفض أو أي ملاحظة داخلية مرتبطة بقرار الاعتماد."
                      value={reviewNotes[entity.id] ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [entity.id]: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="flex-1"
                      disabled={approveDisabled}
                      onClick={() => void onApprove(entity.id, reviewNotes[entity.id]?.trim() || undefined)}
                    >
                      {activeActionKey === approveKey ? "جارٍ الاعتماد..." : "اعتماد"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      disabled={rejectDisabled}
                      onClick={() => void onReject(entity.id, reviewNotes[entity.id]?.trim() || undefined)}
                    >
                      {activeActionKey === rejectKey ? "جارٍ الرفض..." : "رفض"}
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOnboardingQueue;
