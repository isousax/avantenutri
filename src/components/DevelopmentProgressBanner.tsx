import React, { useState } from 'react';

const DevelopmentBadge: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Badge Flutuante */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`bg-gradient-to-br from-green-400 to-green-500 text-white rounded-lg shadow-xl transform transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-14 h-14'
        } overflow-hidden`}>
          
          {/* Estado Compactado */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full h-full flex items-center justify-center relative group"
            >
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg"></div>
              <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Estado Expandido */}
          {isExpanded && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="font-bold text-sm">SITE EM DESENVOLVIMENTO</span>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2 text-xs">
                <p className="opacity-90">
                  Estamos melhorando sua experiência. Algumas funcionalidades podem estar em fase de testes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay quando expandido */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default DevelopmentBadge;