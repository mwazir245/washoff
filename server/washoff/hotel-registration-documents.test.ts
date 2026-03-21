import { describe, expect, it } from "vitest";
import {
  assertHotelRegistrationDocumentsTotalSize,
  validateHotelRegistrationDocumentUpload,
} from "./hotel-registration-documents";

const buildPdfUpload = (sizeBytes = 5) => {
  const bytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x0a]);

  return {
    fileName: "commercial-registration.pdf",
    mimeType: "application/pdf",
    sizeBytes,
    contentBase64: bytes.toString("base64"),
  };
};

describe("hotel registration documents", () => {
  it("accepts supported PDF uploads", () => {
    const validated = validateHotelRegistrationDocumentUpload({
      kind: "commercial_registration",
      file: buildPdfUpload(),
    });

    expect(validated.mimeType).toBe("application/pdf");
    expect(validated.sizeBytes).toBe(5);
  });

  it("rejects unsupported file signatures and mime types", () => {
    expect(() =>
      validateHotelRegistrationDocumentUpload({
        kind: "commercial_registration",
        file: {
          fileName: "commercial-registration.txt",
          mimeType: "text/plain",
          sizeBytes: 4,
          contentBase64: Buffer.from("test").toString("base64"),
        },
      }),
    ).toThrow("الصيغ المسموحة");
  });

  it("rejects oversized files and total upload size overflow", () => {
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    oversizedBuffer[0] = 0x25;
    oversizedBuffer[1] = 0x50;
    oversizedBuffer[2] = 0x44;
    oversizedBuffer[3] = 0x46;

    expect(() =>
      validateHotelRegistrationDocumentUpload({
        kind: "commercial_registration",
        file: {
          fileName: "commercial-registration.pdf",
          mimeType: "application/pdf",
          sizeBytes: oversizedBuffer.byteLength,
          contentBase64: oversizedBuffer.toString("base64"),
        },
      }),
    ).toThrow("5 ميجابايت");

    expect(() =>
      assertHotelRegistrationDocumentsTotalSize([
        { sizeBytes: 6 * 1024 * 1024 },
        { sizeBytes: 5 * 1024 * 1024 },
      ]),
    ).toThrow("10 ميجابايت");
  });
});
