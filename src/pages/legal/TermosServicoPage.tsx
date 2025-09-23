import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";

const TermosServicoPage: React.FC = () => {
  const lastUpdated = "22 de Setembro de 2025";
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <SEO 
        title="Termos de Serviço | Avante Nutri"
        description="Conheça nossos termos de serviço e as condições de uso da plataforma Avante Nutri para um acompanhamento nutricional transparente e seguro."
        url="https://avantenutri.com.br/termos"
      />
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            Termos de Serviço
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
                Termos de Serviço da Avante Nutris. Estes termos regem o uso de
                nossos serviços de nutrição e plataforma online. Ao acessar ou
                usar nossos serviços, você concorda em cumprir estes termos.
              </p>
            </section>

            {/* Definições */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                2. Definições
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <strong>Serviço:</strong> Consultas de nutrição, planos
                  alimentares e acompanhamento oferecidos pela Avante Nutris
                </li>
                <li>
                  <strong>Plataforma:</strong> Site, aplicativo e sistemas
                  online da Avante Nutris
                </li>
                <li>
                  <strong>Usuário:</strong> Paciente ou visitante que utiliza
                  nossos serviços
                </li>
                <li>
                  <strong>Profissional:</strong> Nutricionista credenciado que
                  presta os serviços
                </li>
              </ul>
            </section>

            {/* Escopo dos Serviços */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                3. Escopo dos Serviços
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Nossos serviços incluem consultas de nutrição online,
                  elaboração de planos alimentares personalizados,
                  acompanhamento nutricional e suporte via plataforma digital.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="font-semibold text-yellow-800">
                    Aviso Importante:
                  </p>
                  <p>
                    Nossos serviços não substituem atendimento médico
                    emergencial. Em caso de emergências médicas, procure
                    atendimento hospitalar imediatamente.
                  </p>
                </div>
              </div>
            </section>

            {/* Cadastro e Conta */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                4. Cadastro e Conta do Usuário
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>4.1.</strong> Para usar nossos serviços, é necessário
                  criar uma conta com informações verdadeiras e completas.
                </p>
                <p>
                  <strong>4.2.</strong> Você é responsável pela segurança de sua
                  conta e senha.
                </p>
                <p>
                  <strong>4.3.</strong> Informações de saúde devem ser precisas
                  para garantir um atendimento adequado.
                </p>
              </div>
            </section>

            {/* Pagamentos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                5. Pagamentos e Reembolsos
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>5.1.</strong> Os valores dos serviços são divulgados
                  claramente na plataforma.
                </p>
                <p>
                  <strong>5.2.</strong> Pagamentos são processados de forma
                  segura através de gateways certificados.
                </p>
                <p>
                  <strong>5.3.</strong> Política de reembolso: Consulte nossa
                  política específica de cancelamentos.
                </p>
              </div>
            </section>

            {/* Responsabilidades */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                6. Responsabilidades
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-green-800">Do Usuário:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Fornecer informações verdadeiras</li>
                    <li>Seguir orientações nutricionais</li>
                    <li>Comparecer às consultas agendadas</li>
                    <li>Comunicar mudanças no estado de saúde</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold text-blue-800">
                    Da Avante Nutris:
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Prestar serviços com qualidade profissional</li>
                    <li>Manter confidencialidade dos dados</li>
                    <li>Oferecer ambiente seguro para atendimento</li>
                    <li>Cumprir legislação profissional aplicável</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Propriedade Intelectual */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                7. Propriedade Intelectual
              </h2>
              <p className="text-gray-700">
                Todo conteúdo da plataforma, incluindo planos alimentares,
                materiais educativos e software, é propriedade da Avante Nutris
                e protegido por leis de propriedade intelectual.
              </p>
            </section>

            {/* Limitação de Responsabilidade */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                8. Limitação de Responsabilidade
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  A Avante Nutris não se responsabiliza por resultados
                  específicos de tratamentos, uma vez que estes dependem de
                  múltiplos fatores individuais.
                </p>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-semibold text-red-800">
                    Isenção de Responsabilidade Médica:
                  </p>
                  <p>
                    Nossos serviços são de natureza nutricional e não substituem
                    diagnóstico ou tratamento médico.
                  </p>
                </div>
              </div>
            </section>

            {/* Rescisão */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                9. Rescisão
              </h2>
              <p className="text-gray-700">
                Podemos rescindir ou suspender seu acesso aos serviços em caso
                de violação destes termos ou conduta inadequada.
              </p>
            </section>

            {/* Alterações nos Termos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                10. Alterações nos Termos
              </h2>
              <p className="text-gray-700">
                Reservamo-nos o direito de modificar estes termos a qualquer
                momento. Alterações significativas serão comunicadas com
                antecedência.
              </p>
            </section>

            {/* Lei Aplicável */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                11. Lei Aplicável
              </h2>
              <p className="text-gray-700">
                Estes termos são regidos pelas leis brasileiras. Eventuais
                disputas serão resolvidas no foro da comarca de Refice/PE.
              </p>
            </section>

            {/* Contato */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                12. Contato
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  Dúvidas sobre estes termos podem ser direcionadas para:
                </p>
                <p className="font-semibold">E-mail: souzacawanne@gmail.com</p>
                <p className="font-semibold">Telefone: (81) 98665-3214</p>
              </div>
            </section>

            {/* Aceitação */}
            <section className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                Aceitação dos Termos
              </h2>
              <p className="text-gray-700">
                Ao usar nossos serviços, você declara que leu, compreendeu e
                concordou com estes Termos de Serviço na íntegra.
              </p>
            </section>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <Link to="" className="flex-1">
              <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>
                ← Voltar
              </Button>
            </Link>
            <Link to="/privacidade" className="flex-1">
              <Button className="w-full">Ver Política de Privacidade →</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TermosServicoPage;
