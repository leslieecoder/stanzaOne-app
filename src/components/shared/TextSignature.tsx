"use client";

import { useState } from "react";

interface TextSignatureProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  defaultName?: string;
}

export default function TextSignature({ onSave, onCancel, defaultName = "" }: TextSignatureProps) {
  const [name, setName] = useState(defaultName);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor ingrese su nombre completo");
      return;
    }
    onSave(name.trim());
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Ingrese su nombre completo:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-lg"
          placeholder="Nombre completo"
          autoFocus
        />
      </div>

      {/* Signature Preview */}
      {name && (
        <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Vista previa de su firma:</p>
          <p 
            className="text-4xl text-center py-4 font-signature"
            style={{ color: "#000" }}
          >
            {name}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 disabled:bg-gray-400 font-medium"
        >
          Confirmar Firma
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-400 font-medium"
        >
          Cancelar
        </button>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Al confirmar, acepta que esta firma digital es legalmente vinculante
      </p>
    </div>
  );
}
