import type { WashoffAuthMode } from "./auth";
import {
  describeDatabaseTarget,
  loadWashoffEnvironment,
  resolveDefaultDataFilePath,
  resolveWashoffEnvironment,
  selectDatabaseUrlForEnvironment,
  type WashoffEnvironment,
} from "./environment";

export type WashoffServerPersistenceMode = "file" | "db";
export type WashoffMailMode = "disabled" | "console" | "outbox" | "smtp";

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
  const persistenceMode: WashoffServerPersistenceMode =
    configuredMode === "db" || configuredMode === "file"
      ? configuredMode
      : databaseUrl
        ? "db"
        : "file";
  const configuredAuthMode = process.env.WASHOFF_AUTH_MODE;
  const configuredMailMode = process.env.WASHOFF_MAIL_MODE;
  const authMode: WashoffAuthMode =
    configuredAuthMode === "disabled" ||
    configuredAuthMode === "dev-header" ||
    configuredAuthMode === "session" ||
    configuredAuthMode === "session-or-dev-header"
      ? configuredAuthMode
      : persistenceMode === "db"
        ? "session-or-dev-header"
        : "dev-header";
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
      : "outbox";

  return {
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
    internalApiKey: process.env.WASHOFF_INTERNAL_API_KEY || "washoff-dev-internal-key",
    publicAppUrl: process.env.WASHOFF_PUBLIC_APP_URL || "http://localhost:8080",
    mailMode,
    mailOutboxPath: process.env.WASHOFF_MAIL_OUTBOX_PATH || "data/mail-outbox",
    mailFromEmail: process.env.WASHOFF_MAIL_FROM_EMAIL || "washoff@outlook.sa",
    mailFromNameAr: process.env.WASHOFF_MAIL_FROM_NAME_AR || "منصة WashOff",
    mailRetryMaxAttempts: parseInteger(process.env.WASHOFF_MAIL_RETRY_MAX_ATTEMPTS, 3),
    mailRetryBaseDelayMs: parseInteger(process.env.WASHOFF_MAIL_RETRY_BASE_DELAY_MS, 500),
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInteger(process.env.SMTP_PORT, 587),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: parseBooleanFlag(process.env.SMTP_SECURE),
    serverHost: process.env.WASHOFF_SERVER_HOST || "0.0.0.0",
    serverPort: parseInteger(process.env.WASHOFF_SERVER_PORT, 8787),
  };
};
