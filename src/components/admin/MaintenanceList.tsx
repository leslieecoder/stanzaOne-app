"use client";

import { useState, useEffect } from "react";
import { collection, updateDoc, doc, onSnapshot } from "firebase/firestore";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  tenantId: string;
  tenantEmail: string;
  createdAt: Date;
}
import { db } from "@/lib/firebaseClient";

export default function MaintenanceList() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

  useEffect(() => {
    // Set up real-time listener for maintenance requests
    const unsubscribe = onSnapshot(
      collection(db, "maintenance_requests"),
      (querySnapshot) => {
        const requestsData: MaintenanceRequest[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Individual request data:", data); // Debug log
          return {
            id: doc.id,
            title: data.title || "Sin título",
            description: data.description || "Sin descripción",
            priority: data.priority || "medium",
            status: data.status || "pending",
            tenantId: data.tenantId || "",
            tenantEmail: data.tenantEmail || "Sin email",
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });
        console.log("Maintenance requests loaded:", requestsData); // Debug log
        setRequests(requestsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading maintenance requests:", err); // Debug log
        setError("No se pudieron cargar las solicitudes");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleResolve = async (requestId: string) => {
    if (!confirm("¿Estás seguro de marcar esta solicitud como resuelta?")) {
      return;
    }

    try {
      const requestRef = doc(db, "maintenance_requests", requestId);
      await updateDoc(requestRef, {
        status: "resolved",
        resolvedAt: new Date(),
      });

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: "resolved", resolvedAt: new Date() }
            : req
        )
      );

      alert("Solicitud marcada como resuelta exitosamente");
    } catch (err) {
      alert("Error al actualizar la solicitud");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando solicitudes...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-4">{error}</div>;
  }

  if (requests.length === 0) {
    return <div className="text-gray-500 py-4">No hay solicitudes de mantenimiento todavía</div>;
  }

  const translatePriority = (priority: string) => {
    const translations: { [key: string]: string } = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return translations[priority] || priority;
  };

  console.log("Rendering MaintenanceList with requests:", requests); // Debug log

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className={`p-6 rounded-lg shadow border-2 ${
            request.status === "resolved"
              ? "bg-green-50 border-green-300"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-800">{request.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{request.tenantEmail}</p>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  request.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : request.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {translatePriority(request.priority)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  request.status === "resolved"
                    ? "bg-green-600 text-white"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {request.status === "resolved" ? "Resuelta" : "En Proceso"}
              </span>
            </div>
          </div>
          <p className="text-gray-700 mt-3 mb-4">{request.description}</p>
          {request.status !== "resolved" && (
            <button
              onClick={() => handleResolve(request.id)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              ✓ Marcar como Resuelta
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
