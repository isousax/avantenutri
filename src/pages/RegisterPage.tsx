import React, { useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!email || !name || !password || !confirm) {
      setError('Preencha todos os campos');
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }
    // Simulação de cadastro
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">Criar Conta</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input type="text" label="Nome" value={name} onChange={e => setName(e.target.value)} required />
          <Input type="email" label="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" label="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
          <Input type="password" label="Confirmar Senha" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <Button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
        </form>
        {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
        <p className="text-center text-sm text-gray-500 mt-4">Já tem conta? <a href="/login" className="text-green-600 hover:underline">Entrar</a></p>
      </div>
    </div>
  );
};

export default RegisterPage;
