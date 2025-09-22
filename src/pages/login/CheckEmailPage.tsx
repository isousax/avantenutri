import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LogoCroped from '../../components/ui/LogoCroped';

const CheckEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'seu e-mail';

  const handleResendEmail = async () => {
    // Simulação de reenvio de e-mail
    alert(`Link de recuperação reenviado para ${email}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <div className="w-full max-w-md">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <LogoCroped />
          </Link>
        </div>

        <Card className="p-8 shadow-xl border border-green-100 text-center">
          {/* Ícone de Sucesso */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-green-800 mb-4">Verifique seu e-mail</h1>
          
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              Enviamos um link de recuperação para:
            </p>
            <p className="font-semibold text-green-700 text-lg">{email}</p>
            <p className="text-xs text-gray-500">
              Siga as instruções no e-mail para redefinir sua senha.
            </p>
          </div>

          {/* Dicas */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left mb-6">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Não recebeu o e-mail?
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Verifique sua pasta de spam/lixo eletrônico</li>
              <li>• Confirme se digitou o e-mail corretamente</li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              className="w-full py-3 flex justify-center text-center"
              variant="secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reenviar Link
            </Button>
            
            <Button
              onClick={() => navigate('/recuperar-senha')}
              className="w-full py-3 flex justify-center text-center"
              variant="secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Usar Outro E-mail
            </Button>

            <Link to="/login" className="block">
              <Button className="w-full py-3">
                Voltar para o Login
              </Button>
            </Link>
          </div>
        </Card>

        {/* Informações de Segurança */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Link de recuperação válido por 1 hora
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailPage;