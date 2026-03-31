import { afterEach, describe, expect, it, vi } from "vitest";
import { WASHOFF_API_BASE_PATH } from "@/features/orders/api/contracts/washoff-api-contracts";
import { OrderStatus } from "@/features/orders/model";
import { createApiWashoffPlatformRepository } from "@/features/orders/infrastructure/adapters/api-platform-repository";

const createFetchResponse = <Value,>(payload: Value, ok = true) =>
  Promise.resolve({
    ok,
    text: async () => JSON.stringify(ok ? { data: payload } : { error: payload }),
  });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("createApiWashoffPlatformRepository", () => {
  it("posts hotel order creation to the backend API path", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      createFetchResponse({
        id: "ORD-2001",
        status: OrderStatus.PendingCapacity,
        matchingLogs: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const repository = createApiWashoffPlatformRepository();

    await repository.createHotelOrder({
      roomNumber: "1208",
      items: [{ serviceId: "svc-thobe-dry_clean", quantity: 10 }],
      pickupAt: "2026-03-20T08:00:00.000Z",
      notesAr: "اختبار واجهة API",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${WASHOFF_API_BASE_PATH}/orders`,
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("builds provider incoming orders queries against the API scope endpoint", async () => {
    const fetchMock = vi.fn().mockImplementation(() => createFetchResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const repository = createApiWashoffPlatformRepository({
      baseUrl: "http://localhost:8080/api/platform",
    });

    await repository.listProviderIncomingOrders("provider-2");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/platform/orders?scope=provider-incoming&providerId=provider-2",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("uses secure cookie-based requests after login", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        createFetchResponse({
          token: "session-token-123",
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
        }),
      )
      .mockImplementationOnce(() => createFetchResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const repository = createApiWashoffPlatformRepository();

    await repository.login({
      email: "admin@washoff.sa",
      password: "secret",
    });

    await repository.listAllOrders();

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${WASHOFF_API_BASE_PATH}/orders?scope=all`,
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "x-washoff-role": "admin",
        }),
      }),
    );
  });

  it("does not throw when the backend returns an empty successful response body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const repository = createApiWashoffPlatformRepository();

    await expect(repository.logout("session-token-123")).resolves.toBeUndefined();
  });
});
