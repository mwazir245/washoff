import type { HotelProfile, HotelRegistrationInput } from "@/features/orders/model/hotel";
import type { LaundryOrder, CreateHotelOrderInput } from "@/features/orders/model/order";
import type { ProviderProfile, ProviderRegistrationInput } from "@/features/orders/model/provider";
import { ReassignmentReason } from "@/features/orders/model/assignment";
import type { ServiceCatalogItem } from "@/features/orders/model/service";
import type {
  ActivateAccountCommand,
  AdvanceProviderOrderExecutionCommand,
  AccountAdminSummary,
  ApproveProviderServicePricingResult,
  GetAdminFinanceDataResult,
  GetAdminFinancePageCommand,
  GetAdminFinancePageResult,
  GetHotelBillingDataResult,
  AuthSessionResult,
  ConfirmHotelOrderCompletionCommand,
  CurrentAccountSessionResult,
  GetPlatformServiceCatalogAdminResult,
  GetProviderPricingAdminDataResult,
  GetProviderFinanceDataResult,
  GetProviderServiceManagementResult,
  GetPlatformPageContentResult,
  GetPlatformRuntimeStatusResult,
  GetPlatformSettingsResult,
  HotelRegistrationResult,
  ListPlatformContentAuditResult,
  ListPlatformContentEntriesResult,
  ListPlatformSettingsAuditResult,
  ListAdminOrdersPageCommand,
  ListAdminOrdersPageResult,
  RegistrationLinkedAccountSummary,
  IdentityAuditEventSummary,
  LoginCommand,
  ReactivateAccountResult,
  RequestPasswordResetCommand,
  RequestPasswordResetResult,
  ResetPasswordCommand,
  ResetPasswordResult,
  SuspendAccountResult,
  SubmitProviderServicePricingCommand,
  SubmitProviderServicePricingResult,
  UpdatePlatformServiceMatrixCommand,
  UpdatePlatformServiceMatrixResult,
  UpdatePlatformContentEntryCommand,
  UpdatePlatformContentEntryResult,
  UpsertPlatformProductCommand,
  UpsertPlatformProductResult,
  UpdatePlatformSettingsCommand,
  UpdatePlatformSettingsResult,
  ValidateActivationTokenCommand,
  ValidateActivationTokenResult,
  ValidateResetPasswordTokenCommand,
  ValidateResetPasswordTokenResult,
  ProviderRegistrationResult,
  RejectProviderServicePricingCommand,
  RejectProviderServicePricingResult,
  MarkHotelInvoiceCollectedResult,
  MarkProviderStatementPaidResult,
  MarkHotelInvoiceCollectedCommand,
  MarkProviderStatementPaidCommand,
} from "@/features/orders/application/contracts/platform-contracts";

export interface WashoffPlatformQueryRepository {
  getCurrentAccountSession(): Promise<CurrentAccountSessionResult | null>;
  resolveAccountSession(sessionToken: string): Promise<CurrentAccountSessionResult | null>;
  listAccounts(): Promise<AccountAdminSummary[]>;
  listIdentityAuditEvents(): Promise<IdentityAuditEventSummary[]>;
  getPlatformSettings(): Promise<GetPlatformSettingsResult>;
  listPlatformSettingsAudit(): Promise<ListPlatformSettingsAuditResult>;
  getPlatformRuntimeStatus(): Promise<GetPlatformRuntimeStatusResult>;
  listPlatformContentEntries(pageKey?: string): Promise<ListPlatformContentEntriesResult>;
  listPlatformContentAudit(pageKey?: string): Promise<ListPlatformContentAuditResult>;
  getPlatformPageContent(pageKey: string, language: "ar" | "en"): Promise<GetPlatformPageContentResult>;
  getHotelProfile(hotelId?: string): Promise<HotelProfile>;
  listHotels(): Promise<HotelProfile[]>;
  listHotelRegistrations(): Promise<HotelProfile[]>;
  getProviderProfile(providerId?: string): Promise<ProviderProfile>;
  listProviders(): Promise<ProviderProfile[]>;
  listProviderRegistrations(): Promise<ProviderProfile[]>;
  listServiceCatalog(hotelId?: string): Promise<ServiceCatalogItem[]>;
  getPlatformServiceCatalogAdminData(): Promise<GetPlatformServiceCatalogAdminResult>;
  getProviderServiceManagement(providerId?: string): Promise<GetProviderServiceManagementResult>;
  getProviderPricingAdminData(): Promise<GetProviderPricingAdminDataResult>;
  getHotelBillingData(hotelId?: string): Promise<GetHotelBillingDataResult>;
  getProviderFinanceData(providerId?: string): Promise<GetProviderFinanceDataResult>;
  getAdminFinanceData(): Promise<GetAdminFinanceDataResult>;
  getAdminFinancePage?(command: GetAdminFinancePageCommand): Promise<GetAdminFinancePageResult>;
  listAllOrders(): Promise<LaundryOrder[]>;
  listAdminOrdersPage?(command: ListAdminOrdersPageCommand): Promise<ListAdminOrdersPageResult>;
  listHotelOrders(hotelId?: string): Promise<LaundryOrder[]>;
  listProviderIncomingOrders(providerId?: string): Promise<LaundryOrder[]>;
  listProviderActiveOrders(providerId?: string): Promise<LaundryOrder[]>;
}

export interface WashoffPlatformCommandRepository {
  login(command: LoginCommand): Promise<AuthSessionResult>;
  activateAccount(command: ActivateAccountCommand): Promise<AuthSessionResult>;
  validateActivationToken(command: ValidateActivationTokenCommand): Promise<ValidateActivationTokenResult>;
  requestPasswordReset(command: RequestPasswordResetCommand): Promise<RequestPasswordResetResult>;
  resendActivationEmail(accountId: string): Promise<RegistrationLinkedAccountSummary>;
  validateResetPasswordToken(
    command: ValidateResetPasswordTokenCommand,
  ): Promise<ValidateResetPasswordTokenResult>;
  resetPassword(command: ResetPasswordCommand): Promise<ResetPasswordResult>;
  logout(sessionToken?: string): Promise<void>;
  suspendAccount(accountId: string, reasonAr?: string): Promise<SuspendAccountResult>;
  reactivateAccount(accountId: string, reasonAr?: string): Promise<ReactivateAccountResult>;
  updatePlatformSettings(command: UpdatePlatformSettingsCommand): Promise<UpdatePlatformSettingsResult>;
  updatePlatformContentEntry(
    command: UpdatePlatformContentEntryCommand,
  ): Promise<UpdatePlatformContentEntryResult>;
  upsertPlatformProduct(command: UpsertPlatformProductCommand): Promise<UpsertPlatformProductResult>;
  updatePlatformServiceMatrix(
    command: UpdatePlatformServiceMatrixCommand,
  ): Promise<UpdatePlatformServiceMatrixResult>;
  submitProviderServicePricing(
    command: SubmitProviderServicePricingCommand,
  ): Promise<SubmitProviderServicePricingResult>;
  approveProviderServicePricing(offeringId: string): Promise<ApproveProviderServicePricingResult>;
  rejectProviderServicePricing(
    command: RejectProviderServicePricingCommand,
  ): Promise<RejectProviderServicePricingResult>;
  registerHotel(input: HotelRegistrationInput): Promise<HotelRegistrationResult>;
  registerProvider(input: ProviderRegistrationInput): Promise<ProviderRegistrationResult>;
  approveHotelRegistration(hotelId: string, reviewNotesAr?: string): Promise<HotelRegistrationResult>;
  rejectHotelRegistration(hotelId: string, reviewNotesAr?: string): Promise<HotelRegistrationResult>;
  approveProviderRegistration(providerId: string, reviewNotesAr?: string): Promise<ProviderRegistrationResult>;
  rejectProviderRegistration(providerId: string, reviewNotesAr?: string): Promise<ProviderRegistrationResult>;
  createHotelOrder(input: CreateHotelOrderInput): Promise<LaundryOrder>;
  acceptIncomingOrder(orderId: string, providerId?: string): Promise<LaundryOrder>;
  advanceProviderOrderExecution(command: AdvanceProviderOrderExecutionCommand): Promise<LaundryOrder>;
  confirmHotelOrderCompletion(command: ConfirmHotelOrderCompletionCommand): Promise<LaundryOrder>;
  markHotelInvoiceCollected(
    command: MarkHotelInvoiceCollectedCommand,
  ): Promise<MarkHotelInvoiceCollectedResult>;
  markProviderStatementPaid(
    command: MarkProviderStatementPaidCommand,
  ): Promise<MarkProviderStatementPaidResult>;
  rejectIncomingOrder(orderId: string, providerId?: string): Promise<LaundryOrder>;
  expirePendingAssignment(orderId: string, referenceTime?: string): Promise<LaundryOrder>;
  autoReassignOrder(
    orderId: string,
    reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
    referenceTime?: string,
  ): Promise<LaundryOrder>;
  runAssignmentExpirySweep(referenceTime?: string): Promise<LaundryOrder[]>;
}

export interface WashoffPlatformRepository
  extends WashoffPlatformQueryRepository, WashoffPlatformCommandRepository {}
