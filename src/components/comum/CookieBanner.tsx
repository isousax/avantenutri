// components/comum/CookieBanner.tsx
import { useState, useEffect } from 'react';
import { Button } from '@headlessui/react';

interface CookieBannerProps {
  grantConsent: (level: 'essential' | 'all') => void;
}

const CookieBanner = ({ grantConsent }: CookieBannerProps) => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    grantConsent('all');
    setVisible(false);
  };

  const acceptSelected = () => {
    // Se pelo menos um cookie não essencial foi aceito, considerar como 'all'
    const hasNonEssential = Object.values(preferences).some(value => value);
    grantConsent(hasNonEssential ? 'all' : 'essential');
    setVisible(false);
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay de fundo */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={() => setVisible(false)}
      />

      {/* Banner de Cookies */}
      <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 translate-y-0">
        <div className="mx-4 mb-4 lg:mx-auto lg:max-w-4xl">
          <div className="bg-white rounded-xl shadow-2xl border border-green-100 p-6">
            {!showDetails ? (
              // Vista principal simplificada
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Privacidade e Cookies
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Nós utilizamos cookies e tecnologias semelhantes para melhorar sua experiência em nosso site, 
                      personalizar conteúdo e anúncios, e analisar o tráfego. Alguns cookies são necessários para o 
                      funcionamento do site, enquanto outros nos ajudam a melhorar sua experiência.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    onClick={acceptAll}
                    className="w-full sm:flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] border-none"
                  >
                    Aceitar Todos
                  </Button>
                  <Button 
                    onClick={() => setShowDetails(true)}
                    className="w-full sm:flex-1 py-3 bg-white text-green-600 border border-green-600 hover:bg-green-50 font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Personalizar
                  </Button>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setVisible(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              // Vista detalhada de personalização
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Configurações de Cookies
                  </h3>
                  <button 
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Cookie Necessário */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Cookies Necessários</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Essenciais para o funcionamento básico do site. Não podem ser desativados.
                      </p>
                    </div>
                    <div className="relative inline-flex items-center cursor-not-allowed opacity-50">
                      <div className="w-11 h-6 bg-green-400 rounded-full"></div>
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
                    </div>
                  </div>

                  {/* Cookies Analíticos */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Cookies Analíticos</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Nos ajudam a entender como os visitantes interagem com o site.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePreference('analytics')}
                      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${
                        preferences.analytics ? 'bg-green-400' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        preferences.analytics ? 'transform translate-x-5' : ''
                      }`}></span>
                    </button>
                  </div>

                  {/* Cookies de Marketing */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Cookies de Marketing</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Usados para personalizar anúncios e medir a eficácia das campanhas.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePreference('marketing')}
                      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${
                        preferences.marketing ? 'bg-green-400' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        preferences.marketing ? 'transform translate-x-5' : ''
                      }`}></span>
                    </button>
                  </div>

                  {/* Cookies de Preferências */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Cookies de Preferências</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Permitem que o site lembre de escolhas que você fez.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePreference('preferences')}
                      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${
                        preferences.preferences ? 'bg-green-400' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        preferences.preferences ? 'transform translate-x-5' : ''
                      }`}></span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={acceptSelected}
                    className="w-full sm:flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] border-none"
                  >
                    Salvar Minhas Escolhas
                  </Button>
                  <Button 
                    onClick={acceptAll}
                    className="w-full sm:flex-1 py-3 bg-white text-green-600 border border-green-600 hover:bg-green-50 font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Aceitar Todos
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>
                    Para mais informações, consulte nossa{' '}
                    <a 
                      href="/politica-privacidade" 
                      className="text-green-600 hover:text-green-700 underline transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/politica-privacidade', '_blank');
                      }}
                    >
                      Política de Privacidade
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieBanner;