import type { WashoffLogger } from "./logger";
import type { WashoffMetrics } from "./metrics";

const sleep = (delayMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

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
  enqueue(job: Omit<WashoffQueuedJob<TPayload>, "attempts" | "id">): WashoffQueuedJob<TPayload>;
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
    enqueue(job) {
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
