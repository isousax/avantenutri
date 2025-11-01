import React, { useEffect, useState } from "react";
import SpinnerLoading from '../../../components/ui/SpinnerLoading';
import Card from "../../../components/ui/Card";
import { useAuth } from "../../../contexts";
import { API } from "../../../config/api";
import { useToast } from "../../../components/ui/ToastProvider";

interface Consultation {
  id: string;
  user_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  notes?: string;
  user_email?: string;
  user_display_name?: string;
}

// Labels amigáveis para tipo e status
const TYPE_LABELS: Record<string, string> = {
  avaliacao_completa: "Avaliação inicial",
  avaliacao_inicial: "Avaliação inicial",
  acompanhamento: "Acompanhamento",
  reavaliacao: "Reavaliação",
  retorno: "Retorno",
  outro: "Outro",
};

function formatTypeLabel(type?: string) {
  if (!type) return "—";
  if (TYPE_LABELS[type]) return TYPE_LABELS[type];
  // Fallback: snake_case -> Capitalizado
  return type
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programada",
  completed: "Concluída",
  canceled: "Cancelada",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  scheduled:
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  completed:
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20",
  canceled:
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-600/20",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_CLASSES[status] ||
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20";
  const label = STATUS_LABELS[status] || status;
  return <span className={cls}>{label}</span>;
}

const ConsultasTab: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultFilters, setConsultFilters] = useState<{ status?: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null); // id em ação
  const { push } = useToast();

  const reload = async () => {
    // reutiliza a lógica de load rapidamente
    const ignore = false;
    setConsultLoading(true);
    try {
      const access = await getAccessToken();
      if (!access) { setConsultations([]); return; }
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (consultFilters.status) params.set("status", consultFilters.status);
      const r = await fetch(`${API.ADMIN_CONSULTATIONS}?${params.toString()}`, {
        headers: { authorization: `Bearer ${access}` },
      });
      if (!r.ok) throw new Error("fail");
      const data = await r.json();
      if (ignore) return;
      const list: Consultation[] = Array.isArray(data.results) ? data.results : [];
      const now = Date.now();
      const withTime = list.map((it) => {
        const t = new Date(it.scheduled_at).getTime();
        const time = Number.isFinite(t) ? t : 0;
        return { ...it, _t: time } as Consultation & { _t: number };
      });
      const upcoming = withTime.filter((x) => x._t >= now).sort((a, b) => a._t - b._t);
      const past = withTime.filter((x) => x._t < now).sort((a, b) => b._t - a._t);
      const sorted = [...upcoming, ...past].map((item) => { const { _t, ...rest } = item as typeof item & { _t?: number }; void _t; return rest as Consultation; });
      setConsultations(sorted);
    } catch {
      setConsultations([]);
    } finally {
      if (!ignore) setConsultLoading(false);
    }
  };

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
        const list: Consultation[] = Array.isArray(data.results) ? data.results : [];
        // Ordena para evitar confusão:
        // 1) Futuras primeiro (da mais próxima para a mais distante)
        // 2) Depois passadas (da mais recente para a mais antiga)
        const now = Date.now();
        const withTime = list.map((it) => {
          const t = new Date(it.scheduled_at).getTime();
          const time = Number.isFinite(t) ? t : 0;
          return { ...it, _t: time } as Consultation & { _t: number };
        });
        const upcoming = withTime.filter((x) => x._t >= now).sort((a, b) => a._t - b._t);
        const past = withTime.filter((x) => x._t < now).sort((a, b) => b._t - a._t);
        const sorted = [...upcoming, ...past].map((item) => {
          const { _t, ...rest } = item as typeof item & { _t?: number };
          void _t; // evita aviso de variável não utilizada e remove o campo auxiliar
          return rest as Consultation;
        });
        setConsultations(sorted);
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
              <th className="py-3 px-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {consultLoading && (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <SpinnerLoading text="Carregando consultas..." />
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
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{c.user_display_name || c.user_email || c.user_id.slice(0, 8) + "..."}</span>
                        {c.user_email && (
                          <span className="text-xs text-gray-500">{c.user_email}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{formatTypeLabel(c.type)}</td>
                    <td className="py-3 px-4">{c.duration_min}min</td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={c.status !== 'scheduled' || actionLoading === c.id}
                          onClick={async () => {
                            if (!confirm('Cancelar esta consulta? Esta ação devolverá o crédito ao paciente.')) return;
                            setActionLoading(c.id);
                            try {
                              const access = await getAccessToken();
                              if (!access) return;
                              const r = await fetch(`${API.API_AUTH_BASE}/admin/consultations/${c.id}/cancel`, {
                                method: 'PATCH',
                                headers: { 'authorization': `Bearer ${access}`, 'content-type': 'application/json' },
                                body: JSON.stringify({ reason: 'admin UI' })
                              });
                              if (!r.ok) throw new Error('cancel-failed');
                              push({ type: 'success', message: 'Consulta cancelada.' });
                              await reload();
                            } catch (e) {
                              console.error(e);
                              push({ type: 'error', message: 'Falha ao cancelar consulta.' });
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium border transition ${c.status !== 'scheduled' || actionLoading === c.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-rose-50'} border-rose-200 text-rose-700`}
                          title="Cancelar consulta"
                        >
                          {actionLoading === c.id ? 'Aguarde…' : 'Cancelar'}
                        </button>
                        <button
                          disabled={c.status !== 'scheduled' || actionLoading === c.id}
                          onClick={async () => {
                            if (!confirm('Marcar esta consulta como concluída?')) return;
                            setActionLoading(c.id);
                            try {
                              const access = await getAccessToken();
                              if (!access) return;
                              const r = await fetch(`${API.API_AUTH_BASE}/admin/consultations/${c.id}/complete`, {
                                method: 'PATCH',
                                headers: { 'authorization': `Bearer ${access}` }
                              });
                              if (!r.ok) throw new Error('complete-failed');
                              push({ type: 'success', message: 'Consulta marcada como concluída.' });
                              await reload();
                            } catch (e) {
                              console.error(e);
                              push({ type: 'error', message: 'Falha ao concluir consulta.' });
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium border transition ${c.status !== 'scheduled' || actionLoading === c.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-50'} border-emerald-200 text-emerald-700`}
                          title="Marcar como concluída"
                        >
                          {actionLoading === c.id ? 'Aguarde…' : 'Concluir'}
                        </button>
                      </div>
                    </td>
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
