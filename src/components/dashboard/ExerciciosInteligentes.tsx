import { useExerciciosInteligentes } from "../../hooks/useExerciciosInteligentes";

export function ExerciciosInteligentes() {
  const {
    nivelCondicionamento,
    caloriasAlvo,
    recomendacoes,
    planoSemanal,
    atividadeHoje,
  } = useExerciciosInteligentes();

  const diasSemana = [
    { key: "segunda", nome: "SEG" },
    { key: "terca", nome: "TER" },
    { key: "quarta", nome: "QUA" },
    { key: "quinta", nome: "QUI" },
    { key: "sexta", nome: "SEX" },
    { key: "sabado", nome: "SÁB" },
    { key: "domingo", nome: "DOM" },
  ];

  const corPorTipo: Record<string, string> = {
    cardio: "bg-red-100 text-red-700 border-red-200",
    forca: "bg-blue-100 text-blue-700 border-blue-200",
    flexibilidade: "bg-green-100 text-green-700 border-green-200",
    funcional: "bg-purple-100 text-purple-700 border-purple-200",
    recuperacao: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const corPorIntensidade: Record<string, string> = {
    baixa: "border-l-green-400",
    moderada: "border-l-yellow-400",
    alta: "border-l-red-400",
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          💪 Exercícios Inteligentes
        </h1>
        <p className="text-gray-600">
          Plano personalizado baseado no seu perfil e objetivos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nível</p>
              <p className="text-2xl font-bold text-blue-600 capitalize">
                {nivelCondicionamento}
              </p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meta Calorias</p>
              <p className="text-2xl font-bold text-orange-600">
                {caloriasAlvo}
              </p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-2xl font-bold text-green-600">
                {planoSemanal.totalSemanal.tempo}min
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>
      </div>

      {/* Atividade de Hoje */}
      {atividadeHoje && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🏆</span>
            Atividade Recomendada para Hoje
          </h2>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{atividadeHoje.icone}</span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {atividadeHoje.nome}
                  </h3>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${
                      corPorTipo[atividadeHoje.tipo]
                    }`}
                  >
                    {atividadeHoje.tipo}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{atividadeHoje.descricao}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>⏱️ {atividadeHoje.duracao} min</span>
                  <span>🔥 {atividadeHoje.calorias} kcal</span>
                  <span>📊 {atividadeHoje.dificuldade}</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Benefícios:</h4>
              <div className="flex flex-wrap gap-2">
                {atividadeHoje.beneficios.map(
                  (beneficio: string, index: number) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs"
                    >
                      {beneficio}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recomendações Inteligentes */}
      {recomendacoes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🧠</span>
            Recomendações Inteligentes
          </h2>
          <div className="space-y-4">
            {recomendacoes.map((rec: any, index: number) => (
              <div
                key={index}
                className={`bg-gray-50 rounded-lg p-4 border-l-4 ${
                  corPorIntensidade[rec.intensidade]
                }`}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{rec.icone}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {rec.titulo}
                    </h3>
                    <p className="text-gray-600 mb-2">{rec.descricao}</p>
                    <p className="text-blue-600 font-medium text-sm">
                      {rec.motivacao}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.intensidade === "baixa"
                        ? "bg-green-100 text-green-700"
                        : rec.intensidade === "moderada"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {rec.intensidade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plano Semanal */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">📅</span>
          Plano Semanal Inteligente
        </h2>

        {/* Resumo da Semana */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Tempo Total</p>
              <p className="text-lg font-bold text-blue-600">
                {planoSemanal.totalSemanal.tempo} min
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Calorias Total</p>
              <p className="text-lg font-bold text-orange-600">
                {planoSemanal.totalSemanal.calorias} kcal
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Variedade</p>
              <p className="text-lg font-bold text-green-600">
                {planoSemanal.totalSemanal.variedade} tipos
              </p>
            </div>
          </div>
        </div>

        {/* Grade Semanal */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {diasSemana.map((dia) => {
            const atividades =
              planoSemanal[dia.key as keyof typeof planoSemanal];
            const formatter = new Intl.DateTimeFormat("pt-BR", {
              timeZone: "America/Sao_Paulo",
              weekday: "long",
            });

            const hojeFormatado = formatter.format(new Date());
            const hojeKey = hojeFormatado
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .split("-")[0];

            const isToday = dia.key === hojeKey;

            return (
              <div
                key={dia.key}
                className={`border rounded-lg p-3 ${
                  isToday ? "border-blue-300 bg-blue-50" : "border-gray-200"
                }`}
              >
                <h3
                  className={`text-sm font-bold text-center mb-2 ${
                    isToday ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {dia.nome}
                </h3>

                {Array.isArray(atividades) &&
                  atividades.map((atividade: any, index: number) => (
                    <div
                      key={index}
                      className={`text-center p-2 rounded border ${
                        corPorTipo[atividade.tipo]
                      } mb-2`}
                    >
                      <div className="text-lg mb-1">{atividade.icone}</div>
                      <div className="text-xs font-medium">
                        {atividade.nome}
                      </div>
                      <div className="text-xs opacity-75">
                        {atividade.duracao}min • {atividade.calorias}kcal
                      </div>
                    </div>
                  ))}

                {(!Array.isArray(atividades) || atividades.length === 0) && (
                  <div className="text-center text-gray-400 text-xs">
                    Descanso
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dicas */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span className="text-xl mr-2">💡</span>
          Dicas Inteligentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              O plano se adapta automaticamente ao seu objetivo:{" "}
              {planoSemanal.totalSemanal.variedade >= 4
                ? "excelente variedade!"
                : "foco específico!"}
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              Recomendações mudam baseadas no seu progresso de peso e nutrição
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              Intensidade ajustada ao seu nível: {nivelCondicionamento}
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              Meta de {caloriasAlvo} calorias queimadas por dia via exercício
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
