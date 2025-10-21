"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";
import TextSignature from "@/components/shared/TextSignature";

interface ContractData {
  tenantName: string;
  tenantEmail: string;
  complexName: string;
  complexAddress: string;
  unitNumber: string;
  rent: number;
  leaseStartDate: Date;
  leaseEndDate: Date;
  contractTerms: string;
}

export default function ContractViewer() {
  const { user } = useAuth();
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigned, setIsSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<Date | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        if (!userData?.unitId) {
          setLoading(false);
          return;
        }

        // Get unit data
        const unitDoc = await getDoc(doc(db, "units", userData.unitId));
        const unitData = unitDoc.data();

        if (!unitData) {
          setLoading(false);
          return;
        }

        // Get complex data
        const complexDoc = await getDoc(doc(db, "complexes", unitData.complexId));
        const complexData = complexDoc.data();

        if (!complexData) {
          setLoading(false);
          return;
        }

        // Build contract data
        setContractData({
          tenantName: userData.displayName || userData.email,
          tenantEmail: userData.email,
          complexName: complexData.name,
          complexAddress: complexData.address,
          unitNumber: unitData.unitNumber,
          rent: unitData.rent,
          leaseStartDate: unitData.leaseStartDate?.toDate() || new Date(),
          leaseEndDate: unitData.leaseEndDate?.toDate() || new Date(),
          contractTerms: complexData.contractTerms || "",
        });
        
        if (userData?.contractSigned) {
          setIsSigned(true);
          setSignedAt(userData.contractSignedAt?.toDate() || null);
          setSignatureName(userData.signatureName || null);
          
          // Si hay snapshot guardado, usarlo en lugar de datos actuales
          if (userData.signedContractSnapshot) {
            const snapshot = userData.signedContractSnapshot;
            setContractData({
              tenantName: snapshot.tenantName,
              tenantEmail: snapshot.tenantEmail,
              complexName: snapshot.complexName,
              complexAddress: snapshot.complexAddress,
              unitNumber: snapshot.unitNumber,
              rent: snapshot.rent,
              leaseStartDate: snapshot.leaseStartDate?.toDate() || new Date(),
              leaseEndDate: snapshot.leaseEndDate?.toDate() || new Date(),
              contractTerms: snapshot.contractTerms,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching contract:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [user]);

  const handleSignContract = async (name: string) => {
    if (!user || !contractData) return;
    
    setSigning(true);
    try {
      // IMPORTANTE: Guardar una copia permanente del contrato al momento de la firma
      // Esto previene que cambios futuros en la plantilla afecten contratos ya firmados
      await updateDoc(doc(db, "users", user.uid), {
        contractSigned: true,
        contractSignedAt: new Date(),
        contractSignedBy: user.email,
        signatureName: name,
        // Guardar snapshot del contrato firmado
        signedContractSnapshot: {
          tenantName: contractData.tenantName,
          tenantEmail: contractData.tenantEmail,
          complexName: contractData.complexName,
          complexAddress: contractData.complexAddress,
          unitNumber: contractData.unitNumber,
          rent: contractData.rent,
          leaseStartDate: contractData.leaseStartDate,
          leaseEndDate: contractData.leaseEndDate,
          contractTerms: contractData.contractTerms,
          signedAt: new Date(),
        },
      });
      
      setIsSigned(true);
      setSignedAt(new Date());
      setSignatureName(name);
      setShowSignModal(false);
      alert("¡Contrato firmado exitosamente!");
    } catch (error) {
      console.error("Error signing contract:", error);
      alert("No se pudo firmar el contrato");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Cargando contrato...</p>;
  }

  if (!contractData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">
          No hay contrato disponible. Por favor contacte a su administrador de propiedades.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contract Status */}
      <div className={`border rounded-md p-4 ${
        isSigned 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <p className={isSigned ? 'text-green-800' : 'text-yellow-800'}>
          {isSigned 
            ? '✓ Contrato firmado digitalmente' 
            : '⚠️ Contrato pendiente de firma'}
        </p>
        {isSigned && signedAt && (
          <p className="text-sm text-green-700 mt-1">
            Firmado el: {signedAt.toLocaleDateString('es-ES')} a las {signedAt.toLocaleTimeString('es-ES')}
          </p>
        )}
      </div>

      {/* Contract Document */}
      <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-center mb-8">CONTRATO DE ARRENDAMIENTO</h1>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">PARTES DEL CONTRATO</h2>
            <div className="space-y-2">
              <p><strong>ARRENDADOR:</strong> {contractData.complexName}</p>
              <p><strong>ARRENDATARIO:</strong> {contractData.tenantName}</p>
              <p><strong>EMAIL:</strong> {contractData.tenantEmail}</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">PROPIEDAD ARRENDADA</h2>
            <div className="space-y-2">
              <p><strong>DIRECCIÓN:</strong> {contractData.complexAddress}</p>
              <p><strong>UNIDAD:</strong> {contractData.unitNumber}</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">TÉRMINOS ECONÓMICOS</h2>
            <div className="space-y-2">
              <p><strong>RENTA MENSUAL:</strong> ${contractData.rent.toLocaleString()}</p>
              <p><strong>FECHA DE INICIO:</strong> {contractData.leaseStartDate.toLocaleDateString('es-ES')}</p>
              <p><strong>FECHA DE FINALIZACIÓN:</strong> {contractData.leaseEndDate.toLocaleDateString('es-ES')}</p>
            </div>
          </section>

          {contractData.contractTerms && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">TÉRMINOS Y CONDICIONES</h2>
              <div className="whitespace-pre-wrap text-gray-700">
                {contractData.contractTerms}
              </div>
            </section>
          )}

          {isSigned && signedAt && signatureName && (
            <section className="mt-8 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                <strong>Firmado digitalmente por:</strong> {contractData.tenantEmail}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Fecha de firma:</strong> {signedAt.toLocaleDateString('es-ES')} a las {signedAt.toLocaleTimeString('es-ES')}
              </p>
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2"><strong>Firma:</strong></p>
                <div className="border-b-2 border-gray-800 pb-2 inline-block px-8">
                  <p className="text-4xl font-signature" style={{ color: "#000" }}>
                    {signatureName}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Imprimir Contrato
        </button>
        {!isSigned && (
          <button
            onClick={() => setShowSignModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            ✍️ Firmar Contrato
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-sm text-gray-600">
          💡 <strong>Consejo:</strong> Puede imprimir o guardar este contrato como PDF usando la función de impresión de su navegador.
        </p>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Firmar Contrato</h3>
            <p className="text-gray-700 mb-6">
              Al ingresar su nombre y confirmar, usted acepta que ha leído y acepta los términos del contrato de arrendamiento.
            </p>
            {signing ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Guardando firma...</p>
              </div>
            ) : (
              <TextSignature
                onSave={handleSignContract}
                onCancel={() => setShowSignModal(false)}
                defaultName={contractData?.tenantName || ""}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
