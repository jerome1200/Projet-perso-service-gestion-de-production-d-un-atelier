"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type Borne = {
  id: number;
  nom: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function BornesPage() {
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchBornes = async () => {
    try {
      setLoadingList(true);
      const res = await axios.get(`${API_URL}/bornes`);
      setBornes(res.data);
    } catch (err) {
      console.error("Erreur chargement bornes:", err);
      setMessage("❌ Impossible de charger les bornes.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchBornes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setMessage("❌ Le nom de la borne est obligatoire.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      await axios.post(`${API_URL}/bornes`, {
        nom: nom.trim(),
      });

      setMessage("✅ Borne créée avec succès.");
      setNom("");
      await fetchBornes();
    } catch (error: any) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setMessage("❌ Ce nom de borne est déjà utilisé.");
      } else {
        setMessage("❌ Erreur lors de la création de la borne.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement cette borne ?")) return;

    try {
      await axios.delete(`${API_URL}/bornes/${id}`);
      setMessage("✅ Borne supprimée.");
      await fetchBornes();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la suppression.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-200 mb-6">
        🏭 Gestion des bornes
      </h1>

      {/* Formulaire de création */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Nom de la borne
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Borne 55, Borne 32, etc."
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 rounded-md font-semibold transition-all ${
            loading
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
          }`}
        >
          {loading ? "Création..." : "➕ Créer la borne"}
        </button>
      </form>

      {message && (
        <p
          className={`mb-6 text-center text-sm font-medium ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}

      {/* Liste des bornes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          📋 Bornes existantes
        </h2>

        {loadingList ? (
          <p className="text-gray-400 text-sm">Chargement...</p>
        ) : bornes.length === 0 ? (
          <p className="text-gray-500 text-sm italic">
            Aucune borne pour le moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {bornes.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between bg-gray-900/70 border border-gray-700 rounded-md px-3 py-2"
              >
                <div>
                  <span className="font-medium text-gray-100">{b.nom}</span>
                  <span className="ml-2 text-xs text-gray-500">ID: {b.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="text-xs px-3 py-1 rounded-md bg-red-700/80 hover:bg-red-600 text-white"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
