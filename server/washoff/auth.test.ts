import { describe, expect, it } from "vitest";
import {
  WashoffApiAuthError,
  requireWashoffRole,
  resolveAuthorizedHotelId,
  resolveAuthorizedProviderId,
  resolveWashoffApiCaller,
} from "./auth";

const createRequest = (headers: Record<string, string>) =>
  ({
    headers,
  }) as never;

describe("Washoff API auth", () => {
  it("resolves a hotel caller from headers", async () => {
    const caller = await resolveWashoffApiCaller(
      createRequest({
        "x-washoff-role": "hotel",
        "x-washoff-entity-id": "hotel-1",
      }),
      {
        authMode: "dev-header",
      },
    );

    expect(caller.role).toBe("hotel");
    expect(caller.entityId).toBe("hotel-1");
  });

  it("rejects missing entity id for provider role", async () => {
    await expect(
      resolveWashoffApiCaller(
        createRequest({
          "x-washoff-role": "provider",
        }),
        {
          authMode: "dev-header",
        },
      ),
    ).rejects.toThrow(WashoffApiAuthError);
  });

  it("allows internal worker key", async () => {
    const caller = await resolveWashoffApiCaller(
      createRequest({
        "x-washoff-internal-key": "secret-key",
      }),
      {
        authMode: "dev-header",
        internalApiKey: "secret-key",
      },
    );

    expect(caller.role).toBe("worker");
  });

  it("resolves an active session caller before falling back to headers", async () => {
    const caller = await resolveWashoffApiCaller(
      createRequest({
        authorization: "Bearer valid-session-token",
      }),
      {
        authMode: "session-or-dev-header",
        sessionResolver: {
          resolveAccountSession: async (sessionToken: string) => {
            if (sessionToken !== "valid-session-token") {
              return null;
            }

            return {
              account: {
                id: "account-hotel-1",
                role: "hotel",
                status: "active",
                linkedHotelId: "hotel-1",
              },
              session: {
                id: "session-1",
              },
            };
          },
        },
      },
    );

    expect(caller.role).toBe("hotel");
    expect(caller.entityId).toBe("hotel-1");
    expect(caller.accountId).toBe("account-hotel-1");
    expect(caller.sessionId).toBe("session-1");
    expect(caller.source).toBe("session");
  });

  it("rejects inactive session accounts in session mode", async () => {
    await expect(
      resolveWashoffApiCaller(
        createRequest({
          authorization: "Bearer suspended-token",
        }),
        {
          authMode: "session",
          sessionResolver: {
            resolveAccountSession: async () => ({
              account: {
                id: "account-provider-1",
                role: "provider",
                status: "suspended",
                linkedProviderId: "provider-1",
              },
              session: {
                id: "session-provider-1",
              },
            }),
          },
        },
      ),
    ).rejects.toThrow(WashoffApiAuthError);
  });

  it("rejects malformed session tokens before session lookup", async () => {
    await expect(
      resolveWashoffApiCaller(
        createRequest({
          authorization: "Bearer invalid token",
        }),
        {
          authMode: "session-or-dev-header",
          sessionResolver: {
            resolveAccountSession: async () => null,
          },
        },
      ),
    ).rejects.toThrow(WashoffApiAuthError);
  });

  it("prevents cross-hotel access", () => {
    const caller = {
      role: "hotel" as const,
      entityId: "hotel-1",
      source: "header" as const,
    };

    expect(() => resolveAuthorizedHotelId(caller, "hotel-2")).toThrow(WashoffApiAuthError);
  });

  it("prevents provider access to admin-only role checks", () => {
    const caller = {
      role: "provider" as const,
      entityId: "provider-1",
      source: "header" as const,
    };

    expect(() => requireWashoffRole(caller, ["admin"])).toThrow(WashoffApiAuthError);
    expect(resolveAuthorizedProviderId(caller, "provider-1")).toBe("provider-1");
  });
});
