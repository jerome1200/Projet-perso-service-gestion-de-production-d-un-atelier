"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function GestionStockPage() {
  const [borneId, setBorneId] = useState<number | null>(null);
  const [allBornes, setAllBornes] = useState<any[]>([]);
  const [type, setType] = useState("piece");

  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 🔩 Pièces
  const [allPieces, setAllPieces] = useState<any[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [selectedNombre, setSelectedNombre] = useState(1);
  const [searchPiece, setSearchPiece] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 🧬 SSA
  const [allSsas, setAllSsas] = useState<any[]>([]);
  const [selectedSsaId, setSelectedSsaId] = useState<number | null>(null);
  const [selectedSsaNombre, setSelectedSsaNombre] = useState(1);
  const [searchSsa, setSearchSsa] = useState("");
  const [showSsaSuggestions, setShowSsaSuggestions] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // 🗺️ Mapping centralisé
  const endpoints: Record<string, string> = {
    piece: "pieces",
    kit: "kits",
    sousAssemblage: "sous-assemblages",
    sousSousAssemblage: "sous-sous-assemblages",
  };

  const relationEndpoints: Record<string, string> = {
    kit: "kit-pieces",
    sousAssemblage: "sous-assemblage-pieces",
    sousSousAssemblage: "sous-sous-assemblage-pieces",
  };

  const endpoint = endpoints[type];
  const relationEndpoint = relationEndpoints[type] || null;

  // Relation spécifique SA ↔ SSA
  const SSA_RELATION_ENDPOINT = "sous-assemblage-ssas";

  // 🔁 États possibles (comme sur la page de création)
  const pieceEtats = [
    { value: "RD", label: "R&D" },
    { value: "PRODUCTION", label: "Production" },
    { value: "MAINTENANCE", label: "Maintenance" },
  ];

  // ---------- Helpers pour référence / version ----------

  const getReferencePrefix = (pieceType: string): string => {
    switch (pieceType) {
      case "COMMERCE":
        return "C";
      case "ELEC":
        return "E";
      case "PIECE_3D":
        return "D";
      case "CABLE_SM":
        return "F";
      case "TOLERIE":
        return "P";
      case "OUTIL":
        return "O";
      case "SSA":
        return "SSA";
      case "KITS":
        return "K";
      case "SA":
        return "SA";
      default:
        return "";
    }
  };

  const shouldIncludeVersion = (pieceType: string): boolean => {
    switch (pieceType) {
      case "TOLERIE":
      case "SSA":
      case "SA":
        return false; // TypeNumero
      default:
        return true; // TypeNumeroVersion
    }
  };

  // 📡 Charger bornes
  const fetchAllBornes = async () => {
    try {
      const res = await axios.get(`${API_URL}/bornes`);
      setAllBornes(res.data);
    } catch (err) {
      console.error("Erreur chargement bornes:", err);
    }
  };

  // 📦 Charger items selon le type et la borne
  const fetchItems = async () => {
    if (!borneId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/${endpoint}?borneId=${borneId}`);
      setItems(res.data);
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔩 Charger toutes les pièces (pour les ajouts)
  const fetchAllPieces = async () => {
    try {
      const res = await axios.get(`${API_URL}/pieces`);
      setAllPieces(res.data);
    } catch (err) {
      console.error("Erreur chargement pièces:", err);
    }
  };

  // 🧬 Charger les SSA (filtrés par borne côté backend)
  const fetchAllSsas = async () => {
    if (!borneId) return;
    try {
      const res = await axios.get(
        `${API_URL}/sous-sous-assemblages?borneId=${borneId}`,
      );
      setAllSsas(res.data);
    } catch (err) {
      console.error("Erreur chargement SSA:", err);
    }
  };

  useEffect(() => {
    fetchAllBornes();
  }, []);

  useEffect(() => {
    if (borneId) {
      fetchItems();
      fetchAllPieces();
      fetchAllSsas();
    } else {
      setItems([]);
      setSelectedItem(null);
    }
  }, [type, borneId]);

  // 🧱 Mise à jour d’un item
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (selectedItem) {
      const { name, value } = e.target;
      const updated: any = { ...selectedItem, [name]: value };

      // Si on modifie la version → recalculer la référence
      if (name === "version") {
        const pieceType = updated.type; // enum backend: COMMERCE, SA, SSA, KITS, etc.
        const prefix = getReferencePrefix(pieceType);
        if (prefix) {
          const includeVersion = shouldIncludeVersion(pieceType);
          const ver = includeVersion ? (updated.version || "A") : "";
          const refNumero = updated.numero || ""; // on garde le même numéro
          updated.reference = `${prefix}${refNumero}${ver}`;
        }
      }

      setSelectedItem(updated);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      await axios.patch(`${API_URL}/${endpoint}/${selectedItem.id}`, {
        nom: selectedItem.nom,
        reference: selectedItem.reference,
        nombre: Number(selectedItem.nombre),
        emplacement: selectedItem.emplacement,
        photo: selectedItem.photo ?? "",
        seuilAlerte: Number(selectedItem.seuilAlerte ?? 0),
        etat: selectedItem.etat ?? "PRODUCTION",
        version: selectedItem.version ?? "A",
        // numero déjà géré côté backend, on ne le touche pas ici
      });

      setMessage("✅ Élément mis à jour avec succès !");
      fetchItems();
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur lors de la mise à jour");
    }
  };

  // 🔍 Filtres
  const filteredItems = items.filter((i) =>
    i.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pièces filtrées (exclure celles déjà liées)
  const filteredPieces = allPieces.filter((p) => {
    const match =
      p.nom.toLowerCase().includes(searchPiece.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchPiece.toLowerCase());

    const alreadyLinked = selectedItem?.pieces?.some(
      (linked: any) => linked.piece.id === p.id,
    );

    const sameBorne =
      !borneId ||
      (Array.isArray(p.bornes) &&
        p.bornes.some((b: any) => b.id === borneId));

    return match && !alreadyLinked && sameBorne;
  });

  // SSA filtrés (exclure ceux déjà liés au SA)
  const filteredSsas = allSsas.filter((ssa) => {
    const match =
      ssa.nom.toLowerCase().includes(searchSsa.toLowerCase()) ||
      ssa.reference.toLowerCase().includes(searchSsa.toLowerCase());

    const alreadyLinked = selectedItem?.sousSousAssemblages?.some(
      (linked: any) => linked.sousSousAssemblage.id === ssa.id,
    );

    return match && !alreadyLinked;
  });

  // ➕ Ajouter une pièce
  const handleAddPiece = async () => {
    if (!selectedPieceId || !selectedItem || !relationEndpoint) return;

    try {
      await axios.post(`${API_URL}/${relationEndpoint}`, {
        [`${type}Id`]: selectedItem.id,
        pieceId: selectedPieceId,
        nombre: selectedNombre,
      });

      setMessage("✅ Pièce ajoutée !");
      const updated = await axios.get(
        `${API_URL}/${endpoint}/${selectedItem.id}`,
      );
      setSelectedItem(updated.data);

      setSelectedPieceId(null);
      setSelectedNombre(1);
      setSearchPiece("");
      setShowSuggestions(false);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l’ajout de la pièce");
    }
  };

  // ✏️ Modifier quantité pièce
  const handleUpdatePieceQuantity = async (
    pieceId: number,
    newNombre: number,
  ) => {
    if (!selectedItem || !relationEndpoint) return;

    try {
      await axios.patch(
        `${API_URL}/${relationEndpoint}/${selectedItem.id}/${pieceId}`,
        {
          nombre: newNombre,
        },
      );

      setMessage("✅ Quantité mise à jour !");
      const updated = await axios.get(
        `${API_URL}/${endpoint}/${selectedItem.id}`,
      );
      setSelectedItem(updated.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour de la quantité");
    }
  };

  // ❌ Supprimer une pièce
  const handleRemovePiece = async (pieceId: number) => {
    if (!selectedItem || !relationEndpoint) return;

    try {
      await axios.delete(
        `${API_URL}/${relationEndpoint}/${selectedItem.id}/${pieceId}`,
      );
      setMessage("✅ Pièce retirée !");
      const updated = await axios.get(
        `${API_URL}/${endpoint}/${selectedItem.id}`,
      );
      setSelectedItem(updated.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la suppression");
    }
  };

  // ➕ Ajouter un SSA à un SA
  const handleAddSsa = async () => {
    if (!selectedSsaId || !selectedItem) return;
    if (type !== "sousAssemblage") return;

    try {
      await axios.post(`${API_URL}/${SSA_RELATION_ENDPOINT}`, {
        sousAssemblageId: selectedItem.id,
        sousSousAssemblageId: selectedSsaId,
        nombre: selectedSsaNombre,
      });

      setMessage("✅ SSA ajouté au sous-assemblage !");
      const updated = await axios.get(
        `${API_URL}/${endpoint}/${selectedItem.id}`,
      );
      setSelectedItem(updated.data);

      setSelectedSsaId(null);
      setSelectedSsaNombre(1);
      setSearchSsa("");
      setShowSsaSuggestions(false);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l’ajout du SSA");
    }
  };

  // ✏️ Modifier quantité d’un SSA lié
  const handleUpdateSsaQuantity = async (
    linkId: number,
    newNombre: number,
  ) => {
    if (!selectedItem) return;
    if (type !== "sousAssemblage") return;

    try {
      await axios.patch(`${API_URL}/${SSA_RELATION_ENDPOINT}/${linkId}`, {
        nombre: newNombre,
      });

      setMessage("✅ Quantité du SSA mise à jour !");
      const updated = await axios.get(
        `${API_URL}/${endpoint}/${selectedItem.id}`,
      );
      setSelectedItem(updated.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour du SSA");
    }
  };

  // ❌ Supprimer un SSA lié
  const handleRemoveSsa = async (linkId: number) => {
    if (!selectedItem) return;
    if (type !== "sousAssemblage") return;

    try {
      await axios.delete(`${API_URL}/${SSA_RELATION_ENDPOINT}/${linkId}`);

      setMessage("✅ SSA retiré du sous-assemblage !");
      const updated = await axios.get(
        `${API_URL}/${endpoint}/${selectedItem.id}`,
      );
      setSelectedItem(updated.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la suppression du SSA");
    }
  };

  // 🗑 Supprimer un élément
  const handleDelete = async () => {
    if (!selectedItem) return;

    if (
      !confirm(
        `⚠️ Es-tu sûr de vouloir supprimer "${selectedItem.nom}" ?\nToutes les pièces associées seront également supprimées.`,
      )
    ) {
      return;
    }

    try {
      if (relationEndpoint) {
        await axios.delete(
          `${API_URL}/${relationEndpoint}/all/${Number(selectedItem.id)}`,
        );
      }

      await axios.delete(
        `${API_URL}/${endpoint}/${Number(selectedItem.id)}`,
      );

      setMessage(`✅ ${selectedItem.nom} supprimé avec succès !`);
      setSelectedItem(null);
      fetchItems();
    } catch (err: any) {
      console.error("Erreur de suppression :", err.response?.data || err.message);
      setMessage("❌ Erreur lors de la suppression");
    }
  };

  // Fermer suggestions quand on clique ailleurs
  useEffect(() => {
    const onDocClick = () => {
      setShowSuggestions(false);
      setShowSsaSuggestions(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Helper warning
  const isLow = (item: any) =>
    item &&
    typeof item.nombre === "number" &&
    typeof item.seuilAlerte === "number" &&
    item.seuilAlerte > 0 &&
    item.nombre <= item.seuilAlerte;

  // === Rendu ===
  return (
    <div className="max-w-5xl mx-auto bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-200 mb-6">
        ⚙️ Gestion du stock
      </h1>

      {/* Sélecteur de borne et type */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-gray-300 mr-2">Borne :</label>
          <select
            value={borneId ?? ""}
            onChange={(e) => {
              setBorneId(e.target.value ? Number(e.target.value) : null);
              setSelectedItem(null);
            }}
            className="bg-gray-800 border border-gray-700 text-gray-200 p-2 rounded-md"
          >
            <option value="">-- Sélectionner une borne --</option>
            {allBornes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-300 mr-2">Type :</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setSelectedItem(null);
            }}
            className="bg-gray-800 border border-gray-700 text-gray-200 p-2 rounded-md"
          >
            <option value="piece">Pièce</option>
            <option value="sousAssemblage">Sous-assemblage</option>
            <option value="sousSousAssemblage">Sous-sous-assemblage</option>
            <option value="kit">Kit</option>
          </select>
        </div>
      </div>

      {!borneId && (
        <p className="text-gray-400 italic mb-4">
          🔎 Sélectionnez une borne pour afficher ses éléments.
        </p>
      )}

      {borneId && (
        <>
          <input
            type="text"
            placeholder="Rechercher un élément..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-3 p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
          />

          <div className="max-h-40 overflow-y-auto mb-4 border border-gray-700 rounded-md bg-gray-900">
            {loading ? (
              <p className="p-3 text-gray-400 text-sm text-center">
                Chargement...
              </p>
            ) : filteredItems.length > 0 ? (
              filteredItems.slice(0, 20).map((i) => (
                <div
                  key={i.id}
                  onClick={() => setSelectedItem(i)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-700 flex items-center justify-between ${
                    selectedItem?.id === i.id ? "bg-gray-700" : ""
                  }`}
                >
                  <span>{i.nom}</span>
                  {isLow(i) && (
                    <span className="text-amber-400 text-sm ml-2">⚠️</span>
                  )}
                </div>
              ))
            ) : (
              <p className="p-3 text-gray-400 text-sm text-center">
                Aucun résultat
              </p>
            )}
          </div>
        </>
      )}

      {/* Formulaire d’édition */}
      {selectedItem && (
        <div className="space-y-6 mt-6 border-t border-gray-700 pt-4">
          <h2 className="text-lg text-gray-200 font-semibold">
            ✏️ Modifier : {selectedItem.nom}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Nom</label>
              <input
                name="nom"
                value={selectedItem.nom}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Référence</label>
              <input
                name="reference"
                value={selectedItem.reference}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Quantité</label>
              <input
                type="number"
                name="nombre"
                value={selectedItem.nombre ?? 0}
                onChange={handleChange}
                min={0}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">
                Seuil d’alerte (minimum)
              </label>
              <input
                type="number"
                name="seuilAlerte"
                value={selectedItem.seuilAlerte ?? 0}
                onChange={handleChange}
                min={0}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              />
              {isLow(selectedItem) && (
                <p className="text-amber-400 text-xs mt-1">
                  ⚠️ Stock sous le seuil d’alerte
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Emplacement</label>
              <input
                name="emplacement"
                value={selectedItem.emplacement ?? ""}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              />
            </div>
          </div>

          {/* Etat + Version */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">État</label>
              <select
                name="etat"
                value={selectedItem.etat ?? "PRODUCTION"}
                onChange={handleChange}
                className="w-full h-11 px-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              >
                {pieceEtats.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Version</label>
              <input
                name="version"
                value={selectedItem.version ?? "A"}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                placeholder="Ex : A, B, C..."
              />
            </div>
          </div>

          {/* 🖼️ Photo */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-gray-300 mb-1">Photo (URL)</label>
              <input
                type="text"
                name="photo"
                value={selectedItem.photo ?? ""}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Colle ici l’URL de l’image (hébergée sur ton serveur ou
                ailleurs).
              </p>
            </div>

            {selectedItem.photo && (
              <div className="flex flex-col items-center">
                <span className="text-gray-300 text-sm mb-1">Aperçu</span>
                <img
                  src={selectedItem.photo}
                  alt={selectedItem.nom}
                  className="max-h-32 object-contain border border-gray-700 rounded-md bg-black px-2"
                />
              </div>
            )}
          </div>

          {/* Pièces associées pour kit / SA / SSA */}
          {(type === "kit" ||
            type === "sousAssemblage" ||
            type === "sousSousAssemblage") && (
            <>
              <h3 className="text-gray-200 font-semibold">
                🧱 Pièces associées
              </h3>
              {selectedItem.pieces?.length ? (
                <ul className="space-y-2 mb-4">
                  {selectedItem.pieces.map((p: any) => (
                    <li
                      key={p.piece.id}
                      className="flex justify-between items-center bg-gray-900 p-2 rounded-md border border-gray-700"
                    >
                      <div>
                        <span className="font-medium text-gray-200">
                          {p.piece.nom}
                        </span>{" "}
                        <span className="text-gray-500">
                          ({p.piece.reference})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={p.nombre}
                          onChange={(e) =>
                            handleUpdatePieceQuantity(
                              p.piece.id,
                              Number(e.target.value),
                            )
                          }
                          className="w-20 text-center p-1 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                        />
                        <button
                          onClick={() => handleRemovePiece(p.piece.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ❌
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic mb-3">
                  Aucune pièce liée à cet élément.
                </p>
              )}

              {/* Autocomplete ajout de pièce */}
              <div className="mt-3 space-y-3">
                <div
                  className="relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSuggestions(true);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Rechercher une pièce (même borne)..."
                    value={searchPiece}
                    onChange={(e) => {
                      setSearchPiece(e.target.value);
                      setShowSuggestions(true);
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                  />

                  {showSuggestions &&
                    searchPiece &&
                    filteredPieces.length > 0 && (
                      <ul className="border border-gray-700 rounded-md w-full mt-1 max-h-48 overflow-y-auto bg-gray-900 shadow-lg">
                        {filteredPieces.map((p) => (
                          <li
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPieceId(p.id);
                              setSearchPiece(`${p.nom}`);
                              setShowSuggestions(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
                          >
                            {p.nom}{" "}
                            <span className="text-gray-500 text-sm">
                              ({p.reference})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={selectedNombre}
                    onChange={(e) =>
                      setSelectedNombre(Number(e.target.value))
                    }
                    className="w-24 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                  />

                  <button
                    type="button"
                    onClick={handleAddPiece}
                    disabled={!selectedPieceId}
                    className={`px-4 py-2 rounded-md font-semibold transition-all ${
                      selectedPieceId
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    ➕ Ajouter
                  </button>
                </div>
              </div>
            </>
          )}

          {/* SSA associés au SA */}
          {type === "sousAssemblage" && (
            <>
              <h3 className="text-gray-200 font-semibold mt-6">
                🧬 Sous-sous-assemblages (SSA) associés
              </h3>

              {selectedItem.sousSousAssemblages?.length ? (
                <ul className="space-y-2 mb-4">
                  {selectedItem.sousSousAssemblages.map((s: any) => (
                    <li
                      key={s.sousSousAssemblage.id}
                      className="flex justify-between items-center bg-gray-900 p-2 rounded-md border border-gray-700"
                    >
                      <div>
                        <span className="font-medium text-gray-200">
                          {s.sousSousAssemblage.nom}
                        </span>{" "}
                        <span className="text-gray-500">
                          ({s.sousSousAssemblage.reference})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={s.nombre}
                          onChange={(e) =>
                            handleUpdateSsaQuantity(
                              s.id,
                              Number(e.target.value),
                            )
                          }
                          className="w-20 text-center p-1 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                        />
                        <button
                          onClick={() => handleRemoveSsa(s.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ❌
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic mb-3">
                  Aucun SSA lié à ce sous-assemblage.
                </p>
              )}

              {/* Autocomplete ajout de SSA */}
              <div className="mt-3 space-y-3">
                <div
                  className="relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSsaSuggestions(true);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Rechercher un SSA..."
                    value={searchSsa}
                    onChange={(e) => {
                      setSearchSsa(e.target.value);
                      setShowSsaSuggestions(true);
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                  />

                  {showSsaSuggestions &&
                    searchSsa &&
                    filteredSsas.length > 0 && (
                      <ul className="border border-gray-700 rounded-md w-full mt-1 max-h-48 overflow-y-auto bg-gray-900 shadow-lg">
                        {filteredSsas.map((s) => (
                          <li
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSsaId(s.id);
                              setSearchSsa(s.nom);
                              setShowSsaSuggestions(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
                          >
                            {s.nom}{" "}
                            <span className="text-gray-500 text-sm">
                              ({s.reference})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={selectedSsaNombre}
                    onChange={(e) =>
                      setSelectedSsaNombre(Number(e.target.value))
                    }
                    className="w-24 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                  />

                  <button
                    type="button"
                    onClick={handleAddSsa}
                    disabled={!selectedSsaId}
                    className={`px-4 py-2 rounded-md font-semibold transition-all ${
                      selectedSsaId
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    ➕ Ajouter SSA
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-md"
            >
              💾 Enregistrer les modifications
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-700 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-md"
            >
              🗑 Supprimer
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-center ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
