import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import PostProblemPage from './pages/PostProblemPage';
import ExternalExplorerPage from './pages/ExternalExplorerPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/problems/:id" element={<ProblemDetailPage />} />
          <Route path="/explore-external" element={<ExternalExplorerPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostProblemPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
