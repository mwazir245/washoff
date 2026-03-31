import fs from "node:fs";
import PDFDocument from "pdfkit";
import bidiFactory from "bidi-js";
import QRCode from "qrcode";
import arabicPersianReshaper from "arabic-persian-reshaper";
import type {
  HotelInvoice,
  ProviderSettlementStatement,
} from "../../src/features/orders/model/index.ts";

const { ArabicShaper } = arabicPersianReshaper as {
  ArabicShaper: {
    convertArabic: (value: string) => string;
  };
};

const bidi = bidiFactory();

const DEFAULT_PDF_FONT_CANDIDATES = [
  process.env.WASHOFF_PDF_FONT_PATH,
  "C:\\Windows\\Fonts\\tahoma.ttf",
  "C:\\Windows\\Fonts\\arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
].filter(Boolean) as string[];

const collectPdfBytes = (document: PDFKit.PDFDocument) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk));
    });
    document.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    document.on("error", reject);
  });

const resolvePdfFontPath = (configuredFontPath?: string) => {
  const candidates = configuredFontPath
    ? [configuredFontPath, ...DEFAULT_PDF_FONT_CANDIDATES]
    : DEFAULT_PDF_FONT_CANDIDATES;

  return candidates.find((candidate) => {
    try {
      return Boolean(candidate) && fs.existsSync(candidate);
    } catch {
      return false;
    }
  });
};

const toPdfRtlText = (value: string) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return normalizedValue;
  }

  const shapedValue = ArabicShaper.convertArabic(normalizedValue);
  const embedding = bidi.getEmbeddingLevels(shapedValue, "rtl");
  const characters = Array.from(shapedValue);

  bidi.getReorderSegments(shapedValue, embedding).forEach(([start, end]) => {
    const segment = characters.slice(start, end + 1).reverse();
    characters.splice(start, end - start + 1, ...segment);
  });

  return characters.join("");
};

const formatSar = (value: number) => `${value.toFixed(2)} ر.س`;

const drawKeyValue = (
  document: PDFKit.PDFDocument,
  keyAr: string,
  valueAr: string,
  y: number,
) => {
  document
    .fontSize(10)
    .fillColor("#64748b")
    .text(toPdfRtlText(keyAr), 50, y, {
      width: 120,
      align: "right",
    });
  document
    .fontSize(11)
    .fillColor("#0f172a")
    .text(toPdfRtlText(valueAr || "—"), 180, y, {
      width: 340,
      align: "right",
    });
};

const drawSectionTitle = (document: PDFKit.PDFDocument, titleAr: string, y: number) => {
  document
    .fontSize(14)
    .fillColor("#1d4ed8")
    .text(toPdfRtlText(titleAr), 50, y, {
      width: 480,
      align: "right",
    });
};

const drawDivider = (document: PDFKit.PDFDocument, y: number) => {
  document
    .moveTo(50, y)
    .lineTo(545, y)
    .lineWidth(1)
    .strokeColor("#dbeafe")
    .stroke();
};

const buildHotelInvoiceQrPayloadAr = (invoice: HotelInvoice) =>
  [
    `رقم الفاتورة: ${invoice.invoiceNumber}`,
    `اسم الجهة المصدرة: ${invoice.seller.legalNameAr ?? invoice.seller.displayNameAr}`,
    `الرقم الضريبي: ${invoice.seller.vatNumber ?? "غير متاح"}`,
    `الإجمالي شامل الضريبة: ${formatSar(invoice.totalIncVatSar)}`,
    `الضريبة: ${formatSar(invoice.vatAmountSar)}`,
  ].join("\n");

const buildProviderStatementQrPayloadAr = (statement: ProviderSettlementStatement) =>
  [
    `رقم الكشف: ${statement.statementNumber}`,
    `المزود: ${statement.provider.legalNameAr ?? statement.provider.displayNameAr}`,
    `الرقم الضريبي: ${statement.provider.vatNumber ?? "غير متاح"}`,
    `الإجمالي شامل الضريبة: ${formatSar(statement.totalIncVatSar)}`,
    `الضريبة: ${formatSar(statement.vatAmountSar)}`,
  ].join("\n");

const drawQrPlaceholder = async (
  document: PDFKit.PDFDocument,
  payloadAr: string,
  y: number,
) => {
  const qrDataUrl = await QRCode.toDataURL(payloadAr, {
    margin: 1,
    width: 120,
  });
  const base64Value = qrDataUrl.slice(qrDataUrl.indexOf(",") + 1);
  const imageBuffer = Buffer.from(base64Value, "base64");

  document.image(imageBuffer, 50, y, {
    fit: [90, 90],
  });
  document
    .fontSize(9)
    .fillColor("#64748b")
    .text(toPdfRtlText("رمز ضريبي تمهيدي للتحضير لتكامل ZATCA"), 160, y + 8, {
      width: 360,
      align: "right",
    })
    .fontSize(8)
    .text(toPdfRtlText(payloadAr), 160, y + 28, {
      width: 360,
      align: "right",
    });
};

const configureDocumentFont = (document: PDFKit.PDFDocument, configuredFontPath?: string) => {
  const fontPath = resolvePdfFontPath(configuredFontPath);

  if (fontPath) {
    document.registerFont("washoff-ar", fontPath);
    document.font("washoff-ar");
  }

  return fontPath;
};

export const generateHotelInvoicePdf = async ({
  invoice,
  pdfFontPath,
}: {
  invoice: HotelInvoice;
  pdfFontPath?: string;
}) => {
  const document = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: invoice.invoiceNumber,
      Author: "WashOff",
      Subject: "Hotel Daily Invoice",
    },
  });
  const pdfBytesPromise = collectPdfBytes(document);
  configureDocumentFont(document, pdfFontPath);

  document
    .fillColor("#0f172a")
    .fontSize(20)
    .text(toPdfRtlText("فاتورة ضريبية يومية"), 50, 42, {
      width: 495,
      align: "right",
    })
    .fontSize(11)
    .fillColor("#64748b")
    .text(toPdfRtlText("WashOff - جاهزة للتكامل الضريبي"), 50, 70, {
      width: 495,
      align: "right",
    });

  drawSectionTitle(document, "بيانات الفاتورة", 110);
  drawKeyValue(document, "رقم الفاتورة", invoice.invoiceNumber, 138);
  drawKeyValue(document, "تاريخ الإصدار", invoice.issuedAt, 160);
  drawKeyValue(document, "عدد الطلبات", String(invoice.orderCount), 182);
  drawDivider(document, 208);

  drawSectionTitle(document, "الجهة المصدرة", 224);
  drawKeyValue(
    document,
    "الاسم القانوني",
    invoice.seller.legalNameAr ?? invoice.seller.displayNameAr,
    252,
  );
  drawKeyValue(document, "الرقم الضريبي", invoice.seller.vatNumber ?? "غير متاح", 274);
  drawKeyValue(document, "العنوان", invoice.seller.addressLineAr ?? "غير متاح", 296);
  drawDivider(document, 322);

  drawSectionTitle(document, "بيانات الفندق", 338);
  drawKeyValue(document, "اسم الفندق", invoice.buyer.displayNameAr, 366);
  drawKeyValue(document, "الاسم القانوني", invoice.buyer.legalNameAr ?? invoice.buyer.displayNameAr, 388);
  drawKeyValue(document, "الرقم الضريبي", invoice.buyer.vatNumber ?? "غير متاح", 410);
  drawDivider(document, 436);

  drawSectionTitle(document, "ملخص الفاتورة", 452);
  drawKeyValue(document, "الإجمالي قبل الضريبة", formatSar(invoice.subtotalExVatSar), 480);
  drawKeyValue(document, "قيمة الضريبة", formatSar(invoice.vatAmountSar), 502);
  drawKeyValue(document, "الإجمالي شامل الضريبة", formatSar(invoice.totalIncVatSar), 524);
  drawDivider(document, 550);

  let currentY = 568;
  drawSectionTitle(document, "الطلبات المدرجة", currentY);
  currentY += 28;
  invoice.lines.slice(0, 10).forEach((line) => {
    document
      .fontSize(10)
      .fillColor("#0f172a")
      .text(
        toPdfRtlText(
          `${line.orderId} | غرفة ${line.roomNumber ?? "—"} | ${formatSar(line.orderTotalIncVatSar)}`,
        ),
        50,
        currentY,
        {
          width: 495,
          align: "right",
        },
      );
    currentY += 18;
  });

  const qrPayloadAr = buildHotelInvoiceQrPayloadAr(invoice);
  await drawQrPlaceholder(document, qrPayloadAr, 705);

  document.end();

  return {
    bytes: await pdfBytesPromise,
    fileName: `${invoice.invoiceNumber}.pdf`,
    mimeType: "application/pdf",
    qrPayloadAr,
  };
};

export const generateProviderStatementPdf = async ({
  statement,
  pdfFontPath,
}: {
  statement: ProviderSettlementStatement;
  pdfFontPath?: string;
}) => {
  const document = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: statement.statementNumber,
      Author: "WashOff",
      Subject: "Provider Daily Statement",
    },
  });
  const pdfBytesPromise = collectPdfBytes(document);
  configureDocumentFont(document, pdfFontPath);

  document
    .fillColor("#0f172a")
    .fontSize(20)
    .text(toPdfRtlText("كشف مستحقات يومي"), 50, 42, {
      width: 495,
      align: "right",
    })
    .fontSize(11)
    .fillColor("#64748b")
    .text(toPdfRtlText("كشف ضريبي للمزود"), 50, 70, {
      width: 495,
      align: "right",
    });

  drawSectionTitle(document, "بيانات الكشف", 110);
  drawKeyValue(document, "رقم الكشف", statement.statementNumber, 138);
  drawKeyValue(document, "تاريخ الكشف", statement.statementDate, 160);
  drawKeyValue(document, "عدد الطلبات", String(statement.orderCount), 182);
  drawDivider(document, 208);

  drawSectionTitle(document, "بيانات المزود", 224);
  drawKeyValue(
    document,
    "الاسم القانوني",
    statement.provider.legalNameAr ?? statement.provider.displayNameAr,
    252,
  );
  drawKeyValue(document, "الرقم الضريبي", statement.provider.vatNumber ?? "غير متاح", 274);
  drawKeyValue(document, "العنوان", statement.provider.addressLineAr ?? "غير متاح", 296);
  drawDivider(document, 322);

  drawSectionTitle(document, "الملخص المالي", 338);
  drawKeyValue(document, "الإجمالي قبل الضريبة", formatSar(statement.subtotalExVatSar), 366);
  drawKeyValue(document, "قيمة الضريبة", formatSar(statement.vatAmountSar), 388);
  drawKeyValue(document, "الإجمالي شامل الضريبة", formatSar(statement.totalIncVatSar), 410);
  drawDivider(document, 436);

  let currentY = 452;
  drawSectionTitle(document, "الطلبات المدرجة", currentY);
  currentY += 28;
  statement.lines.slice(0, 12).forEach((line) => {
    document
      .fontSize(10)
      .fillColor("#0f172a")
      .text(
        toPdfRtlText(
          `${line.orderId} | غرفة ${line.roomNumber ?? "—"} | ${formatSar(line.providerTotalIncVatSar)}`,
        ),
        50,
        currentY,
        {
          width: 495,
          align: "right",
        },
      );
    currentY += 18;
  });

  const qrPayloadAr = buildProviderStatementQrPayloadAr(statement);
  await drawQrPlaceholder(document, qrPayloadAr, 705);

  document.end();

  return {
    bytes: await pdfBytesPromise,
    fileName: `${statement.statementNumber}.pdf`,
    mimeType: "application/pdf",
    qrPayloadAr,
  };
};
