"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ComplexesGrid from "@/components/admin/ComplexesGrid";
import DebtorsList from "@/components/admin/DebtorsList";
import PaymentsOverview from "@/components/admin/PaymentsOverview";
import Overview from "@/components/admin/Overview";
import PaymentVerifications from "@/components/admin/PaymentVerifications";
import MaintenanceList from "@/components/admin/MaintenanceList";

type TabType = "home" | "debtors" | "payments" | "tenants" | "maintenance" | "verifications";

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("home");

  useEffect(() => {
  if (!loading && (!user || userProfile?.role !== "admin")) {
  router.push("/login");
  }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 pt-8 pb-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
    {/* Header */}
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
      <p className="text-gray-600">Gestione sus propiedades y inquilinos</p>
        </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("home")}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === "home"
            ? "bg-(--color-primary) text-white shadow-lg"
            : "bg-white text-gray-700 hover:bg-(--color-neutral-light)"
          }`}
        >
          🏢 Mis Complejos
        </button>
        <button
          onClick={() => setActiveTab("debtors")}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === "debtors"
            ? "bg-(--color-error) text-white shadow-lg"
            : "bg-white text-gray-700 hover:bg-(--color-neutral-light)"
          }`}
        >
          ⚠️ Deudores
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === "payments"
            ? "bg-(--color-success) text-white shadow-lg"
            : "bg-white text-gray-700 hover:bg-(--color-neutral-light)"
          }`}
        >
          💰 Pagos
        </button>
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === "tenants"
            ? "bg-(--color-secondary) text-white shadow-lg"
            : "bg-white text-gray-700 hover:bg-(--color-neutral-light)"
          }`}
        >
          👥 Inquilinos
        </button>
        <button
        onClick={() => setActiveTab("maintenance")}
        className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
        activeTab === "maintenance"
        ? "bg-(--color-accent) text-white shadow-lg"
        : "bg-white text-gray-700 hover:bg-(--color-neutral-light)"
        }`}
        >
        🔧 Mantenimiento
        </button>
        <button
          onClick={() => setActiveTab("verifications")}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === "verifications"
              ? "bg-(--color-info) text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-(--color-neutral-light)"
          }`}
        >
          💰 Pagos Manuales
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "home" && <ComplexesGrid />}
      
      {activeTab === "debtors" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Inquilinos con Mora</h2>
          <DebtorsList />
        </div>
      )}
      
      {activeTab === "payments" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Registro de Pagos</h2>
          <PaymentsOverview />
        </div>
      )}
      
      {activeTab === "tenants" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Todos los Inquilinos</h2>
          <Overview />
        </div>
      )}
      
      {activeTab === "maintenance" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Solicitudes de Mantenimiento</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <MaintenanceList />
          </div>
        </div>
      )}

      {activeTab === "verifications" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Pagos Manuales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <PaymentVerifications />
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
