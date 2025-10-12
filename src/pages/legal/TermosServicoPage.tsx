import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { parseSQLDateTimeToLocal } from "../../utils/date";

const TermosServicoPage: React.FC = () => {
  const lastUpdatedRaw = "2025-10-12";
  const lastUpdated = parseSQLDateTimeToLocal(lastUpdatedRaw);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <SEO
        title={`Termos de Serviço — Avante Nutri`}
        description={`Termos de Uso e Contrato de Serviços da Avante Nutri — regras de uso, compra de créditos, agendamentos e responsabilidades.`}
        url="https://avantenutri.com.br/termos"
      />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-4xl font-bold text-green-800 mb-4">Termos de Serviço</h1>
          <p className="text-xs text-gray-600">Última atualização: {lastUpdated?.toLocaleDateString()}</p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="prose prose-lg max-w-none prose-green">

            <section>
              <h2>1. Aceitação dos Termos</h2>
              <p>
                Estes Termos de Serviço ("Termos") regulam o acesso e uso da plataforma <strong>Avante Nutri</strong> ("Plataforma"), incluindo o website, aplicações móveis e serviços relacionados.
                Ao criar uma conta, acessar ou utilizar a Plataforma você concorda com estes Termos e com nossa Política de Privacidade. Se você não concorda, não utilize a Plataforma.
              </p>
            </section>

            <section>
              <h2>2. Definições</h2>
              <ul>
                <li><strong>Usuário:</strong> pessoa física que cria conta e utiliza os serviços disponíveis na Plataforma.</li>
                <li><strong>Profissional / Nutricionista:</strong> profissional de saúde cadastrado e parceiro que presta atendimento por meio da Plataforma.</li>
                <li><strong>Créditos de consulta:</strong> unidades pré‑pagas adquiridas pelo Usuário que permitem agendar consultas ou reavaliações com profissionais parceiros.</li>
                <li><strong>Reavaliação:</strong> atendimento de acompanhamento com objetivo de avaliar evolução nutricional, sujeito às regras desta Plataforma.</li>
              </ul>
            </section>

            <section>
              <h2>3. Escopo dos serviços</h2>
              <p>
                A Plataforma fornece ferramentas de avaliação e acompanhamento nutricional, tais como cálculo de IMC, registro de refeições, monitoramento de consumo de água, histórico de peso,
                estimativas de necessidade calórica, armazenamento de dados do usuário e agendamento de consultas com profissionais parceiros. Serviços adicionais poderão ser oferecidos mediante aviso prévio.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="font-semibold text-yellow-800">Aviso importante:</p>
                <p>
                  Conteúdos gerados automaticamente (por exemplo, estimativas calóricas) são informativos e não substituem consulta presencial ou diagnóstico de um profissional de saúde.
                </p>
              </div>
            </section>

            <section>
              <h2>4. Cadastro, conta e responsabilidades do usuário</h2>
              <p>
                Para utilizar a maioria dos recursos é necessário criar uma conta. Você garante que as informações fornecidas são verdadeiras e atualizadas.
                É responsabilidade do usuário manter a confidencialidade das credenciais e notificar a Plataforma em caso de uso não autorizado.
              </p>
              <ul>
                <li>Usuário deve fornecer informações reais e completas ao se cadastrar e atualizar dados sensíveis (ex.: saúde) com consentimento explícito.</li>
                <li>Usuário é responsável por suas ações durante o uso da Plataforma e por seguir recomendações profissionais quando aplicável.</li>
                <li>É proibido tentar contornar medidas de segurança, usar números de identificação falsos ou criar múltiplas contas para fins fraudulentos.</li>
              </ul>
            </section>

            <section>
              <h2>5. Compra de créditos, pagamentos e faturamento</h2>
              <p>
                A Plataforma comercializa créditos de consulta e eventuais serviços adicionais. O processamento de pagamentos é realizado por provedores terceiros (por exemplo, Mercado Pago)
                e estamos isentos de responsabilidade sobre o armazenamento de dados de cartão, que fica a cargo do processador.
              </p>
              <ul>
                <li>Moeda: BRL. Os preços exibidos podem incluir tributos e taxas aplicáveis, conforme indicado no fluxo de compra.</li>
                <li>Confirmação de compra: a disponibilização dos créditos está sujeita à confirmação do pagamento pelo processador.</li>
                <li>Faturas e recibos: serão disponibilizados eletronicamente e poderão ser enviados por e‑mail.</li>
                <li>Chargebacks e disputas: qualquer contestação deverá começar com o suporte da Plataforma e com o provedor de pagamento; seguimos as regras do processador quanto a prazos e procedimentos.</li>
              </ul>

              <h3>5.1 Expiração de créditos</h3>
              <p>
                Créditos de consulta expiram em 2 (dois) anos a partir da data de compra. Créditos expirados são marcados como inativos e não geram direito a reembolso, salvo quando a legislação local obrigar o contrário.
                Recomendamos verificar e utilizar seus créditos dentro do prazo.
              </p>

              <h3>5.2 Reembolsos e cancelamentos</h3>
              <p>
                Políticas de reembolso dependem do tipo de serviço contratado e do momento do cancelamento. Consultas agendadas podem estar sujeitas a regras específicas de cancelamento,
                que serão informadas no ato da marcação. Em caso de cancelamento pela Plataforma, o usuário terá direito a reembolso ou crédito, conforme o caso.
              </p>
            </section>

            <section>
              <h2>6. Regras de agendamento e reavaliações</h2>
              <p>
                O agendamento de consultas é realizado pela Plataforma conforme disponibilidade informada pelo profissional. O agendamento só se concretiza após confirmação do horário e, quando necessário, da disponibilidade de créditos.
              </p>
              <ul>
                <li>
                  <strong>Reavaliação:</strong> só poderá ser solicitada se o usuário tiver realizado uma consulta inicial nos últimos 12 (doze) meses, ou já tiver realizado uma reavaliação nos últimos 6 (seis) meses.
                  Estas regras visam garantir a segurança clínica e a coerência do acompanhamento.
                </li>
                <li>
                  <strong>Remarcações e cancelamentos:</strong> regras específicas (prazos mínimos, penalidades ou retenções) são exibidas no momento da confirmação do agendamento. A não comparecimento sem aviso prévio poderá resultar em perda do crédito.
                </li>
                <li>Se o profissional cancelar a consulta, ofereceremos alternativas de reagendamento ou restituição do crédito/pagamento.</li>
              </ul>
            </section>

            <section>
              <h2>7. Privacidade e tratamento de dados</h2>
              <p>
                O tratamento de dados pessoais e dados sensíveis (saúde) segue as disposições contidas em nossa Política de Privacidade, que faz parte integrante destes Termos.
                Ao usar a Plataforma, você consente com o processamento conforme ali descrito.
              </p>
            </section>

            <section>
              <h2>8. Responsabilidades</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-semibold text-green-800">Responsabilidades do usuário:</p>
                <ul>
                  <li>Fornecer informações verdadeiras e completas;</li>
                  <li>Seguir instruções e orientações de profissionais quando aplicável;</li>
                  <li>Manter a confidencialidade de credenciais de acesso.</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <p className="font-semibold text-blue-800">Responsabilidades da Plataforma:</p>
                <ul>
                  <li>Disponibilizar os serviços conforme descrito e tomar medidas razoáveis de segurança técnica e administrativa;</li>
                  <li>Fornecer suporte ao usuário e cumprir obrigações fiscais e de faturamento;</li>
                  <li>Cooperar com autoridades em casos de ordem judicial e proteger a privacidade dos usuários de acordo com a lei.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2>9. Propriedade intelectual</h2>
              <p>
                Todos os conteúdos, marcas, códigos, designs e materiais exibidos na Plataforma são de propriedade da Avante Nutri ou licenciados à Avante Nutri.
                O usuário tem uma licença limitada, não exclusiva e intransferível para uso pessoal da Plataforma. É proibida reprodução, distribuição ou uso comercial sem autorização expressa.
              </p>
            </section>

            <section>
              <h2>10. Limitação de responsabilidade</h2>
              <p>
                Na máxima extensão permitida por lei, a Avante Nutri não será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso da Plataforma.
                Estimativas, cálculos e recomendações automatizadas têm caráter informativo; decisões clínicas e tratamentos são de responsabilidade do profissional de saúde que acompanha o paciente.
              </p>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="font-semibold text-red-800">Isenção:</p>
                <p>
                  A Plataforma não presta serviços médicos; os profissionais parceiros são responsáveis pela condução das consultas e pelas condutas clínicas.
                </p>
              </div>
            </section>

            <section>
              <h2>11. Rescisão e suspensão</h2>
              <p>
                Podemos suspender ou encerrar contas que violem estes Termos, infrinjam direitos de terceiros ou coloquem em risco a operação da Plataforma. O usuário também pode encerrar sua conta a qualquer momento.
                Em caso de rescisão por conduta do usuário, eventuais créditos podem ser cancelados sem reembolso, conforme apuração.
              </p>
            </section>

            <section>
              <h2>12. Alterações destes Termos</h2>
              <p>
                Podemos atualizar estes Termos periodicamente. Notificaremos sobre alterações materiais por e‑mail ou por aviso na Plataforma. O uso continuado após publicação constitui aceitação dos novos Termos.
              </p>
            </section>

            <section>
              <h2>13. Lei aplicável e foro</h2>
              <p>
                Estes Termos são regidos pelas leis brasileiras. Para eventuais litígios, as partes elegem o foro da comarca do Recife/PE, com renúncia a qualquer outro, salvo disposição legal em contrário.
              </p>
            </section>

            <section>
              <h2>14. Contato</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">Dúvidas, solicitações ou comunicação de violação dos Termos podem ser enviadas para:</p>
                <p className="font-semibold">E-mail: souzacawanne@gmail.com</p>
                <p className="font-semibold">Telefone: (81) 98665-3214</p>
              </div>
            </section>

            <section className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-bold text-green-800 mb-4">Aceitação</h2>
              <p>
                Ao utilizar a Plataforma, você declara ter lido, entendido e concordado com estes Termos. Caso não concorde com qualquer disposição, não utilize nossos serviços e contate o suporte para esclarecimentos.
              </p>
            </section>

          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <div className="flex-1">
              <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>
                Voltar
              </Button>
            </div>
            <Link to="/privacidade" className="flex-1">
              <Button className="w-full">Ver Política de Privacidade</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TermosServicoPage;
