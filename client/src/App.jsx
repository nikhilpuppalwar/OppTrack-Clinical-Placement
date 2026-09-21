import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import NewOpportunity from './pages/NewOpportunity';
import OpportunityDetail from './pages/OpportunityDetail';
import CalendarPage from './pages/CalendarPage';
import History from './pages/History';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import HelpGuide from './pages/HelpGuide';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Landing />;
  return <ProtectedLayout><Dashboard /></ProtectedLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#172033',
              border: '1px solid #E5EAF0',
              boxShadow: '0 8px 24px rgba(11, 31, 58, 0.08)',
              fontSize: '13.5px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif'
            },
            success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC3545', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/opportunities" element={<ProtectedLayout><Opportunities /></ProtectedLayout>} />
          <Route path="/opportunities/new" element={<ProtectedLayout><NewOpportunity /></ProtectedLayout>} />
          <Route path="/opportunities/:id" element={<ProtectedLayout><OpportunityDetail /></ProtectedLayout>} />
          <Route path="/calendar" element={<ProtectedLayout><CalendarPage /></ProtectedLayout>} />
          <Route path="/history" element={<ProtectedLayout><History /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="/help" element={<ProtectedLayout><HelpGuide /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
