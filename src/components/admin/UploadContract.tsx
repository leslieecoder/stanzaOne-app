"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebaseClient";

interface Tenant {
  id: string;
  email: string;
}

export default function UploadContract() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Fetch all tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const tenantsData = usersSnapshot.docs
          .filter((doc) => doc.data().role === "tenant")
          .map((doc) => ({
            id: doc.id,
            email: doc.data().email,
          }));
        setTenants(tenantsData);
      } catch (error) {
        console.error("Error fetching tenants:", error);
      }
    };

    fetchTenants();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type (only PDFs)
      if (selectedFile.type !== "application/pdf") {
        alert("Por favor seleccione un archivo PDF");
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("El archivo es demasiado grande. Máximo 10MB");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !selectedTenant) {
      alert("Por favor seleccione un inquilino y un archivo");
      return;
    }

    setLoading(true);
    setUploadProgress("Subiendo archivo...");

    try {
      // 1. Create a reference to the file location in Storage
      const storageRef = ref(storage, `contracts/${selectedTenant}/lease_contract.pdf`);
      
      // 2. Upload the file
      setUploadProgress("Cargando archivo a Firebase Storage...");
      await uploadBytes(storageRef, file);
      
      // 3. Get the download URL
      setUploadProgress("Obteniendo URL de descarga...");
      const downloadURL = await getDownloadURL(storageRef);
      
      // 4. Update the user's Firestore document with the contract URL
      setUploadProgress("Actualizando base de datos...");
      await updateDoc(doc(db, "users", selectedTenant), {
        contractURL: downloadURL,
        contractUploadedAt: new Date(),
      });

      alert("¡Contrato subido exitosamente!");
      setFile(null);
      setSelectedTenant("");
      setUploadProgress("");
      
      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading contract:", error);
      alert("No se pudo subir el contrato");
    } finally {
      setLoading(false);
    }
  };

  if (tenants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No se encontraron inquilinos.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Seleccionar Inquilino
        </label>
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="">Elija un inquilino...</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Archivo de Contrato (PDF)
        </label>
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        {file && (
          <p className="text-sm text-gray-600 mt-1">
            Archivo seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {uploadProgress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
          {uploadProgress}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
      >
        {loading ? "Subiendo..." : "Subir Contrato"}
      </button>
    </form>
  );
}
