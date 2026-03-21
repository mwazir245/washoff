import type {
  AccountProfile,
  AccountSessionProfile,
  AuthenticatedAccountSession,
} from "@/features/auth/model";

const SESSION_TOKEN_KEY = "washoff:auth:sessionToken";
const SESSION_ACCOUNT_KEY = "washoff:auth:account";
const memoryStorage = new Map<string, string>();

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
  token: string;
  account: AccountProfile;
  session: AccountSessionProfile;
}

export const readStoredClientSession = (): StoredClientAccountSession | null => {
  const token = readStorageValue(SESSION_TOKEN_KEY);
  const serializedAccount = readStorageValue(SESSION_ACCOUNT_KEY);

  if (!token || !serializedAccount) {
    return null;
  }

  try {
    const parsed = JSON.parse(serializedAccount) as {
      account: AccountProfile;
      session: AccountSessionProfile;
    };

    return {
      token,
      account: parsed.account,
      session: parsed.session,
    };
  } catch {
    return null;
  }
};

export const storeClientSession = (session: AuthenticatedAccountSession) => {
  writeStorageValue(SESSION_TOKEN_KEY, session.token);
  writeStorageValue(
    SESSION_ACCOUNT_KEY,
    JSON.stringify({
      account: session.account,
      session: session.session,
    }),
  );
};

export const clearClientSession = () => {
  removeStorageValue(SESSION_TOKEN_KEY);
  removeStorageValue(SESSION_ACCOUNT_KEY);
};

export const getStoredClientSessionToken = () => {
  return readStoredClientSession()?.token;
};

export const getStoredClientAccount = () => {
  return readStoredClientSession()?.account;
};
