"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";

interface Unit {
  id: string;
  unitNumber: string;
  rent: number;
  status: string;
  tenantEmail?: string;
  hasMaintenanceRequest: boolean;
  hasLatePayment: boolean;
}

interface ComplexData {
  name: string;
  address: string;
  contractTerms: string;
  leaseDuration: number;
}

export default function ComplexDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const complexId = params.id as string;
  
  const [complex, setComplex] = useState<ComplexData | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!authLoading && userProfile?.role !== "admin") {
  router.push("/login");
  }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    const fetchComplexData = async () => {
      try {
        // Fetch complex info
        const complexDoc = await getDoc(doc(db, "complexes", complexId));
        if (!complexDoc.exists()) {
          router.push("/admin");
          return;
        }

        const complexData = complexDoc.data();
        setComplex({
          name: complexData.name,
          address: complexData.address,
          contractTerms: complexData.contractTerms || "",
          leaseDuration: complexData.leaseDuration || 12,
        });

        // Fetch units for this complex
        const unitsQuery = query(
          collection(db, "units"),
          where("complexId", "==", complexId)
        );
        const unitsSnapshot = await getDocs(unitsQuery);

        // Fetch all payments to check late payments
        const paymentsSnapshot = await getDocs(collection(db, "payments"));
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const unitsData = await Promise.all(
          unitsSnapshot.docs.map(async (unitDoc) => {
            const unitData = unitDoc.data();
            
            // Check if tenant has paid this month
            let hasLatePayment = false;
            if (unitData.tenantId && unitData.status === "occupied") {
              const tenantDoc = await getDoc(doc(db, "users", unitData.tenantId));
              const tenantEmail = tenantDoc.data()?.email;
              
              const hasPaymentThisMonth = paymentsSnapshot.docs.some(payDoc => {
                const payData = payDoc.data();
                const paidAt = payData.paidAt?.toDate();
                return payData.tenantEmail === tenantEmail &&
                       paidAt &&
                       paidAt.getMonth() === currentMonth &&
                       paidAt.getFullYear() === currentYear;
              });

              hasLatePayment = now.getDate() > 5 && !hasPaymentThisMonth;
            }

            return {
              id: unitDoc.id,
              unitNumber: unitData.unitNumber,
              rent: unitData.rent,
              status: unitData.status || "vacant",
              tenantEmail: unitData.tenantEmail,
              hasMaintenanceRequest: false, // TODO: Check maintenance
              hasLatePayment,
            };
          })
        );

        // Sort by unit number
        unitsData.sort((a, b) => {
          const aNum = parseInt(a.unitNumber) || 0;
          const bNum = parseInt(b.unitNumber) || 0;
          return aNum - bNum;
        });

        setUnits(unitsData);
      } catch (error) {
        console.error("Error fetching complex data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (complexId) {
      fetchComplexData();
    }
  }, [complexId, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!complex) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Complejo no encontrado</p>
      </div>
    );
  }

  // Color helper function
  const getUnitColor = (unit: Unit) => {
    if (unit.status === "vacant") return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
    if (unit.hasLatePayment) return "bg-red-100 border-red-300 hover:bg-red-200";
    if (unit.hasMaintenanceRequest) return "bg-orange-100 border-orange-300 hover:bg-orange-200";
    return "bg-green-100 border-green-300 hover:bg-green-200";
  };

  const getStatusIcon = (unit: Unit) => {
    if (unit.status === "vacant") return "🔓";
    if (unit.hasLatePayment) return "⚠️";
    return "✓";
  };

  return (
  <div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin")}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Volver a Complejos
        </button>
      </div>

      {/* Complex Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{complex.name}</h1>
            <p className="text-gray-600 mb-4">📍 {complex.address}</p>
            <div className="flex gap-4 text-sm">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                {units.length} unidades totales
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                {units.filter(u => u.status === "occupied").length} ocupadas
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
                {units.filter(u => u.status === "vacant").length} vacantes
              </span>
              {units.filter(u => u.hasLatePayment).length > 0 && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded">
                  {units.filter(u => u.hasLatePayment).length} con mora
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
              ✏️ Editar
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {units.map((unit) => (
          <div
            key={unit.id}
            onClick={() => router.push(`/admin/unit/${unit.id}`)}
            className={`${getUnitColor(unit)} border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg`}
          >
            <div className="text-center">
              <p className="text-3xl mb-2">{getStatusIcon(unit)}</p>
              <p className="font-bold text-lg mb-1">#{unit.unitNumber}</p>
              <p className="text-xs text-gray-600 mb-2">
                ${unit.rent.toLocaleString('es-MX')}
              </p>
              {unit.status === "occupied" && unit.tenantEmail && (
                <p className="text-xs text-gray-700 truncate">
                  {unit.tenantEmail.split('@')[0]}
                </p>
              )}
              {unit.status === "vacant" && (
                <p className="text-xs text-gray-600">Disponible</p>
              )}
              {unit.hasLatePayment && (
                <p className="text-xs text-red-600 font-semibold mt-1">MORA</p>
              )}
            </div>
          </div>
        ))}

        {/* Add Unit Card */}
        <div
          onClick={() => router.push(`/admin/complex/${complexId}/add-unit`)}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-3xl mb-2">➕</p>
            <p className="text-sm font-medium text-gray-600">Agregar Unidad</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-4">
        <p className="font-semibold mb-3 text-sm">Leyenda:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
            <span>Ocupada - Al día</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span>Vacante</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
            <span>Mora de pago</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-200 border border-orange-300 rounded"></div>
            <span>Mantenimiento</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
