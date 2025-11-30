"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StockLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
      { label: "Créer/supprimer", href: "/dashboard/taches/creation" },
	  { label: "Visualiser", href: "/dashboard/taches/visualisation"},
      { label: "Attribuer", href: "/dashboard/taches/attribution" },
  ];

  return (
    <div className="space-y-8">
      {/* 🔹 Barre secondaire de navigation locale */}
      <nav className="flex space-x-6 border-b border-gray-700 pb-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-300 hover:text-blue-400 hover:bg-gray-800/60"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* 🔸 Contenu principal */}
      <div className="pt-4">{children}</div>
    </div>
  );
}
