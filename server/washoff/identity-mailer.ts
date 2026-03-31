import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import {
  IdentityEmailDeliveryStatus,
  identityEmailDeliveryStatusLabelsAr,
  type IdentityEmailDeliverySummary,
} from "../../src/features/auth/model/index.ts";
import type { WashoffIdentityMailDelivery } from "../../src/features/orders/application/services/washoff-platform-service.ts";
import { renderActivationEmailTemplate, renderPasswordResetEmailTemplate } from "./identity-mail-templates.ts";
import { createWashoffLogger, type WashoffLogger } from "./logger.ts";
import type { WashoffMetrics } from "./metrics.ts";

export type WashoffIdentityMailMode = "disabled" | "console" | "outbox" | "smtp";

interface WashoffSmtpTransport {
  sendMail(message: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ messageId?: string }>;
}

export interface WashoffIdentityMailerConfig {
  mode: WashoffIdentityMailMode;
  outboxPath: string;
  fromEmail: string;
  fromNameAr: string;
  retryMaxAttempts?: number;
  retryBaseDelayMs?: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  logger?: WashoffLogger;
  metrics?: WashoffMetrics;
  smtpTransportFactory?: () => WashoffSmtpTransport;
}

interface DeliveryAttemptResult {
  providerMessageId?: string;
  outboxFilePath?: string;
}

const sleep = (delayMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

const createDeliverySummary = ({
  kind,
  status,
  providerLabelAr,
  providerMessageId,
  outboxFilePath,
  failureReasonAr,
  occurredAt = new Date().toISOString(),
  attemptCount = 1,
}: {
  kind: IdentityEmailDeliverySummary["kind"];
  status: IdentityEmailDeliverySummary["status"];
  providerLabelAr: string;
  providerMessageId?: string;
  outboxFilePath?: string;
  failureReasonAr?: string;
  occurredAt?: string;
  attemptCount?: number;
}): IdentityEmailDeliverySummary => ({
  kind,
  status,
  statusLabelAr: identityEmailDeliveryStatusLabelsAr[status],
  providerLabelAr,
  providerMessageId,
  occurredAt,
  sentAt:
    status === IdentityEmailDeliveryStatus.Sent || status === IdentityEmailDeliveryStatus.Retried
      ? occurredAt
      : undefined,
  failedAt: status === IdentityEmailDeliveryStatus.Failed ? occurredAt : undefined,
  failureReasonAr,
  outboxFilePath,
  attemptCount,
  retryCount: Math.max(attemptCount - 1, 0),
});

const createOutboxMessageId = (kind: string) => {
  return `mail-${kind}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

const writeOutboxMessage = async ({
  outboxPath,
  kind,
  fromEmail,
  fromNameAr,
  recipientEmail,
  subjectAr,
  html,
  text,
}: {
  outboxPath: string;
  kind: IdentityEmailDeliverySummary["kind"];
  fromEmail: string;
  fromNameAr: string;
  recipientEmail: string;
  subjectAr: string;
  html: string;
  text: string;
}) => {
  const messageId = createOutboxMessageId(kind);
  const safeRecipient = recipientEmail.replace(/[^a-zA-Z0-9@._-]/g, "_");
  const dayFolder = new Date().toISOString().slice(0, 10);
  const messageFolder = path.resolve(outboxPath, dayFolder, `${safeRecipient}-${messageId}`);

  await fs.mkdir(messageFolder, { recursive: true });
  await fs.writeFile(path.join(messageFolder, "message.html"), html, "utf8");
  await fs.writeFile(path.join(messageFolder, "message.txt"), text, "utf8");
  await fs.writeFile(
    path.join(messageFolder, "meta.json"),
    `${JSON.stringify(
      {
        id: messageId,
        kind,
        fromEmail,
        fromNameAr,
        recipientEmail,
        subjectAr,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    messageId,
    outboxFilePath: messageFolder,
  };
};

const createSmtpTransport = (config: WashoffIdentityMailerConfig): WashoffSmtpTransport => {
  if (!config.smtpHost || !config.smtpPort) {
    throw new Error("SMTP configuration is incomplete for WashOff identity mail delivery.");
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure ?? false,
    auth:
      config.smtpUser || config.smtpPass
        ? {
            user: config.smtpUser,
            pass: config.smtpPass,
          }
        : undefined,
  });

  return {
    async sendMail(message) {
      const info = await transporter.sendMail(message);
      return {
        messageId: info.messageId,
      };
    },
  };
};

const resolveMailProviderLabel = (mode: WashoffIdentityMailMode) => {
  switch (mode) {
    case "smtp":
      return "خادم SMTP";
    case "console":
      return "سجل الخادم";
    case "outbox":
      return "صندوق بريد التطوير";
    case "disabled":
    default:
      return "إرسال البريد معطل";
  }
};

const sendWithDeliveryGuard = async ({
  config,
  kind,
  action,
}: {
  config: WashoffIdentityMailerConfig;
  kind: IdentityEmailDeliverySummary["kind"];
  action: () => Promise<DeliveryAttemptResult>;
}): Promise<IdentityEmailDeliverySummary> => {
  const logger = config.logger ?? createWashoffLogger({ bindings: { component: "identity-mailer" } });
  const metrics = config.metrics;
  const retryMaxAttempts = Math.max(config.retryMaxAttempts ?? 3, 1);
  const retryBaseDelayMs = Math.max(config.retryBaseDelayMs ?? 500, 0);
  const providerLabelAr = resolveMailProviderLabel(config.mode);
  let lastError: unknown;

  for (let attempt = 1; attempt <= retryMaxAttempts; attempt += 1) {
    try {
      const result = await action();
      const status =
        attempt > 1 ? IdentityEmailDeliveryStatus.Retried : IdentityEmailDeliveryStatus.Sent;
      const summary = createDeliverySummary({
        kind,
        status,
        providerLabelAr,
        providerMessageId: result.providerMessageId,
        outboxFilePath: result.outboxFilePath,
        attemptCount: attempt,
      });

      metrics?.incrementCounter("washoff_mail_delivery_total", {
        kind,
        mode: config.mode,
        status,
      });
      logger.info("mail.delivery_succeeded", {
        kind,
        mode: config.mode,
        status,
        attempts: attempt,
        providerMessageId: result.providerMessageId,
        outboxFilePath: result.outboxFilePath,
      });
      return summary;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < retryMaxAttempts;
      const failureMessage =
        error instanceof Error ? error.message : "تعذر تنفيذ عملية البريد في WashOff.";

      metrics?.incrementCounter("washoff_mail_delivery_attempts_total", {
        kind,
        mode: config.mode,
        outcome: canRetry ? "retry" : "failed",
      });

      if (!canRetry) {
        logger.error("mail.delivery_failed", {
          kind,
          mode: config.mode,
          attempts: attempt,
          error,
        });
        return createDeliverySummary({
          kind,
          status: IdentityEmailDeliveryStatus.Failed,
          providerLabelAr,
          failureReasonAr: failureMessage,
          attemptCount: attempt,
        });
      }

      const retryDelayMs = retryBaseDelayMs * 2 ** (attempt - 1);
      logger.warn("mail.delivery_retry_scheduled", {
        kind,
        mode: config.mode,
        attempt,
        retryDelayMs,
        error,
      });
      metrics?.incrementCounter("washoff_mail_delivery_retried_total", {
        kind,
        mode: config.mode,
      });
      await sleep(retryDelayMs);
    }
  }

  return createDeliverySummary({
    kind,
    status: IdentityEmailDeliveryStatus.Failed,
    providerLabelAr,
    failureReasonAr:
      lastError instanceof Error ? lastError.message : "تعذر إرسال الرسالة عبر طبقة البريد.",
    attemptCount: retryMaxAttempts,
  });
};

const createConsoleIdentityMailer = (
  config: WashoffIdentityMailerConfig,
): WashoffIdentityMailDelivery => {
  const logger = config.logger ?? createWashoffLogger({ bindings: { component: "identity-mailer" } });

  return {
    sendActivationEmail: async ({ recipientEmail, recipientName, role, activationPath, expiresAt }) => {
      return sendWithDeliveryGuard({
        config,
        kind: "activation",
        action: async () => {
          const message = renderActivationEmailTemplate({
            recipientName,
            actionUrl: activationPath,
            expiresAt,
            role,
          });
          const messageId = createOutboxMessageId("activation");
          logger.info("mail.console_rendered", {
            kind: "activation",
            recipientEmail,
            messageId,
            subjectAr: message.subjectAr,
            previewText: message.text,
          });
          return {
            providerMessageId: messageId,
          };
        },
      });
    },

    sendPasswordResetEmail: async ({ recipientEmail, recipientName, resetPath, expiresAt }) => {
      return sendWithDeliveryGuard({
        config,
        kind: "password_reset",
        action: async () => {
          const message = renderPasswordResetEmailTemplate({
            recipientName,
            actionUrl: resetPath,
            expiresAt,
          });
          const messageId = createOutboxMessageId("password-reset");
          logger.info("mail.console_rendered", {
            kind: "password_reset",
            recipientEmail,
            messageId,
            subjectAr: message.subjectAr,
            previewText: message.text,
          });
          return {
            providerMessageId: messageId,
          };
        },
      });
    },
  };
};

const createOutboxIdentityMailer = (
  config: WashoffIdentityMailerConfig,
): WashoffIdentityMailDelivery => ({
  sendActivationEmail: async ({ recipientEmail, recipientName, role, activationPath, expiresAt }) =>
    sendWithDeliveryGuard({
      config,
      kind: "activation",
      action: async () => {
        const message = renderActivationEmailTemplate({
          recipientName,
          actionUrl: activationPath,
          expiresAt,
          role,
        });
        const outbox = await writeOutboxMessage({
          outboxPath: config.outboxPath,
          kind: "activation",
          fromEmail: config.fromEmail,
          fromNameAr: config.fromNameAr,
          recipientEmail,
          subjectAr: message.subjectAr,
          html: message.html,
          text: message.text,
        });
        return {
          providerMessageId: outbox.messageId,
          outboxFilePath: outbox.outboxFilePath,
        };
      },
    }),

  sendPasswordResetEmail: async ({ recipientEmail, recipientName, resetPath, expiresAt }) =>
    sendWithDeliveryGuard({
      config,
      kind: "password_reset",
      action: async () => {
        const message = renderPasswordResetEmailTemplate({
          recipientName,
          actionUrl: resetPath,
          expiresAt,
        });
        const outbox = await writeOutboxMessage({
          outboxPath: config.outboxPath,
          kind: "password_reset",
          fromEmail: config.fromEmail,
          fromNameAr: config.fromNameAr,
          recipientEmail,
          subjectAr: message.subjectAr,
          html: message.html,
          text: message.text,
        });
        return {
          providerMessageId: outbox.messageId,
          outboxFilePath: outbox.outboxFilePath,
        };
      },
    }),
});

const createSmtpIdentityMailer = (
  config: WashoffIdentityMailerConfig,
): WashoffIdentityMailDelivery => {
  const getTransport = (() => {
    let transport: WashoffSmtpTransport | undefined;

    return () => {
      if (!transport) {
        transport = config.smtpTransportFactory ? config.smtpTransportFactory() : createSmtpTransport(config);
      }

      return transport;
    };
  })();

  return {
    sendActivationEmail: async ({ recipientEmail, recipientName, role, activationPath, expiresAt }) =>
      sendWithDeliveryGuard({
        config,
        kind: "activation",
        action: async () => {
          const message = renderActivationEmailTemplate({
            recipientName,
            actionUrl: activationPath,
            expiresAt,
            role,
          });
          const result = await getTransport().sendMail({
            from: `"${config.fromNameAr}" <${config.fromEmail}>`,
            to: recipientEmail,
            subject: message.subjectAr,
            html: message.html,
            text: message.text,
          });
          return {
            providerMessageId: result.messageId,
          };
        },
      }),

    sendPasswordResetEmail: async ({ recipientEmail, recipientName, resetPath, expiresAt }) =>
      sendWithDeliveryGuard({
        config,
        kind: "password_reset",
        action: async () => {
          const message = renderPasswordResetEmailTemplate({
            recipientName,
            actionUrl: resetPath,
            expiresAt,
          });
          const result = await getTransport().sendMail({
            from: `"${config.fromNameAr}" <${config.fromEmail}>`,
            to: recipientEmail,
            subject: message.subjectAr,
            html: message.html,
            text: message.text,
          });
          return {
            providerMessageId: result.messageId,
          };
        },
      }),
  };
};

const createDisabledIdentityMailer = (
  config: WashoffIdentityMailerConfig,
): WashoffIdentityMailDelivery => ({
  sendActivationEmail: async () =>
    createDeliverySummary({
      kind: "activation",
      status: IdentityEmailDeliveryStatus.Failed,
      providerLabelAr: resolveMailProviderLabel(config.mode),
      failureReasonAr: "تم تعطيل إرسال البريد في إعدادات WashOff الحالية.",
      attemptCount: 1,
    }),

  sendPasswordResetEmail: async () =>
    createDeliverySummary({
      kind: "password_reset",
      status: IdentityEmailDeliveryStatus.Failed,
      providerLabelAr: resolveMailProviderLabel(config.mode),
      failureReasonAr: "تم تعطيل إرسال البريد في إعدادات WashOff الحالية.",
      attemptCount: 1,
    }),
});

export const createWashoffIdentityMailer = (
  config: WashoffIdentityMailerConfig,
): WashoffIdentityMailDelivery => {
  switch (config.mode) {
    case "smtp":
      return createSmtpIdentityMailer(config);
    case "outbox":
      return createOutboxIdentityMailer(config);
    case "console":
      return createConsoleIdentityMailer(config);
    case "disabled":
    default:
      return createDisabledIdentityMailer(config);
  }
};
