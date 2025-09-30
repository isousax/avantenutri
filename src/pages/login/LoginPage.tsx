import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts";
import { decodeJwt } from "../../utils/decodeJwt";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from '../../i18n';

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      // Redireciona baseado no tipo de usuário
      const redirectPath = user.role === "admin" ? "/admin" : "/dashboard";
      navigate(redirectPath);
    }
  }, [user, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        general: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    if (!formData.email.trim()) {
  newErrors.email = t('auth.error.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
  newErrors.email = t('auth.error.emailInvalid');
    }

    if (!formData.password) {
  newErrors.password = t('auth.error.passwordRequired');
    } else if (formData.password.length < 6) {
  newErrors.password = t('auth.error.passwordMin');
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  function normalizeRole(raw: unknown): "admin" | "patient" {
    if (typeof raw === "string" && raw.toLowerCase() === "admin") {
      return "admin";
    }
    return "patient";
  }

  // Define a rota padrão baseada no tipo de usuário
  const getRouteForRole = (role: string) => {
    return role === "admin" ? "/admin" : "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const success = await login(
        formData.email,
        formData.password,
        rememberMe
      );

      if (success) {
        try {
          const storage = sessionStorage.getItem("@AvanteNutri:access_token")
            ? sessionStorage
            : localStorage;
          const access = storage.getItem("@AvanteNutri:access_token");
          let role = "patient";
          if (access) {
            const payload = decodeJwt(access);
            if (payload && payload.role) role = String(payload.role);
          } else if (user && user.role) {
            role = user.role;
          }

          const normalized = normalizeRole(role);
          const redirectPath = getRouteForRole(normalized);

          // animação visual
          document.body.classList.add("fade-out");
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 200);
          return;
        } catch (err) {
          console.warn(
            "Falha ao ler role do token, usando fallback de usuário:",
            err
          );
          document.body.classList.add("fade-out");
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 200);
          return;
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          general: t('auth.error.invalidCredentials'),
        }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
  general: t('auth.error.generic'),
      }));
    } finally {
      setLoading(false);
    }
  };

  // Ícones SVG para os campos
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

  const LockIcon = () => (
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <SEO
        title={t('login.seo.title')}
        description={t('login.seo.desc')}
        url="https://avantenutri.com.br/login"
      />
      <div className="w-full max-w-md">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <div className="flex items-center">
              <LogoCroped />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-green-800 mb-2">{t('auth.login.title')}</h1>
          <p className="text-sm text-gray-500">{t('auth.login.subtitle')}</p>
        </div>

        <Card className="p-8 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={formData.email}
                  onChange={handleChange}
                  className={`flex w-full pl-10 pr-10 py-3 rounded-lg border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t('auth.login.email')}
                  disabled={loading}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
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

            {/* Campo Senha */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`flex w-full pl-10 pr-10 py-3 rounded-lg border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t('auth.login.password')}
                  disabled={loading}
                />
              </div>
              {errors.password && (
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
                  {errors.password}
                </p>
              )}
            </div>

            {/* Lembrar-me e Esqueceu a senha */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t('auth.login.remember')}
                </label>
              </div>

              <Link
                to="/recuperar-senha"
                className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
              >
                {t('auth.login.forgot')}
              </Link>
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg font-semibold transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 mt-2"
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
                  {t('auth.login.loading')}
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
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
                    className="lucide lucide-log-in h-5 w-5"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" x2="3" y1="12" y2="12"></line>
                  </svg>
                  <span>{t('auth.login.submit')}</span>
                </span>
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

          {/* Divisor */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-sm text-gray-500">{t('auth.login.or')}</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Link para Cadastro */}
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500">
              {t('auth.login.noAccount')} {" "}
              <Link
                to="/register"
                className="font-medium text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                {t('auth.login.registerHere')}
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
            {t('auth.login.secure')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
