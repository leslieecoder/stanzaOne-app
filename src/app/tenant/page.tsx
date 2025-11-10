"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface UnitInfo {
  unitNumber: string;
  complexName: string;
  complexAddress: string;
  rent: number;
}

function PaymentStatusMessage() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setPaymentStatus("success");
      setTimeout(() => setPaymentStatus(null), 5000);
    } else if (payment === "cancelled") {
      setPaymentStatus("cancelled");
      setTimeout(() => setPaymentStatus(null), 5000);
    }
  }, [searchParams]);

  if (!paymentStatus) return null;

  return (
    <>
      {paymentStatus === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg animate-pulse">
          ✅ ¡Pago procesado exitosamente! Gracias por su pago.
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
          ⚠️ Pago cancelado. Puede intentar nuevamente cuando esté listo.
        </div>
      )}
    </>
  );
}

export default function TenantPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [unitInfo, setUnitInfo] = useState<UnitInfo | null>(null);
  const [isPaidThisMonth, setIsPaidThisMonth] = useState(false);
  const [nextPaymentDate, setNextPaymentDate] = useState<Date>(new Date());
  const [contractSigned, setContractSigned] = useState(false);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
  if (!loading && (!user || userProfile?.role !== "tenant")) {
  router.push("/login");
  }
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user document
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const unitId = userData?.unitId;

        if (unitId) {
          // Get unit info
          const unitDoc = await getDoc(doc(db, "units", unitId));
          const unitData = unitDoc.data();

          if (unitData) {
            // Get complex info
            const complexDoc = await getDoc(doc(db, "complexes", unitData.complexId));
            const complexData = complexDoc.data();

            setUnitInfo({
              unitNumber: unitData.unitNumber,
              complexName: complexData?.name || "Desconocido",
              complexAddress: complexData?.address || "Desconocido",
              rent: unitData.rent,
            });
          }
        }

        // Check contract status
        setContractSigned(userData?.contractSigned || false);

        // Check payment status for this month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const paymentsQuery = query(
        collection(db, "payments"),
        where("tenantEmail", "==", user.email)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);

        const hasPaymentThisMonth = paymentsSnapshot.docs.some(payDoc => {
        const payData = payDoc.data();
        const paidAt = payData.paidAt?.toDate();
        // Check if payment is completed and from current month
        return payData.status === "completed" &&
                 paidAt &&
                 paidAt.getMonth() === currentMonth &&
                 paidAt.getFullYear() === currentYear;
        });

        setIsPaidThisMonth(hasPaymentThisMonth);
        setNextPaymentDate(new Date(currentYear, currentMonth + 1, 5));

        // Count maintenance requests
        const maintenanceQuery = query(
          collection(db, "maintenance_requests"),
          where("tenantId", "==", user.uid)
        );
        const maintenanceSnapshot = await getDocs(maintenanceQuery);
        setMaintenanceCount(maintenanceSnapshot.size);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!unitInfo) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-xl font-semibold text-yellow-800 mb-4">
              No tiene una unidad asignada
            </p>
            <p className="text-gray-700">
              Por favor contacte a su administrador de propiedades
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 pt-8 pb-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
  {/* Payment Success/Cancel Messages */}
  <Suspense fallback={null}>
  <PaymentStatusMessage />
  </Suspense>

        {/* Hero Card - Unit Info & Payment Status */}
        <div className="bg-linear-to-br from-(--color-primary) to-(--color-secondary) rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Mi Unidad</p>
              <h1 className="text-4xl font-bold">#{unitInfo.unitNumber}</h1>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isPaidThisMonth 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white animate-pulse'
            }`}>
              {isPaidThisMonth ? '✓ Pagado' : '! Pendiente'}
            </div>
          </div>
          
          <div className="space-y-2">
          <p className="text-blue-50 text-lg">{unitInfo.complexName}</p>
          <p className="text-blue-100 text-sm">📍 {unitInfo.complexAddress}</p>

          {/* Payment Status Info */}
          <div className="bg-white/10 rounded-lg p-3 mt-3">
          <div className="flex justify-between items-center">
          <div>
              <p className="text-blue-100 text-xs">Estado de pago</p>
              <p className={`text-sm font-medium ${isPaidThisMonth ? 'text-green-300' : 'text-red-300'}`}>
              {isPaidThisMonth ? '✅ Al día' : '⚠️ Pendiente de pago'}
            </p>
          </div>
          <div className="text-right">
              <p className="text-blue-100 text-xs">Próximo pago</p>
                <p className="text-sm font-medium">
                    {nextPaymentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mt-4 pt-4 border-t border-blue-400">
              <div>
                <p className="text-blue-100 text-sm">Renta Mensual</p>
                <p className="text-3xl font-bold">${unitInfo.rent.toLocaleString('es-MX')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/tenant/pay-rent')}
            className={`${
              isPaidThisMonth 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-(--color-success) hover:bg-(--color-success-hover) text-white shadow-lg hover:shadow-xl'
            } rounded-2xl p-6 transition-all`}
            disabled={isPaidThisMonth}
          >
            <div className="text-4xl mb-2">💳</div>
            <p className="font-bold text-lg">Pagar Renta</p>
            <p className="text-xs mt-1 opacity-80">
              {isPaidThisMonth ? 'Ya pagado' : 'Pagar ahora'}
            </p>
          </button>

          <button
            onClick={() => router.push('/tenant/contract')}
            className="bg-(--color-secondary) hover:bg-(--color-secondary-hover) text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-2">📄</div>
            <p className="font-bold text-lg">Mi Contrato</p>
            <p className="text-xs mt-1 opacity-80">
              {contractSigned ? '✓ Firmado' : 'Firmar ahora'}
            </p>
          </button>

          <button
            onClick={() => router.push('/tenant/maintenance')}
            className="bg-(--color-accent) hover:bg-(--color-accent-hover) text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative"
          >
            {maintenanceCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {maintenanceCount}
              </span>
            )}
            <div className="text-4xl mb-2">🔧</div>
            <p className="font-bold text-lg">Mantenimiento</p>
            <p className="text-xs mt-1 opacity-80">Reportar problema</p>
          </button>

          <button
            onClick={() => router.push('/tenant/profile')}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-2">👤</div>
            <p className="font-bold text-lg">Mi Perfil</p>
            <p className="text-xs mt-1 opacity-80">Editar info</p>
          </button>
        </div>

        {/* Payment History Preview */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Historial de Pagos</h2>
            <button 
              onClick={() => router.push('/tenant/payments')}
              className="text-blue-600 text-sm hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Últimos 3 pagos realizados
          </p>
        </div>

        {/* Maintenance Requests Preview */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Mis Solicitudes</h2>
            <button 
              onClick={() => router.push('/tenant/maintenance')}
              className="text-blue-600 text-sm hover:underline"
            >
              Ver todas →
            </button>
          </div>
          {maintenanceCount === 0 ? (
            <p className="text-gray-600 text-sm">No tiene solicitudes activas</p>
          ) : (
            <p className="text-(--color-accent) text-sm font-medium">
              {maintenanceCount} solicitud(es) en proceso
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
