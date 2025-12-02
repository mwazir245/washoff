import { Check, Circle } from "lucide-react";

interface OrderStatus {
  id: string;
  label: string;
  description: string;
  time?: string;
  completed: boolean;
  current: boolean;
}

interface OrderStatusTimelineProps {
  statuses: OrderStatus[];
}

const OrderStatusTimeline = ({ statuses }: OrderStatusTimelineProps) => {
  return (
    <div className="relative">
      {statuses.map((status, index) => (
        <div key={status.id} className="flex gap-4 pb-8 last:pb-0">
          {/* Line */}
          {index < statuses.length - 1 && (
            <div
              className={`absolute left-[15px] top-8 w-0.5 h-8 ${
                status.completed ? "bg-primary" : "bg-border"
              }`}
              style={{ top: `${index * 88 + 32}px` }}
            />
          )}
          
          {/* Icon */}
          <div className="relative z-10 flex-shrink-0">
            {status.completed ? (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            ) : status.current ? (
              <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
                <Circle className="h-3 w-3 fill-primary text-primary" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <Circle className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 pt-1">
            <div className="flex items-center justify-between">
              <h4
                className={`font-medium ${
                  status.completed || status.current
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {status.label}
              </h4>
              {status.time && (
                <span className="text-sm text-muted-foreground">{status.time}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{status.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderStatusTimeline;
