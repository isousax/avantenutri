import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function useProtectedRoute(role: 'paciente' | 'admin' = 'paciente') {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (role === 'admin' && user.role !== 'admin') {
      navigate('/dashboard');
    } else if (role === 'paciente' && user.role !== 'paciente') {
      navigate('/admin');
    }
  }, [user, navigate, role]);
}
