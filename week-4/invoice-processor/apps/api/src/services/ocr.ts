import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { invoiceExtractionSchema, type InvoiceExtraction } from "@invoice-processor/shared";

const INVOICE_EXTRACTION_PROMPT = `Eres un experto en extraer datos de facturas. Analiza la imagen de la factura proporcionada y extrae la siguiente información en formato estructurado.

La factura puede estar en español (Guatemala o Latinoamérica). Extrae:
- producer (emisor/proveedor): NIT y nombre
- consumer (cliente/receptor): NIT y nombre  
- items: por cada línea, cantidad, descripción, precio unitario y subtotal
- subtotal, taxes (IVA 12% en Guatemala), total
- date: fecha de emisión en formato ISO (YYYY-MM-DD)

Si algún campo no es legible o no existe, usa null para strings o 0 para números según corresponda.`;

export async function extractInvoiceFromImage(
  imageBase64: string,
  mimeType: string
): Promise<InvoiceExtraction> {
  const model = new ChatOpenAI({
    model: "gpt-5-mini-2025-08-07",
    // temperature: 0,
  });

  const structuredModel = model.withStructuredOutput(invoiceExtractionSchema, {
    method: "function_calling",
    strict: true,
  });

  const imageUrl = `data:${mimeType};base64,${imageBase64}`;

  const messages = [
    new HumanMessage({
      content: [
        { type: "text", text: INVOICE_EXTRACTION_PROMPT },
        {
          type: "image_url",
          image_url: { url: imageUrl, detail: "high" as const },
        },
      ],
    }),
  ];

  const result = await structuredModel.invoke(messages);
  return result as InvoiceExtraction;
}
