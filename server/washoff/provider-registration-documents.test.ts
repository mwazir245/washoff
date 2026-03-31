import { describe, expect, it } from "vitest";
import { validateProviderRegistrationDocumentUpload } from "./provider-registration-documents";

const buildPdfUpload = (sizeBytes = 5) => {
  const bytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x0a]);

  return {
    fileName: "provider-commercial-registration.pdf",
    mimeType: "application/pdf",
    sizeBytes,
    contentBase64: bytes.toString("base64"),
  };
};

describe("provider registration documents", () => {
  it("accepts supported PDF uploads", () => {
    const validated = validateProviderRegistrationDocumentUpload(buildPdfUpload());

    expect(validated.mimeType).toBe("application/pdf");
    expect(validated.sizeBytes).toBe(5);
  });

  it("rejects unsupported signatures and mime types", () => {
    expect(() =>
      validateProviderRegistrationDocumentUpload({
        fileName: "provider-commercial-registration.txt",
        mimeType: "text/plain",
        sizeBytes: 4,
        contentBase64: Buffer.from("test").toString("base64"),
      }),
    ).toThrow("الصيغ المسموحة");
  });

  it("rejects oversized uploads", () => {
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    oversizedBuffer[0] = 0x25;
    oversizedBuffer[1] = 0x50;
    oversizedBuffer[2] = 0x44;
    oversizedBuffer[3] = 0x46;

    expect(() =>
      validateProviderRegistrationDocumentUpload({
        fileName: "provider-commercial-registration.pdf",
        mimeType: "application/pdf",
        sizeBytes: oversizedBuffer.byteLength,
        contentBase64: oversizedBuffer.toString("base64"),
      }),
    ).toThrow("5 ميجابايت");
  });
});
