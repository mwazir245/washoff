import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createWashoffApiHandler } from "./api-handler";
import { createWashoffLogger } from "./logger";
import { createInMemoryWashoffMetrics } from "./metrics";

const createRequest = ({
  method,
  url,
  headers = {},
  body,
}: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}) => {
  const payload = body === undefined ? [] : [Buffer.from(JSON.stringify(body), "utf8")];

  return Object.assign(Readable.from(payload), {
    method,
    url,
    headers,
    socket: {
      remoteAddress: "127.0.0.1",
    },
  });
};

const createResponse = () => {
  let body = "";
  const headers = new Map<string, string>();
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      body += chunk.toString();
      callback();
    },
  });

  const response = Object.assign(writable, {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    getHeader(name: string) {
      return headers.get(name.toLowerCase());
    },
    end(chunk?: string | Buffer) {
      if (chunk) {
        body += chunk.toString();
      }

      writable.emit("finish");
    },
  });

  return {
    response,
    getJson: () => JSON.parse(body),
  };
};

const buildAuthenticatedSession = () => ({
  token: "session-token-1",
  account: {
    id: "account-admin-1",
    fullName: "مدير المنصة",
    email: "admin@washoff.sa",
    role: "admin",
    status: "active",
    linkedEntityType: "admin",
    activation: {
      state: "activated",
    },
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
  },
  session: {
    id: "session-1",
    accountId: "account-admin-1",
    role: "admin",
    linkedEntityType: "admin",
    createdAt: "2026-03-20T00:00:00.000Z",
    expiresAt: "2026-03-27T00:00:00.000Z",
  },
});

const createRuntime = () => ({
  config: {
    authMode: "disabled" as const,
    internalApiKey: "test-key",
    sessionCookieName: "washoff_session",
    sessionCookieSameSite: "Lax" as const,
    sessionCookieSecure: false,
    sessionCookieDomain: undefined,
    signingSecret: "test-signing-secret",
    workerEnabled: false,
    workerPollIntervalMs: 30_000,
    persistenceMode: "file" as const,
    environment: "test",
    databaseTargetLabel: "test-db",
    mailMode: "smtp",
    storageMode: "database",
    jobQueueMode: "database",
  },
  repository: {
    getCurrentAccountSession: async () => null,
    resolveAccountSession: async () => null,
    listAccounts: async () => [],
    listIdentityAuditEvents: async () => [],
    getHotelProfile: async () => null,
    listHotels: async () => [],
    listHotelRegistrations: async () => [],
    getProviderProfile: async () => null,
    listProviders: async () => [],
    listProviderRegistrations: async () => [],
    listServiceCatalog: async () => [],
    listAllOrders: async () => [],
    listHotelOrders: async () => [],
    listProviderIncomingOrders: async () => [],
    listProviderActiveOrders: async () => [],
    getPlatformSettings: async () => ({}),
    getPlatformServiceCatalogAdminData: async () => ({}),
    getProviderServiceManagement: async () => ({}),
    getProviderPricingAdminData: async () => ({}),
    getHotelBillingData: async () => ({}),
    getProviderFinanceData: async () => ({}),
    getAdminFinanceData: async () => ({}),
    listPlatformSettingsAudit: async () => [],
    getPlatformRuntimeStatus: async () => ({}),
    listPlatformContentEntries: async () => [],
    listPlatformContentAudit: async () => [],
    getPlatformPageContent: async () => ({}),
  },
  service: {
    login: async () => buildAuthenticatedSession(),
    validateActivationToken: async () => ({ status: "ready" }),
    activateAccount: async () => buildAuthenticatedSession(),
    requestPasswordReset: async () => ({ accepted: true }),
    resendActivationEmail: async () => ({ ok: true }),
    validateResetPasswordToken: async () => ({ status: "ready" }),
    resetPassword: async () => buildAuthenticatedSession(),
    logout: async () => undefined,
    updatePlatformSettings: async () => ({}),
    upsertPlatformProduct: async () => ({}),
    updatePlatformServiceMatrix: async () => ({}),
    submitProviderServicePricing: async () => ({}),
    approveProviderServicePricing: async () => ({}),
    rejectProviderServicePricing: async () => ({}),
    updatePlatformContentEntry: async () => ({}),
    suspendAccount: async () => ({ ok: true }),
    reactivateAccount: async () => ({ ok: true }),
    registerHotel: async () => ({ ok: true }),
    registerProvider: async () => ({ ok: true }),
    approveHotelRegistration: async () => ({ ok: true }),
    rejectHotelRegistration: async () => ({ ok: true }),
    approveProviderRegistration: async () => ({ ok: true }),
    rejectProviderRegistration: async () => ({ ok: true }),
    createHotelOrder: async () => ({ ok: true }),
    runMatching: async () => ({ ok: true }),
    getAdminDashboardData: async () => ({ ok: true }),
    getHotelBillingData: async () => ({ ok: true }),
    getProviderFinanceData: async () => ({ ok: true }),
    getAdminFinanceData: async () => ({ ok: true }),
    getAdminFinancePage: async () => ({ ok: true }),
    listAdminOrdersPage: async () => ({ ok: true }),
    markHotelInvoiceCollected: async () => ({ ok: true }),
    markProviderStatementPaid: async () => ({ ok: true }),
    runAssignmentExpirySweep: async () => [],
    acceptIncomingOrder: async () => ({ ok: true }),
    advanceProviderOrderExecution: async () => ({ ok: true }),
    confirmHotelOrderCompletion: async () => ({ ok: true }),
    rejectAssignment: async () => ({ ok: true }),
    expireAssignment: async () => ({ ok: true }),
    autoReassignOrder: async () => ({ ok: true }),
  },
  expiryWorker: {
    runOnce: async () => ({ ok: true }),
  },
  objectStorage: {
    readObject: async () => null,
    verifySignedDownload: async () => null,
  },
  checkHealth: async () => ({
    status: "ok",
    databaseReady: true,
    storageReady: true,
    workerReady: true,
    metricsAvailable: true,
  }),
});

describe("Washoff API handler", () => {
  it("serves the health endpoint from the shared handler", async () => {
    const runtime = createRuntime();
    const handler = createWashoffApiHandler({
      getRuntime: async () => runtime,
      logger: createWashoffLogger({ minimumLevel: "error" }),
      metrics: createInMemoryWashoffMetrics(),
    });
    const request = createRequest({
      method: "GET",
      url: "/health",
    });
    const { response, getJson } = createResponse();

    const handled = await handler(request as never, response as never);

    expect(handled).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(getJson().data.status).toBe("ok");
  });

  it("rate limits repeated login attempts", async () => {
    const runtime = createRuntime();
    const handler = createWashoffApiHandler({
      getRuntime: async () => runtime,
      logger: createWashoffLogger({ minimumLevel: "error" }),
      metrics: createInMemoryWashoffMetrics(),
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const request = createRequest({
        method: "POST",
        url: "/api/platform/auth/login",
        body: {
          email: "ops@washoff.sa",
          password: "secret",
        },
      });
      const { response } = createResponse();
      await handler(request as never, response as never);
      expect(response.statusCode).toBe(200);
    }

    const request = createRequest({
      method: "POST",
      url: "/api/platform/auth/login",
      body: {
        email: "ops@washoff.sa",
        password: "secret",
      },
    });
    const { response, getJson } = createResponse();

    await handler(request as never, response as never);

    expect(response.statusCode).toBe(429);
    expect(response.getHeader("retry-after")).toBeDefined();
    expect(String(getJson().error)).toContain("المحاولات");
  });
});
