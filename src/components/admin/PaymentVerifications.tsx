import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";

interface PaymentVerification {
  id: string;
  tenantId: string;
  tenantEmail: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  complexName: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  type: string;
  createdAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export default function PaymentVerifications() {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<PaymentVerification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "payment_verifications"),
      (snapshot) => {
        const verificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          verifiedAt: doc.data().verifiedAt?.toDate(),
        })) as PaymentVerification[];

        setVerifications(verificationsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading payment verifications:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleVerification = async (verificationId: string, status: "approved" | "rejected", verification: PaymentVerification) => {
    if (!user) {
  console.error("No user found");
    return;
    }

  console.log("User attempting update:", user.uid, user.email);
  console.log("Verification ID:", verificationId);
  console.log("New status:", status);

    // Check user role
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User role:", userData.role);
        if (userData.role !== "admin") {
          alert("No tienes permisos de administrador para realizar esta acción");
          return;
        }
      } else {
        console.error("User document not found");
        alert("Error: Usuario no encontrado en la base de datos");
        return;
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      alert("Error al verificar permisos");
      return;
    }

    try {
      // Update verification status
      console.log("Attempting to update verification document...");
      await updateDoc(doc(db, "payment_verifications", verificationId), {
        status,
        verifiedAt: new Date(),
        verifiedBy: user.uid,
      });

      // If approved, create a payment record
      if (status === "approved") {
        await addDoc(collection(db, "payments"), {
          tenantEmail: verification.tenantEmail,
          amount: verification.amount,
          paidAt: new Date(),
          method: "manual",
          unitNumber: verification.unitNumber,
          status: "completed",
          verified: true,
          verifiedBy: user.uid,
        });
      }

      // Show success message
      alert(`Pago ${status === "approved" ? "registrado" : "rechazado"} exitosamente`);
    } catch (error) {
      console.error("Error updating verification:", error);
      alert("Error al procesar la solicitud");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cargando verificaciones...</p>
      </div>
    );
  }

  const pendingVerifications = verifications.filter(v => v.status === "pending");

  if (pendingVerifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold mb-2">No hay verificaciones pendientes</h3>
        <p className="text-gray-600">Todas las solicitudes han sido procesadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Solicitudes de Pago Manual</h2>
        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingVerifications.length} pendiente{pendingVerifications.length !== 1 ? 's' : ''}
        </span>
      </div>

      {pendingVerifications.map((verification) => (
        <div key={verification.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {verification.tenantName} - Unidad #{verification.unitNumber}
              </h3>
              <p className="text-gray-600 text-sm">
                ${verification.amount.toLocaleString('es-MX')} MXN • {verification.createdAt.toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleVerification(verification.id, "approved", verification)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                ✓ Registrar Pago
              </button>
              <button
                onClick={() => handleVerification(verification.id, "rejected", verification)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 font-medium"
              >
                ✗ Rechazar
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Show all verifications history */}
      {verifications.length > pendingVerifications.length && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Historial de Verificaciones</h3>
          <div className="space-y-2">
            {verifications
              .filter(v => v.status !== "pending")
              .slice(0, 5)
              .map((verification) => (
                <div key={verification.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{verification.tenantName}</span>
                    <span className="text-gray-600 ml-2">Unidad #{verification.unitNumber}</span>
                    <span className="text-gray-500 ml-2">${verification.amount.toLocaleString('es-MX')} MXN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      verification.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {verification.status === "approved" ? "Aprobado" : "Rechazado"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {verification.verifiedAt?.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
