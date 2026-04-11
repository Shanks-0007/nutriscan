import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Scan } from './pages/Scan';
import { Results } from './pages/Results';
import { History } from './pages/History';
import { Insights } from './pages/Insights';
import { Profile } from './pages/Profile';
import { Explore } from './pages/Explore';
import { Settings } from './pages/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return (
    <div className="flex-1 flex items-center justify-center relative z-10">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-teal-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return (
    <div className="flex-1 flex items-center justify-center relative z-10">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-teal-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Public Routes */}
                <Route index element={<PublicRoute><Landing /></PublicRoute>} />
                <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="signup" element={<PublicRoute><Signup /></PublicRoute>} />

                {/* Protected Routes */}
                <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
                <Route path="results/:scanId" element={<ProtectedRoute><Results /></ProtectedRoute>} />
                <Route path="history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
                <Route path="explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
