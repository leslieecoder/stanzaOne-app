"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import SuccessMessage from "@/components/shared/SuccessMessage";

export default function AddUnitPage() {
  const params = useParams();
  const router = useRouter();
  const complexId = params.id as string;

  const [complexName, setComplexName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [rent, setRent] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplex = async () => {
      const complexDoc = await getDoc(doc(db, "complexes", complexId));
      if (complexDoc.exists()) {
        setComplexName(complexDoc.data().name);
      }
    };
    fetchComplex();
  }, [complexId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "units"), {
        unitNumber,
        complexId,
        rent: Number(rent),
        status: "vacant",
        tenantId: null,
        createdAt: new Date(),
      });

      setSuccessMessage("¡Unidad agregada exitosamente!");
      // Navigate back after showing success message
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error("Error adding unit:", error);
      alert("Error al agregar unidad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <button onClick={() => router.push("/admin")} className="text-blue-600 hover:underline">
          Inicio
        </button>
        <span className="mx-2 text-gray-400">›</span>
        <button onClick={() => router.push(`/admin/complex/${complexId}`)} className="text-blue-600 hover:underline">
          {complexName}
        </button>
        <span className="mx-2 text-gray-400">›</span>
        <span className="text-gray-700">Agregar Unidad</span>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold mb-2">Agregar Nueva Unidad</h1>
      <p className="text-gray-600 mb-6">Complejo: {complexName}</p>

        {successMessage && (
          <SuccessMessage
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Número de Unidad</label>
            <input
              type="text"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 101, 2A, Pent house"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Renta Mensual (MXN)</label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 10000"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/complex/${complexId}`)}
              className="flex-1 bg-(--color-neutral-light) text-(--color-neutral-dark) py-3 px-6 rounded-md hover:bg-gray-300 font-medium border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? "Agregando..." : "Agregar Unidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
