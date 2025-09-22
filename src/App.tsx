import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/login/LoginPage.tsx";
import RegisterPage from "./pages/login/RegisterPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import QuestionarioPage from "./pages/QuestionarioPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import Footer from "./components/layout/Footer.tsx";
import TermosServicoPage from "./pages/legal/TermosServicoPage.tsx";
import PoliticaPrivacidadePage from "./pages/legal/PoliticaPrivacidadePage.tsx";
import ForgotPasswordPage from "./pages/login/ForgotPasswordPage.tsx";
import CheckEmailPage from "./pages/login/CheckEmailPage.tsx";
import ResetPasswordPage from "./pages/login/ResetPasswordPage.tsx";
import RefeicaoRegistroPage from "./pages/registroAtividades/RefeicaoRegistroPage.tsx";
import PesoRegistroPage from "./pages/registroAtividades/PesoRegistroPage.tsx";
import AguaRegistroPage from "./pages/registroAtividades/AguaRegistroPage.tsx";
import AgendarConsultaPage from "./pages/registroAtividades/AgendarConsultaPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/recuperar-senha/confirmacao" element={<CheckEmailPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/termos" element={<TermosServicoPage />} />
        <Route path="/privacidade" element={<PoliticaPrivacidadePage />} />
        <Route path="/questionario" element={<QuestionarioPage />} />

        {/* Rotas protegidas (requer login) */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/registro-refeicao" element={<PrivateRoute><RefeicaoRegistroPage /></PrivateRoute>} />
        <Route path="/registro-peso" element={<PrivateRoute><PesoRegistroPage /></PrivateRoute>} />
        <Route path="/registro-agua" element={<PrivateRoute><AguaRegistroPage /></PrivateRoute>} />
        <Route path="/agendar-consulta" element={<PrivateRoute><AgendarConsultaPage /></PrivateRoute>} />

        {/* Rotas administrativas */}
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* Rota para página não encontrada */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
