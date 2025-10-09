import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Alimento } from '../../data/alimentos';
import { CATEGORIAS_ALIMENTOS, buscarAlimentos, calcularNutricao } from '../../data/alimentos';
import {
  Search,
  X,
  Scale,
  Utensils,
  Plus,
  TrendingUp,
  Filter,
  ChevronRight,
  CheckCircle,
  Info
} from 'lucide-react';
import { Flame } from 'lucide-react';

interface SeletorAlimentosProps {
  onSelect: (alimento: Alimento, quantidade: number) => void;
  onClose: () => void;
}

const SeletorAlimentos: React.FC<SeletorAlimentosProps> = ({ onSelect, onClose }) => {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [alimentoSelecionado, setAlimentoSelecionado] = useState<Alimento | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [usarPorcaoPadrao, setUsarPorcaoPadrao] = useState(true);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const alimentosFiltrados = useMemo(() => {
    let resultado = buscarAlimentos(busca);
    if (categoriaFiltro) {
      resultado = resultado.filter(a => a.categoria === categoriaFiltro);
    }
    return resultado;
  }, [busca, categoriaFiltro]);

  const nutricaoCalculada = useMemo(() => {
    if (!alimentoSelecionado) return null;
    const qtd = usarPorcaoPadrao 
      ? alimentoSelecionado.porcaoPadrao 
      : parseFloat(quantidade.replace(',', '.')) || 0;
    return calcularNutricao(alimentoSelecionado, qtd, alimentoSelecionado.porcaoPadrao);
  }, [alimentoSelecionado, quantidade, usarPorcaoPadrao]);

  // Agrupar alimentos por categoria para visualização organizada
  const alimentosPorCategoria = useMemo(() => {
    const agrupados: Record<string, Alimento[]> = {};
    alimentosFiltrados.forEach(alimento => {
      if (!agrupados[alimento.categoria]) {
        agrupados[alimento.categoria] = [];
      }
      agrupados[alimento.categoria].push(alimento);
    });
    return agrupados;
  }, [alimentosFiltrados]);

  const handleConfirmar = () => {
    if (!alimentoSelecionado) return;
    const qtd = usarPorcaoPadrao 
      ? alimentoSelecionado.porcaoPadrao 
      : parseFloat(quantidade.replace(',', '.')) || 0;
    if (qtd > 0) {
      onSelect(alimentoSelecionado, qtd);
      onClose();
    }
  };

  const handleSelectAlimento = (alimento: Alimento) => {
    setAlimentoSelecionado(alimento);
    setQuantidade(alimento.porcaoPadrao.toString());
    setUsarPorcaoPadrao(true);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Foco no input de busca ao abrir
  useEffect(() => {
    if (view === 'list') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [view]);

  // View de lista (busca e categorias)
  const renderListView = () => (
    <div className="flex-1 p-4 flex flex-col min-h-0">
      {/* Header da Lista */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Selecionar Alimento</h2>
          <p className="text-gray-600 mt-0.5 text-sm">Encontre o alimento que deseja adicionar</p>
        </div>
        <button 
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
        >
          <X size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Barra de Busca Avançada */}
      <div className="relative mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar alimentos (nome, categoria, nutrientes...)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-2xl focus:border-green-500 focus:outline-none text-base"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="flex items-center gap-2.5 mb-4 overflow-x-auto pb-1 w-full sm:min-h-[60px]">
        <button
          onClick={() => setCategoriaFiltro('')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all text-sm shrink-0 ${
            categoriaFiltro === '' 
              ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter size={14} />
          Todas
        </button>
        {CATEGORIAS_ALIMENTOS.slice(0, 50).map(categoria => (
          <button
            key={categoria}
            onClick={() => setCategoriaFiltro(categoria)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all text-sm shrink-0 ${
              categoriaFiltro === categoria 
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      {/* Lista de Alimentos Organizada */}
      <div className="space-y-6 flex-1 overflow-y-auto min-h-0">
        {Object.keys(alimentosPorCategoria).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Nenhum alimento encontrado</h3>
            <p className="text-gray-600 text-sm">
              Tente ajustar sua busca ou remover filtros
            </p>
          </div>
        ) : (
          Object.entries(alimentosPorCategoria).map(([categoria, alimentos]) => (
            <div key={categoria} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">{categoria}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {alimentos.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {alimentos.map(alimento => (
                  <button
                    key={alimento.id}
                    onClick={() => handleSelectAlimento(alimento)}
                    className="text-left p-3 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-lg">{alimento.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate text-[15px]">
                          {alimento.nome}
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5">
                          <Flame size={11} className="text-orange-500" />
                          <span>{alimento.calorias} kcal/{alimento.porcaoPadrao}g</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-green-600 mt-0.5">
                          <Scale size={11} />
                          <span>{alimento.porcaoDescricao}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // View de detalhes do alimento
  const renderDetailView = () => (
    <div className="flex-1 p-4 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col min-h-0">
      {/* Header do Detalhe */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleBackToList}
          className="w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-100 rounded-xl transition-all duration-200 shadow-sm"
        >
          <ChevronRight size={18} className="text-gray-600 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Detalhes do Alimento</h2>
          <p className="text-gray-600 text-sm">Ajuste a quantidade e confirme</p>
        </div>
      </div>

      {alimentoSelecionado && (
        <>
        <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
          {/* Card do Alimento */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-xl">{alimentoSelecionado.emoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">{alimentoSelecionado.nome}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Utensils size={13} />
                  <span>{alimentoSelecionado.categoria}</span>
                </div>
              </div>
            </div>

            {/* Informações Rápidas */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-orange-50 rounded-xl p-2.5">
                <Flame size={15} className="text-orange-600 mx-auto mb-1" />
                <div className="text-xs text-orange-700">Calorias</div>
                <div className="font-bold text-orange-800 text-sm">{alimentoSelecionado.calorias}/{alimentoSelecionado.porcaoPadrao}g</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-2.5">
                <TrendingUp size={15} className="text-blue-600 mx-auto mb-1" />
                <div className="text-xs text-blue-700">Proteína</div>
                <div className="font-bold text-blue-800 text-sm">{alimentoSelecionado.proteina}g</div>
              </div>
              <div className="bg-green-50 rounded-xl p-2.5">
                <Scale size={15} className="text-green-600 mx-auto mb-1" />
                <div className="text-xs text-green-700">Porção</div>
                <div className="font-bold text-green-800 text-sm">{alimentoSelecionado.porcaoPadrao}g</div>
              </div>
            </div>
          </div>

          {/* Seção de Quantidade */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Scale size={18} className="text-blue-600" />
              Definir Quantidade
            </h4>
            
            <div className="space-y-4">
              {/* Opção de Porção Padrão */}
              <button
                onClick={() => setUsarPorcaoPadrao(true)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  usarPorcaoPadrao
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    usarPorcaoPadrao ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {usarPorcaoPadrao && <CheckCircle size={11} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-[15px]">Porção padrão recomendada</div>
                    <div className="text-sm text-gray-600">
                      {alimentoSelecionado.porcaoDescricao} ({alimentoSelecionado.porcaoPadrao}g)
                    </div>
                  </div>
                </div>
              </button>

              {/* Opção de Quantidade Personalizada */}
              <button
                onClick={() => setUsarPorcaoPadrao(false)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  !usarPorcaoPadrao
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    !usarPorcaoPadrao ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {!usarPorcaoPadrao && <CheckCircle size={11} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-[15px]">Quantidade personalizada</div>
                    <div className="text-sm text-gray-600">Defina o valor em gramas</div>
                  </div>
                </div>
              </button>

              {/* Input de Quantidade Personalizada */}
              {!usarPorcaoPadrao && (
                <div className="ml-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="Ex: 150"
                        className="w-full border-2 border-gray-300 rounded-xl px-3.5 py-2.5 text-center text-base font-medium focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                        gramas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[50, 100, 150, 200].map((qtd) => (
                      <button
                        key={qtd}
                        onClick={() => setQuantidade(qtd.toString())}
                        className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        {qtd}g
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações Nutricionais Calculadas */}
          {nutricaoCalculada && (
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-orange-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info size={18} className="text-orange-600" />
                Informação Nutricional
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-3.5 text-center">
                  <div className="text-xl font-bold">{nutricaoCalculada.calorias}</div>
                  <div className="text-sm opacity-90">Calorias</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-3.5 text-center">
                  <div className="text-xl font-bold">{nutricaoCalculada.proteina}g</div>
                  <div className="text-sm opacity-90">Proteína</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-3.5 text-center">
                  <div className="text-xl font-bold">{nutricaoCalculada.carboidratos}g</div>
                  <div className="text-sm opacity-90">Carboidratos</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-3.5 text-center">
                  <div className="text-xl font-bold">{nutricaoCalculada.gordura}g</div>
                  <div className="text-sm opacity-90">Gordura</div>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Botões de Ação */}
          <div className="space-y-2.5 pt-3">
            <button
              onClick={handleConfirmar}
              disabled={!nutricaoCalculada}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2 px-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Adicionar à Refeição
            </button>
            
            <button
              onClick={handleBackToList}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-5 rounded-xl transition-colors"
            >
              Voltar para Lista
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[calc(100svh-1rem)] sm:h-auto max-h-[calc(100svh-1rem)] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {view === 'list' ? renderListView() : renderDetailView()}
      </div>
    </div>
  );
};

export default SeletorAlimentos;