import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavSection } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { SimulationPage } from './pages/SimulationPage';
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
import { CompanyWizardModal } from './components/CompanyWizardModal';
import { UserProfile, Company } from './types';
import { api, getAuthToken, clearAuthToken } from './services/api';
import { wsClient } from './services/ws';
import { Link2, Copy, Check, ExternalLink } from 'lucide-react';

const SECTION_PATHS: Record<NavSection, string> = {
  dashboard: '/dashboard',
  live_monitor: '/monitor',
  simulation: '/simulation',
  organization: '/organization',
  operations: '/operations',
  devices: '/devices',
  ai_models: '/ai-models',
  policies: '/policies',
  commands: '/commands',
  faults: '/faults',
  events: '/events',
  reports: '/reports',
  acceptance: '/acceptance',
  companies: '/companies',
  users_roles: '/users-roles',
  system_health: '/system-health',
  runs: '/events',
};

const PATH_TO_SECTION: Record<string, NavSection> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/monitor': 'live_monitor',
  '/live_monitor': 'live_monitor',
  '/simulation': 'simulation',
  '/organization': 'organization',
  '/operations': 'operations',
  '/devices': 'devices',
  '/ai-models': 'ai_models',
  '/ai_models': 'ai_models',
  '/policies': 'policies',
  '/commands': 'commands',
  '/faults': 'faults',
  '/events': 'events',
  '/reports': 'reports',
  '/acceptance': 'acceptance',
  '/companies': 'companies',
  '/users-roles': 'users_roles',
  '/users_roles': 'users_roles',
  '/system-health': 'system_health',
  '/system_health': 'system_health',
};

const SECTION_API_ENDPOINTS: Record<NavSection, string> = {
  dashboard: '/api/v1/companies/platform/stats',
  live_monitor: '/api/v1/telemetry/live/{asset_id}',
  simulation: '/api/v1/gateways/telemetry',
  organization: '/api/v1/organizations/tree',
  operations: '/api/v1/assets',
  devices: '/api/v1/devices',
  ai_models: '/api/v1/models',
  policies: '/api/v1/policies',
  commands: '/api/v1/commands',
  faults: '/api/v1/faults',
  events: '/api/v1/events',
  reports: '/api/v1/reports/operational',
  acceptance: '/api/v1/acceptance/run',
  companies: '/api/v1/companies',
  users_roles: '/api/v1/users',
  system_health: '/api/v1/system-health',
  runs: '/api/v1/runs',
};

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Initialize section based on browser URL pathname
  const initialPath = window.location.pathname.replace(/\/$/, '') || '/';
  const initialSection = PATH_TO_SECTION[initialPath] || 'dashboard';
  const [currentSection, setCurrentSection] = useState<NavSection>(initialSection);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [companyWizardOpen, setCompanyWizardOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedApi, setCopiedApi] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      const sec = PATH_TO_SECTION[path] || 'dashboard';
      setCurrentSection(sec);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('popstate', handlePopState);
    };
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

  const handleNavigate = (sec: NavSection) => {
    setCurrentSection(sec);
    const targetPath = SECTION_PATHS[sec] || `/${sec}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

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

  const currentApiEndpoint = SECTION_API_ENDPOINTS[currentSection] || '/api/v1';
  const fullBackendApiUrl = `${window.location.protocol}//${window.location.hostname}:8000${currentApiEndpoint}`;

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText(fullBackendApiUrl);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  };

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
          onSelectSection={handleNavigate}
          user={user}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Real-Time API URL & Page Route Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                Active Page URL:
              </span>
              <span className="font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                {window.location.origin}{SECTION_PATHS[currentSection]}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Backend REST API:</span>
                <span className="font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                  {fullBackendApiUrl}
                </span>
              </div>

              <button
                onClick={handleCopyApiUrl}
                className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-300 cursor-pointer transition-colors"
                title="Copy API URL to paste into external tools or scripts"
              >
                {copiedApi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedApi ? 'Copied API URL!' : 'Copy API URL'}</span>
              </button>

              <a
                href={`${window.location.protocol}//${window.location.hostname}:8000/api/docs`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <span>Swagger Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
            {currentSection === 'dashboard' && (
              <DashboardPage
                user={user}
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onOpenCompanyWizard={() => setCompanyWizardOpen(true)}
                onNavigateToLive={() => handleNavigate('live_monitor')}
              />
            )}

            {currentSection === 'live_monitor' && <LiveMonitorPage />}

            {currentSection === 'simulation' && <SimulationPage />}

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
                  handleNavigate('dashboard');
                }}
              />
            )}

            {currentSection === 'users_roles' && (
              <UsersRolesPage selectedCompanyId={selectedCompanyId} />
            )}

            {currentSection === 'system_health' && <SystemHealthPage />}
          </main>
        </div>
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
