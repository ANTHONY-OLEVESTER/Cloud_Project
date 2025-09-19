import { useState, useEffect } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { CloudConnections } from './components/connections/CloudConnections';
import { ServiceDetailsPage } from './components/services/ServiceDetailsPage';
import { PoliciesPage } from './components/policies/PoliciesPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { Toaster } from './components/ui/sonner';
import { api } from './utils/api/client';

type Page = 'login' | 'signup' | 'dashboard' | 'connections' | 'policies' | 'reports' | 'settings' | 'service-details';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const handleNavigateToService = (providerId: string) => {
    setSelectedProviderId(providerId);
    setCurrentPage('service-details');
  };

  useEffect(() => {
    // Check if user is already authenticated
    if (api.isAuthenticated()) {
      // Try to get user profile to validate token
      api.getProfile()
        .then((profileData) => {
          setUser(profileData);
          setCurrentPage('dashboard');
        })
        .catch(() => {
          // Token is invalid, clear it
          api.logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.login(credentials);
      setUser(response.user);
      setCurrentPage('dashboard');
    } catch (error) {
      throw error; // Let the LoginPage handle the error
    }
  };

  const handleSignup = async (userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    company: string 
  }) => {
    try {
      const response = await api.signup(userData);
      setUser(response.user);
      setCurrentPage('dashboard');
    } catch (error) {
      throw error; // Let the SignupPage handle the error
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentPage('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {currentPage === 'login' ? (
          <LoginPage 
            onSwitchToSignup={() => setCurrentPage('signup')} 
            onLogin={handleLogin}
          />
        ) : (
          <SignupPage 
            onSwitchToLogin={() => setCurrentPage('login')} 
            onSignup={handleSignup}
          />
        )}
        <Toaster />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'connections':
        return <CloudConnections onViewServices={handleNavigateToService} />;
      case 'service-details':
        return <ServiceDetailsPage 
          providerId={selectedProviderId} 
          onBack={() => setCurrentPage('connections')}
        />;
      case 'policies':
        return <PoliciesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
      user={user}
    >
      {renderPage()}
      <Toaster />
    </DashboardLayout>
  );
}