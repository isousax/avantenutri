import { useExerciciosInteligentes } from "../../hooks/useExerciciosInteligentes";
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
  Star,
  CheckCircle,
  PlayCircle,
  ArrowLeft,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function ExerciciosInteligentes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'hoje' | 'semana' | 'recomendacoes'>('hoje');
  
  const {
    nivelCondicionamento,
    caloriasAlvo,
    recomendacoes,
    planoSemanal,
    atividadeHoje,
  } = useExerciciosInteligentes();

  const diasSemana = [
    { key: "segunda", nome: "SEG", curto: "S" },
    { key: "terca", nome: "TER", curto: "T" },
    { key: "quarta", nome: "QUA", curto: "Q" },
    { key: "quinta", nome: "QUI", curto: "Q" },
    { key: "sexta", nome: "SEX", curto: "S" },
    { key: "sabado", nome: "SÁB", curto: "S" },
    { key: "domingo", nome: "DOM", curto: "D" },
  ];

  const corPorTipo: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    cardio: { 
      bg: "bg-red-50", 
      text: "text-red-700", 
      border: "border-red-200",
      icon: Activity
    },
    forca: { 
      bg: "bg-blue-50", 
      text: "text-blue-700", 
      border: "border-blue-200",
      icon: Dumbbell
    },
    flexibilidade: { 
      bg: "bg-green-50", 
      text: "text-green-700", 
      border: "border-green-200",
      icon: Heart
    },
    funcional: { 
      bg: "bg-purple-50", 
      text: "text-purple-700", 
      border: "border-purple-200",
      icon: Zap
    },
    recuperacao: { 
      bg: "bg-gray-50", 
      text: "text-gray-700", 
      border: "border-gray-200",
      icon: CheckCircle
    },
  };

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'iniciante': return <Star className="text-green-500" size={20} />;
      case 'intermediario': return <Zap className="text-yellow-500" size={20} />;
      case 'avancado': return <Trophy className="text-red-500" size={20} />;
      default: return <Activity className="text-blue-500" size={20} />;
    }
  };

  // Conteúdo da aba Hoje
  const renderHoje = () => (
    <div className="space-y-6">
      {/* Stats Rápidos */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border-0 shadow-lg rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
            {getNivelIcon(nivelCondicionamento)}
          </div>
          <p className="text-sm font-medium text-gray-600">Nível</p>
          <p className="text-lg font-bold text-gray-900 capitalize">
            {nivelCondicionamento}
          </p>
        </Card>

        <Card className="bg-white border-0 shadow-lg rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Flame size={20} className="text-white" />
          </div>
          <p className="text-sm font-medium text-gray-600">Meta</p>
          <p className="text-lg font-bold text-gray-900">{caloriasAlvo} kcal</p>
        </Card>

        <Card className="bg-white border-0 shadow-lg rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Clock size={20} className="text-white" />
          </div>
          <p className="text-sm font-medium text-gray-600">Semana</p>
          <p className="text-lg font-bold text-gray-900">{planoSemanal.totalSemanal.tempo}min</p>
        </Card>
      </div>

      {/* Atividade de Hoje em Destaque */}
      {atividadeHoje && (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="p-2 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy size={24} className="text-yellow-300" />
                <h2 className="text-lg font-bold">Exercício de Hoje</h2>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-0 flex items-center justify-center text-sm">
                <PlayCircle size={18} />
              </Button>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{atividadeHoje.icone}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {atividadeHoje.nome}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30`}>
                        {atividadeHoje.tipo}
                      </span>
                    </div>
                    <p className="text-blue-100 mb-4">{atividadeHoje.descricao}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm text-blue-100 mb-1">
                          <Clock size={14} />
                          Duração
                        </div>
                        <div className="font-bold text-white">{atividadeHoje.duracao}min</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm text-blue-100 mb-1">
                          <Flame size={14} />
                          Calorias
                        </div>
                        <div className="font-bold text-white">{atividadeHoje.calorias}kcal</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm text-blue-100 mb-1">
                          <Target size={14} />
                          Dificuldade
                        </div>
                        <div className="font-bold text-white">{atividadeHoje.dificuldade}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="font-semibold text-white mb-3">Benefícios Principais:</h4>
                <div className="flex flex-wrap gap-2">
                  {atividadeHoje.beneficios.map((beneficio: string, index: number) => (
                    <span
                      key={index}
                      className="bg-white/20 text-white px-3 py-1 rounded-full text-xs border border-white/30"
                    >
                      {beneficio}
                    </span>
                  ))}
                </div>
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
          <p className="text-gray-700">
            Mantenha a consistência! {nivelCondicionamento === 'iniciante' 
              ? 'Comece com exercícios leves e aumente gradualmente.' 
              : nivelCondicionamento === 'intermediario'
              ? 'Varie os tipos de exercício para melhores resultados.'
              : 'Desafie-se com intensidade progressiva para evolução contínua.'
            }
          </p>
        </div>
      </Card>
    </div>
  );

  // Conteúdo da aba Semana
  const renderSemana = () => (
    <div className="space-y-6">
      {/* Resumo da Semana */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4 bg-blue-50 border-0">
          <Clock size={20} className="text-blue-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Tempo Total</div>
          <div className="text-lg font-bold text-blue-700">{planoSemanal.totalSemanal.tempo}min</div>
        </Card>
        <Card className="text-center p-4 bg-orange-50 border-0">
          <Flame size={20} className="text-orange-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Calorias Total</div>
          <div className="text-lg font-bold text-orange-700">{planoSemanal.totalSemanal.calorias}kcal</div>
        </Card>
        <Card className="text-center p-4 bg-green-50 border-0">
          <Activity size={20} className="text-green-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Variedade</div>
          <div className="text-lg font-bold text-green-700">{planoSemanal.totalSemanal.variedade} tipos</div>
        </Card>
      </div>

      {/* Grade Semanal */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-6">
            <Calendar size={20} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">Plano da Semana</h3>
          </div>

          <div className="space-y-4">
            {diasSemana.map((dia) => {
              const atividades = planoSemanal[dia.key as keyof typeof planoSemanal];
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
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${
                    isToday 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <span className="text-sm">{dia.curto}</span>
                    <span className="text-xs">{isToday ? 'HOJE' : ''}</span>
                  </div>
                  
                  <div className="flex-1">
                    {Array.isArray(atividades) && atividades.length > 0 ? (
                      <div className="space-y-2">
                        {atividades.map((atividade: any, index: number) => {
                          const tipoConfig = corPorTipo[atividade.tipo];
                          const TipoIcon = tipoConfig.icon;
                          
                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${tipoConfig.border} ${tipoConfig.bg}`}
                            >
                              <TipoIcon size={18} className={tipoConfig.text} />
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">
                                  {atividade.nome}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {atividade.duracao}min • {atividade.calorias}kcal
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-4">
                        <CheckCircle size={24} className="mx-auto mb-2 text-gray-300" />
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
      {recomendacoes.map((rec: any, index: number) => (
        <Card key={index} className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{rec.icone}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{rec.titulo}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rec.intensidade === "baixa" 
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : rec.intensidade === "moderada"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {rec.intensidade}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{rec.descricao}</p>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-blue-700 font-medium text-sm">
                    💡 {rec.motivacao}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Dicas Gerais */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg rounded-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={20} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">Dicas Inteligentes</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Zap size={16} className="text-green-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-sm">
                Seu plano é adaptado para nível <strong>{nivelCondicionamento}</strong> e se ajusta automaticamente ao seu progresso
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Target size={16} className="text-blue-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-sm">
                Meta diária de <strong>{caloriasAlvo} calorias</strong> queimadas através de exercícios
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Activity size={16} className="text-orange-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-sm">
                <strong>{planoSemanal.totalSemanal.variedade} tipos</strong> de exercícios diferentes para desenvolvimento completo
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 safe-area-bottom">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4">
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

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs de Navegação */}
        <Card className="bg-white border-0 shadow-lg rounded-2xl mb-6">
          <div className="flex p-1">
            <button
              onClick={() => setActiveTab('hoje')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'hoje'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy size={16} />
                Hoje
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('semana')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'semana'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={16} />
                Semana
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('recomendacoes')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'recomendacoes'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
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
          {activeTab === 'hoje' && renderHoje()}
          {activeTab === 'semana' && renderSemana()}
          {activeTab === 'recomendacoes' && renderRecomendacoes()}
        </div>
      </div>
    </div>
  );
}