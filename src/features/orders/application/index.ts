import type { WashoffPlatformRepository } from "@/features/orders/application/ports/washoff-platform-repository";
import {
  createWashoffPlatformApplicationService,
  type WashoffPlatformApplicationService,
} from "@/features/orders/application/services/washoff-platform-service";
import { createApiWashoffPlatformRepository } from "@/features/orders/infrastructure/adapters/api-platform-repository";
import { createPreviewWashoffPlatformRepository } from "@/features/orders/infrastructure/adapters/preview-platform-repository";

export type WashoffPlatformRuntimeMode = "preview" | "api";

const resolveDefaultRepositoryMode = (): WashoffPlatformRuntimeMode => {
  const configuredMode = import.meta.env.VITE_WASHOFF_DATA_SOURCE;

  if (configuredMode === "api" || configuredMode === "preview") {
    return configuredMode;
  }

  return import.meta.env.DEV ? "api" : "preview";
};

const createRepositoryForMode = (mode: WashoffPlatformRuntimeMode): WashoffPlatformRepository => {
  if (mode === "api") {
    const configuredApiBaseUrl = import.meta.env.VITE_WASHOFF_API_BASE_URL?.trim();

    return createApiWashoffPlatformRepository({
      baseUrl: configuredApiBaseUrl || undefined,
    });
  }

  return createPreviewWashoffPlatformRepository();
};

let activeMode: WashoffPlatformRuntimeMode = resolveDefaultRepositoryMode();
let activeRepository: WashoffPlatformRepository = createRepositoryForMode(activeMode);
let activeService: WashoffPlatformApplicationService = createWashoffPlatformApplicationService(activeRepository);

export const getWashoffPlatformRepository = () => activeRepository;

export const getWashoffPlatformService = () => activeService;

export const getWashoffPlatformRuntimeMode = () => activeMode;

export const configureWashoffPlatformRepository = (
  repository: WashoffPlatformRepository,
  mode: WashoffPlatformRuntimeMode = activeMode,
) => {
  activeMode = mode;
  activeRepository = repository;
  activeService = createWashoffPlatformApplicationService(activeRepository);
};

export const configureWashoffPlatformRuntimeMode = (mode: WashoffPlatformRuntimeMode) => {
  activeMode = mode;
  activeRepository = createRepositoryForMode(mode);
  activeService = createWashoffPlatformApplicationService(activeRepository);
};

export * from "@/features/orders/application/contracts/platform-contracts";
export * from "@/features/orders/application/ports/washoff-platform-repository";
export * from "@/features/orders/application/services/washoff-platform-service";
