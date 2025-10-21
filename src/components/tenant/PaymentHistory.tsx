"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";

interface Payment {
  id: string;
  amount: number;
  status: string;
  paidAt: Date;
  unitNumber: string;
  method: string;
  verified: boolean;
  verifiedBy?: string;
}

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "payments"),
      where("tenantEmail", "==", user.email),
      orderBy("paidAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const paymentsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          status: data.status,
          paidAt: data.paidAt?.toDate() || new Date(),
          unitNumber: data.unitNumber,
          method: data.method || "online",
          verified: data.verified || false,
          verifiedBy: data.verifiedBy,
        };
      });

      setPayments(paymentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to payments:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return <p className="text-gray-600">Cargando historial...</p>;
  }

  if (payments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">No hay pagos registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition"
        >
          <div className="flex justify-between items-start">
            <div>
            <p className="font-semibold text-lg">
            ${payment.amount.toLocaleString('es-MX')} MXN
            </p>
            <p className="text-sm text-gray-600">
            Unidad {payment.unitNumber} - {payment.method === 'bank_deposit' ? 'Depósito bancario' : 'Pago en línea'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            {payment.paidAt.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
            })}
            </p>
              {payment.verified && (
                <p className="text-xs text-green-600 font-medium mt-1">
                ✓ Aprobado por administrador
                </p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              payment.verified
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {payment.verified ? '✓ Verificado' : '⏳ Pendiente'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
