import { PrismaClient } from "@prisma/client";

declare global {
  var __washoffPrismaClients: Map<string, PrismaClient> | undefined;
}

export interface WashoffPrismaClientOptions {
  databaseUrl?: string;
  cacheKey?: string;
}

export const getWashoffPrismaClient = (options: WashoffPrismaClientOptions = {}) => {
  const cacheKey = options.cacheKey ?? options.databaseUrl ?? "default";

  if (!globalThis.__washoffPrismaClients) {
    globalThis.__washoffPrismaClients = new Map();
  }

  const existingClient = globalThis.__washoffPrismaClients.get(cacheKey);

  if (existingClient) {
    return existingClient;
  }

  const prismaClient = options.databaseUrl
    ? new PrismaClient({
        datasources: {
          db: {
            url: options.databaseUrl,
          },
        },
      })
    : new PrismaClient();

  globalThis.__washoffPrismaClients.set(cacheKey, prismaClient);

  return prismaClient;
};
