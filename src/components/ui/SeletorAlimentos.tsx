import React, { useState, useMemo } from 'react';
import type { Alimento } from '../../data/alimentos';
import { CATEGORIAS_ALIMENTOS, buscarAlimentos, calcularNutricao } from '../../data/alimentos';

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
    return calcularNutricao(alimentoSelecionado, qtd);
  }, [alimentoSelecionado, quantidade, usarPorcaoPadrao]);

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🍽️ Selecionar Alimento</h2>
              <p className="text-green-100 mt-1">Escolha um alimento da nossa base de dados</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Lista de Alimentos */}
          <div className="flex-1 p-6 border-r border-gray-200">
            {/* Filtros */}
            <div className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="🔍 Buscar alimento..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              
              <div>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                >
                  <option value="">📂 Todas as categorias</option>
                  {CATEGORIAS_ALIMENTOS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alimentosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl">😕</span>
                  <p className="mt-2">Nenhum alimento encontrado</p>
                </div>
              ) : (
                alimentosFiltrados.map(alimento => (
                  <button
                    key={alimento.id}
                    onClick={() => {
                      setAlimentoSelecionado(alimento);
                      setQuantidade(alimento.porcaoPadrao.toString());
                      setUsarPorcaoPadrao(true);
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      alimentoSelecionado?.id === alimento.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{alimento.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{alimento.nome}</div>
                        <div className="text-sm text-gray-500">{alimento.categoria}</div>
                        <div className="text-xs text-green-600 mt-1">
                          {alimento.calorias} kcal/100g • {alimento.porcaoDescricao}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Detalhes e Quantidade */}
          {alimentoSelecionado && (
            <div className="w-full lg:w-96 p-6 bg-gray-50">
              <div className="space-y-6">
                {/* Alimento Selecionado */}
                <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{alimentoSelecionado.emoji}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{alimentoSelecionado.nome}</h3>
                      <p className="text-sm text-gray-500">{alimentoSelecionado.categoria}</p>
                    </div>
                  </div>
                </div>

                {/* Quantidade */}
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                  <h4 className="font-semibold text-gray-800 mb-3">📏 Quantidade</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={usarPorcaoPadrao}
                        onChange={() => setUsarPorcaoPadrao(true)}
                        className="text-blue-500"
                      />
                      <span className="text-sm">
                        Porção padrão: <strong>{alimentoSelecionado.porcaoDescricao}</strong>
                        <br />
                        <span className="text-gray-500">({alimentoSelecionado.porcaoPadrao}g)</span>
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!usarPorcaoPadrao}
                        onChange={() => setUsarPorcaoPadrao(false)}
                        className="text-blue-500"
                      />
                      <span className="text-sm">Quantidade personalizada</span>
                    </label>
                    
                    {!usarPorcaoPadrao && (
                      <div className="ml-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            placeholder="Ex: 150"
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                          />
                          <span className="text-sm text-gray-600">gramas</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Nutricionais */}
                {nutricaoCalculada && (
                  <div className="bg-white rounded-xl p-4 border-2 border-orange-200">
                    <h4 className="font-semibold text-gray-800 mb-3">📊 Informação Nutricional</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-orange-50 rounded-lg p-2">
                        <div className="text-orange-700 font-medium">Calorias</div>
                        <div className="text-lg font-bold text-orange-800">{nutricaoCalculada.calorias} kcal</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-green-700 font-medium">Proteína</div>
                        <div className="text-lg font-bold text-green-800">{nutricaoCalculada.proteina}g</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-blue-700 font-medium">Carboidratos</div>
                        <div className="text-lg font-bold text-blue-800">{nutricaoCalculada.carboidratos}g</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <div className="text-purple-700 font-medium">Gordura</div>
                        <div className="text-lg font-bold text-purple-800">{nutricaoCalculada.gordura}g</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="space-y-3">
                  <button
                    onClick={handleConfirmar}
                    disabled={!nutricaoCalculada}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    ✅ Adicionar à Refeição
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeletorAlimentos;