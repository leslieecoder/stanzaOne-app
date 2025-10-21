"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import SuccessMessage from "@/components/shared/SuccessMessage";

export default function NewComplexPage() {
const router = useRouter();
const [name, setName] = useState("");
const [address, setAddress] = useState("");
const [contractTerms, setContractTerms] = useState("");
const [leaseDuration, setLeaseDuration] = useState("12");
const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "complexes"), {
        name,
        address,
        contractTerms: contractTerms || "Términos estándar de arrendamiento",
        leaseDuration: Number(leaseDuration),
        createdAt: new Date(),
      });

      setSuccessMessage("¡Complejo creado exitosamente!");
      // Navigate back after showing success message
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error("Error creating complex:", error);
      alert("Error al crear complejo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin")}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Volver a Inicio
        </button>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Complejo</h1>

        {successMessage && (
          <SuccessMessage
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Complejo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Torre Vista, Residencial Sol"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dirección</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Calle Principal 123, Colonia Centro"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Duración del Contrato
            </label>
            <select
              value={leaseDuration}
              onChange={(e) => setLeaseDuration(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="6">6 meses</option>
              <option value="12">12 meses (1 año)</option>
              <option value="24">24 meses (2 años)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Términos del Contrato (opcional)
            </label>
            <textarea
              value={contractTerms}
              onChange={(e) => setContractTerms(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Ingrese términos específicos del contrato para este complejo..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Estos términos se aplicarán a todos los contratos de este complejo
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="flex-1 bg-(--color-neutral-light) text-(--color-neutral-dark) py-3 px-6 rounded-md hover:bg-gray-300 font-medium border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? "Creando..." : "Crear Complejo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
