import React, { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import { useAuth } from "../../../contexts";
import { API } from "../../../config/api";

interface Consultation {
  id: string;
  user_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  urgency?: string;
}

const ConsultasTab: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultFilters, setConsultFilters] = useState<{ status?: string }>({});

  useEffect(() => {
    let ignore = false;
    async function load() {
      setConsultLoading(true);
      try {
        const access = await getAccessToken();
        if (!access) {
          if (!ignore) setConsultations([]);
          return;
        }
        const params = new URLSearchParams({ page: "1", pageSize: "50" });
        if (consultFilters.status) params.set("status", consultFilters.status);
        const r = await fetch(`${API.ADMIN_CONSULTATIONS}?${params.toString()}`, {
          headers: { authorization: `Bearer ${access}` },
        });
        if (!r.ok) throw new Error("fail");
        const data = await r.json();
        if (ignore) return;
        setConsultations(data.results || []);
      } catch {
        if (!ignore) setConsultations([]);
      } finally {
        if (!ignore) setConsultLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [consultFilters, getAccessToken]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <label className="text-gray-600 whitespace-nowrap">Status:</label>
          <select
            onChange={(e) => setConsultFilters({ status: e.target.value || undefined })}
            value={consultFilters.status || ""}
            className="border rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500 min-w-0"
          >
            <option value="">Todos</option>
            <option value="scheduled">Programadas</option>
            <option value="completed">Concluídas</option>
            <option value="canceled">Canceladas</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="py-3 px-4 font-medium">Data/Hora</th>
              <th className="py-3 px-4 font-medium">Paciente</th>
              <th className="py-3 px-4 font-medium">Tipo</th>
              <th className="py-3 px-4 font-medium">Duração</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Urgência</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {consultLoading && (
              <tr>
                <td colSpan={7} className="py-6 px-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" />
                    </svg>
                    Carregando consultas...
                  </div>
                </td>
              </tr>
            )}
            {!consultLoading && consultations.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  Nenhuma consulta encontrada.
                </td>
              </tr>
            )}
            {!consultLoading &&
              consultations.map((c) => {
                const dt = new Date(c.scheduled_at);
                const dateStr = dt.toLocaleDateString("pt-BR") + " " + dt.toTimeString().slice(0, 5);
                return (
                  <tr key={c.id} className="border-t hover:bg-green-50">
                    <td className="py-3 px-4 text-xs text-gray-700">{dateStr}</td>
                    <td className="py-3 px-4">{c.user_id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">{c.type}</td>
                    <td className="py-3 px-4">{c.duration_min}min</td>
                    <td className="py-3 px-4">{c.status}</td>
                    <td className="py-3 px-4">{c.urgency || "—"}</td>
                    <td className="py-3 px-4"></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ConsultasTab;
