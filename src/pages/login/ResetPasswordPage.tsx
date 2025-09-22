import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LogoCroped from "../../components/ui/LogoCroped";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    general: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verificar se o token é válido (simulação)
  const isValidToken = token && token.length > 10;

  const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
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
    const strengthLabels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Muito forte'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-green-600'];

    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded transition-all ${
                index <= strength ? strengthColors[strength] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs ${
          strength <= 1 ? 'text-red-600' :
          strength <= 2 ? 'text-orange-600' :
          strength <= 3 ? 'text-yellow-600' :
          strength <= 4 ? 'text-blue-600' : 'text-green-600'
        }`}>
          Força da senha: {strengthLabels[strength]}
        </p>
      </div>
    );
  };

  const validateForm = () => {
    const newErrors = {
      password: '',
      confirmPassword: '',
      general: ''
    };

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter letras maiúsculas, minúsculas e números';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));

    try {
      // Simulação de API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!isValidToken) {
        throw new Error('Link inválido ou expirado');
      }
      
      // Simulação de sucesso
      setSuccess(true);
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : 'Erro ao redefinir senha. Tente novamente.'
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
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Link Inválido</h2>
          <p className="text-gray-600 mb-4">
            Este link de recuperação é inválido ou expirou.
          </p>
          <Link to="/recuperar-senha">
            <Button className="w-full">
              Solicitar Novo Link
            </Button>
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
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Senha Redefinida!</h2>
          <p className="text-gray-600 mb-4">
            Sua senha foi redefinida com sucesso. Redirecionando para o login...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-500 h-2 rounded-full animate-pulse"></div>
          </div>
          <Link to="/login">
            <Button variant="secondary" className="w-full">
              Ir para Login Agora
            </Button>
          </Link>
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
          <h1 className="text-3xl font-bold text-green-800 mb-2">Nova Senha</h1>
          <p className="text-gray-600">Crie uma nova senha para sua conta</p>
        </div>

        <Card className="p-8 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nova Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite sua nova senha"
                disabled={loading}
                autoFocus
              />
              <PasswordStrengthIndicator password={formData.password} />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite a senha novamente"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redefinindo...
                </div>
              ) : (
                'Redefinir Senha'
              )}
            </Button>

            {/* Erro Geral */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center text-red-600">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{errors.general}</span>
                </div>
              </div>
            )}
          </form>

          {/* Links de Navegação */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Lembrou sua senha?{' '}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;