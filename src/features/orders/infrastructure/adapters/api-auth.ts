import type { AccountRole } from "@/features/auth/model";
import {
  clearClientSession,
  getStoredClientAccount,
  storeClientSession,
} from "@/features/auth/infrastructure/client-auth-storage";
import type { AuthenticatedAccountSession } from "@/features/auth/model";

export type WashoffClientRole = AccountRole;

interface WashoffClientAuthContext {
  role: WashoffClientRole;
  entityId?: string;
}

const DEV_HEADER_AUTH_KEY = "washoff:dev-auth:enabled";
const DEFAULT_HOTEL_ID = import.meta.env.VITE_WASHOFF_DEFAULT_HOTEL_ID ?? "hotel-1";
const DEFAULT_PROVIDER_ID = import.meta.env.VITE_WASHOFF_DEFAULT_PROVIDER_ID ?? "provider-1";

const isDevHeaderAuthEnabled = () => {
  if (import.meta.env.VITE_WASHOFF_ENABLE_DEV_HEADER_AUTH === "true") {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(DEV_HEADER_AUTH_KEY) === "1";
  } catch {
    return false;
  }
};

const readClientOverride = (): Partial<WashoffClientAuthContext> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const role = window.localStorage.getItem("washoff:auth:role") as WashoffClientRole | null;
    const entityId = window.localStorage.getItem("washoff:auth:entityId");

    return {
      role: role ?? undefined,
      entityId: entityId ?? undefined,
    };
  } catch {
    return {};
  }
};

export const writeAuthenticatedClientSession = (
  session: Pick<AuthenticatedAccountSession, "account" | "session"> & { token?: string },
) => {
  storeClientSession(session);
};

export const clearAuthenticatedClientSession = () => {
  clearClientSession();
};

export const resolveWashoffClientAuthContext = (): WashoffClientAuthContext | null => {
  const sessionAccount = getStoredClientAccount();

  if (sessionAccount) {
    return {
      role: sessionAccount.role,
      entityId: sessionAccount.linkedHotelId ?? sessionAccount.linkedProviderId,
    };
  }

  if (!isDevHeaderAuthEnabled()) {
    return null;
  }

  const override = readClientOverride();

  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;

    if (pathname.startsWith("/provider-dashboard") || pathname.startsWith("/provider")) {
      return {
        role: "provider",
        entityId:
          override.role === "provider" ? override.entityId ?? DEFAULT_PROVIDER_ID : DEFAULT_PROVIDER_ID,
      };
    }

    if (pathname.startsWith("/admin-dashboard") || pathname.startsWith("/admin")) {
      return {
        role: "admin",
      };
    }

    if (pathname.startsWith("/hotel-dashboard") || pathname.startsWith("/hotel")) {
      return {
        role: "hotel",
        entityId: override.role === "hotel" ? override.entityId ?? DEFAULT_HOTEL_ID : DEFAULT_HOTEL_ID,
      };
    }
  }

  if (override.role === "admin") {
    return { role: "admin" };
  }

  if (override.role === "provider") {
    return {
      role: "provider",
      entityId: override.entityId ?? DEFAULT_PROVIDER_ID,
    };
  }

  if (override.role === "hotel") {
    return {
      role: "hotel",
      entityId: override.entityId ?? DEFAULT_HOTEL_ID,
    };
  }

  return {
    role: "hotel",
    entityId: DEFAULT_HOTEL_ID,
  };
};

export const buildWashoffApiAuthHeaders = (): Record<string, string> => {
  const context = resolveWashoffClientAuthContext();

  if (!context) {
    return {};
  }

  return {
    "x-washoff-role": context.role,
    ...(context.entityId ? { "x-washoff-entity-id": context.entityId } : {}),
  };
};
