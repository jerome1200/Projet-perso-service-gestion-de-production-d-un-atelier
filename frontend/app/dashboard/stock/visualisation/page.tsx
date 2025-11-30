"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function VisualisationStockPage() {
  const [bornes, setBornes] = useState<any[]>([]);
  const [selectedBorneId, setSelectedBorneId] = useState<number | null>(null);
  const [stockData, setStockData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // 📦 Charger bornes
  const fetchBornes = async () => {
    try {
      const res = await axios.get(`${API_URL}/bornes`);
      setBornes(res.data);
    } catch (err) {
      console.error("Erreur chargement bornes:", err);
    }
  };

  // 📊 Charger le stock complet pour une borne
  const fetchStockData = async (borneId: number) => {
    setLoading(true);
    try {
      const [pieces, sa, ssa, kits] = await Promise.all([
        axios.get(`${API_URL}/pieces?borneId=${borneId}`),
        axios.get(`${API_URL}/sous-assemblages?borneId=${borneId}`),
        axios.get(`${API_URL}/sous-sous-assemblages?borneId=${borneId}`),
        axios.get(`${API_URL}/kits?borneId=${borneId}`),
      ]);

      setStockData({
        pieces: pieces.data,
        sousAssemblages: sa.data,
        sousSousAssemblages: ssa.data,
        kits: kits.data,
      });
    } catch (err) {
      console.error("Erreur chargement stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBornes();
  }, []);

  useEffect(() => {
    if (selectedBorneId) fetchStockData(selectedBorneId);
  }, [selectedBorneId]);

  const filterItems = (items: any[]) =>
    items.filter((i) => i.nom.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-200 mb-6">
        📦 Visualisation du stock
      </h1>

      {/* Sélecteur de borne */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-gray-300">Borne :</label>
        <select
          value={selectedBorneId ?? ""}
          onChange={(e) =>
            setSelectedBorneId(e.target.value ? Number(e.target.value) : null)
          }
          className="bg-gray-800 border border-gray-700 text-gray-200 p-2 rounded-md"
        >
          <option value="">-- Sélectionner une borne --</option>
          {bornes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>

        {selectedBorneId && (
          <input
            type="text"
            placeholder="🔍 Rechercher dans le stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
          />
        )}
      </div>

      {!selectedBorneId && (
        <p className="text-gray-400 italic">Veuillez sélectionner une borne.</p>
      )}

      {selectedBorneId && (
        <>
          {loading ? (
            <p className="text-gray-400 text-center mt-6">
              Chargement du stock...
            </p>
          ) : stockData ? (
            <div className="space-y-6 mt-6">
              <StockSection
                title="🔩 Pièces"
                items={filterItems(stockData.pieces)}
                //defaultOpen
              />
              <StockSection
                title="🧱 Sous-assemblages"
                items={filterItems(stockData.sousAssemblages)}
              />
              <StockSection
                title="🪛 Sous-sous-assemblages"
                items={filterItems(stockData.sousSousAssemblages)}
              />
              <StockSection
                title="📦 Kits"
                items={filterItems(stockData.kits)}
              />
            </div>
          ) : (
            <p className="text-gray-400 italic mt-6 text-center">
              Aucun élément trouvé pour cette borne.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* 🔹 SECTION ACCORDÉON + TABLEAU                                           */
/* ------------------------------------------------------------------------- */
function StockSection({
  title,
  items,
  defaultOpen = false,
}: {
  title: string;
  items: any[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/40">
      {/* En-tête cliquable */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3
                   text-left font-semibold text-gray-200 hover:bg-gray-800/60
                   transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-5 h-5 text-blue-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <span>{title}</span>
          <span className="text-gray-500 text-sm ml-2">({items.length})</span>
        </div>
      </button>

      {/* Contenu déroulant */}
      <div
        className={`transition-all duration-300 ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        {items.length > 0 ? (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
			<table className="min-w-full border border-gray-700 text-gray-200 text-sm table-fixed">
				<thead className="bg-gray-800 sticky top-0 z-10">
				<tr>
					<th className="px-4 py-2 text-left border-b border-gray-700 w-[15%]">Nom</th>
					<th className="px-4 py-2 text-left border-b border-gray-700 w-[0%]">Référence</th>
					<th className="px-4 py-2 text-center border-b border-gray-700 w-[20%]">Quantité</th>
					<th className="px-4 py-2 text-left border-b border-gray-700 w-[0%]">Emplacement</th>
					<th className="px-4 py-2 text-center border-b border-gray-700 w-[20%]">Photo</th>
				</tr>
				</thead>
				<tbody>
				{items.map((item) => (
					<tr key={item.id} className="hover:bg-gray-800/60">
					<td className="px-4 py-2 border-b border-gray-700 truncate">{item.nom}</td>
					<td className="px-4 py-2 border-b border-gray-700 truncate">{item.reference}</td>
					<td className="px-4 py-2 text-center border-b border-gray-700">{item.nombre ?? "—"}</td>
					<td className="px-4 py-2 border-b border-gray-700 truncate">
						{item.emplacement && item.emplacement !== "null" ? item.emplacement : "—"}
					</td>
					<td className="px-4 py-2 border-b border-gray-700 text-center align-middle">
						{item.photo ? (
						<div className="flex justify-center">
							<img
							src={item.photo}
							alt={item.nom}
							className="w-10 h-10 object-cover rounded-md border border-gray-700"
							/>
						</div>
						) : (
						<span className="text-gray-500 italic">Aucune</span>
						)}
					</td>
					</tr>
				))}
				</tbody>
			</table>
		 </div>
        ) : (
          <p className="text-gray-400 italic px-4 py-3">
            Aucun élément à afficher.
          </p>
        )}
      </div>
    </div>
  );
}
