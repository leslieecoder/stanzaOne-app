"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

interface Complex {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceRequests: number;
}

export default function ComplexesGrid() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const updateComplexesData = async () => {
      try {
        setLoading(true);

        // Fetch all data simultaneously
        const [complexesSnapshot, unitsSnapshot, maintenanceSnapshot] = await Promise.all([
          getDocs(collection(db, "complexes")),
          getDocs(collection(db, "units")),
    getDocs(collection(db, "maintenance_requests"))
        ]);

        console.log("Complexes data:", complexesSnapshot.docs.length);
        console.log("Units data:", unitsSnapshot.docs.length);
        console.log("Maintenance data:", maintenanceSnapshot.docs.length);

      // Build complex data with stats
        const complexesData = complexesSnapshot.docs.map((doc) => {
          const complexId = doc.id;
          const complexData = doc.data();

        // Count units for this complex
          const complexUnits = unitsSnapshot.docs.filter(
            (unitDoc) => unitDoc.data().complexId === complexId
          );

          const totalUnits = complexUnits.length;
        const occupiedUnits = complexUnits.filter(
            (unitDoc) => unitDoc.data().status === "occupied"
          ).length;
          const vacantUnits = totalUnits - occupiedUnits;

    // Count maintenance requests for this complex
    const complexUnitIds = complexUnits.map((u) => u.id);
    const maintenanceRequests = maintenanceSnapshot.docs.filter(
    (requestDoc) => {
            const requestData = requestDoc.data();
      return requestData.unitId && complexUnitIds.includes(requestData.unitId);
    }
    ).length;

    console.log(`Complex ${complexId}: ${totalUnits} units, ${maintenanceRequests} maintenance requests`);

    return {
    id: complexId,
    name: complexData.name,
      address: complexData.address,
          totalUnits,
      occupiedUnits,
      vacantUnits,
      maintenanceRequests,
    };
    });

    setComplexes(complexesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching complexes:", error);
      setLoading(false);
    }
  };

        // Set up real-time listeners for all collections
        const complexesUnsubscribe = onSnapshot(collection(db, "complexes"), () => {
      updateComplexesData();
        });

        const unitsUnsubscribe = onSnapshot(collection(db, "units"), () => {
        updateComplexesData();
        });

    const maintenanceUnsubscribe = onSnapshot(collection(db, "maintenance_requests"), () => {
      updateComplexesData();
    });

    // Initial load
    updateComplexesData();

    // Cleanup function
    return () => {
      complexesUnsubscribe();
      unitsUnsubscribe();
      maintenanceUnsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cargando complejos...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Existing Complexes */}
      {complexes.map((complex) => (
        <div
          key={complex.id}
          onClick={() => router.push(`/admin/complex/${complex.id}`)}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border border-gray-200"
        >
          {/* Image Placeholder */}
          <div className="h-48 bg-linear-to-br from-(--color-primary) to-(--color-secondary) flex items-center justify-center">
            <span className="text-6xl text-white">🏢</span>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">{complex.name}</h3>
            <p className="text-sm text-gray-600 mb-4">📍 {complex.address}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded p-3">
                <p className="text-xs text-(--color-primary) font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-800">{complex.totalUnits}</p>
                <p className="text-xs text-gray-600">unidades</p>
              </div>
              <div className="bg-green-50 rounded p-3">
                <p className="text-xs text-(--color-success) font-medium">Ocupadas</p>
                <p className="text-2xl font-bold text-green-800">{complex.occupiedUnits}</p>
                <p className="text-xs text-gray-600">
                  {complex.totalUnits > 0 
                    ? `${Math.round((complex.occupiedUnits / complex.totalUnits) * 100)}%`
                    : '0%'}
                </p>
              </div>
              <div className="bg-yellow-50 rounded p-3">
                <p className="text-xs text-yellow-600 font-medium">Vacantes</p>
                <p className="text-2xl font-bold text-yellow-800">{complex.vacantUnits}</p>
              </div>
              <div className="bg-orange-50 rounded p-3">
                <p className="text-xs text-(--color-accent) font-medium">Mantenimiento</p>
                <p className="text-2xl font-bold text-orange-800">{complex.maintenanceRequests}</p>
              </div>
            </div>

            <button className="w-full bg-(--color-primary) text-white py-2 rounded-md hover:bg-(--color-primary-hover) font-medium">
              Ver Detalles →
            </button>
          </div>
        </div>
      ))}

      {/* Add New Complex Card */}
      <div
        onClick={() => router.push('/admin/new-complex')}
        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center p-6">
          <div className="text-6xl mb-4">➕</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Agregar Complejo</h3>
          <p className="text-sm text-gray-600">Crear nuevo complejo de apartamentos</p>
        </div>
      </div>
    </div>
  );
}
