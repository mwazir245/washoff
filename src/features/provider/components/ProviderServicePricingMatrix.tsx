import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type {
  PlatformServiceCatalogAdminData,
} from "@/features/orders/application/contracts/platform-contracts";
import {
  ProviderServiceProposalStatus,
  type ProviderServiceOffering,
} from "@/features/orders/model/service";
import { cn } from "@/lib/utils";

interface ProviderServicePricingMatrixValue {
  enabled: boolean;
  price: string;
}

interface ProviderServicePricingMatrixProps {
  catalog: PlatformServiceCatalogAdminData;
  values: Record<string, ProviderServicePricingMatrixValue>;
  existingOfferings?: ProviderServiceOffering[];
  onToggle: (serviceId: string, enabled: boolean) => void;
  onPriceChange: (serviceId: string, price: string) => void;
  disabled?: boolean;
  helperText?: string;
}

const formatSarLabel = (value?: number) =>
  typeof value === "number" ? `${value.toFixed(2)} ر.س` : "غير محدد";

const toneClasses = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  default: "bg-muted/50 text-muted-foreground border-border/70",
} as const;

const resolveOfferingBadges = (offering?: ProviderServiceOffering) => {
  if (!offering) {
    return [];
  }

  const badges: Array<{ label: string; tone: keyof typeof toneClasses }> = [];

  if (offering.currentStatus === "active" && typeof offering.currentApprovedPriceSar === "number") {
    badges.push({ label: "نشط", tone: "success" });
  }

  if (offering.proposedStatus === ProviderServiceProposalStatus.PendingApproval) {
    badges.push({ label: "بانتظار الاعتماد", tone: "warning" });
  } else if (offering.proposedStatus === ProviderServiceProposalStatus.Rejected) {
    badges.push({ label: "مرفوض", tone: "danger" });
  }

  return badges;
};

const ProviderServicePricingMatrix = ({
  catalog,
  values,
  existingOfferings = [],
  onToggle,
  onPriceChange,
  disabled = false,
  helperText,
}: ProviderServicePricingMatrixProps) => {
  const offeringsByServiceId = new Map(existingOfferings.map((offering) => [offering.serviceId, offering]));

  return (
    <div className="space-y-4">
      {helperText ? <p className="text-sm leading-7 text-muted-foreground">{helperText}</p> : null}

      <div className="overflow-x-auto rounded-[1.4rem] border border-border/70 bg-white/90">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted/35">
            <tr>
              <th className="px-4 py-4 text-start font-semibold text-foreground">المنتج</th>
              {catalog.serviceTypes
                .filter((serviceType) => serviceType.active)
                .map((serviceType) => (
                  <th key={serviceType.id} className="min-w-[230px] px-4 py-4 text-start font-semibold text-foreground">
                    <div className="space-y-1">
                      <p>{serviceType.name.ar}</p>
                      <p className="text-xs font-medium text-muted-foreground">للقطعة الواحدة</p>
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {catalog.products
              .filter((product) => product.active)
              .map((product) => (
                <tr key={product.id} className="border-t border-border/70 align-top">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{product.name.ar}</p>
                      <p className="text-xs text-muted-foreground">خدمة موحدة ضمن كتالوج WashOff</p>
                    </div>
                  </td>
                  {catalog.serviceTypes
                    .filter((serviceType) => serviceType.active)
                    .map((serviceType) => {
                      const row = catalog.matrixRows.find(
                        (entry) =>
                          entry.productId === product.id &&
                          entry.serviceTypeId === serviceType.id,
                      );

                      if (!row || !row.isAvailable || !row.active) {
                        return (
                          <td key={`${product.id}-${serviceType.id}`} className="px-4 py-4">
                            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 text-xs font-medium text-muted-foreground">
                              غير متاح تشغيليًا
                            </div>
                          </td>
                        );
                      }

                      const offering = offeringsByServiceId.get(row.id);
                      const matrixValue = values[row.id] ?? {
                        enabled: Boolean(offering),
                        price:
                          offering?.proposedPriceSar?.toString() ??
                          offering?.currentApprovedPriceSar?.toString() ??
                          "",
                      };
                      const badges = resolveOfferingBadges(offering);

                      return (
                        <td key={row.id} className="px-4 py-4">
                          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4">
                            <label className="flex items-center gap-3">
                              <Checkbox
                                checked={matrixValue.enabled}
                                onCheckedChange={(checked) => onToggle(row.id, Boolean(checked))}
                                disabled={disabled}
                              />
                              <span className="font-medium text-foreground">تفعيل هذا العرض</span>
                            </label>

                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                السعر الاسترشادي: {formatSarLabel(row.suggestedPriceSar)}
                              </p>
                              {typeof offering?.currentApprovedPriceSar === "number" ? (
                                <p className="text-xs font-medium text-muted-foreground">
                                  السعر النشط الحالي: {formatSarLabel(offering.currentApprovedPriceSar)}
                                </p>
                              ) : null}
                              {typeof offering?.proposedPriceSar === "number" &&
                              offering.proposedStatus === ProviderServiceProposalStatus.PendingApproval ? (
                                <p className="text-xs font-medium text-warning">
                                  السعر المقترح: {formatSarLabel(offering.proposedPriceSar)}
                                </p>
                              ) : null}
                            </div>

                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={matrixValue.price}
                              onChange={(event) => onPriceChange(row.id, event.target.value)}
                              disabled={disabled || !matrixValue.enabled}
                              placeholder={row.suggestedPriceSar?.toFixed(2) ?? "0.00"}
                              className={cn(!matrixValue.enabled ? "opacity-70" : "")}
                            />

                            {badges.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {badges.map((badge) => (
                                  <span
                                    key={`${row.id}-${badge.label}`}
                                    className={cn(
                                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                      toneClasses[badge.tone],
                                    )}
                                  >
                                    {badge.label}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {offering?.rejectionReasonAr ? (
                              <p className="text-xs leading-6 text-destructive">
                                سبب الرفض: {offering.rejectionReasonAr}
                              </p>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProviderServicePricingMatrix;
