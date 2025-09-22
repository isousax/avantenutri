import React, { useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

const RecoverPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulação de envio de e-mail
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-brand-700 mb-6 text-center">
              Recuperar Senha
            </h2>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Digite seu e-mail para receber as instruções de recuperação de senha.
            </p>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                type="email"
                label="E-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Instruções'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/login')}
              >
                Voltar ao Login
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-brand-700 mb-2">
              E-mail Enviado!
            </h2>
            <p className="text-gray-600 mb-6">
              Verifique sua caixa de entrada para as instruções de recuperação de senha.
            </p>
            <Button onClick={() => navigate('/login')}>
              Voltar ao Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoverPasswordPage;