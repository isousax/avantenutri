import React, { useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../contexts';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const ok = await login(email, password);
    
    if (ok) {
      // Adiciona classe de fade-out antes de navegar
      document.body.classList.add('fade-out');
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
    } else {
      setError('E-mail ou senha inválidos');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white p-6">
      <div className={`
        bg-white p-8 rounded-lg shadow-lg w-full max-w-md
        transform transition-all duration-300 ease-in-out
        ${shake ? 'animate-shake' : ''}
        hover:shadow-xl
      `}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-brand-700 mb-2">
            Bem-vindo(a) de volta!
          </h2>
          <p className="text-gray-600">
            Entre para acessar sua área do paciente
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="email"
              label="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="transform transition-all duration-200 focus:scale-[1.02]"
            />
            <Input
              type="password"
              label="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="transform transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-brand-600 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50" />
              <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
            </label>
            <Link
              to="/recuperar-senha"
              className="text-sm text-brand-600 hover:text-brand-700 transition-colors duration-200"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </div>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-8">
          Não tem conta?{' '}
          <Link
            to="/register"
            className="text-brand-600 hover:text-brand-700 transition-colors duration-200"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
