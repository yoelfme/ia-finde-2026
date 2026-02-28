"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  status?: string;
  items: InvoiceItem[];
}

type EditableItem = Omit<InvoiceItem, "id">;

function toEditable(item: InvoiceItem): EditableItem {
  return {
    quantity: item.quantity,
    description: item.description,
    price: item.price,
    subtotal: item.subtotal,
  };
}

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [producerNit, setProducerNit] = useState(invoice.producerNit ?? "");
  const [producerName, setProducerName] = useState(invoice.producerName ?? "");
  const [consumerNit, setConsumerNit] = useState(invoice.consumerNit ?? "");
  const [consumerName, setConsumerName] = useState(invoice.consumerName ?? "");
  const [date, setDate] = useState(invoice.date ?? "");
  const [subtotal, setSubtotal] = useState(String(invoice.subtotal ?? 0));
  const [taxes, setTaxes] = useState(String(invoice.taxes ?? 0));
  const [total, setTotal] = useState(String(invoice.total ?? 0));
  const [items, setItems] = useState<EditableItem[]>(
    invoice.items.map(toEditable)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const status = invoice.status ?? "POR_REVISAR";
  const isEditable = status === "POR_REVISAR";

  useEffect(() => {
    setProducerNit(invoice.producerNit ?? "");
    setProducerName(invoice.producerName ?? "");
    setConsumerNit(invoice.consumerNit ?? "");
    setConsumerName(invoice.consumerName ?? "");
    setDate(invoice.date ?? "");
    setSubtotal(String(invoice.subtotal ?? 0));
    setTaxes(String(invoice.taxes ?? 0));
    setTotal(String(invoice.total ?? 0));
    setItems(invoice.items.map(toEditable));
  }, [invoice]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(v);

  const handleExportPdf = () => {
    window.open(`${API_URL}/invoices/${invoice.id}/pdf`, "_blank");
  };

  const originalFileUrl = `${API_URL}/uploads/${invoice.filePath}`;

  const updateItem = (index: number, field: keyof EditableItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "quantity" || field === "price") {
        const q = field === "quantity" ? Number(value) : next[index].quantity;
        const p = field === "price" ? Number(value) : next[index].price;
        next[index].subtotal = q * p;
      }
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { quantity: 1, description: "", price: 0, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPayload = () => ({
    producerNit: producerNit || null,
    producerName: producerName || null,
    consumerNit: consumerNit || null,
    consumerName: consumerName || null,
    subtotal: parseFloat(subtotal) || null,
    taxes: parseFloat(taxes) || null,
    total: parseFloat(total) || null,
    date: date || null,
    items: items.map((i) => ({
      quantity: i.quantity,
      description: i.description,
      price: i.price,
      subtotal: i.subtotal,
    })),
  });

  const handleSave = async (newStatus: "POR_REVISAR" | "APROBADA") => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...buildPayload(), status: newStatus };
      const res = await fetch(`${API_URL}/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al guardar");
      }
      setShowConfirmDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmClick = () => {
    setShowConfirmDialog(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">
            Factura: {invoice.fileName}
          </h1>
          {status === "APROBADA" && (
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Aprobada
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
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
          {isEditable && (
            <>
              <button
                onClick={() => handleSave("POR_REVISAR")}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={handleConfirmClick}
                disabled={saving}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              ¿Confirmar factura?
            </h3>
            <p className="mt-2 text-slate-600">
              Una vez confirmada, la factura no podrá ser editada. ¿Deseas continuar?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave("APROBADA")}
                disabled={saving}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Sí, confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            Proveedor (Emisor)
          </h2>
          {isEditable ? (
            <>
              <input
                type="text"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                placeholder="Nombre"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={producerNit}
                onChange={(e) => setProducerNit(e.target.value)}
                placeholder="NIT"
                className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </>
          ) : (
            <>
              <p className="mt-1 font-medium text-slate-900">
                {invoice.producerName ?? "—"}
              </p>
              <p className="text-sm text-slate-600">
                NIT: {invoice.producerNit ?? "—"}
              </p>
            </>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            Cliente (Receptor)
          </h2>
          {isEditable ? (
            <>
              <input
                type="text"
                value={consumerName}
                onChange={(e) => setConsumerName(e.target.value)}
                placeholder="Nombre"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={consumerNit}
                onChange={(e) => setConsumerNit(e.target.value)}
                placeholder="NIT"
                className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </>
          ) : (
            <>
              <p className="mt-1 font-medium text-slate-900">
                {invoice.consumerName ?? "—"}
              </p>
              <p className="text-sm text-slate-600">
                NIT: {invoice.consumerNit ?? "—"}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase text-slate-500">
          Fecha de emisión
        </h2>
        {isEditable ? (
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <p className="mt-1 text-slate-900">{invoice.date ?? "—"}</p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
          <h2 className="text-sm font-semibold uppercase text-slate-600">
            Items
          </h2>
          {isEditable && (
            <button
              onClick={addItem}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              + Agregar item
            </button>
          )}
        </div>
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
              {isEditable && (
                <th className="px-6 py-2 text-right text-xs font-medium text-slate-500">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isEditable
              ? items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        className="w-full min-w-[120px] rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", parseFloat(e.target.value) || 0)
                        }
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              : invoice.items.map((item) => (
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
          {isEditable ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Subtotal:</span>
                <input
                  type="number"
                  step="0.01"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  className="w-32 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">IVA (12%):</span>
                <input
                  type="number"
                  step="0.01"
                  value={taxes}
                  onChange={(e) => setTaxes(e.target.value)}
                  className="w-32 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Total:</span>
                <input
                  type="number"
                  step="0.01"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-32 rounded border border-slate-300 px-2 py-1 text-right text-sm font-bold"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-600">
                Subtotal: {formatCurrency(invoice.subtotal ?? 0)}
              </p>
              <p className="text-slate-600">
                IVA (12%): {formatCurrency(invoice.taxes ?? 0)}
              </p>
              <p className="text-lg font-bold text-slate-900">
                Total: {formatCurrency(invoice.total ?? 0)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
