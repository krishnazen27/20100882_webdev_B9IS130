import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomsPage from './pages/CustomsPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'customs' ? '/customs' : '/'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'client']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customs"
          element={
            <ProtectedRoute allowedRoles={['admin', 'customs']}>
              <CustomsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
