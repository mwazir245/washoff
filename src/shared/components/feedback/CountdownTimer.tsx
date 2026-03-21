import { useEffect, useState } from "react";

interface CountdownTimerProps {
  totalMinutes: number;
  onExpire?: () => void;
}

const CountdownTimer = ({ totalMinutes, onExpire }: CountdownTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);

  useEffect(() => {
    setSecondsLeft(totalMinutes * 60);
  }, [totalMinutes]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const totalSeconds = Math.max(totalMinutes * 60, 1);
  const progress = secondsLeft / totalSeconds;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const circumference = 2 * Math.PI * 30;
  const offset = circumference * (1 - progress);

  const colorClass =
    progress <= 0.2
      ? "text-destructive stroke-destructive"
      : progress <= 0.5
        ? "text-warning stroke-warning"
        : "text-secondary stroke-secondary";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-3 py-2 backdrop-blur-sm">
      <div className="relative h-16 w-16 shrink-0">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
          <circle
            cx="36"
            cy="36"
            r="30"
            fill="none"
            className={colorClass}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${colorClass.split(" ")[0]}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">نافذة القبول</p>
        <p className="text-sm font-semibold text-foreground">الوقت المتبقي للمزود الحالي</p>
      </div>
    </div>
  );
};

export default CountdownTimer;
