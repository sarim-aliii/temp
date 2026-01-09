import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthManager } from './components/auth/AuthManager';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import AdminWaitlist from './components/admin/AdminWaitlist';


// Helper to redirect if already logged in
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { currentUser, loading } = useAppContext();
  if (!loading && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing onEnter={() => window.location.href = '/login'} />} />

      <Route path="/admin/waitlist" element={<AdminWaitlist />} />

      <Route path="/login" element={
        <PublicRoute>
          <AuthManager />
        </PublicRoute>
      } />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </Router>
  );
}

export default App;