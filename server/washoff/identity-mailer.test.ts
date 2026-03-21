import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { IdentityEmailDeliveryStatus } from "../../src/features/auth/model";
import { createWashoffIdentityMailer } from "./identity-mailer";

const createSilentLogger = () => {
  const logger = {
    child: () => logger,
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };

  return logger;
};

describe("Washoff identity mailer", () => {
  it("writes activation emails to the outbox in development mode", async () => {
    const outboxPath = await mkdtemp(path.join(os.tmpdir(), "washoff-mailer-"));
    const mailer = createWashoffIdentityMailer({
      mode: "outbox",
      outboxPath,
      fromEmail: "noreply@washoff.local",
      fromNameAr: "منصة WashOff",
      logger: createSilentLogger(),
    });

    const delivery = await mailer.sendActivationEmail({
      recipientEmail: "ops@washoff.sa",
      recipientName: "فريق التشغيل",
      role: "hotel",
      linkedEntityType: "hotel",
      activationPath: "http://localhost:8080/activate-account?token=test-token",
      expiresAt: "2030-03-20T12:00:00.000Z",
    });

    expect(delivery.status).toBe(IdentityEmailDeliveryStatus.Sent);
    expect(delivery.outboxFilePath).toBeDefined();

    const textMessage = await readFile(path.join(delivery.outboxFilePath!, "message.txt"), "utf8");
    expect(textMessage).toContain("WashOff");
    expect(textMessage).toContain("activate-account?token=test-token");
  });

  it("returns a safe failed delivery summary when mail delivery is disabled", async () => {
    const mailer = createWashoffIdentityMailer({
      mode: "disabled",
      outboxPath: "data/mail-outbox",
      fromEmail: "noreply@washoff.local",
      fromNameAr: "منصة WashOff",
      logger: createSilentLogger(),
    });

    const delivery = await mailer.sendPasswordResetEmail({
      recipientEmail: "ops@washoff.sa",
      recipientName: "فريق التشغيل",
      role: "hotel",
      linkedEntityType: "hotel",
      resetPath: "http://localhost:8080/reset-password?token=test-token",
      expiresAt: "2030-03-20T12:00:00.000Z",
    });

    expect(delivery.status).toBe(IdentityEmailDeliveryStatus.Failed);
    expect(delivery.failureReasonAr).toContain("تعطيل");
  });

  it("retries SMTP delivery before succeeding", async () => {
    const sendMail = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary smtp failure"))
      .mockResolvedValueOnce({ messageId: "smtp-message-1" });
    const mailer = createWashoffIdentityMailer({
      mode: "smtp",
      outboxPath: "data/mail-outbox",
      fromEmail: "noreply@washoff.local",
      fromNameAr: "منصة WashOff",
      retryMaxAttempts: 3,
      retryBaseDelayMs: 1,
      logger: createSilentLogger(),
      smtpTransportFactory: () => ({
        sendMail,
      }),
    });

    const delivery = await mailer.sendActivationEmail({
      recipientEmail: "ops@washoff.sa",
      recipientName: "فريق التشغيل",
      role: "hotel",
      linkedEntityType: "hotel",
      activationPath: "http://localhost:8080/activate-account?token=test-token",
      expiresAt: "2030-03-20T12:00:00.000Z",
    });

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(delivery.status).toBe(IdentityEmailDeliveryStatus.Retried);
    expect(delivery.retryCount).toBe(1);
    expect(delivery.attemptCount).toBe(2);
  });
});
