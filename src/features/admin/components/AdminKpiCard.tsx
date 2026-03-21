import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminKpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClasses: Record<NonNullable<AdminKpiCardProps["tone"]>, string> = {
  default: "bg-primary/8 text-primary border-primary/12",
  success: "bg-success/10 text-success border-success/15",
  warning: "bg-warning/12 text-warning border-warning/18",
  danger: "bg-destructive/10 text-destructive border-destructive/15",
};

const AdminKpiCard = ({
  title,
  value,
  description,
  icon,
  tone = "default",
}: AdminKpiCardProps) => {
  return (
    <div className="surface-card px-5 py-5 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="max-w-xs text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border bg-white/80 shadow-sm", toneClasses[tone])}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminKpiCard;
