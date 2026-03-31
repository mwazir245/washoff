import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { WashoffLogger } from "./logger.ts";
import type { WashoffMetrics } from "./metrics.ts";

const sleep = (delayMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

type PrismaExecutor = PrismaClient;

export interface WashoffQueuedJob<TPayload> {
  id: string;
  type: string;
  lockKey: string;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
}

export interface WashoffJobQueueOptions {
  name: string;
  retryBaseDelayMs?: number;
  logger?: WashoffLogger;
  metrics?: WashoffMetrics;
}

export interface WashoffJobRunResult<TResult> {
  attempts: number;
  retried: boolean;
  skippedBecauseLocked: boolean;
  result?: TResult;
}

export interface WashoffJobQueue<TPayload> {
  enqueue(
    job: Omit<WashoffQueuedJob<TPayload>, "attempts" | "id"> & { idempotencyKey?: string },
  ): Promise<WashoffQueuedJob<TPayload>>;
  run<TResult>(
    jobId: string,
    processor: (job: WashoffQueuedJob<TPayload>) => Promise<TResult>,
  ): Promise<WashoffJobRunResult<TResult>>;
}

export const createInMemoryWashoffJobQueue = <TPayload,>(
  options: WashoffJobQueueOptions,
): WashoffJobQueue<TPayload> => {
  const retryBaseDelayMs = options.retryBaseDelayMs ?? 250;
  const pendingJobs = new Map<string, WashoffQueuedJob<TPayload>>();
  const activeLocks = new Set<string>();
  let sequence = 0;

  return {
    async enqueue(job) {
      const queuedJob: WashoffQueuedJob<TPayload> = {
        ...job,
        attempts: 0,
        id: `${options.name}-${Date.now()}-${sequence += 1}`,
      };

      pendingJobs.set(queuedJob.id, queuedJob);
      options.metrics?.incrementCounter("washoff_jobs_enqueued_total", {
        queue: options.name,
        type: queuedJob.type,
      });
      options.logger?.info("job.enqueued", {
        queue: options.name,
        jobId: queuedJob.id,
        jobType: queuedJob.type,
        lockKey: queuedJob.lockKey,
      });
      return queuedJob;
    },

    async run(jobId, processor) {
      const job = pendingJobs.get(jobId);

      if (!job) {
        throw new Error("تعذر العثور على المهمة المطلوبة داخل طابور WashOff.");
      }

      if (activeLocks.has(job.lockKey)) {
        options.metrics?.incrementCounter("washoff_jobs_locked_total", {
          queue: options.name,
          type: job.type,
        });
        options.logger?.warn("job.skipped_locked", {
          queue: options.name,
          jobId: job.id,
          jobType: job.type,
          lockKey: job.lockKey,
        });
        return {
          attempts: job.attempts,
          retried: job.attempts > 1,
          skippedBecauseLocked: true,
        };
      }

      activeLocks.add(job.lockKey);

      try {
        while (job.attempts < job.maxAttempts) {
          job.attempts += 1;

          try {
            const result = await processor(job);
            pendingJobs.delete(job.id);
            options.metrics?.incrementCounter("washoff_jobs_processed_total", {
              queue: options.name,
              type: job.type,
            });
            options.logger?.info("job.processed", {
              queue: options.name,
              jobId: job.id,
              jobType: job.type,
              attempts: job.attempts,
            });
            return {
              attempts: job.attempts,
              retried: job.attempts > 1,
              skippedBecauseLocked: false,
              result,
            };
          } catch (error) {
            const canRetry = job.attempts < job.maxAttempts;
            options.metrics?.incrementCounter("washoff_jobs_failed_total", {
              queue: options.name,
              type: job.type,
              retryable: canRetry,
            });

            if (!canRetry) {
              pendingJobs.delete(job.id);
              options.logger?.error("job.failed", {
                queue: options.name,
                jobId: job.id,
                jobType: job.type,
                attempts: job.attempts,
                error,
              });
              throw error;
            }

            const delayMs = retryBaseDelayMs * 2 ** (job.attempts - 1);
            options.logger?.warn("job.retry_scheduled", {
              queue: options.name,
              jobId: job.id,
              jobType: job.type,
              attempts: job.attempts,
              retryDelayMs: delayMs,
              error,
            });
            options.metrics?.incrementCounter("washoff_jobs_retried_total", {
              queue: options.name,
              type: job.type,
            });
            await sleep(delayMs);
          }
        }

        throw new Error("تعذر تنفيذ المهمة داخل طابور WashOff.");
      } finally {
        activeLocks.delete(job.lockKey);
      }
    },
  };
};

const mapDatabaseJob = <TPayload,>(record: {
  id: string;
  jobType: string;
  lockKey: string;
  payloadJson: unknown;
  attempts: number;
  maxAttempts: number;
}): WashoffQueuedJob<TPayload> => ({
  id: record.id,
  type: record.jobType,
  lockKey: record.lockKey,
  payload: record.payloadJson as TPayload,
  attempts: record.attempts,
  maxAttempts: record.maxAttempts,
});

export const createDatabaseWashoffJobQueue = <TPayload,>(
  prisma: PrismaExecutor,
  options: WashoffJobQueueOptions,
): WashoffJobQueue<TPayload> => {
  const retryBaseDelayMs = options.retryBaseDelayMs ?? 250;
  const lockOwner = `${options.name}-${randomUUID()}`;

  return {
    async enqueue(job) {
      const timestamp = new Date();
      const jobId = `${options.name}-${timestamp.getTime()}-${Math.round(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0")}`;

      const existingJob = job.idempotencyKey
        ? await prisma.backgroundJob.findUnique({
            where: { idempotencyKey: job.idempotencyKey },
          })
        : null;

      if (existingJob) {
        return mapDatabaseJob<TPayload>(existingJob);
      }

      const createdJob = await prisma.backgroundJob.create({
        data: {
          id: jobId,
          queueName: options.name,
          jobType: job.type,
          lockKey: job.lockKey,
          status: "queued",
          payloadJson: job.payload as object,
          attempts: 0,
          maxAttempts: job.maxAttempts,
          nextRunAt: timestamp,
          idempotencyKey: job.idempotencyKey,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      options.metrics?.incrementCounter("washoff_jobs_enqueued_total", {
        queue: options.name,
        type: createdJob.jobType,
      });
      options.logger?.info("job.enqueued", {
        queue: options.name,
        jobId: createdJob.id,
        jobType: createdJob.jobType,
        lockKey: createdJob.lockKey,
      });
      return mapDatabaseJob<TPayload>(createdJob);
    },

    async run(jobId, processor) {
      const initialJob = await prisma.backgroundJob.findUnique({
        where: { id: jobId },
      });

      if (!initialJob) {
        throw new Error("تعذر العثور على المهمة المطلوبة داخل طابور WashOff.");
      }

      while (true) {
        const timestamp = new Date();
        const freshRunningJob = await prisma.backgroundJob.findFirst({
          where: {
            queueName: options.name,
            lockKey: initialJob.lockKey,
            status: "running",
            id: { not: initialJob.id },
          },
        });

        if (freshRunningJob) {
          options.metrics?.incrementCounter("washoff_jobs_locked_total", {
            queue: options.name,
            type: initialJob.jobType,
          });
          options.logger?.warn("job.skipped_locked", {
            queue: options.name,
            jobId: initialJob.id,
            jobType: initialJob.jobType,
            lockKey: initialJob.lockKey,
          });
          return {
            attempts: initialJob.attempts,
            retried: initialJob.attempts > 1,
            skippedBecauseLocked: true,
          };
        }

        const lockResult = await prisma.backgroundJob.updateMany({
          where: {
            id: jobId,
            status: { in: ["queued", "retrying"] },
            nextRunAt: { lte: timestamp },
          },
          data: {
            status: "running",
            lockedAt: timestamp,
            lockOwner,
            updatedAt: timestamp,
          },
        });

        if (lockResult.count === 0) {
          const currentJob = await prisma.backgroundJob.findUnique({
            where: { id: jobId },
          });

          if (!currentJob) {
            throw new Error("تعذر العثور على المهمة المطلوبة داخل طابور WashOff.");
          }

          if (currentJob.status === "completed") {
            return {
              attempts: currentJob.attempts,
              retried: currentJob.attempts > 1,
              skippedBecauseLocked: false,
            };
          }

          if (currentJob.status === "failed") {
            throw new Error(currentJob.lastErrorAr ?? "تعذر تنفيذ المهمة داخل طابور WashOff.");
          }

          if (currentJob.nextRunAt > timestamp) {
            await sleep(Math.max(currentJob.nextRunAt.getTime() - timestamp.getTime(), 25));
            continue;
          }

          return {
            attempts: currentJob.attempts,
            retried: currentJob.attempts > 1,
            skippedBecauseLocked: true,
          };
        }

        const lockedJob = await prisma.backgroundJob.findUniqueOrThrow({
          where: { id: jobId },
        });
        const queuedJob = mapDatabaseJob<TPayload>(lockedJob);
        const nextAttempt = lockedJob.attempts + 1;

        try {
          const result = await processor({
            ...queuedJob,
            attempts: nextAttempt,
          });

          await prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
              attempts: nextAttempt,
              status: "completed",
              completedAt: new Date(),
              lockedAt: null,
              lockOwner: null,
              lastErrorAr: null,
              updatedAt: new Date(),
            },
          });
          options.metrics?.incrementCounter("washoff_jobs_processed_total", {
            queue: options.name,
            type: queuedJob.type,
          });
          options.logger?.info("job.processed", {
            queue: options.name,
            jobId: queuedJob.id,
            jobType: queuedJob.type,
            attempts: nextAttempt,
          });

          return {
            attempts: nextAttempt,
            retried: nextAttempt > 1,
            skippedBecauseLocked: false,
            result,
          };
        } catch (error) {
          const canRetry = nextAttempt < lockedJob.maxAttempts;
          options.metrics?.incrementCounter("washoff_jobs_failed_total", {
            queue: options.name,
            type: queuedJob.type,
            retryable: canRetry,
          });

          if (!canRetry) {
            await prisma.backgroundJob.update({
              where: { id: jobId },
              data: {
                attempts: nextAttempt,
                status: "failed",
                lockedAt: null,
                lockOwner: null,
                lastErrorAr:
                  error instanceof Error ? error.message : "تعذر تنفيذ المهمة داخل طابور WashOff.",
                updatedAt: new Date(),
              },
            });
            options.logger?.error("job.failed", {
              queue: options.name,
              jobId: queuedJob.id,
              jobType: queuedJob.type,
              attempts: nextAttempt,
              error,
            });
            throw error;
          }

          const delayMs = retryBaseDelayMs * 2 ** (nextAttempt - 1);
          const nextRunAt = new Date(Date.now() + delayMs);
          await prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
              attempts: nextAttempt,
              status: "retrying",
              nextRunAt,
              lockedAt: null,
              lockOwner: null,
              lastErrorAr:
                error instanceof Error ? error.message : "تعذر تنفيذ المهمة داخل طابور WashOff.",
              updatedAt: new Date(),
            },
          });
          options.logger?.warn("job.retry_scheduled", {
            queue: options.name,
            jobId: queuedJob.id,
            jobType: queuedJob.type,
            attempts: nextAttempt,
            retryDelayMs: delayMs,
            error,
          });
          options.metrics?.incrementCounter("washoff_jobs_retried_total", {
            queue: options.name,
            type: queuedJob.type,
          });
          await sleep(delayMs);
        }
      }
    },
  };
};
