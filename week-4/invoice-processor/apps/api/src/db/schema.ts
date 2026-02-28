import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  producerNit: text("producer_nit"),
  producerName: text("producer_name"),
  consumerNit: text("consumer_nit"),
  consumerName: text("consumer_name"),
  subtotal: real("subtotal"),
  taxes: real("taxes"),
  total: real("total"),
  date: text("date"),
  status: text("status").notNull().default("POR_REVISAR"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  subtotal: real("subtotal").notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
