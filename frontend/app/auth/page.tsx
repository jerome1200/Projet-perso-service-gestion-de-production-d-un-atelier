"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "register") {
        // 👉 Lors de l'inscription, on crée simplement le compte
        await api.post("/auth/register", form);
        setMode("login"); // bascule vers le mode connexion
      } else {
        // 👉 Lors du login, on récupère le token JWT
        const res = await api.post("/auth/login", form);
        const token = res.data.access_token;
        localStorage.setItem("token", token);

        // ✅ On décode le token pour connaître le rôle
        const payload = JSON.parse(atob(token.split(".")[1]));

        // 🔀 Redirection selon le rôle
        if (payload.role === "DEFAULT") {
          router.push("/pending"); // page d’attente si non validé
        } else {
          router.push("/dashboard"); // page principale (dashboard)
        }
      }
    } catch (err) {
      console.error(err);
      setError("❌ Une erreur est survenue. Vérifie tes identifiants.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-[380px] space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {mode === "login" ? "Connexion" : "Inscription"}
        </h1>

        {error && <p className="text-red-600 text-center text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-600"
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-600"
            required
          />

          <button
            type="submit"
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-semibold transition duration-200"
          >
            {mode === "login" ? "Se connecter" : "S’inscrire"}
          </button>
        </form>

        <div className="text-center">
          {mode === "login" ? (
            <p className="text-sm text-gray-700">
              Pas encore de compte ?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-indigo-600 hover:underline font-medium"
              >
                Créer un compte
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-700">
              Déjà inscrit ?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-indigo-600 hover:underline font-medium"
              >
                Se connecter
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
