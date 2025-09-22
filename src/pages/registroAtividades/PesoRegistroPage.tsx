import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

interface FormData {
  peso: string;
  data: string;
  horario: string;
  observacoes: string;
}

interface RegistroPeso {
  data: string;
  peso: number;
  variacao: number;
}

const PesoRegistroPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Registro de Peso - Avante Nutris";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Registre e acompanhe seu peso de forma fácil e organizada com nossa ferramenta de controle de peso.');
    }
  }, []);
  const [formData, setFormData] = useState<FormData>({
    peso: '',
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toTimeString().slice(0, 5),
    observacoes: ''
  });

  const [historico, setHistorico] = useState<RegistroPeso[]>([]);
  const [metaPeso] = useState(70);

  // Simulação de histórico
  useEffect(() => {
    const historicoSimulado = [
      { data: '2025-09-01', peso: 72.8, variacao: -0.2 },
      { data: '2025-08-25', peso: 73.0, variacao: -0.5 },
      { data: '2025-08-18', peso: 73.5, variacao: +0.3 },
      { data: '2025-08-11', peso: 73.2, variacao: -0.8 }
    ];
    setHistorico(historicoSimulado);
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.peso) {
      alert('Por favor, informe o peso.');
      return;
    }

    try {
      setIsSaving(true);
      // Simulação de salvamento
      console.log('Peso registrado:', formData);
      
      // Simula um delay de requisição
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Feedback de sucesso
      alert('Peso registrado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar o registro. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const calcularProgresso = () => {
    const pesoAtual = parseFloat(formData.peso);
    const pesoInicial = 75; // Simulação
    const diferencaTotal = pesoInicial - metaPeso;
    const diferencaAtual = pesoInicial - pesoAtual;
    
    return Math.min(Math.max((diferencaAtual / diferencaTotal) * 100, 0), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Registrar Peso</h1>
          <p className="text-gray-600">Acompanhe sua evolução registrando seu peso regularmente</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card className="p-6 shadow-xl border border-green-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Peso */}
              <div>
                <label htmlFor="peso" className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Atual (kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="peso"
                    name="peso"
                    step="0.1"
                    min="30"
                    max="300"
                    value={formData.peso}
                    onChange={(e) => setFormData(prev => ({ ...prev, peso: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-2xl font-bold text-center"
                    placeholder="72.5"
                    required
                    aria-label="Peso em quilogramas"
                    aria-describedby="peso-descricao"
                  />
                  <span id="peso-descricao" className="sr-only">Digite seu peso atual em quilogramas</span>
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">kg</span>
                </div>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Condições da medição, como se sente, etc."
                />
              </div>

              {/* Progresso */}
              {formData.peso && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between text-sm text-green-800 mb-2">
                    <span>Progresso para a meta</span>
                    <span>{calcularProgresso().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${calcularProgresso()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Meta: {metaPeso}kg • Atual: {formData.peso}kg
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 flex items-center justify-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Salvar Peso
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Histórico e Estatísticas */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seu Progresso</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-800">
                    {formData.peso || '--'} kg
                  </p>
                  <p className="text-sm text-blue-600">Peso atual</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-800">-2.5 kg</p>
                    <p className="text-xs text-green-600">Total perdido</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-800">70 kg</p>
                    <p className="text-xs text-purple-600">Meta</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico Recente</h3>
              <div className="space-y-3">
                {historico.map((registro, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{registro.peso} kg</p>
                      <p className="text-sm text-gray-500">
                        {new Date(registro.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      registro.variacao < 0 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {registro.variacao > 0 ? '+' : ''}{registro.variacao} kg
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PesoRegistroPage;