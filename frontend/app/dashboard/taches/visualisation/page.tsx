"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type Borne = { id: number; nom: string };

type ItemBase = { id: number; nom: string; reference?: string | null };

type TaskTemplate = {
  id: number;
  borneId: number | null;
  label: string;
  description?: string | null;
  order?: number | null;
  active: boolean;
  borne?: Borne | null;
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

function TaskCard({
  task,
  formatItem,
}: {
  task: TaskTemplate;
  formatItem: (item: ItemBase) => string;
}) {
  const hasLinks =
    task.pieces.length > 0 ||
    task.sousAssemblages.length > 0 ||
    task.sousSousAssemblages.length > 0;

  const piecesCount = task.pieces.length;
  const saCount = task.sousAssemblages.length;
  const ssaCount = task.sousSousAssemblages.length;

  return (
    <article className="border border-gray-700/80 rounded-lg px-4 py-3 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-950 shadow-sm hover:shadow-md transition-shadow duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-100 text-sm">
              {task.label}
            </span>

            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                task.active
                  ? "bg-emerald-900/40 border-emerald-600/60 text-emerald-300"
                  : "bg-gray-800 border-gray-600 text-gray-300"
              }`}
            >
              {task.active ? "Active" : "Inactive"}
            </span>

            {hasLinks && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-gray-300 flex items-center gap-1">
                🔗
                {piecesCount > 0 && <span>{piecesCount} pièce(s)</span>}
                {saCount > 0 && <span>• {saCount} SA</span>}
                {ssaCount > 0 && <span>• {ssaCount} SSA</span>}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-[11px] text-gray-300 leading-snug">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Contenu détaillé des liens */}
      {hasLinks && (
        <div className="mt-2 pt-2 border-t border-gray-800/70 space-y-1.5">
          {task.pieces.length > 0 && (
            <div className="text-[11px] text-gray-300 flex items-start gap-2">
              <span className="font-semibold text-gray-200 mt-[2px]">
                Pièces :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {task.pieces.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-[10px]"
                  >
                    {p.quantity} × {formatItem(p.piece)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.sousAssemblages.length > 0 && (
            <div className="text-[11px] text-gray-300 flex items-start gap-2">
              <span className="font-semibold text-gray-200 mt-[2px]">
                SA :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {task.sousAssemblages.map((sa) => (
                  <span
                    key={sa.id}
                    className="px-2 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-[10px]"
                  >
                    {sa.quantity} × {formatItem(sa.sousAssemblage)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.sousSousAssemblages.length > 0 && (
            <div className="text-[11px] text-gray-300 flex items-start gap-2">
              <span className="font-semibold text-gray-200 mt-[2px]">
                SSA :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {task.sousSousAssemblages.map((ssa) => (
                  <span
                    key={ssa.id}
                    className="px-2 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-[10px]"
                  >
                    {ssa.quantity} × {formatItem(ssa.sousSousAssemblage)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function TaskTemplatesOverviewPage() {
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [openUntyped, setOpenUntyped] = useState<boolean>(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [bornesRes, tasksRes] = await Promise.all([
          axios.get(`${API_URL}/bornes`),
          axios.get(`${API_URL}/task-templates`),
        ]);

        setBornes(bornesRes.data);

        const data: TaskTemplate[] = (tasksRes.data as any[]).map((t) => ({
          ...t,
          pieces: t.pieces ?? [],
          sousAssemblages: t.sousAssemblages ?? [],
          sousSousAssemblages: t.sousSousAssemblages ?? [],
        }));

        setTasks(data);
      } catch (err) {
        console.error("Erreur chargement tâches ou bornes:", err);
        setMessage("❌ Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Groupage
  const typedByBorne: Record<number, TaskTemplate[]> = {};
  const untypedTasks: TaskTemplate[] = [];

  tasks.forEach((t) => {
    if (t.borneId == null) {
      untypedTasks.push(t);
    } else {
      if (!typedByBorne[t.borneId]) {
        typedByBorne[t.borneId] = [];
      }
      typedByBorne[t.borneId].push(t);
    }
  });

  const formatItem = (item: ItemBase) => item.nom;

  const toggleSection = (borneId: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [borneId]: !prev[borneId],
    }));
  };

  return (
    <div className="max-w-5xl mx-auto bg-gray-900/60 border border-gray-700 rounded-xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-gray-200 mb-6">
        📊 Tâches par type de borne
      </h1>

      {loading && (
        <p className="text-gray-400 text-sm mb-4">Chargement...</p>
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

      {/* Sections par borne (accordion) */}
      {bornes.map((borne) => {
        const list = typedByBorne[borne.id] ?? [];
        if (list.length === 0) return null;

        const isOpen = openSections[borne.id] ?? false;

        return (
          <section
            key={borne.id}
            className="mb-4 border border-gray-800 rounded-lg bg-gray-900/70 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection(borne.id)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/80"
            >
              <div className="flex items-center gap-2">
                <span className="text-base text-gray-100 font-semibold">
                  🛠️ {borne.nom}
                </span>
                <span className="text-xs text-gray-400">
                  ({list.length} tâche{list.length > 1 ? "s" : ""})
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-2 space-y-2 border-t border-gray-800">
                {list.map((t) => (
                  <TaskCard key={t.id} task={t} formatItem={formatItem} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Section non typées (accordion) */}
      <section className="mt-6 border border-gray-800 rounded-lg bg-gray-900/70 overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenUntyped((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/80"
        >
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-100 font-semibold">
              🛠️ Tâches non typées (atelier / génériques)
            </span>
            <span className="text-xs text-gray-400">
              ({untypedTasks.length} tâche
              {untypedTasks.length > 1 ? "s" : ""})
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            {openUntyped ? "▲" : "▼"}
          </span>
        </button>

        {openUntyped && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-800">
            {untypedTasks.length === 0 ? (
              <p className="text-gray-500 text-sm italic mt-2">
                Aucune tâche générique.
              </p>
            ) : (
              <div className="space-y-2 mt-1">
                {untypedTasks.map((t) => (
                  <TaskCard key={t.id} task={t} formatItem={formatItem} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
