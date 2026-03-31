import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import type { WashoffEnvironment } from "./environment.ts";
import { createWashoffLogger, type WashoffLogger } from "./logger.ts";
import { createInMemoryWashoffMetrics, type WashoffMetrics } from "./metrics.ts";

export interface WashoffApiVitePluginOptions {
  dataFilePath?: string;
  environment?: WashoffEnvironment;
}

const WASHOFF_API_BASE_PATH = "/api/platform";

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
      let runtimePromise: Promise<unknown> | undefined;
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

        const runtime = (await getRuntime()) as {
          config: {
            workerEnabled: boolean;
            workerPollIntervalMs: number;
          };
          expiryWorker: unknown;
        };

        if (!runtime.config.workerEnabled) {
          return;
        }

        const workerModule = await server.ssrLoadModule("/server/washoff/assignment-expiry-worker.ts");

        stopWorkerLoop = workerModule.startWashoffAssignmentExpiryWorkerLoop({
          worker: runtime.expiryWorker,
          intervalMs: runtime.config.workerPollIntervalMs,
          logger: logger.child({ component: "assignment-expiry-worker-loop" }),
        });
      };

      const handleRequest = async (request: Parameters<ViteDevServer["middlewares"]["use"]>[0], response: Parameters<ViteDevServer["middlewares"]["use"]>[1]) => {
        const apiHandlerModule = await server.ssrLoadModule("/server/washoff/api-handler.ts");
        const requestHandler = apiHandlerModule.createWashoffApiHandler({
          getRuntime,
          ensureWorkerLoop,
          logger,
          metrics,
        });

        return requestHandler(request, response);
      };

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
