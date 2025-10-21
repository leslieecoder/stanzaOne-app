"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ComplexesGrid from "@/components/admin/ComplexesGrid";

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

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
        <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Gestione sus propiedades y inquilinos</p>
      </div>

      {/* Main Content: Complexes Grid */}
      <ComplexesGrid />
    </div>
    </div>
  );
}
