import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import { useI18n } from '../../i18n';

export default function Faq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const { t } = useI18n();
  const faqData = [
    { q: 'home.faq.q1.q', a: 'home.faq.q1.a' },
    { q: 'home.faq.q2.q', a: 'home.faq.q2.a' },
    { q: 'home.faq.q3.q', a: 'home.faq.q3.a' },
    { q: 'home.faq.q4.q', a: 'home.faq.q4.a' },
    { q: 'home.faq.q5.q', a: 'home.faq.q5.a' },
    { q: 'home.faq.q6.q', a: 'home.faq.q6.a' },
  ] as const;

  return (
    <section className="py-16 bg-gradient-to-br from-green-600 to-emerald-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            {t('home.faq.heading')}
          </h2>
          <p className="text-lg text-white/90 font-light max-w-2xl mx-auto">
            {t('home.faq.subtitle')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="border border-white/25 rounded-xl overflow-hidden shadow-lg bg-white/10 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:shadow-green-300/30"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-6 text-left font-semibold text-white hover:text-green-100 transition-colors"
                >
                  <span className="flex items-center text-lg">
                    {t(faq.q as any)}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-chevron-down h-5 w-5 shrink-0 transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    openFaq === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-6 pt-0 text-white/90 leading-relaxed">
                    {t(faq.a as any)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-white/80 mb-6">
            {t('home.faq.moreQuestions')}
          </p>
          <Link to="/questionario">
            <Button className="bg-white text-green-700 hover:bg-green-50 px-8 py-3 font-semibold">
              {t('home.faq.contactButton')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
