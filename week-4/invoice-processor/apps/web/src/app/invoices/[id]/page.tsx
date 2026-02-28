import Link from "next/link";
import { InvoiceDetail } from "@/components/InvoiceDetail";

const API_URL = "http://localhost:3001";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(`${API_URL}/invoices/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700">
        Factura no encontrada.
        <Link href="/invoices" className="ml-2 underline">
          Volver a la lista
        </Link>
      </div>
    );
  }
  const invoice = await res.json();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="text-slate-600 hover:text-slate-900"
        >
          ← Volver a facturas
        </Link>
      </div>
      <InvoiceDetail invoice={invoice} />
    </div>
  );
}
