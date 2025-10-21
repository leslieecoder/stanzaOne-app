"use client";

import { useRouter } from "next/navigation";
import PaymentHistory from "@/components/tenant/PaymentHistory";

export default function PaymentsPage() {
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
          <h1 className="text-3xl font-bold mb-2">Historial de Pagos</h1>
          <p className="text-gray-600">Todos sus pagos de renta</p>
        </div>

        {/* Payment History */}
        <PaymentHistory />
      </div>
    </div>
  );
}
