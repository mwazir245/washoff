import { createServer, type Server } from "node:http";
import { createWashoffApiHandler } from "./api-handler";
import { startWashoffAssignmentExpiryWorkerLoop } from "./assignment-expiry-worker";
import { loadWashoffServerConfig } from "./config";
import { createWashoffLogger } from "./logger";
import { createInMemoryWashoffMetrics } from "./metrics";
import { createWashoffApiRuntime, type WashoffApiRuntimeOptions } from "./runtime";

export interface WashoffStandaloneServer {
  server: Server;
  stop(): Promise<void>;
}

export const startWashoffStandaloneServer = async (
  runtimeOptions: WashoffApiRuntimeOptions = {},
): Promise<WashoffStandaloneServer> => {
  const config = loadWashoffServerConfig({
    environmentOverride: runtimeOptions.environmentOverride,
  });
  const logger = createWashoffLogger({ bindings: { component: "washoff-standalone-server" } });
  const metrics = createInMemoryWashoffMetrics();
  const runtime = await createWashoffApiRuntime({
    dataFilePath: runtimeOptions.dataFilePath,
    environmentOverride: runtimeOptions.environmentOverride,
    logger: logger.child({ component: "washoff-runtime" }),
    metrics,
  });
  let stopWorkerLoop: (() => void) | undefined;

  if (runtime.config.workerEnabled) {
    stopWorkerLoop = startWashoffAssignmentExpiryWorkerLoop({
      worker: runtime.expiryWorker,
      intervalMs: runtime.config.workerPollIntervalMs,
      logger: logger.child({ component: "assignment-expiry-worker-loop" }),
    });
  }

  const handleRequest = createWashoffApiHandler({
    getRuntime: async () => runtime,
    logger,
    metrics,
  });

  const server = createServer((request, response) => {
    void handleRequest(request, response)
      .then((handled) => {
        if (handled) {
          return;
        }

        response.statusCode = 404;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ error: "Standalone WashOff server only exposes API and health routes." }));
      })
      .catch((error) => {
        logger.error("server.request_unhandled_failure", {
          error,
        });
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ error: "Unhandled WashOff standalone server failure." }));
      });
  });

  await new Promise<void>((resolve) => {
    server.listen(config.serverPort, config.serverHost, () => {
      logger.info("server.started", {
        environment: runtime.config.environment,
        host: config.serverHost,
        port: config.serverPort,
        persistenceMode: runtime.config.persistenceMode,
        databaseTarget: runtime.config.databaseTargetLabel,
        mailMode: runtime.config.mailMode,
        workerEnabled: runtime.config.workerEnabled,
      });
      resolve();
    });
  });

  return {
    server,
    async stop() {
      stopWorkerLoop?.();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          logger.info("server.stopped");
          resolve();
        });
      });
    },
  };
};
