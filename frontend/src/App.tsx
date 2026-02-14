import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext, saveAuth, loadAuth, clearAuth } from './lib/auth';
import type { User, AuthTokens, AuthContextType } from './lib/auth';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentViewer from './pages/DocumentViewer';
import SearchPage from './pages/SearchPage';
import ClauseLibrary from './pages/ClauseLibrary';
import Chat from './pages/Chat';
import ResearchPage from './pages/ResearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SystemPage from './pages/SystemPage';
import AIInsights from './pages/AIInsights';
import SettingsPage, { SettingsRedirect } from './pages/settings/SettingsPage';
import OrganizationTab from './pages/settings/OrganizationTab';
import LLMProvidersTab from './pages/settings/LLMProvidersTab';
import ProfileTab from './pages/settings/ProfileTab';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  useEffect(() => {
    const saved = loadAuth();
    if (saved.user && saved.tokens) {
      setUser(saved.user);
      setTokens(saved.tokens);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    setTokens(data.tokens);
    saveAuth(data.user, data.tokens);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, orgName: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, organization_name: orgName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Registration failed');
    }
    const data = await res.json();
    setUser(data.user);
    setTokens(data.tokens);
    saveAuth(data.user, data.tokens);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    clearAuth();
  }, []);

  const authValue: AuthContextType = {
    user,
    tokens,
    login,
    register,
    logout,
    isAuthenticated: !!tokens?.access_token,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/documents/:id" element={<DocumentViewer />} />
                <Route path="/documents/:id/ai" element={<AIInsights />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/clauses" element={<ClauseLibrary />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/research" element={<ResearchPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/system" element={<SystemPage />} />
                <Route path="/settings" element={<SettingsPage />}>
                  <Route index element={<SettingsRedirect />} />
                  <Route path="organization" element={<OrganizationTab />} />
                  <Route path="llm" element={<LLMProvidersTab />} />
                  <Route path="profile" element={<ProfileTab />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </AuthContext.Provider>
  );
}
