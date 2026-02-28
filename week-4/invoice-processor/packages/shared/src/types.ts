import { z } from "zod";

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

export type Producer = z.infer<typeof producerSchema>;
export type Consumer = z.infer<typeof consumerSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type InvoiceExtraction = z.infer<typeof invoiceExtractionSchema>;
