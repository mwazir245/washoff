import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-10 text-center sm:px-8">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
