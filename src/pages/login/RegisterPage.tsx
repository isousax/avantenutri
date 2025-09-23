import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";

const RegisterPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    acceptTerms: "",
    general: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      acceptTerms: "",
      general: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Nome completo é obrigatório";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Senha deve conter letras maiúsculas, minúsculas e números";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Você deve aceitar os termos e políticas";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      // Simulação de API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulação de sucesso no cadastro
      setSuccess(true);

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: "Erro ao criar conta. Tente novamente mais tarde.",
      }));
    } finally {
      setLoading(false);
    }
  };

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
      "Muito fraca",
      "Fraca",
      "Razoável",
      "Boa",
      "Forte",
      "Muito forte",
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
          Força da senha: {strengthLabels[strength]}
        </p>
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
        <SEO
          title="Cadastro | Avante Nutri"
          description="Crie sua conta na Avante Nutri e comece sua jornada para uma vida mais saudável com acompanhamento nutricional personalizado."
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
            Conta criada com sucesso!
          </h2>
          <p className="text-gray-600 mb-6">
            Redirecionando para a página de login...
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
            Crie sua conta
          </h1>
          <p className="text-gray-600 text-xs">
            Junte-se a nós e comece sua jornada de saúde
          </p>
        </div>

        <Card className="p-8 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nome */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nome completo *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Seu nome completo"
                disabled={loading}
              />
              {errors.name && (
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
                  {errors.name}
                </p>
              )}
            </div>

            {/* Campo E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                E-mail *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="seu@email.com"
                disabled={loading}
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

            {/* Campo Telefone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Telefone/WhatsApp *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="(61) 99999-9999"
                disabled={loading}
              />
              {errors.phone && (
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
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Senha *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Crie uma senha segura"
                disabled={loading}
              />
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
                Confirmar senha *
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

            {/* Termos e Condições */}
            <div>
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                  disabled={loading}
                />
                <label
                  htmlFor="acceptTerms"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Concordo com os{" "}
                  <Link
                    to="/termos"
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    termos de serviço
                  </Link>{" "}
                  e{" "}
                  <Link
                    to="/privacidade"
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    política de privacidade
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
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
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* Botão de Cadastro */}
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
                  Criando conta...
                </div>
              ) : (
                "Criar conta"
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

          {/* Link para Login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                Faça login aqui
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
            Seus dados estão protegidos e criptografados
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
