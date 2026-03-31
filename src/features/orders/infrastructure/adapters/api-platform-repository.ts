import type {
  AccountAdminSummary,
  ApproveProviderServicePricingCommand,
  ApproveProviderServicePricingResult,
  GetAdminFinanceDataResult,
  GetAdminFinancePageCommand,
  GetAdminFinancePageResult,
  CurrentAccountSessionResult,
  GetHotelBillingDataResult,
  GetPlatformServiceCatalogAdminResult,
  GetPlatformPageContentResult,
  GetProviderPricingAdminDataResult,
  GetProviderFinanceDataResult,
  GetProviderServiceManagementResult,
  GetPlatformRuntimeStatusResult,
  GetPlatformSettingsResult,
  HotelRegistrationResult,
  IdentityAuditEventSummary,
  ListPlatformContentAuditResult,
  ListPlatformContentEntriesResult,
  ListPlatformSettingsAuditResult,
  ListAdminOrdersPageCommand,
  ListAdminOrdersPageResult,
  ProviderRegistrationResult,
  RejectProviderServicePricingCommand,
  RejectProviderServicePricingResult,
  SubmitProviderServicePricingCommand,
  SubmitProviderServicePricingResult,
  MarkHotelInvoiceCollectedCommand,
  MarkHotelInvoiceCollectedResult,
  MarkProviderStatementPaidCommand,
  MarkProviderStatementPaidResult,
  UpdatePlatformServiceMatrixCommand,
  UpdatePlatformServiceMatrixResult,
  UpdatePlatformContentEntryCommand,
  UpdatePlatformSettingsCommand,
  UpsertPlatformProductCommand,
  UpsertPlatformProductResult,
} from "@/features/orders/application/contracts/platform-contracts";
import type { WashoffPlatformRepository } from "@/features/orders/application/ports/washoff-platform-repository";
import {
  WASHOFF_API_BASE_PATH,
  type AcceptAssignmentRequest,
  type AdvanceProviderOrderExecutionRequest,
  type ActivateAccountRequest,
  type ActivateAccountResponse,
  type AdminAccountsResponse,
  type AdminFinanceDataResponse,
  type AdminFinancePageResponse,
  type ApproveHotelRegistrationRequest,
  type ApproveProviderRegistrationRequest,
  type AutoReassignOrderRequest,
  type CreateHotelOrderRequest,
  type CurrentAccountSessionResponse,
  type ConfirmHotelOrderCompletionRequest,
  type HotelBillingDataResponse,
  type IdentityAuditResponse,
  type MarkHotelInvoiceCollectedRequest,
  type MarkHotelInvoiceCollectedResponse,
  type MarkProviderStatementPaidRequest,
  type MarkProviderStatementPaidResponse,
  type PlatformContentAuditResponse,
  type PlatformContentEntriesResponse,
  type PlatformServiceCatalogAdminResponse,
  type PlatformPageContentResponse,
  type PlatformRuntimeStatusResponse,
  type PlatformSettingsAuditResponse,
  type PlatformSettingsResponse,
  type ProviderFinanceDataResponse,
  type ProviderPricingAdminDataResponse,
  type ProviderServiceManagementResponse,
  type ExpireAssignmentRequest,
  type LoginRequest,
  type LoginResponse,
  type OrdersQueryParams,
  type AdminOrdersPageResponse,
  type ReactivateAccountRequest,
  type ResendActivationRequest,
  type ResendActivationResponse,
  type RequestPasswordResetRequest,
  type RequestPasswordResetResponse,
  type RegisterHotelRequest,
  type RegisterHotelResponse,
  type RegisterProviderRequest,
  type RegisterProviderResponse,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
  type RejectAssignmentRequest,
  type RejectHotelRegistrationRequest,
  type RejectProviderServicePricingRequest,
  type RejectProviderServicePricingResponse,
  type RejectProviderRegistrationRequest,
  type SubmitProviderServicePricingRequest,
  type SubmitProviderServicePricingResponse,
  type SuspendAccountRequest,
  type UpdatePlatformServiceMatrixRequest,
  type UpdatePlatformServiceMatrixResponse,
  type UpdatePlatformContentEntryRequest,
  type UpdatePlatformSettingsRequest,
  type UpsertPlatformProductRequest,
  type UpsertPlatformProductResponse,
  type ValidateActivationTokenRequest,
  type ValidateActivationTokenResponse,
  type ValidateResetPasswordTokenRequest,
  type ValidateResetPasswordTokenResponse,
  type WashoffApiEnvelope,
  type WashoffApiErrorEnvelope,
} from "@/features/orders/api/contracts/washoff-api-contracts";
import {
  buildWashoffApiAuthHeaders,
  clearAuthenticatedClientSession,
  writeAuthenticatedClientSession,
} from "@/features/orders/infrastructure/adapters/api-auth";
import type { ReassignmentReason } from "@/features/orders/model/assignment";
import type { HotelProfile, HotelRegistrationInput } from "@/features/orders/model/hotel";
import type { CreateHotelOrderInput, LaundryOrder } from "@/features/orders/model/order";
import type { ProviderProfile, ProviderRegistrationInput } from "@/features/orders/model/provider";
import type { ServiceCatalogItem } from "@/features/orders/model/service";

export interface ApiWashoffPlatformRepositoryOptions {
  baseUrl?: string;
}

const buildOrdersQuery = (params: OrdersQueryParams) => {
  const searchParams = new URLSearchParams();

  if (params.scope) {
    searchParams.set("scope", params.scope);
  }

  if (params.hotelId) {
    searchParams.set("hotelId", params.hotelId);
  }

  if (params.providerId) {
    searchParams.set("providerId", params.providerId);
  }

  const queryString = searchParams.toString();
  return queryString ? `/orders?${queryString}` : "/orders";
};

const appendOptionalQueryParam = (path: string, key: string, value?: string) => {
  if (!value) {
    return path;
  }

  const searchParams = new URLSearchParams();
  searchParams.set(key, value);
  return `${path}?${searchParams.toString()}`;
};

const buildQueryPath = (
  path: string,
  params: Record<string, string | number | undefined>,
) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};

const parseWashoffApiPayload = <ResponseValue,>(
  rawPayload: string,
): WashoffApiEnvelope<ResponseValue> | WashoffApiErrorEnvelope | null => {
  if (!rawPayload.trim().length) {
    return null;
  }

  return JSON.parse(rawPayload) as WashoffApiEnvelope<ResponseValue> | WashoffApiErrorEnvelope;
};

export const createApiWashoffPlatformRepository = (
  options: ApiWashoffPlatformRepositoryOptions = {},
): WashoffPlatformRepository => {
  const normalizedBaseUrl = options.baseUrl?.trim();
  const baseUrl = normalizedBaseUrl || WASHOFF_API_BASE_PATH;

  const request = async <ResponseValue, RequestBody = undefined>(
    path: string,
    init?: Omit<RequestInit, "body"> & { body?: RequestBody },
  ): Promise<ResponseValue> => {
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: init?.method ?? "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...buildWashoffApiAuthHeaders(),
          ...init?.headers,
        },
        body: init?.body ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new Error(`تعذر الاتصال بخادم WashOff أثناء الطلب ${path}.`);
    }

    const rawPayload = await response.text();
    const payload = parseWashoffApiPayload<ResponseValue>(rawPayload);

    if (!response.ok) {
      throw new Error(
        payload && "error" in payload
          ? payload.error
          : `تعذر إكمال الطلب من واجهة WashOff (${path} - ${response.status}).`,
      );
    }

    if (!payload) {
      return undefined as ResponseValue;
    }

    if (!("data" in payload)) {
      throw new Error(`تعذر قراءة استجابة واجهة WashOff (${path}).`);
    }

    return payload.data;
  };

  return {
    login: async (command) => {
      const session = await request<LoginResponse, LoginRequest>("/auth/login", {
        method: "POST",
        body: command,
      });
      writeAuthenticatedClientSession(session);
      return session;
    },

    activateAccount: async (command) => {
      const session = await request<ActivateAccountResponse, ActivateAccountRequest>("/auth/activate", {
        method: "POST",
        body: command,
      });
      writeAuthenticatedClientSession(session);
      return session;
    },

    validateActivationToken: (command) =>
      request<ValidateActivationTokenResponse>(
        `/auth/activation-status?token=${encodeURIComponent(command.token)}`,
      ),

    requestPasswordReset: (command) =>
      request<RequestPasswordResetResponse, RequestPasswordResetRequest>("/auth/forgot-password", {
        method: "POST",
        body: command,
      }),

    validateResetPasswordToken: (command) =>
      request<ValidateResetPasswordTokenResponse>(
        `/auth/reset-password/validate?token=${encodeURIComponent(command.token)}`,
      ),

    resetPassword: async (command) => {
      const session = await request<ResetPasswordResponse, ResetPasswordRequest>("/auth/reset-password", {
        method: "POST",
        body: command,
      });
      writeAuthenticatedClientSession(session);
      return session;
    },

    logout: async (_sessionToken?: string) => {
      try {
        await request<void, Record<string, never>>("/auth/logout", {
          method: "POST",
          body: {},
        });
      } finally {
        clearAuthenticatedClientSession();
      }
    },

    getCurrentAccountSession: async (): Promise<CurrentAccountSessionResult | null> => {
      try {
        return (await request<CurrentAccountSessionResponse | null>("/auth/session")) ?? null;
      } catch {
        return null;
      }
    },

    resolveAccountSession: async () => null,

    listAccounts: () => request<AdminAccountsResponse>("/admin/accounts"),

    listIdentityAuditEvents: () => request<IdentityAuditResponse>("/admin/identity-audit"),

    getPlatformSettings: () => request<PlatformSettingsResponse>("/admin/settings"),

    getPlatformServiceCatalogAdminData: () =>
      request<PlatformServiceCatalogAdminResponse>("/service-catalog/platform"),

    getHotelBillingData: (hotelId?: string) =>
      request<HotelBillingDataResponse>(
        appendOptionalQueryParam("/hotel/billing", "hotelId", hotelId),
      ),

    getProviderServiceManagement: () =>
      request<ProviderServiceManagementResponse>("/provider/services"),

    getProviderFinanceData: (providerId?: string) =>
      request<ProviderFinanceDataResponse>(
        appendOptionalQueryParam("/provider/finance", "providerId", providerId),
      ),

    getProviderPricingAdminData: () =>
      request<ProviderPricingAdminDataResponse>("/admin/provider-pricing"),

    getAdminFinanceData: () => request<AdminFinanceDataResponse>("/admin/finance"),

    getAdminFinancePage: (command: GetAdminFinancePageCommand) =>
      request<AdminFinancePageResponse>(
        buildQueryPath("/admin/finance/page", {
          invoicePage: command.invoicePage,
          invoicePageSize: command.invoicePageSize,
          invoiceSearch: command.invoiceSearch,
          invoiceStatus: command.invoiceStatus,
          invoiceDate: command.invoiceDate,
          statementPage: command.statementPage,
          statementPageSize: command.statementPageSize,
          statementSearch: command.statementSearch,
          statementStatus: command.statementStatus,
          statementDate: command.statementDate,
        }),
      ),

    listPlatformSettingsAudit: () =>
      request<PlatformSettingsAuditResponse>("/admin/settings/audit"),

    getPlatformRuntimeStatus: () =>
      request<PlatformRuntimeStatusResponse>("/admin/settings/runtime"),

    updatePlatformSettings: (command: UpdatePlatformSettingsCommand) =>
      request<PlatformSettingsResponse, UpdatePlatformSettingsRequest>("/admin/settings", {
        method: "PATCH",
        body: command,
      }),

    upsertPlatformProduct: (command: UpsertPlatformProductCommand) =>
      request<UpsertPlatformProductResponse, UpsertPlatformProductRequest>("/admin/services/products", {
        method: "POST",
        body: command,
      }),

    updatePlatformServiceMatrix: (command: UpdatePlatformServiceMatrixCommand) =>
      request<UpdatePlatformServiceMatrixResponse, UpdatePlatformServiceMatrixRequest>(
        `/admin/services/matrix/${encodeURIComponent(command.matrixRowId)}`,
        {
          method: "PATCH",
          body: command,
        },
      ),

    submitProviderServicePricing: (command: SubmitProviderServicePricingCommand) =>
      request<SubmitProviderServicePricingResponse, SubmitProviderServicePricingRequest>(
        "/provider/services",
        {
          method: "POST",
          body: command,
        },
      ),

    approveProviderServicePricing: (offeringId: string) =>
      request<ApproveProviderServicePricingResult, ApproveProviderServicePricingCommand>(
        `/admin/provider-pricing/${encodeURIComponent(offeringId)}/approve`,
        {
          method: "POST",
          body: { offeringId },
        },
      ),

    rejectProviderServicePricing: (command: RejectProviderServicePricingCommand) =>
      request<RejectProviderServicePricingResponse, RejectProviderServicePricingRequest>(
        `/admin/provider-pricing/${encodeURIComponent(command.offeringId)}/reject`,
        {
          method: "POST",
          body: command,
        },
      ),

    markHotelInvoiceCollected: (command: MarkHotelInvoiceCollectedCommand) =>
      request<MarkHotelInvoiceCollectedResponse, MarkHotelInvoiceCollectedRequest>(
        `/admin/finance/invoices/${encodeURIComponent(command.invoiceId)}/collect`,
        {
          method: "POST",
          body: command,
        },
      ),

    markProviderStatementPaid: (command: MarkProviderStatementPaidCommand) =>
      request<MarkProviderStatementPaidResponse, MarkProviderStatementPaidRequest>(
        `/admin/finance/provider-statements/${encodeURIComponent(command.statementId)}/pay`,
        {
          method: "POST",
          body: command,
        },
      ),

    listPlatformContentEntries: (pageKey?: string) =>
      request<PlatformContentEntriesResponse>(
        pageKey
          ? `/admin/content?page=${encodeURIComponent(pageKey)}`
          : "/admin/content",
      ),

    listPlatformContentAudit: (pageKey?: string) =>
      request<PlatformContentAuditResponse>(
        pageKey
          ? `/admin/content-audit?page=${encodeURIComponent(pageKey)}`
          : "/admin/content-audit",
      ),

    updatePlatformContentEntry: (command: UpdatePlatformContentEntryCommand) =>
      request<ListPlatformContentEntriesResult[number], UpdatePlatformContentEntryRequest>(
        `/admin/content/${encodeURIComponent(command.id)}`,
        {
          method: "PATCH",
          body: command,
        },
      ),

    getPlatformPageContent: (pageKey: string, language: "ar" | "en") =>
      request<GetPlatformPageContentResult>(
        `/content?page=${encodeURIComponent(pageKey)}&language=${encodeURIComponent(language)}`,
      ),

    suspendAccount: (accountId: string, reasonAr?: string) =>
      request<AccountAdminSummary, SuspendAccountRequest>(
        `/admin/accounts/${encodeURIComponent(accountId)}/suspend`,
        {
          method: "POST",
          body: {
            accountId,
            reasonAr,
          },
        },
      ),

    reactivateAccount: (accountId: string, reasonAr?: string) =>
      request<AccountAdminSummary, ReactivateAccountRequest>(
        `/admin/accounts/${encodeURIComponent(accountId)}/reactivate`,
        {
          method: "POST",
          body: {
            accountId,
            reasonAr,
          },
        },
      ),

    resendActivationEmail: (accountId: string) =>
      request<ResendActivationResponse, ResendActivationRequest>(
        `/admin/accounts/${encodeURIComponent(accountId)}/resend-activation`,
        {
          method: "POST",
          body: {
            accountId,
          },
        },
      ).then((result) => result.account),

    registerHotel: (input: HotelRegistrationInput) =>
      request<RegisterHotelResponse, RegisterHotelRequest>("/register/hotel", {
        method: "POST",
        body: input,
      }),

    registerProvider: (input: ProviderRegistrationInput) =>
      request<RegisterProviderResponse, RegisterProviderRequest>("/register/provider", {
        method: "POST",
        body: input,
      }),

    getHotelProfile: (hotelId?: string) =>
      request<HotelProfile>(appendOptionalQueryParam("/hotel-profile", "hotelId", hotelId)),

    listHotels: () => request<HotelProfile[]>("/hotels"),

    listHotelRegistrations: () => request<HotelProfile[]>("/admin/onboarding/hotels"),

    getProviderProfile: (providerId?: string) =>
      request<ProviderProfile>(appendOptionalQueryParam("/provider-profile", "providerId", providerId)),

    listProviders: () => request<ProviderProfile[]>("/providers"),

    listProviderRegistrations: () => request<ProviderProfile[]>("/admin/onboarding/providers"),

    listServiceCatalog: () => request<ServiceCatalogItem[]>("/service-catalog"),

    listAllOrders: () => request<LaundryOrder[]>(buildOrdersQuery({ scope: "all" })),

    listAdminOrdersPage: (command: ListAdminOrdersPageCommand) =>
      request<AdminOrdersPageResponse>(
        buildQueryPath("/admin/orders", {
          page: command.page,
          pageSize: command.pageSize,
          search: command.search,
          status: command.status,
          providerId: command.providerId,
          dateFrom: command.dateFrom,
          dateTo: command.dateTo,
        }),
      ),

    listHotelOrders: (hotelId?: string) =>
      request<LaundryOrder[]>(buildOrdersQuery({ scope: "hotel", hotelId })),

    listProviderIncomingOrders: (providerId?: string) =>
      request<LaundryOrder[]>(buildOrdersQuery({ scope: "provider-incoming", providerId })),

    listProviderActiveOrders: (providerId?: string) =>
      request<LaundryOrder[]>(buildOrdersQuery({ scope: "provider-active", providerId })),

    createHotelOrder: (input: CreateHotelOrderInput) =>
      request<LaundryOrder, CreateHotelOrderRequest>("/orders", {
        method: "POST",
        body: input,
      }),

    approveHotelRegistration: (hotelId: string, reviewNotesAr?: string) =>
      request<HotelRegistrationResult, ApproveHotelRegistrationRequest>(
        `/admin/onboarding/hotels/${encodeURIComponent(hotelId)}/approve`,
        {
          method: "POST",
          body: {
            entityId: hotelId,
            reviewNotesAr,
          },
        },
      ),

    rejectHotelRegistration: (hotelId: string, reviewNotesAr?: string) =>
      request<HotelRegistrationResult, RejectHotelRegistrationRequest>(
        `/admin/onboarding/hotels/${encodeURIComponent(hotelId)}/reject`,
        {
          method: "POST",
          body: {
            entityId: hotelId,
            reviewNotesAr,
          },
        },
      ),

    approveProviderRegistration: (providerId: string, reviewNotesAr?: string) =>
      request<ProviderRegistrationResult, ApproveProviderRegistrationRequest>(
        `/admin/onboarding/providers/${encodeURIComponent(providerId)}/approve`,
        {
          method: "POST",
          body: {
            entityId: providerId,
            reviewNotesAr,
          },
        },
      ),

    rejectProviderRegistration: (providerId: string, reviewNotesAr?: string) =>
      request<ProviderRegistrationResult, RejectProviderRegistrationRequest>(
        `/admin/onboarding/providers/${encodeURIComponent(providerId)}/reject`,
        {
          method: "POST",
          body: {
            entityId: providerId,
            reviewNotesAr,
          },
        },
      ),

    acceptIncomingOrder: (orderId: string, providerId?: string) =>
      request<LaundryOrder, AcceptAssignmentRequest>(`/orders/${encodeURIComponent(orderId)}/accept`, {
        method: "POST",
        body: {
          providerId,
        },
      }),

    advanceProviderOrderExecution: (command) =>
      request<LaundryOrder, AdvanceProviderOrderExecutionRequest>(
        `/orders/${encodeURIComponent(command.orderId)}/execution-status`,
        {
          method: "POST",
          body: command,
        },
      ),

    confirmHotelOrderCompletion: (command) =>
      request<LaundryOrder, ConfirmHotelOrderCompletionRequest>(
        `/orders/${encodeURIComponent(command.orderId)}/complete`,
        {
          method: "POST",
          body: command,
        },
      ),

    rejectIncomingOrder: (orderId: string, providerId?: string) =>
      request<LaundryOrder, RejectAssignmentRequest>(`/orders/${encodeURIComponent(orderId)}/reject`, {
        method: "POST",
        body: {
          orderId,
          providerId,
        },
      }),

    expirePendingAssignment: (orderId: string, referenceTime?: string) =>
      request<LaundryOrder, ExpireAssignmentRequest>(`/orders/${encodeURIComponent(orderId)}/expire`, {
        method: "POST",
        body: {
          orderId,
          referenceTime,
        },
      }),

    autoReassignOrder: (orderId: string, reason: ReassignmentReason, referenceTime?: string) =>
      request<LaundryOrder, AutoReassignOrderRequest>(`/orders/${encodeURIComponent(orderId)}/reassign`, {
        method: "POST",
        body: {
          orderId,
          reason,
          referenceTime,
        },
      }),

    runAssignmentExpirySweep: (referenceTime?: string) =>
      request<LaundryOrder[], Pick<ExpireAssignmentRequest, "referenceTime">>("/assignment-expiry-sweep", {
        method: "POST",
        body: {
          referenceTime,
        },
      }),
  };
};
