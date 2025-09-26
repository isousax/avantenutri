import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Routes, Route } from "react-router-dom";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import LandingPage from "./pages/home/LandingPage.tsx";
import LoginPage from "./pages/login/LoginPage.tsx";
import RegisterPage from "./pages/login/RegisterPage.tsx";
import DashboardPage from "./pages/client/DashboardPage.tsx";
import QuestionarioPage from "./pages/client/QuestionarioPage.tsx";
import AdminPage from "./pages/admin/AdminPage.tsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.tsx";
import AdminAuditPage from "./pages/admin/AdminAuditPage.tsx";
import AdminEntitlementsPage from "./pages/admin/AdminEntitlementsPage.tsx";
import TermosServicoPage from "./pages/legal/TermosServicoPage.tsx";
import PoliticaPrivacidadePage from "./pages/legal/PoliticaPrivacidadePage.tsx";
import ForgotPasswordPage from "./pages/login/ForgotPasswordPage.tsx";
import VerifyEmailPage from "./pages/login/VerifyEmailPage.tsx";
import ConfirmEmailPage from "./pages/login/ConfirmEmailPage.tsx";
import ResetPasswordPage from "./pages/login/ResetPasswordPage.tsx";
import RefeicaoRegistroPage from "./pages/client/registroAtividades/RefeicaoRegistroPage.tsx";
import PesoRegistroPage from "./pages/client/registroAtividades/PesoRegistroPage.tsx";
import AguaRegistroPage from "./pages/client/registroAtividades/AguaRegistroPage.tsx";
import AgendarConsultaPage from "./pages/client/registroAtividades/AgendarConsultaPage.tsx";
import NotFound from "./pages/handle/NotFound.tsx";
import CookieBanner from "./components/comum/CookieBanner.tsx";

import useCookieConsent from "./hooks/useCookieConsent";
import { useEffect } from "react";
import type { FbqFunction } from "./types/global";
import BlogPage from "./pages/blog/BlogPage.tsx";
import BlogPostPage from "./pages/blog/BlogPostPage.tsx";
import DevelopmentBadge from "./components/DevelopmentProgressBanner";

function App() {
  const { grantConsent } = useCookieConsent();

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (consent === "all") {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function (
        ...args: (string | number | object | undefined)[]
      ) {
        window.dataLayer.push(args);
      };

      window.gtag("js", new Date());
      window.gtag("config", "SEU_ID_ANALYTICS");

      if (typeof window.fbq !== "function") {
        (function (
          f: Window & { fbq?: FbqFunction; _fbq?: FbqFunction },
          b: Document,
          e: string,
          v: string,
          t?: HTMLScriptElement,
          s?: Element | null
        ) {
          const fbqFunc: FbqFunction = function (...args: unknown[]) {
            if (fbqFunc.callMethod) {
              fbqFunc.callMethod(...args);
            } else {
              fbqFunc.queue!.push(args);
            }
          };

          if (!f._fbq) f._fbq = fbqFunc;
          fbqFunc.push = fbqFunc;
          fbqFunc.loaded = true;
          fbqFunc.version = "2.0";
          fbqFunc.queue = [];

          t = b.createElement(e) as HTMLScriptElement;
          t.async = true;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          if (s?.parentNode && t) {
            s.parentNode.insertBefore(t, s);
          }

          f.fbq = fbqFunc;
        })(
          window,
          document,
          "script",
          "https://connect.facebook.net/en_US/fbevents.js"
        );

        (window.fbq as FbqFunction)("init", "SEU_PIXEL_ID");
        (window.fbq as FbqFunction)("track", "PageView");
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main>
        {/* Banner de Cookies (condicional) */}
        <CookieBanner grantConsent={grantConsent} />
        <DevelopmentBadge />

        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/resetar-senha" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
          <Route path="/termos" element={<TermosServicoPage />} />
          <Route path="/privacidade" element={<PoliticaPrivacidadePage />} />
          <Route path="/questionario" element={<QuestionarioPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />

          {/* Rotas protegidas (requer login) */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/registro-refeicao"
            element={
              <PrivateRoute>
                <RefeicaoRegistroPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/registro-peso"
            element={
              <PrivateRoute>
                <PesoRegistroPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/registro-agua"
            element={
              <PrivateRoute>
                <AguaRegistroPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/agendar-consulta"
            element={
              <PrivateRoute>
                <AgendarConsultaPage />
              </PrivateRoute>
            }
          />

          {/* Rotas administrativas */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <AdminAuditPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/entitlements"
            element={
              <AdminRoute>
                <AdminEntitlementsPage />
              </AdminRoute>
            }
          />

          {/* Rota para 404*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </main>
    </div>
  );
}

export default App;
