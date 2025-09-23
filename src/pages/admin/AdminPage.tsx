import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts';
import { RoleRoute } from '../../components/RoleRoute';

// Simulação de pacientes
const pacientes = [
  { 
    id: '2',
    nome: 'Maria Silva',
    email: 'maria@email.com',
    pagamento: 'Pago',
    questionario: 'Respondido',
    dieta: 'dieta_maria.pdf',
    ultimaConsulta: '2023-09-15',
    proximaConsulta: '2023-10-15',
    peso: 72.5,
    pesoMeta: 70,
    progresso: 85,
    status: 'Em andamento'
  },
  { 
    id: '3',
    nome: 'João Santos',
    email: 'joao@email.com',
    pagamento: 'Pendente',
    questionario: 'Não respondido',
    dieta: null,
    ultimaConsulta: '2023-09-10',
    proximaConsulta: '2023-10-10',
    peso: 85,
    pesoMeta: 80,
    progresso: 45,
    status: 'Atrasado'
  },
  { 
    id: '4',
    nome: 'Ana Oliveira',
    email: 'ana@email.com',
    pagamento: 'Pago',
    questionario: 'Respondido',
    dieta: 'dieta_ana.pdf',
    ultimaConsulta: '2023-09-20',
    proximaConsulta: '2023-10-20',
    peso: 65,
    pesoMeta: 63,
    progresso: 95,
    status: 'Em andamento'
  },
];

const AdminPage: React.FC = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'pacientes' | 'consultas' | 'relatorios'>('pacientes');
  const [selected, setSelected] = useState<string | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpload = (id: string) => {
    // Simulação de upload
    alert(`PDF enviado para paciente ${id}`);
    setPdf(null);
    setSelected(null);
  };

  // Filtra pacientes baseado na busca
  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats para o dashboard
  const stats = {
    totalPacientes: pacientes.length,
    pendentes: pacientes.filter(p => p.pagamento === 'Pendente').length,
    emAndamento: pacientes.filter(p => p.status === 'Em andamento').length,
    atrasados: pacientes.filter(p => p.status === 'Atrasado').length
  };

  return (
    <RoleRoute role="admin">
      <div className="min-h-screen flex flex-col bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-green-700">Área do Nutricionista</h2>
              <p className="text-gray-600 text-sm">Bem-vinda, Dra. Cawanne</p>
            </div>
            <Button variant="secondary" onClick={logout}>Sair</Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Pacientes</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalPacientes}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pagamentos Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Atrasados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.atrasados}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                tab === 'pacientes'
                  ? 'bg-green-600 text-white'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setTab('pacientes')}
            >
              Pacientes
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                tab === 'consultas'
                  ? 'bg-green-600 text-white'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setTab('consultas')}
            >
              Consultas
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                tab === 'relatorios'
                  ? 'bg-green-600 text-white'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setTab('relatorios')}
            >
              Relatórios
            </button>
          </div>

          {tab === 'pacientes' && (
            <Card>
              {/* Search Bar */}
              <div className="p-4 border-b">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar pacientes..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <svg
                        className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <Button>Novo Paciente</Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-green-700">
                      <th className="p-4">Paciente</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Progresso</th>
                      <th className="p-4">Próx. Consulta</th>
                      <th className="p-4">Pagamento</th>
                      <th className="p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPacientes.map(p => (
                      <tr key={p.id} className="bg-white hover:bg-green-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">
                              {p.nome.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">{p.nome}</p>
                              <p className="text-sm text-gray-500">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.status === 'Em andamento'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${p.progresso}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">{p.progresso}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p>{new Date(p.proximaConsulta).toLocaleDateString('pt-BR')}</p>
                            <p className="text-gray-500">14:00</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.pagamento === 'Pago'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {p.pagamento}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {selected === p.id ? (
                              <form className="flex gap-2 items-center" onSubmit={e => { e.preventDefault(); handleUpload(p.id); }}>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={e => setPdf(e.target.files?.[0] || null)}
                                  className="text-xs"
                                />
                                <Button type="submit" className="text-xs" disabled={!pdf}>Enviar</Button>
                                <Button type="button" variant="secondary" className="text-xs" onClick={() => setSelected(null)}>
                                  Cancelar
                                </Button>
                              </form>
                            ) : (
                              <>
                                <Button variant="secondary" className="text-xs" onClick={() => setSelected(p.id)}>
                                  Nova Dieta
                                </Button>
                                <Button variant="secondary" className="text-xs">Ver Perfil</Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'consultas' && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Agenda de Consultas</h3>
              <p className="text-gray-600">Em desenvolvimento...</p>
            </Card>
          )}

          {tab === 'relatorios' && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Relatórios e Análises</h3>
              <p className="text-gray-600">Em desenvolvimento...</p>
            </Card>
          )}
        </div>
      </div>
    </RoleRoute>
  );
};

export default AdminPage;
