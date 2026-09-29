import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavSection } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { OperationsPage } from './pages/OperationsPage';
import { DevicesPage } from './pages/DevicesPage';
import { AiModelsPage } from './pages/AiModelsPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { CommandsPage } from './pages/CommandsPage';
import { FaultsPage } from './pages/FaultsPage';
import { EventsPage } from './pages/EventsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { UsersRolesPage } from './pages/UsersRolesPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { AboutPage } from './pages/AboutPage';
import { CompanyWizardModal } from './components/CompanyWizardModal';
import { UserProfile, Company } from './types';
import { api, getAuthToken, clearAuthToken } from './services/api';
import { wsClient } from './services/ws';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [companyWizardOpen, setCompanyWizardOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadCompanies();
      wsClient.connect();
      const unsubStatus = wsClient.onStatusChange((status) => {
        setWsConnected(status);
      });
      return () => {
        unsubStatus();
        wsClient.disconnect();
      };
    }
  }, [isAuthenticated, selectedCompanyId]);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }
    try {
      const profile = await api.getMe();
      setUser(profile);
      setIsAuthenticated(true);
      if (profile.company_id && !profile.is_super_admin) {
        setSelectedCompanyId(profile.company_id);
      }
    } catch (e) {
      clearAuthToken();
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const cList = await api.getCompanies();
      setCompanies(cList);
      if (!selectedCompanyId && cList.length > 0 && !user?.is_super_admin) {
        setSelectedCompanyId(cList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-gray-500 font-mono">
        Initializing Aperture AIoT Control Center...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={checkAuth} />;
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const breadcrumbs = [
    selectedCompany ? selectedCompany.name : 'Platform Overview',
    currentSection.replace('_', ' ').toUpperCase(),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-gray-900 font-sans antialiased">
      {/* Top Header */}
      <Header
        user={user}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={(id) => setSelectedCompanyId(id)}
        breadcrumbs={breadcrumbs}
        wsConnected={wsConnected}
        onLogout={handleLogout}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode(!demoMode)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          user={user}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {currentSection === 'dashboard' && (
            <DashboardPage
              user={user}
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onOpenCompanyWizard={() => setCompanyWizardOpen(true)}
              onNavigateToLive={() => setCurrentSection('live_monitor')}
            />
          )}

          {currentSection === 'live_monitor' && <LiveMonitorPage />}

          {currentSection === 'organization' && (
            <OrganizationPage
              selectedCompanyId={selectedCompanyId}
              companies={companies}
            />
          )}

          {currentSection === 'operations' && (
            <OperationsPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'devices' && (
            <DevicesPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'ai_models' && (
            <AiModelsPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'policies' && (
            <PoliciesPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'commands' && (
            <CommandsPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'faults' && (
            <FaultsPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'events' && (
            <EventsPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'reports' && (
            <ReportsPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'acceptance' && (
            <ReportsPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'companies' && (
            <CompaniesPage
              companies={companies}
              onOpenWizard={() => setCompanyWizardOpen(true)}
              onSelectCompany={(id) => {
                setSelectedCompanyId(id);
                setCurrentSection('dashboard');
              }}
            />
          )}

          {currentSection === 'users_roles' && (
            <UsersRolesPage selectedCompanyId={selectedCompanyId} />
          )}

          {currentSection === 'system_health' && <SystemHealthPage />}
          {currentSection === 'about' && <AboutPage />}
        </main>
      </div>

      {/* Global Modals */}
      <CompanyWizardModal
        isOpen={companyWizardOpen}
        onClose={() => setCompanyWizardOpen(false)}
        onSuccess={loadCompanies}
      />
    </div>
  );
};

export default App;
