"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, addDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import PaymentSection from "@/components/tenant/PaymentSection";
import SuccessMessage from "@/components/shared/SuccessMessage";

export default function PayRentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [unitInfo, setUnitInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "deposit" | null>(null);
  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLate, setIsLate] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");

  // Listen for payment verification updates in real-time
  useEffect(() => {
    if (!user) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const verificationsQuery = query(
      collection(db, "payment_verifications"),
      where("tenantId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(verificationsQuery, (snapshot) => {
      const currentMonthRequest = snapshot.docs.find(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        return createdAt &&
               createdAt.getMonth() === currentMonth &&
               createdAt.getFullYear() === currentYear;
      });

      if (currentMonthRequest) {
        setRequestSent(true);
        setRequestStatus(currentMonthRequest.data().status);
      } else {
        setRequestSent(false);
        setRequestStatus("none");
      }
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const fetchUnitInfo = async () => {
  if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
  const unitId = userDoc.data()?.unitId;

        if (unitId) {
          const unitDoc = await getDoc(doc(db, "units", unitId));
  const unitData = unitDoc.data();

          if (unitData) {
            const complexDoc = await getDoc(doc(db, "complexes", unitData.complexId));
  const complexData = complexDoc.data();

            setUnitInfo({
            unitId: unitId,
            unitNumber: unitData.unitNumber,
              complexName: complexData?.name || "Desconocido",
            rent: unitData.rent,
  });

            // Check if payment is late (after 5th of the month)
            const now = new Date();
            const isLatePayment = now.getDate() > 5;
  setIsLate(isLatePayment);

            // Calculate total amount with late fee if applicable
            const baseRent = unitData.rent;
            const lateFee = isLatePayment ? baseRent * 0.1 : 0; // 10% late fee
  setTotalAmount(baseRent + lateFee);
          }
        }
      } catch (error) {
  console.error("Error:", error);
      } finally {
        setLoading(false);
      }
  };

  fetchUnitInfo();
  }, [user]);

  const handleBankDepositRequest = async () => {
  if (!user || !unitInfo) return;

  try {
  await addDoc(collection(db, "payment_verifications"), {
  tenantId: user.uid,
  tenantEmail: user.email,
  tenantName: user.displayName || "Usuario",
  unitId: unitInfo.unitId,
  unitNumber: unitInfo.unitNumber,
  complexName: unitInfo.complexName,
  amount: totalAmount,
  status: "pending",
  type: "manual",
  createdAt: new Date(),
  verifiedAt: null,
  verifiedBy: null,
  });

  setRequestSent(true);
  setRequestStatus("pending");
    setSuccessMessage("¡Solicitud enviada correctamente! Esperando aprobación del administrador.");
  setTimeout(() => setSuccessMessage(null), 4000);
  } catch (error) {
    console.error("Error creating verification request:", error);
      alert("Error al enviar la solicitud");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/tenant')}
          className="text-blue-600 hover:underline mb-6 text-sm"
        >
          ← Volver al Inicio
        </button>

        {/* Success Message */}
        {successMessage && (
        <SuccessMessage
          message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}

        {/* Amount Display */}
        <div className="text-center mb-8">
        <div className={`text-5xl font-bold mb-2 ${isLate ? 'text-red-600' : 'text-green-600'}`}>
          ${totalAmount.toLocaleString('es-MX')} MXN
          </div>
          {isLate && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold text-lg">
                ⚠️ Pago Tardío - Penalización del 10%
              </p>
              <p className="text-red-700 text-sm mt-1">
                Renta: ${unitInfo?.rent?.toLocaleString('es-MX')} + Penalización: ${(unitInfo?.rent * 0.1).toLocaleString('es-MX')} = Total: ${totalAmount.toLocaleString('es-MX')}
              </p>
            </div>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Pagar Renta</h1>
          <p className="text-gray-600">Unidad #{unitInfo?.unitNumber}</p>
        </div>

        {/* Payment Method Selection */}
        {!paymentMethod && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Selecciona Método de Pago</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod("online")}
                className="p-6 border-2 border-(--color-primary) rounded-xl hover:bg-(--color-primary) hover:text-white transition-all group"
              >
                <div className="text-4xl mb-3">💳</div>
                <h3 className="font-semibold text-lg mb-2">Pago en Línea</h3>
                <p className="text-sm text-gray-600 group-hover:text-white">
                  Pago seguro con tarjeta de crédito/débito
                </p>
              </button>

              <button
                onClick={() => setPaymentMethod("deposit")}
                className="p-6 border-2 border-(--color-secondary) rounded-xl hover:bg-(--color-secondary) hover:text-white transition-all group"
              >
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-semibold text-lg mb-2">Pago Manual</h3>
                <p className="text-sm text-gray-600 group-hover:text-white">
                  Registro directo por administrador
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Online Payment */}
        {paymentMethod === "online" && unitInfo && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pago en Línea</h2>
              <button
                onClick={() => setPaymentMethod(null)}
                className="text-(--color-primary) hover:underline text-sm"
              >
                ← Cambiar método
              </button>
            </div>
            <PaymentSection
              rent={unitInfo.rent}
              unitNumber={unitInfo.unitNumber}
              complexName={unitInfo.complexName}
            />
          </div>
        )}

        {/* Manual Payment */}
        {paymentMethod === "deposit" && unitInfo && (
        <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pago Manual</h2>
        <button
        onClick={() => setPaymentMethod(null)}
        className="text-(--color-primary) hover:underline text-sm"
        >
        ← Cambiar método
        </button>
        </div>

        <div className="text-center py-8">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-xl font-semibold mb-4">Registrar Pago Manual</h3>
        <p className="text-gray-600 mb-6">
        Monto a registrar: <span className="font-bold text-lg">${totalAmount.toLocaleString('es-MX')} MXN</span>
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Información para Pago</h4>
        <p className="text-sm text-blue-800">
        Realiza el pago directamente al administrador o a través del método acordado.
          Una vez realizado el pago, solicita el registro en el sistema.
        </p>
        </div>

        {/* Status Messages */}
        {requestStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="text-2xl">⏳</div>
              <div className="text-left">
                <p className="font-semibold text-yellow-900">Esperando Aprobación</p>
                <p className="text-sm text-yellow-800">Tu solicitud ha sido enviada. El administrador la revisará pronto.</p>
              </div>
            </div>
          </div>
        )}

        {requestStatus === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="text-2xl">✅</div>
              <div className="text-left">
                <p className="font-semibold text-green-900">Pago Registrado</p>
                <p className="text-sm text-green-800">Tu pago ha sido aprobado por el administrador.</p>
              </div>
            </div>
          </div>
        )}

        {requestStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="text-2xl">❌</div>
              <div className="text-left">
                <p className="font-semibold text-red-900">Solicitud Rechazada</p>
                <p className="text-sm text-red-800">Contacta al administrador para más información.</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleBankDepositRequest}
          disabled={requestSent && requestStatus !== "rejected"}
          className={`px-8 py-3 rounded-lg font-medium text-lg ${
            requestSent && requestStatus !== "rejected"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-(--color-accent) text-white hover:bg-(--color-accent-hover)"
          }`}
        >
          {requestSent && requestStatus !== "rejected"
            ? "Solicitud Enviada"
            : "📝 Solicitar Registro de Pago"}
        </button>

        {!requestSent && (
          <p className="text-xs text-gray-500 mt-4">
            El administrador revisará y registrará tu pago en las próximas horas.
          </p>
        )}
        </div>
        </div>
        )}
      </div>
    </div>
  );
}
