import { Hono } from "hono";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { invoiceUpdateSchema, type InvoiceItem } from "@invoice-processor/shared";
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

invoicesRoutes.put("/:id", async (c) => {
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
  if (invoice.status === "APROBADA") {
    return c.json(
      { error: "No se puede editar una factura ya aprobada." },
      403
    );
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const parsed = invoiceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const updateValues: Record<string, unknown> = {};
  if (data.producerNit !== undefined) updateValues.producerNit = data.producerNit;
  if (data.producerName !== undefined) updateValues.producerName = data.producerName;
  if (data.consumerNit !== undefined) updateValues.consumerNit = data.consumerNit;
  if (data.consumerName !== undefined) updateValues.consumerName = data.consumerName;
  if (data.subtotal !== undefined) updateValues.subtotal = data.subtotal;
  if (data.taxes !== undefined) updateValues.taxes = data.taxes;
  if (data.total !== undefined) updateValues.total = data.total;
  if (data.date !== undefined) updateValues.date = data.date;
  if (data.status !== undefined) updateValues.status = data.status;

  if (Object.keys(updateValues).length > 0) {
    await db
      .update(schema.invoices)
      .set(updateValues as Record<string, string | number | null>)
      .where(eq(schema.invoices.id, id));
  }

  if (data.items !== undefined) {
    await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id));
    if (data.items.length > 0) {
      await db.insert(schema.invoiceItems).values(
        data.items.map((item: InvoiceItem) => ({
          invoiceId: id,
          quantity: item.quantity,
          description: item.description,
          price: item.price,
          subtotal: item.subtotal,
        }))
      );
    }
  }

  const updated = await db.query.invoices.findFirst({
    where: eq(schema.invoices.id, id),
  });
  const items = await db.query.invoiceItems.findMany({
    where: eq(schema.invoiceItems.invoiceId, id),
  });
  return c.json({ ...updated, items });
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
        status: "POR_REVISAR",
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

