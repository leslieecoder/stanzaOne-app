"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface Payment {
  id: string;
  amount: number;
  tenantEmail: string;
  unitNumber: string;
  status: string;
  paidAt: Date;
  method: string;
  verified: boolean;
  verifiedBy?: string;
}

export default function PaymentsOverview() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "payments"),
      orderBy("paidAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const paymentsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          tenantEmail: data.tenantEmail,
          unitNumber: data.unitNumber,
          status: data.status,
          paidAt: data.paidAt?.toDate() || new Date(),
          method: data.method || "online",
          verified: data.verified || false,
          verifiedBy: data.verifiedBy,
        };
      });

      setPayments(paymentsData);

      // Calculate total revenue from completed payments only
      const completedPayments = paymentsData.filter(p => p.status === "completed");
      const total = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalRevenue(total);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to payments:", error);
      setLoading(false);
    });

    // Cleanup
    return unsubscribe;
  }, []);

  if (loading) {
    return <p className="text-gray-600">Cargando pagos...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Total Recibido</p>
          <p className="text-2xl font-bold text-green-800">
            ${totalRevenue.toLocaleString('es-MX')} MXN
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total de Pagos</p>
          <p className="text-2xl font-bold text-blue-800">{payments.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Este Mes</p>
          <p className="text-2xl font-bold text-purple-800">
            {payments.filter(p => {
              const now = new Date();
              return p.paidAt.getMonth() === now.getMonth() && 
                     p.paidAt.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-600">No hay pagos registrados aún.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Inquilino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Propiedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.paidAt.toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {payment.tenantEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.complexName} - #{payment.unitNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${payment.amount.toLocaleString('es-MX')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      ✓ Completado
                    </span>
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
