import React, { useEffect, useState, useCallback } from "react";
import Skeleton from "../../components/ui/Skeleton";
import type { FormEvent, ChangeEvent } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { API } from "../../config/api";
import { useAuth } from "../../contexts";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { SEO } from "../../components/comum/SEO";
import { AdminQuestionnaireModal } from "../../components/admin/AdminQuestionnaireModal";
import { useToast } from "../../components/ui/ToastProvider";
import {
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Settings,
  Activity,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

interface Consultation {
  id: string;
  user_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  urgency?: string;
  notes?: string;
  user_name?: string;
  user_email?: string;
}

interface AvailabilityRule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  max_parallel: number;
  active: number;
}

interface AvailabilityLogEntry {
  id: string;
  rule_id: string;
  action: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  max_parallel: number;
  active: number;
  created_at: string;
  user_id?: string;
}

interface DaySlots {
  date: string;
  slots: { start: string; end: string; taken: boolean; available: boolean }[];
}

interface PaginationInfo {
  page: number;
  total: number;
  pageSize: number;
  totalPages: number;
}

const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
// statusOptions removido (não utilizado)

const AdminConsultationsPage: React.FC = () => {
  const { authenticatedFetch } = useAuth();
  const { locale, t } = useI18n();
  const { push } = useToast();

  // Consultations states
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Consultation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    total: 0,
    pageSize: 20,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    userId: "",
    from: "",
    to: "",
  });
  const [error, setError] = useState<string | null>(null);
  // exportLoading removido (exportCsv não utilizado)

  // Availability rules states
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [ruleForm, setRuleForm] = useState({
    weekday: 1,
    start_time: "09:00",
    end_time: "18:00",
    slot_duration_min: 60,
    max_parallel: 1,
  });
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    weekday: 1,
    start_time: "",
    end_time: "",
    slot_duration_min: 40,
    max_parallel: 1,
  });

  // Slots states
  const [slotsRange, setSlotsRange] = useState({ from: "", to: "" });
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Log states
  const [logEntries, setLogEntries] = useState<AvailabilityLogEntry[]>([]);
  const [logPagination, setLogPagination] = useState<PaginationInfo>({
    page: 1,
    total: 0,
    pageSize: 50,
    totalPages: 0,
  });
  const [logFilters, setLogFilters] = useState({
    ruleId: "",
    action: "",
    sort: "created_at" as "created_at" | "action" | "weekday",
    direction: "desc" as "asc" | "desc",
  });
  const [logLoading, setLogLoading] = useState(false);

  // Modal states
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  // Validation helper
  const validateTimes = useCallback(
    (start: string, end: string): string | null => {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start) || !timeRegex.test(end)) {
        return "TIME_INVALID";
      }

      const [startHours, startMinutes] = start.split(":").map(Number);
      const [endHours, endMinutes] = end.split(":").map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;

      if (endTotal <= startTotal) {
        return "TIME_RANGE_INVALID";
      }

      return null;
    },
    []
  );

  // Load consultations
  const loadConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (filters.from && !/^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
        setError('Data "De" deve estar no formato YYYY-MM-DD');
        return;
      }
      if (filters.to && !/^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
        setError('Data "Até" deve estar no formato YYYY-MM-DD');
        return;
      }
      if (filters.from && filters.to && filters.from > filters.to) {
        setError('Data "De" deve ser anterior ou igual à data "Até"');
        return;
      }

      const qs = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      });
      if (filters.status) qs.set("status", filters.status);
      if (filters.userId) qs.set("user_id", filters.userId);
      if (filters.from) qs.set("from", filters.from);
      if (filters.to) qs.set("to", filters.to);

      const r = await authenticatedFetch(
        `${API.ADMIN_CONSULTATIONS}?${qs.toString()}`
      );

      if (!r.ok) {
        if (r.status === 400) {
          try {
            const errorData = await r.json();
            setError(
              `Erro de validação: ${errorData.error || "Parâmetros inválidos"}`
            );
          } catch {
            setError("Erro de validação: Parâmetros inválidos");
          }
          return;
        }
        throw new Error(t("admin.consultations.error.load"));
      }

      const data = await r.json();
      setItems(data.results || []);

      const total = typeof data.total === "number" ? data.total : 0;
      const totalPages = Math.ceil(total / pagination.pageSize);
      setPagination((prev) => ({ ...prev, total, totalPages }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      push({ type: "error", message: "Erro ao carregar consultas" });
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, t, filters, pagination.page, pagination.pageSize, push]);

  // Load availability rules
  const loadRules = useCallback(async () => {
    try {
      const r = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY);
      if (r.ok) {
        const data = await r.json();
        setRules(data.results || []);
      }
    } catch (error) {
      console.error("Error loading rules:", error);
      push({ type: "error", message: "Erro ao carregar regras" });
    }
  }, [authenticatedFetch, push]);

  // Load log entries
  const loadLog = useCallback(async () => {
    try {
      setLogLoading(true);
      const qs = new URLSearchParams({
        page: String(logPagination.page),
        pageSize: String(logPagination.pageSize),
        sort: logFilters.sort,
        direction: logFilters.direction,
      });
      if (logFilters.ruleId) qs.set("rule_id", logFilters.ruleId);
      if (logFilters.action) qs.set("action", logFilters.action);

      const r = await authenticatedFetch(
        `${API.ADMIN_CONSULTATION_AVAILABILITY_LOG}?${qs.toString()}`
      );
      if (r.ok) {
        const data = await r.json();
        setLogEntries(data.results || []);

        const total = typeof data.total === "number" ? data.total : 0;
        const totalPages = Math.ceil(total / logPagination.pageSize);
        setLogPagination((prev) => ({ ...prev, total, totalPages }));
      }
    } catch (error) {
      console.error("Error loading log:", error);
      push({ type: "error", message: "Erro ao carregar log" });
    } finally {
      setLogLoading(false);
    }
  }, [
    authenticatedFetch,
    logPagination.page,
    logPagination.pageSize,
    logFilters,
    push
  ]);

  // Load available slots
  const loadSlots = useCallback(async () => {
    if (!slotsRange.from || !slotsRange.to) return;

    try {
      setLoadingSlots(true);
      const qs = new URLSearchParams({
        from: slotsRange.from,
        to: slotsRange.to,
      });
      const r = await authenticatedFetch(
        `${API.CONSULTATION_AVAILABLE_SLOTS}?${qs.toString()}`
      );
      if (r.ok) {
        const data = await r.json();
        setSlots(data.days || []);
      }
    } catch (error) {
      console.error("Error loading slots:", error);
      push({ type: "error", message: "Erro ao carregar slots" });
    } finally {
      setLoadingSlots(false);
    }
  }, [authenticatedFetch, slotsRange, push]);

  // Effects
  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  useEffect(() => {
    loadRules();
    loadLog();
  }, [loadRules, loadLog]);

  // Filter handlers
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(newPage, prev.totalPages)),
    }));
  };

  const handleLogPageChange = (newPage: number) => {
    setLogPagination((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(newPage, prev.totalPages)),
    }));
  };

  // Rule operations
  const createRule = async (e: FormEvent) => {
    e.preventDefault();
    setRuleError(null);

    const timeError = validateTimes(ruleForm.start_time, ruleForm.end_time);
    if (timeError) {
      setRuleError(
        timeError === "TIME_INVALID"
          ? "Horário inválido"
          : "Horário final deve ser após o horário inicial"
      );
      return;
    }

    try {
      const r = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleForm),
      });

      if (r.ok) {
        setRuleForm({
          weekday: 1,
          start_time: "09:00",
          end_time: "12:00",
          slot_duration_min: 40,
          max_parallel: 1,
        });
        await loadRules();
        await loadLog();
        push({ type: "success", message: "Regra criada com sucesso" });
      } else {
        const data = await r.json();
        if (data.error === "overlap") {
          const conflict = data.conflict;
          setRuleError(
            `Conflito com regra existente: ${weekdayNames[conflict.weekday]} ${conflict.start_time}-${conflict.end_time}`
          );
        } else {
          setRuleError("Erro ao criar regra");
        }
      }
    } catch {
      setRuleError("Erro ao criar regra");
    }
  };

  const toggleRule = async (id: string, active: number) => {
    setRuleError(null);
    try {
      const r = await authenticatedFetch(
        `${API.ADMIN_CONSULTATION_AVAILABILITY}/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: active ? 0 : 1 }),
        }
      );

      if (r.ok) {
        await loadRules();
        push({ type: "success", message: "Regra atualizada com sucesso" });
      } else {
        const data = await r.json();
        if (data.error === "overlap") {
          const conflict = data.conflict;
          setRuleError(
            `Conflito com regra existente: ${weekdayNames[conflict.weekday]} ${conflict.start_time}-${conflict.end_time}`
          );
        } else {
          setRuleError("Erro ao atualizar regra");
        }
      }
    } catch {
      setRuleError("Erro ao atualizar regra");
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;

    setRuleError(null);
    try {
      const r = await authenticatedFetch(
        `${API.ADMIN_CONSULTATION_AVAILABILITY}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (r.ok) {
        await loadRules();
        await loadLog();
        push({ type: "success", message: "Regra excluída com sucesso" });
      } else {
        setRuleError("Erro ao excluir regra");
      }
    } catch {
      setRuleError("Erro ao excluir regra");
    }
  };

  const startEdit = (rule: AvailabilityRule) => {
    setEditingId(rule.id);
    setEditDraft({
      weekday: rule.weekday,
      start_time: rule.start_time,
      end_time: rule.end_time,
      slot_duration_min: rule.slot_duration_min,
      max_parallel: rule.max_parallel,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setRuleError(null);

    const timeError = validateTimes(editDraft.start_time, editDraft.end_time);
    if (timeError) {
      setRuleError(
        timeError === "TIME_INVALID"
          ? "Horário inválido"
          : "Horário final deve ser após o horário inicial"
      );
      return;
    }

    try {
      const r = await authenticatedFetch(
        `${API.ADMIN_CONSULTATION_AVAILABILITY}/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editDraft),
        }
      );

      if (r.ok) {
        setEditingId(null);
        await loadRules();
        await loadLog();
        push({ type: "success", message: "Regra atualizada com sucesso" });
      } else {
        const data = await r.json();
        if (data.error === "overlap") {
          const conflict = data.conflict;
          setRuleError(
            `Conflito com regra existente: ${weekdayNames[conflict.weekday]} ${conflict.start_time}-${conflict.end_time}`
          );
        } else {
          setRuleError("Erro ao atualizar regra");
        }
      }
    } catch {
      setRuleError("Erro ao atualizar regra");
    }
  };

  const duplicateRule = async (rule: AvailabilityRule) => {
    setRuleError(null);
    try {
      const payload = {
        weekday: rule.weekday,
        start_time: rule.start_time,
        end_time: rule.end_time,
        slot_duration_min: rule.slot_duration_min,
        max_parallel: rule.max_parallel,
      };

      const r = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (r.ok) {
        await loadRules();
        await loadLog();
        push({ type: "success", message: "Regra duplicada com sucesso" });
      } else {
        const data = await r.json();
        if (data.error === "overlap") {
          const conflict = data.conflict;
          setRuleError(
            `Conflito com regra existente: ${weekdayNames[conflict.weekday]} ${conflict.start_time}-${conflict.end_time}`
          );
        } else {
          setRuleError("Erro ao duplicar regra");
        }
      }
    } catch {
      setRuleError("Erro ao duplicar regra");
    }
  };

  // Export functionality removida por não estar em uso atualmente.

  // Modal handlers
  const handleViewQuestionnaire = (userId: string, userName?: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName || userId);
    setShowQuestionnaireModal(true);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      userId: "",
      from: "",
      to: "",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'canceled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock size={14} />;
      case 'completed':
        return <CheckCircle size={14} />;
      case 'canceled':
        return <XCircle size={14} />;
      default:
        return <Calendar size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 safe-area-bottom">
      <SEO
        title={t("admin.consultations.seo.title")}
        description={t("admin.consultations.seo.desc")}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          {/* Refresh Button - Mobile */}
          <div className="absolute top-4 right-4 sm:hidden">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                loadConsultations();
                loadRules();
                loadLog();
              }}
              disabled={loading}
              className="flex items-center gap-2"
              noBorder
              noFocus
              noBackground
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.consultations.heading")}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Gerencie consultas e disponibilidade
                </p>
              </div>
            </div>

            {/* Refresh Button - Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  loadConsultations();
                  loadRules();
                  loadLog();
                }}
                disabled={loading}
                className="flex items-center gap-2"
                noBorder
                noFocus
                noBackground
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
        {/* Consultations Section */}
        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Consultas</h2>
              </div>
            </div>
          </div>

          {/* Filters */}
          <form onSubmit={handleFilterSubmit} className="mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Filter size={14} />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handleFilterChange("status", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="scheduled">Agendada</option>
                  <option value="canceled">Cancelada</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Search size={14} />
                  User ID
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange("userId", e.target.value)
                  }
                  placeholder="Digite o ID do usuário"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange("from", e.target.value)
                  }
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    filters.from && filters.to && filters.from > filters.to
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange("to", e.target.value)
                  }
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    filters.from && filters.to && filters.from > filters.to
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex items-center gap-2 flex-1">
                  <Search size={14} />
                  Buscar
                </Button>
                {(filters.status || filters.userId || filters.from || filters.to) && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {filters.from && filters.to && filters.from > filters.to && (
              <div className="text-red-600 text-sm mt-2 flex items-center gap-2">
                <XCircle size={14} />
                Data inicial deve ser anterior à data final
              </div>
            )}
          </form>

          {/* Error Message */}
          {error && (
            <Card className="p-4 border-l-4 border-red-500 bg-red-50 mb-4">
              <div className="flex items-start gap-3">
                <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">
                    Erro ao carregar consultas
                  </h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Consultations Table - Desktop */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-left font-semibold text-gray-700">Data/Hora</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Usuário</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Tipo</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="p-4">
                        <div className="space-y-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} lines={1} className="h-12" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && items.map((consultation) => (
                    <tr key={consultation.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {fmtDate(consultation.scheduled_at, locale, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            <User size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {consultation.user_name || "Sem nome"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {consultation.user_email}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              ID: {consultation.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600 capitalize">
                          {consultation.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(consultation.status)}`}>
                          {getStatusIcon(consultation.status)}
                          <span className="text-xs font-medium capitalize">
                            {consultation.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            handleViewQuestionnaire(
                              consultation.user_id,
                              consultation.user_name
                            )
                          }
                          className="flex items-center gap-2"
                          noBorder
                          noFocus
                          noBackground
                        >
                          <Eye size={14} />
                          Questionário
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!loading && items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <Calendar size={48} className="text-gray-300" />
                          <div>
                            <div className="font-medium text-gray-900 mb-1">
                              Nenhuma consulta encontrada
                            </div>
                            <div className="text-sm">
                              Tente ajustar os filtros de busca
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Consultations List */}
          <div className="space-y-3 lg:hidden">
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton lines={3} />
                  </Card>
                ))}
              </div>
            )}
            {!loading && items.map((consultation) => (
              <Card key={consultation.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      <User size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate text-sm">
                        {consultation.user_name || "Sem nome"}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {consultation.user_email}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        ID: {consultation.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getStatusColor(consultation.status)}`}>
                    {getStatusIcon(consultation.status)}
                    <span className="font-medium capitalize">
                      {consultation.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Data/Hora</div>
                    <div className="flex items-center gap-1 text-gray-900">
                      <Calendar size={12} />
                      {fmtDate(consultation.scheduled_at, locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tipo</div>
                    <div className="text-gray-900 capitalize">
                      {consultation.type}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    handleViewQuestionnaire(
                      consultation.user_id,
                      consultation.user_name
                    )
                  }
                  className="w-full flex items-center gap-2"
                  noBorder
                  noFocus
                  noBackground
                >
                  <Eye size={14} />
                  Ver Questionário
                </Button>
              </Card>
            ))}

            {!loading && items.length === 0 && (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Calendar size={48} className="text-gray-300" />
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      Nenhuma consulta encontrada
                    </div>
                    <div className="text-sm">
                      Tente ajustar os filtros de busca
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {items.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{items.length}</span> consultas
                {pagination.total > 0 && (
                  <> de <span className="font-semibold">{pagination.total}</span> no total</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="flex items-center gap-2"
                >
                  Anterior
                </Button>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                  Página {pagination.page}
                  {pagination.totalPages > 0 && ` de ${pagination.totalPages}`}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-2"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Availability Rules Section */}
        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <Settings size={16} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Regras de Disponibilidade</h2>
              </div>
            </div>
          </div>

          {/* Add Rule Form */}
          <form onSubmit={createRule} className="mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dia da Semana</label>
                <select
                  value={ruleForm.weekday}
                  onChange={(e) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      weekday: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {weekdayNames.map((name, index) => (
                    <option key={index} value={index}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Início</label>
                <input
                  type="time"
                  value={ruleForm.start_time}
                  onChange={(e) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fim</label>
                <input
                  type="time"
                  value={ruleForm.end_time}
                  onChange={(e) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      end_time: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duração (min)</label>
                <input
                  type="number"
                  value={ruleForm.slot_duration_min}
                  onChange={(e) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      slot_duration_min: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Paralelas</label>
                <input
                  type="number"
                  value={ruleForm.max_parallel}
                  onChange={(e) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      max_parallel: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full flex items-center gap-2">
                  <CheckCircle size={14} />
                  Adicionar
                </Button>
              </div>
            </div>
          </form>

          {ruleError && (
            <Card className="p-4 border-l-4 border-red-500 bg-red-50 mb-4">
              <div className="flex items-start gap-3">
                <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">
                    Erro na regra
                  </h3>
                  <p className="text-red-700 text-sm">{ruleError}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Rules Table - Desktop */}
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-left font-semibold text-gray-700">Dia</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Horário</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Configurações</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rules
                    .sort(
                      (a, b) =>
                        a.weekday - b.weekday ||
                        a.start_time.localeCompare(b.start_time)
                    )
                    .map((rule) => {
                      const isEditing = editingId === rule.id;
                      return (
                        <tr key={rule.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            {isEditing ? (
                              <select
                                value={editDraft.weekday}
                                onChange={(e) =>
                                  setEditDraft((prev) => ({
                                    ...prev,
                                    weekday: Number(e.target.value),
                                  }))
                                }
                                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                              >
                                {weekdayNames.map((name, index) => (
                                  <option key={index} value={index}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-medium text-gray-900">
                                {weekdayNames[rule.weekday]}  
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={editDraft.start_time}
                                  onChange={(e) =>
                                    setEditDraft((prev) => ({
                                      ...prev,
                                      start_time: e.target.value,
                                    }))
                                  }
                                  className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                  type="time"
                                  value={editDraft.end_time}
                                  onChange={(e) =>
                                    setEditDraft((prev) => ({
                                      ...prev,
                                      end_time: e.target.value,
                                    }))
                                  }
                                  className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <span className="text-gray-600">
                                {rule.start_time} - {rule.end_time}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editDraft.slot_duration_min}
                                  onChange={(e) =>
                                    setEditDraft((prev) => ({
                                      ...prev,
                                      slot_duration_min: Number(e.target.value),
                                    }))
                                  }
                                  className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                  min="1"
                                />
                                <span className="text-gray-400">min /</span>
                                <input
                                  type="number"
                                  value={editDraft.max_parallel}
                                  onChange={(e) =>
                                    setEditDraft((prev) => ({
                                      ...prev,
                                      max_parallel: Number(e.target.value),
                                    }))
                                  }
                                  className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                  min="1"
                                />
                                <span className="text-gray-400">paralelas</span>
                              </div>
                            ) : (
                              <span className="text-gray-600">
                                {rule.slot_duration_min} min / {rule.max_parallel} paralelas
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                              rule.active 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {rule.active ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                              <span className="text-xs font-medium">
                                {rule.active ? "Ativa" : "Inativa"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => toggleRule(rule.id, rule.active)}
                                    className="flex items-center gap-1"
                                    noBorder
                                    noFocus
                                    noBackground
                                  >
                                    {rule.active ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => startEdit(rule)}
                                    className="flex items-center gap-1"
                                    noBorder
                                    noFocus
                                    noBackground
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => duplicateRule(rule)}
                                    className="flex items-center gap-1"
                                    noBorder
                                    noFocus
                                    noBackground
                                  >
                                    <Copy size={14} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => deleteRule(rule.id)}
                                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                    noBorder
                                    noFocus
                                    noBackground
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    onClick={() => saveEdit(rule.id)}
                                    className="flex items-center gap-1"
                                  >
                                    <CheckCircle size={14} />
                                    Salvar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={cancelEdit}
                                    className="flex items-center gap-1"
                                    noBorder
                                    noFocus
                                    noBackground
                                  >
                                    <XCircle size={14} />
                                    Cancelar
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <Settings size={48} className="text-gray-300" />
                          <div>
                            <div className="font-medium text-gray-900 mb-1">
                              Nenhuma regra encontrada
                            </div>
                            <div className="text-sm">
                              Adicione uma regra para começar
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Availability Log Section */}
        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <Activity size={16} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Log de Disponibilidade</h2>
              </div>
            </div>
          </div>

          {/* Log Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filtrar por Regra</label>
              <select
                value={logFilters.ruleId}
                onChange={(e) =>
                  setLogFilters((prev) => ({
                    ...prev,
                    ruleId: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as regras</option>
                {rules.map((rule) => (
                  <option key={rule.id} value={rule.id}>
                    {weekdayNames[rule.weekday]} {rule.start_time}-{rule.end_time}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por</label>
              <select
                value={logFilters.sort}
                onChange={(e) =>
                  setLogFilters((prev) => ({
                    ...prev,
                    sort: e.target.value as typeof logFilters.sort,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at">Data</option>
                <option value="action">Ação</option>
                <option value="weekday">Dia</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Direção</label>
              <select
                value={logFilters.direction}
                onChange={(e) =>
                  setLogFilters((prev) => ({
                    ...prev,
                    direction: e.target.value as "asc" | "desc",
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>

          {/* Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left font-semibold text-gray-700">Data/Hora</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Ação</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Dia</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Horário</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Configurações</th>
                </tr>
              </thead>
              <tbody>
                {logLoading && (
                  <tr>
                    <td colSpan={5} className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} lines={1} className="h-12" />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {!logLoading && logEntries.map((entry) => {
                  const actionColors: Record<string, string> = {
                    create: "bg-green-100 text-green-700 border-green-200",
                    update: "bg-blue-100 text-blue-700 border-blue-200",
                    activate: "bg-emerald-100 text-emerald-700 border-emerald-200",
                    deactivate: "bg-amber-100 text-amber-700 border-amber-200",
                    delete: "bg-red-100 text-red-700 border-red-200",
                  };

                  return (
                    <tr key={entry.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">
                        {fmtDate(entry.created_at, locale, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border capitalize ${
                          actionColors[entry.action] || "bg-gray-100 text-gray-700 border-gray-200"
                        }`}>
                          <Activity size={12} />
                          <span className="text-xs font-medium">
                            {entry.action}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {weekdayNames[entry.weekday]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {entry.start_time} - {entry.end_time}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {entry.slot_duration_min}m / {entry.max_parallel}x
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!logLoading && logEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-500">
                        <Activity size={48} className="text-gray-300" />
                        <div>
                          <div className="font-medium text-gray-900 mb-1">
                            Nenhum registro de log encontrado
                          </div>
                          <div className="text-sm">
                            As alterações nas regras aparecerão aqui
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Log Pagination */}
          {logEntries.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{logEntries.length}</span> registros
                {logPagination.total > 0 && (
                  <> de <span className="font-semibold">{logPagination.total}</span> no total</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={logPagination.page === 1}
                  noFocus
                  onClick={() => handleLogPageChange(logPagination.page - 1)}
                  className="flex items-center gap-2"
                >
                  Anterior
                </Button>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                  Página {logPagination.page}
                  {logPagination.totalPages > 0 && ` de ${logPagination.totalPages}`}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleLogPageChange(logPagination.page + 1)}
                  noFocus
                  disabled={logPagination.page >= logPagination.totalPages}
                  className="flex items-center gap-2"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Available Slots Section */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Slots Disponíveis</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Visualize slots de agendamento disponíveis
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Inicial</label>
              <input
                type="date"
                value={slotsRange.from}
                onChange={(e) =>
                  setSlotsRange((prev) => ({
                    ...prev,
                    from: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Final</label>
              <input
                type="date"
                value={slotsRange.to}
                onChange={(e) =>
                  setSlotsRange((prev) => ({
                    ...prev,
                    to: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadSlots}
                disabled={!slotsRange.from || !slotsRange.to || loadingSlots}
                className="w-full flex items-center gap-2"
              >
                <Search size={14} />
                {loadingSlots ? "Carregando..." : "Buscar Slots"}
              </Button>
            </div>
          </div>

          {loadingSlots && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton lines={2} />
                </Card>
              ))}
            </div>
          )}

          {!loadingSlots && slots.length > 0 && (
            <div className="space-y-4">
              {slots.map((day) => (
                <Card key={day.date} className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {new Date(day.date.includes('T') ? day.date : `${day.date}T00:00:00`).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {day.slots.map((slot, index) => (
                      <div
                        key={index}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                          slot.taken
                            ? "bg-red-100 text-red-700 border-red-200"
                            : slot.available
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        <Clock size={12} />
                        {new Date(slot.start).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {slot.taken && " (Ocupado)"}
                        {!slot.available && !slot.taken && " (Indisponível)"}
                      </div>
                    ))}
                  </div>
                  {day.slots.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhum slot disponível neste dia
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {!loadingSlots && slots.length === 0 && slotsRange.from && slotsRange.to && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Clock size={48} className="text-gray-300" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    Nenhum slot encontrado
                  </div>
                  <div className="text-sm">
                    Tente ajustar o período de busca
                  </div>
                </div>
              </div>
            </Card>
          )}
        </Card>
      </div>

      {/* Questionnaire Modal */}
      <AdminQuestionnaireModal
        isOpen={showQuestionnaireModal}
        onClose={() => setShowQuestionnaireModal(false)}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </div>
  );
};

export default AdminConsultationsPage;