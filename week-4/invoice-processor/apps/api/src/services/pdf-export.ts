import PDFDocument from "pdfkit";
import type { Invoice } from "../db/schema";
import type { InvoiceItem } from "../db/schema";

interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export async function generateInvoiceReportPdf(invoice: InvoiceWithItems): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Reporte de Factura", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Proveedor (Emisor): ${invoice.producerName ?? "N/A"}`, { continued: false });
    doc.text(`NIT: ${invoice.producerNit ?? "N/A"}`);
    doc.moveDown();

    doc.text(`Cliente (Receptor): ${invoice.consumerName ?? "N/A"}`, { continued: false });
    doc.text(`NIT: ${invoice.consumerNit ?? "N/A"}`);
    doc.moveDown();

    if (invoice.date) {
      doc.text(`Fecha de emisión: ${invoice.date}`);
      doc.moveDown();
    }

    doc.fontSize(14).text("Items", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text("Cant.", 50, tableTop, { width: 40 });
    doc.text("Descripción", 100, tableTop, { width: 200 });
    doc.text("Precio", 310, tableTop, { width: 60 });
    doc.text("Subtotal", 380, tableTop, { width: 80 });
    doc.moveDown();

    let y = doc.y;
    for (const item of invoice.items) {
      doc.text(String(item.quantity), 50, y, { width: 40 });
      doc.text(item.description, 100, y, { width: 200 });
      doc.text(formatCurrency(item.price), 310, y, { width: 60 });
      doc.text(formatCurrency(item.subtotal), 380, y, { width: 80 });
      y += 20;
    }
    doc.y = y + 10;

    doc.moveDown();
    doc.text(`Subtotal: ${formatCurrency(invoice.subtotal ?? 0)}`, { align: "right" });
    doc.text(`IVA (12%): ${formatCurrency(invoice.taxes ?? 0)}`, { align: "right" });
    doc.fontSize(12).text(`Total: ${formatCurrency(invoice.total ?? 0)}`, { align: "right" });

    doc.end();
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(value);
}
