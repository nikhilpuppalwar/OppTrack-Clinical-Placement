import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1e32', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
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
