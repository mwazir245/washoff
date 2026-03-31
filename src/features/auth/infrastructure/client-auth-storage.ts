import type {
  AccountProfile,
  AccountSessionProfile,
  AuthenticatedAccountSession,
} from "@/features/auth/model";

const SESSION_ACCOUNT_KEY = "washoff:auth:account";
const memoryStorage = new Map<string, string>();
let memorySessionToken: string | null = null;

const readWindowStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readStorageValue = (key: string) => {
  const storage = readWindowStorage();
  return storage ? storage.getItem(key) : memoryStorage.get(key) ?? null;
};

const writeStorageValue = (key: string, value: string) => {
  const storage = readWindowStorage();

  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
};

const removeStorageValue = (key: string) => {
  const storage = readWindowStorage();

  if (storage) {
    storage.removeItem(key);
    return;
  }

  memoryStorage.delete(key);
};

export interface StoredClientAccountSession {
  token?: string;
  account: AccountProfile;
  session: AccountSessionProfile;
}

export const readStoredClientSession = (): StoredClientAccountSession | null => {
  const serializedAccount = readStorageValue(SESSION_ACCOUNT_KEY);

  if (!serializedAccount) {
    return null;
  }

  try {
    const parsed = JSON.parse(serializedAccount) as {
      account: AccountProfile;
      session: AccountSessionProfile;
    };

    return {
      token: memorySessionToken ?? undefined,
      account: parsed.account,
      session: parsed.session,
    };
  } catch {
    return null;
  }
};

export const storeClientSession = (
  session: Pick<AuthenticatedAccountSession, "account" | "session"> & { token?: string },
) => {
  memorySessionToken = session.token?.trim() ? session.token : null;
  writeStorageValue(
    SESSION_ACCOUNT_KEY,
    JSON.stringify({
      account: session.account,
      session: session.session,
    }),
  );
};

export const clearClientSession = () => {
  memorySessionToken = null;
  removeStorageValue(SESSION_ACCOUNT_KEY);
};

export const getStoredClientSessionToken = () => {
  return memorySessionToken ?? undefined;
};

export const getStoredClientAccount = () => {
  return readStoredClientSession()?.account;
};
