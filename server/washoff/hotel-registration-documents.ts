import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES,
  HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES,
  HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES,
  buildHotelDocumentDownloadPath,
  type HotelRegistrationDocumentKind,
  type HotelRegistrationDocumentUploadInput,
  type HotelRegistrationStoredDocumentReference,
} from "../../src/features/orders/model/hotel.ts";
import type { WashoffEnvironment } from "./environment.ts";

const DOCUMENT_KIND_FILE_PREFIX: Record<HotelRegistrationDocumentKind, string> = {
  commercial_registration: "commercial-registration",
  delegation_letter: "delegation-letter",
};

const DOCUMENT_KIND_LABELS_AR: Record<HotelRegistrationDocumentKind, string> = {
  commercial_registration: "السجل التجاري",
  delegation_letter: "خطاب التفويض",
};

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

const decodeUploadedDocumentBuffer = (file: HotelRegistrationDocumentUploadInput) => {
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

const resolveFileExtension = (mimeType: typeof HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES[number]) => {
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

const assertAllowedMimeType = (
  detectedMimeType: string | undefined,
  kind: HotelRegistrationDocumentKind,
) => {
  if (!detectedMimeType || !HOTEL_REGISTRATION_ALLOWED_DOCUMENT_MIME_TYPES.includes(detectedMimeType as never)) {
    throw new Error(
      `صيغة ملف ${DOCUMENT_KIND_LABELS_AR[kind]} غير مدعومة. الصيغ المسموحة: PDF, JPG, PNG.`,
    );
  }
};

const assertUploadedDocumentSize = (
  sizeBytes: number,
  kind: HotelRegistrationDocumentKind,
) => {
  if (sizeBytes > HOTEL_REGISTRATION_MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(`الحد الأقصى لحجم ملف ${DOCUMENT_KIND_LABELS_AR[kind]} هو 5 ميجابايت.`);
  }
};

export const assertHotelRegistrationDocumentsTotalSize = (files: Array<{ sizeBytes: number }>) => {
  const totalSizeBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);

  if (totalSizeBytes > HOTEL_REGISTRATION_MAX_TOTAL_DOCUMENTS_SIZE_BYTES) {
    throw new Error("الحد الأقصى لإجمالي مرفقات التسجيل هو 10 ميجابايت.");
  }
};

export const validateHotelRegistrationDocumentUpload = ({
  file,
  kind,
}: {
  file: HotelRegistrationDocumentUploadInput;
  kind: HotelRegistrationDocumentKind;
}) => {
  const buffer = decodeUploadedDocumentBuffer(file);
  const actualSizeBytes = buffer.byteLength;
  const detectedMimeType = detectSupportedMimeType(buffer);

  if (!Number.isFinite(file.sizeBytes) || file.sizeBytes <= 0) {
    throw new Error(`يرجى إرفاق ملف صالح لحقل ${DOCUMENT_KIND_LABELS_AR[kind]}.`);
  }

  if (actualSizeBytes !== file.sizeBytes) {
    throw new Error(`تعذر التحقق من حجم ملف ${DOCUMENT_KIND_LABELS_AR[kind]}. أعد رفع الملف مرة أخرى.`);
  }

  assertUploadedDocumentSize(actualSizeBytes, kind);
  assertAllowedMimeType(detectedMimeType, kind);

  if (file.mimeType !== detectedMimeType) {
    throw new Error(
      `نوع ملف ${DOCUMENT_KIND_LABELS_AR[kind]} غير متوافق مع محتواه الفعلي. أعد رفع الملف بصيغة صحيحة.`,
    );
  }

  return {
    buffer,
    mimeType: detectedMimeType,
    sizeBytes: actualSizeBytes,
  };
};

const resolveDocumentStorageRoot = (environment: WashoffEnvironment, cwd = process.cwd()) => {
  return path.resolve(cwd, DOCUMENT_STORAGE_DIRECTORY_BY_ENVIRONMENT[environment]);
};

export const storeHotelRegistrationDocument = async ({
  hotelId,
  kind,
  file,
  uploadedAt,
  environment,
}: {
  hotelId: string;
  kind: HotelRegistrationDocumentKind;
  file: HotelRegistrationDocumentUploadInput;
  uploadedAt: string;
  environment: WashoffEnvironment;
}): Promise<HotelRegistrationStoredDocumentReference> => {
  const validatedFile = validateHotelRegistrationDocumentUpload({ file, kind });
  const fileExtension = resolveFileExtension(validatedFile.mimeType);
  const fileNamePrefix = DOCUMENT_KIND_FILE_PREFIX[kind];
  const timestampToken = uploadedAt.replace(/[:.]/g, "-");
  const relativeStorageKey = path
    .join(
      DOCUMENT_STORAGE_DIRECTORY_BY_ENVIRONMENT[environment],
      "hotels",
      hotelId,
      `${fileNamePrefix}-${timestampToken}${fileExtension}`,
    )
    .replace(/\\/g, "/");
  const absoluteStoragePath = path.resolve(process.cwd(), relativeStorageKey);

  await mkdir(path.dirname(absoluteStoragePath), { recursive: true });
  await writeFile(absoluteStoragePath, validatedFile.buffer);

  return {
    kind,
    fileName: file.fileName.trim(),
    mimeType: validatedFile.mimeType,
    sizeBytes: validatedFile.sizeBytes,
    uploadedAt,
    storageKey: relativeStorageKey,
    downloadPath: buildHotelDocumentDownloadPath(hotelId, kind),
  };
};

export const resolveHotelRegistrationDocumentAbsolutePath = (storageKey: string, cwd = process.cwd()) => {
  return path.resolve(cwd, storageKey);
};

export const readStoredHotelRegistrationDocument = async (storageKey: string) => {
  return readFile(resolveHotelRegistrationDocumentAbsolutePath(storageKey));
};

export const getHotelRegistrationDocumentStorageRoot = (
  environment: WashoffEnvironment,
  cwd = process.cwd(),
) => {
  return resolveDocumentStorageRoot(environment, cwd);
};
