import Link from "next/link";

interface Invoice {
  id: number;
  fileName: string;
  producerName: string | null;
  consumerName: string | null;
  total: number | null;
  date: string | null;
  createdAt: string | null;
}

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        No hay facturas procesadas aún.{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Sube la primera
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Archivo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Proveedor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Fecha
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                {inv.fileName}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {inv.producerName ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {inv.consumerName ?? "—"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                {inv.total != null
                  ? new Intl.NumberFormat("es-GT", {
                      style: "currency",
                      currency: "GTQ",
                    }).format(inv.total)
                  : "—"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                {inv.date ?? inv.createdAt ?? "—"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
