import type { ActorRole, ISODateString } from "@/features/orders/model/common";

export enum OnboardingStatus {
  PendingApproval = "pending_approval",
  Approved = "approved",
  Rejected = "rejected",
  Suspended = "suspended",
}

export interface OnboardingReviewState {
  status: OnboardingStatus;
  submittedAt: ISODateString;
  reviewedAt?: ISODateString;
  reviewedByRole?: ActorRole | "system";
  reviewedById?: string;
  reviewNotesAr?: string;
}

export const onboardingStatusLabelsAr: Record<OnboardingStatus, string> = {
  [OnboardingStatus.PendingApproval]: "بانتظار الاعتماد",
  [OnboardingStatus.Approved]: "معتمد",
  [OnboardingStatus.Rejected]: "مرفوض",
  [OnboardingStatus.Suspended]: "موقوف",
};

export const isOnboardingApproved = (state: Pick<OnboardingReviewState, "status">) => {
  return state.status === OnboardingStatus.Approved;
};
