import {
  AccountRole,
  IdentityEmailDeliveryStatus,
  accountActivationStateLabelsAr,
  identityEmailDeliveryStatusLabelsAr,
  IdentityAuditEventType,
  accountRoleLabelsAr,
  accountStatusLabelsAr,
  type IdentityAuditEvent,
  type IdentityEmailDeliverySummary,
  type LinkedEntityType,
} from "@/features/auth/model";
import type { PlatformLanguage } from "@/features/content/model/platform-content";
import {
  type ActivityItem,
  type ActivateAccountCommand,
  type AdvanceProviderOrderExecutionCommand,
  type AdminDashboardData,
  type AccountAdminSummary,
  type AdminOnboardingData,
  type AdminKpi,
  type ApproveHotelRegistrationCommand,
  type ApproveProviderRegistrationCommand,
  type ApproveProviderServicePricingCommand,
  type ApproveProviderServicePricingResult,
  type AssignProviderCommand,
  type AssignProviderPreview,
  type AuthSessionResult,
  type CalculateAdminKpisResult,
  type CurrentAccountSessionResult,
  type CreateHotelOrderCommand,
  type ConfirmHotelOrderCompletionCommand,
  type FetchMatchingTransparencyResult,
  type GetAdminFinanceDataResult,
  type GetAdminFinancePageCommand,
  type GetAdminFinancePageResult,
  type GetHotelBillingDataResult,
  type GetPlatformServiceCatalogAdminResult,
  type GetPlatformPageContentCommand,
  type GetProviderPricingAdminDataResult,
  type GetProviderFinanceDataResult,
  type GetProviderServiceManagementResult,
  type HotelBillingData,
  type HotelRegistrationResult,
  type HotelDashboardData,
  type IdentityAdminData,
  type ListPlatformContentAuditResult,
  type ListPlatformContentEntriesResult,
  type ListAdminOrdersPageCommand,
  type ListAdminOrdersPageResult,
  type ListPlatformSettingsAuditResult,
  type LoginCommand,
  type MatchingTransparencyEntry,
  type MatchingTransparencyOrder,
  type MonthlyOrdersDataPoint,
  type ProviderDashboardData,
  type ProviderFinanceData,
  type ProviderPricingAdminData,
  type ProviderRegistrationResult,
  type ProviderRank,
  type ReactivateAccountCommand,
  type ReactivateAccountResult,
  type RejectProviderServicePricingCommand,
  type RejectProviderServicePricingResult,
  type RegistrationLinkedAccountSummary,
  type RegisterHotelCommand,
  type RegisterProviderCommand,
  type ResendActivationCommand,
  type ResendActivationResult,
  type ReassignmentActivityItem,
  type RequestPasswordResetCommand,
  type RequestPasswordResetResult,
  type RejectHotelRegistrationCommand,
  type RejectProviderRegistrationCommand,
  type ResetPasswordCommand,
  type ResetPasswordResult,
  type RunMatchingCommand,
  type RunMatchingResult,
  type StatusBreakdownDataPoint,
  type SubmitProviderServicePricingCommand,
  type SubmitProviderServicePricingResult,
  type SuspendAccountCommand,
  type SuspendAccountResult,
  type MarkHotelInvoiceCollectedCommand,
  type MarkHotelInvoiceCollectedResult,
  type MarkProviderStatementPaidCommand,
  type MarkProviderStatementPaidResult,
  type RejectAssignmentCommand,
  type ExpireAssignmentCommand,
  type AutoReassignOrderCommand,
  type UpdatePlatformServiceMatrixCommand,
  type UpdatePlatformServiceMatrixResult,
  type UpdatePlatformContentEntryCommand,
  type UpdatePlatformSettingsCommand,
  type UpsertPlatformProductCommand,
  type UpsertPlatformProductResult,
  type ValidateActivationTokenCommand,
  type ValidateActivationTokenResult,
  type ValidateResetPasswordTokenCommand,
  type ValidateResetPasswordTokenResult,
} from "@/features/orders/application/contracts/platform-contracts";
import type { WashoffPlatformRepository } from "@/features/orders/application/ports/washoff-platform-repository";
import {
  AssignmentStatus,
  MatchingDecision,
  canTransitionOrderStatus,
  hotelClassificationLabelsAr,
  hotelDelegationStatusLabelsAr,
  hotelServiceLevelLabelsAr,
  matchingDecisionLabelsAr,
  onboardingStatusLabelsAr,
  providerWorkingDayLabelsAr,
  providerExecutableOrderStatuses,
  reassignmentReasonLabelsAr,
  isOnboardingApproved,
  type LaundryOrder,
  OrderStatus,
  type ProviderProfile,
} from "@/features/orders/model";
import type {
  PlatformContentEntry,
  PlatformPageContent,
} from "@/features/content/model/platform-content";
import type {
  PlatformRuntimeStatus,
  PlatformSettings,
} from "@/features/platform-settings/model/platform-settings";
import { getOrderStatusMeta } from "@/features/orders/model/order-status";
import type { ServiceCatalogItem } from "@/features/orders/model/service";
import { matchProvidersForOrder } from "@/features/orders/services";
import { formatDurationLabel, formatPercent, formatSar } from "@/shared/lib/formatters";

export interface WashoffPlatformApplicationService {
  login(command: LoginCommand): Promise<AuthSessionResult>;
  activateAccount(command: ActivateAccountCommand): Promise<AuthSessionResult>;
  validateActivationToken(command: ValidateActivationTokenCommand): Promise<ValidateActivationTokenResult>;
  requestPasswordReset(command: RequestPasswordResetCommand): Promise<RequestPasswordResetResult>;
  resendActivationEmail(command: ResendActivationCommand): Promise<ResendActivationResult>;
  validateResetPasswordToken(
    command: ValidateResetPasswordTokenCommand,
  ): Promise<ValidateResetPasswordTokenResult>;
  resetPassword(command: ResetPasswordCommand): Promise<ResetPasswordResult>;
  logout(sessionToken?: string): Promise<void>;
  getCurrentAccountSession(): Promise<CurrentAccountSessionResult | null>;
  getServiceCatalog(hotelId?: string): Promise<ServiceCatalogItem[]>;
  getPlatformServiceCatalogAdminData(): Promise<GetPlatformServiceCatalogAdminResult>;
  upsertPlatformProduct(command: UpsertPlatformProductCommand): Promise<UpsertPlatformProductResult>;
  updatePlatformServiceMatrix(
    command: UpdatePlatformServiceMatrixCommand,
  ): Promise<UpdatePlatformServiceMatrixResult>;
  getProviderServiceManagement(): Promise<GetProviderServiceManagementResult>;
  submitProviderServicePricing(
    command: SubmitProviderServicePricingCommand,
  ): Promise<SubmitProviderServicePricingResult>;
  getProviderPricingAdminData(): Promise<GetProviderPricingAdminDataResult>;
  approveProviderServicePricing(
    command: ApproveProviderServicePricingCommand,
  ): Promise<ApproveProviderServicePricingResult>;
  rejectProviderServicePricing(
    command: RejectProviderServicePricingCommand,
  ): Promise<RejectProviderServicePricingResult>;
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(command: UpdatePlatformSettingsCommand): Promise<PlatformSettings>;
  listPlatformSettingsAudit(): Promise<ListPlatformSettingsAuditResult>;
  getPlatformRuntimeStatus(): Promise<PlatformRuntimeStatus>;
  listPlatformContentEntries(pageKey?: string): Promise<ListPlatformContentEntriesResult>;
  updatePlatformContentEntry(command: UpdatePlatformContentEntryCommand): Promise<PlatformContentEntry>;
  listPlatformContentAudit(pageKey?: string): Promise<ListPlatformContentAuditResult>;
  getPlatformPageContent(command: GetPlatformPageContentCommand): Promise<PlatformPageContent>;
  getIdentityAdminData(): Promise<IdentityAdminData>;
  suspendAccount(command: SuspendAccountCommand): Promise<SuspendAccountResult>;
  reactivateAccount(command: ReactivateAccountCommand): Promise<ReactivateAccountResult>;
  registerHotel(command: RegisterHotelCommand): Promise<HotelRegistrationResult>;
  registerProvider(command: RegisterProviderCommand): Promise<ProviderRegistrationResult>;
  approveHotelRegistration(command: ApproveHotelRegistrationCommand): Promise<HotelRegistrationResult>;
  rejectHotelRegistration(command: RejectHotelRegistrationCommand): Promise<HotelRegistrationResult>;
  approveProviderRegistration(command: ApproveProviderRegistrationCommand): Promise<ProviderRegistrationResult>;
  rejectProviderRegistration(command: RejectProviderRegistrationCommand): Promise<ProviderRegistrationResult>;
  createHotelOrder(command: CreateHotelOrderCommand): Promise<LaundryOrder>;
  runMatching(command: RunMatchingCommand): Promise<RunMatchingResult>;
  assignProvider(command: AssignProviderCommand): Promise<AssignProviderPreview>;
  acceptIncomingOrder(orderId: string, providerId?: string): Promise<LaundryOrder>;
  advanceProviderOrderExecution(command: AdvanceProviderOrderExecutionCommand): Promise<LaundryOrder>;
  confirmHotelOrderCompletion(command: ConfirmHotelOrderCompletionCommand): Promise<LaundryOrder>;
  rejectAssignment(command: RejectAssignmentCommand): Promise<LaundryOrder>;
  expireAssignment(command: ExpireAssignmentCommand): Promise<LaundryOrder>;
  autoReassignOrder(command: AutoReassignOrderCommand): Promise<LaundryOrder>;
  runAssignmentExpirySweep(referenceTime?: string): Promise<LaundryOrder[]>;
  getHotelDashboardData(): Promise<HotelDashboardData>;
  getHotelBillingData(): Promise<HotelBillingData>;
  getProviderDashboardData(): Promise<ProviderDashboardData>;
  getProviderFinanceData(): Promise<ProviderFinanceData>;
  listProviders(): Promise<ProviderProfile[]>;
  getAdminDashboardData(): Promise<AdminDashboardData>;
  getAdminFinanceData(): Promise<GetAdminFinanceDataResult>;
  getAdminFinancePage(command: GetAdminFinancePageCommand): Promise<GetAdminFinancePageResult>;
  markHotelInvoiceCollected(
    command: MarkHotelInvoiceCollectedCommand,
  ): Promise<MarkHotelInvoiceCollectedResult>;
  markProviderStatementPaid(
    command: MarkProviderStatementPaidCommand,
  ): Promise<MarkProviderStatementPaidResult>;
  listAdminOrders(): Promise<LaundryOrder[]>;
  listAdminOrdersPage(command: ListAdminOrdersPageCommand): Promise<ListAdminOrdersPageResult>;
  getAdminOnboardingData(): Promise<AdminOnboardingData>;
  calculateAdminKpis(): Promise<CalculateAdminKpisResult>;
  fetchMatchingTransparencyForAdmin(): Promise<FetchMatchingTransparencyResult>;
}

interface IdentityAuditRecorder {
  recordIdentityAuditEvent(
    event: Omit<IdentityAuditEvent, "id" | "createdAt"> & { createdAt?: string },
  ): Promise<void>;
}

interface ActivationEmailDeliveryInput {
  recipientEmail: string;
  recipientName?: string;
  role: AccountRole;
  linkedEntityType?: LinkedEntityType;
  activationPath: string;
  expiresAt?: string;
}

interface PasswordResetEmailDeliveryInput {
  recipientEmail: string;
  recipientName?: string;
  role: AccountRole;
  linkedEntityType?: LinkedEntityType;
  resetPath: string;
  expiresAt?: string;
}

export interface WashoffIdentityMailDelivery {
  sendActivationEmail(input: ActivationEmailDeliveryInput): Promise<IdentityEmailDeliverySummary>;
  sendPasswordResetEmail(input: PasswordResetEmailDeliveryInput): Promise<IdentityEmailDeliverySummary>;
}

export interface WashoffPlatformApplicationServiceOptions {
  publicAppUrl?: string;
  identityMailDelivery?: WashoffIdentityMailDelivery;
  identityAuditRecorder?: IdentityAuditRecorder;
}

const PREVIEW_MATCHING_BASE_SECONDS = 4;
const PREVIEW_MATCHING_PER_PROVIDER_SECONDS = 3;
const DEFAULT_ASSIGNMENT_RESPONSE_WINDOW_MINUTES = 30;
const HOTEL_ACCESS_NOT_APPROVED_ERROR =
  "لا يمكن الوصول إلى لوحة الفندق قبل اعتماد طلب التسجيل من الإدارة.";
const PROVIDER_ACCESS_NOT_APPROVED_ERROR =
  "لا يمكن الوصول إلى لوحة المزوّد قبل اعتماد طلب التسجيل من الإدارة.";

const resolvePublicActionUrl = (path: string, publicAppUrl?: string) => {
  const baseUrl = (publicAppUrl?.trim() || "http://localhost:8080").replace(/\/+$/, "");
  return new URL(path, `${baseUrl}/`).toString();
};

const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const buildHotelBillingSummary = (invoices: GetHotelBillingDataResult["invoices"]) => ({
  issuedInvoicesCount: invoices.filter((invoice) => invoice.status === "issued").length,
  collectedInvoicesCount: invoices.filter((invoice) => invoice.status === "collected").length,
  outstandingTotalIncVatSar: roundToTwo(
    invoices
      .filter((invoice) => invoice.status === "issued")
      .reduce((sum, invoice) => sum + invoice.totalIncVatSar, 0),
  ),
  totalInvoicedIncVatSar: roundToTwo(
    invoices.reduce((sum, invoice) => sum + invoice.totalIncVatSar, 0),
  ),
});

const buildProviderFinanceSummary = (statements: GetProviderFinanceDataResult["statements"]) => ({
  pendingStatementsCount: statements.filter((statement) => statement.status === "pending_payment").length,
  paidStatementsCount: statements.filter((statement) => statement.status === "paid").length,
  pendingTotalIncVatSar: roundToTwo(
    statements
      .filter((statement) => statement.status === "pending_payment")
      .reduce((sum, statement) => sum + statement.totalIncVatSar, 0),
  ),
  totalEarnedIncVatSar: roundToTwo(
    statements.reduce((sum, statement) => sum + statement.totalIncVatSar, 0),
  ),
});

const buildIdentityDeliverySummaryFromAudit = (
  event: IdentityAuditEvent,
): IdentityEmailDeliverySummary | undefined => {
  const metadata = event.metadata ?? {};
  const kind = metadata.kind === "activation" || metadata.kind === "password_reset" ? metadata.kind : undefined;
  const status =
    metadata.status === "sent" || metadata.status === "failed" || metadata.status === "retried"
      ? metadata.status
      : undefined;
  const providerLabelAr =
    typeof metadata.providerLabelAr === "string" && metadata.providerLabelAr.trim().length > 0
      ? metadata.providerLabelAr
      : undefined;

  if (!kind || !status || !providerLabelAr) {
    return undefined;
  }

  return {
    kind,
    status,
    statusLabelAr: identityEmailDeliveryStatusLabelsAr[status],
    providerLabelAr,
    providerMessageId: typeof metadata.providerMessageId === "string" ? metadata.providerMessageId : undefined,
    occurredAt: event.createdAt,
    sentAt: typeof metadata.sentAt === "string" ? metadata.sentAt : undefined,
    failedAt: typeof metadata.failedAt === "string" ? metadata.failedAt : undefined,
    failureReasonAr:
      typeof metadata.failureReasonAr === "string" ? metadata.failureReasonAr : undefined,
    outboxFilePath: typeof metadata.outboxFilePath === "string" ? metadata.outboxFilePath : undefined,
    attemptCount: typeof metadata.attemptCount === "number" ? metadata.attemptCount : undefined,
    retryCount: typeof metadata.retryCount === "number" ? metadata.retryCount : undefined,
  };
};

const enrichAccountsWithIdentityOperations = (
  accounts: AccountAdminSummary[],
  auditEvents: IdentityAdminData["auditEvents"],
): AccountAdminSummary[] => {
  const latestActivationDeliveryByAccountId = new Map<string, IdentityEmailDeliverySummary>();
  const latestPasswordResetDeliveryByAccountId = new Map<string, IdentityEmailDeliverySummary>();
  const latestIdentityOperationAtByAccountId = new Map<string, string>();

  auditEvents.forEach((event) => {
    if (event.accountId && !latestIdentityOperationAtByAccountId.has(event.accountId)) {
      latestIdentityOperationAtByAccountId.set(event.accountId, event.createdAt);
    }

    const summary = buildIdentityDeliverySummaryFromAudit(event);

    if (!event.accountId || !summary) {
      return;
    }

    if (summary.kind === "activation" && !latestActivationDeliveryByAccountId.has(event.accountId)) {
      latestActivationDeliveryByAccountId.set(event.accountId, summary);
      return;
    }

    if (summary.kind === "password_reset" && !latestPasswordResetDeliveryByAccountId.has(event.accountId)) {
      latestPasswordResetDeliveryByAccountId.set(event.accountId, summary);
    }
  });

  return accounts.map((account) => ({
    ...account,
    activationDelivery: latestActivationDeliveryByAccountId.get(account.id),
    passwordResetDelivery: latestPasswordResetDeliveryByAccountId.get(account.id),
    lastIdentityOperationAt: latestIdentityOperationAtByAccountId.get(account.id),
  }));
};

const recordIdentityDeliveryAudit = async ({
  recorder,
  accountId,
  actorAccountId,
  actorRole,
  linkedEntityType,
  linkedEntityId,
  type,
  delivery,
  detailsAr,
}: {
  recorder?: IdentityAuditRecorder;
  accountId?: string;
  actorAccountId?: string;
  actorRole?: AccountRole | "system";
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  type: IdentityAuditEventType;
  delivery: IdentityEmailDeliverySummary;
  detailsAr: string;
}) => {
  if (!recorder) {
    return;
  }

  await recorder.recordIdentityAuditEvent({
    accountId,
    type,
    actorAccountId,
    actorRole,
    linkedEntityType,
    linkedEntityId,
    detailsAr,
    metadata: {
      kind: delivery.kind,
      status: delivery.status,
      providerLabelAr: delivery.providerLabelAr,
      providerMessageId: delivery.providerMessageId,
      sentAt: delivery.sentAt,
      failedAt: delivery.failedAt,
      failureReasonAr: delivery.failureReasonAr,
      outboxFilePath: delivery.outboxFilePath,
      attemptCount: delivery.attemptCount,
      retryCount: delivery.retryCount,
    },
  });
};

const monthLabels = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.Submitted]: "hsl(205 80% 55%)",
  [OrderStatus.AutoMatching]: "hsl(185 85% 35%)",
  [OrderStatus.PendingCapacity]: "hsl(38 92% 50%)",
  [OrderStatus.Assigned]: "hsl(185 85% 35%)",
  [OrderStatus.Accepted]: "hsl(185 85% 35%)",
  [OrderStatus.PickupScheduled]: "hsl(185 70% 45%)",
  [OrderStatus.PickedUp]: "hsl(210 53% 23%)",
  [OrderStatus.InProcessing]: "hsl(185 85% 35%)",
  [OrderStatus.QualityCheck]: "hsl(38 92% 50%)",
  [OrderStatus.OutForDelivery]: "hsl(38 92% 50%)",
  [OrderStatus.Delivered]: "hsl(152 60% 40%)",
  [OrderStatus.Completed]: "hsl(152 60% 40%)",
  [OrderStatus.Cancelled]: "hsl(0 72% 51%)",
  [OrderStatus.Reassigned]: "hsl(38 92% 50%)",
  [OrderStatus.Disputed]: "hsl(0 72% 51%)",
};

const hotelActiveStatuses = new Set([
  OrderStatus.Submitted,
  OrderStatus.AutoMatching,
  OrderStatus.PendingCapacity,
  OrderStatus.Assigned,
  OrderStatus.Accepted,
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
  OrderStatus.Delivered,
  OrderStatus.Reassigned,
]);

const providerActiveStatuses = new Set([
  OrderStatus.Accepted,
  OrderStatus.PickupScheduled,
  OrderStatus.PickedUp,
  OrderStatus.InProcessing,
  OrderStatus.QualityCheck,
  OrderStatus.OutForDelivery,
  OrderStatus.Delivered,
]);

const hotelCompleteStatuses = new Set([OrderStatus.Completed]);
const unresolvedStatuses = new Set([OrderStatus.PendingCapacity, OrderStatus.Reassigned]);

const formatRelativeTime = (value: string) => {
  const hours = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60)));

  if (hours < 24) {
    return `منذ ${hours} ساعة`;
  }

  return `منذ ${Math.round(hours / 24)} يوم`;
};

const resolveProviderName = (providersById: Map<string, ProviderProfile>, providerId?: string) => {
  if (!providerId) {
    return undefined;
  }

  return providersById.get(providerId)?.displayName.ar ?? providerId;
};

const getLatestStatusHistoryEntry = (order: LaundryOrder) => {
  return order.statusHistory
    ?.slice()
    .sort((left, right) => right.changedAt.localeCompare(left.changedAt))[0];
};

const buildStatusHistoryActivity = (order: LaundryOrder): ActivityItem | undefined => {
  const latestStatusHistory = getLatestStatusHistoryEntry(order);

  if (!latestStatusHistory) {
    return undefined;
  }

  if (latestStatusHistory.toStatus === OrderStatus.Reassigned) {
    return undefined;
  }

  const label = getOrderStatusMeta(latestStatusHistory.toStatus).label;
  const event =
    latestStatusHistory.notesAr ??
    (latestStatusHistory.toStatus === OrderStatus.Completed
      ? `أكد الفندق اكتمال الطلب ${order.id}.`
      : `انتقل الطلب ${order.id} إلى مرحلة ${label}.`);

  return {
    time: formatRelativeTime(latestStatusHistory.changedAt),
    event,
    type:
      latestStatusHistory.toStatus === OrderStatus.Assigned || latestStatusHistory.toStatus === OrderStatus.Accepted
        ? "assign"
        : latestStatusHistory.toStatus === OrderStatus.Delivered ||
            latestStatusHistory.toStatus === OrderStatus.Completed
          ? "complete"
          : "alert",
  };
};

const buildActivityItem = (order: LaundryOrder): ActivityItem => {
  const latestReassignment = order.reassignmentEvents.slice(-1)[0];
  const latestStatusHistory = getLatestStatusHistoryEntry(order);

  if (
    latestReassignment &&
    (!latestStatusHistory ||
      new Date(latestReassignment.createdAt).getTime() >= new Date(latestStatusHistory.changedAt).getTime())
  ) {
    return {
      time: formatRelativeTime(latestReassignment.createdAt),
      event:
        latestReassignment.notesAr ??
        `أُعيد توجيه الطلب ${order.id} بسبب ${reassignmentReasonLabelsAr[latestReassignment.reason]}`,
      type: "reassign",
    };
  }

  const statusHistoryActivity = buildStatusHistoryActivity(order);

  if (statusHistoryActivity) {
    return statusHistoryActivity;
  }

  if (order.status === OrderStatus.Completed || order.status === OrderStatus.Delivered) {
    return {
      time: formatRelativeTime(order.updatedAt),
      event: `اكتمل ${order.id} بقيمة تقديرية ${formatSar(order.estimatedSubtotalSar)}`,
      type: "complete",
    };
  }

  if (order.status === OrderStatus.Assigned || order.status === OrderStatus.Accepted) {
    return {
      time: formatRelativeTime(order.updatedAt),
      event: `تم توجيه ${order.id} إلى ${order.providerSnapshot?.displayName.ar ?? "مزوّد قيد الربط"}`,
      type: "assign",
    };
  }

  return {
    time: formatRelativeTime(order.updatedAt),
    event: `تنبيه تشغيلي على ${order.id} بحالة ${getOrderStatusMeta(order.status).label}`,
    type: "alert",
  };
};

const buildProviderRanks = (providers: ProviderProfile[], orders: LaundryOrder[]): ProviderRank[] => {
  return providers
    .map((provider) => {
      const usedCapacityKg = provider.currentCapacity.committedKg + provider.currentCapacity.reservedKg;
      const capacityUsage =
        provider.currentCapacity.totalKg > 0
          ? Math.round((usedCapacityKg / provider.currentCapacity.totalKg) * 100)
          : 0;

      return {
        id: provider.id,
        name: provider.displayName.ar,
        score: provider.performance.qualityScore,
        orders: orders.filter((order) => order.providerId === provider.id).length,
        sla: Math.round(provider.performance.onTimeDeliveryRate * 100),
        capacity: capacityUsage,
      };
    })
    .sort((left, right) => right.score - left.score);
};

const getFirstMatchingLogs = (order: LaundryOrder) => {
  const sortedLogs = order.matchingLogs.slice().sort((left, right) => left.evaluatedAt.localeCompare(right.evaluatedAt));

  if (sortedLogs.length === 0) {
    return [];
  }

  const firstRunId = sortedLogs[0].matchingRunId;
  return sortedLogs.filter((log) => log.matchingRunId === firstRunId);
};

const estimateMatchingTimeSeconds = (order: LaundryOrder) => {
  const firstRunLogs = getFirstMatchingLogs(order);

  if (firstRunLogs.length === 0) {
    return 0;
  }

  const latestLogTimestamp = Math.max(...firstRunLogs.map((log) => new Date(log.evaluatedAt).getTime()));
  const createdTimestamp = new Date(order.createdAt).getTime();
  const actualSeconds =
    Number.isFinite(latestLogTimestamp) && Number.isFinite(createdTimestamp)
      ? Math.max((latestLogTimestamp - createdTimestamp) / 1000, 0)
      : 0;
  const heuristicSeconds = PREVIEW_MATCHING_BASE_SECONDS + firstRunLogs.length * PREVIEW_MATCHING_PER_PROVIDER_SECONDS;

  if (actualSeconds > 0 && actualSeconds <= 120) {
    return Math.max(actualSeconds, heuristicSeconds);
  }

  return heuristicSeconds;
};

const dedupeLatestLogs = (order: LaundryOrder, decision: MatchingDecision) => {
  const providerLogMap = new Map<string, LaundryOrder["matchingLogs"][number]>();

  order.matchingLogs
    .filter((log) => log.decision === decision)
    .sort((left, right) => right.evaluatedAt.localeCompare(left.evaluatedAt))
    .forEach((log) => {
      if (!providerLogMap.has(log.providerId)) {
        providerLogMap.set(log.providerId, log);
      }
    });

  return Array.from(providerLogMap.values());
};

const buildTransparencyEntry = (
  providersById: Map<string, ProviderProfile>,
  log: LaundryOrder["matchingLogs"][number],
): MatchingTransparencyEntry => ({
  providerId: log.providerId,
  providerName: resolveProviderName(providersById, log.providerId) ?? log.providerId,
  decision: log.decision,
  decisionLabel: matchingDecisionLabelsAr[log.decision],
  totalScore: log.scoreBreakdown.totalScore,
  notesAr: log.notesAr,
  blockingReasonsAr: log.eligibilityResult.blockingReasonsAr,
  capabilityReasonsAr: log.eligibilityResult.capabilityMatch.reasonsAr,
  scoreEntries: log.scoreBreakdown.entries.map((entry) => ({
    labelAr: entry.labelAr,
    rawScore: entry.rawScore,
    weightedScore: entry.weightedScore,
    explanationAr: entry.explanationAr,
  })),
});

const buildMatchingTransparency = (
  orders: LaundryOrder[],
  providersById: Map<string, ProviderProfile>,
  options: {
    limit?: number;
  } = {},
) => {
  const entries = orders
    .filter((order) => order.matchingLogs.length > 0)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map<MatchingTransparencyOrder>((order) => {
      const selectedLogs = dedupeLatestLogs(order, MatchingDecision.Selected);
      const selectedLog =
        (order.providerId ? selectedLogs.find((log) => log.providerId === order.providerId) : undefined) ??
        selectedLogs[0];
      const shortlistedProviders = dedupeLatestLogs(order, MatchingDecision.Shortlisted)
        .filter((log) => log.providerId !== selectedLog?.providerId)
        .sort((left, right) => right.scoreBreakdown.totalScore - left.scoreBreakdown.totalScore)
        .map((log) => buildTransparencyEntry(providersById, log));
      const excludedProviders = dedupeLatestLogs(order, MatchingDecision.Skipped).map((log) =>
        buildTransparencyEntry(providersById, log),
      );

      return {
        orderId: order.id,
        hotelName: order.hotelSnapshot.displayName.ar,
        createdAt: order.createdAt,
        currentStatus: order.status,
        currentStatusLabel: getOrderStatusMeta(order.status).label,
        currentProviderName: order.providerSnapshot?.displayName.ar,
        matchingRuns: new Set(order.matchingLogs.map((log) => log.matchingRunId)).size,
        reassignmentCount: order.reassignmentEvents.length,
        selectedProvider: selectedLog ? buildTransparencyEntry(providersById, selectedLog) : undefined,
        shortlistedProviders,
        excludedProviders,
        unresolvedNotesAr: order.reassignmentEvents.slice(-1)[0]?.notesAr,
      };
    });

  return typeof options.limit === "number" ? entries.slice(0, options.limit) : entries;
};

const buildRecentReassignments = (orders: LaundryOrder[], providersById: Map<string, ProviderProfile>) => {
  return orders
    .flatMap((order) =>
      order.reassignmentEvents.map((event, index) => {
        const previousAttempt = event.previousAssignmentId
          ? order.assignmentHistory.find((history) => history.assignmentId === event.previousAssignmentId)?.attemptNumber
          : undefined;

        return {
          id: event.id,
          orderId: order.id,
          previousProviderName: resolveProviderName(providersById, event.previousProviderId),
          nextProviderName: resolveProviderName(providersById, event.nextProviderId),
          reason: event.reason,
          reasonLabel: reassignmentReasonLabelsAr[event.reason],
          createdAt: event.createdAt,
          notesAr: event.notesAr,
          attemptNumber: previousAttempt ? previousAttempt + 1 : index + 2,
          currentOrderStatus: order.status,
          currentOrderStatusLabel: getOrderStatusMeta(order.status).label,
        };
      }),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8);
};

const buildKpis = (orders: LaundryOrder[], providers: ProviderProfile[]): AdminKpi[] => {
  const totalOrders = orders.length;
  const ordersWithFirstAssignment = orders.filter(
    (order) =>
      order.assignmentHistory.some((history) => history.attemptNumber === 1) ||
      order.activeAssignment?.attemptNumber === 1,
  ).length;
  const ordersWithReassignments = orders.filter((order) => order.reassignmentEvents.length > 0).length;
  const totalReassignmentEvents = orders.reduce((sum, order) => sum + order.reassignmentEvents.length, 0);
  const successfulFallbacks = orders.reduce(
    (sum, order) => sum + order.reassignmentEvents.filter((event) => Boolean(event.nextProviderId)).length,
    0,
  );
  const totalAssignmentAttempts = orders.reduce((sum, order) => {
    const assignmentIds = new Set(order.assignmentHistory.map((history) => history.assignmentId));

    if (order.activeAssignment?.id) {
      assignmentIds.add(order.activeAssignment.id);
    }

    return sum + assignmentIds.size;
  }, 0);
  const rejectedAttempts = orders.reduce(
    (sum, order) =>
      sum + order.assignmentHistory.filter((history) => history.toStatus === AssignmentStatus.Rejected).length,
    0,
  );
  const expiredAttempts = orders.reduce(
    (sum, order) =>
      sum + order.assignmentHistory.filter((history) => history.toStatus === AssignmentStatus.Expired).length,
    0,
  );
  const matchingTimeSamples = orders.map((order) => estimateMatchingTimeSeconds(order)).filter((value) => value > 0);
  const averageMatchingTimeSeconds =
    matchingTimeSamples.length > 0
      ? matchingTimeSamples.reduce((sum, value) => sum + value, 0) / matchingTimeSamples.length
      : 0;
  const totalCapacityKg = providers.reduce((sum, provider) => sum + provider.currentCapacity.totalKg, 0);
  const usedCapacityKg = providers.reduce(
    (sum, provider) => sum + provider.currentCapacity.committedKg + provider.currentCapacity.reservedKg,
    0,
  );
  const capacityUtilizationRatio = totalCapacityKg > 0 ? usedCapacityKg / totalCapacityKg : 0;
  const unresolvedOrders = orders.filter(
    (order) => unresolvedStatuses.has(order.status) || (order.status === OrderStatus.AutoMatching && !order.providerId),
  ).length;

  return [
    {
      id: "auto-assignment-success",
      title: "نجاح الإسناد التلقائي",
      value: formatPercent(totalOrders > 0 ? ordersWithFirstAssignment / totalOrders : 0),
      description: `${ordersWithFirstAssignment} من ${totalOrders} طلب حصلت على تعيين من أول محاولة.`,
      tone: "success",
    },
    {
      id: "reassignment-rate",
      title: "معدل إعادة الإسناد",
      value: formatPercent(totalOrders > 0 ? ordersWithReassignments / totalOrders : 0),
      description: `${ordersWithReassignments} طلب احتاج إلى إعادة إسناد واحدة أو أكثر.`,
      tone: ordersWithReassignments > 0 ? "warning" : "default",
    },
    {
      id: "fallback-success-rate",
      title: "نجاح المزوّد البديل",
      value: formatPercent(totalReassignmentEvents > 0 ? successfulFallbacks / totalReassignmentEvents : 0),
      description: `${successfulFallbacks} من ${totalReassignmentEvents} محاولات إعادة إسناد انتهت بمزوّد بديل.`,
      tone: successfulFallbacks > 0 ? "success" : "default",
    },
    {
      id: "provider-rejection-rate",
      title: "معدل رفض المزوّد",
      value: formatPercent(totalAssignmentAttempts > 0 ? rejectedAttempts / totalAssignmentAttempts : 0),
      description: `${rejectedAttempts} محاولة رُفضت من أصل ${totalAssignmentAttempts} عروض إسناد.`,
      tone: rejectedAttempts > 0 ? "warning" : "success",
    },
    {
      id: "provider-timeout-rate",
      title: "معدل انتهاء المهلة",
      value: formatPercent(totalAssignmentAttempts > 0 ? expiredAttempts / totalAssignmentAttempts : 0),
      description: `${expiredAttempts} محاولة انتهت مهلة ردّها من أصل ${totalAssignmentAttempts} عروض إسناد.`,
      tone: expiredAttempts > 0 ? "warning" : "success",
    },
    {
      id: "average-matching-time",
      title: "متوسط زمن المطابقة",
      value: formatDurationLabel(averageMatchingTimeSeconds),
      description: "تقدير معاينة: 4 ثوانٍ أساسية + 3 ثوانٍ لكل مزوّد تم تقييمه في جولة المطابقة الأولى.",
      tone: "default",
    },
    {
      id: "capacity-utilization",
      title: "استغلال السعة",
      value: formatPercent(capacityUtilizationRatio),
      description: `${usedCapacityKg} كجم مستخدمة أو محجوزة من أصل ${totalCapacityKg} كجم على مستوى المنصة.`,
      tone: capacityUtilizationRatio >= 0.8 ? "warning" : "default",
    },
    {
      id: "unresolved-orders",
      title: "الطلبات غير المحسومة",
      value: `${unresolvedOrders}`,
      description: "طلبات ما زالت بانتظار سعة أو مزوّد بديل بعد المطابقة أو إعادة الإسناد.",
      tone: unresolvedOrders > 0 ? "danger" : "success",
    },
  ];
};

const buildAdminDashboardData = async (repository: WashoffPlatformRepository): Promise<AdminDashboardData> => {
  const [orders, providers] = await Promise.all([repository.listAllOrders(), repository.listProviders()]);
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));
  const monthlyOrdersMap = new Map<number, number>();
  const statusMap = new Map<OrderStatus, number>();

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const monthIndex = date.getUTCMonth();
    monthlyOrdersMap.set(monthIndex, (monthlyOrdersMap.get(monthIndex) ?? 0) + 1);
    statusMap.set(order.status, (statusMap.get(order.status) ?? 0) + 1);
  });

  return {
    kpis: buildKpis(orders, providers),
    monthlyOrders: Array.from(monthlyOrdersMap.entries())
      .sort((left, right) => left[0] - right[0])
      .map<MonthlyOrdersDataPoint>(([monthIndex, ordersCount]) => ({
        name: monthLabels[monthIndex],
        orders: ordersCount,
      })),
    statusBreakdown: Array.from(statusMap.entries())
      .map<StatusBreakdownDataPoint>(([status, value]) => ({
        name: getOrderStatusMeta(status).label,
        value,
        color: statusColors[status],
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    topProviders: buildProviderRanks(providers, orders),
    recentActivity: orders
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 5)
      .map((order) => buildActivityItem(order)),
    recentReassignments: buildRecentReassignments(orders, providersById),
    matchingTransparency: buildMatchingTransparency(orders, providersById, { limit: 5 }),
  };
};

const buildAdminOnboardingData = async (
  repository: WashoffPlatformRepository,
): Promise<AdminOnboardingData> => {
  const [hotels, providers, accounts] = await Promise.all([
    repository.listHotelRegistrations(),
    repository.listProviderRegistrations(),
    repository.listAccounts(),
  ]);
  const accountsByEntityKey = new Map(
    accounts
      .filter((account) => account.linkedEntityType)
      .map((account) => [
        `${account.linkedEntityType}:${account.linkedHotelId ?? account.linkedProviderId ?? account.id}`,
        account,
      ]),
  );

  return {
    hotels: hotels
      .slice()
      .sort((left, right) => right.onboarding.submittedAt.localeCompare(left.onboarding.submittedAt))
      .map((hotel) => ({
        id: hotel.id,
        status: hotel.onboarding.status,
        statusLabelAr: onboardingStatusLabelsAr[hotel.onboarding.status],
        displayNameAr: hotel.displayName.ar,
        legalEntityName: hotel.legalEntityName,
        city: hotel.address.city,
        contactPersonName: hotel.contact.name,
        contactEmail: hotel.contact.email,
        contactPhone: hotel.contact.phone,
        notesAr: hotel.notesAr,
        submittedAt: hotel.onboarding.submittedAt,
        reviewedAt: hotel.onboarding.reviewedAt,
        reviewNotesAr: hotel.onboarding.reviewNotesAr,
        contractedServiceCount: hotel.contractedServiceIds.length,
        hotelClassification: hotel.classification,
        hotelClassificationLabelAr: hotelClassificationLabelsAr[hotel.classification],
        roomCount: hotel.roomCount,
        taxRegistrationNumber: hotel.compliance.taxRegistrationNumber,
        serviceLevel: hotel.operationalProfile.serviceLevel,
        serviceLevelLabelAr: hotelServiceLevelLabelsAr[hotel.operationalProfile.serviceLevel],
        operatingHours: hotel.operationalProfile.operatingHours,
        requiresDailyPickup: hotel.operationalProfile.requiresDailyPickup,
        addressText: hotel.logistics.addressText,
        latitude: hotel.address.latitude ?? 0,
        longitude: hotel.address.longitude ?? 0,
        pickupLocation: hotel.logistics.pickupLocation,
        hasLoadingArea: hotel.logistics.hasLoadingArea,
        accessNotes: hotel.logistics.accessNotes,
        commercialRegistrationNumber: hotel.compliance.commercialRegistrationNumber,
        commercialRegistrationFile: hotel.compliance.commercialRegistrationFile,
        delegationLetterFile: hotel.compliance.delegationLetterFile,
        delegationStatus: hotel.compliance.delegationStatus,
        delegationStatusLabelAr:
          hotelDelegationStatusLabelsAr[hotel.compliance.delegationStatus],
        accountEmail: accountsByEntityKey.get(`hotel:${hotel.id}`)?.email,
        accountRole: accountsByEntityKey.get(`hotel:${hotel.id}`)?.role,
        accountRoleLabelAr: accountsByEntityKey.get(`hotel:${hotel.id}`)
          ? accountRoleLabelsAr[accountsByEntityKey.get(`hotel:${hotel.id}`)!.role]
          : undefined,
        accountStatus: accountsByEntityKey.get(`hotel:${hotel.id}`)?.status,
        accountStatusLabelAr: accountsByEntityKey.get(`hotel:${hotel.id}`)
          ? accountStatusLabelsAr[accountsByEntityKey.get(`hotel:${hotel.id}`)!.status]
          : undefined,
        activationState: accountsByEntityKey.get(`hotel:${hotel.id}`)?.activation.state,
        activationStateLabelAr: accountsByEntityKey.get(`hotel:${hotel.id}`)
          ? accountActivationStateLabelsAr[accountsByEntityKey.get(`hotel:${hotel.id}`)!.activation.state]
          : undefined,
        activationPath: accountsByEntityKey.get(`hotel:${hotel.id}`)?.activation.activationPath,
      })),
    providers: providers
      .slice()
      .sort((left, right) => right.onboarding.submittedAt.localeCompare(left.onboarding.submittedAt))
      .map((provider) => ({
        id: provider.id,
        status: provider.onboarding.status,
        statusLabelAr: onboardingStatusLabelsAr[provider.onboarding.status],
        displayNameAr: provider.displayName.ar,
        city: provider.address.city,
        contactPersonName: provider.contact.name,
        contactEmail: provider.contact.email,
        contactPhone: provider.contact.phone,
        notesAr: provider.notesAr,
        submittedAt: provider.onboarding.submittedAt,
        reviewedAt: provider.onboarding.reviewedAt,
        reviewNotesAr: provider.onboarding.reviewNotesAr,
        legalEntityName: provider.businessProfile.legalEntityName,
        commercialRegistrationNumber: provider.businessProfile.commercialRegistrationNumber,
        taxRegistrationNumber: provider.businessProfile.taxRegistrationNumber,
        businessPhone: provider.businessProfile.phone,
        businessEmail: provider.businessProfile.email,
        addressText: provider.locationProfile.addressText,
        latitude: provider.address.latitude ?? 0,
        longitude: provider.address.longitude ?? 0,
        supportedServiceNamesAr:
          provider.serviceOfferings
            ?.filter(
              (offering) =>
                offering.activeMatrix &&
                offering.availableMatrix &&
                (offering.currentStatus === "active" || offering.proposedStatus === "pending_approval"),
            )
            .map((offering) => `${offering.productName.ar} - ${offering.serviceTypeName.ar}`) ??
          provider.capabilities
            .filter((capability) => capability.active)
            .map((capability) => capability.serviceName.ar),
        dailyCapacityKg: provider.currentCapacity.totalKg,
        pickupLeadTimeHours: provider.operatingProfile.pickupLeadTimeHours,
        executionTimeHours: provider.operatingProfile.executionTimeHours,
        deliveryTimeHours: provider.operatingProfile.deliveryTimeHours,
        workingDays: provider.operatingProfile.workingDays,
        workingDaysLabelsAr: provider.operatingProfile.workingDays.map(
          (workingDay) => providerWorkingDayLabelsAr[workingDay],
        ),
        workingHoursFrom: provider.operatingProfile.workingHoursFrom,
        workingHoursTo: provider.operatingProfile.workingHoursTo,
        commercialRegistrationFile: provider.businessProfile.commercialRegistrationFile,
        bankName: provider.financialProfile.bankName,
        iban: provider.financialProfile.iban,
        bankAccountHolderName: provider.financialProfile.accountHolderName,
        accountSetupName: provider.accountSetupProfile.fullName,
        accountSetupPhone: provider.accountSetupProfile.phone,
        accountSetupEmail: provider.accountSetupProfile.email,
        accountEmail: accountsByEntityKey.get(`provider:${provider.id}`)?.email,
        accountRole: accountsByEntityKey.get(`provider:${provider.id}`)?.role,
        accountRoleLabelAr: accountsByEntityKey.get(`provider:${provider.id}`)
          ? accountRoleLabelsAr[accountsByEntityKey.get(`provider:${provider.id}`)!.role]
          : undefined,
        accountStatus: accountsByEntityKey.get(`provider:${provider.id}`)?.status,
        accountStatusLabelAr: accountsByEntityKey.get(`provider:${provider.id}`)
          ? accountStatusLabelsAr[accountsByEntityKey.get(`provider:${provider.id}`)!.status]
          : undefined,
        activationState: accountsByEntityKey.get(`provider:${provider.id}`)?.activation.state,
        activationStateLabelAr: accountsByEntityKey.get(`provider:${provider.id}`)
          ? accountActivationStateLabelsAr[accountsByEntityKey.get(`provider:${provider.id}`)!.activation.state]
          : undefined,
        activationPath: accountsByEntityKey.get(`provider:${provider.id}`)?.activation.activationPath,
      })),
  };
};

const buildIdentityAdminData = async (
  repository: WashoffPlatformRepository,
): Promise<IdentityAdminData> => {
  const [accounts, auditEvents] = await Promise.all([
    repository.listAccounts(),
    repository.listIdentityAuditEvents(),
  ]);

  return {
    accounts: enrichAccountsWithIdentityOperations(accounts, auditEvents),
    auditEvents,
  };
};

const resolveNextAttemptNumber = (order: LaundryOrder) => {
  const attemptNumbers = order.assignmentHistory.map((history) => history.attemptNumber);

  if (order.activeAssignment) {
    attemptNumbers.push(order.activeAssignment.attemptNumber);
  }

  return (attemptNumbers.length > 0 ? Math.max(...attemptNumbers) : 0) + 1;
};

const assertValidProviderExecutionTransition = (
  order: LaundryOrder | undefined,
  command: AdvanceProviderOrderExecutionCommand,
) => {
  if (!order) {
    throw new Error("تعذر العثور على الطلب ضمن المهام التشغيلية الحالية للمزوّد.");
  }

  if (!providerExecutableOrderStatuses.has(command.nextStatus)) {
    throw new Error("المرحلة المطلوبة غير متاحة كتحديث تشغيلي من لوحة المزوّد.");
  }

  if (!canTransitionOrderStatus(order.status, command.nextStatus)) {
    throw new Error(
      `لا يمكن نقل الطلب من حالة ${getOrderStatusMeta(order.status).label} إلى ${getOrderStatusMeta(command.nextStatus).label}.`,
    );
  }
};

const assertValidHotelCompletion = (order: LaundryOrder | undefined) => {
  if (!order) {
    throw new Error("تعذر العثور على الطلب ضمن لوحة الفندق الحالية.");
  }

  if (!canTransitionOrderStatus(order.status, OrderStatus.Completed) || order.status !== OrderStatus.Delivered) {
    throw new Error("لا يمكن تأكيد اكتمال الطلب قبل وصوله إلى مرحلة تم التسليم.");
  }
};

export const createWashoffPlatformApplicationService = (
  repository: WashoffPlatformRepository,
  options: WashoffPlatformApplicationServiceOptions = {},
): WashoffPlatformApplicationService => {
  const sendActivationDelivery = async ({
    account,
    recipientName,
    linkedEntityType,
    linkedEntityId,
    actorRole,
    actorAccountId,
    detailsAr,
  }: {
    account: RegistrationLinkedAccountSummary;
    recipientName?: string;
    linkedEntityType?: LinkedEntityType;
    linkedEntityId?: string;
    actorRole?: AccountRole | "system";
    actorAccountId?: string;
    detailsAr: string;
  }): Promise<IdentityEmailDeliverySummary | undefined> => {
    if (!options.identityMailDelivery || !account.activationPath) {
      return undefined;
    }

    let delivery: IdentityEmailDeliverySummary;

    try {
      delivery = await options.identityMailDelivery.sendActivationEmail({
        recipientEmail: account.email,
        recipientName,
        role: account.role,
        linkedEntityType,
        activationPath: resolvePublicActionUrl(account.activationPath, options.publicAppUrl),
        expiresAt: undefined,
      });
    } catch (error) {
      delivery = {
        kind: "activation",
        status: IdentityEmailDeliveryStatus.Failed,
        statusLabelAr: identityEmailDeliveryStatusLabelsAr[IdentityEmailDeliveryStatus.Failed],
        providerLabelAr: "طبقة البريد",
        occurredAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        failureReasonAr: error instanceof Error ? error.message : "تعذر إرسال رسالة التفعيل.",
      };
    }

    await recordIdentityDeliveryAudit({
      recorder: options.identityAuditRecorder,
      accountId: account.accountId,
      actorAccountId,
      actorRole,
      linkedEntityType,
      linkedEntityId,
      type:
        delivery.status !== IdentityEmailDeliveryStatus.Failed
          ? IdentityAuditEventType.ActivationEmailSent
          : IdentityAuditEventType.ActivationEmailFailed,
      delivery,
      detailsAr,
    });

    return delivery;
  };

  const sendPasswordResetDelivery = async ({
    accountEmail,
    recipientName,
    role,
    linkedEntityType,
    linkedEntityId,
    resetPath,
    accountId,
  }: {
    accountEmail?: string;
    recipientName?: string;
    role?: AccountRole;
    linkedEntityType?: LinkedEntityType;
    linkedEntityId?: string;
    resetPath?: string;
    accountId?: string;
  }) => {
    if (!options.identityMailDelivery || !resetPath || !accountEmail || !role) {
      return undefined;
    }

    let delivery: IdentityEmailDeliverySummary;

    try {
      delivery = await options.identityMailDelivery.sendPasswordResetEmail({
        recipientEmail: accountEmail,
        recipientName,
        role,
        linkedEntityType,
        resetPath: resolvePublicActionUrl(resetPath, options.publicAppUrl),
        expiresAt: undefined,
      });
    } catch (error) {
      delivery = {
        kind: "password_reset",
        status: IdentityEmailDeliveryStatus.Failed,
        statusLabelAr: identityEmailDeliveryStatusLabelsAr[IdentityEmailDeliveryStatus.Failed],
        providerLabelAr: "طبقة البريد",
        occurredAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        failureReasonAr: error instanceof Error ? error.message : "تعذر إرسال رسالة إعادة الضبط.",
      };
    }

    await recordIdentityDeliveryAudit({
      recorder: options.identityAuditRecorder,
      accountId,
      actorAccountId: accountId,
      actorRole: role,
      linkedEntityType,
      linkedEntityId,
      type:
        delivery.status !== IdentityEmailDeliveryStatus.Failed
          ? IdentityAuditEventType.PasswordResetEmailSent
          : IdentityAuditEventType.PasswordResetEmailFailed,
      delivery,
      detailsAr:
        delivery.status !== IdentityEmailDeliveryStatus.Failed
          ? "تم إرسال رسالة إعادة ضبط كلمة المرور إلى البريد المسجل للحساب."
          : delivery.failureReasonAr ?? "تعذر إرسال رسالة إعادة ضبط كلمة المرور.",
    });

    return delivery;
  };

  const buildPagedResult = <Item,>(items: Item[], page: number, pageSize: number) => {
    const safePageSize = Math.min(Math.max(pageSize || 1, 1), 100);
    const safePage = Math.max(page || 1, 1);
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const normalizedPage = Math.min(safePage, totalPages);
    const startIndex = (normalizedPage - 1) * safePageSize;

    return {
      items: items.slice(startIndex, startIndex + safePageSize),
      page: normalizedPage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  };

  const filterAdminOrders = (orders: LaundryOrder[], command: ListAdminOrdersPageCommand) => {
    const normalizedSearch = command.search?.trim().toLowerCase() ?? "";

    return orders.filter((order) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [
              order.id,
              order.hotelSnapshot.displayName.ar,
              order.providerSnapshot?.displayName.ar ?? "",
              order.items.map((item) => item.serviceName.ar).join(" "),
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
      const matchesStatus =
        !command.status || command.status === "all" ? true : order.status === command.status;
      const matchesProvider =
        !command.providerId || command.providerId === "all"
          ? true
          : order.providerId === command.providerId;
      const orderDate = order.createdAt.slice(0, 10);
      const matchesDateFrom = command.dateFrom ? orderDate >= command.dateFrom : true;
      const matchesDateTo = command.dateTo ? orderDate <= command.dateTo : true;

      return matchesSearch && matchesStatus && matchesProvider && matchesDateFrom && matchesDateTo;
    });
  };

  const filterAdminInvoices = (
    invoices: GetAdminFinanceDataResult["hotelInvoices"],
    search?: string,
    status?: string,
    date?: string,
  ) => {
    const normalizedSearch = search?.trim().toLowerCase() ?? "";

    return invoices.filter((invoice) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [invoice.invoiceNumber, invoice.buyer.displayNameAr, ...invoice.lines.map((line) => line.orderId)]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
      const matchesStatus = !status || status === "all" ? true : invoice.status === status;
      const matchesDate = date ? invoice.invoiceDate === date : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filterAdminProviderStatements = (
    statements: GetAdminFinanceDataResult["providerStatements"],
    search?: string,
    status?: string,
    date?: string,
  ) => {
    const normalizedSearch = search?.trim().toLowerCase() ?? "";

    return statements.filter((statement) => {
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [statement.statementNumber, statement.provider.displayNameAr, ...statement.lines.map((line) => line.orderId)]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
      const matchesStatus = !status || status === "all" ? true : statement.status === status;
      const matchesDate = date ? statement.statementDate === date : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  return {
    login: (command) => repository.login(command),

    activateAccount: (command) => repository.activateAccount(command),

    validateActivationToken: (command) => repository.validateActivationToken(command),

    requestPasswordReset: async (command) => {
      const result = await repository.requestPasswordReset(command);

      await sendPasswordResetDelivery({
        accountEmail: (result as RequestPasswordResetResult & { accountEmail?: string }).accountEmail,
        recipientName: (result as RequestPasswordResetResult & { accountFullName?: string }).accountFullName,
        role: (result as RequestPasswordResetResult & { role?: AccountRole }).role,
        linkedEntityType: (result as RequestPasswordResetResult & { linkedEntityType?: LinkedEntityType }).linkedEntityType,
        linkedEntityId: (result as RequestPasswordResetResult & { linkedEntityId?: string }).linkedEntityId,
        resetPath: result.resetPath,
        accountId: (result as RequestPasswordResetResult & { accountId?: string }).accountId,
      });

      return {
        accepted: true,
        messageAr: result.messageAr,
      };
    },

    resendActivationEmail: async (command) => {
      const account = await repository.resendActivationEmail(command.accountId);
      const delivery = await sendActivationDelivery({
        account,
        recipientName: account.fullName,
        linkedEntityType:
          account.role === "hotel" ? "hotel" : account.role === "provider" ? "provider" : "admin",
        linkedEntityId: undefined,
        actorRole: AccountRole.Admin,
        detailsAr:
          "تمت إعادة إرسال رسالة تفعيل جديدة للحساب من خلال لوحة إدارة الهوية.",
      });

      return {
        account,
        delivery,
      };
    },

    validateResetPasswordToken: (command) => repository.validateResetPasswordToken(command),

    resetPassword: (command) => repository.resetPassword(command),

    logout: (sessionToken) => repository.logout(sessionToken),

    getCurrentAccountSession: () => repository.getCurrentAccountSession(),

    getServiceCatalog: (hotelId?: string) => repository.listServiceCatalog(hotelId),

    getPlatformServiceCatalogAdminData: () => repository.getPlatformServiceCatalogAdminData(),

    upsertPlatformProduct: (command) => repository.upsertPlatformProduct(command),

    updatePlatformServiceMatrix: (command) => repository.updatePlatformServiceMatrix(command),

    getProviderServiceManagement: () => repository.getProviderServiceManagement(),

    submitProviderServicePricing: (command) => repository.submitProviderServicePricing(command),

    getProviderPricingAdminData: () => repository.getProviderPricingAdminData(),

    approveProviderServicePricing: (command) =>
      repository.approveProviderServicePricing(command.offeringId),

    rejectProviderServicePricing: (command) => repository.rejectProviderServicePricing(command),

    getPlatformSettings: () => repository.getPlatformSettings(),

    updatePlatformSettings: (command) => repository.updatePlatformSettings(command),

    listPlatformSettingsAudit: () => repository.listPlatformSettingsAudit(),

    getPlatformRuntimeStatus: () => repository.getPlatformRuntimeStatus(),

    listPlatformContentEntries: (pageKey) => repository.listPlatformContentEntries(pageKey),

    updatePlatformContentEntry: (command) => repository.updatePlatformContentEntry(command),

    listPlatformContentAudit: (pageKey) => repository.listPlatformContentAudit(pageKey),

    getPlatformPageContent: (command) =>
      repository.getPlatformPageContent(command.pageKey, command.language as PlatformLanguage),

    getIdentityAdminData: () => buildIdentityAdminData(repository),

    suspendAccount: (command) => repository.suspendAccount(command.accountId, command.reasonAr),

    reactivateAccount: (command) => repository.reactivateAccount(command.accountId, command.reasonAr),

    registerHotel: (command) => repository.registerHotel(command),

    registerProvider: (command) => repository.registerProvider(command),

    approveHotelRegistration: async (command) => {
      const result = await repository.approveHotelRegistration(command.entityId, command.reviewNotesAr);
      const delivery = await sendActivationDelivery({
        account: result.account,
        recipientName: result.hotel.contact.name,
        linkedEntityType: "hotel",
        linkedEntityId: result.hotel.id,
        actorRole: AccountRole.Admin,
        detailsAr:
          "تم إرسال رسالة تفعيل الحساب للفندق بعد اعتماد طلب التسجيل.",
      });

      return {
        ...result,
        delivery,
      };
    },

    rejectHotelRegistration: (command) =>
      repository.rejectHotelRegistration(command.entityId, command.reviewNotesAr),

    approveProviderRegistration: async (command) => {
      const result = await repository.approveProviderRegistration(command.entityId, command.reviewNotesAr);
      const delivery = await sendActivationDelivery({
        account: result.account,
        recipientName: result.provider.contact.name,
        linkedEntityType: "provider",
        linkedEntityId: result.provider.id,
        actorRole: AccountRole.Admin,
        detailsAr:
          "تم إرسال رسالة تفعيل الحساب للمزوّد بعد اعتماد طلب التسجيل.",
      });

      return {
        ...result,
        delivery,
      };
    },

    rejectProviderRegistration: (command) =>
      repository.rejectProviderRegistration(command.entityId, command.reviewNotesAr),

    createHotelOrder: (command) => repository.createHotelOrder(command),

  runMatching: async (command) => {
    const providers = command.providers ?? await repository.listProviders();
    return matchProvidersForOrder(command.order, providers, {
      evaluatedAt: command.evaluatedAt,
      matchingRunId: command.matchingRunId,
      weights: command.weights,
    });
  },

  assignProvider: async (command) => {
    const assignedAt = command.assignedAt ?? new Date().toISOString();
    const attemptNumber = command.attemptNumber ?? resolveNextAttemptNumber(command.order);
    const responseDueAt = new Date(
      new Date(assignedAt).getTime() + (command.responseWindowMinutes ?? DEFAULT_ASSIGNMENT_RESPONSE_WINDOW_MINUTES) * 60 * 1000,
    ).toISOString();
    const assignment: AssignProviderPreview["assignment"] = {
      id: `assignment-${command.order.id}-${attemptNumber}`,
      orderId: command.order.id,
      hotelId: command.order.hotelId,
      providerId: command.provider.id,
      attemptNumber,
      status: AssignmentStatus.PendingAcceptance,
      assignedAt,
      responseDueAt,
      scoreBreakdown: command.scoreBreakdown,
      eligibilityResult: command.eligibilityResult,
    };

    return {
      assignment,
      providerId: command.provider.id,
      providerNameAr: command.provider.displayName.ar,
      responseDueAt,
    };
  },

  acceptIncomingOrder: (orderId, providerId) => repository.acceptIncomingOrder(orderId, providerId),

  advanceProviderOrderExecution: async (command) => {
    const activeOrders = await repository.listProviderActiveOrders(command.providerId);
    const order = activeOrders.find((entry) => entry.id === command.orderId);

    assertValidProviderExecutionTransition(order, command);

    return repository.advanceProviderOrderExecution(command);
  },

  confirmHotelOrderCompletion: async (command) => {
    const hotelOrders = await repository.listHotelOrders(command.hotelId);
    const order = hotelOrders.find((entry) => entry.id === command.orderId);

    assertValidHotelCompletion(order);

    return repository.confirmHotelOrderCompletion(command);
  },

  rejectAssignment: (command) => repository.rejectIncomingOrder(command.orderId, command.providerId),

  expireAssignment: (command) => repository.expirePendingAssignment(command.orderId, command.referenceTime),

  autoReassignOrder: (command) =>
    repository.autoReassignOrder(command.orderId, command.reason, command.referenceTime),

  runAssignmentExpirySweep: (referenceTime) => repository.runAssignmentExpirySweep(referenceTime),

  getHotelDashboardData: async () => {
    const hotel = await repository.getHotelProfile();

    if (!isOnboardingApproved(hotel.onboarding)) {
      throw new Error(HOTEL_ACCESS_NOT_APPROVED_ERROR);
    }

    const [recentOrders, serviceCatalog] = await Promise.all([
      repository.listHotelOrders(),
      repository.listServiceCatalog(hotel.id),
    ]);

    const activeOrders = recentOrders.filter((order) => hotelActiveStatuses.has(order.status));
    const completedOrders = recentOrders.filter((order) => hotelCompleteStatuses.has(order.status));
    const averageOrderValue =
      recentOrders.length > 0
        ? Math.round(recentOrders.reduce((sum, order) => sum + order.estimatedSubtotalSar, 0) / recentOrders.length)
        : 0;

    return {
      hotelName: hotel.displayName.ar,
      city: hotel.address.city,
      serviceCatalog,
      recentOrders,
      metrics: [
        { title: "إجمالي الطلبات", value: recentOrders.length },
        { title: "قيد الخدمة", value: activeOrders.length },
        { title: "المكتملة", value: completedOrders.length },
        { title: "متوسط الطلب", value: averageOrderValue },
      ],
    };
  },

  getHotelBillingData: async () => {
    const hotel = await repository.getHotelProfile();

    if (!isOnboardingApproved(hotel.onboarding)) {
      throw new Error(HOTEL_ACCESS_NOT_APPROVED_ERROR);
    }

    const financeData = await repository.getHotelBillingData(hotel.id);

    return {
      hotelName: hotel.displayName.ar,
      invoices: financeData.invoices,
      summary: buildHotelBillingSummary(financeData.invoices),
    };
  },

  getProviderDashboardData: async () => {
    const provider = await repository.getProviderProfile();

    if (!isOnboardingApproved(provider.onboarding)) {
      throw new Error(PROVIDER_ACCESS_NOT_APPROVED_ERROR);
    }

    const [incomingOrders, allOrders] = await Promise.all([
      repository.listProviderIncomingOrders(),
      repository.listProviderActiveOrders(),
    ]);

    const usedCapacityKg = provider.currentCapacity.committedKg + provider.currentCapacity.reservedKg;
    const reassignedIncomingOrders = incomingOrders.filter((order) => (order.activeAssignment?.attemptNumber ?? 1) > 1);
    const activeOrders = allOrders.filter((order) => providerActiveStatuses.has(order.status));

    return {
      providerName: provider.displayName.ar,
      city: provider.address.city,
      rating: provider.performance.rating,
      capacity: {
        used: usedCapacityKg,
        total: provider.currentCapacity.totalKg,
      },
      serviceOfferings: provider.serviceOfferings ?? [],
      incomingOrders,
      activeOrders,
      metrics: [
        { title: "بانتظار القبول", value: incomingOrders.length },
        { title: "معاد إسنادها", value: reassignedIncomingOrders.length },
        { title: "الطلبات النشطة", value: activeOrders.length },
        { title: "التقييم", value: provider.performance.rating.toFixed(1) },
      ],
    };
  },

  getProviderFinanceData: async () => {
    const provider = await repository.getProviderProfile();

    if (!isOnboardingApproved(provider.onboarding)) {
      throw new Error(PROVIDER_ACCESS_NOT_APPROVED_ERROR);
    }

    const financeData = await repository.getProviderFinanceData(provider.id);

    return {
      providerName: provider.displayName.ar,
      statements: financeData.statements,
      summary: buildProviderFinanceSummary(financeData.statements),
    };
  },

  listProviders: () => repository.listProviders(),

  getAdminDashboardData: async () => buildAdminDashboardData(repository),

  getAdminFinanceData: async () => repository.getAdminFinanceData(),

  getAdminFinancePage: async (command) => {
    if (repository.getAdminFinancePage) {
      return repository.getAdminFinancePage(command);
    }

    const financeData = await repository.getAdminFinanceData();

    return {
      summary: financeData.summary,
      hotelInvoicesPage: buildPagedResult(
        filterAdminInvoices(
          financeData.hotelInvoices,
          command.invoiceSearch,
          command.invoiceStatus,
          command.invoiceDate,
        ),
        command.invoicePage,
        command.invoicePageSize,
      ),
      providerStatementsPage: buildPagedResult(
        filterAdminProviderStatements(
          financeData.providerStatements,
          command.statementSearch,
          command.statementStatus,
          command.statementDate,
        ),
        command.statementPage,
        command.statementPageSize,
      ),
    };
  },

  markHotelInvoiceCollected: (command) => repository.markHotelInvoiceCollected(command),

  markProviderStatementPaid: (command) => repository.markProviderStatementPaid(command),

  listAdminOrders: async () =>
    (await repository.listAllOrders())
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),

  listAdminOrdersPage: async (command) => {
    if (repository.listAdminOrdersPage) {
      return repository.listAdminOrdersPage(command);
    }

    const orders = (await repository.listAllOrders())
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return buildPagedResult(
      filterAdminOrders(orders, command),
      command.page,
      command.pageSize,
    );
  },

  getAdminOnboardingData: async () => buildAdminOnboardingData(repository),

  calculateAdminKpis: async () => {
    const dashboard = await buildAdminDashboardData(repository);
    return { kpis: dashboard.kpis };
  },

  fetchMatchingTransparencyForAdmin: async () => {
    const [orders, providers] = await Promise.all([repository.listAllOrders(), repository.listProviders()]);
    const providersById = new Map(providers.map((provider) => [provider.id, provider]));

    return { orders: buildMatchingTransparency(orders, providersById) };
  },
};
};
