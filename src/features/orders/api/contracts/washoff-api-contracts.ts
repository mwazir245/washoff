import type {
  ActivateAccountCommand,
  AdvanceProviderOrderExecutionCommand,
  AccountAdminSummary,
  ApproveProviderServicePricingCommand,
  ApproveProviderServicePricingResult,
  GetPlatformPageContentResult,
  GetPlatformRuntimeStatusResult,
  GetPlatformSettingsResult,
  AdminOnboardingData,
  ApproveHotelRegistrationCommand,
  ApproveProviderRegistrationCommand,
  AutoReassignOrderCommand,
  AuthSessionResult,
  ConfirmHotelOrderCompletionCommand,
  CurrentAccountSessionResult,
  CreateHotelOrderCommand,
  ExpireAssignmentCommand,
  GetAdminFinanceDataResult,
  GetAdminFinancePageCommand,
  GetAdminFinancePageResult,
  GetHotelBillingDataResult,
  GetPlatformServiceCatalogAdminResult,
  GetProviderPricingAdminDataResult,
  GetProviderFinanceDataResult,
  GetProviderServiceManagementResult,
  HotelRegistrationResult,
  IdentityAuditEventSummary,
  ListPlatformContentAuditResult,
  ListPlatformContentEntriesResult,
  ListPlatformSettingsAuditResult,
  ListAdminOrdersPageCommand,
  ListAdminOrdersPageResult,
  LoginCommand,
  ReactivateAccountCommand,
  RequestPasswordResetCommand,
  RequestPasswordResetResult,
  ResendActivationCommand,
  ResendActivationResult,
  ResetPasswordCommand,
  ResetPasswordResult,
  MarkHotelInvoiceCollectedCommand,
  MarkHotelInvoiceCollectedResult,
  MarkProviderStatementPaidCommand,
  MarkProviderStatementPaidResult,
  ProviderRegistrationResult,
  RegisterHotelCommand,
  RegisterProviderCommand,
  RejectHotelRegistrationCommand,
  RejectAssignmentCommand,
  RejectProviderServicePricingCommand,
  RejectProviderServicePricingResult,
  RejectProviderRegistrationCommand,
  RunMatchingCommand,
  SubmitProviderServicePricingCommand,
  SubmitProviderServicePricingResult,
  SuspendAccountCommand,
  UpdatePlatformServiceMatrixCommand,
  UpdatePlatformServiceMatrixResult,
  UpdatePlatformContentEntryCommand,
  UpdatePlatformSettingsCommand,
  UpsertPlatformProductCommand,
  UpsertPlatformProductResult,
  ValidateActivationTokenCommand,
  ValidateActivationTokenResult,
  ValidateResetPasswordTokenCommand,
  ValidateResetPasswordTokenResult,
} from "@/features/orders/application/contracts/platform-contracts";

export const WASHOFF_API_BASE_PATH = "/api/platform";

export type OrdersQueryScope = "all" | "hotel" | "provider-incoming" | "provider-active";

export interface OrdersQueryParams {
  scope?: OrdersQueryScope;
  hotelId?: string;
  providerId?: string;
}

export interface WashoffApiEnvelope<Value> {
  data: Value;
}

export interface WashoffApiErrorEnvelope {
  error: string;
}

export type CreateHotelOrderRequest = CreateHotelOrderCommand;
export type RegisterHotelRequest = RegisterHotelCommand;
export type RegisterProviderRequest = RegisterProviderCommand;
export type LoginRequest = LoginCommand;
export type ActivateAccountRequest = ActivateAccountCommand;
export type ValidateActivationTokenRequest = ValidateActivationTokenCommand;
export type RequestPasswordResetRequest = RequestPasswordResetCommand;
export type ValidateResetPasswordTokenRequest = ValidateResetPasswordTokenCommand;
export type ResetPasswordRequest = ResetPasswordCommand;
export type ApproveHotelRegistrationRequest = ApproveHotelRegistrationCommand;
export type RejectHotelRegistrationRequest = RejectHotelRegistrationCommand;
export type ApproveProviderRegistrationRequest = ApproveProviderRegistrationCommand;
export type RejectProviderRegistrationRequest = RejectProviderRegistrationCommand;
export type SuspendAccountRequest = SuspendAccountCommand;
export type ReactivateAccountRequest = ReactivateAccountCommand;
export type ResendActivationRequest = ResendActivationCommand;
export type AdvanceProviderOrderExecutionRequest = AdvanceProviderOrderExecutionCommand;
export type ConfirmHotelOrderCompletionRequest = ConfirmHotelOrderCompletionCommand;
export type MarkHotelInvoiceCollectedRequest = MarkHotelInvoiceCollectedCommand;
export type MarkProviderStatementPaidRequest = MarkProviderStatementPaidCommand;
export type UpdatePlatformSettingsRequest = UpdatePlatformSettingsCommand;
export type UpdatePlatformContentEntryRequest = UpdatePlatformContentEntryCommand;
export type UpsertPlatformProductRequest = UpsertPlatformProductCommand;
export type UpdatePlatformServiceMatrixRequest = UpdatePlatformServiceMatrixCommand;
export type SubmitProviderServicePricingRequest = SubmitProviderServicePricingCommand;
export type ApproveProviderServicePricingRequest = ApproveProviderServicePricingCommand;
export type RejectProviderServicePricingRequest = RejectProviderServicePricingCommand;

export interface AcceptAssignmentRequest {
  providerId?: string;
}

export type RejectAssignmentRequest = RejectAssignmentCommand;
export type ExpireAssignmentRequest = ExpireAssignmentCommand;
export type AutoReassignOrderRequest = AutoReassignOrderCommand;
export type RunMatchingRequest = RunMatchingCommand;
export type AdminOnboardingResponse = AdminOnboardingData;
export type AdminOrdersPageRequest = ListAdminOrdersPageCommand;
export type AdminOrdersPageResponse = ListAdminOrdersPageResult;
export type CurrentAccountSessionResponse = CurrentAccountSessionResult | null;
export type LoginResponse = AuthSessionResult;
export type ActivateAccountResponse = AuthSessionResult;
export type ValidateActivationTokenResponse = ValidateActivationTokenResult;
export type RequestPasswordResetResponse = RequestPasswordResetResult;
export type ResendActivationResponse = ResendActivationResult;
export type ValidateResetPasswordTokenResponse = ValidateResetPasswordTokenResult;
export type ResetPasswordResponse = ResetPasswordResult;
export type RegisterHotelResponse = HotelRegistrationResult;
export type RegisterProviderResponse = ProviderRegistrationResult;
export type AdminAccountsResponse = AccountAdminSummary[];
export type IdentityAuditResponse = IdentityAuditEventSummary[];
export type PlatformSettingsResponse = GetPlatformSettingsResult;
export type PlatformSettingsAuditResponse = ListPlatformSettingsAuditResult;
export type PlatformRuntimeStatusResponse = GetPlatformRuntimeStatusResult;
export type PlatformContentEntriesResponse = ListPlatformContentEntriesResult;
export type PlatformContentAuditResponse = ListPlatformContentAuditResult;
export type PlatformPageContentResponse = GetPlatformPageContentResult;
export type PlatformServiceCatalogAdminResponse = GetPlatformServiceCatalogAdminResult;
export type ProviderServiceManagementResponse = GetProviderServiceManagementResult;
export type ProviderPricingAdminDataResponse = GetProviderPricingAdminDataResult;
export type HotelBillingDataResponse = GetHotelBillingDataResult;
export type ProviderFinanceDataResponse = GetProviderFinanceDataResult;
export type AdminFinanceDataResponse = GetAdminFinanceDataResult;
export type AdminFinancePageRequest = GetAdminFinancePageCommand;
export type AdminFinancePageResponse = GetAdminFinancePageResult;
export type UpsertPlatformProductResponse = UpsertPlatformProductResult;
export type UpdatePlatformServiceMatrixResponse = UpdatePlatformServiceMatrixResult;
export type SubmitProviderServicePricingResponse = SubmitProviderServicePricingResult;
export type ApproveProviderServicePricingResponse = ApproveProviderServicePricingResult;
export type RejectProviderServicePricingResponse = RejectProviderServicePricingResult;
export type MarkHotelInvoiceCollectedResponse = MarkHotelInvoiceCollectedResult;
export type MarkProviderStatementPaidResponse = MarkProviderStatementPaidResult;
