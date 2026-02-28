import { z } from "zod";

export const invoiceStatusSchema = z.enum(["POR_REVISAR", "APROBADA"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const producerSchema = z.object({
  nit: z.string().nullable(),
  name: z.string().nullable(),
});

export const consumerSchema = z.object({
  nit: z.string().nullable(),
  name: z.string().nullable(),
});

export const invoiceItemSchema = z.object({
  quantity: z.number(),
  description: z.string(),
  price: z.number(),
  subtotal: z.number(),
});

export const invoiceExtractionSchema = z.object({
  producer: producerSchema,
  consumer: consumerSchema,
  items: z.array(invoiceItemSchema),
  subtotal: z.number(),
  taxes: z.number(),
  total: z.number(),
  date: z.string().nullable(),
});

export const invoiceUpdateSchema = z.object({
  producerNit: z.string().nullable().optional(),
  producerName: z.string().nullable().optional(),
  consumerNit: z.string().nullable().optional(),
  consumerName: z.string().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  taxes: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  date: z.string().nullable().optional(),
  status: invoiceStatusSchema.optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export type Producer = z.infer<typeof producerSchema>;
export type Consumer = z.infer<typeof consumerSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type InvoiceExtraction = z.infer<typeof invoiceExtractionSchema>;
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>;
