import { Hono } from "hono";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { extractInvoiceFromImage } from "../services/ocr";
import { generateInvoiceReportPdf } from "../services/pdf-export";
import {
  isAllowedMimeType,
  getUploadsDir,
  generateStoredFileName,
  pdfToImageBase64,
} from "../lib/file-utils";
import path from "path";
import fs from "fs/promises";

export const invoicesRoutes = new Hono();
const UPLOADS_DIR = getUploadsDir();

invoicesRoutes.get("/", async (c) => {
  const list = await db.query.invoices.findMany({
    orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
  });
  return c.json(list);
});

invoicesRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid ID" }, 400);
  }
  const invoice = await db.query.invoices.findFirst({
    where: eq(schema.invoices.id, id),
  });
  if (!invoice) {
    return c.json({ error: "Invoice not found" }, 404);
  }
  const items = await db.query.invoiceItems.findMany({
    where: eq(schema.invoiceItems.invoiceId, id),
  });
  return c.json({ ...invoice, items });
});

invoicesRoutes.get("/:id/pdf", async (c) => {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid ID" }, 400);
  }
  const invoice = await db.query.invoices.findFirst({
    where: eq(schema.invoices.id, id),
  });
  if (!invoice) {
    return c.json({ error: "Invoice not found" }, 404);
  }
  const items = await db.query.invoiceItems.findMany({
    where: eq(schema.invoiceItems.invoiceId, id),
  });
  const pdfBuffer = await generateInvoiceReportPdf({ ...invoice, items });
  const fileName = `factura-${invoice.id}-${invoice.fileName}.pdf`;
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
});

invoicesRoutes.post("/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"] ?? body["invoice"];
    if (!file || typeof file === "string") {
      return c.json(
        { error: "No se puede procesar. Debe enviar un archivo (PNG, JPG o PDF)." },
        400
      );
    }

    const mimeType = file.type;
    if (!isAllowedMimeType(mimeType)) {
      return c.json(
        {
          error:
            "No se puede procesar. Solo se aceptan imágenes PNG, JPG o archivos PDF.",
        },
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name ?? "document";
    const storedFileName = generateStoredFileName(originalName);
    const filePath = path.join(UPLOADS_DIR, storedFileName);

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(filePath, buffer);

    let imageBase64: string;
    let mimeForOcr = mimeType;

    if (mimeType === "application/pdf") {
      imageBase64 = await pdfToImageBase64(buffer);
      mimeForOcr = "image/png";
    } else {
      imageBase64 = buffer.toString("base64");
    }

    const extraction = await extractInvoiceFromImage(imageBase64, mimeForOcr);

    const [inserted] = await db
      .insert(schema.invoices)
      .values({
        fileName: originalName,
        filePath: storedFileName,
        fileType: mimeType,
        producerNit: extraction.producer.nit,
        producerName: extraction.producer.name,
        consumerNit: extraction.consumer.nit,
        consumerName: extraction.consumer.name,
        subtotal: extraction.subtotal,
        taxes: extraction.taxes,
        total: extraction.total,
        date: extraction.date,
      })
      .returning();

    if (extraction.items.length > 0) {
      await db.insert(schema.invoiceItems).values(
        extraction.items.map((item) => ({
          invoiceId: inserted.id,
          quantity: item.quantity,
          description: item.description,
          price: item.price,
          subtotal: item.subtotal,
        }))
      );
    }

    const items = await db.query.invoiceItems.findMany({
      where: eq(schema.invoiceItems.invoiceId, inserted.id),
    });

    return c.json({ ...inserted, items }, 201);
  } catch (err) {
    console.error("Upload error:", err);
    return c.json(
      { error: "Error al procesar la factura. Por favor intente de nuevo." },
      500
    );
  }
});

