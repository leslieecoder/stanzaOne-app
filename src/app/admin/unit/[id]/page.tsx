"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";

interface UnitData {
  unitNumber: string;
  rent: number;
  status: string;
  complexId: string;
  complexName: string;
  tenantId?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}

interface TenantData {
  email: string;
  contractSigned: boolean;
  contractSignedAt?: Date;
  signatureName?: string;
}

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const unitId = params.id as string;

  const [unit, setUnit] = useState<UnitData | null>(null);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [payments, setPayments] = useState<{id: string; amount: number; date: Date; status: string}[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<{id: string; title: string; description: string; priority: string; status: string; createdAt: Date}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!authLoading && userProfile?.role !== "admin") {
  router.push("/login");
  }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        // Fetch unit
        const unitDoc = await getDoc(doc(db, "units", unitId));
        if (!unitDoc.exists()) {
          router.push("/admin");
          return;
        }

        const unitData = unitDoc.data();
        
        // Fetch complex name
        const complexDoc = await getDoc(doc(db, "complexes", unitData.complexId));
        const complexName = complexDoc.data()?.name || "Desconocido";

        setUnit({
          unitNumber: unitData.unitNumber,
          rent: unitData.rent,
          status: unitData.status || "vacant",
          complexId: unitData.complexId,
          complexName,
          tenantId: unitData.tenantId,
          leaseStartDate: unitData.leaseStartDate?.toDate(),
          leaseEndDate: unitData.leaseEndDate?.toDate(),
        });

        // If unit is occupied, fetch tenant data
        if (unitData.tenantId) {
          const tenantDoc = await getDoc(doc(db, "users", unitData.tenantId));
          if (tenantDoc.exists()) {
            const tenantData = tenantDoc.data();
            setTenant({
              email: tenantData.email,
              contractSigned: tenantData.contractSigned || false,
              contractSignedAt: tenantData.contractSignedAt?.toDate(),
              signatureName: tenantData.signatureName,
            });

            // Fetch tenant's payments
            const paymentsQuery = query(
              collection(db, "payments"),
              where("tenantEmail", "==", tenantData.email)
            );
            const paymentsSnapshot = await getDocs(paymentsQuery);
            setPayments(paymentsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
                amount: data.amount || 0,
                date: data.paidAt?.toDate() || new Date(),
                status: data.status || "pending",
              };
            }));

            // Fetch tenant's maintenance requests
            const maintenanceQuery = query(
              collection(db, "maintenance_requests"),
              where("tenantId", "==", unitData.tenantId)
            );
            const maintenanceSnapshot = await getDocs(maintenanceQuery);
            setMaintenanceRequests(maintenanceSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title || "",
                description: data.description || "",
                priority: data.priority || "low",
                status: data.status || "pending",
                createdAt: data.createdAt?.toDate() || new Date(),
              };
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching unit data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (unitId) {
      fetchUnitData();
    }
  }, [unitId, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!unit) return null;

  return (
  <div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <button onClick={() => router.push("/admin")} className="text-blue-600 hover:underline">
          Inicio
        </button>
        <span className="mx-2 text-gray-400">›</span>
        <button onClick={() => router.push(`/admin/complex/${unit.complexId}`)} className="text-blue-600 hover:underline">
          {unit.complexName}
        </button>
        <span className="mx-2 text-gray-400">›</span>
        <span className="text-gray-700">Unidad {unit.unitNumber}</span>
      </div>

      {/* Unit Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Unidad #{unit.unitNumber}</h1>
            <p className="text-gray-600 mb-1">{unit.complexName}</p>
            <p className="text-2xl font-semibold text-green-600">
              ${unit.rent.toLocaleString('es-MX')} MXN/mes
            </p>
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

      {/* Tenant Info or Assign Tenant */}
      {unit.status === "vacant" || !tenant ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-8 text-center">
          <p className="text-xl font-semibold text-yellow-800 mb-4">
            Esta unidad está vacante
          </p>
          <button
            onClick={() => router.push(`/admin/unit/${unitId}/assign-tenant`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            👤 Asignar Inquilino
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Tenant Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Información del Inquilino</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{tenant.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Inicio de Contrato</p>
                  <p className="font-medium">
                    {unit.leaseStartDate?.toLocaleDateString('es-ES') || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fin de Contrato</p>
                  <p className="font-medium">
                    {unit.leaseEndDate?.toLocaleDateString('es-ES') || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado del Contrato</p>
                <span className={`inline-block px-3 py-1 rounded text-sm ${
                  tenant.contractSigned 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {tenant.contractSigned ? '✓ Firmado' : 'Pendiente de firma'}
                </span>
              </div>
            </div>
            <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">
              Remover Inquilino
            </button>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Historial de Pagos</h2>
            {payments.length === 0 ? (
              <p className="text-gray-600">No hay pagos registrados</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">{payment.date.toLocaleDateString('es-ES')}</span>
                <span className="font-semibold text-green-600">
                ${payment.amount.toLocaleString('es-MX')}
                </span>
                </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Solicitudes de Mantenimiento</h2>
            {maintenanceRequests.length === 0 ? (
              <p className="text-gray-600">No hay solicitudes de mantenimiento</p>
            ) : (
              <div className="space-y-3">
                {maintenanceRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{request.title}</p>
                        <p className="text-sm text-gray-600">{request.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
