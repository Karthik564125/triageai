import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TicketProvider } from './context/TicketContext';
import { Login } from './pages/Login';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Toaster } from 'react-hot-toast';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // If not logged in -> redirect to /login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If role does not match allowedRole -> redirect to /login
  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root Redirect Helper
const RootRedirect = () => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/user'} replace />;
};

// Login Route Guard (redirects already logged in users to their role dashboard)
const PublicOnlyRoute = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (isAuthenticated && currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/user'} replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <TicketProvider>
        <BrowserRouter>
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0f172a',
                color: '#fff',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }
            }} 
          />
          <Routes>
            {/* Public Login Route */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />

            {/* Client User Dashboard Route */}
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRole="client">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Root & Fallback Redirect */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </TicketProvider>
    </AuthProvider>
  );
}
