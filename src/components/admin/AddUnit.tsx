"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface Complex {
  id: string;
  name: string;
  address: string;
}

export default function AddUnit() {
  const [unitNumber, setUnitNumber] = useState("");
  const [complexId, setComplexId] = useState("");
  const [rent, setRent] = useState("");
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all complexes when component loads
  useEffect(() => {
    const fetchComplexes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "complexes"));
        const complexesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          address: doc.data().address,
        }));
        setComplexes(complexesData);
      } catch (error) {
        console.error("Error fetching complexes:", error);
      }
    };

    fetchComplexes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "units"), {
        unitNumber,
        complexId,
        rent: Number(rent),
        tenantId: null,
        status: "vacant",
        createdAt: new Date(),
      });

      setUnitNumber("");
      setComplexId("");
      setRent("");
      alert("¡Unidad agregada exitosamente!");
    } catch (error) {
      console.error("Error adding unit:", error);
      alert("No se pudo agregar la unidad");
    } finally {
      setLoading(false);
    }
  };

  if (complexes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No se encontraron complejos. Por favor cree un complejo primero.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Seleccionar Complejo</label>
        <select
          value={complexId}
          onChange={(e) => setComplexId(e.target.value)}
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
      <div>
        <label className="block text-sm font-medium mb-1">Número de Unidad</label>
        <input
          type="text"
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="ej., 101, 2A, Apt 5"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Renta Mensual ($)</label>
        <input
          type="number"
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="ej., 1200"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Agregando..." : "Agregar Unidad"}
      </button>
    </form>
  );
}
