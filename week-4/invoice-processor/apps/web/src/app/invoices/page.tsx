import Link from "next/link";
import { InvoiceTable } from "@/components/InvoiceTable";

export default async function InvoicesPage() {
  const res = await fetch("http://localhost:3001/invoices", {
    cache: "no-store",
  });
  const invoices = res.ok ? await res.json() : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Facturas procesadas</h1>
        <p className="mt-1 text-slate-600">
          Lista de facturas digitalizadas con IA
        </p>
      </div>
      <InvoiceTable invoices={invoices} />
    </div>
  );
}
