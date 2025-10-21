"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface Tenant {
  id: string;
  email: string;
}

export default function AssignTenantPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;

  const [unitNumber, setUnitNumber] = useState("");
  const [complexName, setComplexName] = useState("");
  const [complexId, setComplexId] = useState("");
  const [leaseDuration, setLeaseDuration] = useState(12);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch unit info
        const unitDoc = await getDoc(doc(db, "units", unitId));
        if (!unitDoc.exists()) return;

        const unitData = unitDoc.data();
        setUnitNumber(unitData.unitNumber);
        setComplexId(unitData.complexId);

        // Fetch complex
        const complexDoc = await getDoc(doc(db, "complexes", unitData.complexId));
        if (complexDoc.exists()) {
          setComplexName(complexDoc.data().name);
          setLeaseDuration(complexDoc.data().leaseDuration || 12);
        }

        // Fetch unassigned tenants
        const usersSnapshot = await getDocs(collection(db, "users"));
        const unassignedTenants = usersSnapshot.docs
          .filter((doc) => doc.data().role === "tenant" && !doc.data().unitId)
          .map((doc) => ({
            id: doc.id,
            email: doc.data().email,
          }));
        setTenants(unassignedTenants);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [unitId]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDate = new Date(leaseStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + leaseDuration);

      // Update unit
      await updateDoc(doc(db, "units", unitId), {
        tenantId: selectedTenant,
        status: "occupied",
        leaseStartDate: startDate,
        leaseEndDate: endDate,
      });

      // Update user
      await updateDoc(doc(db, "users", selectedTenant), {
        unitId: unitId,
      });

      alert("¡Inquilino asignado exitosamente!");
      router.push(`/admin/unit/${unitId}`);
    } catch (error) {
      console.error("Error assigning tenant:", error);
      alert("Error al asignar inquilino");
    } finally {
      setLoading(false);
    }
  };

  if (tenants.length === 0) {
  return (
  <div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">No hay inquilinos disponibles para asignar</p>
          <button
            onClick={() => router.push(`/admin/unit/${unitId}`)}
            className="text-blue-600 hover:underline"
          >
            ← Volver
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
        <button onClick={() => router.push(`/admin/unit/${unitId}`)} className="text-blue-600 hover:underline">
          Unidad {unitNumber}
        </button>
        <span className="mx-2 text-gray-400">›</span>
        <span className="text-gray-700">Asignar Inquilino</span>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2">Asignar Inquilino</h1>
        <p className="text-gray-600 mb-6">
          Unidad #{unitNumber} - {complexName}
        </p>

        <form onSubmit={handleAssign} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Seleccionar Inquilino</label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Elija un inquilino...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fecha de Inicio del Contrato</label>
            <input
              type="date"
              value={leaseStartDate}
              onChange={(e) => setLeaseStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              El contrato finalizará automáticamente en {leaseDuration} meses
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Al asignar, el inquilino recibirá acceso a su contrato 
              y podrá comenzar a realizar pagos de renta.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/unit/${unitId}`)}
              className="flex-1 bg-(--color-neutral-light) text-(--color-neutral-dark) py-3 px-6 rounded-md hover:bg-gray-300 font-medium border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? "Asignando..." : "Asignar Inquilino"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
