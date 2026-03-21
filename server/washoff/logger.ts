export type WashoffLogLevel = "debug" | "info" | "warn" | "error";

export interface WashoffLogger {
  child(bindings: Record<string, unknown>): WashoffLogger;
  debug(event: string, metadata?: Record<string, unknown>): void;
  info(event: string, metadata?: Record<string, unknown>): void;
  warn(event: string, metadata?: Record<string, unknown>): void;
  error(event: string, metadata?: Record<string, unknown>): void;
}

export interface WashoffLoggerOptions {
  bindings?: Record<string, unknown>;
  minimumLevel?: WashoffLogLevel;
}

const logLevelOrder: Record<WashoffLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const serializeLogValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeLogValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeLogValue(entry)]),
    );
  }

  return value;
};

const writeStructuredLog = (level: WashoffLogLevel, payload: Record<string, unknown>) => {
  const serializedPayload = `${JSON.stringify(payload)}\n`;

  if (level === "error" || level === "warn") {
    process.stderr.write(serializedPayload);
    return;
  }

  process.stdout.write(serializedPayload);
};

export const createWashoffLogger = (
  options: WashoffLoggerOptions = {},
): WashoffLogger => {
  const minimumLevel = options.minimumLevel ?? "info";
  const bindings = options.bindings ?? {};

  const log =
    (level: WashoffLogLevel) =>
    (event: string, metadata: Record<string, unknown> = {}) => {
      if (logLevelOrder[level] < logLevelOrder[minimumLevel]) {
        return;
      }

      writeStructuredLog(level, {
        ts: new Date().toISOString(),
        level,
        event,
        ...serializeLogValue(bindings),
        ...serializeLogValue(metadata),
      });
    };

  return {
    child(childBindings) {
      return createWashoffLogger({
        bindings: {
          ...bindings,
          ...childBindings,
        },
        minimumLevel,
      });
    },
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
  };
};
