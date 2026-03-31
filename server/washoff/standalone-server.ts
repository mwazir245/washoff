import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createWashoffApiHandler } from "./api-handler.ts";
import { startWashoffAssignmentExpiryWorkerLoop } from "./assignment-expiry-worker.ts";
import { loadWashoffServerConfig } from "./config.ts";
import { createWashoffLogger } from "./logger.ts";
import { createInMemoryWashoffMetrics } from "./metrics.ts";
import { createWashoffApiRuntime, type WashoffApiRuntimeOptions } from "./runtime.ts";

export interface WashoffStandaloneServer {
  server: Server;
  stop(): Promise<void>;
}

const PROJECT_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const DIST_ROOT = join(PROJECT_ROOT, "dist");

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const resolveStaticAssetPath = (pathname: string) => {
  const normalizedPath =
    pathname === "/" ? "index.html" : normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, "");
  const resolvedPath = resolve(DIST_ROOT, normalizedPath);

  if (!resolvedPath.startsWith(DIST_ROOT)) {
    return undefined;
  }

  return resolvedPath;
};

const serveStaticFrontend = async (request: IncomingMessage, response: ServerResponse) => {
  if (!request.url || (request.method !== "GET" && request.method !== "HEAD")) {
    return false;
  }

  const requestUrl = new URL(request.url, "http://washoff.local");

  if (requestUrl.pathname === "/health" || requestUrl.pathname.startsWith("/api/")) {
    return false;
  }

  const candidatePaths = [
    resolveStaticAssetPath(requestUrl.pathname),
    resolveStaticAssetPath("index.html"),
  ].filter((path): path is string => Boolean(path));

  for (const filePath of candidatePaths) {
    try {
      const fileContents = await readFile(filePath);
      response.statusCode = 200;
      response.setHeader(
        "Content-Type",
        MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      );
      response.setHeader("Cache-Control", filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable");

      if (request.method === "HEAD") {
        response.end();
        return true;
      }

      response.end(fileContents);
      return true;
    } catch {
      continue;
    }
  }

  return false;
};

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

        return serveStaticFrontend(request, response).then((served) => {
          if (served) {
            return;
          }

          response.statusCode = 404;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(
            JSON.stringify({
              error: "Standalone WashOff server could not find the requested API route or frontend asset.",
            }),
          );
        });
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
