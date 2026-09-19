import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './router/Router';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardApp from './pages/DashboardApp';

function MainRouteDispatcher() {
  const { currentPath, navigate } = useRouter();
  const { isAuthenticated } = useAuth();

  // Normalize path
  const normalizedPath = (currentPath || '/').toLowerCase().replace(/\/+$/, '') || '/';

  // Hard Authentication Gate: /dashboard and /disruption-engine are strictly protected
  const isDashboardRoute = normalizedPath === '/dashboard' || normalizedPath === '/disruption-engine';

  useEffect(() => {
    if (isDashboardRoute && !isAuthenticated) {
      navigate('/login');
    }
  }, [isDashboardRoute, isAuthenticated, navigate]);

  if (isDashboardRoute) {
    if (!isAuthenticated) {
      return <LoginPage />;
    }
    return <DashboardApp initialNav={normalizedPath === '/disruption-engine' ? 'disruption-engine' : 'dashboard'} />;
  }

  if (normalizedPath === '/login') {
    return <LoginPage />;
  }

  // Root index '/' and fallback defaults to LandingPage
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <MainRouteDispatcher />
      </RouterProvider>
    </AuthProvider>
  );
}