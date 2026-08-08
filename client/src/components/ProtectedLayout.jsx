import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
