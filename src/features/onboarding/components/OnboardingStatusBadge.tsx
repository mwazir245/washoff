import { Badge } from "@/components/ui/badge";
import { OnboardingStatus, onboardingStatusLabelsAr } from "@/features/orders/model";

const statusClasses: Record<OnboardingStatus, string> = {
  [OnboardingStatus.PendingApproval]: "border-warning/25 bg-warning/10 text-warning",
  [OnboardingStatus.Approved]: "border-success/20 bg-success/10 text-success",
  [OnboardingStatus.Rejected]: "border-destructive/20 bg-destructive/10 text-destructive",
  [OnboardingStatus.Suspended]: "border-muted-foreground/20 bg-muted text-foreground",
};

interface OnboardingStatusBadgeProps {
  status: OnboardingStatus;
}

const OnboardingStatusBadge = ({ status }: OnboardingStatusBadgeProps) => {
  return (
    <Badge variant="outline" className={statusClasses[status]}>
      {onboardingStatusLabelsAr[status]}
    </Badge>
  );
};

export default OnboardingStatusBadge;
