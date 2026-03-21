import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  AdvanceProviderOrderExecutionCommand,
  ConfirmHotelOrderCompletionCommand,
  UpdatePlatformContentEntryCommand,
  UpdatePlatformSettingsCommand,
} from "../../src/features/orders/application/contracts/platform-contracts";
import type { HotelRegistrationInput } from "../../src/features/orders/model/hotel";
import {
  assertValidWashoffSessionToken,
  isWashoffApiAuthError,
  requireWashoffRole,
  resolveAuthorizedHotelId,
  resolveAuthorizedProviderId,
  resolveWashoffApiCaller,
  type WashoffApiAuthConfig,
  type WashoffApiCaller,
} from "./auth";
import type { WashoffLogger } from "./logger";
import type { WashoffMetrics } from "./metrics";
import {
  WashoffRateLimitError,
  createInMemoryWashoffRateLimiter,
  type WashoffRateLimitPolicy,
  type WashoffRateLimiter,
} from "./rate-limit";
import { readStoredHotelRegistrationDocument } from "./hotel-registration-documents";

export const WASHOFF_API_BASE_PATH = "/api/platform";

type OrdersQueryScope = "all" | "hotel" | "provider-incoming" | "provider-active";

interface AcceptAssignmentRequest {
  providerId?: string;
}

interface RejectAssignmentRequest {
  orderId: string;
  providerId?: string;
}

interface ExpireAssignmentRequest {
  orderId: string;
  referenceTime?: string;
}

interface AutoReassignOrderRequest {
  orderId: string;
  reason: string;
  referenceTime?: string;
}

type AdvanceProviderOrderExecutionRequest = AdvanceProviderOrderExecutionCommand;
type ConfirmHotelOrderCompletionRequest = ConfirmHotelOrderCompletionCommand;
type UpdatePlatformSettingsRequest = UpdatePlatformSettingsCommand;
type UpdatePlatformContentEntryRequest = UpdatePlatformContentEntryCommand;

interface CreateHotelOrderRequest {
  hotelId?: string;
  serviceIds: string[];
  itemCount: number;
  pickupAt: string;
  notes?: string;
  notesAr?: string;
  assignmentMode?: "auto";
  priority?: string;
}

type RegisterHotelRequest = HotelRegistrationInput;

interface RegisterProviderRequest {
  providerName: string;
  city: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  supportedServiceIds: string[];
  dailyCapacityKg: number;
  notesAr?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ActivateAccountRequest {
  token: string;
  password: string;
  fullName?: string;
  phone?: string;
}

interface RequestPasswordResetRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ReviewRegistrationRequest {
  entityId?: string;
  reviewNotesAr?: string;
}

interface AccountAdminActionRequest {
  reasonAr?: string;
}

interface WashoffApiEnvelope<Value> {
  data: Value;
}

interface WashoffApiErrorEnvelope {
  error: string;
}

export interface WashoffApiRuntime {
  config: {
    authMode: WashoffApiAuthConfig["authMode"];
    internalApiKey?: string;
    workerEnabled: boolean;
    workerPollIntervalMs: number;
    persistenceMode: "file" | "db";
  };
  repository: {
    getCurrentAccountSession(): Promise<unknown>;
    resolveAccountSession(sessionToken: string): Promise<unknown>;
    listAccounts(): Promise<unknown>;
    listIdentityAuditEvents(): Promise<unknown>;
    getPlatformSettings(): Promise<unknown>;
    listPlatformSettingsAudit(): Promise<unknown>;
    getPlatformRuntimeStatus(): Promise<unknown>;
    listPlatformContentEntries(pageKey?: string): Promise<unknown>;
    listPlatformContentAudit(pageKey?: string): Promise<unknown>;
    getPlatformPageContent(pageKey: string, language: "ar" | "en"): Promise<unknown>;
    getHotelProfile(hotelId?: string): Promise<unknown>;
    listHotels(): Promise<unknown>;
    listHotelRegistrations(): Promise<unknown>;
    getProviderProfile(providerId?: string): Promise<unknown>;
    listProviders(): Promise<unknown>;
    listProviderRegistrations(): Promise<unknown>;
    listServiceCatalog(): Promise<unknown>;
    listAllOrders(): Promise<unknown>;
    listHotelOrders(hotelId?: string): Promise<unknown>;
    listProviderIncomingOrders(providerId?: string): Promise<unknown>;
    listProviderActiveOrders(providerId?: string): Promise<unknown>;
  };
  service: {
    login(command: LoginRequest): Promise<unknown>;
    validateActivationToken(command: { token: string }): Promise<unknown>;
    activateAccount(command: ActivateAccountRequest): Promise<unknown>;
    requestPasswordReset(command: RequestPasswordResetRequest): Promise<unknown>;
    resendActivationEmail(command: { accountId: string }): Promise<unknown>;
    validateResetPasswordToken(command: { token: string }): Promise<unknown>;
    resetPassword(command: ResetPasswordRequest): Promise<unknown>;
    logout(sessionToken?: string): Promise<void>;
    updatePlatformSettings(command: UpdatePlatformSettingsRequest): Promise<unknown>;
    updatePlatformContentEntry(command: UpdatePlatformContentEntryRequest): Promise<unknown>;
    suspendAccount(command: { accountId: string; reasonAr?: string }): Promise<unknown>;
    reactivateAccount(command: { accountId: string; reasonAr?: string }): Promise<unknown>;
    registerHotel(command: RegisterHotelRequest): Promise<unknown>;
    registerProvider(command: RegisterProviderRequest): Promise<unknown>;
    approveHotelRegistration(command: ReviewRegistrationRequest): Promise<unknown>;
    rejectHotelRegistration(command: ReviewRegistrationRequest): Promise<unknown>;
    approveProviderRegistration(command: ReviewRegistrationRequest): Promise<unknown>;
    rejectProviderRegistration(command: ReviewRegistrationRequest): Promise<unknown>;
    createHotelOrder(command: CreateHotelOrderRequest): Promise<unknown>;
    runMatching(command: unknown): Promise<unknown>;
    getAdminDashboardData(): Promise<unknown>;
    runAssignmentExpirySweep(referenceTime?: string): Promise<unknown>;
    acceptIncomingOrder(orderId: string, providerId?: string): Promise<unknown>;
    advanceProviderOrderExecution(command: AdvanceProviderOrderExecutionRequest): Promise<unknown>;
    confirmHotelOrderCompletion(command: ConfirmHotelOrderCompletionRequest): Promise<unknown>;
    rejectAssignment(command: RejectAssignmentRequest): Promise<unknown>;
    expireAssignment(command: ExpireAssignmentRequest): Promise<unknown>;
    autoReassignOrder(command: AutoReassignOrderRequest): Promise<unknown>;
  };
  expiryWorker: {
    runOnce(referenceTime?: string): Promise<unknown>;
  };
}

export interface WashoffApiHandlerOptions {
  getRuntime(): Promise<WashoffApiRuntime>;
  ensureWorkerLoop?(): Promise<void>;
  logger: WashoffLogger;
  metrics: WashoffMetrics;
  rateLimiter?: WashoffRateLimiter;
}

class WashoffApiRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "WashoffApiRequestError";
    this.statusCode = statusCode;
  }
}

const REQUEST_RATE_LIMIT_POLICY: WashoffRateLimitPolicy = {
  name: "api_requests",
  limit: 240,
  windowMs: 60_000,
};

const LOGIN_RATE_LIMIT_POLICY: WashoffRateLimitPolicy = {
  name: "login",
  limit: 10,
  windowMs: 60_000,
};

const PASSWORD_RESET_RATE_LIMIT_POLICY: WashoffRateLimitPolicy = {
  name: "password_reset",
  limit: 5,
  windowMs: 15 * 60_000,
};

const ACTIVATION_RATE_LIMIT_POLICY: WashoffRateLimitPolicy = {
  name: "activation",
  limit: 10,
  windowMs: 15 * 60_000,
};

const readJsonBody = async <Body>(request: IncomingMessage): Promise<Body> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as Body;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Body;
  } catch {
    throw new WashoffApiRequestError("تعذر قراءة جسم الطلب بصيغة JSON صالحة.", 400);
  }
};

const sendJson = <Value>(
  response: ServerResponse,
  statusCode: number,
  payload: WashoffApiEnvelope<Value> | WashoffApiErrorEnvelope,
) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const buildUrl = (request: IncomingMessage) => new URL(request.url ?? "/", "http://washoff.local");

const matchOnboardingActionPath = (pathname: string) => {
  const match = new RegExp(
    `^${WASHOFF_API_BASE_PATH}/admin/onboarding/(hotels|providers)/([^/]+)/(approve|reject)$`,
  ).exec(pathname);

  if (!match) {
    return undefined;
  }

  return {
    entityType: match[1] as "hotels" | "providers",
    entityId: decodeURIComponent(match[2]),
    action: match[3] as "approve" | "reject",
  };
};

const matchOrderActionPath = (pathname: string) => {
  const match = new RegExp(
    `^${WASHOFF_API_BASE_PATH}/orders/([^/]+)/(accept|reject|expire|reassign|execution-status|complete)$`,
  ).exec(
    pathname,
  );

  if (!match) {
    return undefined;
  }

  return {
    orderId: decodeURIComponent(match[1]),
    action: match[2] as "accept" | "reject" | "expire" | "reassign" | "execution-status" | "complete",
  };
};

const matchAccountActionPath = (pathname: string) => {
  const match = new RegExp(
    `^${WASHOFF_API_BASE_PATH}/admin/accounts/([^/]+)/(suspend|reactivate|resend-activation)$`,
  ).exec(pathname);

  if (!match) {
    return undefined;
  }

  return {
    accountId: decodeURIComponent(match[1]),
    action: match[2] as "suspend" | "reactivate" | "resend-activation",
  };
};

const matchAdminContentPath = (pathname: string) => {
  const match = new RegExp(`^${WASHOFF_API_BASE_PATH}/admin/content/([^/]+)$`).exec(pathname);

  if (!match) {
    return undefined;
  }

  return {
    contentEntryId: decodeURIComponent(match[1]),
  };
};

const matchHotelDocumentPath = (pathname: string) => {
  const match = new RegExp(
    `^${WASHOFF_API_BASE_PATH}/hotels/([^/]+)/documents/(commercial-registration|delegation-letter)$`,
  ).exec(pathname);

  if (!match) {
    return undefined;
  }

  return {
    hotelId: decodeURIComponent(match[1]),
    kind: match[2] === "commercial-registration" ? "commercial_registration" : "delegation_letter",
  } as const;
};

const withRole = <Value>(
  caller: WashoffApiCaller,
  allowedRoles: Array<"hotel" | "provider" | "admin" | "worker">,
  operation: () => Promise<Value>,
) => {
  requireWashoffRole(caller, allowedRoles);
  return operation();
};

const buildClientAddress = (request: IncomingMessage) => {
  const forwardedForHeader = request.headers["x-forwarded-for"];
  const rawForwardedFor = Array.isArray(forwardedForHeader)
    ? forwardedForHeader[0]
    : forwardedForHeader;

  if (rawForwardedFor) {
    return rawForwardedFor.split(",")[0].trim();
  }

  return request.socket.remoteAddress ?? "unknown";
};

const normalizeEmailKey = (value?: string) => value?.trim().toLowerCase() || "unknown";

const buildStatusClass = (statusCode: number) => {
  return `${Math.floor(statusCode / 100)}xx`;
};

const resolveErrorStatusCode = (error: unknown) => {
  if (isWashoffApiAuthError(error)) {
    return error.statusCode;
  }

  if (error instanceof WashoffRateLimitError) {
    return error.statusCode;
  }

  if (error instanceof WashoffApiRequestError) {
    return error.statusCode;
  }

  return 400;
};

const resolveErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ غير متوقع في خادم WashOff.";
};

const isAuthPath = (pathname: string) => pathname.startsWith(`${WASHOFF_API_BASE_PATH}/auth/`);

export const createWashoffApiHandler = (options: WashoffApiHandlerOptions) => {
  const rateLimiter = options.rateLimiter ?? createInMemoryWashoffRateLimiter();

  const resolveCaller = async (request: IncomingMessage) => {
    const runtime = await options.getRuntime();
    return resolveWashoffApiCaller(request, {
      authMode: runtime.config.authMode,
      internalApiKey: runtime.config.internalApiKey,
      sessionResolver: {
        resolveAccountSession: runtime.repository.resolveAccountSession,
      },
    });
  };

  const handleOrdersQuery = async (
    runtime: WashoffApiRuntime,
    caller: WashoffApiCaller,
    scope: OrdersQueryScope | null,
    requestUrl: URL,
  ) => {
    switch (scope) {
      case "hotel":
        return withRole(caller, ["hotel", "admin"], () =>
          runtime.repository.listHotelOrders(
            resolveAuthorizedHotelId(caller, requestUrl.searchParams.get("hotelId") ?? undefined),
          ),
        );
      case "provider-incoming":
        return withRole(caller, ["provider", "admin"], () =>
          runtime.repository.listProviderIncomingOrders(
            resolveAuthorizedProviderId(caller, requestUrl.searchParams.get("providerId") ?? undefined),
          ),
        );
      case "provider-active":
        return withRole(caller, ["provider", "admin"], () =>
          runtime.repository.listProviderActiveOrders(
            resolveAuthorizedProviderId(caller, requestUrl.searchParams.get("providerId") ?? undefined),
          ),
        );
      case "all":
      case null:
        return withRole(caller, ["admin"], () => runtime.repository.listAllOrders());
      default:
        throw new WashoffApiRequestError("نطاق الطلب غير مدعوم في واجهة WashOff الحالية.", 400);
    }
  };

  return async (request: IncomingMessage, response: ServerResponse) => {
    const requestUrl = buildUrl(request);
    const pathname = requestUrl.pathname;
    const method = request.method ?? "GET";
    const clientAddress = buildClientAddress(request);
    const startedAt = Date.now();

    if (pathname === "/health") {
      const runtime = await options.getRuntime();
      sendJson(response, 200, {
        data: {
          status: "ok",
          checkedAt: new Date().toISOString(),
          persistenceMode: runtime.config.persistenceMode,
          workerEnabled: runtime.config.workerEnabled,
        },
      });
      options.metrics.incrementCounter("washoff_api_requests_total", {
        method,
        path: pathname,
        statusClass: "2xx",
      });
      options.logger.info("api.request_completed", {
        method,
        path: pathname,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
      });
      return true;
    }

    if (!pathname.startsWith(WASHOFF_API_BASE_PATH)) {
      return false;
    }

    let statusCode = 200;

    try {
      await options.ensureWorkerLoop?.();
      const runtime = await options.getRuntime();
      rateLimiter.enforce(REQUEST_RATE_LIMIT_POLICY, clientAddress);

      if (method === "POST" && pathname === `${WASHOFF_API_BASE_PATH}/register/hotel`) {
        const body = await readJsonBody<RegisterHotelRequest>(request);
        statusCode = 201;
        sendJson(response, statusCode, {
          data: await runtime.service.registerHotel(body),
        });
      } else if (method === "POST" && pathname === `${WASHOFF_API_BASE_PATH}/register/provider`) {
        const body = await readJsonBody<RegisterProviderRequest>(request);
        statusCode = 201;
        sendJson(response, statusCode, {
          data: await runtime.service.registerProvider(body),
        });
      } else if (method === "POST" && pathname === `${WASHOFF_API_BASE_PATH}/auth/login`) {
        const body = await readJsonBody<LoginRequest>(request);
        rateLimiter.enforce(
          LOGIN_RATE_LIMIT_POLICY,
          `${clientAddress}:${normalizeEmailKey(body.email)}`,
        );
        sendJson(response, 200, {
          data: await runtime.service.login(body),
        });
        options.metrics.incrementCounter("washoff_auth_events_total", {
          event: "login_succeeded",
        });
        options.logger.info("auth.login_succeeded", {
          email: normalizeEmailKey(body.email),
          clientAddress,
        });
      } else if (
        method === "GET" &&
        pathname === `${WASHOFF_API_BASE_PATH}/auth/activation-status`
      ) {
        rateLimiter.enforce(
          ACTIVATION_RATE_LIMIT_POLICY,
          `${clientAddress}:${requestUrl.searchParams.get("token") ?? "tokenless"}`,
        );
        sendJson(response, 200, {
          data: await runtime.service.validateActivationToken({
            token: requestUrl.searchParams.get("token") ?? "",
          }),
        });
      } else if (method === "POST" && pathname === `${WASHOFF_API_BASE_PATH}/auth/activate`) {
        const body = await readJsonBody<ActivateAccountRequest>(request);
        rateLimiter.enforce(ACTIVATION_RATE_LIMIT_POLICY, `${clientAddress}:${body.token}`);
        sendJson(response, 200, {
          data: await runtime.service.activateAccount(body),
        });
        options.metrics.incrementCounter("washoff_auth_events_total", {
          event: "activation_completed",
        });
        options.logger.info("auth.activation_completed", {
          clientAddress,
        });
      } else if (
        method === "POST" &&
        pathname === `${WASHOFF_API_BASE_PATH}/auth/forgot-password`
      ) {
        const body = await readJsonBody<RequestPasswordResetRequest>(request);
        rateLimiter.enforce(
          PASSWORD_RESET_RATE_LIMIT_POLICY,
          `${clientAddress}:${normalizeEmailKey(body.email)}`,
        );
        sendJson(response, 200, {
          data: await runtime.service.requestPasswordReset(body),
        });
        options.metrics.incrementCounter("washoff_auth_events_total", {
          event: "password_reset_requested",
        });
        options.logger.info("auth.password_reset_requested", {
          email: normalizeEmailKey(body.email),
          clientAddress,
        });
      } else if (
        method === "GET" &&
        pathname === `${WASHOFF_API_BASE_PATH}/auth/reset-password/validate`
      ) {
        rateLimiter.enforce(
          PASSWORD_RESET_RATE_LIMIT_POLICY,
          `${clientAddress}:${requestUrl.searchParams.get("token") ?? "tokenless"}`,
        );
        sendJson(response, 200, {
          data: await runtime.service.validateResetPasswordToken({
            token: requestUrl.searchParams.get("token") ?? "",
          }),
        });
      } else if (
        method === "POST" &&
        pathname === `${WASHOFF_API_BASE_PATH}/auth/reset-password`
      ) {
        const body = await readJsonBody<ResetPasswordRequest>(request);
        rateLimiter.enforce(PASSWORD_RESET_RATE_LIMIT_POLICY, `${clientAddress}:${body.token}`);
        sendJson(response, 200, {
          data: await runtime.service.resetPassword(body),
        });
        options.metrics.incrementCounter("washoff_auth_events_total", {
          event: "password_reset_completed",
        });
        options.logger.info("auth.password_reset_completed", {
          clientAddress,
        });
      } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/auth/session`) {
        const authorizationHeader = request.headers.authorization;
        const sessionToken =
          typeof authorizationHeader === "string" && authorizationHeader.startsWith("Bearer ")
            ? authorizationHeader.slice("Bearer ".length).trim()
            : Array.isArray(request.headers["x-washoff-session-token"])
              ? request.headers["x-washoff-session-token"][0]
              : request.headers["x-washoff-session-token"];

        if (!sessionToken) {
          sendJson(response, 200, {
            data: null,
          });
        } else {
          const validatedSessionToken = assertValidWashoffSessionToken(sessionToken);
          sendJson(response, 200, {
            data: await runtime.repository.resolveAccountSession(validatedSessionToken),
          });
        }
      } else if (method === "POST" && pathname === `${WASHOFF_API_BASE_PATH}/auth/logout`) {
        const sessionHeader =
          typeof request.headers.authorization === "string" &&
          request.headers.authorization.startsWith("Bearer ")
            ? request.headers.authorization.slice("Bearer ".length).trim()
            : Array.isArray(request.headers["x-washoff-session-token"])
              ? request.headers["x-washoff-session-token"][0]
              : request.headers["x-washoff-session-token"];

        await runtime.service.logout(
          sessionHeader ? assertValidWashoffSessionToken(sessionHeader) : undefined,
        );
        sendJson(response, 200, {
          data: null,
        });
        options.metrics.incrementCounter("washoff_auth_events_total", {
          event: "logout",
        });
      } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/service-catalog`) {
        sendJson(response, 200, {
          data: await runtime.repository.listServiceCatalog(),
        });
      } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/content`) {
        sendJson(response, 200, {
          data: await runtime.repository.getPlatformPageContent(
            requestUrl.searchParams.get("page") ?? "",
            requestUrl.searchParams.get("language") === "en" ? "en" : "ar",
          ),
        });
      } else {
        const caller = await resolveCaller(request);
        const orderAction = matchOrderActionPath(pathname);
        const onboardingAction = matchOnboardingActionPath(pathname);
        const accountAction = matchAccountActionPath(pathname);
        const adminContentAction = matchAdminContentPath(pathname);
        const hotelDocumentAction = matchHotelDocumentPath(pathname);

        if (method === "GET" && hotelDocumentAction) {
          await withRole(caller, ["hotel", "admin"], async () => {
            const authorizedHotelId = resolveAuthorizedHotelId(caller, hotelDocumentAction.hotelId);
            const hotel = (await runtime.repository.listHotelRegistrations()).find(
              (entry) => entry.id === authorizedHotelId,
            );

            if (!hotel) {
              throw new WashoffApiRequestError("تعذر العثور على ملف الفندق المطلوب.", 404);
            }

            const documentReference =
              hotelDocumentAction.kind === "commercial_registration"
                ? hotel.compliance.commercialRegistrationFile
                : hotel.compliance.delegationLetterFile;

            if (!documentReference) {
              throw new WashoffApiRequestError("المستند المطلوب غير متوفر لهذا الفندق.", 404);
            }

            if (
              documentReference.storageKey.startsWith("preview://") ||
              documentReference.storageKey.startsWith("legacy://")
            ) {
              throw new WashoffApiRequestError("لا يتوفر تنزيل هذا المستند في وضع المعاينة الحالي.", 404);
            }

            const fileBuffer = await readStoredHotelRegistrationDocument(documentReference.storageKey);
            response.statusCode = 200;
            response.setHeader("Content-Type", `${documentReference.mimeType}; charset=binary`);
            response.setHeader("Content-Length", String(fileBuffer.byteLength));
            response.setHeader(
              "Content-Disposition",
              `inline; filename="${encodeURIComponent(documentReference.fileName)}"`,
            );
            response.end(fileBuffer);
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/hotel-profile`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["hotel", "admin"], () =>
              runtime.repository.getHotelProfile(
                resolveAuthorizedHotelId(caller, requestUrl.searchParams.get("hotelId") ?? undefined),
              ),
            ),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/hotels`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.listHotels()),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/provider-profile`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["provider", "admin"], () =>
              runtime.repository.getProviderProfile(
                resolveAuthorizedProviderId(caller, requestUrl.searchParams.get("providerId") ?? undefined),
              ),
            ),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/providers`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.listProviders()),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/admin/accounts`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.listAccounts()),
          });
        } else if (
          method === "GET" &&
          pathname === `${WASHOFF_API_BASE_PATH}/admin/identity-audit`
        ) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.listIdentityAuditEvents()),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/admin/settings`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.getPlatformSettings()),
          });
        } else if (
          method === "PATCH" &&
          pathname === `${WASHOFF_API_BASE_PATH}/admin/settings`
        ) {
          const body = await readJsonBody<UpdatePlatformSettingsRequest>(request);
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () =>
              runtime.service.updatePlatformSettings({
                ...body,
                updatedByAccountId: caller.account?.id,
              }),
            ),
          });
        } else if (
          method === "GET" &&
          pathname === `${WASHOFF_API_BASE_PATH}/admin/settings/runtime`
        ) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.getPlatformRuntimeStatus()),
          });
        } else if (
          method === "GET" &&
          pathname === `${WASHOFF_API_BASE_PATH}/admin/settings/audit`
        ) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.listPlatformSettingsAudit()),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/admin/content`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () =>
              runtime.repository.listPlatformContentEntries(
                requestUrl.searchParams.get("page") ?? undefined,
              ),
            ),
          });
        } else if (
          method === "GET" &&
          pathname === `${WASHOFF_API_BASE_PATH}/admin/content-audit`
        ) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () =>
              runtime.repository.listPlatformContentAudit(
                requestUrl.searchParams.get("page") ?? undefined,
              ),
            ),
          });
        } else if (method === "PATCH" && adminContentAction) {
          const body = await readJsonBody<UpdatePlatformContentEntryRequest>(request);
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () =>
              runtime.service.updatePlatformContentEntry({
                ...body,
                id: adminContentAction.contentEntryId,
                updatedByAccountId: caller.account?.id,
              }),
            ),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/orders`) {
          sendJson(response, 200, {
            data: await handleOrdersQuery(
              runtime,
              caller,
              (requestUrl.searchParams.get("scope") as OrdersQueryScope | null) ?? null,
              requestUrl,
            ),
          });
        } else if (method === "POST" && pathname === `${WASHOFF_API_BASE_PATH}/orders`) {
          const body = await readJsonBody<CreateHotelOrderRequest>(request);
          statusCode = 201;
          sendJson(response, statusCode, {
            data: await withRole(caller, ["hotel", "admin"], () =>
              runtime.service.createHotelOrder({
                ...body,
                hotelId: resolveAuthorizedHotelId(caller, body.hotelId),
              }),
            ),
          });
        } else if (method === "POST" && pathname === `${WASHOFF_API_BASE_PATH}/matching/run`) {
          const body = await readJsonBody<unknown>(request);
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.service.runMatching(body)),
          });
        } else if (method === "GET" && pathname === `${WASHOFF_API_BASE_PATH}/admin/dashboard`) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.service.getAdminDashboardData()),
          });
        } else if (
          method === "GET" &&
          pathname === `${WASHOFF_API_BASE_PATH}/admin/onboarding/hotels`
        ) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.listHotelRegistrations()),
          });
        } else if (
          method === "GET" &&
          pathname === `${WASHOFF_API_BASE_PATH}/admin/onboarding/providers`
        ) {
          sendJson(response, 200, {
            data: await withRole(caller, ["admin"], () => runtime.repository.listProviderRegistrations()),
          });
        } else if (
          method === "POST" &&
          pathname === `${WASHOFF_API_BASE_PATH}/assignment-expiry-sweep`
        ) {
          const body = await readJsonBody<Pick<ExpireAssignmentRequest, "referenceTime">>(request);
          sendJson(response, 200, {
            data: await withRole(caller, ["admin", "worker"], () =>
              runtime.service.runAssignmentExpirySweep(body.referenceTime),
            ),
          });
        } else if (
          method === "POST" &&
          pathname === `${WASHOFF_API_BASE_PATH}/workers/assignment-expiry/run`
        ) {
          const body = await readJsonBody<Pick<ExpireAssignmentRequest, "referenceTime">>(request);
          sendJson(response, 200, {
            data: await withRole(caller, ["admin", "worker"], () =>
              runtime.expiryWorker.runOnce(body.referenceTime),
            ),
          });
        } else if (method === "POST" && orderAction) {
          if (orderAction.action === "accept") {
            const body = await readJsonBody<AcceptAssignmentRequest>(request);
            sendJson(response, 200, {
              data: await withRole(caller, ["provider", "admin"], () =>
                runtime.service.acceptIncomingOrder(
                  orderAction.orderId,
                  resolveAuthorizedProviderId(caller, body.providerId),
                ),
              ),
            });
          } else if (orderAction.action === "reject") {
            const body = await readJsonBody<RejectAssignmentRequest>(request);
            sendJson(response, 200, {
              data: await withRole(caller, ["provider", "admin"], () =>
                runtime.service.rejectAssignment({
                  orderId: orderAction.orderId,
                  providerId: resolveAuthorizedProviderId(caller, body.providerId),
                }),
              ),
            });
          } else if (orderAction.action === "expire") {
            const body = await readJsonBody<ExpireAssignmentRequest>(request);
            sendJson(response, 200, {
              data: await withRole(caller, ["admin", "worker"], () =>
                runtime.service.expireAssignment({
                  orderId: orderAction.orderId,
                  referenceTime: body.referenceTime,
                }),
              ),
            });
          } else if (orderAction.action === "execution-status") {
            const body = await readJsonBody<AdvanceProviderOrderExecutionRequest>(request);
            sendJson(response, 200, {
              data: await withRole(caller, ["provider", "admin"], () =>
                runtime.service.advanceProviderOrderExecution({
                  orderId: orderAction.orderId,
                  nextStatus: body.nextStatus,
                  providerId: resolveAuthorizedProviderId(caller, body.providerId),
                  notesAr: body.notesAr,
                }),
              ),
            });
          } else if (orderAction.action === "complete") {
            const body = await readJsonBody<ConfirmHotelOrderCompletionRequest>(request);
            sendJson(response, 200, {
              data: await withRole(caller, ["hotel", "admin"], () =>
                runtime.service.confirmHotelOrderCompletion({
                  orderId: orderAction.orderId,
                  hotelId: resolveAuthorizedHotelId(caller, body.hotelId),
                  notesAr: body.notesAr,
                }),
              ),
            });
          } else {
            const body = await readJsonBody<AutoReassignOrderRequest>(request);
            sendJson(response, 200, {
              data: await withRole(caller, ["admin", "worker"], () =>
                runtime.service.autoReassignOrder({
                  orderId: orderAction.orderId,
                  reason: body.reason,
                  referenceTime: body.referenceTime,
                }),
              ),
            });
          }
        } else if (method === "POST" && onboardingAction) {
          const body = await readJsonBody<ReviewRegistrationRequest>(request);
          const reviewCommand = {
            entityId: onboardingAction.entityId,
            reviewNotesAr: body.reviewNotesAr,
          };

          if (onboardingAction.entityType === "hotels" && onboardingAction.action === "approve") {
            sendJson(response, 200, {
              data: await withRole(caller, ["admin"], () =>
                runtime.service.approveHotelRegistration(reviewCommand),
              ),
            });
          } else if (
            onboardingAction.entityType === "hotels" &&
            onboardingAction.action === "reject"
          ) {
            sendJson(response, 200, {
              data: await withRole(caller, ["admin"], () =>
                runtime.service.rejectHotelRegistration(reviewCommand),
              ),
            });
          } else if (
            onboardingAction.entityType === "providers" &&
            onboardingAction.action === "approve"
          ) {
            sendJson(response, 200, {
              data: await withRole(caller, ["admin"], () =>
                runtime.service.approveProviderRegistration(reviewCommand),
              ),
            });
          } else {
            sendJson(response, 200, {
              data: await withRole(caller, ["admin"], () =>
                runtime.service.rejectProviderRegistration(reviewCommand),
              ),
            });
          }
        } else if (method === "POST" && accountAction) {
          const body = await readJsonBody<AccountAdminActionRequest>(request);

          if (accountAction.action === "resend-activation") {
            sendJson(response, 200, {
              data: await withRole(caller, ["admin"], () =>
                runtime.service.resendActivationEmail({
                  accountId: accountAction.accountId,
                }),
              ),
            });
          } else if (accountAction.action === "suspend") {
            sendJson(response, 200, {
              data: await withRole(caller, ["admin"], () =>
                runtime.service.suspendAccount({
                  accountId: accountAction.accountId,
                  reasonAr: body.reasonAr,
                }),
              ),
            });
          } else {
            sendJson(response, 200, {
              data: await withRole(caller, ["admin"], () =>
                runtime.service.reactivateAccount({
                  accountId: accountAction.accountId,
                  reasonAr: body.reasonAr,
                }),
              ),
            });
          }
        } else {
          throw new WashoffApiRequestError("لم يتم العثور على مسار واجهة WashOff المطلوب.", 404);
        }
      }

      options.metrics.incrementCounter("washoff_api_requests_total", {
        method,
        path: pathname,
        statusClass: buildStatusClass(statusCode),
      });
      options.logger.info("api.request_completed", {
        method,
        path: pathname,
        statusCode,
        clientAddress,
        durationMs: Date.now() - startedAt,
      });
      return true;
    } catch (error) {
      statusCode = resolveErrorStatusCode(error);
      const message = resolveErrorMessage(error);

      if (error instanceof WashoffRateLimitError) {
        response.setHeader("Retry-After", String(error.retryAfterSeconds));
        options.metrics.incrementCounter("washoff_rate_limit_hits_total", {
          method,
          path: pathname,
        });
      }

      if (isAuthPath(pathname)) {
        const authEvent =
          pathname.endsWith("/login")
            ? "login_failed"
            : pathname.includes("forgot-password")
              ? "password_reset_failed"
              : pathname.includes("activate")
                ? "activation_failed"
                : "auth_request_failed";
        options.metrics.incrementCounter("washoff_auth_events_total", {
          event: authEvent,
        });
        options.logger.warn("auth.request_failed", {
          method,
          path: pathname,
          statusCode,
          clientAddress,
          error,
        });
      } else {
        options.logger.error("api.request_failed", {
          method,
          path: pathname,
          statusCode,
          clientAddress,
          error,
        });
      }

      options.metrics.incrementCounter("washoff_api_requests_total", {
        method,
        path: pathname,
        statusClass: buildStatusClass(statusCode),
      });
      options.metrics.incrementCounter("washoff_api_errors_total", {
        method,
        path: pathname,
        statusCode,
      });
      sendJson(response, statusCode, {
        error: message,
      });
      return true;
    }
  };
};
