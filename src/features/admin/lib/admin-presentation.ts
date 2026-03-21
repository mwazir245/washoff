import { AssignmentStatus } from "@/features/orders/model/assignment";

export const formatAdminDateTime = (value: string | undefined, language: "ar" | "en") => {
  if (!value) {
    return language === "en" ? "Not available" : "غير متاح";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ar-SA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatAdminDate = (value: string | undefined, language: "ar" | "en") => {
  if (!value) {
    return language === "en" ? "Not available" : "غير متاح";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

export const formatAdminCurrency = (value: number, language: "ar" | "en") => {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatAdminNumber = (value: number, language: "ar" | "en") => {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "ar-SA").format(value);
};

const assignmentStatusLabels = {
  ar: {
    [AssignmentStatus.PendingAcceptance]: "بانتظار رد المزوّد",
    [AssignmentStatus.Accepted]: "تم القبول",
    [AssignmentStatus.Rejected]: "مرفوض",
    [AssignmentStatus.Expired]: "انتهت المهلة",
    [AssignmentStatus.Cancelled]: "ملغي",
    [AssignmentStatus.Superseded]: "تم استبداله",
  },
  en: {
    [AssignmentStatus.PendingAcceptance]: "Pending provider response",
    [AssignmentStatus.Accepted]: "Accepted",
    [AssignmentStatus.Rejected]: "Rejected",
    [AssignmentStatus.Expired]: "Expired",
    [AssignmentStatus.Cancelled]: "Cancelled",
    [AssignmentStatus.Superseded]: "Superseded",
  },
} as const;

export const getAssignmentStatusLabel = (
  status: AssignmentStatus,
  language: "ar" | "en",
) => assignmentStatusLabels[language][status];
