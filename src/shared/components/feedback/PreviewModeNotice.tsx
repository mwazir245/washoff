import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewModeNoticeProps {
  title?: string;
  description: ReactNode;
  className?: string;
}

const PreviewModeNotice = ({
  title = "بيئة تشغيل تمهيدية جاهزة للتطوير",
  description,
  className,
}: PreviewModeNoticeProps) => {
  return (
    <div className={cn("surface-card-muted px-5 py-5 sm:px-6", className)}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="text-sm leading-7 text-muted-foreground">{description}</div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModeNotice;
