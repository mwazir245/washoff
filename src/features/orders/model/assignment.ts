import type { ActorRole, ISODateString } from "@/features/orders/model/common";
import type { EligibilityResult, ScoreBreakdown } from "@/features/orders/model/matching";

export enum AssignmentStatus {
  PendingAcceptance = "pending_acceptance",
  Accepted = "accepted",
  Rejected = "rejected",
  Expired = "expired",
  Cancelled = "cancelled",
  Superseded = "superseded",
}

export enum ReassignmentReason {
  ProviderRejected = "provider_rejected",
  ProviderExpired = "provider_expired",
  CapacityUnavailable = "capacity_unavailable",
  SlaRisk = "sla_risk",
  QualityIssue = "quality_issue",
  AdminOverride = "admin_override",
}

export interface Assignment {
  id: string;
  orderId: string;
  hotelId: string;
  providerId: string;
  attemptNumber: number;
  status: AssignmentStatus;
  assignedAt: ISODateString;
  responseDueAt?: ISODateString;
  respondedAt?: ISODateString;
  acceptedAt?: ISODateString;
  scoreBreakdown: ScoreBreakdown;
  eligibilityResult: EligibilityResult;
}

export interface AssignmentHistory {
  id: string;
  assignmentId: string;
  orderId: string;
  providerId: string;
  attemptNumber: number;
  fromStatus?: AssignmentStatus;
  toStatus: AssignmentStatus;
  changedAt: ISODateString;
  actorRole: ActorRole;
  reasonAr?: string;
}

export interface ReassignmentEvent {
  id: string;
  orderId: string;
  previousAssignmentId?: string;
  previousProviderId?: string;
  nextProviderId?: string;
  reason: ReassignmentReason;
  actorRole: ActorRole;
  createdAt: ISODateString;
  notesAr?: string;
}

export const reassignmentReasonLabelsAr: Record<ReassignmentReason, string> = {
  [ReassignmentReason.ProviderRejected]: "رفض المزوّد الطلب",
  [ReassignmentReason.ProviderExpired]: "انتهت مهلة رد المزوّد",
  [ReassignmentReason.CapacityUnavailable]: "السعة لم تعد متاحة",
  [ReassignmentReason.SlaRisk]: "خطر على الالتزام بالـ SLA",
  [ReassignmentReason.QualityIssue]: "ملاحظة جودة تشغيليّة",
  [ReassignmentReason.AdminOverride]: "تدخل إداري",
};
