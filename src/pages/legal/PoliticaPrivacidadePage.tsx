import React from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { parseSQLDateTimeToLocal } from "../../utils/date";

const PoliticaPrivacidadePage: React.FC = () => {
  const lastUpdatedRaw = "2025-10-12";
  const lastUpdated = parseSQLDateTimeToLocal(lastUpdatedRaw);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <SEO
        title={`Política de Privacidade — Avante Nutri`}
        description={`Política de Privacidade da Avante Nutri — como coletamos, usamos e protegemos seus dados.`}
        url="https://avantenutri.com.br/privacidade"
      />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-4xl font-bold text-green-800 mb-4">Política de Privacidade</h1>
          <p className="text-xs text-gray-600">Última atualização: {lastUpdated?.toLocaleDateString()}</p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="prose prose-lg max-w-none prose-green">

            <section>
              <h2>1. Escopo e quem somos</h2>
              <p>
                Esta Política de Privacidade explica como a <strong>Avante Nutri</strong> ("Plataforma", "Nós") coleta, usa, compartilha e protege seus dados pessoais
                quando você usa nossos serviços de avaliação nutricional, registro de refeições, acompanhamento de consumo de água, agendamento de consultas,
                compra de créditos e outras funcionalidades disponíveis no site e aplicativos.
              </p>
              <p>
                Controlador dos dados: Avante Nutri<br/>
              </p>
            </section>

            <section>
              <h2>2. Termos principais</h2>
              <ul>
                <li><strong>Usuário/Cliente:</strong> pessoa que cria conta e usa a Plataforma.</li>
                <li><strong>Dados pessoais:</strong> informações que identificam você (nome, e‑mail, telefone, etc.).</li>
                <li><strong>Dados sensíveis/saúde:</strong> informações sobre saúde e estado físico (peso, altura, histórico clínico, refeições, alergias, etc.).</li>
                <li><strong>Créditos de consulta:</strong> unidades pré‑pagas vendidas pela Plataforma que permitem agendar consultas com nutricionistas parceiras.</li>
              </ul>
            </section>

            <section>
              <h2>3. Quais dados coletamos</h2>

              <h3>3.1 Dados de identificação</h3>
              <p>Nome, e‑mail, telefone, foto de perfil (opcional), preferências e configurações de conta.</p>

              <h3>3.2 Dados de saúde e bem‑estar (sensíveis)</h3>
              <p>
                Altura, peso, medidas corporais, histórico de saúde informado pelo usuário, registros de refeições, quantidade de água consumida, objetivos (perda/ganho/peso de manutenção),
                medicamentos e alergias informadas. Esses dados são tratados como dados sensíveis e exigem consentimento explícito.
              </p>

              <h3>3.3 Dados de uso e técnicos</h3>
              <p>Dados de sessão, logs mínimos de acesso, IP (quando necessário), identificação de dispositivo, tokens de autenticação (armazenados com segurança).</p>

              <h3>3.4 Dados de pagamento</h3>
              <p>
                Informações relacionadas a compras, faturas, históricos de pagamento e o registro de que a transação foi realizada por meio de processadores de pagamento (ex.: Mercado Pago).
                A Plataforma não armazena dados completos de cartão de crédito — esses ficam sob responsabilidade do processador.
              </p>
            </section>

            <section>
              <h2>4. Bases legais e consentimento</h2>
              <p>
                Tratamos dados com base em:
              </p>
              <ul>
                <li><strong>Consentimento:</strong> para coleta de dados de saúde, envio de comunicações de marketing quando aplicável, e funcionalidades que exigem dados sensíveis.</li>
                <li><strong>Execução de contrato/serviço:</strong> para fornecer recursos contratados (agendamentos, créditos, recomendações personalizadas).</li>
                <li><strong>Obrigação legal:</strong> para cumprimento de exigências fiscais e contábeis relacionadas a pagamentos e faturamento.</li>
                <li><strong>Interesse legítimo:</strong> para segurança da plataforma, prevenção a fraudes e melhoria dos serviços (sempre balanceado com seus direitos).</li>
              </ul>
              <p>
                Você pode revogar o consentimento a qualquer momento, sem prejudicar o tratamento realizado antes da revogação. Para revogar, entre em contato.
              </p>
            </section>

            <section>
              <h2>5. Finalidades do tratamento</h2>
              <ul>
                <li>Calcular métricas e recomendações (IMC, estimativa de calorias diárias, meta de consumo de água) com base nos seus dados fornecidos.</li>
                <li>Permitir registro e histórico de refeições, água e medidas corporais.</li>
                <li>Gerenciar compra e consumo de créditos de consulta; emissão de faturas e recibos.</li>
                <li>Agendar consultas com nutricionistas: compartilhamos apenas os dados necessários com a profissional escolhida (nome, e‑mail, resumo de saúde) para preparação da consulta.</li>
                <li>Prevenção e detecção de fraudes, segurança e manutenção da Plataforma.</li>
                <li>Envio de comunicações relacionadas ao serviço (e‑mail de confirmação, notificações de agendamento, alterações de política).</li>
                <li>Melhoria do produto por meio de análises agregadas e anônimas.</li>
              </ul>
            </section>

            <section>
              <h2>6. Especial — Dados de saúde (tratamento e proteção)</h2>
              <p>
                Consideramos dados de saúde como dados sensíveis. Nós:
              </p>
              <ul>
                <li>Solicitamos consentimento explícito antes de processar esse tipo de dado.</li>
                <li>Limitamos o acesso interno (somente profissionais autorizados e equipe técnica com necessidade comprovada).</li>
                <li>Ciframos dados em trânsito (TLS) e mantemos criptografia em repouso quando tecnicamente aplicável.</li>
                <li>Retemos apenas o mínimo necessário para cumprir a finalidade acordada ou por exigência legal.</li>
                <li>Não usamos automaticamente os dados de saúde para decisões que possam afetar direitos legais do usuário sem explicitação e opção de revisão por um profissional humano.
                Ex.: cálculos automáticos de calorias são informativos — recomendações finais devem ser validadas por um(a) nutricionista.</li>
              </ul>
            </section>

            <section>
              <h2>7. Compartilhamento de dados</h2>
              <p>Podemos compartilhar dados com:</p>
              <ul>
                <li>Nutricionistas e profissionais parceiros (apenas os dados necessários para a consulta).</li>
                <li>Processadores de pagamento (ex.: Mercado Pago) para confirmar e conciliat pagamentos.</li>
                <li>Provedores de infraestrutura (Cloudflare, Vercel, R2, D1/SQLite ou equivalentes) — para hospedagem, armazenamento e execução da Plataforma.</li>
                <li>Fornecedores de análise e monitoramento (agregados/anônimos quando possível).</li>
                <li>Autoridades competentes em resposta a ordem judicial ou exigência legal.</li>
              </ul>
              <p>
                Exigimos contratos de processamento (Data Processing Agreements) e cláusulas de confidencialidade com terceiros que tratam dados por nossa conta.
              </p>
            </section>

            <section>
              <h2>8. Transferência internacional</h2>
              <p>
                Alguns serviços de hospedagem e processamento podem armazenar ou processar dados fora do Brasil. Quando houve transferência internacional, adotamos salvaguardas adequadas
                (contratos, cláusulas contratuais padrão ou garantias legais aplicáveis) para proteger seus dados.
              </p>
            </section>

            <section>
              <h2>9. Retenção e exclusão</h2>
              <p>
                Retemos dados pelo tempo necessário para cumprir as finalidades descritas, observando exigências legais e fiscais. Exemplos:
              </p>
              <ul>
                <li>Dados de faturamento e transações: conservados pelo período exigido por lei (ex.: até 5 anos) para fins fiscais e contábeis.</li>
                <li>Dados de perfil e uso: retidos enquanto a conta existir e por um período adicional para fins de segurança e prevenção a fraudes (p. ex. 12 meses), salvo solicitação em contrário.</li>
                <li>Registros de logs e auditoria: até 12 meses, salvo necessidade concreta para investigação de incidentes.</li>
              </ul>
              <p>
                Ao excluir sua conta, tentaremos apagar suas informações pessoais — dados que precisamos manter por obrigação legal serão mantidos e isolados conforme necessário.
              </p>
            </section>

            <section>
              <h2>10. Créditos de consulta, expiração e reavaliações</h2>
              <p>
                A Plataforma vende créditos que permitem agendar consultas ou reavaliações com profissionais. Regras principais:
              </p>
              <ul>
                <li>Créditos expiram após 2 (dois) anos a partir da data de compra. Créditos expirados são marcados como inativos e não reembolsáveis, exceto quando a legislação aplicável exigir o contrário.</li>
                <li>Reavaliação só pode ser solicitada se o usuário:
                  <ul>
                    <li>Fez uma consulta inicial nos últimos 12 meses; ou</li>
                    <li>Ou já fez uma reavaliação nos últimos 6 meses.</li>
                  </ul>
                </li>
                <li>Agendamento está sujeito à disponibilidade do nutricionista e confirmação automática/simples pela Plataforma.</li>
                <li>Política de cancelamento e reagendamento: as regras específicas (prazos, descontos, reembolso) aparecem na página de agendamento e no recibo no momento da compra.</li>
              </ul>
              <p>
                Observação legal: se essa política de expiração for legalmente inviável em sua localidade, ela deve ser ajustada — recomendamos validar com consultoria jurídica local.
              </p>
            </section>

            <section>
              <h2>11. Segurança</h2>
              <p>
                Implementamos medidas técnicas e organizacionais para proteger os dados contra acesso não autorizado, perda ou alteração indevida. Entre elas:
              </p>
              <ul>
                <li>Criptografia em trânsito (TLS).</li>
                <li>Controle de acesso por níveis (princípio do menor privilégio).</li>
                <li>Monitoramento e alertas de segurança, backups regulares e testes de restauração.</li>
                <li>Processos de resposta a incidentes e comunicação de violação conforme a legislação aplicável.</li>
              </ul>
            </section>

            <section>
              <h2>12. Cookies e tecnologias semelhantes</h2>
              <p>
                Usamos cookies essenciais (autenticação, sessão) e cookies opcionais para métricas (analíticos). Você pode gerenciar preferências de cookies via configurações do navegador ou pelo painel de preferências da Plataforma quando disponível.
              </p>
            </section>

            <section>
              <h2>13. Direitos dos titulares (LGPD)</h2>
              <p>
                Você possui diversos direitos sobre seus dados pessoais, incluindo: acesso, correção, portabilidade, anonimização, eliminação, revogação do consentimento, oposição ao tratamento e confirmação da existência de tratamento.
              </p>
            </section>

            <section>
              <h2>14. Menores de idade</h2>
              <p>
                Nossa Plataforma é destinada a maiores de 18 anos. Se você for menor, solicite consentimento dos pais ou responsável. Caso detectemos o uso por menor sem consentimento, poderemos suspender ou excluir a conta e solicitar a confirmação de idade.
              </p>
            </section>

            <section>
              <h2>15. Processos automatizados e limites de responsabilidade</h2>
              <p>
                A Plataforma usa algoritmos para gerar estimativas (ex.: necessidade calórica). Essas estimativas são indicativas e não substituem avaliação profissional presencial. A responsabilidade por decisões clínicas e prescrições é do(a) nutricionista ou profissional de saúde que presta o serviço.
              </p>
            </section>

            <section>
              <h2>16. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política. Notificaremos os usuários sobre alterações materiais por e‑mail ou aviso na Plataforma. A versão mais recente estará sempre disponível nesta página com a data de "Última atualização".
              </p>
            </section>

            <section>
              <h2>17. Contato</h2>
              <p>
                Dúvidas, solicitações de direitos ou reclamações sobre privacidade podem ser enviadas para: <a href="mailto:souzacawanne@gmail.com">souzacawanne@gmail.com</a>.
              </p>
            </section>

            <section className="bg-green-50 p-4 rounded-lg border border-green-100 mt-6">
              <h3 className="font-semibold">Declaração final</h3>
              <p>
                Ao usar a Plataforma, você concorda com os termos desta Política de Privacidade. Caso não concorde, por favor, não utilize nossos serviços e entre em contato para solicitar exclusão de sua conta.
              </p>
            </section>

          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <Link to="/termos" className="flex-1">
              <Button variant="secondary" className="w-full">Ver Termos de Uso</Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button className="w-full">Voltar à página inicial</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PoliticaPrivacidadePage;
