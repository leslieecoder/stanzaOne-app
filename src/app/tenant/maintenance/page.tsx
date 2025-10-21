"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import MaintenanceRequestForm from "@/components/tenant/MaintenanceRequestForm";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: Date;
}

export default function MaintenancePage() {
const router = useRouter();
const { user } = useAuth();
const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
const [loading, setLoading] = useState(true);
const [userUnitId, setUserUnitId] = useState<string | null>(null);
const [editingId, setEditingId] = useState<string | null>(null);
const [editTitle, setEditTitle] = useState("");
const [editDescription, setEditDescription] = useState("");
const [editPriority, setEditPriority] = useState("");
const [showForm, setShowForm] = useState(false);
const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
      const unsubscribe = setupRequestsListener();
      return unsubscribe; // Cleanup listener on unmount
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserUnitId(userData.unitId || null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const setupRequestsListener = () => {
    if (!user) return;

    const q = query(
      collection(db, "maintenance_requests"),
      where("tenantId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        priority: doc.data().priority,
        status: doc.data().status,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to requests:", error);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm("¿Está seguro de eliminar esta solicitud?")) return;

    try {
      await deleteDoc(doc(db, "maintenance_requests", requestId));
      setRequests(requests.filter(r => r.id !== requestId));
      alert("Solicitud eliminada");
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar");
    }
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingId(request.id);
    setEditTitle(request.title);
    setEditDescription(request.description);
    setEditPriority(request.priority);
  };

  const handleSaveEdit = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "maintenance_requests", requestId), {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
      });

      setRequests(requests.map(r => 
        r.id === requestId 
          ? { ...r, title: editTitle, description: editDescription, priority: editPriority }
          : r
      ));
      setEditingId(null);
      alert("Solicitud actualizada");
    } catch (error) {
      console.error("Error updating:", error);
      alert("Error al actualizar");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/tenant')}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Volver al Inicio
        </button>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Mantenimiento</h1>
          <p className="text-gray-600">Gestione sus solicitudes de reparación</p>
        </div>

        {/* Existing Requests */}
        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Mis Solicitudes ({requests.length})</h2>
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                {editingId === request.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                    />
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(request.id)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-(--color-neutral-light) text-(--color-neutral-dark) py-2 rounded-lg hover:bg-gray-400 border border-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{request.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{request.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-3 ${
                        request.priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority === 'high' ? 'Alta' : 
                         request.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{request.createdAt.toLocaleDateString('es-ES')}</span>
                        <span className={`px-2 py-1 rounded ${
                          request.status === 'resolved' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {request.status === 'resolved' ? '✓ Resuelta' : 'En proceso'}
                        </span>
                      </div>

                      {request.status !== 'resolved' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(request)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Request Button or Form */}
        {!showForm ? (
        <div className="text-center">
        <button
            onClick={() => setShowForm(true)}
            className="bg-(--color-primary) text-white px-8 py-4 rounded-xl hover:bg-(--color-primary-hover) font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
        >
        ➕ Añadir Nueva Solicitud
        </button>
        </div>
        ) : (
        <div>
        <h2 className="text-xl font-semibold mb-4">Nueva Solicitud de Mantenimiento</h2>
        <div className="bg-white rounded-2xl shadow-md p-6">
        <MaintenanceRequestForm
            unitId={userUnitId || undefined}
              onSuccess={(message) => {
                  setSuccessMessage(message);
                  setShowForm(false);
                  // Auto-hide success message after 3 seconds
                  setTimeout(() => setSuccessMessage(null), 3000);
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
