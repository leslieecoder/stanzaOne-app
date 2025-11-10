"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface Unit {
  id: string;
  unitNumber: string;
  complexId: string;
  complexName?: string;
  rent: number;
  status: string;
}

interface Tenant {
  id: string;
  email: string;
}

export default function AssignTenant() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Fetch vacant units and unassigned tenants
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all complexes first (to get names)
        const complexesSnapshot = await getDocs(collection(db, "complexes"));
        const complexesMap = new Map();
        complexesSnapshot.docs.forEach((doc) => {
          complexesMap.set(doc.id, doc.data().name);
        });

        // Fetch vacant units
        const unitsSnapshot = await getDocs(collection(db, "units"));
        const vacantUnits = unitsSnapshot.docs
          .filter((doc) => !doc.data().tenantId || doc.data().status === "vacant")
          .map((doc) => ({
            id: doc.id,
            unitNumber: doc.data().unitNumber,
            complexId: doc.data().complexId,
            complexName: complexesMap.get(doc.data().complexId) || "Unknown",
            rent: doc.data().rent,
            status: doc.data().status || "vacant",
          }));
        setUnits(vacantUnits);

        // Fetch tenants without units
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
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedUnitData = units.find(u => u.id === selectedUnit);
      if (!selectedUnitData) throw new Error("Unidad no encontrada");

      // Get complex data to get lease duration
      const complexDoc = await getDocs(collection(db, "complexes"));
      const complex = complexDoc.docs.find(doc => doc.id === selectedUnitData.complexId);
      const leaseDuration = complex?.data().leaseDuration || 12;

      // Calculate lease end date
      const startDate = new Date(leaseStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + leaseDuration);

      // Update unit document
      await updateDoc(doc(db, "units", selectedUnit), {
        tenantId: selectedTenant,
        status: "occupied",
        leaseStartDate: startDate,
        leaseEndDate: endDate,
      });

      // Update user document
      await updateDoc(doc(db, "users", selectedTenant), {
        unitId: selectedUnit,
      });

      alert("¡Inquilino asignado exitosamente!");
      
      // Refresh the lists
      setUnits(units.filter((u) => u.id !== selectedUnit));
      setTenants(tenants.filter((t) => t.id !== selectedTenant));
      setSelectedUnit("");
      setSelectedTenant("");
      setLeaseStartDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error("Error assigning tenant:", error);
      alert("No se pudo asignar el inquilino");
    } finally {
      setLoading(false);
    }
  };

  if (units.length === 0 || tenants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        {units.length === 0 && <p>No hay unidades disponibles.</p>}
        {tenants.length === 0 && <p>No se encontraron inquilinos sin asignar.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleAssign} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Seleccionar Unidad</label>
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="">Elija una unidad...</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.complexName} - Unidad {unit.unitNumber} (${unit.rent}/mes)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Seleccionar Inquilino</label>
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
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
        <label className="block text-sm font-medium mb-1">Fecha de Inicio del Arrendamiento</label>
        <input
          type="date"
          value={leaseStartDate}
          onChange={(e) => setLeaseStartDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? "Asignando..." : "Asignar Inquilino a Unidad"}
      </button>
    </form>
  );
}
