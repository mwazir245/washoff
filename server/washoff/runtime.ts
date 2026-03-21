import type { IdentityAuditEvent } from "@/features/auth/model";
import { createWashoffPlatformApplicationService } from "@/features/orders/application/services/washoff-platform-service";
import type { PlatformRuntimeStatus } from "@/features/platform-settings/model/platform-settings";
import { createWashoffAssignmentExpiryWorker } from "./assignment-expiry-worker";
import { loadWashoffServerConfig } from "./config";
import { createFileBackedWashoffPlatformRepository } from "./file-platform-repository";
import { createWashoffIdentityMailer } from "./identity-mailer";
import { createWashoffLogger, type WashoffLogger } from "./logger";
import { createInMemoryWashoffMetrics, type WashoffMetrics } from "./metrics";
import { getWashoffPrismaClient } from "./prisma-client";
import type { WashoffEnvironment } from "./environment";

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

    return {
      config,
      repository: prismaModule.createPrismaBackedWashoffPlatformRepository({
        prisma: getWashoffPrismaClient({
          databaseUrl: config.databaseUrl,
          cacheKey: `${config.environment}:${config.databaseTargetLabel}`,
        }),
        requestTimeSweepEnabled: config.requestTimeSweepEnabled,
        runtimeStatus,
        environment: config.environment,
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Prisma runtime failure";

    if (config.persistenceModeExplicit && config.persistenceMode === "db") {
      throw new Error(
        `[WashOff] Prisma DB mode was explicitly requested and could not start: ${message}`,
      );
    }

    logger.warn("runtime.persistence_fallback", {
      requestedMode: config.persistenceMode,
      message,
    });

    return {
      config: {
        ...config,
        persistenceMode: "file" as const,
        requestTimeSweepEnabled: true,
      },
      repository: createFileBackedWashoffPlatformRepository({
        dataFilePath: options.dataFilePath ?? config.dataFilePath,
        runtimeStatus: {
          ...runtimeStatus,
          persistenceMode: "file",
        },
      }),
    };
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
  const expiryWorker = createWashoffAssignmentExpiryWorker({
    repository,
    service,
    logger: logger.child({ component: "assignment-expiry-worker" }),
    metrics,
  });

  logger.info("runtime.initialized", {
    environment: runtimeRepository.config.environment,
    persistenceMode: runtimeRepository.config.persistenceMode,
    databaseTarget: runtimeRepository.config.databaseTargetLabel,
    mailMode: runtimeRepository.config.mailMode,
    workerMode: runtimeRepository.config.workerEnabled ? "enabled" : "disabled",
    authMode: runtimeRepository.config.authMode,
  });

  return {
    config: runtimeRepository.config,
    repository,
    service,
    expiryWorker,
    logger,
    metrics,
  };
};
