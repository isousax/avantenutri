import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { useI18n, formatDate } from "../../i18n";

const TermosServicoPage: React.FC = () => {
  const { t, locale } = useI18n();
  const lastUpdatedRaw = "2025-09-22";
  const lastUpdated = formatDate(lastUpdatedRaw, locale, { dateStyle: 'long' });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <SEO 
        title={t('legal.terms.seo.title')}
        description={t('legal.terms.seo.desc')}
        url="https://avantenutri.com.br/termos"
      />
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            {t('legal.terms.title')}
          </h1>
          <p className="text-xs text-gray-600">
            {t('legal.terms.lastUpdated', { date: lastUpdated })}
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="prose prose-lg max-w-none prose-green">
            {/* Introdução */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section1.title')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('legal.terms.section1.p1')}
              </p>
            </section>

            {/* Definições */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section2.title')}
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <strong>{t('legal.terms.section2.service.term')}:</strong> {t('legal.terms.section2.service.desc')}
                </li>
                <li>
                  <strong>{t('legal.terms.section2.platform.term')}:</strong> {t('legal.terms.section2.platform.desc')}
                </li>
                <li>
                  <strong>{t('legal.terms.section2.user.term')}:</strong> {t('legal.terms.section2.user.desc')}
                </li>
                <li>
                  <strong>{t('legal.terms.section2.professional.term')}:</strong> {t('legal.terms.section2.professional.desc')}
                </li>
              </ul>
            </section>

            {/* Escopo dos Serviços */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section3.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {t('legal.terms.section3.p1')}
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="font-semibold text-yellow-800">
                    {t('legal.terms.section3.warningTitle')}:
                  </p>
                  <p>
                    {t('legal.terms.section3.warningBody')}
                  </p>
                </div>
              </div>
            </section>

            {/* Cadastro e Conta */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section4.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>{t('legal.terms.section4.p1')}</p>
                <p>{t('legal.terms.section4.p2')}</p>
                <p>{t('legal.terms.section4.p3')}</p>
              </div>
            </section>

            {/* Pagamentos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section5.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>{t('legal.terms.section5.p1')}</p>
                <p>{t('legal.terms.section5.p2')}</p>
                <p>{t('legal.terms.section5.p3')}</p>
              </div>
            </section>

            {/* Responsabilidades */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section6.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-green-800">{t('legal.terms.section6.user.title')}:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>{t('legal.terms.section6.user.li1')}</li>
                    <li>{t('legal.terms.section6.user.li2')}</li>
                    <li>{t('legal.terms.section6.user.li3')}</li>
                    <li>{t('legal.terms.section6.user.li4')}</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold text-blue-800">{t('legal.terms.section6.company.title')}:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>{t('legal.terms.section6.company.li1')}</li>
                    <li>{t('legal.terms.section6.company.li2')}</li>
                    <li>{t('legal.terms.section6.company.li3')}</li>
                    <li>{t('legal.terms.section6.company.li4')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Propriedade Intelectual */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section7.title')}
              </h2>
              <p className="text-gray-700">
                {t('legal.terms.section7.p1')}
              </p>
            </section>

            {/* Limitação de Responsabilidade */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section8.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {t('legal.terms.section8.p1')}
                </p>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-semibold text-red-800">
                    {t('legal.terms.section8.disclaimerTitle')}:
                  </p>
                  <p>
                    {t('legal.terms.section8.disclaimerBody')}
                  </p>
                </div>
              </div>
            </section>

            {/* Rescisão */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section9.title')}
              </h2>
              <p className="text-gray-700">
                {t('legal.terms.section9.p1')}
              </p>
            </section>

            {/* Alterações nos Termos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section10.title')}
              </h2>
              <p className="text-gray-700">
                {t('legal.terms.section10.p1')}
              </p>
            </section>

            {/* Lei Aplicável */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section11.title')}
              </h2>
              <p className="text-gray-700">
                {t('legal.terms.section11.p1')}
              </p>
            </section>

            {/* Contato */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.terms.section12.title')}
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  {t('legal.terms.section12.p1')}
                </p>
                <p className="font-semibold">E-mail: souzacawanne@gmail.com</p>
                <p className="font-semibold">Telefone: (81) 98665-3214</p>
              </div>
            </section>

            {/* Aceitação */}
            <section className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                {t('legal.terms.acceptance.title')}
              </h2>
              <p className="text-gray-700">
                {t('legal.terms.acceptance.p1')}
              </p>
            </section>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <Link to="" className="flex-1">
              <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>
                {t('legal.terms.back')}
              </Button>
            </Link>
            <Link to="/privacidade" className="flex-1">
              <Button className="w-full">{t('legal.terms.viewPrivacy')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TermosServicoPage;
