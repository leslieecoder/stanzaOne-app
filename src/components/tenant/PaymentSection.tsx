"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface PaymentSectionProps {
  rent: number;
  unitNumber: string;
  complexName: string;
}

export default function PaymentSection({ rent, unitNumber, complexName }: PaymentSectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isPaidThisMonth, setIsPaidThisMonth] = useState(false);
  const [isLate, setIsLate] = useState(false);
  const [nextPaymentDate, setNextPaymentDate] = useState<Date>(new Date());
  const [finalAmount, setFinalAmount] = useState(rent);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) return;

      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Check if payment exists for current month
        const q = query(
          collection(db, "payments"),
          where("tenantEmail", "==", user.email)
        );
        
        const snapshot = await getDocs(q);
        const hasPaymentThisMonth = snapshot.docs.some(doc => {
          const paidAt = doc.data().paidAt?.toDate();
          return paidAt && 
                 paidAt.getMonth() === currentMonth && 
                 paidAt.getFullYear() === currentYear;
        });

        setIsPaidThisMonth(hasPaymentThisMonth);

        // Calculate next payment date (5th of next month)
        const nextMonth = new Date(currentYear, currentMonth + 1, 5);
        setNextPaymentDate(nextMonth);

        // Check if late (after 5th of current month)
        const today = now.getDate();
        const late = today > 5 && !hasPaymentThisMonth;
        setIsLate(late);
        
        console.log("Debug - Payment Check:", {
          todayDate: today,
          currentMonth: currentMonth + 1,
          paymentDueDate: 5,
          isAfterDue: today > 5,
          hasPaymentThisMonth,
          isLate: late,
          finalAmount: late ? rent * 1.10 : rent
        });

        // Calculate final amount with late fee
        const amount = late ? rent * 1.10 : rent;
        setFinalAmount(amount);
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };

    checkPaymentStatus();
  }, [user, rent]);

  const handlePayment = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Create checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          tenantEmail: user.email,
          unitNumber,
          complexName,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert("Error al crear sesión de pago: " + data.error);
        return;
      }

      // 2. Redirect to Stripe Checkout (método moderno)
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Status */}
      {isPaidThisMonth ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 font-semibold flex items-center gap-2">
            ✓ Renta pagada para este mes
          </p>
          <p className="text-sm text-green-700 mt-1">
            Próximo pago: {nextPaymentDate.toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
      ) : (
        <>
          {/* Late Fee Warning */}
          {isLate && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 font-semibold">⚠️ Recargo por mora aplicado</p>
              <p className="text-sm text-red-700 mt-1">
                Se ha agregado un 10% de recargo por pago después del día 5.
              </p>
            </div>
          )}

          <div className={`border rounded-md p-4 ${
            isLate ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  {isLate ? 'Monto con Recargo' : 'Renta Mensual'}
                </p>
                <p className={`text-3xl font-bold ${isLate ? 'text-red-600' : 'text-blue-600'}`}>
                  ${finalAmount.toLocaleString('es-MX')} MXN
                </p>
                {isLate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Renta original: ${rent.toLocaleString('es-MX')} + Recargo: ${(finalAmount - rent).toLocaleString('es-MX')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Vencimiento</p>
                <p className={`text-sm font-medium ${isLate ? 'text-red-600' : 'text-gray-900'}`}>
                  5 de {new Date().toLocaleDateString('es-ES', { month: 'long' })}
                </p>
                {isLate && (
                  <p className="text-xs text-red-600 font-semibold">¡Retrasado!</p>
                )}
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full text-white py-3 px-4 rounded-md font-medium disabled:bg-gray-400 ${
                isLate 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? "Procesando..." : "💳 Pagar Ahora"}
            </button>
          </div>
        </>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h3 className="font-semibold mb-2">Métodos de pago aceptados:</h3>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">💳 Tarjeta de crédito/débito</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Pago seguro procesado por Stripe. No guardamos información de su tarjeta.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> El pago incluye un cargo por procesamiento de ~3% de Stripe.
        </p>
      </div>
    </div>
  );
}
