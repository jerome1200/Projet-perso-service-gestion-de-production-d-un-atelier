"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Borne = { id: number; nom: string };

type ProductionLine = {
  id: number;
  borneId: number;
  quantity: number;
  borne: Borne;
};

type TaskTemplatePieceLink = {
  id: number;
  quantity: number;
  piece: {
    id: number;
    nom: string;
    nombre: number; // stock
  };
};

type TaskTemplateSALink = {
  id: number;
  quantity: number;
  sousAssemblage: {
    id: number;
    nom: string;
    nombre: number; // stock
  };
};

type TaskTemplateSSALink = {
  id: number;
  quantity: number;
  sousSousAssemblage: {
    id: number;
    nom: string;
    nombre: number; // stock
  };
};

type TaskTemplate = {
  id: number;
  borneId: number | null;
  order?: number | null;
  pieces: TaskTemplatePieceLink[];
  sousAssemblages: TaskTemplateSALink[];
  sousSousAssemblages: TaskTemplateSSALink[];
};

type ProductionTask = {
  id: number;
  productionId: number;
  label: string;
  description?: string | null;
  isDone: boolean;
  running: boolean;
  template?: TaskTemplate | null;
};

type ProductionStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";

type Production = {
  id: number;
  nom: string;
  reference?: string | null;
  status: ProductionStatus;
  createdAt: string;
  lines: ProductionLine[];
  tasks: ProductionTask[];
};

type NewLine = {
  id: number;
  borneId: number | "";
  quantity: number;
};

// ====== helpers couleur cellule tâche ======
type UiTaskStatus =
  | "DONE"
  | "RUNNING"
  | "PENDING_OK"
  | "PENDING_MISSING"
  | "PENDING_NO_COMPONENT";

function getUiTaskStatus(
  task: ProductionTask,
  hasComponents: boolean,
  hasMissing: boolean
): UiTaskStatus {
  if (task.isDone) return "DONE";
  if (task.running) return "RUNNING";

  if (hasMissing) return "PENDING_MISSING";
  return "PENDING_OK";
}

function getTaskClasses(uiStatus: UiTaskStatus): string {
  switch (uiStatus) {
    case "DONE":
      return "bg-emerald-900/40 border-emerald-600/70";
    case "RUNNING":
      return "bg-blue-900/40 border-blue-600/70";
    case "PENDING_OK":
      return "bg-yellow-900/30 border-yellow-500/70";
    case "PENDING_MISSING":
      return "bg-red-900/40 border-red-600/70";
    case "PENDING_NO_COMPONENT":
    default:
      return "bg-gray-900/80 border-gray-800";
  }
}

export default function DashboardHome() {
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loadingInit, setLoadingInit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // onglet ouvert
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Form création production
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [lines, setLines] = useState<NewLine[]>([
    { id: 1, borneId: "", quantity: 1 },
  ]);
  const [lineCounter, setLineCounter] = useState(2);

  // ====== Chargement initial ======
  const fetchInit = async () => {
    try {
      setLoadingInit(true);
      const [bornesRes, prodsRes] = await Promise.all([
        axios.get(`${API_URL}/bornes`),
        axios.get(`${API_URL}/productions`),
      ]);

      const prods: Production[] = prodsRes.data;

      setBornes(bornesRes.data);
      setProductions(prods);

      // 👉 ouvrir par défaut la dernière production (active si possible)
      if (prods.length === 0) {
        setOpenSection("create");
      } else {
        const activeProds = prods.filter((p) => p.status !== "DONE");
        const base = activeProds.length > 0 ? activeProds : prods;

        const sorted = base
          .slice()
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        const last = sorted[sorted.length - 1];
        setOpenSection(`prod-${last.id}`);
      }
    } catch (err) {
      console.error("Erreur chargement bornes/productions:", err);
      setMessage("❌ Erreur lors du chargement des données initiales.");
    } finally {
      setLoadingInit(false);
    }
  };

  useEffect(() => {
    fetchInit();
  }, []);

  // ====== helpers création prod ======
  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { id: lineCounter, borneId: "", quantity: 1 },
    ]);
    setLineCounter((c) => c + 1);
  };

  const handleRemoveLine = (id: number) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleLineChange = (
    id: number,
    field: "borneId" | "quantity",
    value: string | number
  ) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              [field]:
                field === "quantity"
                  ? Math.max(1, Number(value) || 1)
                  : value === ""
                  ? ""
                  : Number(value),
            }
          : l
      )
    );
  };

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const selectedLines = lines.filter(
      (l) => l.borneId !== "" && l.quantity > 0
    );
    if (!prodName.trim()) {
      setMessage("❌ Le nom de la production est obligatoire.");
      return;
    }
    if (selectedLines.length === 0) {
      setMessage("❌ Ajoute au moins une ligne avec un type de borne.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        nom: prodName.trim(),
        description: prodDescription.trim() || undefined,
        lines: selectedLines.map((l) => ({
          borneId: l.borneId,
          quantity: l.quantity,
        })),
      };

      await axios.post(`${API_URL}/productions`, payload);

      // recharge + ouvrira automatiquement la dernière prod créée
      await fetchInit();

      setMessage("✅ Production créée avec succès.");

      setProdName("");
      setProdDescription("");
      setLines([{ id: 1, borneId: "", quantity: 1 }]);
      setLineCounter(2);
    } catch (err) {
      console.error("Erreur création production:", err);
      setMessage("❌ Erreur lors de la création de la production.");
    } finally {
      setCreating(false);
    }
  };

  // ====== Réouvrir une tâche terminée (seulement depuis ce dashboard) ======
  const handleReopenTask = async (taskId: number) => {
    try {
      await axios.post(`${API_URL}/production-tasks/${taskId}/reopen`, {});
      setProductions((prev) =>
        prev.map((p) => ({
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId ? { ...t, isDone: false } : t
          ),
        }))
      );
    } catch (err) {
      console.error("Erreur maj tâche:", err);
      setMessage("❌ Erreur lors de la réouverture de la tâche.");
    }
  };

  // ====== Finir une production (PLANNED/IN_PROGRESS -> DONE) ======
  const handleFinishProduction = async (prod: Production) => {
    const allDone = prod.tasks.length > 0 && prod.tasks.every((t) => t.isDone);

    if (!allDone) {
      setMessage(
        "❌ Impossible de terminer la production : toutes les tâches ne sont pas terminées."
      );
      return;
    }

    try {
      setMessage(null);
      await axios.patch(`${API_URL}/productions/${prod.id}`, {
        status: "DONE",
      });
      await fetchInit();
      setMessage("✅ Production marquée comme terminée.");
    } catch (err) {
      console.error("Erreur mise à jour production:", err);
      setMessage("❌ Erreur lors de la fermeture de la production.");
    }
  };

  // ====== calcul besoin & stock pour une tâche ======
  function computeComponentsForTask(prod: Production, task: ProductionTask) {
    const tpl = task.template;
    if (!tpl) {
      return {
        hasComponents: false,
        items: [] as {
          key: string;
          label: string;
          needed: number;
          stock: number;
          missing: number;
          type: "PIECE" | "SA" | "SSA";
        }[],
      };
    }

    const machines =
      prod.lines
        .filter(
          (l) => tpl.borneId != null && l.borneId === (tpl.borneId as number)
        )
        .reduce((sum, l) => sum + l.quantity, 0) || 1;

    type ComponentItem = {
      key: string;
      label: string;
      needed: number;
      stock: number;
      missing: number;
      type: "PIECE" | "SA" | "SSA";
    };

    const items: ComponentItem[] = [];

    (tpl.pieces ?? []).forEach((link) => {
      const stock = link.piece?.nombre ?? 0;
      const needed = machines * (link.quantity || 0);
      const missing = Math.max(0, needed - stock);
      items.push({
        key: `P-${link.id}`,
        label: link.piece?.nom ?? "Pièce",
        needed,
        stock,
        missing,
        type: "PIECE",
      });
    });

    (tpl.sousAssemblages ?? []).forEach((link) => {
      const stock = link.sousAssemblage?.nombre ?? 0;
      const needed = machines * (link.quantity || 0);
      const missing = Math.max(0, needed - stock);
      items.push({
        key: `SA-${link.id}`,
        label: link.sousAssemblage?.nom ?? "Sous-assemblage",
        needed,
        stock,
        missing,
        type: "SA",
      });
    });

    (tpl.sousSousAssemblages ?? []).forEach((link) => {
      const stock = link.sousSousAssemblage?.nombre ?? 0;
      const needed = machines * (link.quantity || 0);
      const missing = Math.max(0, needed - stock);
      items.push({
        key: `SSA-${link.id}`,
        label: link.sousSousAssemblage?.nom ?? "Sous-sous-assemblage",
        needed,
        stock,
        missing,
        type: "SSA",
      });
    });

    return {
      hasComponents: items.length > 0,
      items,
    };
  }

  const statusBadgeClasses: Record<ProductionStatus, string> = {
    PLANNED: "bg-gray-800 text-gray-200 border-gray-600",
    IN_PROGRESS: "bg-blue-900/40 text-blue-200 border-blue-600/70",
    DONE: "bg-emerald-900/40 text-emerald-200 border-emerald-600/70",
    CANCELED: "bg-red-900/40 text-red-200 border-red-600/70",
  };

  // Séparation des prods actives vs terminées
  const activeProductions = productions.filter((p) => p.status !== "DONE");
  const finishedProductions = productions.filter((p) => p.status === "DONE");

  return (
    <div className="max-w-6xl mx-auto space-y-6 bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-200 mb-2">
        📋 Dashboard production
      </h1>
      <p className="text-sm text-gray-400 mb-4">
        Crée une production, puis ouvre chaque onglet pour voir les tâches
        générées et la faisabilité par rapport au stock.
      </p>

      {loadingInit && (
        <p className="text-gray-400 text-sm">Chargement des données...</p>
      )}

      {message && (
        <p
          className={`mb-4 text-sm ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}

      {/* ===== Onglet création ===== */}
      <section className="border border-gray-800 rounded-lg bg-gray-900/70 overflow-hidden">
        <button
          type="button"
          onClick={() =>
            setOpenSection((prev) => (prev === "create" ? null : "create"))
          }
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/80"
        >
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-100 font-semibold">
              ➕ Créer une nouvelle production
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            {openSection === "create" ? "▲" : "▼"}
          </span>
        </button>

        {openSection === "create" && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-800 space-y-4">
            <form
              onSubmit={handleCreateProduction}
              className="space-y-4 text-sm text-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">
                    Nom de la production
                  </label>
                  <input
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-100"
                    placeholder="Ex : Production bornes 15/03"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">
                    Description (optionnelle)
                  </label>
                  <input
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-100"
                    placeholder="Infos complémentaires…"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  Lignes de production
                </label>
                <div className="space-y-2">
                  {lines.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center gap-2 bg-gray-900/70 border border-gray-700 rounded-md px-3 py-2"
                    >
                      <select
                        value={l.borneId}
                        onChange={(e) =>
                          handleLineChange(
                            l.id,
                            "borneId",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className="min-w-[200px] px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm"
                      >
                        <option value="">
                          — Sélectionner un type de borne —
                        </option>
                        {bornes.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nom}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-gray-300 text-xs">
                          Quantité :
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) =>
                            handleLineChange(
                              l.id,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(l.id)}
                          className="ml-auto text-xs px-2 py-1 rounded-md bg-red-700/80 hover:bg-red-600 text-white"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddLine}
                  className="mt-2 text-xs px-3 py-1 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-100"
                >
                  ➕ Ajouter une ligne
                </button>
              </div>

              <button
                type="submit"
                disabled={creating}
                className={`px-5 py-2 rounded-md font-semibold ${
                  creating
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {creating ? "Création..." : "Créer la production"}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* ===== Productions ACTIVES (non DONE) ===== */}
      {activeProductions.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          Aucune production active. Toutes les productions sont terminées ou
          annulées.
        </p>
      ) : (
        activeProductions.map((prod) => {
          const sectionKey = `prod-${prod.id}`;
          const isOpen = openSection === sectionKey;
          const allTasksDone =
            prod.tasks.length > 0 && prod.tasks.every((t) => t.isDone);

          return (
            <section
              key={prod.id}
              className="border border-gray-800 rounded-lg bg-gray-900/70 overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenSection((prev) =>
                    prev === sectionKey ? null : sectionKey
                  )
                }
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/80"
              >
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-100">
                      {prod.nom}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadgeClasses[prod.status]} ${
                        allTasksDone && prod.status !== "DONE"
                          ? "cursor-pointer hover:opacity-80"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allTasksDone && prod.status !== "DONE") {
                          handleFinishProduction(prod);
                        }
                      }}
                      title={
                        allTasksDone && prod.status !== "DONE"
                          ? "Clique pour marquer la production comme terminée"
                          : "Le statut se met en DONE quand toutes les tâches sont terminées"
                      }
                    >
                      {prod.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Créée le{" "}
                    {new Date(prod.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-800 space-y-2">
                  {prod.tasks.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                      Aucune tâche générée pour cette production.
                    </p>
                  ) : (
                    prod.tasks
                      .slice()
                      .sort((a, b) => {
                        const oa = a.template?.order ?? 9999;
                        const ob = b.template?.order ?? 9999;
                        if (oa !== ob) return oa - ob;
                        return a.label.localeCompare(b.label, "fr", {
                          sensitivity: "base",
                        });
                      })
                      .map((t) => {
                        const { hasComponents, items } =
                          computeComponentsForTask(prod, t);
                        const hasMissing = items.some(
                          (it) => it.missing > 0
                        );

                        const uiStatus = getUiTaskStatus(
                          t,
                          hasComponents,
                          hasMissing
                        );
                        const taskClasses = getTaskClasses(uiStatus);

                        const statusLabel = t.isDone
                          ? "Terminée"
                          : t.running
                          ? "En cours"
                          : "En attente";

                        return (
                          <article
                            key={t.id}
                            className={`rounded-md px-3 py-2 border ${taskClasses}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-semibold text-gray-100">
                                  {t.label}
                                </span>

                                {t.isDone ? (
                                  <span
                                    onClick={() => handleReopenTask(t.id)}
                                    className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer select-none bg-emerald-900/50 border border-emerald-600/60 text-emerald-300"
                                    title="Cliquer pour réouvrir la tâche"
                                  >
                                    {statusLabel}
                                  </span>
                                ) : (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                      t.running
                                        ? "bg-blue-900/50 border-blue-600/60 text-blue-200"
                                        : "bg-gray-800 border-gray-600 text-gray-300"
                                    }`}
                                  >
                                    {statusLabel}
                                  </span>
                                )}

                                {hasComponents && !t.isDone && (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                      hasMissing
                                        ? "bg-red-900/40 border-red-600/70 text-red-200"
                                        : "bg-emerald-900/40 border-emerald-600/70 text-emerald-200"
                                    }`}
                                  >
                                    {hasMissing
                                      ? "Stock insuffisant"
                                      : "Stock OK"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {t.description && (
                              <p className="text-[11px] text-gray-300 mt-1">
                                {t.description}
                              </p>
                            )}

                            {t.isDone ? (
                              <p className="text-[11px] text-gray-400 mt-1 italic">
                                Tâche terminée. Cliquez sur le badge "Terminée"
                                pour la réouvrir et revoir les composants.
                              </p>
                            ) : !hasComponents ? (
                              <p className="text-[11px] text-gray-500 mt-1">
                                Aucun composant lié à cette tâche.
                              </p>
                            ) : (
                              <div className="mt-2 space-y-1">
                                <p className="text-[11px] text-gray-400">
                                  Détail des composants :
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {items.map((it) => (
                                    <span
                                      key={it.key}
                                      className={`px-2 py-0.5 rounded-full text-[10px] border ${
                                        it.missing > 0
                                          ? "bg-red-900/40 border-red-600/70 text-gray-200"
                                          : "bg-green-800 border-green-600 text-gray-200"
                                      }`}
                                    >
                                      {it.label} — {it.stock} / {it.needed}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })
                  )}
                </div>
              )}
            </section>
          );
        })
      )}

      {/* ===== Onglet PRODUCTIONS TERMINÉES ===== */}
      <section className="border border-gray-800 rounded-lg bg-gray-900/70 overflow-hidden">
        <button
          type="button"
          onClick={() =>
            setOpenSection((prev) =>
              prev === "finished" ? null : "finished"
            )
          }
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/80"
        >
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-100 font-semibold">
              ✅ Productions terminées
            </span>
            <span className="text-xs text-gray-400">
              ({finishedProductions.length})
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            {openSection === "finished" ? "▲" : "▼"}
          </span>
        </button>

        {openSection === "finished" && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-800 space-y-2">
            {finishedProductions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Aucune production terminée pour le moment.
              </p>
            ) : (
              finishedProductions
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md border border-emerald-700/70 bg-emerald-900/30"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-100">
                        {prod.nom}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Créée le{" "}
                        {new Date(prod.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadgeClasses["DONE"]}`}
                    >
                      DONE
                    </span>
                  </div>
                ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
