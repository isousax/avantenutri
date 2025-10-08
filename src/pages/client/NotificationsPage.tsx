// NotificationsPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "../../components/comum/SEO";
import NotificationCenter from "../../components/notifications/NotificationCenter";
import { ArrowLeft, Inbox } from "../../components/icons";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <SEO
        title="Notificações | Avante Nutri"
        description="Visualize suas notificações e atualizações importantes"
      />

      {/* Header Modernizado */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                Central de Notificações
              </h1>
            </div>

            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-300/30">
              <Inbox size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto p-4 pb-8">
        <NotificationCenter />
      </div>
    </div>
  );
};

export default NotificationsPage;
