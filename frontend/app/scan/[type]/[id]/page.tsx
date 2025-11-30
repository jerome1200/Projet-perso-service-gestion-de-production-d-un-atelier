"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

type HistoryUser = {
  id: number;
  nom?: string | null;
  email?: string | null;
};

type HistoryItem = {
  id: number;
  quantity: number;
  operation: "ADD" | "REMOVE";
  createdAt: string;
  user?: HistoryUser | null;
};

export default function ScanPage() {
  const router = useRouter();
  const params = useParams<{ type: string; id: string }>();

  const type = params.type;
  const id = params.id;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [authorized, setAuthorized] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    nom?: string;
    email?: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const endpointMap: Record<string, string> = {
    piece: "pieces",
    pieces: "pieces",
    kit: "kits",
    kits: "kits",
    sousAssemblage: "sous-assemblages",
    "sous-assemblages": "sous-assemblages",
    sousSousAssemblage: "sous-sous-assemblages",
    "sous-sous-assemblages": "sous-sous-assemblages",
  };

  // 🔐 Vérif token + rôle + user
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      router.push("/auth");
      return;
    }

    try {
      const payload = JSON.parse(atob(stored.split(".")[1]));

      if (payload.role === "USER" || payload.role === "ADMIN") {
        setAuthorized(true);
        setToken(stored);

        // On essaie plusieurs clés possibles pour l'id dans le JWT
        const rawId = payload.id ?? payload.userId ?? payload.sub;
        if (rawId != null) {
          setCurrentUser({
            id: Number(rawId),
            nom: payload.nom,
            email: payload.email,
          });
        } else {
          console.warn("⚠️ Aucun userId trouvé dans le payload du token");
          setCurrentUser(null);
        }
      } else {
        router.push("/auth");
      }
    } catch {
      localStorage.removeItem("token");
      router.push("/auth");
    }
  }, [router]);

  const axiosConfig = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  // 📦 chargement de l'item
  const fetchItem = async () => {
    try {
      setLoading(true);
      const endpoint = endpointMap[type];
      if (!endpoint) {
        setMessage("❌ Type inconnu.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/${endpoint}/${id}`, axiosConfig);
      setItem(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Impossible de charger l'élément.");
    } finally {
      setLoading(false);
    }
  };

  // 🕒 chargement historique
  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/history/${type}/${id}?limit=5`,
        axiosConfig
      );
      setHistory(res.data);
    } catch (err) {
      console.error("Erreur chargement historique :", err);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    fetchItem();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, type, id]);

  const moveStock = async (operation: "ADD" | "REMOVE") => {
    if (!item) return;
    if (quantity <= 0) {
      setMessage("❌ La quantité doit être supérieure à 0.");
      return;
    }

    try {
      setMessage(null);

      await axios.post(
        `${API_URL}/stock/${type}/${id}/${operation === "ADD" ? "add" : "remove"}`,
        {
          quantity: Number(quantity),
          userId: currentUser?.id ?? null, // 👈 on envoie l'id du user
        },
        axiosConfig
      );

      setQuantity(1);
      setMessage("✅ Stock mis à jour !");
      await fetchItem();
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      setMessage("❌ Impossible de modifier le stock.");
    }
  };

  if (!authorized) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-300">
        Vérification de l’accès...
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-300">
        Chargement...
      </div>
    );

  if (!item)
    return (
      <div className="flex justify-center items-center h-screen text-red-400">
        Élément introuvable
      </div>
    );

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 min-h-screen">
      <h1 className="text-xl font-bold mb-4">
        📦 {item.nom}{" "}
        <span className="text-sm text-gray-400">({item.reference})</span>
      </h1>

      {item.photo && (
        <img
          src={item.photo}
          alt={item.nom}
          className="w-full h-40 object-contain rounded mb-4 border border-gray-700 bg-black"
        />
      )}

      <div className="space-y-2 mb-6 text-sm">
        <div>
          <span className="font-semibold">Quantité actuelle :</span>{" "}
          <span className="font-bold">{item.nombre}</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-2 mb-3">🎛 Mouvement de stock</h2>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="number"
          min="1"
          className="w-24 p-2 rounded bg-gray-800 border border-gray-700 text-center"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        <button
          className="flex-1 bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-semibold"
          onClick={() => moveStock("ADD")}
        >
          ➕ Ajouter
        </button>

        <button
          className="flex-1 bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold"
          onClick={() => moveStock("REMOVE")}
        >
          ➖ Retirer
        </button>
      </div>

      {message && (
        <p
          className={`mt-2 text-center text-sm ${
            message.startsWith("❌") ? "text-red-400" : "text-green-400"
          }`}
        >
          {message}
        </p>
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">🕒 Historique (5 derniers)</h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          Aucun mouvement enregistré pour le moment.
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {history.map((h) => (
            <li
              key={h.id}
              className="border border-gray-700 rounded p-2 flex justify-between items-center"
            >
              <span>
                {h.operation === "ADD" ? "➕" : "➖"} {h.quantity}
              </span>
              <span className="text-right text-gray-400 text-xs">
                {new Date(h.createdAt).toLocaleString()}
                {h.user && (
                  <>
                    {" "}-{" "}
                    <span className="text-gray-300">
                      {h.user.nom || h.user.email || "Utilisateur"}
                    </span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
