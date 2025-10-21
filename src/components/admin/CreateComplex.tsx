"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export default function CreateComplex() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [leaseDuration, setLeaseDuration] = useState(12);
  const [contractTerms, setContractTerms] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "complexes"), {
        name,
        address,
        leaseDuration,
        contractTerms,
        createdAt: new Date(),
      });

      setName("");
      setAddress("");
      setLeaseDuration(12);
      setContractTerms("");
      alert("¡Complejo creado exitosamente!");
    } catch (error) {
      console.error("Error creating complex:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del Complejo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Dirección</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Duración del Contrato</label>
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
        <label className="block text-sm font-medium mb-1">Términos del Contrato (Opcional)</label>
        <textarea
          value={contractTerms}
          onChange={(e) => setContractTerms(e.target.value)}
          className="w-full px-3 py-2 border rounded-md min-h-[150px]"
          placeholder="Agregue términos específicos del contrato para este complejo..."
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Crear Complejo
      </button>
    </form>
  );
}
