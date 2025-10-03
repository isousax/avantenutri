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
    <div className="flex-1 p-6">
      {/* Header da Lista */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Selecionar Alimento</h2>
          <p className="text-gray-600 mt-1">Encontre o alimento que deseja adicionar</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Barra de Busca Avançada */}
      <div className="relative mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar alimentos (nome, categoria, nutrientes...)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all text-lg"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setCategoriaFiltro('')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
            categoriaFiltro === '' 
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter size={16} />
          Todas
        </button>
        {CATEGORIAS_ALIMENTOS.slice(0, 50).map(categoria => (
          <button
            key={categoria}
            onClick={() => setCategoriaFiltro(categoria)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              categoriaFiltro === categoria 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      {/* Contador de Resultados */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          {alimentosFiltrados.length} alimentos encontrados
        </span>
        {categoriaFiltro && (
          <button
            onClick={() => setCategoriaFiltro('')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Limpar filtro
            <X size={14} />
          </button>
        )}
      </div>

      {/* Lista de Alimentos Organizada */}
      <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alimentos.map(alimento => (
                  <button
                    key={alimento.id}
                    onClick={() => handleSelectAlimento(alimento)}
                    className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-xl">{alimento.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">
                          {alimento.nome}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Flame size={12} className="text-orange-500" />
                          <span>{alimento.calorias} kcal/{alimento.porcaoPadrao}g</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                          <Scale size={12} />
                          <span>{alimento.porcaoDescricao}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500 transition-colors" />
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
    <div className="flex-1 p-6 bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header do Detalhe */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBackToList}
          className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 rounded-xl transition-all duration-200 shadow-sm"
        >
          <ChevronRight size={20} className="text-gray-600 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">Detalhes do Alimento</h2>
          <p className="text-gray-600 text-sm">Ajuste a quantidade e confirme</p>
        </div>
      </div>

      {alimentoSelecionado && (
        <div className="space-y-6">
          {/* Card do Alimento */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">{alimentoSelecionado.emoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{alimentoSelecionado.nome}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Utensils size={14} />
                  <span>{alimentoSelecionado.categoria}</span>
                </div>
              </div>
            </div>

            {/* Informações Rápidas */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-orange-50 rounded-xl p-3">
                <Flame size={16} className="text-orange-600 mx-auto mb-1" />
                <div className="text-xs text-orange-700">Calorias</div>
                <div className="font-bold text-orange-800">{alimentoSelecionado.calorias}/{alimentoSelecionado.porcaoPadrao}g</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <TrendingUp size={16} className="text-blue-600 mx-auto mb-1" />
                <div className="text-xs text-blue-700">Proteína</div>
                <div className="font-bold text-blue-800">{alimentoSelecionado.proteina}g</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <Scale size={16} className="text-green-600 mx-auto mb-1" />
                <div className="text-xs text-green-700">Porção</div>
                <div className="font-bold text-green-800">{alimentoSelecionado.porcaoPadrao}g</div>
              </div>
            </div>
          </div>

          {/* Seção de Quantidade */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Scale size={20} className="text-blue-600" />
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
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    usarPorcaoPadrao ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {usarPorcaoPadrao && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Porção padrão recomendada</div>
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
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    !usarPorcaoPadrao ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {!usarPorcaoPadrao && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Quantidade personalizada</div>
                    <div className="text-sm text-gray-600">Defina o valor em gramas</div>
                  </div>
                </div>
              </button>

              {/* Input de Quantidade Personalizada */}
              {!usarPorcaoPadrao && (
                <div className="ml-9 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="Ex: 150"
                        className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-center text-lg font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        gramas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[50, 100, 150, 200].map((qtd) => (
                      <button
                        key={qtd}
                        onClick={() => setQuantidade(qtd.toString())}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info size={20} className="text-orange-600" />
                Informação Nutricional
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{nutricaoCalculada.calorias}</div>
                  <div className="text-sm opacity-90">Calorias</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{nutricaoCalculada.proteina}g</div>
                  <div className="text-sm opacity-90">Proteína</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{nutricaoCalculada.carboidratos}g</div>
                  <div className="text-sm opacity-90">Carboidratos</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{nutricaoCalculada.gordura}g</div>
                  <div className="text-sm opacity-90">Gordura</div>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmar}
              disabled={!nutricaoCalculada}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Adicionar à Refeição
            </button>
            
            <button
              onClick={handleBackToList}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Voltar para Lista
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh]' flex flex-col overflow-auto">
        {view === 'list' ? renderListView() : renderDetailView()}
      </div>
    </div>
  );
};

export default SeletorAlimentos;