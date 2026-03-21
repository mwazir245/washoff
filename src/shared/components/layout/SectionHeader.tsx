import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  centered?: boolean;
}

const SectionHeader = ({
  title,
  description,
  eyebrow,
  action,
  className,
  centered = false,
}: SectionHeaderProps) => {
  return (
    <div
      className={cn(
        "section-header",
        centered ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <div className={cn("space-y-3", centered ? "mx-auto max-w-3xl" : "max-w-3xl")}>
        {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
        <div className="space-y-2">
          <h2 className="section-title">{title}</h2>
          {description ? <p className="section-copy">{description}</p> : null}
        </div>
      </div>
      {action ? <div className={cn("shrink-0", centered ? "mt-4" : "sm:mt-0")}>{action}</div> : null}
    </div>
  );
};

export default SectionHeader;
