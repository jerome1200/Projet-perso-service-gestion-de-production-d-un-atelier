"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

type Borne = { id: number; nom: string };

type ItemBase = { id: number; nom: string; reference?: string | null };

type LinkedItemForm = { id: number; quantity: number };

type TaskTemplate = {
  id: number;
  borneId: number | null;
  label: string;
  description?: string | null;
  order?: number | null;
  active: boolean;
  pieces: {
    id: number;
    quantity: number;
    piece: ItemBase;
  }[];
  sousAssemblages: {
    id: number;
    quantity: number;
    sousAssemblage: ItemBase;
  }[];
  sousSousAssemblages: {
    id: number;
    quantity: number;
    sousSousAssemblage: ItemBase;
  }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// --- composant multi avec quantité ---
type MultiWithQuantityProps = {
  label: string;
  placeholder?: string;
  items: ItemBase[];
  selected: LinkedItemForm[];
  onChange: (next: LinkedItemForm[]) => void;
  formatItem: (item: ItemBase) => string;
};

function MultiSearchableItemWithQuantity({
  label,
  placeholder,
  items,
  selected,
  onChange,
  formatItem,
}: MultiWithQuantityProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const lowerQuery = query.toLowerCase();
  const filtered =
    lowerQuery.length === 0
      ? items.slice(0, 30)
      : items.filter((item) =>
          formatItem(item).toLowerCase().includes(lowerQuery)
        );

  const handleAdd = (item: ItemBase) => {
    if (selected.some((s) => s.id === item.id)) return;
    onChange([...selected, { id: item.id, quantity: 1 }]);
    setQuery("");
    setOpen(false);
  };

  const handleRemove = (id: number) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  const handleQuantityChange = (id: number, q: number) => {
    if (q <= 0) q = 1;
    onChange(
      selected.map((s) => (s.id === id ? { ...s, quantity: q } : s))
    );
  };

  const selectedWithData = selected
    .map((s) => ({
      ...s,
      item: items.find((i) => i.id === s.id),
    }))
    .filter((s) => s.item) as (LinkedItemForm & { item: ItemBase })[];

  return (
    <div className="text-xs">
      <label className="block text-gray-300 mb-1">{label}</label>

      {selectedWithData.length > 0 && (
        <div className="space-y-1 mb-1">
          {selectedWithData.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-2 py-1 bg-gray-800 border border-gray-700 rounded-md"
            >
              <span className="text-[11px] text-gray-200">
                {formatItem(s.item)}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={s.quantity}
                  onChange={(e) =>
                    handleQuantityChange(s.id, Number(e.target.value))
                  }
                  className="w-14 p-1 bg-gray-900 border border-gray-700 rounded text-[11px] text-center text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  className="text-gray-400 hover:text-red-400 text-[11px]"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />

        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-gray-900 border border-gray-700 rounded-md shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-2 py-1 text-gray-500 text-xs">
                Aucun résultat
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAdd(item)}
                  className="w-full text-left px-2 py-1 text-gray-200 hover:bg-gray-800 text-xs"
                >
                  {formatItem(item)}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Page principale ---
export default function TaskTemplatesPage() {
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [pieces, setPieces] = useState<ItemBase[]>([]);
  const [sousAssemblages, setSousAssemblages] = useState<ItemBase[]>([]);
  const [sousSousAssemblages, setSousSousAssemblages] = useState<ItemBase[]>(
    []
  );

  const [selectedBorneId, setSelectedBorneId] = useState<string>("");
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // formulaire de création
  const [form, setForm] = useState({
    label: "",
    description: "",
    order: 1,
    pieces: [] as LinkedItemForm[],
    sousAssemblages: [] as LinkedItemForm[],
    sousSousAssemblages: [] as LinkedItemForm[],
  });

  // 🔍 recherche dans les tâches
  const [search, setSearch] = useState("");

  // --- état pour la modal d’édition ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editBorneId, setEditBorneId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    label: "",
    description: "",
    order: 1,
    pieces: [] as LinkedItemForm[],
    sousAssemblages: [] as LinkedItemForm[],
    sousSousAssemblages: [] as LinkedItemForm[],
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bornesRes, piecesRes, saRes, ssaRes] = await Promise.all([
          axios.get(`${API_URL}/bornes`),
          axios.get(`${API_URL}/pieces`),
          axios.get(`${API_URL}/sous-assemblages`),
          axios.get(`${API_URL}/sous-sous-assemblages`),
        ]);

        setBornes(bornesRes.data);
        setPieces(piecesRes.data);
        setSousAssemblages(saRes.data);
        setSousSousAssemblages(ssaRes.data);
      } catch (err) {
        console.error("Erreur chargement données de base:", err);
      }
    };

    fetchAll();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/task-templates`;
      if (selectedBorneId) {
        url += `?borneId=${selectedBorneId}`;
      } else {
        url += `?borneId=null`;
      }
      const res = await axios.get(url);

      const data: TaskTemplate[] = (res.data as any[]).map((t) => ({
        ...t,
        pieces: t.pieces ?? [],
        sousAssemblages: t.sousAssemblages ?? [],
        sousSousAssemblages: t.sousSousAssemblages ?? [],
      }));

      setTasks(data);
    } catch (err) {
      console.error("Erreur chargement tâches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBorneId]);

  const handleFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      label: "",
      description: "",
      order: 1,
      pieces: [],
      sousAssemblages: [],
      sousSousAssemblages: [],
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) {
      setMessage("❌ Le libellé est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload: any = {
        label: form.label.trim(),
        description: form.description.trim() || undefined,
        order: form.order ? Number(form.order) : undefined,
        borneId: selectedBorneId ? Number(selectedBorneId) : undefined,
        pieces:
          form.pieces.length > 0
            ? form.pieces.map((p) => ({
                pieceId: p.id,
                quantity: p.quantity,
              }))
            : undefined,
        sousAssemblages:
          form.sousAssemblages.length > 0
            ? form.sousAssemblages.map((sa) => ({
                sousAssemblageId: sa.id,
                quantity: sa.quantity,
              }))
            : undefined,
        sousSousAssemblages:
          form.sousSousAssemblages.length > 0
            ? form.sousSousAssemblages.map((ssa) => ({
                sousSousAssemblageId: ssa.id,
                quantity: ssa.quantity,
              }))
            : undefined,
      };

      await axios.post(`${API_URL}/task-templates`, payload);

      setMessage("✅ Tâche créée.");
      resetForm();
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la création de la tâche.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement cette tâche ?")) return;

    try {
      await axios.delete(`${API_URL}/task-templates/${id}`);
      setMessage("✅ Tâche supprimée.");
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la suppression.");
    }
  };

  const toggleActive = async (task: TaskTemplate) => {
    try {
      await axios.patch(`${API_URL}/task-templates/${task.id}`, {
        active: !task.active,
      });
      setMessage("✅ Tâche mise à jour.");
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour.");
    }
  };

  const formatItem = (item: ItemBase) =>
    item.reference ? `${item.reference} — ${item.nom}` : item.nom;

  // 🔎 filtrage des tâches côté front
  const lowerSearch = search.toLowerCase();
  const filteredTasks = tasks.filter((t) => {
    if (!lowerSearch) return true;
    const label = t.label.toLowerCase();
    const desc = (t.description ?? "").toLowerCase();
    return label.includes(lowerSearch) || desc.includes(lowerSearch);
  });

  // --- ouverture de la modal d’édition ---
  const openEditModal = (task: TaskTemplate) => {
    setEditingTaskId(task.id);
    setEditBorneId(task.borneId ? String(task.borneId) : "");

    setEditForm({
      label: task.label,
      description: task.description ?? "",
      order: task.order ?? 1,
      pieces: task.pieces.map((p) => ({
        id: p.piece.id,
        quantity: p.quantity,
      })),
      sousAssemblages: task.sousAssemblages.map((sa) => ({
        id: sa.sousAssemblage.id,
        quantity: sa.quantity,
      })),
      sousSousAssemblages: task.sousSousAssemblages.map((ssa) => ({
        id: ssa.sousSousAssemblage.id,
        quantity: ssa.quantity,
      })),
    });

    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingTaskId(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId) return;

    if (!editForm.label.trim()) {
      setMessage("❌ Le libellé est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload: any = {
        label: editForm.label.trim(),
        description: editForm.description.trim() || undefined,
        order: editForm.order ? Number(editForm.order) : undefined,
        borneId: editBorneId ? Number(editBorneId) : undefined,
        pieces:
          editForm.pieces.length > 0
            ? editForm.pieces.map((p) => ({
                pieceId: p.id,
                quantity: p.quantity,
              }))
            : [],
        sousAssemblages:
          editForm.sousAssemblages.length > 0
            ? editForm.sousAssemblages.map((sa) => ({
                sousAssemblageId: sa.id,
                quantity: sa.quantity,
              }))
            : [],
        sousSousAssemblages:
          editForm.sousSousAssemblages.length > 0
            ? editForm.sousSousAssemblages.map((ssa) => ({
                sousSousAssemblageId: ssa.id,
                quantity: ssa.quantity,
              }))
            : [],
      };

      await axios.patch(`${API_URL}/task-templates/${editingTaskId}`, payload);

      setMessage("✅ Tâche mise à jour.");
      closeEditModal();
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour de la tâche.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl relative">
      <h1 className="text-2xl font-bold text-gray-200 mb-6">
        📋 Gestion des tâches (dictionnaire)
      </h1>

      {/* Sélecteur de type de borne */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="block text-gray-300 mb-1">
            Type de borne concerné
          </label>
          <select
            value={selectedBorneId}
            onChange={(e) => setSelectedBorneId(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 p-2 rounded-md min-w-[260px]"
          >
            <option value="">
              — Aucune borne (tâche atelier / générique) —
            </option>
            {bornes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Si aucune borne n’est sélectionnée, la tâche ne sera liée à aucun
            type de machine.
          </p>
        </div>
      </div>

      {/* Formulaire de création */}
      <form onSubmit={handleCreate} className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 mb-1">Libellé</label>
            <input
              name="label"
              value={form.label}
              onChange={handleFormChange}
              required
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
              placeholder="Ex : Monter SA alimentation"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">
              Ordre (optionnel)
            </label>
            <input
              type="number"
              name="order"
              value={form.order}
              onChange={handleFormChange}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-1">
            Description (optionnelle)
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleFormChange}
            rows={3}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
            placeholder="Détail de la tâche, instructions, etc."
          />
        </div>

        {/* Liens vers stock + quantités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <MultiSearchableItemWithQuantity
            label="Pièces liées"
            items={pieces}
            selected={form.pieces}
            onChange={(next) => setForm((f) => ({ ...f, pieces: next }))}
            placeholder="Rechercher une pièce..."
            formatItem={formatItem}
          />
          <MultiSearchableItemWithQuantity
            label="SA liés"
            items={sousAssemblages}
            selected={form.sousAssemblages}
            onChange={(next) =>
              setForm((f) => ({ ...f, sousAssemblages: next }))
            }
            placeholder="Rechercher un SA..."
            formatItem={formatItem}
          />
          <MultiSearchableItemWithQuantity
            label="SSA liés"
            items={sousSousAssemblages}
            selected={form.sousSousAssemblages}
            onChange={(next) =>
              setForm((f) => ({ ...f, sousSousAssemblages: next }))
            }
            placeholder="Rechercher un SSA..."
            formatItem={formatItem}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`mt-4 px-5 py-2 rounded-md font-semibold ${
            saving
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {saving ? "Enregistrement..." : "➕ Créer la tâche"}
        </button>
      </form>

      {message && (
        <p
          className={`mb-4 text-center text-sm ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}

      {/* Liste des tâches + recherche */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-200">
          📚 Tâches existantes
        </h2>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une tâche..."
          className="ml-4 w-56 px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-sm text-gray-200"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-gray-500 text-sm italic">
          Aucune tâche ne correspond à ce filtre.
        </p>
      ) : (
        <ul className="space-y-3">
          {filteredTasks.map((t) => (
            <li
              key={t.id}
              className="border border-gray-700 rounded-md p-3 bg-gray-900/70 flex justify-between items-start"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-100">
                    {t.label}
                  </span>
                  {!t.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-200">
                      inactif
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-gray-400">{t.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  ID: {t.id} • Ordre: {t.order ?? "-"}
                </p>

                {(t.pieces.length > 0 ||
                  t.sousAssemblages.length > 0 ||
                  t.sousSousAssemblages.length > 0) && (
                  <div className="text-[11px] text-gray-400 space-y-1 mt-1">
                    {t.pieces.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-300">
                          Pièces :
                        </span>{" "}
                        {t.pieces
                          .map(
                            (p) =>
                              `${p.quantity} x ${
                                p.piece.reference
                                  ? `${p.piece.reference} — ${p.piece.nom}`
                                  : p.piece.nom
                              }`
                          )
                          .join(" • ")}
                      </div>
                    )}
                    {t.sousAssemblages.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-300">
                          SA :
                        </span>{" "}
                        {t.sousAssemblages
                          .map(
                            (sa) =>
                              `${sa.quantity} x ${
                                sa.sousAssemblage.reference
                                  ? `${sa.sousAssemblage.reference} — ${sa.sousAssemblage.nom}`
                                  : sa.sousAssemblage.nom
                              }`
                          )
                          .join(" • ")}
                      </div>
                    )}
                    {t.sousSousAssemblages.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-300">
                          SSA :
                        </span>{" "}
                        {t.sousSousAssemblages
                          .map(
                            (ssa) =>
                              `${ssa.quantity} x ${
                                ssa.sousSousAssemblage.reference
                                  ? `${ssa.sousSousAssemblage.reference} — ${ssa.sousSousAssemblage.nom}`
                                  : ssa.sousSousAssemblage.nom
                              }`
                          )
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => openEditModal(t)}
                  className="text-xs px-3 py-1 rounded-md bg-blue-700/80 hover:bg-blue-600 text-white"
                >
                  Modifier
                </button>
                <button
                  onClick={() => toggleActive(t)}
                  className={`text-xs px-3 py-1 rounded-md ${
                    t.active
                      ? "bg-yellow-600/80 hover:bg-yellow-500 text-white"
                      : "bg-green-600/80 hover:bg-green-500 text-white"
                  }`}
                >
                  {t.active ? "Désactiver" : "Activer"}
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-xs px-3 py-1 rounded-md bg-red-700/80 hover:bg-red-600 text-white"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🔧 Modal d'édition */}
      {editModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-xl p-6 relative">
            <button
              type="button"
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-lg"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              ✏️ Modifier la tâche
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Libellé</label>
                  <input
                    name="label"
                    value={editForm.label}
                    onChange={handleEditFormChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                    placeholder="Ex : Monter SA alimentation"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">
                    Ordre (optionnel)
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={editForm.order}
                    onChange={handleEditFormChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={3}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                  placeholder="Détail de la tâche, instructions, etc."
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">
                  Type de borne concerné
                </label>
                <select
                  value={editBorneId}
                  onChange={(e) => setEditBorneId(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-gray-200 p-2 rounded-md min-w-[260px]"
                >
                  <option value="">
                    — Aucune borne (tâche atelier / générique) —
                  </option>
                  {bornes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Liens vers stock + quantités (édition) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <MultiSearchableItemWithQuantity
                  label="Pièces liées"
                  items={pieces}
                  selected={editForm.pieces}
                  onChange={(next) =>
                    setEditForm((f) => ({ ...f, pieces: next }))
                  }
                  placeholder="Rechercher une pièce..."
                  formatItem={formatItem}
                />
                <MultiSearchableItemWithQuantity
                  label="SA liés"
                  items={sousAssemblages}
                  selected={editForm.sousAssemblages}
                  onChange={(next) =>
                    setEditForm((f) => ({ ...f, sousAssemblages: next }))
                  }
                  placeholder="Rechercher un SA..."
                  formatItem={formatItem}
                />
                <MultiSearchableItemWithQuantity
                  label="SSA liés"
                  items={sousSousAssemblages}
                  selected={editForm.sousSousAssemblages}
                  onChange={(next) =>
                    setEditForm((f) => ({
                      ...f,
                      sousSousAssemblages: next,
                    }))
                  }
                  placeholder="Rechercher un SSA..."
                  formatItem={formatItem}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-5 py-2 rounded-md font-semibold ${
                    saving
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {saving ? "Enregistrement..." : "💾 Mettre à jour la tâche"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
