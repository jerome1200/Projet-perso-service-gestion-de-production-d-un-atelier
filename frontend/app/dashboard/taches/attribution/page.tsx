"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type User = {
  id: number;
  email: string;
  nom?: string | null;
};

type ProductionStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";

type Production = {
  id: number;
  nom: string;
  status: ProductionStatus;
};

type TemplatePieceLink = {
  id: number;
  quantity: number;
  piece: {
    id: number;
    nom: string;
    nombre: number;
  };
};

type TemplateSALink = {
  id: number;
  quantity: number;
  sousAssemblage: {
    id: number;
    nom: string;
    nombre: number;
  };
};

type TemplateSSALink = {
  id: number;
  quantity: number;
  sousSousAssemblage: {
    id: number;
    nom: string;
    nombre: number;
  };
};

type TaskTemplate = {
  id: number;
  label: string;
  description?: string | null;
  borneId: number | null;
  order?: number | null; // 👈 pour le tri
  pieces?: TemplatePieceLink[];
  sousAssemblages?: TemplateSALink[];
  sousSousAssemblages?: TemplateSSALink[];
};

type OpenProductionTask = {
  id: number;
  label: string;
  description?: string | null;
  isDone: boolean;
  running: boolean;
  totalSeconds: number;
  lastStartedAt?: string | null;
  assignedTo?: User | null;
  production: Production;
  template?: TaskTemplate | null;

  avgSecondsPerMachine?: number | null;
  estimatedSecondsTotal?: number | null;
  machinesCount?: number | null;
};

type TemplateLog = {
  id: number;
  createdAt: string;
  note?: string | null;
  user?: User | null;
};

type GenericTemplate = {
  id: number;
  label: string;
  description?: string | null;
  borneId: number | null;
  logs?: TemplateLog[];
};

type ComponentItem = {
  key: string;
  label: string;
  needed: number;
  stock: number;
  missing: number;
  type: "PIECE" | "SA" | "SSA";
};

type UiTaskStatus =
  | "DONE"
  | "RUNNING"
  | "PENDING_OK"
  | "PENDING_MISSING"
  | "PENDING_NO_COMPONENT";

// 🔸 même logique que sur le dashboard :
// - DONE / RUNNING en priorité
// - si manque de stock -> rouge
// - sinon -> orange (même sans composants => tâche faisable)
function getUiTaskStatus(
  task: OpenProductionTask,
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

function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function TasksAttributionPage() {
  const [genericTemplates, setGenericTemplates] = useState<GenericTemplate[]>([]);
  const [openProdTasks, setOpenProdTasks] = useState<OpenProductionTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("generic");
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null);

  const [selectedUserForTemplate, setSelectedUserForTemplate] = useState<
    Record<number, number | null>
  >({});

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function computeComponentsForTask(task: OpenProductionTask) {
    const tpl = task.template;
    if (!tpl) {
      return { hasComponents: false, items: [] as ComponentItem[] };
    }

    const items: ComponentItem[] = [];

    (tpl.pieces ?? []).forEach((link) => {
      const stock = link.piece?.nombre ?? 0;
      const needed = link.quantity || 0;
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
      const needed = link.quantity || 0;
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
      const needed = link.quantity || 0;
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

  const fetchAll = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const [tplRes, openTasksRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/task-templates`, {
          params: { untyped: "1", withLogs: "1" },
        }),
        axios.get(`${API_URL}/production-tasks/open`),
        axios.get(`${API_URL}/users`),
      ]);

      const allTemplates = (tplRes.data ?? []) as GenericTemplate[];
      const untypedTemplates = allTemplates.filter((tpl) => tpl.borneId == null);

      setGenericTemplates(untypedTemplates);
      setOpenProdTasks(openTasksRes.data ?? []);
      setUsers(usersRes.data ?? []);
    } catch (err) {
      console.error("Erreur chargement attributions:", err);
      setMessage("❌ Erreur lors du chargement des tâches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const callTaskAction = async (
    taskId: number,
    action: "start" | "pause" | "complete" | "reopen" | "reset-time"
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setMessage(null);
      await axios.post(`${API_URL}/production-tasks/${taskId}/${action}`, {});
      await fetchAll();
    } catch (err) {
      console.error(`Erreur action ${action} sur tâche:`, err);
      setMessage("❌ Erreur lors de la mise à jour de la tâche.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleAssignUser = async (taskId: number, userId: number | null) => {
    try {
      setAssigningTaskId(taskId);
      setMessage(null);
      await axios.post(`${API_URL}/production-tasks/${taskId}/assign`, {
        userId,
      });
      await fetchAll();
      setMessage("✅ Tâche attribuée avec succès.");
    } catch (err) {
      console.error("Erreur attribution tâche:", err);
      setMessage("❌ Erreur lors de l'attribution de la tâche.");
    } finally {
      setAssigningTaskId(null);
    }
  };

  const handleSelectUserForTemplate = (templateId: number, userId: number | null) => {
    setSelectedUserForTemplate((prev) => ({
      ...prev,
      [templateId]: userId,
    }));
  };

  const handleLogGenericTask = async (templateId: number) => {
    const userId = selectedUserForTemplate[templateId] ?? null;
    if (!userId) {
      setMessage("❌ Choisis un utilisateur avant de loguer la tâche.");
      return;
    }

    try {
      setMessage(null);
      await axios.post(`${API_URL}/task-templates/${templateId}/logs`, {
        userId,
        note: null,
      });
      await fetchAll();
      setMessage("✅ Exécution de la tâche générique enregistrée.");
    } catch (err) {
      console.error("Erreur log tâche générique:", err);
      setMessage("❌ Erreur lors de l'enregistrement de l'exécution.");
    }
  };

  const statusBadgeClasses: Record<ProductionStatus, string> = {
    PLANNED: "bg-gray-800 text-gray-200 border-gray-600",
    IN_PROGRESS:
      "bg-blue-900/40 text-blue-200 border-blue-600/70",
    DONE: "bg-emerald-900/40 text-emerald-200 border-emerald-600/70",
    CANCELED: "bg-red-900/40 text-red-200 border-red-600/70",
  };

  const groupedByProduction = Object.values(
    openProdTasks.reduce((acc, t) => {
      const pid = t.production.id;
      if (!acc[pid]) {
        acc[pid] = {
          production: t.production,
          tasks: [] as OpenProductionTask[],
        };
      }
      acc[pid].tasks.push(t);
      return acc;
    }, {} as Record<number, { production: Production; tasks: OpenProductionTask[] }>)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-200 mb-2">
        👷‍♂️🛠️ Attribution des tâches
      </h1>
      <p className="text-sm text-gray-400 mb-4">
        Ici tu retrouveras :
        <br />• les tâches génériques (non liées à un type de borne, permanentes)
        <br />• les tâches de production en cours (non terminées)
      </p>

      {loading && (
        <p className="text-gray-400 text-sm">Chargement des tâches...</p>
      )}

      {message && (
        <p
          className={`mb-2 text-sm ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}

      {/* =============== TACHES GENERIQUES =============== */}

      <section className="border border-gray-800 rounded-lg bg-gray-900/70 overflow-hidden">
        <button
          type="button"
          onClick={() =>
            setOpenSection((prev) => (prev === "generic" ? null : "generic"))
          }
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/80"
        >
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-100 font-semibold">
              🧰 Tâches génériques (non typées)
            </span>
            <span className="text-xs text-gray-400">
              ({genericTemplates.length} modèle
              {genericTemplates.length > 1 ? "s" : ""})
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            {openSection === "generic" ? "▲" : "▼"}
          </span>
        </button>

        {openSection === "generic" && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-800 space-y-2">
            {genericTemplates.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                Aucun modèle générique pour le moment.
              </p>
            ) : (
              genericTemplates.map((tpl) => (
                <article
                  key={tpl.id}
                  className="border border-emerald-600/70 rounded-md px-3 py-2 bg-emerald-900/40 space-y-2"
                >
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-gray-100">
                      {tpl.label}
                    </span>
                    {tpl.description && (
                      <p className="text-[11px] text-gray-300 mt-1">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-gray-100">
                      Marquer une exécution pour :
                    </span>
                    <select
                      className="text-[11px] bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-gray-100"
                      value={selectedUserForTemplate[tpl.id] ?? ""}
                      onChange={(e) =>
                        handleSelectUserForTemplate(
                          tpl.id,
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    >
                      <option value="">— Choisir un utilisateur —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nom || u.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleLogGenericTask(tpl.id)}
                      className="text-[11px] px-3 py-1 rounded-md bg-blue-700/80 hover:bg-blue-600 text-white"
                    >
                      ✅ Attribuer
                    </button>
                  </div>

                  <div className="mt-1">
                    <p className="text-[11px] text-gray-300 mb-1">
                      Dernières exécutions :
                    </p>
                    {tpl.logs && tpl.logs.length > 0 ? (
                      <ul className="space-y-0.5">
                        {tpl.logs.map((log) => (
                          <li
                            key={log.id}
                            className="text-[11px] text-gray-400"
                          >
                            {new Date(log.createdAt).toLocaleString()} —{" "}
                            <span className="text-gray-200">
                              {log.user
                                ? log.user.nom || log.user.email
                                : "Utilisateur inconnu"}
                            </span>
                            {log.note && ` — ${log.note}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-gray-500 italic">
                        Aucun historique pour l’instant.
                      </p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      {/* =============== PRODUCTIONS =============== */}
      {groupedByProduction.map(({ production, tasks }) => {
        const sectionKey = `prod-${production.id}`;
        const isOpen = openSection === sectionKey;

        return (
          <section
            key={production.id}
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
                    {production.nom}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadgeClasses[production.status]}`}
                  >
                    {production.status}
                  </span>
                </div>
              </div>
              <span className="text-gray-400 text-sm">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-800 space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Aucune tâche pour cette production.
                  </p>
                ) : (
                  // 🔹 Tri par order puis label
                  tasks
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
                      const { hasComponents, items } = computeComponentsForTask(t);
                      const hasMissing = items.some((it) => it.missing > 0);

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

                      const extraSeconds =
                        t.running && t.lastStartedAt
                          ? Math.floor(
                              (now - new Date(t.lastStartedAt).getTime()) / 1000
                            )
                          : 0;

                      const displaySeconds = t.totalSeconds + extraSeconds;

                      const hasStartedBefore = t.totalSeconds > 0;

                      return (
                        <article
                          key={t.id}
                          className={`rounded-md px-3 py-2 border ${taskClasses}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-semibold text-gray-100">
                                  {t.label}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    t.isDone
                                      ? "bg-emerald-900/50 border border-emerald-600/60 text-emerald-300"
                                      : t.running
                                      ? "bg-blue-900/50 border border-blue-600/60 text-blue-200"
                                      : "bg-gray-800 border border-gray-600 text-gray-300"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                                {hasComponents && (
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

                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                    t.running
                                      ? "border-emerald-500 text-emerald-200 bg-emerald-900/40"
                                      : "border-gray-600 text-gray-200 bg-gray-800/60"
                                  }`}
                                >
                                  ⏱ {formatDuration(displaySeconds)}
                                  {t.running && " (en cours)"}
                                </span>
                              </div>

                              {/* Temps estimé (si dispo) */}
                              {t.estimatedSecondsTotal != null && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] text-gray-400">
                                    Temps estimé :
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-purple-600 bg-purple-900/40 text-purple-200">
                                    ⏳ {formatDuration(t.estimatedSecondsTotal)}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-gray-200">
                                  Assignée à :
                                </span>
                                <select
                                  className="text-[11px] bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-gray-100"
                                  value={t.assignedTo?.id ?? ""}
                                  disabled={assigningTaskId === t.id}
                                  onChange={(e) =>
                                    handleAssignUser(
                                      t.id,
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null
                                    )
                                  }
                                >
                                  <option value="">— Non assignée —</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.nom || u.email}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {!t.isDone && !t.running && (
                                <button
                                  disabled={updatingTaskId === t.id}
                                  onClick={() => callTaskAction(t.id, "start")}
                                  className="text-[11px] px-3 py-1 rounded-md bg-emerald-700/80 hover:bg-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {hasStartedBefore
                                    ? "⏯️ Reprendre"
                                    : "▶️ Démarrer"}
                                </button>
                              )}

                              {t.running && !t.isDone && (
                                <button
                                  disabled={updatingTaskId === t.id}
                                  onClick={() => callTaskAction(t.id, "pause")}
                                  className="text-[11px] px-3 py-1 rounded-md bg-yellow-700/80 hover:bg-yellow-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  ⏸️ Pause
                                </button>
                              )}

                              {!t.isDone && (
                                <>
                                  <button
                                    disabled={updatingTaskId === t.id}
                                    onClick={() =>
                                      callTaskAction(t.id, "reset-time")
                                    }
                                    className="text-[11px] px-3 py-1 rounded-md bg-gray-700/80 hover:bg-gray-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    🔄 Réinitialiser
                                  </button>

                                  <button
                                    disabled={updatingTaskId === t.id}
                                    onClick={() =>
                                      callTaskAction(t.id, "complete")
                                    }
                                    className="text-[11px] px-3 py-1 rounded-md bg-blue-700/80 hover:bg-blue-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    ✅ Terminer
                                  </button>
                                </>
                              )}

                              {t.isDone && (
                                <button
                                  disabled={updatingTaskId === t.id}
                                  onClick={() => callTaskAction(t.id, "reopen")}
                                  className="text-[11px] px-3 py-1 rounded-md bg-gray-700/80 hover:bg-gray-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  🔁 Réouvrir
                                </button>
                              )}
                            </div>
                          </div>

                          {t.description && (
                            <p className="text-[11px] text-gray-300 mt-1">
                              {t.description}
                            </p>
                          )}

                          {!hasComponents ? (
                            <p className="text-[11px] text-gray-300 mt-1">
                              Aucun composant lié à cette tâche.
                            </p>
                          ) : (
                            <div className="mt-2 space-y-1">
                              <p className="text-[11px] text-gray-200">
                                Détail des composants :
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {items.map((it) => (
                                  <span
                                    key={it.key}
                                    className={`px-2 py-0.5 rounded-full text-[10px] border ${
                                      it.missing > 0
                                        ? "bg-red-900/40 border-red-600/70 text-red-200"
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
      })}
    </div>
  );
}
