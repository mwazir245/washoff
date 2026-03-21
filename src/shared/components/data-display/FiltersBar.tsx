import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FiltersBarProps {
  title: string;
  description?: string;
  summary?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const FiltersBar = ({ title, description, summary, actions, children, className }: FiltersBarProps) => {
  return (
    <section className={cn("surface-card px-6 py-6 sm:px-8", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {description ? <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p> : null}
          {summary ? <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{summary}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">{children}</div>
    </section>
  );
};

export default FiltersBar;
