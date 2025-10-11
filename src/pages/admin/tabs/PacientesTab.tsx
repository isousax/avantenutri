import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../contexts";
import { API } from "../../../config/api";
import { User } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  created_at?: string;
  last_login_at?: string;
  email_confirmed?: number;
}

const PacientesTab: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    let ignore = false;
    async function load() {
      setUsersLoading(true);
      try {
        const access = await getAccessToken();
        if (!access) {
          if (!ignore) setUsers([]);
          return;
        }
        const params = new URLSearchParams({
          page: String(usersPage),
          pageSize: String(pageSize),
        });
        if (searchTerm) params.set("q", searchTerm);
        const r = await fetch(`${API.ADMIN_USERS}?${params.toString()}`, {
          headers: { authorization: `Bearer ${access}` },
        });
        if (!r.ok) throw new Error("fail");
        const data = await r.json();
        if (ignore) return;
        setUsers(data.results || []);
        setUsersHasMore((data.results || []).length === pageSize);
      } catch {
        if (!ignore) setUsers([]);
      } finally {
        if (!ignore) setUsersLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [usersPage, searchTerm, getAccessToken]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.display_name || "").toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
    );
  }, [users, searchTerm]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute right-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="py-3 px-4 font-medium">Paciente</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Criado</th>
              <th className="py-3 px-4 font-medium">Último Login</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading && (
              <tr>
                <td colSpan={6} className="py-6 px-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" />
                    </svg>
                    Carregando usuários...
                  </div>
                </td>
              </tr>
            )}
            {!usersLoading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {!usersLoading &&
              filteredUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-green-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                            <User size={14} />
                                          </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {u.display_name || "Sem nome"}
                        </div>
                        <div className="text-xs text-gray-600">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{u.role}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t flex items-center justify-between text-sm bg-gray-50">
        <span className="text-xs">Página {usersPage}</span>
        <div className="flex gap-2">
          <Button
            className="text-xs"
            variant="secondary"
            disabled={usersPage === 1 || usersLoading}
            noFocus
            noBackground
            onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            className="text-xs"
            variant="secondary"
            disabled={!usersHasMore || usersLoading}
            noFocus
            noBackground
            onClick={() => setUsersPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PacientesTab;
