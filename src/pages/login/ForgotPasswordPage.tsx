import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LogoCroped from "../../components/ui/LogoCroped";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({ email: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
      // Simulação de envio de e-mail
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulação de sucesso
      setEmailSent(true);

      // Redirecionar para a página de confirmação após 2 segundos
      setTimeout(() => {
        navigate("/recuperar-senha/confirmacao", {
          state: { email },
        });
      }, 2000);
    } catch {
      setErrors({
        email: "",
        general: "Erro ao enviar e-mail. Tente novamente mais tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
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
            Redirecionando para a página de confirmação...
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                E-mail cadastrado
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="seu@email.com"
                disabled={loading}
                autoFocus
              />
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
              disabled={loading}
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
              ) : (
                "Enviar Link de Recuperação"
              )}
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
            Link de recuperação válido por 1 hora
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
