import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

const MetricCard = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  className,
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("surface-card px-5 py-5 sm:px-6", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                trendUp
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {trendUp ? "تحسن" : "تراجع"} {trend}
            </span>
          ) : (
            <p className="text-xs leading-6 text-muted-foreground">مؤشر حي محدث من طبقة التشغيل الحالية</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary shadow-sm">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
