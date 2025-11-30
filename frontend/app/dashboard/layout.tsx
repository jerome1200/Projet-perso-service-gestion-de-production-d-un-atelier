"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [lowStockItems, setLowStockItems] = useState<
    { id: number; type: string; nom: string; nombre: number; seuilAlerte: number }[]
  >([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role);
      if (payload.role === "DEFAULT") router.push("/pending");
    } catch {
      localStorage.removeItem("token");
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/auth");
  };

  // 🔔 Charger les alertes de stock faible
  const fetchLowStock = async () => {
    try {
      setLoadingAlerts(true);

      const endpoints: { type: string; path: string }[] = [
        { type: "Pièce", path: "pieces" },
        { type: "SA", path: "sous-assemblages" },
        { type: "SSA", path: "sous-sous-assemblages" },
        { type: "Kit", path: "kits" },
      ];

      const results = await Promise.all(
        endpoints.map(async ({ type, path }) => {
          const res = await axios.get(`${API_URL}/${path}`);
          // chaque item doit avoir nombre + seuilAlerte (ajoutés dans Prisma)
          return res.data
            .filter(
              (item: any) =>
                !item.archived &&
                typeof item.nombre === "number" &&
                typeof item.seuilAlerte === "number" &&
                item.seuilAlerte > 0 &&
                item.nombre <= item.seuilAlerte
            )
            .map((item: any) => ({
              id: item.id,
              type,
              nom: item.nom,
              nombre: item.nombre,
              seuilAlerte: item.seuilAlerte,
            }));
        })
      );

      setLowStockItems(results.flat());
    } catch (err) {
      console.error("Erreur lors du chargement des alertes stock :", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Charger les alertes au montage + éventuellement refresh périodique
  useEffect(() => {
    fetchLowStock();

    // Optionnel : refresh toutes les 60s
    const interval = setInterval(fetchLowStock, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-400 bg-[#0f172a]">
        Chargement...
      </div>
    );

  const menus: Record<string, { label: string; href: string }[]> = {
    taches: [
      { label: "Créer/supprimer", href: "/dashboard/taches/creation" },
	  { label: "Visualiser", href: "/dashboard/taches/visualisation"},
      { label: "Attribuer", href: "/dashboard/taches/attribution" },
    ],
    //colis: [
    //  { label: "Gestion", href: "/dashboard/colis" },
    //  { label: "Envois", href: "/dashboard/colis/envois" },
    //  { label: "Retour", href: "/dashboard/colis/retours" },
    //],
    stock: [
      { label: "Ajouter", href: "/dashboard/stock/creation" },
      { label: "Modifier", href: "/dashboard/stock/gestion" },
      { label: "Voir stock", href: "/dashboard/stock/visualisation" },
	  { label: "Etiquette QR code", href: "/dashboard/stock/etiquette"}
    ],
  };

  const adminMenu = [
    { label: "Attribution d’un rôle", href: "/dashboard/admin/roles" },
	{ label: "Créer nouvelle Borne" , href: "/dashboard/admin/borne"}
    // { label: "Gestion des rôles", href: "/dashboard/admin/roles" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col text-gray-200">
      {/* 🌑 NAVBAR */}
      <header className="backdrop-blur-md bg-gray-900/70 border-b border-gray-800 shadow-lg px-10 py-4 flex justify-between items-center sticky top-0 z-50">
		<Link
		href="/dashboard"
		className="text-2xl font-extrabold tracking-wide cursor-pointer
					text-[#9ca3af] hover:text-[#d1d5db] transition-all duration-300
					drop-shadow-[0_0_4px_rgba(255,255,255,0.05)]"
		>
		Shiva
		</Link>
        <nav className="flex space-x-10 text-base font-medium items-center relative">
          {Object.entries(menus).map(([menu, subItems]) => (
            <div
              key={menu}
              className="relative"
              onMouseEnter={() => setOpenMenu(menu)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button className="capitalize text-gray-300 hover:text-blue-400 transition-all duration-200">
                {menu}
              </button>

              <div
                className={`absolute left-0 top-full bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-xl w-48 py-2 transition-all duration-200 ${
                  openMenu === menu
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                }`}
              >
                {subItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-2 text-gray-300 hover:bg-blue-500/20 hover:text-blue-300 transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {role === "ADMIN" && (
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu("admin")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button className="text-gray-300 hover:text-blue-400 transition">
                Admin
              </button>

              <div
                className={`absolute left-0 top-full bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-xl w-56 py-2 transition-all duration-200 ${
                  openMenu === "admin"
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                }`}
              >
                {adminMenu.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-2 text-gray-300 hover:bg-blue-500/20 hover:text-blue-300 transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-semibold
             shadow-sm hover:shadow-[0_0_8px_rgba(100,100,100,0.4)] transition-all duration-300
             border border-gray-600/60"
          >
            Déconnexion
          </button>
        </nav>
      </header>

      {/* ⚙️ CONTENU + SIDEBAR */}
      <div className="flex flex-1">
        {/* 🧾 CONTENU PRINCIPAL */}
        <main className="flex-1 p-10">{children}</main>

        {/* 🚨 SIDEBAR ALERTING */}
        <aside className="w-80 bg-gray-900/70 border-l border-gray-800 p-6 shadow-inner backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            🔔 Alertes stock
            {lowStockItems.length > 0 && (
              <span className="text-xs bg-red-600/80 text-white px-2 py-0.5 rounded-full">
                {lowStockItems.length}
              </span>
            )}
          </h2>

          {loadingAlerts ? (
            <div className="text-gray-500 italic text-sm">Chargement des alertes...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-gray-500 italic text-sm">
              Aucune alerte pour le moment.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStockItems.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="border border-gray-700 rounded-md p-2 bg-gray-900/70"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-200">{item.nom}</span>
                    <span className="text-amber-400 text-xs">{item.type}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Stock:{" "}
                    <span className="text-red-400 font-semibold">{item.nombre}</span>{" "}
                    (min. {item.seuilAlerte})
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
