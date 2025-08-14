import { Navigate } from 'react-router';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('googleToken');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
