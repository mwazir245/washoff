import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WashoffPlatformRepository } from "../../src/features/orders/application/ports/washoff-platform-repository";
import {
  activateAccount,
  listIdentityAuditEvents,
  approveHotelRegistration,
  approveProviderRegistration,
  acceptIncomingOrder,
  advanceProviderOrderExecution,
  getCurrentAccountSession,
  getPlatformPageContent,
  getPlatformSettings,
  autoReassignOrder,
  confirmHotelOrderCompletion,
  createHotelOrder,
  expirePendingAssignment,
  listHotelRegistrations,
  listPlatformContentAudit as listPlatformContentAuditEntries,
  listPlatformContentEntries,
  listPlatformSettingsAudit,
  exportMockOrdersRepositoryPersistenceSnapshot,
  getHotelProfile,
  listAccounts,
  getProviderProfile,
  hydrateMockOrdersRepositoryFromPersistenceSnapshot,
  login,
  logout,
  listProviderRegistrations,
  recordIdentityAuditEventEntry,
  reactivateAccount,
  resendActivationEmail,
  requestPasswordReset,
  resetPassword,
  updatePlatformContentEntry,
  updatePlatformSettings,
  listAllOrders,
  listHotels,
  listHotelOrders,
  listProviderActiveOrders,
  listProviderIncomingOrders,
  listProviders,
  listServiceCatalog,
  resolveAccountSession,
  registerHotel,
  registerProvider,
  rejectHotelRegistration,
  rejectIncomingOrder,
  rejectProviderRegistration,
  resetMockOrdersRepository,
  runAssignmentExpirySweep,
  suspendAccount,
  validateActivationToken,
  validateResetPasswordToken,
} from "../../src/features/orders/data/mock-orders.repository";
import type { PlatformPersistenceSnapshot } from "../../src/features/orders/infrastructure/persistence/persistence-records";
import { ReassignmentReason } from "../../src/features/orders/model/assignment";
import type { PlatformRuntimeStatus } from "../../src/features/platform-settings/model/platform-settings";

export interface FileBackedWashoffPlatformRepositoryOptions {
  dataFilePath?: string;
  runtimeStatus?: PlatformRuntimeStatus;
}

const DEFAULT_DATA_FILE_PATH = path.resolve(process.cwd(), "data", "washoff-platform.json");

export const createFileBackedWashoffPlatformRepository = (
  options: FileBackedWashoffPlatformRepositoryOptions = {},
): WashoffPlatformRepository => {
  const dataFilePath = options.dataFilePath ?? DEFAULT_DATA_FILE_PATH;
  const runtimeStatus =
    options.runtimeStatus ??
    ({
      environment: "dev",
      persistenceMode: "file",
      databaseTargetLabel: dataFilePath,
      mailMode: "outbox",
      workerEnabled: false,
      workerPollIntervalMs: 30_000,
      requestTimeSweepEnabled: true,
      authMode: "dev-header",
      publicAppUrl: "http://localhost:8080",
    } satisfies PlatformRuntimeStatus);
  let loaded = false;
  let operationQueue = Promise.resolve<void>(undefined);

  const enqueue = async <Value>(operation: () => Promise<Value>) => {
    const nextOperation = operationQueue.then(operation, operation);
    operationQueue = nextOperation.then(
      () => undefined,
      () => undefined,
    );
    return nextOperation;
  };

  const persistSnapshot = async () => {
    const snapshot = await exportMockOrdersRepositoryPersistenceSnapshot();
    await mkdir(path.dirname(dataFilePath), { recursive: true });
    await writeFile(dataFilePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  };

  const ensureLoaded = async () => {
    if (loaded) {
      return;
    }

    resetMockOrdersRepository();

    try {
      const rawSnapshot = await readFile(dataFilePath, "utf8");
      hydrateMockOrdersRepositoryFromPersistenceSnapshot(
        JSON.parse(rawSnapshot) as PlatformPersistenceSnapshot,
      );
    } catch (error) {
      const fileError = error as NodeJS.ErrnoException;

      if (fileError.code !== "ENOENT") {
        throw error;
      }

      await persistSnapshot();
    }

    loaded = true;
  };

  const readOnly = <Value>(operation: () => Promise<Value>) =>
    enqueue(async () => {
      await ensureLoaded();
      return operation();
    });

  const readAndPersist = <Value>(operation: () => Promise<Value>) =>
    enqueue(async () => {
      await ensureLoaded();
      const result = await operation();
      await persistSnapshot();
      return result;
    });

  return {
    login: (command) => readAndPersist(() => login(command)),
    activateAccount: (command) => readAndPersist(() => activateAccount(command)),
    validateActivationToken: (command) => readOnly(() => validateActivationToken(command)),
    requestPasswordReset: (command) => readAndPersist(() => requestPasswordReset(command)),
    resendActivationEmail: (accountId: string) => readAndPersist(() => resendActivationEmail(accountId)),
    validateResetPasswordToken: (command) => readOnly(() => validateResetPasswordToken(command)),
    resetPassword: (command) => readAndPersist(() => resetPassword(command)),
    logout: (sessionToken?: string) => readAndPersist(() => logout(sessionToken)),
    getCurrentAccountSession: () => readOnly(() => getCurrentAccountSession()),
    resolveAccountSession: (sessionToken: string) => readOnly(() => resolveAccountSession(sessionToken)),
    listAccounts: () => readOnly(() => listAccounts()),
    listIdentityAuditEvents: () => readOnly(() => listIdentityAuditEvents()),
    getPlatformSettings: () => readOnly(() => getPlatformSettings()),
    listPlatformSettingsAudit: () => readOnly(() => listPlatformSettingsAudit()),
    getPlatformRuntimeStatus: () => readOnly(async () => runtimeStatus),
    listPlatformContentEntries: (pageKey?: string) => readOnly(() => listPlatformContentEntries(pageKey)),
    listPlatformContentAudit: (pageKey?: string) =>
      readOnly(() => listPlatformContentAuditEntries(pageKey)),
    getPlatformPageContent: (pageKey: string, language: "ar" | "en") =>
      readOnly(() => getPlatformPageContent(pageKey, language)),
    recordIdentityAuditEvent: (event) => readAndPersist(() => recordIdentityAuditEventEntry(event).then(() => undefined)),
    suspendAccount: (accountId: string, reasonAr?: string) =>
      readAndPersist(() => suspendAccount(accountId, reasonAr)),
    reactivateAccount: (accountId: string, reasonAr?: string) =>
      readAndPersist(() => reactivateAccount(accountId, reasonAr)),
    updatePlatformSettings: (command) => readAndPersist(() => updatePlatformSettings(command)),
    updatePlatformContentEntry: (command) =>
      readAndPersist(() => updatePlatformContentEntry(command)),
    registerHotel: (input) => readAndPersist(() => registerHotel(input)),
    registerProvider: (input) => readAndPersist(() => registerProvider(input)),
    getHotelProfile: (hotelId?: string) => readOnly(() => getHotelProfile(hotelId)),
    listHotels: () => readOnly(() => listHotels()),
    listHotelRegistrations: () => readOnly(() => listHotelRegistrations()),
    getProviderProfile: (providerId?: string) => readAndPersist(() => getProviderProfile(providerId)),
    listProviders: () => readAndPersist(() => listProviders()),
    listProviderRegistrations: () => readOnly(() => listProviderRegistrations()),
    listServiceCatalog: () => readOnly(() => listServiceCatalog()),
    listAllOrders: () => readAndPersist(() => listAllOrders()),
    listHotelOrders: (hotelId?: string) => readAndPersist(() => listHotelOrders(hotelId)),
    listProviderIncomingOrders: (providerId?: string) =>
      readAndPersist(() => listProviderIncomingOrders(providerId)),
    listProviderActiveOrders: (providerId?: string) =>
      readAndPersist(() => listProviderActiveOrders(providerId)),
    createHotelOrder: (input) => readAndPersist(() => createHotelOrder(input)),
    approveHotelRegistration: (hotelId: string, reviewNotesAr?: string) =>
      readAndPersist(() => approveHotelRegistration(hotelId, reviewNotesAr)),
    rejectHotelRegistration: (hotelId: string, reviewNotesAr?: string) =>
      readAndPersist(() => rejectHotelRegistration(hotelId, reviewNotesAr)),
    approveProviderRegistration: (providerId: string, reviewNotesAr?: string) =>
      readAndPersist(() => approveProviderRegistration(providerId, reviewNotesAr)),
    rejectProviderRegistration: (providerId: string, reviewNotesAr?: string) =>
      readAndPersist(() => rejectProviderRegistration(providerId, reviewNotesAr)),
    acceptIncomingOrder: (orderId: string, providerId?: string) =>
      readAndPersist(() => acceptIncomingOrder(orderId, providerId)),
    advanceProviderOrderExecution: (command) =>
      readAndPersist(() => advanceProviderOrderExecution(command)),
    confirmHotelOrderCompletion: (command) =>
      readAndPersist(() => confirmHotelOrderCompletion(command)),
    rejectIncomingOrder: (orderId: string, providerId?: string) =>
      readAndPersist(() => rejectIncomingOrder(orderId, providerId)),
    expirePendingAssignment: (orderId: string, referenceTime?: string) =>
      readAndPersist(() => expirePendingAssignment(orderId, referenceTime)),
    autoReassignOrder: (
      orderId: string,
      reason: ReassignmentReason.ProviderRejected | ReassignmentReason.ProviderExpired,
      referenceTime?: string,
    ) => readAndPersist(() => autoReassignOrder(orderId, reason, referenceTime)),
    runAssignmentExpirySweep: (referenceTime?: string) =>
      readAndPersist(() => runAssignmentExpirySweep(referenceTime)),
  };
};
