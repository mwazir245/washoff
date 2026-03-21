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
  const payload =
    body === undefined ? [] : [Buffer.from(JSON.stringify(body), "utf8")];
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

const createRuntime = () => ({
  config: {
    authMode: "disabled" as const,
    internalApiKey: "test-key",
    workerEnabled: false,
    workerPollIntervalMs: 30_000,
    persistenceMode: "file" as const,
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
  },
  service: {
    login: async () => ({ ok: true }),
    validateActivationToken: async () => ({ status: "ready" }),
    activateAccount: async () => ({ ok: true }),
    requestPasswordReset: async () => ({ accepted: true }),
    resendActivationEmail: async () => ({ ok: true }),
    validateResetPasswordToken: async () => ({ status: "ready" }),
    resetPassword: async () => ({ ok: true }),
    logout: async () => undefined,
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
    runAssignmentExpirySweep: async () => [],
    acceptIncomingOrder: async () => ({ ok: true }),
    rejectAssignment: async () => ({ ok: true }),
    expireAssignment: async () => ({ ok: true }),
    autoReassignOrder: async () => ({ ok: true }),
  },
  expiryWorker: {
    runOnce: async () => ({ ok: true }),
  },
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

    for (let attempt = 0; attempt < 10; attempt += 1) {
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
    expect(getJson().error).toContain("عدد المحاولات");
  });
});
