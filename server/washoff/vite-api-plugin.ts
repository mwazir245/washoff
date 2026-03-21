import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { createWashoffApiHandler, type WashoffApiRuntime, WASHOFF_API_BASE_PATH } from "./api-handler";
import { startWashoffAssignmentExpiryWorkerLoop } from "./assignment-expiry-worker";
import type { WashoffEnvironment } from "./environment";
import { createWashoffLogger, type WashoffLogger } from "./logger";
import { createInMemoryWashoffMetrics, type WashoffMetrics } from "./metrics";

export interface WashoffApiVitePluginOptions {
  dataFilePath?: string;
  environment?: WashoffEnvironment;
}

const loadRuntime = async (
  server: ViteDevServer,
  options: WashoffApiVitePluginOptions,
  logger: WashoffLogger,
  metrics: WashoffMetrics,
) => {
  const runtimeModule = await server.ssrLoadModule("/server/washoff/runtime.ts");

  return (await runtimeModule.createWashoffApiRuntime({
    dataFilePath: options.dataFilePath,
    logger,
    metrics,
    environmentOverride: options.environment,
  })) as WashoffApiRuntime & {
    logger: WashoffLogger;
    metrics: WashoffMetrics;
  };
};

export const createWashoffApiVitePlugin = (
  options: WashoffApiVitePluginOptions = {},
): Plugin => {
  return {
    name: "washoff-api-vite-plugin",
    configureServer(server) {
      const logger = createWashoffLogger({ bindings: { component: "washoff-vite-api" } });
      const metrics = createInMemoryWashoffMetrics();
      let runtimePromise: Promise<WashoffApiRuntime> | undefined;
      let stopWorkerLoop: (() => void) | undefined;

      const getRuntime = () => {
        runtimePromise ??= loadRuntime(
          server,
          options,
          logger.child({ component: "washoff-runtime" }),
          metrics,
        )
          .then((runtime) => runtime)
          .catch((error) => {
            runtimePromise = undefined;
            throw error;
          });
        return runtimePromise;
      };

      const ensureWorkerLoop = async () => {
        if (stopWorkerLoop) {
          return;
        }

        const runtime = await getRuntime();

        if (!runtime.config.workerEnabled) {
          return;
        }

        stopWorkerLoop = startWashoffAssignmentExpiryWorkerLoop({
          worker: runtime.expiryWorker,
          intervalMs: runtime.config.workerPollIntervalMs,
          logger: logger.child({ component: "assignment-expiry-worker-loop" }),
        });
      };

      const handleRequest = createWashoffApiHandler({
        getRuntime,
        ensureWorkerLoop,
        logger,
        metrics,
      });

      server.httpServer?.once("close", () => {
        stopWorkerLoop?.();
        stopWorkerLoop = undefined;
      });

      server.middlewares.use(async (request, response, next) => {
        if (request.url !== "/health" && !request.url?.startsWith(WASHOFF_API_BASE_PATH)) {
          return next();
        }

        const handled = await handleRequest(request, response);

        if (!handled) {
          next();
        }
      });
    },
  };
};
