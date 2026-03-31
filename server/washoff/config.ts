import type { WashoffAuthMode } from "./auth.ts";
import type { WashoffCookieSameSite } from "./http-cookies.ts";
import {
  describeDatabaseTarget,
  loadWashoffEnvironment,
  resolveDefaultDataFilePath,
  resolveWashoffEnvironment,
  selectDatabaseUrlForEnvironment,
  type WashoffEnvironment,
} from "./environment.ts";

export type WashoffServerPersistenceMode = "file" | "db";
export type WashoffMailMode = "disabled" | "console" | "outbox" | "smtp";
export type WashoffObjectStorageMode = "database" | "filesystem";
export type WashoffJobQueueMode = "memory" | "database";

export interface WashoffServerConfig {
  environment: WashoffEnvironment;
  persistenceMode: WashoffServerPersistenceMode;
  persistenceModeExplicit: boolean;
  databaseUrl?: string;
  databaseTargetLabel: string;
  dataFilePath?: string;
  workerEnabled: boolean;
  workerPollIntervalMs: number;
  requestTimeSweepEnabled: boolean;
  authMode: WashoffAuthMode;
  internalApiKey?: string;
  sessionCookieName: string;
  sessionCookieSameSite: WashoffCookieSameSite;
  sessionCookieSecure: boolean;
  sessionCookieDomain?: string;
  signingSecret: string;
  publicAppUrl: string;
  mailMode: WashoffMailMode;
  mailOutboxPath: string;
  mailFromEmail: string;
  mailFromNameAr: string;
  mailRetryMaxAttempts: number;
  mailRetryBaseDelayMs: number;
  smtpHost?: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure: boolean;
  storageMode: WashoffObjectStorageMode;
  storageSignedUrlTtlSeconds: number;
  jobQueueMode: WashoffJobQueueMode;
  pdfFontPath?: string;
  serverHost: string;
  serverPort: number;
}

const parseBooleanFlag = (value?: string) => {
  return value === "1" || value === "true";
};

const parseInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseSameSite = (value?: string): WashoffCookieSameSite => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "strict") {
    return "Strict";
  }

  if (normalized === "none") {
    return "None";
  }

  return "Lax";
};

const requireProductionValue = (value: string | undefined, label: string) => {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`[WashOff] ${label} is required for production.`);
  }

  return normalized;
};

export const loadWashoffServerConfig = ({
  environmentOverride,
}: {
  environmentOverride?: WashoffEnvironment;
} = {}): WashoffServerConfig => {
  const environment = loadWashoffEnvironment({
    environment: environmentOverride ?? resolveWashoffEnvironment(),
  });
  const databaseUrl = selectDatabaseUrlForEnvironment(environment);
  const configuredMode = process.env.WASHOFF_SERVER_PERSISTENCE_MODE;
  const configuredAuthMode = process.env.WASHOFF_AUTH_MODE;
  const configuredMailMode = process.env.WASHOFF_MAIL_MODE;
  const configuredStorageMode = process.env.WASHOFF_OBJECT_STORAGE_MODE;
  const configuredJobQueueMode = process.env.WASHOFF_JOB_QUEUE_MODE;
  const persistenceMode: WashoffServerPersistenceMode =
    configuredMode === "db" || configuredMode === "file"
      ? configuredMode
      : databaseUrl
        ? "db"
        : "file";
  const authMode: WashoffAuthMode =
    configuredAuthMode === "disabled" ||
    configuredAuthMode === "dev-header" ||
    configuredAuthMode === "session"
      ? configuredAuthMode
      : "session";
  const requestTimeSweepEnabled =
    persistenceMode === "db"
      ? parseBooleanFlag(process.env.WASHOFF_ENABLE_REQUEST_TIME_SWEEP)
      : true;
  const mailMode: WashoffMailMode =
    configuredMailMode === "disabled" ||
    configuredMailMode === "console" ||
    configuredMailMode === "outbox" ||
    configuredMailMode === "smtp"
      ? configuredMailMode
      : environment === "production"
        ? "smtp"
        : "outbox";
  const storageMode: WashoffObjectStorageMode =
    configuredStorageMode === "filesystem" || configuredStorageMode === "database"
      ? configuredStorageMode
      : "database";
  const jobQueueMode: WashoffJobQueueMode =
    configuredJobQueueMode === "database" || configuredJobQueueMode === "memory"
      ? configuredJobQueueMode
      : environment === "production"
        ? "database"
        : "memory";
  const sessionCookieSecure =
    process.env.WASHOFF_SESSION_COOKIE_SECURE !== undefined
      ? parseBooleanFlag(process.env.WASHOFF_SESSION_COOKIE_SECURE)
      : environment === "production";
  const config: WashoffServerConfig = {
    environment,
    persistenceMode,
    persistenceModeExplicit: configuredMode === "db" || configuredMode === "file",
    databaseUrl,
    databaseTargetLabel: describeDatabaseTarget(databaseUrl),
    dataFilePath:
      process.env.WASHOFF_FILE_DATA_PATH || resolveDefaultDataFilePath(environment),
    workerEnabled: parseBooleanFlag(process.env.WASHOFF_ENABLE_WORKER),
    workerPollIntervalMs: parseInteger(process.env.WASHOFF_WORKER_POLL_INTERVAL_MS, 30000),
    requestTimeSweepEnabled,
    authMode,
    internalApiKey: process.env.WASHOFF_INTERNAL_API_KEY?.trim() || undefined,
    sessionCookieName: process.env.WASHOFF_SESSION_COOKIE_NAME?.trim() || "washoff_session",
    sessionCookieSameSite: parseSameSite(process.env.WASHOFF_SESSION_COOKIE_SAME_SITE),
    sessionCookieSecure,
    sessionCookieDomain: process.env.WASHOFF_SESSION_COOKIE_DOMAIN?.trim() || undefined,
    signingSecret:
      process.env.WASHOFF_SIGNING_SECRET?.trim() ||
      (environment === "production" ? "" : "washoff-dev-signing-secret"),
    publicAppUrl: process.env.WASHOFF_PUBLIC_APP_URL || "http://localhost:8080",
    mailMode,
    mailOutboxPath: process.env.WASHOFF_MAIL_OUTBOX_PATH || "data/mail-outbox",
    mailFromEmail: process.env.WASHOFF_MAIL_FROM_EMAIL || "washoff@outlook.sa",
    mailFromNameAr: process.env.WASHOFF_MAIL_FROM_NAME_AR || "منصة WashOff",
    mailRetryMaxAttempts: parseInteger(process.env.WASHOFF_MAIL_RETRY_MAX_ATTEMPTS, 3),
    mailRetryBaseDelayMs: parseInteger(process.env.WASHOFF_MAIL_RETRY_BASE_DELAY_MS, 500),
    smtpHost: process.env.SMTP_HOST?.trim() || undefined,
    smtpPort: parseInteger(process.env.SMTP_PORT, 587),
    smtpUser: process.env.SMTP_USER?.trim() || undefined,
    smtpPass: process.env.SMTP_PASS?.trim() || undefined,
    smtpSecure: parseBooleanFlag(process.env.SMTP_SECURE),
    storageMode,
    storageSignedUrlTtlSeconds: parseInteger(
      process.env.WASHOFF_STORAGE_SIGNED_URL_TTL_SECONDS,
      15 * 60,
    ),
    jobQueueMode,
    pdfFontPath: process.env.WASHOFF_PDF_FONT_PATH?.trim() || undefined,
    serverHost: process.env.WASHOFF_SERVER_HOST || "0.0.0.0",
    serverPort: parseInteger(process.env.WASHOFF_SERVER_PORT, 8787),
  };

  if (environment === "production") {
    if (config.persistenceMode !== "db") {
      throw new Error(
        '[WashOff] Production requires WASHOFF_SERVER_PERSISTENCE_MODE="db".',
      );
    }

    if (config.authMode !== "session") {
      throw new Error('[WashOff] Production requires WASHOFF_AUTH_MODE="session".');
    }

    config.signingSecret = requireProductionValue(
      config.signingSecret,
      "WASHOFF_SIGNING_SECRET",
    );

    if (config.mailMode !== "smtp") {
      throw new Error('[WashOff] Production requires WASHOFF_MAIL_MODE="smtp".');
    }

    if (config.storageMode === "filesystem") {
      throw new Error('[WashOff] Production requires non-filesystem object storage.');
    }

    requireProductionValue(config.databaseUrl, "DATABASE_URL");
    requireProductionValue(config.smtpHost, "SMTP_HOST");
    requireProductionValue(config.smtpUser, "SMTP_USER");
    requireProductionValue(config.smtpPass, "SMTP_PASS");
  }

  return config;
};
