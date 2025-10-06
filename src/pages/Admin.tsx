import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AdminLogin from '@/components/AdminLogin';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/components/AdminDashboard';
import { ImplementationRequestsManagement } from '@/components/ImplementationRequestsManagement';
import EnhancedSourcesManagement from '@/components/EnhancedSourcesManagement';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lang] = useState<'de' | 'en'>('de'); // Default to German
  const location = useLocation();
  const navigate = useNavigate();

  // derive currentView from path
  const path = location.pathname.replace(/\/$/, '');
  const currentView = (path.endsWith('/sources') || path.endsWith('/enhanced-sources'))
    ? 'sources'
    : path.endsWith('/implementation-requests')
    ? 'implementation-requests'
    : path.endsWith('/users')
    ? 'users'
    : path.endsWith('/settings')
    ? 'settings'
    : 'dashboard';

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const authenticated = sessionStorage.getItem('admin_authenticated');
      const loginTime = sessionStorage.getItem('admin_login_time');
      
      if (authenticated === 'true' && loginTime) {
        // Check if login is not older than 24 hours
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const hoursSinceLogin = (now - loginTimestamp) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 24) {
          setIsAuthenticated(true);
        } else {
          // Session expired
          sessionStorage.removeItem('admin_authenticated');
          sessionStorage.removeItem('admin_login_time');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleViewChange = (view: string) => {
    switch (view) {
      case 'sources':
        navigate('/admin/sources');
        break;
      case 'implementation-requests':
        navigate('/admin/implementation-requests');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'settings':
        navigate('/admin/settings');
        break;
      default:
        navigate('/admin');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} lang={lang} />;
  }

  return (
    <ErrorBoundary>
    <AdminLayout 
      lang={lang} 
      onLogout={handleLogout}
      currentView={currentView}
      onViewChange={handleViewChange}
    >
      <Routes>
        <Route index element={<AdminDashboard lang={lang} />} />
        <Route path="sources" element={<EnhancedSourcesManagement lang={lang} />} />
        <Route path="implementation-requests" element={<ImplementationRequestsManagement />} />
        <Route path="users" element={
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {lang === 'de' ? 'Benutzerverwaltung' : 'User Management'}
            </h2>
            <p className="text-gray-600">
              {lang === 'de' ? 'Diese Funktion ist noch nicht implementiert.' : 'This feature is not yet implemented.'}
            </p>
          </div>
        } />
        <Route path="settings" element={
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {lang === 'de' ? 'System-Einstellungen' : 'System Settings'}
            </h2>
            <p className="text-gray-600">
              {lang === 'de' ? 'Diese Funktion ist noch nicht implementiert.' : 'This feature is not yet implemented.'}
            </p>
          </div>
        } />
      </Routes>
    </AdminLayout>
    </ErrorBoundary>
  );
}
