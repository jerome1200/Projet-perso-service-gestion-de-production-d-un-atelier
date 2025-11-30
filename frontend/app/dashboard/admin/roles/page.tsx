"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = {
  id: number;
  email: string;
  role: string;
  nom: string | null;
  createdAt: string;
};

export default function RolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u))
      );
      setMessage("✅ Rôle mis à jour !");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour.");
    }
  };

  const handleNameChange = async (id: number, nom: string) => {
    try {
      await api.patch(`/users/${id}/name`, { nom });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, nom } : u))
      );
      setMessage("✅ Nom mis à jour !");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour du nom.");
    }
  };

  if (loading)
    return (
      <div className="text-gray-400 text-center mt-10 animate-pulse">
        Chargement des utilisateurs...
      </div>
    );

  return (
    <div className="text-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-blue-400">
        Gestion des utilisateurs
      </h1>

      {message && (
        <div className="mb-4 text-sm text-center text-green-400">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-700 shadow-lg">
        <table className="min-w-full bg-gray-800/60 text-sm">
          <thead className="bg-gray-700/80 text-gray-300">
            <tr>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Rôle</th>
              <th className="px-6 py-3 text-left">Créé le</th>
              <th className="px-6 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-gray-700 hover:bg-gray-700/50 transition-all"
              >
                <td className="px-6 py-3">{u.email}</td>
                <td className="px-6 py-3">
                  <input
					type="text"
					value={u.nom || ""}
					placeholder={u.nom ? "" : "Aucun nom défini"}
					onChange={(e) =>
						setUsers((prev) =>
						prev.map((usr) =>
							usr.id === u.id ? { ...usr, nom: e.target.value } : usr
						)
						)
					}
					onBlur={(e) => handleNameChange(u.id, e.target.value)}
					className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-gray-300 w-[200px] focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-500 "
				  />
                </td>
                <td className="px-6 py-3 capitalize">{u.role}</td>
                <td className="px-6 py-3 text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-3 text-center">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="DEFAULT">DEFAULT</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
