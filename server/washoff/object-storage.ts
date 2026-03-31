import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Prisma, type PrismaClient, type StoredObject as PrismaStoredObject } from "@prisma/client";

export type WashoffObjectStorageMode = "database" | "filesystem";
export type WashoffObjectDownloadDisposition = "inline" | "attachment";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface WashoffStoredObjectDescriptor {
  id: string;
  storageProvider: string;
  storageKey: string;
  logicalBucket: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  createdAt: string;
  updatedAt: string;
  metadataJson?: Prisma.JsonValue;
}

export interface WashoffStoredObjectReadResult {
  object: WashoffStoredObjectDescriptor;
  contentBytes: Buffer;
}

export interface WashoffStoredObjectWriteInput {
  objectId?: string;
  storageKey?: string;
  logicalBucket: string;
  fileName: string;
  mimeType: string;
  contentBytes: Buffer;
  metadataJson?: Prisma.InputJsonValue;
  createdAt?: string;
}

export interface WashoffObjectStorage {
  mode: WashoffObjectStorageMode;
  storeObject(input: WashoffStoredObjectWriteInput): Promise<WashoffStoredObjectDescriptor>;
  storeObjectTx?(
    tx: Prisma.TransactionClient,
    input: WashoffStoredObjectWriteInput,
  ): Promise<WashoffStoredObjectDescriptor>;
  readObject(objectId: string): Promise<WashoffStoredObjectReadResult | null>;
  createSignedDownloadPath(input: {
    objectId: string;
    fileName?: string;
    disposition?: WashoffObjectDownloadDisposition;
    purpose?: string;
    ttlSeconds?: number;
  }): string;
  verifySignedDownload(input: {
    objectId: string;
    fileName?: string;
    disposition?: string | null;
    purpose?: string | null;
    expires?: string | null;
    signature?: string | null;
  }): boolean;
}

const DEFAULT_DOWNLOAD_BASE_PATH = "/api/platform/storage/objects";
const DEFAULT_FILESYSTEM_ROOT = path.resolve(process.cwd(), "data", "object-storage");

const createObjectId = () =>
  `object-${Date.now()}-${Math.round(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;

const normalizeFileName = (value: string) => {
  const trimmedValue = value.trim();
  const safeValue = Array.from(trimmedValue)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0;

      if (codePoint < 32 || "<>:\"/\\|?*".includes(character)) {
        return "-";
      }

      return character;
    })
    .join("")
    .replace(/-+/g, "-");
  return safeValue || "document.bin";
};

const buildChecksumSha256 = (contentBytes: Buffer) =>
  crypto.createHash("sha256").update(contentBytes).digest("hex");

const toDescriptor = (record: PrismaStoredObject): WashoffStoredObjectDescriptor => ({
  id: record.id,
  storageProvider: record.storageProvider,
  storageKey: record.storageKey,
  logicalBucket: record.logicalBucket,
  fileName: record.fileName,
  mimeType: record.mimeType,
  sizeBytes: record.sizeBytes,
  checksumSha256: record.checksumSha256,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  metadataJson: record.metadataJson ?? undefined,
});

const createSignaturePayload = ({
  objectId,
  fileName,
  disposition,
  purpose,
  expires,
}: {
  objectId: string;
  fileName: string;
  disposition: string;
  purpose: string;
  expires: string;
}) => [objectId, fileName, disposition, purpose, expires].join("\n");

const buildSignature = (secret: string, payload: string) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

const timingSafeEqualString = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const createSignedDownloadPathFactory = ({
  signingSecret,
  signedUrlTtlSeconds,
  downloadBasePath = DEFAULT_DOWNLOAD_BASE_PATH,
}: {
  signingSecret: string;
  signedUrlTtlSeconds: number;
  downloadBasePath?: string;
}) => {
  const createSignedDownloadPath: WashoffObjectStorage["createSignedDownloadPath"] = ({
    objectId,
    fileName = "document.bin",
    disposition = "attachment",
    purpose = "download",
    ttlSeconds,
  }) => {
    const expires = String(Date.now() + 1000 * Math.max(ttlSeconds ?? signedUrlTtlSeconds, 30));
    const normalizedFileName = normalizeFileName(fileName);
    const payload = createSignaturePayload({
      objectId,
      fileName: normalizedFileName,
      disposition,
      purpose,
      expires,
    });
    const signature = buildSignature(signingSecret, payload);
    const searchParams = new URLSearchParams({
      expires,
      signature,
      fileName: normalizedFileName,
      disposition,
      purpose,
    });

    return `${downloadBasePath}/${encodeURIComponent(objectId)}?${searchParams.toString()}`;
  };

  const verifySignedDownload: WashoffObjectStorage["verifySignedDownload"] = ({
    objectId,
    fileName,
    disposition,
    purpose,
    expires,
    signature,
  }) => {
    if (!expires || !signature) {
      return false;
    }

    const expiryTime = Number(expires);

    if (!Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
      return false;
    }

    const normalizedFileName = normalizeFileName(fileName ?? "document.bin");
    const normalizedDisposition =
      disposition === "inline" || disposition === "attachment" ? disposition : "attachment";
    const normalizedPurpose = (purpose?.trim() || "download").slice(0, 120);
    const expectedSignature = buildSignature(
      signingSecret,
      createSignaturePayload({
        objectId,
        fileName: normalizedFileName,
        disposition: normalizedDisposition,
        purpose: normalizedPurpose,
        expires,
      }),
    );

    return timingSafeEqualString(signature, expectedSignature);
  };

  return {
    createSignedDownloadPath,
    verifySignedDownload,
  };
};

export const createDatabaseWashoffObjectStorage = ({
  prisma,
  signingSecret,
  signedUrlTtlSeconds,
  downloadBasePath,
}: {
  prisma: PrismaClient;
  signingSecret: string;
  signedUrlTtlSeconds: number;
  downloadBasePath?: string;
}): WashoffObjectStorage => {
  const signedDownload = createSignedDownloadPathFactory({
    signingSecret,
    signedUrlTtlSeconds,
    downloadBasePath,
  });

  const writeWithExecutor = async (
    executor: PrismaExecutor,
    input: WashoffStoredObjectWriteInput,
  ): Promise<WashoffStoredObjectDescriptor> => {
    const timestamp = new Date(input.createdAt ?? new Date().toISOString());
    const objectId = input.objectId ?? createObjectId();
    const normalizedFileName = normalizeFileName(input.fileName);
    const storageKey =
      input.storageKey ??
      `${input.logicalBucket}/${objectId}/${normalizedFileName}`.replace(/\\/g, "/");
    const contentBytes = Buffer.isBuffer(input.contentBytes)
      ? input.contentBytes
      : Buffer.from(input.contentBytes);
    const checksumSha256 = buildChecksumSha256(contentBytes);
    const existingObject = await executor.storedObject.findUnique({
      where: { id: objectId },
    });

    const record = existingObject
      ? await executor.storedObject.update({
          where: { id: objectId },
          data: {
            storageProvider: "database",
            storageKey,
            logicalBucket: input.logicalBucket,
            fileName: normalizedFileName,
            mimeType: input.mimeType,
            sizeBytes: contentBytes.byteLength,
            checksumSha256,
            contentBytes,
            metadataJson: input.metadataJson ?? Prisma.JsonNull,
            updatedAt: timestamp,
          },
        })
      : await executor.storedObject.create({
          data: {
            id: objectId,
            storageProvider: "database",
            storageKey,
            logicalBucket: input.logicalBucket,
            fileName: normalizedFileName,
            mimeType: input.mimeType,
            sizeBytes: contentBytes.byteLength,
            checksumSha256,
            contentBytes,
            metadataJson: input.metadataJson ?? Prisma.JsonNull,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });

    return toDescriptor(record);
  };

  return {
    mode: "database",
    storeObject: (input) => writeWithExecutor(prisma, input),
    storeObjectTx: (tx, input) => writeWithExecutor(tx, input),
    async readObject(objectId) {
      const record = await prisma.storedObject.findUnique({
        where: { id: objectId },
      });

      if (!record) {
        return null;
      }

      return {
        object: toDescriptor(record),
        contentBytes: Buffer.from(record.contentBytes),
      };
    },
    createSignedDownloadPath: signedDownload.createSignedDownloadPath,
    verifySignedDownload: signedDownload.verifySignedDownload,
  };
};

export const createFilesystemWashoffObjectStorage = ({
  rootPath = DEFAULT_FILESYSTEM_ROOT,
  signingSecret,
  signedUrlTtlSeconds,
  downloadBasePath,
}: {
  rootPath?: string;
  signingSecret: string;
  signedUrlTtlSeconds: number;
  downloadBasePath?: string;
}): WashoffObjectStorage => {
  const signedDownload = createSignedDownloadPathFactory({
    signingSecret,
    signedUrlTtlSeconds,
    downloadBasePath,
  });
  const indexRoot = path.resolve(rootPath, "_index");

  const resolveContentPath = (logicalBucket: string, objectId: string) =>
    path.resolve(rootPath, logicalBucket, objectId, "content.bin");
  const resolveIndexPath = (objectId: string) => path.resolve(indexRoot, `${objectId}.json`);

  const writeObject = async (
    input: WashoffStoredObjectWriteInput,
  ): Promise<WashoffStoredObjectDescriptor> => {
    const timestamp = new Date(input.createdAt ?? new Date().toISOString());
    const objectId = input.objectId ?? createObjectId();
    const normalizedFileName = normalizeFileName(input.fileName);
    const storageKey =
      input.storageKey ??
      `${input.logicalBucket}/${objectId}/${normalizedFileName}`.replace(/\\/g, "/");
    const contentBytes = Buffer.isBuffer(input.contentBytes)
      ? input.contentBytes
      : Buffer.from(input.contentBytes);
    const descriptor: WashoffStoredObjectDescriptor = {
      id: objectId,
      storageProvider: "filesystem",
      storageKey,
      logicalBucket: input.logicalBucket,
      fileName: normalizedFileName,
      mimeType: input.mimeType,
      sizeBytes: contentBytes.byteLength,
      checksumSha256: buildChecksumSha256(contentBytes),
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
      metadataJson: (input.metadataJson as Prisma.JsonValue | undefined) ?? undefined,
    };
    const contentPath = resolveContentPath(input.logicalBucket, objectId);
    const indexPath = resolveIndexPath(objectId);

    await fs.mkdir(path.dirname(contentPath), { recursive: true });
    await fs.mkdir(path.dirname(indexPath), { recursive: true });
    await fs.writeFile(contentPath, contentBytes);
    await fs.writeFile(`${contentPath}.sha256`, `${descriptor.checksumSha256}\n`, "utf8");
    await fs.writeFile(`${contentPath}.meta.json`, `${JSON.stringify(descriptor, null, 2)}\n`, "utf8");
    await fs.writeFile(indexPath, `${JSON.stringify({ ...descriptor, contentPath }, null, 2)}\n`, "utf8");

    return descriptor;
  };

  return {
    mode: "filesystem",
    storeObject: writeObject,
    storeObjectTx: async (_tx, input) => writeObject(input),
    async readObject(objectId) {
      try {
        const indexEntry = JSON.parse(
          await fs.readFile(resolveIndexPath(objectId), "utf8"),
        ) as WashoffStoredObjectDescriptor & { contentPath: string };
        const contentBytes = await fs.readFile(indexEntry.contentPath);

        return {
          object: {
            ...indexEntry,
          },
          contentBytes,
        };
      } catch {
        return null;
      }
    },
    createSignedDownloadPath: signedDownload.createSignedDownloadPath,
    verifySignedDownload: signedDownload.verifySignedDownload,
  };
};
