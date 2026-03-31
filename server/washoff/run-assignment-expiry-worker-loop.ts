import { startWashoffAssignmentExpiryWorkerLoop } from "./assignment-expiry-worker.ts";
import { createWashoffApiRuntime } from "./runtime.ts";
import { createWashoffLogger } from "./logger.ts";
import { resolveWashoffEnvironment } from "./environment.ts";

const run = async () => {
  const logger = createWashoffLogger({
    bindings: { component: "washoff-assignment-expiry-worker-process" },
  });
  const runtime = await createWashoffApiRuntime({
    environmentOverride: resolveWashoffEnvironment(),
    logger: logger.child({ component: "washoff-runtime" }),
  });
  const stopLoop = startWashoffAssignmentExpiryWorkerLoop({
    worker: runtime.expiryWorker,
    intervalMs: runtime.config.workerPollIntervalMs,
    logger: logger.child({ component: "assignment-expiry-worker-loop" }),
  });

  const stop = () => {
    stopLoop();
    process.exitCode = 0;
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
};

run().catch((error) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : "Unknown WashOff worker loop failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
