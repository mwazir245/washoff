import type { IncomingMessage, ServerResponse } from "node:http";

export type WashoffCookieSameSite = "Strict" | "Lax" | "None";

const parseCookieHeader = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf("=");

        if (separatorIndex < 0) {
          return [entry, ""] as const;
        }

        return [
          decodeURIComponent(entry.slice(0, separatorIndex).trim()),
          decodeURIComponent(entry.slice(separatorIndex + 1).trim()),
        ] as const;
      }),
  );
};

export const readCookie = (request: IncomingMessage, name: string) => {
  const cookieHeader = Array.isArray(request.headers.cookie)
    ? request.headers.cookie[0]
    : request.headers.cookie;

  return parseCookieHeader(cookieHeader).get(name);
};

export const serializeCookie = ({
  name,
  value,
  httpOnly = true,
  secure = false,
  sameSite = "Lax",
  path = "/",
  expiresAt,
  maxAgeSeconds,
}: {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: WashoffCookieSameSite;
  path?: string;
  expiresAt?: string | Date;
  maxAgeSeconds?: number;
}) => {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, `Path=${path}`];

  if (httpOnly) {
    parts.push("HttpOnly");
  }

  if (secure) {
    parts.push("Secure");
  }

  if (sameSite) {
    parts.push(`SameSite=${sameSite}`);
  }

  if (typeof maxAgeSeconds === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }

  if (expiresAt) {
    const serializedDate = expiresAt instanceof Date ? expiresAt.toUTCString() : new Date(expiresAt).toUTCString();
    parts.push(`Expires=${serializedDate}`);
  }

  return parts.join("; ");
};

export const appendSetCookieHeader = (response: ServerResponse, cookieValue: string) => {
  const existingValue = response.getHeader("Set-Cookie");

  if (!existingValue) {
    response.setHeader("Set-Cookie", cookieValue);
    return;
  }

  if (Array.isArray(existingValue)) {
    response.setHeader("Set-Cookie", [...existingValue, cookieValue]);
    return;
  }

  response.setHeader("Set-Cookie", [String(existingValue), cookieValue]);
};

