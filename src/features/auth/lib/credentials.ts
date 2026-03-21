const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_HASH_LENGTH = 32;

const textEncoder = new TextEncoder();

const getCryptoApi = () => {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    throw new Error("Crypto API is unavailable in the current WashOff runtime.");
  }

  return globalThis.crypto;
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlToBytes = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary =
    typeof atob === "function"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const derivePasswordHash = async (password: string, salt: string) => {
  const cryptoApi = getCryptoApi();
  const key = await cryptoApi.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await cryptoApi.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64UrlToBytes(salt),
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    PASSWORD_HASH_LENGTH * 8,
  );

  return bytesToBase64Url(new Uint8Array(bits));
};

const digestValue = async (value: string) => {
  const cryptoApi = getCryptoApi();
  const hashBuffer = await cryptoApi.subtle.digest("SHA-256", textEncoder.encode(value));
  return bytesToBase64Url(new Uint8Array(hashBuffer));
};

export const createOpaqueToken = (size = 32) => {
  const cryptoApi = getCryptoApi();
  const bytes = new Uint8Array(size);
  cryptoApi.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
};

export const createPasswordDigest = async (password: string) => {
  const salt = createOpaqueToken(16);
  const hash = await derivePasswordHash(password, salt);

  return {
    salt,
    hash,
  };
};

export const verifyPasswordDigest = async (
  password: string,
  salt: string | undefined,
  expectedHash: string | undefined,
) => {
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = await derivePasswordHash(password, salt);
  return actualHash === expectedHash;
};

export const hashOpaqueToken = async (token: string) => {
  return digestValue(token);
};
