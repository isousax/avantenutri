import React, { useState } from "react";
import { API } from "../../config/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n/utils";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const API_RESET_PASSWORD = API.PASSWORD_RESET;

  // Validação superficial do token apenas para UX; verificação real acontece no backend
  const isValidToken = token && token.length >= 16;

  const PasswordStrengthIndicator: React.FC<{ password: string }> = ({
    password,
  }) => {
    if (!password) return null;

    const getStrength = (pwd: string) => {
      let score = 0;
      if (pwd.length >= 6) score++;
      if (pwd.length >= 8) score++;
      if (/[a-z]/.test(pwd)) score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++;

      return Math.min(score, 5);
    };

    const strength = getStrength(password);
    const strengthLabels = [
      t('auth.password.strength.veryWeak'),
      t('auth.password.strength.weak'),
      t('auth.password.strength.fair'),
      t('auth.password.strength.good'),
      t('auth.password.strength.strong'),
      t('auth.password.strength.veryStrong'),
    ];
    const strengthColors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-green-600",
    ];

    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded transition-all ${
                index <= strength ? strengthColors[strength] : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p
          className={`text-xs ${
            strength <= 1
              ? "text-red-600"
              : strength <= 2
              ? "text-orange-600"
              : strength <= 3
              ? "text-yellow-600"
              : strength <= 4
              ? "text-blue-600"
              : "text-green-600"
          }`}
        >
          {`Força da senha: ${strengthLabels[strength]}`}
        </p>
      </div>
    );
  };

  const validateForm = () => {
    const newErrors = {
      password: "",
      confirmPassword: "",
      general: "",
    };

    if (!formData.password) {
      newErrors.password = t('auth.password.reset.error.passwordRequired');
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(
        formData.password
      )
    ) {
      newErrors.password = t('auth.password.reset.error.passwordPolicy');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.password.reset.error.confirmRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.password.reset.error.noMatch');
    }

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        general: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const res = await fetch(API_RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: formData.password }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch (err) {
        console.warn("Erro ao resetar senha: ", err);
      }

      if (res.status === 400 || res.status === 422) {
        setErrors((prev) => ({
          ...prev,
          general: data?.error || t('auth.password.reset.invalidLink.desc'),
        }));
        return;
      }
      if (res.status === 404) {
        setErrors((prev) => ({
          ...prev,
          general: t('auth.password.reset.error.tokenNotFound'),
        }));
        return;
      }
      if (res.status === 429) {
        setErrors((prev) => ({
          ...prev,
          general: t('auth.password.reset.error.tooMany'),
        }));
        return;
      }
      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          general: data?.error || t('auth.password.reset.error.generic'),
        }));
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 4000);
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: t('auth.password.reset.error.network'),
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            {t('auth.password.reset.invalidLink.title')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('auth.password.reset.invalidLink.desc')}
          </p>
          <Link to="/recuperar-senha">
            <Button className="w-full">{t('auth.password.reset.invalidLink.requestNew')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (success) {
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
            {t('auth.password.reset.success.title')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('auth.password.reset.success.desc')}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-500 h-2 rounded-full animate-pulse"></div>
          </div>
          <Link to="/login">
            <Button variant="secondary" className="w-full">
              {t('auth.password.reset.goLoginNow')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <SEO
        title={t('reset.seo.title')}
        description={t('reset.seo.desc')}
      />
      <div className="w-full max-w-md">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
          <h1 className="text-3xl font-bold text-green-800 mb-2">{t('auth.password.reset.title')}</h1>
          <p className="text-gray-600">{t('auth.password.reset.subtitle')}</p>
        </div>

        <Card className="p-8 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nova Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.password.reset.new')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t('auth.password.reset.placeholder')}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPwd((p) => !p)}
                  tabIndex={-1}
                >
                  {showPwd ? t('auth.password.reset.hide') : t('auth.password.reset.show')}
                </button>
              </div>
              <PasswordStrengthIndicator password={formData.password} />
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

            {/* Campo Confirmar Senha */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.password.reset.confirm')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Digite a senha novamente"
                disabled={loading}
              />
              {errors.confirmPassword && (
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
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Botão de Redefinir */}
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
                  {t('auth.password.reset.loading')}
                </div>
              ) : (
                t('auth.password.reset.submit')
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
                {t('auth.login.submit')}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
