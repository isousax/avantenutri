import React from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { useI18n, formatDate } from "../../i18n";

const PoliticaPrivacidadePage: React.FC = () => {
  const { t, locale } = useI18n();
  const lastUpdatedRaw = "2025-09-22";
  const lastUpdated = formatDate(lastUpdatedRaw, locale, { dateStyle: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <SEO
        title={t('legal.privacy.seo.title')}
        description={t('legal.privacy.seo.desc')}
        url="https://avantenutri.com.br/privacidade"
      />
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            {t('legal.privacy.title')}
          </h1>
          <p className="text-xs text-gray-600">
            {t('legal.privacy.lastUpdated', { date: lastUpdated })}
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="prose prose-lg max-w-none prose-green">
            {/* Introdução */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section1.title')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('legal.privacy.section1.p1')}
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-semibold text-green-800">
                  {t('legal.privacy.section1.commitmentTitle')}:
                </p>
                <p>
                  {t('legal.privacy.section1.commitmentBody')}
                </p>
              </div>
            </section>

            {/* Dados Coletados */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section2.title')}
              </h2>

              <h3 className="text-xl font-semibold text-green-700 mb-3">
                {t('legal.privacy.section2.hPersonal')}
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>{t('legal.privacy.section2.personal.li1')}</li>
                <li>{t('legal.privacy.section2.personal.li2')}</li>
                <li>{t('legal.privacy.section2.personal.li3')}</li>
                <li>{t('legal.privacy.section2.personal.li4')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-green-700 mb-3">
                {t('legal.privacy.section2.hHealth')}
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>{t('legal.privacy.section2.health.li1')}</li>
                <li>{t('legal.privacy.section2.health.li2')}</li>
                <li>{t('legal.privacy.section2.health.li3')}</li>
                <li>{t('legal.privacy.section2.health.li4')}</li>
                <li>{t('legal.privacy.section2.health.li5')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-green-700 mb-3">
                {t('legal.privacy.section2.hTech')}
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>{t('legal.privacy.section2.tech.li1')}</li>
                <li>{t('legal.privacy.section2.tech.li2')}</li>
                <li>{t('legal.privacy.section2.tech.li3')}</li>
              </ul>
            </section>

            {/* Base Legal */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section3.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold text-blue-800">{t('legal.privacy.section3.consent')}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-green-800">{t('legal.privacy.section3.contract')}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-semibold text-purple-800">{t('legal.privacy.section3.legitimateInterest')}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="font-semibold text-yellow-800">{t('legal.privacy.section3.legalObligation')}</p>
                </div>
              </div>
            </section>

            {/* Finalidades */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section4.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    1
                  </span>
                  <span>{t('legal.privacy.section4.li1')}</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    2
                  </span>
                  <span>{t('legal.privacy.section4.li2')}</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    3
                  </span>
                  <span>{t('legal.privacy.section4.li3')}</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    4
                  </span>
                  <span>{t('legal.privacy.section4.li4')}</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                    5
                  </span>
                  <span>{t('legal.privacy.section4.li5')}</span>
                </div>
              </div>
            </section>

            {/* Compartilhamento */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section5.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>{t('legal.privacy.section5.p1')}</p>
                <p>{t('legal.privacy.section5.p2')}</p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>{t('legal.privacy.section5.li1')}</li>
                  <li>{t('legal.privacy.section5.li2')}</li>
                  <li>{t('legal.privacy.section5.li3')}</li>
                </ul>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-semibold text-red-800">{t('legal.privacy.section5.warningTitle')}:</p>
                  <p>{t('legal.privacy.section5.warningBody')}</p>
                </div>
              </div>
            </section>

            {/* Segurança */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section6.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">
                    {t('legal.privacy.section6.techTitle')}
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>{t('legal.privacy.section6.tech.li1')}</li>
                    <li>{t('legal.privacy.section6.tech.li2')}</li>
                    <li>{t('legal.privacy.section6.tech.li3')}</li>
                    <li>{t('legal.privacy.section6.tech.li4')}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">
                    {t('legal.privacy.section6.orgTitle')}
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>{t('legal.privacy.section6.org.li1')}</li>
                    <li>{t('legal.privacy.section6.org.li2')}</li>
                    <li>{t('legal.privacy.section6.org.li3')}</li>
                    <li>{t('legal.privacy.section6.org.li4')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Seus Direitos */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section7.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-green-800">
                    {t('legal.privacy.section7.rightsTitle')}:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t('legal.privacy.section7.rights.li1')}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t('legal.privacy.section7.rights.li2')}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t('legal.privacy.section7.rights.li3')}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t('legal.privacy.section7.rights.li4')}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t('legal.privacy.section7.rights.li5')}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t('legal.privacy.section7.rights.li6')}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Retenção */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section8.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>{t('legal.privacy.section8.pIntro')}</p>
                <ul className="list-disc list-inside ml-6 space-y-2">
                  <li><strong>{t('legal.privacy.section8.li1').split(':')[0]}:</strong> {t('legal.privacy.section8.li1').split(':').slice(1).join(':').trim()}</li>
                  <li><strong>{t('legal.privacy.section8.li2').split(':')[0]}:</strong> {t('legal.privacy.section8.li2').split(':').slice(1).join(':').trim()}</li>
                  <li><strong>{t('legal.privacy.section8.li3').split(':')[0]}:</strong> {t('legal.privacy.section8.li3').split(':').slice(1).join(':').trim()}</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section9.title')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('legal.privacy.section9.p1')}
              </p>
            </section>

            {/* Alterações */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {t('legal.privacy.section10.title')}
              </h2>
              <p className="text-gray-700">
                {t('legal.privacy.section10.p1')}
              </p>
            </section>

            {/* Consentimento */}
            <section className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                {t('legal.privacy.consent.title')}
              </h2>
              <p className="text-gray-700">
                {t('legal.privacy.consent.p1')}
              </p>
            </section>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <Link to="/termos" className="flex-1">
              <Button variant="secondary" className="w-full">
                {t('legal.privacy.viewTerms')}
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button className="w-full">{t('legal.privacy.goHome')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PoliticaPrivacidadePage;
