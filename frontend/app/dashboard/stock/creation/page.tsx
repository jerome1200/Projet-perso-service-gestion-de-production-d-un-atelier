"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import axios from "axios";
import Papa from "papaparse";

type PieceFromApi = {
  id: number;
  nom: string;
  reference: string;
  type: string; // enum PieceType côté backend
};

type SousAssemblageFromApi = {
  id: number;
  nom: string;
  reference: string;
};

type SousSousAssemblageFromApi = {
  id: number;
  nom: string;
  reference: string;
};

type KitFromApi = {
  id: number;
  nom: string;
  reference: string;
};

type Borne = { id: number; nom: string };

type RawCsvRow = {
  "Nom pièce (Key)": string;
  "Nom pièce"?: string;
  Etat?: string;
  "Type de Suivi"?: string;
  "Type de Suivi_1"?: string;
  Numéro?: string;
  Version?: string;
  Nom?: string;
  jetv1?: string;
  jetv2?: string;
  collector?: string;
  modular?: string;
  flash?: string;
  dressing?: string;
  flash360?: string;
  rs?: string;
  ts?: string;
  Emplacement?: string;
  "SA Concerné"?: string;
  "Nbr / machine"?: string;
};

export default function CreationPage() {
  const [type, setType] = useState("piece"); // "piece" | "kit" | "sousAssemblage" | "sousSousAssemblage"
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [pieces, setPieces] = useState<PieceFromApi[]>([]);
  const [sas, setSas] = useState<SousAssemblageFromApi[]>([]);
  const [ssas, setSsas] = useState<SousSousAssemblageFromApi[]>([]);
  const [kits, setKits] = useState<KitFromApi[]>([]);

  const [addedPieces, setAddedPieces] = useState<
    { pieceId: number; nom: string; nombre: number }[]
  >([]);
  const [addedSsas, setAddedSsas] = useState<
    { ssaId: number; nom: string; nombre: number }[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [selectedNombre, setSelectedNombre] = useState(1);
  const [loadingPieces, setLoadingPieces] = useState(false);

  const [searchTermSsa, setSearchTermSsa] = useState("");
  const [selectedSsaId, setSelectedSsaId] = useState<number | null>(null);
  const [selectedSsaNombre, setSelectedSsaNombre] = useState(1);
  const [loadingSsas, setLoadingSsas] = useState(false);

  const [selectedBorneIds, setSelectedBorneIds] = useState<number[]>([]);

  const [form, setForm] = useState({
    nom: "",
    reference: "",
    nombre: 0,
    emplacement: "",
    photo: "",
    seuilAlerte: 0,

    pieceType: "COMMERCE",
    etat: "PRODUCTION",
    version: "A",
    numero: "",
  });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

  const endpoint = `${API_URL}/${endpoints[type]}`;
  const relationEndpoint = relationEndpoints[type]
    ? `${API_URL}/${relationEndpoints[type]}`
    : null;

  const SSA_RELATION_ENDPOINT = `${API_URL}/sous-assemblage-ssas`;

  const pieceTypes = [
    { value: "COMMERCE", label: "Commerce" },
    { value: "ELEC", label: "Élec" },
    { value: "PIECE_3D", label: "Pièce 3D" },
    { value: "CABLE_SM", label: "Câble SM" },
    { value: "TOLERIE", label: "Tôlerie" },
    { value: "OUTIL", label: "Outil" },
    { value: "SSA", label: "SSA" },
    { value: "SA", label: "SA" },
    { value: "KITS", label: "Kits" },
  ];

  const pieceEtats = [
    { value: "RD", label: "R&D" },
    { value: "PRODUCTION", label: "Production" },
    { value: "MAINTENANCE", label: "Maintenance" },
  ];

  // ---------- Helpers ref / numéro ----------

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
        return true; // TypeNumeroVersion (kits compris)
    }
  };

  // pour les pièces "normales" uniquement
  const computeNextNumeroAndReference = (
    pieceType: string,
    version: string,
    piecesList: PieceFromApi[],
  ) => {
    const prefix = getReferencePrefix(pieceType);
    if (!prefix) {
      return { numero: "", reference: "" };
    }

    let maxNum = 0;

    for (const p of piecesList) {
      if (p.type !== pieceType) continue;
      if (!p.reference || !p.reference.startsWith(prefix)) continue;

      const rest = p.reference.slice(prefix.length);
      const numMatch = rest.match(/^\d+/);
      if (!numMatch) continue;

      const n = parseInt(numMatch[0], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }

    const nextNum = maxNum + 1;
    const numero = String(nextNum).padStart(3, "0");
    const includeVersion = shouldIncludeVersion(pieceType);
    const ver = includeVersion ? (version || "A") : "";
    const reference = `${prefix}${numero}${ver}`;

    return { numero, reference };
  };

  // SSA / SA / kit / piece depuis "Nom pièce (Key)"
  const getKindFromKey = (
    key: string,
  ): "piece" | "sousAssemblage" | "sousSousAssemblage" | "kit" => {
    const cleaned = key.replace(/\s+/g, "");
    if (cleaned.startsWith("SSA")) return "sousSousAssemblage";
    if (cleaned.startsWith("SA")) return "sousAssemblage";
    if (cleaned.startsWith("K")) return "kit";
    return "piece";
  };

  const mapTypeSuiviToPieceType = (label?: string): string => {
    if (!label) return "COMMERCE";

    const normalized = label
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

    if (normalized.includes("3d")) return "PIECE_3D";
    if (normalized.includes("cables") || normalized.includes("cable"))
      return "CABLE_SM";
    if (normalized.includes("tolerie")) return "TOLERIE";
    if (normalized.includes("outil")) return "OUTIL";
    if (normalized.includes("elec")) return "ELEC";
    if (normalized.includes("commerce")) return "COMMERCE";

    return "COMMERCE";
  };

  const getBorneIdsFromRow = (row: RawCsvRow, bornes: Borne[]): number[] => {
    const borneColumns = [
      "jetv1",
      "jetv2",
      "collector",
      "modular",
      "flash",
      "dressing",
      "flash360",
      "rs",
      "ts",
    ] as const;

    const rowLower: Record<string, string | undefined> = {};
    Object.entries(row).forEach(([k, v]) => {
      if (typeof v === "string") {
        rowLower[k.toLowerCase()] = v;
      }
    });

    return bornes
      .map((b) => {
        const borneName = b.nom.toLowerCase();
        if (!borneColumns.includes(borneName as any)) {
          return null;
        }

        const rawVal = rowLower[borneName];
        const val = rawVal?.trim();

        if (!val) return null;

        const num = Number(val.replace(",", "."));
        if (num === 1) {
          return b.id;
        }

        return null;
      })
      .filter((id): id is number => id !== null);
  };

  // ---------- Chargement bornes + pièces + SA + SSA + kits ----------

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bornesRes, piecesRes, sasRes, ssasRes, kitsRes] =
          await Promise.all([
            axios.get(`${API_URL}/bornes`),
            axios.get(`${API_URL}/pieces`),
            axios.get(`${API_URL}/sous-assemblages`),
            axios.get(`${API_URL}/sous-sous-assemblages`),
            axios.get(`${API_URL}/kits`),
          ]);
        setBornes(bornesRes.data as Borne[]);
        setPieces(piecesRes.data as PieceFromApi[]);
        setSas(sasRes.data as SousAssemblageFromApi[]);
        setSsas(ssasRes.data as SousSousAssemblageFromApi[]);
        setKits(kitsRes.data as KitFromApi[]);
      } catch (err) {
        console.error("Erreur chargement bornes / pièces / SA / SSA / kits:", err);
      }
    };
    fetchData();
  }, []);

  const fetchPieces = async () => {
    try {
      setLoadingPieces(true);
      const res = await axios.get(`${API_URL}/pieces`);
      setPieces(res.data as PieceFromApi[]);
    } catch (err) {
      console.error("Erreur rechargement pièces:", err);
    } finally {
      setLoadingPieces(false);
    }
  };

  const fetchSas = async () => {
    try {
      const res = await axios.get(`${API_URL}/sous-assemblages`);
      setSas(res.data as SousAssemblageFromApi[]);
    } catch (err) {
      console.error("Erreur rechargement SA:", err);
    }
  };

  const fetchSsas = async () => {
    try {
      setLoadingSsas(true);
      const res = await axios.get(`${API_URL}/sous-sous-assemblages`);
      setSsas(res.data as SousSousAssemblageFromApi[]);
    } catch (err) {
      console.error("Erreur rechargement SSA:", err);
    } finally {
      setLoadingSsas(false);
    }
  };

  const fetchKits = async () => {
    try {
      const res = await axios.get(`${API_URL}/kits`);
      setKits(res.data as KitFromApi[]);
    } catch (err) {
      console.error("Erreur rechargement kits:", err);
    }
  };

  // ---------- Form handlers ----------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "numero" || name === "version") {
        const prefix = getReferencePrefix(updated.pieceType);
        if (prefix) {
          const includeVersion = shouldIncludeVersion(updated.pieceType);
          const ver = includeVersion ? (updated.version || "A") : "";
          const refNumero = updated.numero || "";
          updated.reference = `${prefix}${refNumero}${ver}`;
        }
      }

      return updated;
    });
  };

  // auto-incrément quand le type de pièce change (uniquement quand on est sur "piece")
  useEffect(() => {
    if (type !== "piece") return;

    const { numero, reference } = computeNextNumeroAndReference(
      form.pieceType,
      form.version,
      pieces,
    );
    if (!reference) return;

    setForm((prev) => ({
      ...prev,
      numero,
      reference,
    }));
  }, [type, form.pieceType, pieces]);

  const toggleBorneSelection = (id: number) => {
    setSelectedBorneIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id],
    );
  };

  // ---------- changement du type (pièce / SA / SSA / kit) ----------

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setAddedPieces([]);
    setAddedSsas([]);

    setForm((prev) => {
      // SSA : basé sur la liste ssas
      if (newType === "sousSousAssemblage") {
        const nextPieceType = "SSA";
        const prefix = getReferencePrefix(nextPieceType);

        let maxNum = 0;
        for (const s of ssas) {
          if (!s.reference || !s.reference.startsWith(prefix)) continue;
          const rest = s.reference.slice(prefix.length);
          const match = rest.match(/^\d+/);
          if (!match) continue;
          const n = parseInt(match[0], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }

        const nextNum = maxNum + 1;
        const numero = String(nextNum); // SSA1, SSA2...
        const reference = `${prefix}${numero}`;

        return {
          ...prev,
          pieceType: nextPieceType,
          numero,
          reference,
        };
      }

      // SA : basé sur la liste sas
      if (newType === "sousAssemblage") {
        const nextPieceType = "SA";
        const prefix = getReferencePrefix(nextPieceType);

        let maxNum = 0;
        for (const sa of sas) {
          if (!sa.reference || !sa.reference.startsWith(prefix)) continue;
          const rest = sa.reference.slice(prefix.length);
          const match = rest.match(/^\d+/);
          if (!match) continue;
          const n = parseInt(match[0], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }

        const nextNum = maxNum + 1;
        const numero = String(nextNum); // SA1, SA2...
        const reference = `${prefix}${numero}`;

        return {
          ...prev,
          pieceType: nextPieceType,
          numero,
          reference,
        };
      }

      // KIT : basé sur la liste kits (K60001A -> K60002A, etc.)
      if (newType === "kit") {
        const nextPieceType = "KITS";
        const prefix = getReferencePrefix(nextPieceType); // "K"

        let maxNum = 0;
        let maxDigits = 3; // par défaut K001A si aucune donnée

        for (const k of kits) {
          if (!k.reference || !k.reference.startsWith(prefix)) continue;
          const rest = k.reference.slice(prefix.length); // ex "60001A" ou "001A"
          const match = rest.match(/^\d+/); // partie numérique
          if (!match) continue;
          const digits = match[0];
          const n = parseInt(digits, 10);
          if (!isNaN(n) && n > maxNum) {
            maxNum = n;
            if (digits.length > maxDigits) {
              maxDigits = digits.length;
            }
          }
        }

        const nextNum = maxNum + 1;
        const numero = String(nextNum).padStart(maxDigits, "0"); // garde 60001 -> 60002, etc.
        const ver = form.version || "A";
        const reference = `${prefix}${numero}${ver}`;

        return {
          ...prev,
          pieceType: nextPieceType,
          numero,
          reference,
        };
      }

      // Cas standard pour les pièces "simples"
      let nextPieceType = prev.pieceType;

      switch (newType) {
        case "piece":
        default:
          if (["SA", "SSA", "KITS"].includes(prev.pieceType)) {
            nextPieceType = "COMMERCE";
          }
          break;
      }

      const prefix = getReferencePrefix(nextPieceType);
      let nextReference = prev.reference;
      if (prefix) {
        const includeVersion = shouldIncludeVersion(nextPieceType);
        const ver = includeVersion ? (prev.version || "A") : "";
        const refNumero = prev.numero || "";
        nextReference = `${prefix}${refNumero}${ver}`;
      }

      return {
        ...prev,
        pieceType: nextPieceType,
        reference: nextReference,
      };
    });
  };

  // ---------- Gestion pièces liées (Kit / SA / SSA) ----------

  const addPiece = () => {
    if (!selectedPieceId || selectedNombre <= 0) return;

    const piece = pieces.find((p) => p.id === selectedPieceId);
    if (!piece) return;

    if (addedPieces.some((p) => p.pieceId === piece.id)) {
      setMessage("⚠️ Cette pièce est déjà ajoutée.");
      return;
    }

    setAddedPieces((prev) => [
      ...prev,
      { pieceId: piece.id, nom: piece.nom, nombre: selectedNombre },
    ]);

    setSearchTerm("");
    setSelectedPieceId(null);
    setSelectedNombre(1);
  };

  const removePiece = (pieceId: number) => {
    setAddedPieces((prev) => prev.filter((p) => p.pieceId !== pieceId));
  };

  // ---------- Gestion SSA liés (uniquement pour SA) ----------

  const addSsa = () => {
    if (!selectedSsaId || selectedSsaNombre <= 0) return;

    const ssaFound = ssas.find((s) => s.id === selectedSsaId);
    if (!ssaFound) return;

    if (addedSsas.some((s) => s.ssaId === ssaFound.id)) {
      setMessage("⚠️ Ce SSA est déjà ajouté à ce sous-assemblage.");
      return;
    }

    setAddedSsas((prev) => [
      ...prev,
      { ssaId: ssaFound.id, nom: ssaFound.nom, nombre: selectedSsaNombre },
    ]);

    setSearchTermSsa("");
    setSelectedSsaId(null);
    setSelectedSsaNombre(1);
  };

  const removeSsa = (ssaId: number) => {
    setAddedSsas((prev) => prev.filter((s) => s.ssaId !== ssaId));
  };

  // ---------- Import CSV ----------

  const handleCsvImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setLoading(true);

    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data.filter(
            (r: RawCsvRow) => r["Nom pièce (Key)"],
          );

          for (const row of rows) {
            const key = row["Nom pièce (Key)"].trim();

            const kind = getKindFromKey(key);

            const reference = key.split("_")[0].trim();

            const numero = (row.Numéro || "").toString().trim();
            const version = (row.Version || "").toString().trim();
            const nom =
              (
                row.Nom ||
                row["Nom pièce"] ||
                row["Nom pièce (Key)"]
              )?.trim() ?? "";

            let pieceType = "COMMERCE";
            if (kind === "piece") {
              pieceType = mapTypeSuiviToPieceType(row["Type de Suivi_1"]);
            } else if (kind === "sousAssemblage") {
              pieceType = "SA";
            } else if (kind === "sousSousAssemblage") {
              pieceType = "SSA";
            } else if (kind === "kit") {
              pieceType = "KITS";
            }

            const borneIds = getBorneIdsFromRow(row, bornes);
            if (borneIds.length === 0) {
              console.warn(
                `Ligne ignorée (pas de borne) pour la pièce : ${nom} [${key}]`,
              );
              continue;
            }

            let url = `${API_URL}/pieces`;
            if (kind === "sousAssemblage") {
              url = `${API_URL}/sous-assemblages`;
            } else if (kind === "sousSousAssemblage") {
              url = `${API_URL}/sous-sous-assemblages`;
            } else if (kind === "kit") {
              url = `${API_URL}/kits`;
            }

            const payload = {
              nom,
              reference,
              nombre: 0,
              emplacement: "",
              photo: undefined,
              seuilAlerte: 0,
              type: pieceType,
              etat: form.etat,
              version: version || null,
              numero: numero || null,
              borneIds,
            };

            await axios.post(url, payload);
          }

          await fetchPieces();
          await fetchSas();
          await fetchSsas();
          await fetchKits();

          setMessage("✅ Import CSV terminé !");
        } catch (err) {
          console.error(err);
          setMessage("❌ Erreur lors de l'import CSV.");
        } finally {
          setLoading(false);
          e.target.value = "";
        }
      },
      error: (error) => {
        console.error(error);
        setMessage("❌ Erreur pendant la lecture du fichier CSV.");
        setLoading(false);
      },
    });
  };

  // ---------- Submit ----------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (selectedBorneIds.length === 0) {
      setMessage("❌ Vous devez sélectionner au moins un type de borne.");
      setLoading(false);
      return;
    }

    try {
      let finalNumero = form.numero;
      let finalReference = form.reference;

      if (type === "piece") {
        const nameExists = pieces.some(
          (p) => p.nom.toLowerCase() === form.nom.trim().toLowerCase(),
        );
        if (nameExists) {
          setMessage("❌ Nom déjà utilisé, merci d’en choisir un autre.");
          setLoading(false);
          return;
        }

        const refExists = pieces.some(
          (p) => p.reference === form.reference.trim(),
        );
        if (refExists) {
          const { numero, reference } = computeNextNumeroAndReference(
            form.pieceType,
            form.version,
            pieces,
          );
          finalNumero = numero;
          finalReference = reference;

          setForm((prev) => ({
            ...prev,
            numero,
            reference,
          }));
        }
      }

      const basePayload: any = {
        nom: form.nom,
        reference: finalReference,
        nombre: Number(form.nombre),
        emplacement: form.emplacement,
        photo: form.photo || undefined,
        seuilAlerte: Number(form.seuilAlerte) || 0,
        type: form.pieceType,
        etat: form.etat,
        version: form.version || "A",
        numero: finalNumero || null,
        borneIds: selectedBorneIds,
      };

      const res = await axios.post(endpoint, basePayload);
      const created = res.data;

      if (type !== "piece" && addedPieces.length > 0 && relationEndpoint) {
        for (const item of addedPieces) {
          await axios.post(relationEndpoint, {
            [`${type}Id`]: created.id,
            pieceId: item.pieceId,
            nombre: item.nombre,
          });
        }
      }

      if (type === "sousAssemblage" && addedSsas.length > 0) {
        for (const item of addedSsas) {
          await axios.post(SSA_RELATION_ENDPOINT, {
            sousAssemblageId: created.id,
            sousSousAssemblageId: item.ssaId,
            nombre: item.nombre,
          });
        }
      }

      setMessage("✅ Élément ajouté avec succès !");
      if (type === "piece") {
        await fetchPieces();
      } else if (type === "sousAssemblage") {
        await fetchSas();
      } else if (type === "sousSousAssemblage") {
        await fetchSsas();
      } else if (type === "kit") {
        await fetchKits();
      }

      setForm({
        nom: "",
        reference: "",
        nombre: 0,
        emplacement: "",
        photo: "",
        seuilAlerte: 0,
        pieceType: "COMMERCE",
        etat: "PRODUCTION",
        version: "A",
        numero: "",
      });
      setAddedPieces([]);
      setAddedSsas([]);
      setSelectedBorneIds([]);
    } catch (error: any) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          const msg = error.response?.data?.message || "";
          if (msg.includes("Référence"))
            setMessage(
              "❌ Référence déjà utilisée, merci d’en choisir une autre.",
            );
          else if (msg.includes("Nom"))
            setMessage("❌ Nom déjà utilisé, merci d’en choisir un autre.");
          else setMessage("❌ Élément déjà existant.");
        } else if (error.code === "ERR_NETWORK") {
          setMessage("❌ Impossible de se connecter au serveur.");
        } else {
          setMessage("❌ Une erreur est survenue lors de la création.");
        }
      } else {
        setMessage("❌ Une erreur inattendue est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- Rendu ----------

  const filteredPieces = pieces.filter((p) =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSsas = ssas.filter((s) =>
    s.nom.toLowerCase().includes(searchTermSsa.toLowerCase()),
  );

  return (
    <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-200 mb-6">
        🧩 Ajouter un élément
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type de création */}
        {/*<div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <label className="block text-gray-300 mb-2 font-medium">
            Importer des pièces depuis un CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvImport}
            disabled={loading}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
          />
          <p className="mt-2 text-xs text-gray-400">
            Colonnes attendues : <code>nom</code>, <code>nombre</code>,{" "}
            <code>seuilAlerte</code>, <code>emplacement</code>,{" "}
            <code>bornes</code> (séparées par <code>|</code>).
          </p>
        </div>*/}

        <div>
          <label className="block text-gray-300 mb-2 font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
          >
            <option value="piece">Pièce</option>
            <option value="sousAssemblage">Sous-assemblage</option>
            <option value="sousSousAssemblage">Sous-sous-assemblage</option>
            <option value="kit">Kit</option>
          </select>
        </div>

        {/* Bornes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-medium">
              Types de borne (plusieurs possibles)
            </label>
            <span className="text-xs text-gray-400">
              {selectedBorneIds.length === 0
                ? "Aucune sélection"
                : `${selectedBorneIds.length} sélectionnée(s)`}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 bg-gray-800 border border-gray-700 rounded-md p-3">
            {bornes.map((borne) => {
              const selected = selectedBorneIds.includes(borne.id);
              return (
                <button
                  key={borne.id}
                  type="button"
                  onClick={() => toggleBorneSelection(borne.id)}
                  className={`px-3 py-1 text-sm rounded-full border transition-all
            ${
              selected
                ? "bg-blue-600 border-blue-400 text-white shadow-md"
                : "bg-gray-900 border-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
                >
                  {borne.nom}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nom + Référence */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 mb-2">Nom</label>
            <input
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Référence</label>
            <input
              name="reference"
              value={form.reference}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            />
          </div>
        </div>

        {/* Quantité / seuil / emplacement */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-gray-300 mb-2">Quantité</label>
            <input
              type="number"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              min="0"
              required
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Seuil d’alerte (minimum)
            </label>
            <input
              type="number"
              name="seuilAlerte"
              value={form.seuilAlerte}
              onChange={handleChange}
              min="0"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Emplacement</label>
            <input
              name="emplacement"
              value={form.emplacement}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            />
          </div>
        </div>

        {/* Type / état / version / numéro */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 mb-2">
              Type (commerce / élec / etc.)
            </label>
            <select
              name="pieceType"
              value={form.pieceType}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            >
              {pieceTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">État</label>
            <select
              name="etat"
              value={form.etat}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            >
              {pieceEtats.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Version</label>
            <input
              name="version"
              value={form.version}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              placeholder="Ex : A, B, C..."
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Numéro</label>
            <input
              name="numero"
              value={form.numero}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              placeholder="Ex : 1, 2, 003, 2025-03, etc."
            />
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-gray-300 mb-2">
            Photo (URL facultative)
          </label>
          <input
            name="photo"
            value={form.photo}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
          />
        </div>

        {/* Liaisons pièces pour SA/SSA/Kit */}
        {(type === "kit" ||
          type === "sousAssemblage" ||
          type === "sousSousAssemblage") && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              🧱 Ajouter des pièces
            </h2>

            <input
              type="text"
              placeholder="🔍 Rechercher une pièce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-3 p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
            />

            <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-md mb-4 bg-gray-900">
              {loadingPieces ? (
                <p className="p-2 text-gray-400 text-sm text-center">
                  Chargement des pièces...
                </p>
              ) : filteredPieces.length > 0 ? (
                filteredPieces.slice(0, 20).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPieceId(p.id)}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${
                      selectedPieceId === p.id ? "bg-gray-700" : ""
                    }`}
                  >
                    {p.nom}
                  </div>
                ))
              ) : (
                <p className="p-2 text-gray-400 text-sm text-center">
                  Aucune pièce trouvée
                </p>
              )}
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="number"
                min="1"
                value={selectedNombre}
                onChange={(e) => setSelectedNombre(Number(e.target.value))}
                className="w-24 p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
              />

              <button
                type="button"
                onClick={addPiece}
                disabled={!selectedPieceId}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                ➕ Ajouter
              </button>
            </div>

            {addedPieces.length > 0 && (
              <ul className="space-y-2">
                {addedPieces.map((p) => (
                  <li
                    key={p.pieceId}
                    className="flex justify-between bg-gray-900 p-2 rounded-md border border-gray-700"
                  >
                    <span>
                      {p.nom} —{" "}
                      <span className="text-blue-400">{p.nombre}</span>{" "}
                      unité(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => removePiece(p.pieceId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Liaisons SSA pour SA */}
        {type === "sousAssemblage" && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              🧬 Ajouter des sous-sous-assemblages (SSA)
            </h2>

            <input
              type="text"
              placeholder="🔍 Rechercher un SSA..."
              value={searchTermSsa}
              onChange={(e) => setSearchTermSsa(e.target.value)}
              className="w-full mb-3 p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
            />

            <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-md mb-4 bg-gray-900">
              {loadingSsas ? (
                <p className="p-2 text-gray-400 text-sm text-center">
                  Chargement des SSA...
                </p>
              ) : filteredSsas.length > 0 ? (
                filteredSsas.slice(0, 20).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSsaId(s.id)}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${
                      selectedSsaId === s.id ? "bg-gray-700" : ""
                    }`}
                  >
                    {s.nom}
                  </div>
                ))
              ) : (
                <p className="p-2 text-gray-400 text-sm text-center">
                  Aucun SSA trouvé
                </p>
              )}
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="number"
                min="1"
                value={selectedSsaNombre}
                onChange={(e) => setSelectedSsaNombre(Number(e.target.value))}
                className="w-24 p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200"
              />

              <button
                type="button"
                onClick={addSsa}
                disabled={!selectedSsaId}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md text-white font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                ➕ Ajouter SSA
              </button>
            </div>

            {addedSsas.length > 0 && (
              <ul className="space-y-2">
                {addedSsas.map((s) => (
                  <li
                    key={s.ssaId}
                    className="flex justify-between bg-gray-900 p-2 rounded-md border border-gray-700"
                  >
                    <span>
                      {s.nom} —{" "}
                      <span className="text-purple-400">{s.nombre}</span>{" "}
                      unité(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSsa(s.ssaId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 rounded-md font-semibold transition-all ${
            loading
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
          }`}
        >
          {loading ? "Envoi en cours..." : "Créer"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-6 text-center font-medium ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
