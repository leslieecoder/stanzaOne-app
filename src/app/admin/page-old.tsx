"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateComplex from "@/components/admin/CreateComplex";
import AddUnit from "@/components/admin/AddUnit";
import AssignTenant from "@/components/admin/AssignTenant";
import Overview from "@/components/admin/Overview";
import MaintenanceList from "@/components/admin/MaintenanceList";
import ContractTemplateEditor from "@/components/admin/ContractTemplateEditor";
import PaymentsOverview from "@/components/admin/PaymentsOverview";

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "complexes" | "units" | "tenants" | "maintenance" | "contracts" | "payments">("overview");

  useEffect(() => {
  if (!loading && (!user || userProfile?.role !== "admin")) {
  router.push("/login");
  }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          📊 Resumen
        </button>
        <button
          onClick={() => setActiveTab("complexes")}
          className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
            activeTab === "complexes"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Gestionar Complejos
        </button>
        <button
          onClick={() => setActiveTab("units")}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === "units"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Gestionar Unidades
        </button>
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
            activeTab === "tenants"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Asignar Inquilinos
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
            activeTab === "maintenance"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          🔧 Mantenimiento
        </button>
        <button
          onClick={() => setActiveTab("contracts")}
          className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
            activeTab === "contracts"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          📄 Contratos
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
            activeTab === "payments"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          💰 Pagos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Resumen de Datos</h2>
          <Overview />
        </div>
      )}

      {activeTab === "complexes" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Crear Complejo de Apartamentos</h2>
          <CreateComplex />
        </div>
      )}

      {activeTab === "units" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Agregar Unidad al Complejo</h2>
          <AddUnit />
        </div>
      )}

      {activeTab === "tenants" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Asignar Inquilino a Unidad</h2>
          <AssignTenant />
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Solicitudes de Mantenimiento</h2>
          <MaintenanceList />
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Plantillas de Contratos</h2>
          <ContractTemplateEditor />
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Registro de Pagos</h2>
          <PaymentsOverview />
        </div>
      )}
    </div>
    </div>
  );
}
