import { UploadFacturaForm } from "@/components/facturas/upload-form";

export default async function FacturasPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturas de compra</h1>
          <p className="text-sm text-slate-600">Sube facturas de compra para registrar precios y compararlas.</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#E9D7C2] bg-white p-6">
        <UploadFacturaForm />
      </div>
    </div>
  );
}
