import { FileUpload } from "@/components/FileUpload";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Digitalización de Facturas
        </h1>
        <p className="mt-2 text-slate-600">
          Sube una imagen (PNG, JPG) o PDF de tu factura para extraer
          automáticamente los datos.
        </p>
      </div>
      <FileUpload />
    </div>
  );
}
