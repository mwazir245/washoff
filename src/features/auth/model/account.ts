import type { AuditFields, ISODateString } from "@/features/orders/model/common";

export enum AccountRole {
  Hotel = "hotel",
  Provider = "provider",
  Admin = "admin",
}

export enum AccountStatus {
  PendingActivation = "pending_activation",
  Active = "active",
  Suspended = "suspended",
}

export enum LinkedEntityType {
  Hotel = "hotel",
  Provider = "provider",
  Admin = "admin",
}

export enum AccountActivationState {
  AwaitingApproval = "awaiting_approval",
  Ready = "ready",
  Activated = "activated",
}

export enum AccountTokenValidationStatus {
  Ready = "ready",
  Invalid = "invalid",
  Expired = "expired",
  Used = "used",
}

export enum PasswordResetState {
  Idle = "idle",
  Ready = "ready",
  Completed = "completed",
}

export enum IdentityEmailKind {
  Activation = "activation",
  PasswordReset = "password_reset",
}

export enum IdentityEmailDeliveryStatus {
  Sent = "sent",
  Retried = "retried",
  Failed = "failed",
}

export enum IdentityAuditEventType {
  AccountCreated = "account_created",
  ActivationIssued = "activation_issued",
  ActivationEmailSent = "activation_email_sent",
  ActivationEmailFailed = "activation_email_failed",
  AccountActivated = "account_activated",
  LoginSucceeded = "login_succeeded",
  LoginFailed = "login_failed",
  PasswordResetRequested = "password_reset_requested",
  PasswordResetEmailSent = "password_reset_email_sent",
  PasswordResetEmailFailed = "password_reset_email_failed",
  PasswordResetCompleted = "password_reset_completed",
  AccountSuspended = "account_suspended",
  AccountReactivated = "account_reactivated",
  Logout = "logout",
  SessionRevoked = "session_revoked",
}

export interface AccountActivationLifecycle {
  state: AccountActivationState;
  eligibleAt?: ISODateString;
  issuedAt?: ISODateString;
  tokenExpiresAt?: ISODateString;
  usedAt?: ISODateString;
  activatedAt?: ISODateString;
  activationPath?: string;
}

export interface AccountPasswordResetLifecycle {
  state: PasswordResetState;
  requestedAt?: ISODateString;
  issuedAt?: ISODateString;
  tokenExpiresAt?: ISODateString;
  usedAt?: ISODateString;
  completedAt?: ISODateString;
  resetPath?: string;
}

export interface AccountSuspensionLifecycle {
  suspendedAt?: ISODateString;
  suspendedByAccountId?: string;
  suspendedByRole?: AccountRole | "system";
  suspensionReasonAr?: string;
  reactivatedAt?: ISODateString;
  reactivatedByAccountId?: string;
  reactivatedByRole?: AccountRole | "system";
  reactivationReasonAr?: string;
}

export interface IdentityEmailDeliverySummary {
  kind: IdentityEmailKind;
  status: IdentityEmailDeliveryStatus;
  statusLabelAr: string;
  providerLabelAr: string;
  providerMessageId?: string;
  occurredAt: ISODateString;
  sentAt?: ISODateString;
  failedAt?: ISODateString;
  failureReasonAr?: string;
  outboxFilePath?: string;
  attemptCount?: number;
  retryCount?: number;
}

export interface AccountProfile extends AuditFields {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: AccountRole;
  status: AccountStatus;
  linkedEntityType?: LinkedEntityType;
  linkedHotelId?: string;
  linkedProviderId?: string;
  activation: AccountActivationLifecycle;
  passwordReset: AccountPasswordResetLifecycle;
  suspension: AccountSuspensionLifecycle;
  lastLoginAt?: ISODateString;
}

export interface StoredAccount extends AccountProfile {
  passwordSalt?: string;
  passwordHash?: string;
  activationTokenHash?: string;
  passwordResetTokenHash?: string;
}

export interface AccountSessionProfile {
  id: string;
  accountId: string;
  role: AccountRole;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  lastSeenAt?: ISODateString;
  revokedAt?: ISODateString;
  revokedReasonAr?: string;
  revokedByAccountId?: string;
  revokedByRole?: AccountRole | "system";
}

export interface StoredAccountSession extends AccountSessionProfile {
  tokenHash: string;
}

export interface AuthenticatedAccountSession {
  session: AccountSessionProfile;
  token: string;
  account: AccountProfile;
}

export interface AccountTokenValidationResult {
  status: AccountTokenValidationStatus;
  accountEmail?: string;
  accountFullName?: string;
  role?: AccountRole;
  linkedEntityType?: LinkedEntityType;
}

export interface IdentityAuditEvent {
  id: string;
  accountId?: string;
  sessionId?: string;
  type: IdentityAuditEventType;
  actorAccountId?: string;
  actorRole?: AccountRole | "system";
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  detailsAr?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODateString;
}

export const accountRoleLabelsAr: Record<AccountRole, string> = {
  [AccountRole.Hotel]: "فندق",
  [AccountRole.Provider]: "مزود خدمة",
  [AccountRole.Admin]: "إدارة",
};

export const accountStatusLabelsAr: Record<AccountStatus, string> = {
  [AccountStatus.PendingActivation]: "بانتظار التفعيل",
  [AccountStatus.Active]: "نشط",
  [AccountStatus.Suspended]: "موقوف",
};

export const accountActivationStateLabelsAr: Record<AccountActivationState, string> = {
  [AccountActivationState.AwaitingApproval]: "بانتظار اعتماد الجهة",
  [AccountActivationState.Ready]: "جاهز للتفعيل",
  [AccountActivationState.Activated]: "تم التفعيل",
};

export const passwordResetStateLabelsAr: Record<PasswordResetState, string> = {
  [PasswordResetState.Idle]: "لا يوجد طلب نشط",
  [PasswordResetState.Ready]: "جاهز لإعادة الضبط",
  [PasswordResetState.Completed]: "تمت إعادة الضبط",
};

export const accountTokenValidationStatusLabelsAr: Record<AccountTokenValidationStatus, string> = {
  [AccountTokenValidationStatus.Ready]: "صالح",
  [AccountTokenValidationStatus.Invalid]: "غير صالح",
  [AccountTokenValidationStatus.Expired]: "منتهي الصلاحية",
  [AccountTokenValidationStatus.Used]: "مستخدم مسبقًا",
};

export const identityEmailKindLabelsAr: Record<IdentityEmailKind, string> = {
  [IdentityEmailKind.Activation]: "رسالة تفعيل",
  [IdentityEmailKind.PasswordReset]: "رسالة إعادة ضبط كلمة المرور",
};

export const identityEmailDeliveryStatusLabelsAr: Record<IdentityEmailDeliveryStatus, string> = {
  [IdentityEmailDeliveryStatus.Sent]: "تم الإرسال",
  [IdentityEmailDeliveryStatus.Retried]: "تم الإرسال بعد إعادة المحاولة",
  [IdentityEmailDeliveryStatus.Failed]: "تعذر الإرسال",
};

export const identityAuditEventTypeLabelsAr: Record<IdentityAuditEventType, string> = {
  [IdentityAuditEventType.AccountCreated]: "تم إنشاء الحساب",
  [IdentityAuditEventType.ActivationIssued]: "تم إصدار رابط التفعيل",
  [IdentityAuditEventType.ActivationEmailSent]: "تم إرسال رسالة التفعيل",
  [IdentityAuditEventType.ActivationEmailFailed]: "تعذر إرسال رسالة التفعيل",
  [IdentityAuditEventType.AccountActivated]: "تم تفعيل الحساب",
  [IdentityAuditEventType.LoginSucceeded]: "تم تسجيل الدخول بنجاح",
  [IdentityAuditEventType.LoginFailed]: "فشل تسجيل الدخول",
  [IdentityAuditEventType.PasswordResetRequested]: "تم طلب إعادة ضبط كلمة المرور",
  [IdentityAuditEventType.PasswordResetEmailSent]: "تم إرسال رسالة إعادة الضبط",
  [IdentityAuditEventType.PasswordResetEmailFailed]: "تعذر إرسال رسالة إعادة الضبط",
  [IdentityAuditEventType.PasswordResetCompleted]: "تمت إعادة ضبط كلمة المرور",
  [IdentityAuditEventType.AccountSuspended]: "تم إيقاف الحساب",
  [IdentityAuditEventType.AccountReactivated]: "تمت إعادة تنشيط الحساب",
  [IdentityAuditEventType.Logout]: "تم تسجيل الخروج",
  [IdentityAuditEventType.SessionRevoked]: "تم إلغاء الجلسة",
};

export const isAccountOperationallyActive = (account: Pick<AccountProfile, "status">) => {
  return account.status === AccountStatus.Active;
};
