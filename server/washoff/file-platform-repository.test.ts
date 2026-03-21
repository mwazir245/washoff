// @vitest-environment node

import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { clearClientSession, storeClientSession } from "../../src/features/auth/infrastructure/client-auth-storage";
import { createFileBackedWashoffPlatformRepository } from "./file-platform-repository";
import type { PlatformPersistenceSnapshot } from "../../src/features/orders/infrastructure/persistence/persistence-records";
import { AssignmentStatus, OrderStatus } from "../../src/features/orders/model";

const tempDirectories: string[] = [];

const createRepositoryWithTempFile = async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "washoff-backend-"));
  const dataFilePath = path.join(directory, "washoff-platform.json");
  tempDirectories.push(directory);

  return {
    directory,
    dataFilePath,
    repository: createFileBackedWashoffPlatformRepository({
      dataFilePath,
    }),
  };
};

afterEach(async () => {
  clearClientSession();
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe("createFileBackedWashoffPlatformRepository", () => {
  it("persists created orders with assignment and matching logs", async () => {
    const { repository, dataFilePath } = await createRepositoryWithTempFile();
    const pickupAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    storeClientSession(
      await repository.login({
        email: "hotel.ops@washoff.sa",
        password: "Washoff123!",
      }),
    );

    const order = await repository.createHotelOrder({
      serviceIds: ["wash_fold", "iron"],
      itemCount: 18,
      pickupAt,
      notesAr: "طلب تجريبي من واجهة الاختبار الخلفي",
    });

    expect([OrderStatus.Assigned, OrderStatus.PendingCapacity]).toContain(order.status);
    expect(order.matchingLogs.length).toBeGreaterThan(0);

    if (order.status === OrderStatus.Assigned) {
      expect(order.activeAssignment?.status).toBe(AssignmentStatus.PendingAcceptance);
      expect(order.providerId).toBeTruthy();
    }

    const persistedSnapshot = JSON.parse(
      await readFile(dataFilePath, "utf8"),
    ) as PlatformPersistenceSnapshot;
    const persistedOrder = persistedSnapshot.orders.find((entry) => entry.order.id === order.id);

    expect(persistedOrder).toBeDefined();
    expect(persistedOrder?.order.status).toBe(order.status);
    expect(persistedOrder?.matching_logs.length).toBe(order.matchingLogs.length);

    if (order.activeAssignment) {
      expect(persistedOrder?.assignments[0]?.provider_id).toBe(order.providerId);
      expect(persistedOrder?.assignments[0]?.status).toBe(AssignmentStatus.PendingAcceptance);
    }
  });

  it("reloads persisted orders and reassignment history across repository instances", async () => {
    const { repository, dataFilePath } = await createRepositoryWithTempFile();
    const pickupAt = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    storeClientSession(
      await repository.login({
        email: "hotel.ops@washoff.sa",
        password: "Washoff123!",
      }),
    );

    const createdOrder = await repository.createHotelOrder({
      serviceIds: ["wash_fold"],
      itemCount: 12,
      pickupAt,
      notesAr: "اختبار إعادة تحميل التخزين",
    });

    if (createdOrder.providerId) {
      storeClientSession(
        await repository.login({
          email: "provider.ops@washoff.sa",
          password: "Washoff123!",
        }),
      );
      await repository.rejectIncomingOrder(createdOrder.id, createdOrder.providerId);
      storeClientSession(
        await repository.login({
          email: "mmekawe@hotmail.com",
          password: "Zajillema2@123",
        }),
      );
    }

    const reloadedRepository = createFileBackedWashoffPlatformRepository({
      dataFilePath,
    });
    const orders = await reloadedRepository.listAllOrders();
    const restoredOrder = orders.find((order) => order.id === createdOrder.id);

    expect(restoredOrder).toBeDefined();
    expect(restoredOrder?.matchingLogs.length).toBeGreaterThan(0);
    expect(restoredOrder?.reassignmentEvents.length ?? 0).toBeGreaterThanOrEqual(
      createdOrder.providerId ? 1 : 0,
    );
  });
});
