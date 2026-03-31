import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES,
  PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  buildProviderDocumentDownloadPath,
  type ProviderRegistrationDocumentUploadInput,
  type ProviderRegistrationStoredDocumentReference,
} from "../../src/features/orders/model/provider.ts";
import type { WashoffEnvironment } from "./environment.ts";

const DOCUMENT_STORAGE_DIRECTORY_BY_ENVIRONMENT: Record<WashoffEnvironment, string> = {
  dev: "data/onboarding-documents",
  qa: "data/onboarding-documents-qa",
  production: "data/onboarding-documents-production",
};

const normalizeBase64Payload = (value: string) => {
  const trimmedValue = value.trim();
  const separatorIndex = trimmedValue.indexOf(",");

  if (trimmedValue.startsWith("data:") && separatorIndex >= 0) {
    return trimmedValue.slice(separatorIndex + 1);
  }

  return trimmedValue;
};

const decodeUploadedDocumentBuffer = (file: ProviderRegistrationDocumentUploadInput) => {
  try {
    const normalizedBase64 = normalizeBase64Payload(file.contentBase64);
    return Buffer.from(normalizedBase64, "base64");
  } catch {
    throw new Error(`تعذر قراءة محتوى ملف ${file.fileName} بصيغة صحيحة.`);
  }
};

const detectSupportedMimeType = (buffer: Buffer) => {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf" as const;
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg" as const;
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png" as const;
  }

  return undefined;
};

const resolveFileExtension = (mimeType: typeof PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES[number]) => {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    default:
      return "";
  }
};

export const validateProviderRegistrationDocumentUpload = (
  file: ProviderRegistrationDocumentUploadInput,
) => {
  const buffer = decodeUploadedDocumentBuffer(file);
  const actualSizeBytes = buffer.byteLength;
  const detectedMimeType = detectSupportedMimeType(buffer);

  if (!Number.isFinite(file.sizeBytes) || file.sizeBytes <= 0) {
    throw new Error("يرجى إرفاق ملف صالح للسجل التجاري.");
  }

  if (actualSizeBytes !== file.sizeBytes) {
    throw new Error("تعذر التحقق من حجم ملف السجل التجاري. أعد رفع الملف مرة أخرى.");
  }

  if (actualSizeBytes > PROVIDER_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("الحد الأقصى لحجم ملف السجل التجاري هو 5 ميجابايت.");
  }

  if (
    !detectedMimeType ||
    !PROVIDER_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES.includes(detectedMimeType as never)
  ) {
    throw new Error("صيغة ملف السجل التجاري غير مدعومة. الصيغ المسموحة: PDF, JPG, PNG.");
  }

  if (file.mimeType !== detectedMimeType) {
    throw new Error("نوع ملف السجل التجاري غير متوافق مع محتواه الفعلي. أعد رفع الملف بصيغة صحيحة.");
  }

  return {
    buffer,
    mimeType: detectedMimeType,
    sizeBytes: actualSizeBytes,
  };
};

export const storeProviderRegistrationDocument = async ({
  providerId,
  file,
  uploadedAt,
  environment,
}: {
  providerId: string;
  file: ProviderRegistrationDocumentUploadInput;
  uploadedAt: string;
  environment: WashoffEnvironment;
}): Promise<ProviderRegistrationStoredDocumentReference> => {
  const validatedFile = validateProviderRegistrationDocumentUpload(file);
  const fileExtension = resolveFileExtension(validatedFile.mimeType);
  const timestampToken = uploadedAt.replace(/[:.]/g, "-");
  const relativeStorageKey = path
    .join(
      DOCUMENT_STORAGE_DIRECTORY_BY_ENVIRONMENT[environment],
      "providers",
      providerId,
      `commercial-registration-${timestampToken}${fileExtension}`,
    )
    .replace(/\\/g, "/");
  const absoluteStoragePath = path.resolve(process.cwd(), relativeStorageKey);

  await mkdir(path.dirname(absoluteStoragePath), { recursive: true });
  await writeFile(absoluteStoragePath, validatedFile.buffer);

  return {
    kind: "commercial_registration",
    fileName: file.fileName.trim(),
    mimeType: validatedFile.mimeType,
    sizeBytes: validatedFile.sizeBytes,
    uploadedAt,
    storageKey: relativeStorageKey,
    downloadPath: buildProviderDocumentDownloadPath(providerId),
  };
};

export const resolveProviderRegistrationDocumentAbsolutePath = (storageKey: string, cwd = process.cwd()) => {
  return path.resolve(cwd, storageKey);
};

export const readStoredProviderRegistrationDocument = async (storageKey: string) => {
  return readFile(resolveProviderRegistrationDocumentAbsolutePath(storageKey));
};
