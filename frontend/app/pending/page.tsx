"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkRole = async () => {
      try {
        setChecking(true);
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        // Appel à ton backend pour récupérer les infos de l'utilisateur connecté
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const role = res.data.role;

        if (role !== "DEFAULT") {
          // ✅ Si le rôle a changé, on redirige
          router.push("/");
        }
      } catch (err) {
        console.error(err);
        setError("Erreur lors de la vérification du compte.");
      } finally {
        setChecking(false);
      }
    };

    // Vérifie toutes les 10 secondes
    const interval = setInterval(checkRole, 10000);
    checkRole(); // première vérif immédiate

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-indigo-100 to-indigo-200 px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Compte en attente de validation
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          Votre compte a bien été créé 🎉 <br />
          Il est actuellement en attente de validation par un administrateur.
        </p>

        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-6"></div>

        {checking && (
          <p className="text-sm text-gray-500 mb-2">Vérification du statut...</p>
        )}
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/");
          }}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-semibold transition duration-200"
        >
          Se déconnecter
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        © {new Date().getFullYear()} The Keepers — Tous droits réservés.
      </p>
    </div>
  );
}
