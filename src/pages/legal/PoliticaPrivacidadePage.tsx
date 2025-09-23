import React from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";

const PoliticaPrivacidadePage: React.FC = () => {
  const lastUpdated = "22 de Setembro de 2025";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <SEO
        title="Política de Privacidade | Avante Nutri"
        description="Leia nossa política de privacidade para entender como protegemos seus dados."
        url="https://avantenutri.com.br/privacidade"
      />
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-xs text-gray-600">
            Última atualização: {lastUpdated}
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="prose prose-lg max-w-none prose-green">
            {/* Introdução */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                1. Introdução
              </h2>
              <p className="text-gray-700 mb-4">
                Na Avante Nutris, levamos a privacidade dos seus dados muito a
                sério. Esta política explica como coletamos, usamos, protegemos
                e compartilhamos suas informações pessoais.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-semibold text-green-800">
                  💡 Nosso Compromisso:
                </p>
                <p>
                  Seus dados de saúde são tratados com total confidencialidade e
                  segurança.
                </p>
              </div>
            </section>

            {/* Dados Coletados */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                2. Dados que Coletamos
              </h2>

              <h3 className="text-xl font-semibold text-green-700 mb-3">
                2.1. Dados Pessoais
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Nome completo, e-mail, telefone</li>
                <li>Data de nascimento, gênero</li>
                <li>Documentos de identificação (quando necessário)</li>
                <li>Informações de contato de emergência</li>
              </ul>

              <h3 className="text-xl font-semibold text-green-700 mb-3">
                2.2. Dados de Saúde
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Histórico médico e condições de saúde</li>
                <li>Medicamentos em uso</li>
                <li>Exames laboratoriais</li>
                <li>Hábitos alimentares e estilo de vida</li>
                <li>Medidas corporais e evolução do tratamento</li>
              </ul>

              <h3 className="text-xl font-semibold text-green-700 mb-3">
                2.3. Dados Técnicos
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Endereço IP, tipo de navegador</li>
                <li>Dispositivo utilizado, logs de acesso</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            {/* Base Legal */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                3. Base Legal para Tratamento
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold text-blue-800">
                    👥 Consentimento
                  </p>
                  <p>
                    Para dados sensíveis de saúde, obtemos consentimento
                    explícito
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-green-800">📝 Contrato</p>
                  <p>Execução de serviços contratados de nutrição</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-semibold text-purple-800">
                    ⚖️ Legítimo Interesse
                  </p>
                  <p>Melhoria contínua de nossos serviços</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="font-semibold text-yellow-800">
                    🏥 Obrigação Legal
                  </p>
                  <p>Cumprimento de normas sanitárias e profissionais</p>
                </div>
              </div>
            </section>

            {/* Finalidades */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                4. Finalidades do Tratamento
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    1
                  </span>
                  <span>Prestação de serviços de nutrição personalizados</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    2
                  </span>
                  <span>Comunicação sobre agendamentos e acompanhamento</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    3
                  </span>
                  <span>Envio de materiais educativos e orientações</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    4
                  </span>
                  <span>Melhoria da qualidade dos serviços prestados</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    5
                  </span>
                  <span>Cumprimento de obrigações legais e regulatórias</span>
                </div>
              </div>
            </section>

            {/* Compartilhamento */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                5. Compartilhamento de Dados
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>5.1.</strong> Seus dados de saúde{" "}
                  <strong>não são compartilhados</strong> com terceiros sem sua
                  autorização explícita.
                </p>
                <p>
                  <strong>5.2.</strong> Exceções legais incluem:
                </p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>Ordem judicial</li>
                  <li>Autoridades sanitárias (quando obrigatório por lei)</li>
                  <li>Proteção da vida do paciente ou de terceiros</li>
                </ul>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-semibold text-red-800">⚠️ Atenção:</p>
                  <p>
                    Dados anonimizados podem ser usados para pesquisas
                    científicas, sempre preservando sua identidade.
                  </p>
                </div>
              </div>
            </section>

            {/* Segurança */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                6. Segurança dos Dados
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">
                    🔒 Medidas Técnicas
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Criptografia de dados em repouso e trânsito</li>
                    <li>Backups regulares e seguros</li>
                    <li>Controle de acesso baseado em função</li>
                    <li>Monitoramento de segurança 24/7</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">
                    👥 Medidas Organizacionais
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Acordos de confidencialidade com a equipe</li>
                    <li>Treinamento em proteção de dados</li>
                    <li>Políticas internas de segurança</li>
                    <li>Auditorias regulares</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Seus Direitos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                7. Seus Direitos
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-green-800">
                    📋 Direitos do Titular (LGPD):
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-green-600 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Confirmação de existência de tratamento
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-green-600 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Acesso aos dados
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-green-600 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Correção de dados incompletos
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-green-600 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Anonimização, bloqueio ou eliminação
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-green-600 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Portabilidade dos dados
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-green-600 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Revogação do consentimento
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Retenção */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                8. Tempo de Retenção
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>Mantemos seus dados pelo tempo necessário para:</p>
                <ul className="list-disc list-inside ml-6 space-y-2">
                  <li>
                    <strong>Prontuários:</strong> 20 anos (conforme legislação
                    profissional)
                  </li>
                  <li>
                    <strong>Dados contratuais:</strong> 5 anos após término do
                    contrato
                  </li>
                  <li>
                    <strong>Dados fiscais:</strong> 5 anos (obrigação legal)
                  </li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                9. Cookies e Tecnologias Similares
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies para melhorar sua experiência no site. Você
                pode configurar seu navegador para recusar cookies, mas isso
                pode afetar a funcionalidade do site.
              </p>
            </section>

            {/* Alterações */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                10. Alterações nesta Política
              </h2>
              <p className="text-gray-700">
                Esta política pode ser atualizada. Alterações significativas
                serão comunicadas por e-mail ou através de nossos canais
                oficiais.
              </p>
            </section>

            {/* Consentimento */}
            <section className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                Seu Consentimento
              </h2>
              <p className="text-gray-700">
                Ao usar nossos serviços, você concorda com os termos desta
                Política de Privacidade e autoriza o tratamento de seus dados
                conforme descrito acima.
              </p>
            </section>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <Link to="/termos" className="flex-1">
              <Button variant="secondary" className="w-full">
                ← Ver Termos de Serviço
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button className="w-full">Ir para Inicio →</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PoliticaPrivacidadePage;
