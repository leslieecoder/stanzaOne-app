"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
  if (!loading && user && userProfile) {
  // Redirect based on role
  if (userProfile.role === "admin") {
  router.push("/admin");
  } else if (userProfile.role === "tenant") {
  router.push("/tenant");
  }
  }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Bienvenido a StanzaOne
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Gestión de propiedades moderna y sencilla
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-(--color-primary) text-white px-8 py-3 rounded-lg font-medium hover:bg-(--color-primary-hover) transition"
          >
            Comenzar
          </Link>
          <Link
            href="/login"
            className="bg-white text-(--color-primary) px-8 py-3 rounded-lg font-medium hover:bg-(--color-neutral-light) transition border border-(--color-primary)"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
