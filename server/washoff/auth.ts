import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { readCookie } from "./http-cookies.ts";

export type WashoffApiRole = "hotel" | "provider" | "admin" | "worker";
export type WashoffAuthMode = "disabled" | "dev-header" | "session";

export interface WashoffResolvedSession {
  account: {
    id: string;
    role: WashoffApiRole;
    status: string;
    linkedHotelId?: string;
    linkedProviderId?: string;
  };
  session: {
    id: string;
  };
}

export interface WashoffSessionResolver {
  resolveAccountSession(sessionToken: string): Promise<WashoffResolvedSession | null>;
}

export interface WashoffApiAuthConfig {
  authMode: WashoffAuthMode;
  internalApiKey?: string;
  sessionCookieName?: string;
  sessionResolver?: WashoffSessionResolver;
}

export interface WashoffApiCaller {
  role: WashoffApiRole;
  entityId?: string;
  accountId?: string;
  sessionId?: string;
  source: "disabled" | "header" | "internal-key" | "session";
}

export class WashoffApiAuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "WashoffApiAuthError";
    this.statusCode = statusCode;
  }
}

const getHeader = (request: IncomingMessage, name: string) => {
  const value = request.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{10,512}$/;

const constantTimeEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const isRole = (value: string | undefined): value is WashoffApiRole => {
  return value === "hotel" || value === "provider" || value === "admin" || value === "worker";
};

export const resolveWashoffSessionTokenFromRequest = (
  request: IncomingMessage,
  sessionCookieName = "washoff_session",
) => {
  const authorizationHeader = getHeader(request, "authorization");

  if (authorizationHeader && !authorizationHeader.startsWith("Bearer ")) {
    throw new WashoffApiAuthError("صيغة ترويسة Authorization غير صحيحة في طلب WashOff.", 400);
  }

  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : undefined;
  const headerToken = getHeader(request, "x-washoff-session-token");
  const cookieToken = readCookie(request, sessionCookieName);
  const resolvedToken = bearerToken ?? headerToken ?? cookieToken;

  if (!resolvedToken) {
    return undefined;
  }

  return assertValidWashoffSessionToken(resolvedToken);
};

export const assertValidWashoffSessionToken = (sessionToken: string) => {
  if (!SESSION_TOKEN_PATTERN.test(sessionToken)) {
    throw new WashoffApiAuthError("رمز الجلسة المرسل إلى WashOff غير صالح.", 400);
  }

  return sessionToken;
};

const supportsSessionAuth = (authMode: WashoffAuthMode) => authMode === "session";

const supportsHeaderAuth = (authMode: WashoffAuthMode) => authMode === "dev-header";

export const resolveWashoffApiCaller = async (
  request: IncomingMessage,
  config: WashoffApiAuthConfig,
): Promise<WashoffApiCaller> => {
  if (config.authMode === "disabled") {
    return {
      role: "admin",
      source: "disabled",
    };
  }

  const internalApiKey = getHeader(request, "x-washoff-internal-key");

  if (config.internalApiKey && internalApiKey && constantTimeEquals(internalApiKey, config.internalApiKey)) {
    return {
      role: "worker",
      source: "internal-key",
    };
  }

  const bearerToken = resolveWashoffSessionTokenFromRequest(
    request,
    config.sessionCookieName,
  );

  if (supportsSessionAuth(config.authMode) && bearerToken) {
    const resolvedSession = await config.sessionResolver?.resolveAccountSession(bearerToken);

    if (resolvedSession) {
      if (resolvedSession.account.status !== "active") {
        throw new WashoffApiAuthError("الحساب الحالي غير نشط على منصة WashOff.", 403);
      }

      return {
        role: resolvedSession.account.role,
        entityId: resolvedSession.account.linkedHotelId ?? resolvedSession.account.linkedProviderId,
        accountId: resolvedSession.account.id,
        sessionId: resolvedSession.session.id,
        source: "session",
      };
    }

    if (config.authMode === "session") {
      throw new WashoffApiAuthError("جلسة WashOff غير صالحة أو منتهية الصلاحية.", 401);
    }
  } else if (config.authMode === "session") {
    throw new WashoffApiAuthError("يجب تسجيل الدخول للوصول إلى واجهة WashOff.", 401);
  }

  if (!supportsHeaderAuth(config.authMode)) {
    throw new WashoffApiAuthError("يجب تسجيل الدخول للوصول إلى واجهة WashOff.", 401);
  }

  const role = getHeader(request, "x-washoff-role");
  const entityId = getHeader(request, "x-washoff-entity-id");

  if (!isRole(role)) {
    throw new WashoffApiAuthError("لم يتم تعريف هوية المستدعي في واجهة WashOff.");
  }

  if ((role === "hotel" || role === "provider") && !entityId) {
    throw new WashoffApiAuthError("يلزم تعريف معرف الجهة المستدعية لهذا الدور.");
  }

  return {
    role,
    entityId: entityId ?? undefined,
    source: "header",
  };
};

export const requireWashoffRole = (
  caller: WashoffApiCaller,
  allowedRoles: WashoffApiRole[],
) => {
  if (!allowedRoles.includes(caller.role)) {
    throw new WashoffApiAuthError("ليس لديك صلاحية الوصول إلى هذا المسار.", 403);
  }
};

export const resolveAuthorizedHotelId = (
  caller: WashoffApiCaller,
  requestedHotelId?: string,
) => {
  if (caller.role === "admin") {
    return requestedHotelId;
  }

  if (caller.role !== "hotel") {
    throw new WashoffApiAuthError("هذا المسار مخصص للفنادق أو الإدارة فقط.", 403);
  }

  if (requestedHotelId && requestedHotelId !== caller.entityId) {
    throw new WashoffApiAuthError("لا يمكنك الوصول إلى بيانات فندق آخر.", 403);
  }

  return caller.entityId;
};

export const resolveAuthorizedProviderId = (
  caller: WashoffApiCaller,
  requestedProviderId?: string,
) => {
  if (caller.role === "admin") {
    return requestedProviderId;
  }

  if (caller.role !== "provider") {
    throw new WashoffApiAuthError("هذا المسار مخصص للمزوّدين أو الإدارة فقط.", 403);
  }

  if (requestedProviderId && requestedProviderId !== caller.entityId) {
    throw new WashoffApiAuthError("لا يمكنك تنفيذ العملية نيابة عن مزوّد آخر.", 403);
  }

  return caller.entityId;
};

export const isWashoffApiAuthError = (error: unknown): error is WashoffApiAuthError => {
  return error instanceof WashoffApiAuthError;
};
