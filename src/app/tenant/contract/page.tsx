"use client";

import { useRouter } from "next/navigation";
import ContractViewer from "@/components/tenant/ContractViewer";

export default function ContractPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/tenant')}
          className="text-blue-600 hover:underline mb-6 text-sm"
        >
          ← Volver al Inicio
        </button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mi Contrato de Arrendamiento</h1>
          <p className="text-gray-600">Revise y firme su contrato</p>
        </div>

        {/* Contract Viewer */}
        <ContractViewer />
      </div>
    </div>
  );
}
