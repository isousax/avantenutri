import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts';

interface RoleRouteProps {
  children: React.ReactNode;
  role: 'admin' | 'paciente';
}

export function RoleRoute({ children, role }: RoleRouteProps) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) {
    // Redireciona para a tela correta do usuário
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }
  return <>{children}</>;
}
