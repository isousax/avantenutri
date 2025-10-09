import { useExercisePlan } from "../../hooks/useExercisePlan";
import {
  Target,
  Flame,
  Clock,
  Trophy,
  Brain,
  Calendar,
  Lightbulb,
  Activity,
  Dumbbell,
  Heart,
  Zap,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  ArrowLeft,
  X,
  Info,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useEffect, useRef, useState } from "react";
import type {
  AtividadeSugerida,
  RecomendacaoInteligente,
} from "../../hooks/useExerciciosInteligentes";
import { useToast } from "../ui/ToastProvider";
import { useNavigate } from "react-router-dom";

// Componente de ações para o exercício de hoje (extraído para fora para preservar estado entre re-renders)
type AcoesHojeProps = {
  atividadeHoje?: AtividadeSugerida | null;
  hasAlternative: boolean;
  indoorPreferred?: boolean;
  todayKey: string;
  onDone: (payload: {
    name: string;
    finishedAt: string;
    elapsedSec: number;
  }) => void;
};

function AcoesHoje({
  atividadeHoje,
  hasAlternative,
  indoorPreferred,
  todayKey,
  onDone,
}: AcoesHojeProps) {
  const { push } = useToast();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running]);

  const start = () => {
    setRunning(true);
    push({ type: "success", message: "Sessão iniciada. Bom treino! 💪" });
  };
  const stop = () => {
    setRunning(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    push({ type: "info", message: "Sessão pausada." });
  };
  const reset = () => {
    setElapsed(0);
    setRunning(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    push({ type: "info", message: "Timer zerado." });
  };
  const complete = () => {
    setRunning(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    const payload = {
      name: atividadeHoje?.nome || "Exercício",
      finishedAt: new Date().toISOString(),
      elapsedSec: elapsed,
    };
    try {
      localStorage.setItem(todayKey, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
    onDone(payload);
    push({ type: "success", message: "Treino concluído! 🎉" });
  };

  if (!atividadeHoje) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!running ? (
        <button
          onClick={start}
          className="bg-black/30 hover:bg-black/40 text-white border-0 flex items-center justify-center text-sm w-8 h-8 p-0 rounded-full leading-none"
          aria-label="Iniciar treino"
          title="Iniciar"
        >
          <PlayCircle size={18} className="block" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="text-xs bg-white/20 px-2 py-1 rounded font-mono">
            {Math.floor(elapsed / 60)
              .toString()
              .padStart(2, "0")}
            :{(elapsed % 60).toString().padStart(2, "0")}
          </div>
          <button
            onClick={stop}
            className="bg-black/30 hover:bg-black/40 text-white border-0 text-sm w-8 h-8 p-0 shrink-0 rounded-full flex items-center justify-center leading-none"
            aria-label="Pausar treino"
            title="Pausar"
          >
            <PauseCircle size={18} className="block" />
          </button>
          <button
            onClick={reset}
            className="bg-black/30 hover:bg-black/40 text-white border-0 text-sm w-8 h-8 p-0 shrink-0 rounded-full flex items-center justify-center leading-none"
            aria-label="Zerar timer"
            title="Zerar"
          >
            <RotateCcw size={18} className="block" />
          </button>
          <button
            onClick={complete}
            className="bg-green-500/80 hover:bg-green-500 text-white border-0 text-sm w-8 h-8 p-0 shrink-0 rounded-full flex items-center justify-center leading-none"
            aria-label="Concluir treino"
            title="Concluir"
          >
            <CheckCircle size={18} className="block" />
          </button>
        </div>
      )}
      {hasAlternative && (
        <button
          onClick={() => navigate("#alternativa")}
          className="bg-black/20 hover:bg-black/30 text-white border-0 text-sm flex items-center gap-1 rounded-full"
          aria-label={`Ver sugestão ${indoorPreferred ? "indoor" : "outdoor"}`}
          title={`Sugestão ${indoorPreferred ? "indoor" : "outdoor"}`}
        >
          <Activity size={16} />
          <span className="hidden sm:inline">
            Sugestão {indoorPreferred ? "indoor" : "outdoor"}
          </span>
        </button>
      )}
    </div>
  );
}

export function ExerciciosInteligentes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "hoje" | "semana" | "recomendacoes"
  >("hoje");
  const [doneToday, setDoneToday] = useState<null | {
    name: string;
    finishedAt: string;
    elapsedSec: number;
  }>(null);
  const [summaryHidden, setSummaryHidden] = useState(false);

  // Helpers para persistência diária
  const todayKey = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `exercise.session.done.${yyyy}-${mm}-${dd}`;
  })();
  const summaryKey = todayKey.replace(
    "exercise.session.done",
    "exercise.summary.hidden"
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey);
      if (raw) setDoneToday(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    try {
      const h = localStorage.getItem(summaryKey);
      setSummaryHidden(h === "1");
    } catch {
      /* ignore */
    }
  }, [todayKey, summaryKey]);

  const {
    loading,
    error,
    questionario,
    objetivo,
    objetivoLabel,
    objetivoDescricao,
    nivelAtividade,
    nivelCondicionamento,
    caloriasAlvo,
    recomendacoes,
    planoSemanal,
    atividadeHoje,
    indoorPreferred,
    alternativaHoje,
  } = useExercisePlan();

  const diasSemana = [
    { key: "segunda", nome: "SEG", curto: "S" },
    { key: "terca", nome: "TER", curto: "T" },
    { key: "quarta", nome: "QUA", curto: "Q" },
    { key: "quinta", nome: "QUI", curto: "Q" },
    { key: "sexta", nome: "SEX", curto: "S" },
    { key: "sabado", nome: "SÁB", curto: "S" },
    { key: "domingo", nome: "DOM", curto: "D" },
  ];

  const corPorTipo: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      icon: React.ComponentType<{ size?: number; className?: string }>;
    }
  > = {
    cardio: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: Activity,
    },
    forca: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: Dumbbell,
    },
    flexibilidade: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      icon: Heart,
    },
    funcional: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      icon: Zap,
    },
    recuperacao: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: CheckCircle,
    },
  };

  // Conteúdo da aba Hoje
  const renderHoje = () => (
    <div className="space-y-6">
      {!summaryHidden && (
        <Card className="bg-white border-0 shadow-lg rounded-2xl">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Info size={18} className="text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Resumo de hoje
                  </div>
                  <div className="text-sm text-gray-700">
                    {typeof indoorPreferred === "boolean" && (
                      <>
                        Hoje recomendamos{" "}
                        <b>{indoorPreferred ? "indoor" : "outdoor"}</b>
                      </>
                    )}
                    {atividadeHoje && alternativaHoje && (
                      <>
                        {" "}
                        — sugerimos <b>{alternativaHoje.nome}</b> no lugar de{" "}
                        <b>{atividadeHoje.nome}</b> devido ao clima.
                      </>
                    )}
                    {!alternativaHoje && atividadeHoje && (
                      <>
                        {" "}
                        — atividade do dia: <b>{atividadeHoje.nome}</b>.
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Objetivo atual: <b>{objetivoLabel}</b>
                    {nivelAtividade ? (
                      <>
                        {" "}
                        • Nível: <b>{nivelAtividade}</b>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar resumo"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSummaryHidden(true);
                  try {
                    localStorage.setItem(summaryKey, "1");
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </Card>
      )}
      {loading && (
        <Card className="bg-white border-0 shadow rounded-2xl">
          <div className="p-4 text-sm text-gray-600">
            Carregando seu plano de exercícios...
          </div>
        </Card>
      )}
      {error && (
        <Card className="bg-white border-0 shadow rounded-2xl">
          <div className="p-4 text-sm text-red-600">
            Não foi possível carregar o questionário. Usando recomendações
            padrão.
          </div>
        </Card>
      )}
      {questionario && !questionario.is_complete && (
        <Card className="bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="text-sm text-amber-800">
              Complete o questionário para personalizar ainda mais seus
              exercícios.
            </div>
            <Button
              onClick={() => navigate("/questionario")}
              className="bg-amber-600 hover:bg-amber-700 text-white border-0"
            >
              Completar
            </Button>
          </div>
        </Card>
      )}

      {/* Atividade de Hoje em Destaque */}
      {atividadeHoje && (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="p-2 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy size={24} className="text-yellow-300" />
                <h2 className="text-lg font-bold">Exercício de Hoje</h2>
              </div>
              <AcoesHoje
                atividadeHoje={atividadeHoje}
                hasAlternative={Boolean(alternativaHoje)}
                indoorPreferred={indoorPreferred}
                todayKey={todayKey}
                onDone={setDoneToday}
              />
            </div>

            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{atividadeHoje.icone}</div>
                  <div className="flex-1">
                    <div className="flex justify-between gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {atividadeHoje.nome}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-medium bg-white/20 text-white border border-white/30`}
                      >
                        {atividadeHoje.tipo}
                      </span>
                    </div>
                    <p className="text-blue-100 mb-4 text-sm">
                      {atividadeHoje.descricao}
                    </p>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-xs text-blue-100 mb-1">
                          <Clock size={14} />
                          Duração
                        </div>
                        <div className="font-bold text-white text-sm">
                          {atividadeHoje.duracao}min
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-xs text-blue-100 mb-1">
                          <Flame size={14} />
                          Calorias
                        </div>
                        <div className="font-bold text-white text-sm">
                          {atividadeHoje.calorias}kcal
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-xs text-blue-100 mb-1">
                          <Target size={14} />
                          Dificuldade
                        </div>
                        <div className="font-bold text-white text-sm">
                          {atividadeHoje.dificuldade}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="font-semibold text-white mb-3 text-sm">
                  Benefícios Principais:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {atividadeHoje.beneficios.map(
                    (beneficio: string, index: number) => (
                      <span
                        key={index}
                        className="bg-white/20 text-white px-3 py-1 rounded-full text-xs border border-white/30"
                      >
                        {beneficio}
                      </span>
                    )
                  )}
                </div>
                {doneToday && (
                  <div className="mt-3 text-xs text-green-100 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-200" />
                    Treino concluído hoje às{" "}
                    {new Date(doneToday.finishedAt).toLocaleTimeString(
                      "pt-BR",
                      { hour: "2-digit", minute: "2-digit" }
                    )}{" "}
                    • {Math.floor(doneToday.elapsedSec / 60)}min
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dicas Rápidas */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0 shadow-lg rounded-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">Dica do Dia</h3>
          </div>
          <p className="text-gray-700 text-sm">{objetivoDescricao}</p>
          <div className="text-xs text-gray-500 mt-2">
            Plano baseado em: <b>{objetivoLabel}</b>
            {nivelAtividade ? `, nível ${nivelAtividade}` : ""}.
          </div>
        </div>
      </Card>

      {/* Alternativa conforme clima */}
      {alternativaHoje && (
        <Card
          id="alternativa"
          className="bg-white border-0 shadow-lg rounded-2xl"
        >
          <div className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Activity size={18} className="text-purple-600" />
              <h3 className="font-semibold text-gray-900">
                Alternativa para hoje ({indoorPreferred ? "indoor" : "outdoor"})
              </h3>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="text-2xl">{alternativaHoje.icone}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">
                  {alternativaHoje.nome}
                </div>
                <div className="text-xs text-gray-600">
                  {alternativaHoje.duracao}min • {alternativaHoje.calorias}kcal
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Ambiente: {alternativaHoje.ambiente}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // AcoesHoje foi extraído para fora do componente para evitar perder estado do timer a cada re-render

  // Conteúdo da aba Semana
  const renderSemana = () => (
    <div className="space-y-6">
      {/* Resumo da Semana */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center bg-blue-50 border-0">
          <Clock size={20} className="text-blue-600 mx-auto mb-2" />
          <div className="text-lg font-bold text-blue-700">
            {planoSemanal.totalSemanal.tempo}min
          </div>
        </Card>
        <Card className="text-center bg-orange-50 border-0">
          <Flame size={20} className="text-orange-600 mx-auto mb-2" />
          <div className="text-lg font-bold text-orange-700">
            {planoSemanal.totalSemanal.calorias}kcal
          </div>
        </Card>
        <Card className="text-center bg-green-50 border-0">
          <Activity size={20} className="text-green-600 mx-auto mb-2" />
          <div className="text-lg font-bold text-green-700">
            {planoSemanal.totalSemanal.variedade} tipos
          </div>
        </Card>
      </div>

      {/* Grade Semanal */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="">
          <div className="flex items-center gap-3 mb-6">
            <Calendar size={20} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">Plano da Semana</h3>
          </div>

          <div className="space-y-4">
            {diasSemana.map((dia) => {
              const atividades =
                planoSemanal[dia.key as keyof typeof planoSemanal];
              const hojeFormatado = new Intl.DateTimeFormat("pt-BR", {
                timeZone: "America/Sao_Paulo",
                weekday: "long",
              }).format(new Date());

              const hojeKey = hojeFormatado
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .split("-")[0];

              const isToday = dia.key === hojeKey;

              return (
                <div
                  key={dia.key}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isToday
                      ? "border-blue-300 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${
                      isToday
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span className="text-sm">{dia.curto}</span>
                    <span className="text-xs">{isToday ? "HOJE" : ""}</span>
                  </div>

                  <div className="flex-1">
                    {Array.isArray(atividades) && atividades.length > 0 ? (
                      <div className="space-y-2">
                        {atividades.map(
                          (atividade: AtividadeSugerida, index: number) => {
                            const tipoConfig = corPorTipo[atividade.tipo];
                            const TipoIcon = tipoConfig.icon;

                            return (
                              <div
                                key={index}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${tipoConfig.border} ${tipoConfig.bg}`}
                              >
                                <TipoIcon
                                  size={18}
                                  className={tipoConfig.text}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800 text-sm">
                                    {atividade.nome}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {atividade.duracao}min •{" "}
                                    {atividade.calorias}kcal
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-4">
                        <CheckCircle
                          size={24}
                          className="mx-auto mb-2 text-gray-300"
                        />
                        <div className="font-medium">Dia de Descanso</div>
                        <div className="text-sm">Recuperação ativa</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );

  // Conteúdo da aba Recomendações
  const renderRecomendacoes = () => (
    <div className="space-y-6">
      {recomendacoes.map((rec: RecomendacaoInteligente, index: number) => (
        <Card
          key={index}
          className="border-0 shadow-lg rounded-2xl overflow-hidden"
        >
          <div className="">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{rec.icone}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {rec.titulo}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rec.intensidade === "baixa"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : rec.intensidade === "moderada"
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    {rec.intensidade}
                  </span>
                </div>
                <p className="text-gray-600 mb-3 text-sm">{rec.descricao}</p>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-blue-700 font-medium text-xs">
                    💡 {rec.motivacao}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Dicas Gerais (reflete clima/objetivo/questionário) */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg rounded-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={20} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">Dicas</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Zap size={16} className="text-green-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-sm">
                Clima considerado:{" "}
                {indoorPreferred ? (
                  <>
                    <strong>preferindo indoor</strong> (calor/frio)
                  </>
                ) : (
                  <>
                    ambiente externo <strong>liberado</strong>
                  </>
                )}{" "}
                — ajustamos suas sugestões conforme a temperatura.
                {alternativaHoje ? (
                  <>
                    {" "}
                    Você tem uma alternativa sugerida para hoje.{" "}
                    <a href="#alternativa" className="underline">
                      Ver
                    </a>
                    .
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Target size={16} className="text-blue-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-sm">
                Objetivo: <strong>{objetivoLabel}</strong> —{" "}
                {objetivo === "perder"
                  ? "foco extra em cardio e funcional."
                  : objetivo === "ganhar"
                  ? "priorizando treinos de força."
                  : "plano equilibrado entre cardio, força e mobilidade."}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Activity
                size={16}
                className="text-orange-500 mt-1 flex-shrink-0"
              />
              <p className="text-gray-700 text-sm">
                <strong>{planoSemanal.totalSemanal.variedade} tipos</strong> de
                exercícios diferentes para desenvolvimento completo
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Activity
                size={16}
                className="text-purple-500 mt-1 flex-shrink-0"
              />
              <p className="text-gray-700 text-sm">
                Nível atual: <strong>{nivelCondicionamento}</strong>
                {nivelAtividade ? <> ({nivelAtividade})</> : null} —
                aumentaremos a intensidade gradualmente conforme sua
                consistência.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Flame size={16} className="text-orange-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-sm">
                Meta de hoje: <strong>{caloriasAlvo} kcal</strong> via
                exercícios. Adapte conforme sua energia e rotina.
              </p>
            </div>
            {questionario && !questionario.is_complete && (
              <div className="flex items-start gap-3">
                <Info size={16} className="text-amber-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700 text-sm">
                  Complete seu questionário para personalização máxima (objetivo
                  e nível de atividade).{" "}
                  <button
                    className="underline"
                    onClick={() => navigate("/questionario")}
                  >
                    Ir para o questionário
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 safe-area-bottom">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Exercícios
              </h1>
            </div>

            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-6">
        {/* Tabs de Navegação */}
        <Card className="bg-white border-0 shadow-lg rounded-2xl mb-6">
          <div className="flex p-1">
            <button
              onClick={() => setActiveTab("hoje")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === "hoje"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy size={16} />
                Hoje
              </div>
            </button>

            <button
              onClick={() => setActiveTab("semana")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === "semana"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={16} />
                Semana
              </div>
            </button>

            <button
              onClick={() => setActiveTab("recomendacoes")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === "recomendacoes"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Brain size={16} />
                Dicas
              </div>
            </button>
          </div>
        </Card>

        {/* Conteúdo das Tabs */}
        <div className="animate-fade-in">
          {activeTab === "hoje" && renderHoje()}
          {activeTab === "semana" && renderSemana()}
          {activeTab === "recomendacoes" && renderRecomendacoes()}
        </div>
      </div>
    </div>
  );
}
