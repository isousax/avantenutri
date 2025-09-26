import React, { useState } from "react";
import { API } from "../../config/api";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({ email: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const API_REQUEST_RESET = API.PASSWORD_REQUEST_RESET;

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return "E-mail é obrigatório";
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return "E-mail inválido";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError, general: "" });
      return;
    }

    setLoading(true);
    setErrors({ email: "", general: "" });

    try {
      const res = await fetch(API_REQUEST_RESET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      // Tentamos extrair JSON (mesmo se 200 genérico)
      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.status === 429) {
        const retry = Number(res.headers.get("Retry-After") || 60);
        setCooldown(retry);
        setErrors({ email: "", general: `Muitas tentativas. Aguarde ${retry}s.` });
        return;
      }

      if (!res.ok && data?.error) {
        setErrors({ email: "", general: data.error || "Erro ao solicitar redefinição" });
        return;
      }

      setEmailSent(true);
      // Redireciona após alguns segundos para login permitindo copiar email
      setTimeout(() => {
        navigate("/login", { state: { email } });
      }, 8000);
    } catch (err) {
      setErrors({ email: "", general: "Erro de rede. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  // Gerencia countdown se houver cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const MailIcon = () => (
    <svg
      className="w-5 h-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
        <SEO
          title="Recuperar Senha | Avante Nutri"
          description="Recupere o acesso à sua conta Avante Nutri através do seu e-mail cadastrado."
        />
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            E-mail enviado!
          </h2>
          <p className="text-gray-600 mb-6">
            Por favor, verifique sua caixa de entrada e a pasta de spam.
          </p>
          <p className="text-gray-600 mb-2 text-xs">
            Você será redirecionado para a página de login.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full animate-pulse"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <div className="w-full max-w-md">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Recuperar Senha
          </h1>
          <p className="text-gray-600 text-xs">
            Digite seu e-mail para receber o link de recuperação
          </p>
        </div>

        <Card className="p-8 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instruções */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-center text-center">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-blue-700">
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
            </div>

            {/* Campo E-mail */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  className={`flex w-full pl-10 pr-10 py-3 rounded-lg border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="E-mail Cadastrado"
                  disabled={loading}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Botão de Enviar */}
            <Button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full py-3 text-lg font-semibold transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enviando...
                </div>
              ) : cooldown > 0 ? `Aguarde ${cooldown}s` : "Enviar Link de Recuperação"}
            </Button>

            {/* Erro Geral */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center text-red-600">
                  <svg
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">{errors.general}</span>
                </div>
              </div>
            )}
          </form>

          {/* Links de Navegação */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Lembrou sua senha?{" "}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </Card>

        {/* Informações de Segurança */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Link de recuperação válido por 30 minutos
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
