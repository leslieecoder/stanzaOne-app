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
  <div className="min-h-screen relative">
  <div style={{ backgroundImage: "url('/assets/hero1.jpg')" }} className="absolute inset-0 bg-cover bg-center bg-no-repeat"></div>
  <div className="absolute inset-0 "></div>
  <div className="relative z-10 flex items-center justify-center min-h-screen">
  <div className="text-center px-8 text-white">
    <h1 className="text-5xl font-bold mb-4">
    Bienvenido a StanzaOne
    </h1>
          <p className="text-xl mb-8">
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
  </div>
  );
}
