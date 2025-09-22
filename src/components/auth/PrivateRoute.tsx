import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Salva a página que o usuário tentou acessar para redirecioná-lo depois do login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};