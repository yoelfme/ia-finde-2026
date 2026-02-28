"use client";

const API_URL = "http://localhost:3001";

interface InvoiceItem {
  id: number;
  quantity: number;
  description: string;
  price: number;
  subtotal: number;
}

interface Invoice {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  producerNit: string | null;
  producerName: string | null;
  consumerNit: string | null;
  consumerName: string | null;
  subtotal: number | null;
  taxes: number | null;
  total: number | null;
  date: string | null;
  items: InvoiceItem[];
}

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(v);

  const handleExportPdf = () => {
    window.open(`${API_URL}/invoices/${invoice.id}/pdf`, "_blank");
  };

  const originalFileUrl = `${API_URL}/uploads/${invoice.filePath}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Factura: {invoice.fileName}
        </h1>
        <div className="flex gap-3">
          <a
            href={originalFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Ver archivo original
          </a>
          <button
            onClick={handleExportPdf}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            Proveedor (Emisor)
          </h2>
          <p className="mt-1 font-medium text-slate-900">
            {invoice.producerName ?? "—"}
          </p>
          <p className="text-sm text-slate-600">
            NIT: {invoice.producerNit ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            Cliente (Receptor)
          </h2>
          <p className="mt-1 font-medium text-slate-900">
            {invoice.consumerName ?? "—"}
          </p>
          <p className="text-sm text-slate-600">
            NIT: {invoice.consumerNit ?? "—"}
          </p>
        </div>
      </div>

      {invoice.date && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            Fecha de emisión
          </h2>
          <p className="mt-1 text-slate-900">{invoice.date}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <h2 className="border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold uppercase text-slate-600">
          Items
        </h2>
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-slate-500">
                Cant.
              </th>
              <th className="px-6 py-2 text-left text-xs font-medium text-slate-500">
                Descripción
              </th>
              <th className="px-6 py-2 text-right text-xs font-medium text-slate-500">
                Precio
              </th>
              <th className="px-6 py-2 text-right text-xs font-medium text-slate-500">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-3 text-sm text-slate-900">
                  {item.quantity}
                </td>
                <td className="px-6 py-3 text-sm text-slate-900">
                  {item.description}
                </td>
                <td className="px-6 py-3 text-right text-sm text-slate-900">
                  {formatCurrency(item.price)}
                </td>
                <td className="px-6 py-3 text-right text-sm text-slate-900">
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col items-end gap-2">
          <p className="text-slate-600">
            Subtotal: {formatCurrency(invoice.subtotal ?? 0)}
          </p>
          <p className="text-slate-600">
            IVA (12%): {formatCurrency(invoice.taxes ?? 0)}
          </p>
          <p className="text-lg font-bold text-slate-900">
            Total: {formatCurrency(invoice.total ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
