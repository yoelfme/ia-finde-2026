import path from "path";
import { randomUUID } from "crypto";
import { PDFiumLibrary } from "@hyzyla/pdfium";
import sharp from "sharp";
import type { PDFiumPageRenderOptions } from "@hyzyla/pdfium";

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

export function getUploadsDir(): string {
  return path.join(process.cwd(), "..", "..", "uploads");
}

export function generateStoredFileName(originalName: string): string {
  const ext = path.extname(originalName) || "";
  return `${randomUUID()}${ext}`;
}

async function renderToPng(options: PDFiumPageRenderOptions): Promise<Uint8Array> {
  return sharp(options.data, {
    raw: {
      width: options.width,
      height: options.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Converts the first page of a PDF to a base64-encoded PNG image.
 * Used for OCR processing of PDF invoices.
 */
export async function pdfToImageBase64(pdfPathOrBuffer: string | Buffer): Promise<string> {
  const buffer = typeof pdfPathOrBuffer === "string"
    ? await import("fs/promises").then((fs) => fs.readFile(pdfPathOrBuffer))
    : pdfPathOrBuffer;

  const library = await PDFiumLibrary.init();
  try {
    const document = await library.loadDocument(buffer);
    const firstPage = document.getPage(0);
    if (!firstPage) {
      throw new Error("PDF has no pages");
    }

    const image = await firstPage.render({
      scale: 2,
      render: renderToPng,
    });

    document.destroy();
    return Buffer.from(image.data).toString("base64");
  } finally {
    library.destroy();
  }
}
