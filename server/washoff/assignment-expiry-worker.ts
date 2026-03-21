import {
  AssignmentStatus,
  OrderStatus,
  type LaundryOrder,
} from "../../src/features/orders/model";
import {
  createInMemoryWashoffJobQueue,
  type WashoffJobQueue,
} from "./job-queue";
import { createWashoffLogger, type WashoffLogger } from "./logger";
import type { WashoffMetrics } from "./metrics";

export interface WashoffAssignmentExpiryWorkerDeps {
  repository: {
    listAllOrders(): Promise<LaundryOrder[]>;
  };
  service: {
    runAssignmentExpirySweep(referenceTime?: string): Promise<LaundryOrder[]>;
  };
  logger?: WashoffLogger;
  metrics?: WashoffMetrics;
  jobQueue?: WashoffJobQueue<{ referenceTime: string }>;
  maxAttempts?: number;
}

export interface WashoffAssignmentExpiryWorkerResult {
  referenceTime: string;
  scannedOrders: number;
  expiredCandidates: number;
  reassignedOrders: number;
  unresolvedOrders: number;
  skippedBecauseRunning: boolean;
  processedOrderIds: string[];
  attempts: number;
  retried: boolean;
}

const isExpiredPendingAssignment = (order: LaundryOrder, referenceTime: string) => {
  return (
    order.status === OrderStatus.Assigned &&
    order.activeAssignment?.status === AssignmentStatus.PendingAcceptance &&
    Boolean(order.activeAssignment.responseDueAt) &&
    new Date(order.activeAssignment.responseDueAt!).getTime() <= new Date(referenceTime).getTime()
  );
};

export const createWashoffAssignmentExpiryWorker = (
  deps: WashoffAssignmentExpiryWorkerDeps,
) => {
  const logger = deps.logger ?? createWashoffLogger({ bindings: { component: "assignment-expiry-worker" } });
  const metrics = deps.metrics;
  const queue =
    deps.jobQueue ??
    createInMemoryWashoffJobQueue<{ referenceTime: string }>({
      name: "assignment-expiry",
      logger,
      metrics,
    });

  const processSweep = async (referenceTime: string): Promise<WashoffAssignmentExpiryWorkerResult> => {
    const beforeOrders = await deps.repository.listAllOrders();
    const expiredCandidates = beforeOrders.filter((order) =>
      isExpiredPendingAssignment(order, referenceTime),
    );

    if (expiredCandidates.length === 0) {
      return {
        referenceTime,
        scannedOrders: beforeOrders.length,
        expiredCandidates: 0,
        reassignedOrders: 0,
        unresolvedOrders: 0,
        skippedBecauseRunning: false,
        processedOrderIds: [],
        attempts: 1,
        retried: false,
      };
    }

    const afterOrders = await deps.service.runAssignmentExpirySweep(referenceTime);
    const afterOrdersById = new Map(afterOrders.map((order) => [order.id, order]));
    let reassignedOrders = 0;
    let unresolvedOrders = 0;

    expiredCandidates.forEach((beforeOrder) => {
      const afterOrder = afterOrdersById.get(beforeOrder.id);

      if (!afterOrder) {
        return;
      }

      if (
        afterOrder.status === OrderStatus.Assigned &&
        afterOrder.activeAssignment?.attemptNumber &&
        beforeOrder.activeAssignment?.attemptNumber &&
        afterOrder.activeAssignment.attemptNumber > beforeOrder.activeAssignment.attemptNumber
      ) {
        reassignedOrders += 1;
        return;
      }

      if (afterOrder.status === OrderStatus.PendingCapacity) {
        unresolvedOrders += 1;
      }
    });

    return {
      referenceTime,
      scannedOrders: beforeOrders.length,
      expiredCandidates: expiredCandidates.length,
      reassignedOrders,
      unresolvedOrders,
      skippedBecauseRunning: false,
      processedOrderIds: expiredCandidates.map((order) => order.id),
      attempts: 1,
      retried: false,
    };
  };

  return {
    async runOnce(referenceTime = new Date().toISOString()): Promise<WashoffAssignmentExpiryWorkerResult> {
      const queuedJob = queue.enqueue({
        type: "assignment-expiry-sweep",
        lockKey: "assignment-expiry-sweep",
        payload: {
          referenceTime,
        },
        maxAttempts: deps.maxAttempts ?? 3,
      });
      const execution = await queue.run(queuedJob.id, async (job) => processSweep(job.payload.referenceTime));

      if (execution.skippedBecauseLocked) {
        logger.warn("worker.assignment_expiry.skipped_locked", {
          referenceTime,
        });
        return {
          referenceTime,
          scannedOrders: 0,
          expiredCandidates: 0,
          reassignedOrders: 0,
          unresolvedOrders: 0,
          skippedBecauseRunning: true,
          processedOrderIds: [],
          attempts: execution.attempts,
          retried: execution.retried,
        };
      }

      const result = execution.result!;
      const normalizedResult = {
        ...result,
        attempts: execution.attempts,
        retried: execution.retried,
      };
      logger.info("worker.assignment_expiry.completed", normalizedResult);
      metrics?.incrementCounter("washoff_worker_runs_total", {
        worker: "assignment-expiry",
        retried: normalizedResult.retried,
      });
      return normalizedResult;
    },
  };
};

export const startWashoffAssignmentExpiryWorkerLoop = ({
  worker,
  intervalMs,
  logger,
}: {
  worker: {
    runOnce(referenceTime?: string): Promise<WashoffAssignmentExpiryWorkerResult>;
  };
  intervalMs: number;
  logger?: WashoffLogger;
}) => {
  const loopLogger =
    logger ?? createWashoffLogger({ bindings: { component: "assignment-expiry-worker-loop" } });
  let intervalHandle: NodeJS.Timeout | undefined;

  const tick = () => {
    worker.runOnce().catch((error) => {
      loopLogger.error("worker.assignment_expiry.failed", {
        error,
      });
    });
  };

  intervalHandle = setInterval(tick, intervalMs);
  loopLogger.info("worker.assignment_expiry.started", {
    intervalMs,
  });

  return () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = undefined;
    }

    loopLogger.info("worker.assignment_expiry.stopped");
  };
};
