"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface Complex {
  id: string;
  name: string;
  address: string;
  contractTerms?: string;
  leaseDuration?: number;
}

export default function ContractTemplateEditor() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [selectedComplex, setSelectedComplex] = useState("");
  const [contractTerms, setContractTerms] = useState("");
  const [leaseDuration, setLeaseDuration] = useState(12);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComplexes = async () => {
      try {
        const complexesSnapshot = await getDocs(collection(db, "complexes"));
        const complexesData = complexesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          address: doc.data().address,
          contractTerms: doc.data().contractTerms || "",
          leaseDuration: doc.data().leaseDuration || 12,
        }));
        setComplexes(complexesData);
      } catch (error) {
        console.error("Error fetching complexes:", error);
      }
    };

    fetchComplexes();
  }, []);

  const handleComplexSelect = (complexId: string) => {
    setSelectedComplex(complexId);
    const complex = complexes.find((c) => c.id === complexId);
    if (complex) {
      setContractTerms(complex.contractTerms || "");
      setLeaseDuration(complex.leaseDuration || 12);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedComplex) {
      alert("Por favor seleccione un complejo");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, "complexes", selectedComplex), {
        contractTerms,
        leaseDuration,
      });

      alert("¡Plantilla de contrato actualizada exitosamente!");
      
      // Update local state
      setComplexes(complexes.map(c => 
        c.id === selectedComplex 
          ? { ...c, contractTerms, leaseDuration }
          : c
      ));
    } catch (error) {
      console.error("Error updating contract template:", error);
      alert("No se pudo actualizar la plantilla");
    } finally {
      setLoading(false);
    }
  };

  if (complexes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No se encontraron complejos.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Seleccionar Complejo
        </label>
        <select
          value={selectedComplex}
          onChange={(e) => handleComplexSelect(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="">Elija un complejo...</option>
          {complexes.map((complex) => (
            <option key={complex.id} value={complex.id}>
              {complex.name} - {complex.address}
            </option>
          ))}
        </select>
      </div>

      {selectedComplex && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Duración del Contrato
            </label>
            <select
              value={leaseDuration}
              onChange={(e) => setLeaseDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={24}>24 meses</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Términos del Contrato
            </label>
            <textarea
              value={contractTerms}
              onChange={(e) => setContractTerms(e.target.value)}
              className="w-full px-3 py-2 border rounded-md min-h-[300px]"
              placeholder="Ingrese los términos específicos del contrato para este complejo..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Estos términos se generarán automáticamente en los contratos de todos los inquilinos de este complejo.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading ? "Guardando..." : "Guardar Plantilla"}
          </button>
        </>
      )}
    </form>
  );
}
