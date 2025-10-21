"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface Debtor {
  email: string;
  unitNumber: string;
  complexName: string;
  rent: number;
  amountDue: number;
  daysLate: number;
}

export default function DebtorsList() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebtors = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const today = now.getDate();

        // Only check if we're past the 5th
        if (today <= 5) {
          setLoading(false);
          return;
        }

        // Fetch all units
        const unitsSnapshot = await getDocs(collection(db, "units"));
        const occupiedUnits = unitsSnapshot.docs.filter(
          doc => doc.data().status === "occupied" && doc.data().tenantId
        );

        // Fetch all payments
        const paymentsSnapshot = await getDocs(collection(db, "payments"));
        
        // Fetch all complexes
        const complexesSnapshot = await getDocs(collection(db, "complexes"));
        const complexMap = new Map(
          complexesSnapshot.docs.map(doc => [doc.id, doc.data().name])
        );

        const debtorsData = await Promise.all(
          occupiedUnits.map(async (unitDoc) => {
            const unitData = unitDoc.data();
            
            // Get tenant info
            const tenantDoc = await getDocs(collection(db, "users"));
            const tenant = tenantDoc.docs.find(doc => doc.id === unitData.tenantId);
            if (!tenant) return null;

            const tenantEmail = tenant.data().email;

            // Check if tenant paid this month
            const hasPaymentThisMonth = paymentsSnapshot.docs.some(payDoc => {
              const payData = payDoc.data();
              const paidAt = payData.paidAt?.toDate();
              return payData.tenantEmail === tenantEmail &&
                     paidAt &&
                     paidAt.getMonth() === currentMonth &&
                     paidAt.getFullYear() === currentYear;
            });

            // If hasn't paid and we're past the 5th, they're a debtor
            if (!hasPaymentThisMonth) {
              const daysLate = today - 5;
              const amountDue = unitData.rent * 1.10; // 10% late fee

              return {
                email: tenantEmail,
                unitNumber: unitData.unitNumber,
                complexName: complexMap.get(unitData.complexId) || "Desconocido",
                rent: unitData.rent,
                amountDue,
                daysLate,
              };
            }

            return null;
          })
        );

        // Filter out nulls
        const validDebtors = debtorsData.filter((d): d is Debtor => d !== null);
        setDebtors(validDebtors);
      } catch (error) {
        console.error("Error fetching debtors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebtors();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Cargando deudores...</p>;
  }

  if (debtors.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <p className="text-xl font-semibold text-green-800">
          ✓ ¡Todos los inquilinos están al día con sus pagos!
        </p>
      </div>
    );
  }

  const totalDebt = debtors.reduce((sum, d) => sum + d.amountDue, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Inquilinos con Mora</p>
          <p className="text-3xl font-bold text-red-800">{debtors.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Total Adeudado</p>
          <p className="text-2xl font-bold text-orange-800">
            ${totalDebt.toLocaleString('es-MX')}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 font-medium">Promedio Días Tarde</p>
          <p className="text-3xl font-bold text-yellow-800">
            {Math.round(debtors.reduce((sum, d) => sum + d.daysLate, 0) / debtors.length)}
          </p>
        </div>
      </div>

      {/* Debtors Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-red-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">
                Inquilino
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">
                Propiedad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">
                Renta Original
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">
                Monto con Recargo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">
                Días de Retraso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {debtors.map((debtor, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="font-medium">{debtor.email}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {debtor.complexName} - #{debtor.unitNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                  ${debtor.rent.toLocaleString('es-MX')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">
                  ${debtor.amountDue.toLocaleString('es-MX')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 rounded text-sm bg-red-100 text-red-800">
                    {debtor.daysLate} días
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:underline text-sm">
                    Enviar Recordatorio
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
