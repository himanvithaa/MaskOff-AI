import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ScenariosPage from './pages/ScenariosPage';
import SimulatorPage from './pages/SimulatorPage';
import FeedbackPage from './pages/FeedbackPage';
import ComparisonPage from './pages/ComparisonPage';
import WeaknessDnaPage from './pages/WeaknessDnaPage';
import GrowthPage from './pages/GrowthPage';
import MissionsPage from './pages/MissionsPage';
import MindSpacePage from './pages/MindSpacePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import MaskOffAssistant from './components/chatbot/MaskOffAssistant';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected App Routes inside MainLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/weakness-dna" element={<WeaknessDnaPage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/mindspace" element={<MindSpacePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MaskOffAssistant />
    </>
  );
}
