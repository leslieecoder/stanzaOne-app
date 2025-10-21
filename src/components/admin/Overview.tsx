"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

// Define types for our data
interface Complex {
  id: string;
  name: string;
  address: string;
  unitCount?: number;
}

interface Unit {
  id: string;
  unitNumber: string;
  complexId: string;
  complexName?: string;
  rent: number;
  status: string;
  tenantId: string | null;
  tenantEmail?: string;
}

interface Tenant {
  id: string;
  email: string;
  unitId?: string;
  unitNumber?: string;
  complexName?: string;
  contractSigned?: boolean;
  contractSignedAt?: Date;
}

export default function Overview() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"complexes" | "units" | "tenants">("complexes");

  useEffect(() => {
  const updateData = async () => {
  try {
  setLoading(true);

  // STEP 1: Fetch all complexes
  const complexesSnapshot = await getDocs(collection(db, "complexes"));
  const complexesData = complexesSnapshot.docs.map((doc) => ({
  id: doc.id,
    name: doc.data().name,
          address: doc.data().address,
  }));

  // Create a map for quick lookups (complexId -> complex name)
  const complexMap = new Map(
          complexesData.map((c) => [c.id, c.name])
  );

  // STEP 2: Fetch all units
  const unitsSnapshot = await getDocs(collection(db, "units"));
  const unitsData = unitsSnapshot.docs.map((doc) => ({
  id: doc.id,
  unitNumber: doc.data().unitNumber,
  complexId: doc.data().complexId,
  complexName: complexMap.get(doc.data().complexId) || "Unknown",
  rent: doc.data().rent,
    status: doc.data().status || "vacant",
          tenantId: doc.data().tenantId || null,
  }));

  // Count units per complex
  const unitCounts = new Map<string, number>();
  unitsData.forEach((unit) => {
    const count = unitCounts.get(unit.complexId) || 0;
          unitCounts.set(unit.complexId, count + 1);
  });

  // Add unit counts to complexes
  const complexesWithCounts = complexesData.map((c) => ({
    ...c,
          unitCount: unitCounts.get(c.id) || 0,
  }));

  // STEP 3: Fetch all users (tenants)
  const usersSnapshot = await getDocs(collection(db, "users"));
  const tenantsData = usersSnapshot.docs
  .filter((doc) => doc.data().role === "tenant")
  .map((doc) => {
  const userData = doc.data();
  return {
  id: doc.id,
  email: userData.email,
  unitId: userData.unitId,
    contractSigned: userData.contractSigned || false,
      contractSignedAt: userData.contractSignedAt?.toDate(),
            };
    });

  // Create a map for tenant lookups (userId -> email)
  const tenantMap = new Map(
          tenantsData.map((t) => [t.id, t.email])
  );

  // Add tenant emails to units
  const unitsWithTenants = unitsData.map((unit) => ({
    ...unit,
          tenantEmail: unit.tenantId ? tenantMap.get(unit.tenantId) : undefined,
  }));

  // Create a map for unit lookups (unitId -> unit info)
  const unitMap = new Map(
          unitsData.map((u) => [u.id, { unitNumber: u.unitNumber, complexName: u.complexName }])
  );

  // Add unit info to tenants
  const tenantsWithUnits = tenantsData.map((tenant) => {
  const unitInfo = tenant.unitId ? unitMap.get(tenant.unitId) : undefined;
  return {
  ...tenant,
    unitNumber: unitInfo?.unitNumber,
      complexName: unitInfo?.complexName,
          };
  });

  // Update state
  setComplexes(complexesWithCounts);
    setUnits(unitsWithTenants);
  setTenants(tenantsWithUnits);
    setLoading(false);
  } catch (error) {
    console.error("Error fetching data:", error);
      setLoading(false);
      }
  };

    // Set up real-time listeners
    const complexesUnsubscribe = onSnapshot(collection(db, "complexes"), () => updateData());
    const unitsUnsubscribe = onSnapshot(collection(db, "units"), () => updateData());
    const usersUnsubscribe = onSnapshot(collection(db, "users"), () => updateData());

    // Initial load
    updateData();

    // Cleanup
    return () => {
      complexesUnsubscribe();
      unitsUnsubscribe();
      usersUnsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveView("complexes")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeView === "complexes"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border"
          }`}
        >
          Complejos ({complexes.length})
        </button>
        <button
          onClick={() => setActiveView("units")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeView === "units"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border"
          }`}
        >
          Unidades ({units.length})
        </button>
        <button
          onClick={() => setActiveView("tenants")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeView === "tenants"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border"
          }`}
        >
          Inquilinos ({tenants.length})
        </button>
      </div>

      {/* Complexes Table */}
      {activeView === "complexes" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre del Complejo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total de Unidades
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {complexes.map((complex) => (
                <tr key={complex.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{complex.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{complex.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {complex.unitCount} unidades
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Units Table */}
      {activeView === "units" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Complejo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unidad #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Renta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Inquilino
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{unit.complexName}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{unit.unitNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                    ${unit.rent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        unit.status === "occupied"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {unit.status === "occupied" ? "Ocupada" : "Vacante"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {unit.tenantEmail || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tenants Table */}
      {activeView === "tenants" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Correo Electrónico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Complejo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unidad #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contrato
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{tenant.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {tenant.complexName || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {tenant.unitNumber || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        tenant.unitId
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tenant.unitId ? "Asignado" : "Sin Asignar"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {tenant.contractSigned ? (
                      <div className="flex flex-col">
                        <span className="px-2 py-1 rounded text-sm bg-purple-100 text-purple-800 w-fit">
                          ✓ Firmado
                        </span>
                        {tenant.contractSignedAt && (
                          <span className="text-xs text-gray-500 mt-1">
                            {tenant.contractSignedAt.toLocaleDateString('es-MX')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
