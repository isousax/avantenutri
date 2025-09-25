import { useEffect } from 'react';
import { useAuth } from '../contexts';
import { useNavigate } from 'react-router-dom';

export function useProtectedRoute(role: 'patient' | 'admin' = 'patient') {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate('/login', { replace: true });
    } else if (role === 'admin' && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    } else if (role === 'patient' && user.role !== 'patient') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate, role]);
}
