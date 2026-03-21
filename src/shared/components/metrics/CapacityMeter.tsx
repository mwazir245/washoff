import { formatNumber, formatPercent } from "@/shared/lib/formatters";

interface CapacityMeterProps {
  used: number;
  total: number;
  label?: string;
}

const CapacityMeter = ({ used, total, label }: CapacityMeterProps) => {
  const safeTotal = total <= 0 ? 1 : total;
  const ratio = Math.min(used / safeTotal, 1);
  const percentage = ratio * 100;

  const toneClass =
    percentage >= 90
      ? "from-destructive to-destructive/70"
      : percentage >= 70
        ? "from-warning to-warning/80"
        : "from-success to-secondary";

  return (
    <div className="w-full space-y-3">
      {label ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold text-foreground">
            {formatNumber(used)}/{formatNumber(total)} كجم
          </span>
        </div>
      ) : null}

      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full bg-gradient-to-l ${toneClass} transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>المتاح تشغيليًا الآن</span>
        <span>{formatPercent(ratio)}</span>
      </div>
    </div>
  );
};

export default CapacityMeter;
