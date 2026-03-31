import type { IdentityAuditEvent } from "../../src/features/auth/model/index.ts";
import { createWashoffPlatformApplicationService } from "../../src/features/orders/application/services/washoff-platform-service.ts";
import type { PlatformRuntimeStatus } from "../../src/features/platform-settings/model/platform-settings.ts";
import { createWashoffAssignmentExpiryWorker } from "./assignment-expiry-worker.ts";
import { loadWashoffServerConfig } from "./config.ts";
import { createFileBackedWashoffPlatformRepository } from "./file-platform-repository.ts";
import { createWashoffIdentityMailer } from "./identity-mailer.ts";
import {
  createDatabaseWashoffJobQueue,
  createInMemoryWashoffJobQueue,
} from "./job-queue.ts";
import { createWashoffLogger, type WashoffLogger } from "./logger.ts";
import { createInMemoryWashoffMetrics, type WashoffMetrics } from "./metrics.ts";
import {
  createDatabaseWashoffObjectStorage,
  createFilesystemWashoffObjectStorage,
} from "./object-storage.ts";
import { getWashoffPrismaClient } from "./prisma-client.ts";
import type { WashoffEnvironment } from "./environment.ts";

export interface WashoffApiRuntimeOptions {
  dataFilePath?: string;
  logger?: WashoffLogger;
  metrics?: WashoffMetrics;
  environmentOverride?: WashoffEnvironment;
}

interface RuntimeIdentityAuditRecorder {
  recordIdentityAuditEvent(
    event: Omit<IdentityAuditEvent, "id" | "createdAt"> & { createdAt?: string },
  ): Promise<void>;
}

const resolveRepository = async (
  options: WashoffApiRuntimeOptions,
  config: ReturnType<typeof loadWashoffServerConfig>,
  logger: WashoffLogger,
) => {
  const runtimeStatus: PlatformRuntimeStatus = {
    environment: config.environment,
    persistenceMode: config.persistenceMode,
    databaseTargetLabel: config.databaseTargetLabel,
    mailMode: config.mailMode,
    workerEnabled: config.workerEnabled,
    workerPollIntervalMs: config.workerPollIntervalMs,
    requestTimeSweepEnabled: config.requestTimeSweepEnabled,
    authMode: config.authMode,
    publicAppUrl: config.publicAppUrl,
    serverHost: config.serverHost,
    serverPort: config.serverPort,
  };

  if (config.persistenceMode !== "db") {
    return {
      config,
      prisma: undefined,
      repository: createFileBackedWashoffPlatformRepository({
        dataFilePath: options.dataFilePath ?? config.dataFilePath,
        runtimeStatus,
      }),
    };
  }

  try {
    if (!config.databaseUrl) {
      throw new Error(`[WashOff] No database URL was resolved for environment "${config.environment}".`);
    }

    const prismaModule = await import("./prisma-platform-repository");
    const prisma = getWashoffPrismaClient({
      databaseUrl: config.databaseUrl,
      cacheKey: `${config.environment}:${config.databaseTargetLabel}`,
    });

    return {
      config,
      prisma,
      repository: prismaModule.createPrismaBackedWashoffPlatformRepository({
        prisma,
        requestTimeSweepEnabled: config.requestTimeSweepEnabled,
        runtimeStatus,
        environment: config.environment,
        storageMode: config.storageMode,
        signingSecret: config.signingSecret,
        storageSignedUrlTtlSeconds: config.storageSignedUrlTtlSeconds,
        publicAppUrl: config.publicAppUrl,
        pdfFontPath: config.pdfFontPath,
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Prisma runtime failure";
    throw new Error(
      `[WashOff] Prisma DB mode could not start and automatic fallback is disabled: ${message}`,
    );
  }
};

export const createWashoffApiRuntime = async (options: WashoffApiRuntimeOptions = {}) => {
  const config = loadWashoffServerConfig({
    environmentOverride: options.environmentOverride,
  });
  const logger =
    options.logger ?? createWashoffLogger({ bindings: { component: "washoff-runtime" } });
  const metrics = options.metrics ?? createInMemoryWashoffMetrics();
  const runtimeRepository = await resolveRepository(options, config, logger);
  const { repository } = runtimeRepository;
  const objectStorage =
    runtimeRepository.config.storageMode === "filesystem"
      ? createFilesystemWashoffObjectStorage({
          signingSecret: runtimeRepository.config.signingSecret,
          signedUrlTtlSeconds: runtimeRepository.config.storageSignedUrlTtlSeconds,
        })
      : createDatabaseWashoffObjectStorage({
          prisma:
            runtimeRepository.prisma ??
            getWashoffPrismaClient({
              databaseUrl: runtimeRepository.config.databaseUrl!,
              cacheKey: `${runtimeRepository.config.environment}:${runtimeRepository.config.databaseTargetLabel}`,
            }),
          signingSecret: runtimeRepository.config.signingSecret,
          signedUrlTtlSeconds: runtimeRepository.config.storageSignedUrlTtlSeconds,
        });
  const identityAuditRecorder =
    typeof (repository as Partial<RuntimeIdentityAuditRecorder>).recordIdentityAuditEvent === "function"
      ? {
          recordIdentityAuditEvent: (
            repository as RuntimeIdentityAuditRecorder
          ).recordIdentityAuditEvent.bind(repository),
        }
      : undefined;
  const service = createWashoffPlatformApplicationService(repository, {
    publicAppUrl: runtimeRepository.config.publicAppUrl,
    identityMailDelivery: createWashoffIdentityMailer({
      mode: runtimeRepository.config.mailMode,
      outboxPath: runtimeRepository.config.mailOutboxPath,
      fromEmail: runtimeRepository.config.mailFromEmail,
      fromNameAr: runtimeRepository.config.mailFromNameAr,
      retryMaxAttempts: runtimeRepository.config.mailRetryMaxAttempts,
      retryBaseDelayMs: runtimeRepository.config.mailRetryBaseDelayMs,
      smtpHost: runtimeRepository.config.smtpHost,
      smtpPort: runtimeRepository.config.smtpPort,
      smtpUser: runtimeRepository.config.smtpUser,
      smtpPass: runtimeRepository.config.smtpPass,
      smtpSecure: runtimeRepository.config.smtpSecure,
      logger: logger.child({ component: "identity-mailer" }),
      metrics,
    }),
    identityAuditRecorder,
  });
  const jobQueue =
    runtimeRepository.config.jobQueueMode === "database" && runtimeRepository.prisma
      ? createDatabaseWashoffJobQueue<{ referenceTime: string }>(runtimeRepository.prisma, {
          name: "assignment-expiry",
          logger: logger.child({ component: "assignment-expiry-queue" }),
          metrics,
        })
      : createInMemoryWashoffJobQueue<{ referenceTime: string }>({
          name: "assignment-expiry",
          logger: logger.child({ component: "assignment-expiry-queue" }),
          metrics,
        });
  const expiryWorker = createWashoffAssignmentExpiryWorker({
    repository,
    service,
    logger: logger.child({ component: "assignment-expiry-worker" }),
    metrics,
    jobQueue,
  });

  logger.info("runtime.initialized", {
    environment: runtimeRepository.config.environment,
    persistenceMode: runtimeRepository.config.persistenceMode,
    databaseTarget: runtimeRepository.config.databaseTargetLabel,
    mailMode: runtimeRepository.config.mailMode,
    workerMode: runtimeRepository.config.workerEnabled ? "enabled" : "disabled",
    authMode: runtimeRepository.config.authMode,
  });

  const checkHealth = async () => {
    let databaseReady = runtimeRepository.config.persistenceMode !== "db";

    if (runtimeRepository.prisma) {
      try {
        await runtimeRepository.prisma.$queryRaw`SELECT 1`;
        databaseReady = true;
      } catch {
        databaseReady = false;
      }
    }

    return {
      databaseReady,
      storageReady: true,
      workerReady: Boolean(jobQueue),
      metricsAvailable: true,
      objectStorageMode: runtimeRepository.config.storageMode,
      jobQueueMode: runtimeRepository.config.jobQueueMode,
    };
  };

  return {
    config: runtimeRepository.config,
    repository,
    service,
    objectStorage,
    expiryWorker,
    logger,
    metrics,
    checkHealth,
  };
};
