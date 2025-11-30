"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";


type Borne = { id: number; nom: string };

type Item = {
  id: number;
  nom: string;
  reference: string;
  emplacement: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const typeOptions = [
  {
    value: "piece",
    label: "Pièce",
    endpoint: "pieces",
  },
  {
    value: "sousAssemblage",
    label: "Sous-assemblage",
    endpoint: "sous-assemblages",
  },
  {
    value: "sousSousAssemblage",
    label: "Sous-sous-assemblage",
    endpoint: "sous-sous-assemblages",
  },
  {
    value: "kit",
    label: "Kit",
    endpoint: "kits",
  },
];

export default function EtiquettePage() {
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [selectedBorneId, setSelectedBorneId] = useState<number | "">("");
  const [type, setType] = useState<string>("piece");

  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);

  const [loading, setLoading] = useState(false);

  // Chargement des bornes
  useEffect(() => {
    const fetchBornes = async () => {
      try {
        const res = await axios.get(`${API_URL}/bornes`);
        setBornes(res.data);
      } catch (err) {
        console.error("Erreur chargement bornes :", err);
      }
    };
    fetchBornes();
  }, []);

  // Chargement des items selon borne + type
  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedBorneId) {
        setItems([]);
        setSelectedItems([]);
        return;
      }
      const conf = typeOptions.find((t) => t.value === type);
      if (!conf) return;

      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/${conf.endpoint}?borneId=${selectedBorneId}`
        );
        setItems(res.data);
        setSelectedItems([]);
      } catch (err) {
        console.error("Erreur chargement éléments :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedBorneId, type]);

  const filteredItems = items.filter((item) =>
    (item.nom + " " + item.reference)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const currentTypeLabel =
    typeOptions.find((t) => t.value === type)?.label ?? "Élément";

  const isSelected = (item: Item) =>
    selectedItems.some((sel) => sel.id === item.id);

  const toggleSelectItem = (item: Item) => {
    setSelectedItems((prev) => {
      if (prev.some((sel) => sel.id === item.id)) {
        return prev.filter((sel) => sel.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) return;
    window.print();
  };

  const getScanUrl = (item: Item) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/scan/${type}/${item.id}`;
  };

  return (
    <>
      {/* Impression : uniquement #print-area */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            inset: 0;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .label-card {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">
          🏷️ Impression d’étiquettes QR
        </h1>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4 bg-gray-900/60 border border-gray-700 rounded-xl p-4">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1 text-sm">Borne</label>
            <select
              value={selectedBorneId}
              onChange={(e) =>
                setSelectedBorneId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              className="bg-gray-800 border border-gray-700 text-gray-200 px-3 py-2 rounded-md text-sm"
            >
              <option value="">-- Sélectionner une borne --</option>
              {bornes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-1 text-sm">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 px-3 py-2 rounded-md text-sm"
            >
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col min-w-[200px]">
            <label className="text-gray-300 mb-1 text-sm">Recherche</label>
            <input
              type="text"
              placeholder="Nom ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 px-3 py-2 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr] gap-6">
          {/* Liste des éléments */}
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
            <h2 className="text-gray-200 font-semibold mb-3 text-sm">
              Sélectionne les éléments à imprimer
            </h2>

            {loading ? (
              <p className="text-gray-400 text-sm">Chargement...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                Aucun élément trouvé.
              </p>
            ) : (
              <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                  const selected = isSelected(item);
                  return (
                    <li
                      key={item.id}
                      onClick={() => toggleSelectItem(item)}
                      className={`px-3 py-2 rounded-md cursor-pointer text-sm flex justify-between items-center ${
                        selected
                          ? "bg-blue-600/70 text-white"
                          : "bg-gray-800 hover:bg-gray-750 text-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelectItem(item)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="truncate">
                          <span className="font-semibold mr-1">
                            {item.reference}
                          </span>
                          – {item.nom}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {item.emplacement}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Prévisualisation + impression */}
          <div className="flex flex-col gap-4">
            {selectedItems.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-gray-700 rounded-xl text-gray-500 text-sm">
                Coche un ou plusieurs éléments pour générer les étiquettes.
              </div>
            ) : (
              <>
                {/* Zone imprimable */}
                <div
                  id="print-area"
                  className="bg-transparent text-black flex flex-col gap-4"
                >
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="label-card bg-white rounded-xl shadow-xl border border-gray-300 w-[260px] h-[140px] flex flex-col overflow-hidden"
                    >
                      {/* Bandeau référence + type */}
                      <div className="bg-gray-800 text-white px-4 py-1 flex justify-between items-center">
                        <span className="text-xs tracking-[0.16em] font-semibold uppercase">
                          {item.reference}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">
                          {currentTypeLabel}
                        </span>
                      </div>

                      {/* Corps : nom + emplacement + QR */}
                      <div className="flex flex-1 px-4 py-2">
                        <div className="flex-1 pr-2 flex flex-col justify-between">
                          <div className="text-[11px] font-semibold leading-snug">
                            {item.nom}
                          </div>
                          <div className="mt-2 text-[9px] text-gray-600">
                            Emplacement :{" "}
                            <span className="font-medium">
                              {item.emplacement || "-"}
                            </span>
                          </div>
                        </div>
                        <div className="w-[70px] h-[70px] flex items-center justify-center">
                          <QRCodeSVG
                            value={getScanUrl(item)}
                            size={70}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>

                      {/* Bas : ID en petit dans un léger bandeau */}
                      <div className="px-4 pb-2 text-[8px] text-gray-500">
                        ID : {item.id}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bouton imprimer */}
                <button
                  onClick={handlePrint}
                  className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-md shadow-md"
                >
                  🖨️ Imprimer {selectedItems.length} étiquette
                  {selectedItems.length > 1 ? "s" : ""}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
