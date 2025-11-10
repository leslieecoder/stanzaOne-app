"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";

interface MaintenanceRequestFormProps {
  unitId?: string;
  onSuccess?: (message: string) => void;
  onCancel?: () => void;
}

export default function MaintenanceRequestForm({ unitId, onSuccess, onCancel }: MaintenanceRequestFormProps) {
const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add document to Firestore "maintenance_requests" collection
      await addDoc(collection(db, "maintenance_requests"), {
      title,
      description,
      priority,
      status: "pending",
      tenantId: user?.uid,
      tenantEmail: user?.email,
      unitId: unitId,
        createdAt: new Date(),
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");

      // Call success callback
      if (onSuccess) {
        onSuccess("¡Solicitud enviada exitosamente!");
      }
    } catch (error) {
    console.error("Error submitting request:", error);
    alert("No se pudo enviar la solicitud");
    } finally {
    setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Título del Problema</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="ej., Fuga de agua en la cocina"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
          placeholder="Describa el problema en detalle..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Prioridad</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>

      <div className="flex gap-4">
      <button
        type="button"
        onClick={onCancel}
          className="flex-1 bg-(--color-neutral-light) text-(--color-neutral-dark) py-2 rounded-md hover:bg-gray-300 border border-gray-300"
      >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-(--color-accent) text-white py-2 rounded-md hover:bg-(--color-accent-hover) disabled:bg-gray-400"
        >
          {loading ? "Enviando..." : "Enviar Solicitud"}
        </button>
      </div>
    </form>
  );
}
