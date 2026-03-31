import type {
  AccountActivationState,
  AccountProfile,
  AccountSessionProfile,
  AccountStatus,
  AccountRole,
  AccountTokenValidationResult,
  AuthenticatedAccountSession,
  IdentityEmailDeliverySummary,
  IdentityAuditEvent,
  PasswordResetState,
} from "@/features/auth/model";
import type {
  PlatformContentAuditEntry,
  PlatformContentEntry,
  PlatformContentEntryUpdateCommand,
  PlatformLanguage,
  PlatformPageContent,
} from "@/features/content/model/platform-content";
import type { Assignment } from "@/features/orders/model";
import { ReassignmentReason } from "@/features/orders/model";
import type { MatchingDecision } from "@/features/orders/model/matching";
import type { MatchingRunResult, MatchingScoreWeights } from "@/features/orders/model/matching";
import type {
  AdminFinanceSummary,
  HotelInvoice,
  ProviderSettlementStatement,
} from "@/features/orders/model/finance";
import type { CreateHotelOrderInput, LaundryOrder } from "@/features/orders/model/order";
import type { ProviderProfile } from "@/features/orders/model/provider";
import type {
  PlatformProduct,
  PlatformServiceMatrixRow,
  PlatformServiceType,
  ProviderServiceOffering,
  ProviderServicePricingInput,
  ServiceCatalogItem,
} from "@/features/orders/model/service";
import type { ScoreBreakdown, EligibilityResult } from "@/features/orders/model/matching";
import { OrderStatus } from "@/features/orders/model/lifecycle";
import type {
  HotelDelegationStatus,
  HotelRegistrationInput,
  HotelProfile,
  HotelRegistrationStoredDocumentReference,
  HotelClassification,
  HotelServiceLevel,
} from "@/features/orders/model/hotel";
import type {
  ProviderRegistrationInput,
  ProviderRegistrationStoredDocumentReference,
  ProviderWorkingDay,
} from "@/features/orders/model/provider";
import type { OnboardingStatus } from "@/features/orders/model/onboarding";
import type {
  PlatformRuntimeStatus,
  PlatformSettings,
  PlatformSettingsAuditEntry,
  PlatformSettingsUpdateCommand,
} from "@/features/platform-settings/model/platform-settings";

export interface HotelDashboardMetric {
  title: string;
  value: string | number;
}

export interface HotelDashboardData {
  hotelName: string;
  city: string;
  metrics: HotelDashboardMetric[];
  serviceCatalog: ServiceCatalogItem[];
  recentOrders: LaundryOrder[];
}

export interface HotelBillingData {
  hotelName: string;
  invoices: HotelInvoice[];
  summary: {
    issuedInvoicesCount: number;
    collectedInvoicesCount: number;
    outstandingTotalIncVatSar: number;
    totalInvoicedIncVatSar: number;
  };
}

export interface PagedResult<Item> {
  items: Item[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListAdminOrdersPageCommand {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  providerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type ListAdminOrdersPageResult = PagedResult<LaundryOrder>;

export interface ProviderDashboardMetric {
  title: string;
  value: string | number;
}

export interface ProviderDashboardData {
  providerName: string;
  city: string;
  rating: number;
  capacity: {
    used: number;
    total: number;
  };
  metrics: ProviderDashboardMetric[];
  serviceOfferings: ProviderServiceOffering[];
  incomingOrders: LaundryOrder[];
  activeOrders: LaundryOrder[];
}

export interface ProviderFinanceData {
  providerName: string;
  statements: ProviderSettlementStatement[];
  summary: {
    pendingStatementsCount: number;
    paidStatementsCount: number;
    pendingTotalIncVatSar: number;
    totalEarnedIncVatSar: number;
  };
}

export interface PlatformServiceMatrixSummary extends PlatformServiceMatrixRow {
  productName: {
    ar: string;
    en?: string;
  };
  serviceTypeName: {
    ar: string;
    en?: string;
  };
  matrixLabelAr: string;
}

export interface PlatformServiceCatalogAdminData {
  serviceTypes: PlatformServiceType[];
  products: PlatformProduct[];
  matrixRows: PlatformServiceMatrixSummary[];
}

export interface ProviderServicePricingReviewEntry {
  offeringId: string;
  providerId: string;
  providerNameAr: string;
  productId: string;
  productNameAr: string;
  serviceType: string;
  serviceTypeLabelAr: string;
  pricingUnitLabelAr: string;
  suggestedPriceSar?: number;
  currentApprovedPriceSar?: number;
  proposedPriceSar: number;
  proposedSubmittedAt: string;
  activeApprovedAt?: string;
  activeStatusLabelAr: string;
  proposedStatusLabelAr: string;
  rejectionReasonAr?: string;
}

export interface ProviderPricingAdminData {
  pendingReviews: ProviderServicePricingReviewEntry[];
}

export interface ProviderServiceManagementData {
  catalog: PlatformServiceCatalogAdminData;
  offerings: ProviderServiceOffering[];
}

export interface AdminKpi {
  id: string;
  title: string;
  value: string;
  description: string;
  tone?: "default" | "success" | "warning" | "danger";
}

export interface MonthlyOrdersDataPoint {
  name: string;
  orders: number;
}

export interface StatusBreakdownDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface ProviderRank {
  id: string;
  name: string;
  score: number;
  orders: number;
  sla: number;
  capacity: number;
}

export interface ActivityItem {
  time: string;
  event: string;
  type: "assign" | "reassign" | "complete" | "alert";
}

export interface ReassignmentActivityItem {
  id: string;
  orderId: string;
  previousProviderName?: string;
  nextProviderName?: string;
  reason: ReassignmentReason;
  reasonLabel: string;
  createdAt: string;
  notesAr?: string;
  attemptNumber: number;
  currentOrderStatus: OrderStatus;
  currentOrderStatusLabel: string;
}

export interface MatchingTransparencyEntry {
  providerId: string;
  providerName: string;
  decision: MatchingDecision;
  decisionLabel: string;
  totalScore: number;
  notesAr?: string;
  blockingReasonsAr: string[];
  capabilityReasonsAr: string[];
  scoreEntries: Array<{
    labelAr: string;
    rawScore: number;
    weightedScore: number;
    explanationAr?: string;
  }>;
}

export interface MatchingTransparencyOrder {
  orderId: string;
  hotelName: string;
  createdAt: string;
  currentStatus: OrderStatus;
  currentStatusLabel: string;
  currentProviderName?: string;
  matchingRuns: number;
  reassignmentCount: number;
  selectedProvider?: MatchingTransparencyEntry;
  shortlistedProviders: MatchingTransparencyEntry[];
  excludedProviders: MatchingTransparencyEntry[];
  unresolvedNotesAr?: string;
}

export interface AdminDashboardData {
  kpis: AdminKpi[];
  monthlyOrders: MonthlyOrdersDataPoint[];
  statusBreakdown: StatusBreakdownDataPoint[];
  topProviders: ProviderRank[];
  recentActivity: ActivityItem[];
  recentReassignments: ReassignmentActivityItem[];
  matchingTransparency: MatchingTransparencyOrder[];
}

export interface AdminFinanceData {
  summary: AdminFinanceSummary;
  hotelInvoices: HotelInvoice[];
  providerStatements: ProviderSettlementStatement[];
}

export interface GetAdminFinancePageCommand {
  invoicePage: number;
  invoicePageSize: number;
  invoiceSearch?: string;
  invoiceStatus?: string;
  invoiceDate?: string;
  statementPage: number;
  statementPageSize: number;
  statementSearch?: string;
  statementStatus?: string;
  statementDate?: string;
}

export interface AdminFinancePageData {
  summary: AdminFinanceSummary;
  hotelInvoicesPage: PagedResult<HotelInvoice>;
  providerStatementsPage: PagedResult<ProviderSettlementStatement>;
}

export type GetAdminFinancePageResult = AdminFinancePageData;

export interface OnboardingEntitySummary {
  id: string;
  status: OnboardingStatus;
  statusLabelAr: string;
  displayNameAr: string;
  city: string;
  contactPersonName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notesAr?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotesAr?: string;
  accountEmail?: string;
  accountRole?: AccountRole;
  accountRoleLabelAr?: string;
  accountStatus?: AccountStatus;
  accountStatusLabelAr?: string;
  activationState?: AccountActivationState;
  activationStateLabelAr?: string;
  activationPath?: string;
}

export interface HotelOnboardingSummary extends OnboardingEntitySummary {
  contractedServiceCount: number;
  legalEntityName?: string;
  hotelClassification: HotelClassification;
  hotelClassificationLabelAr: string;
  roomCount: number;
  taxRegistrationNumber: string;
  commercialRegistrationNumber: string;
  serviceLevel: HotelServiceLevel;
  serviceLevelLabelAr: string;
  operatingHours: string;
  requiresDailyPickup: boolean;
  addressText: string;
  latitude: number;
  longitude: number;
  pickupLocation?: string;
  hasLoadingArea: boolean;
  accessNotes?: string;
  commercialRegistrationFile: HotelRegistrationStoredDocumentReference;
  delegationLetterFile?: HotelRegistrationStoredDocumentReference;
  delegationStatus: HotelDelegationStatus;
  delegationStatusLabelAr: string;
}

export interface ProviderOnboardingSummary extends OnboardingEntitySummary {
  legalEntityName?: string;
  commercialRegistrationNumber: string;
  taxRegistrationNumber: string;
  businessPhone: string;
  businessEmail: string;
  addressText: string;
  latitude: number;
  longitude: number;
  supportedServiceNamesAr: string[];
  dailyCapacityKg: number;
  pickupLeadTimeHours: number;
  executionTimeHours: number;
  deliveryTimeHours: number;
  workingDays: ProviderWorkingDay[];
  workingDaysLabelsAr: string[];
  workingHoursFrom: string;
  workingHoursTo: string;
  commercialRegistrationFile: ProviderRegistrationStoredDocumentReference;
  bankName: string;
  iban: string;
  bankAccountHolderName: string;
  accountSetupName: string;
  accountSetupPhone: string;
  accountSetupEmail: string;
}

export interface UpsertPlatformProductCommand {
  id?: string;
  nameAr: string;
  active: boolean;
}

export interface UpdatePlatformServiceMatrixCommand {
  matrixRowId: string;
  active?: boolean;
  isAvailable?: boolean;
  suggestedPriceSar?: number;
}

export interface SubmitProviderServicePricingCommand {
  providerId?: string;
  offerings: ProviderServicePricingInput[];
}

export interface ApproveProviderServicePricingCommand {
  offeringId: string;
}

export interface RejectProviderServicePricingCommand {
  offeringId: string;
  rejectionReasonAr?: string;
}

export interface AdminOnboardingData {
  hotels: HotelOnboardingSummary[];
  providers: ProviderOnboardingSummary[];
}

export interface RunMatchingCommand {
  order: LaundryOrder;
  providers?: ProviderProfile[];
  evaluatedAt?: string;
  matchingRunId?: string;
  weights?: Partial<MatchingScoreWeights>;
}

export interface AssignProviderCommand {
  order: LaundryOrder;
  provider: ProviderProfile;
  assignedAt?: string;
  attemptNumber?: number;
  responseWindowMinutes?: number;
  scoreBreakdown: ScoreBreakdown;
  eligibilityResult: EligibilityResult;
}

export interface AssignProviderPreview {
  assignment: Assignment;
  providerId: string;
  providerNameAr: string;
  responseDueAt?: string;
}

export interface RejectAssignmentCommand {
  orderId: string;
  providerId?: string;
}

export interface ExpireAssignmentCommand {
  orderId: string;
  referenceTime?: string;
}

export interface AutoReassignOrderCommand {
  orderId: string;
  reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired;
  referenceTime?: string;
}

export type ProviderExecutionStatus =
  | OrderStatus.PickupScheduled
  | OrderStatus.PickedUp
  | OrderStatus.InProcessing
  | OrderStatus.QualityCheck
  | OrderStatus.OutForDelivery
  | OrderStatus.Delivered;

export interface AdvanceProviderOrderExecutionCommand {
  orderId: string;
  nextStatus: ProviderExecutionStatus;
  providerId?: string;
  notesAr?: string;
}

export interface ConfirmHotelOrderCompletionCommand {
  orderId: string;
  hotelId?: string;
  notesAr?: string;
}

export interface MarkHotelInvoiceCollectedCommand {
  invoiceId: string;
  actorAccountId?: string;
}

export interface MarkProviderStatementPaidCommand {
  statementId: string;
  actorAccountId?: string;
}

export interface ReviewRegistrationCommand {
  entityId: string;
  reviewNotesAr?: string;
}

export interface CalculateAdminKpisResult {
  kpis: AdminKpi[];
}

export interface FetchMatchingTransparencyResult {
  orders: MatchingTransparencyOrder[];
}

export interface RegistrationLinkedAccountSummary {
  accountId: string;
  fullName?: string;
  email: string;
  role: AccountRole;
  roleLabelAr: string;
  status: AccountStatus;
  statusLabelAr: string;
  activationState: AccountActivationState;
  activationStateLabelAr: string;
  activationPath?: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface ActivateAccountCommand {
  token: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface RequestPasswordResetCommand {
  email: string;
}

export interface RequestPasswordResetResult {
  accepted: true;
  messageAr: string;
  resetPath?: string;
}

export interface ResendActivationCommand {
  accountId: string;
}

export interface ValidateActivationTokenCommand {
  token: string;
}

export interface ValidateResetPasswordTokenCommand {
  token: string;
}

export interface ResetPasswordCommand {
  token: string;
  password: string;
}

export interface SuspendAccountCommand {
  accountId: string;
  reasonAr?: string;
}

export interface ReactivateAccountCommand {
  accountId: string;
  reasonAr?: string;
}

export type AuthSessionResult = AuthenticatedAccountSession;

export interface CurrentAccountSessionResult {
  account: AccountProfile;
  session: AccountSessionProfile;
}

export interface AccountAdminSummary extends AccountProfile {
  roleLabelAr: string;
  statusLabelAr: string;
  activationStateLabelAr: string;
  passwordResetStateLabelAr: string;
  activationDelivery?: IdentityEmailDeliverySummary;
  passwordResetDelivery?: IdentityEmailDeliverySummary;
  lastIdentityOperationAt?: string;
}

export interface IdentityAuditEventSummary extends IdentityAuditEvent {
  typeLabelAr: string;
}

export interface IdentityAdminData {
  accounts: AccountAdminSummary[];
  auditEvents: IdentityAuditEventSummary[];
}

export interface PlatformSettingsAdminData {
  settings: PlatformSettings;
  runtime: PlatformRuntimeStatus;
  auditEntries: PlatformSettingsAuditEntry[];
}

export interface PlatformContentAdminData {
  entries: PlatformContentEntry[];
  auditEntries: PlatformContentAuditEntry[];
}

export type RegisterHotelCommand = HotelRegistrationInput;
export type RegisterProviderCommand = ProviderRegistrationInput;
export interface HotelRegistrationResult {
  hotel: HotelProfile;
  account: RegistrationLinkedAccountSummary;
  delivery?: IdentityEmailDeliverySummary;
}

export interface ProviderRegistrationResult {
  provider: ProviderProfile;
  account: RegistrationLinkedAccountSummary;
  delivery?: IdentityEmailDeliverySummary;
}
export type ApproveHotelRegistrationCommand = ReviewRegistrationCommand;
export type RejectHotelRegistrationCommand = ReviewRegistrationCommand;
export type ApproveProviderRegistrationCommand = ReviewRegistrationCommand;
export type RejectProviderRegistrationCommand = ReviewRegistrationCommand;

export type CreateHotelOrderCommand = CreateHotelOrderInput;
export type RunMatchingResult = MatchingRunResult;

export type ValidateActivationTokenResult = AccountTokenValidationResult;
export type ValidateResetPasswordTokenResult = AccountTokenValidationResult;
export type ResetPasswordResult = AuthSessionResult;
export type SuspendAccountResult = AccountAdminSummary;
export type ReactivateAccountResult = AccountAdminSummary;
export interface ResendActivationResult {
  account: RegistrationLinkedAccountSummary;
  delivery?: IdentityEmailDeliverySummary;
}

export type GetPlatformPageContentCommand = {
  pageKey: string;
  language: PlatformLanguage;
};

export type GetPlatformPageContentResult = PlatformPageContent;
export type GetPlatformSettingsResult = PlatformSettings;
export type UpdatePlatformSettingsResult = PlatformSettings;
export type ListPlatformSettingsAuditResult = PlatformSettingsAuditEntry[];
export type GetPlatformRuntimeStatusResult = PlatformRuntimeStatus;
export type UpdatePlatformSettingsCommand = PlatformSettingsUpdateCommand;
export type ListPlatformContentEntriesResult = PlatformContentEntry[];
export type UpdatePlatformContentEntryResult = PlatformContentEntry;
export type UpdatePlatformContentEntryCommand = PlatformContentEntryUpdateCommand;
export type ListPlatformContentAuditResult = PlatformContentAuditEntry[];
export type GetPlatformServiceCatalogAdminResult = PlatformServiceCatalogAdminData;
export type UpsertPlatformProductResult = PlatformProduct;
export type UpdatePlatformServiceMatrixResult = PlatformServiceMatrixSummary;
export type GetProviderServiceManagementResult = ProviderServiceManagementData;
export type SubmitProviderServicePricingResult = ProviderServiceManagementData;
export type GetProviderPricingAdminDataResult = ProviderPricingAdminData;
export type ApproveProviderServicePricingResult = ProviderServiceOffering;
export type RejectProviderServicePricingResult = ProviderServiceOffering;
export type GetHotelBillingDataResult = HotelBillingData;
export type GetProviderFinanceDataResult = ProviderFinanceData;
export type GetAdminFinanceDataResult = AdminFinanceData;
export type GetAdminFinancePageCommandResult = GetAdminFinancePageResult;
export type GetAdminFinancePageCommandInput = GetAdminFinancePageCommand;
export type ListAdminOrdersPageCommandInput = ListAdminOrdersPageCommand;
export type ListAdminOrdersPageCommandResult = ListAdminOrdersPageResult;
export type MarkHotelInvoiceCollectedResult = HotelInvoice;
export type MarkProviderStatementPaidResult = ProviderSettlementStatement;
