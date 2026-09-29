const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('aperture_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('aperture_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('aperture_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Companies
  getCompanies: () => request<any[]>('/companies'),
  getCompany: (id: string) => request<any>(`/companies/${id}`),
  createCompany: (data: any) => request<any>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id: string, data: any) => request<any>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCompanyStats: (id: string) => request<any>(`/companies/${id}/stats`),
  getPlatformStats: () => request<any>('/companies/platform/stats'),

  // Organizations
  getOrgTree: (companyId?: string) => request<any[]>(`/organizations/tree${companyId ? `?company_id=${companyId}` : ''}`),
  createOrgNode: (data: any) => request<any>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrgNode: (id: string) => request<any>(`/organizations/${id}`, { method: 'DELETE' }),

  // Users & Roles
  getUsers: (companyId?: string) => request<any[]>(`/users${companyId ? `?company_id=${companyId}` : ''}`),
  createUser: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  getRoles: () => request<any[]>('/roles'),

  // Operations
  getSites: (companyId?: string) => request<any[]>(`/sites${companyId ? `?company_id=${companyId}` : ''}`),
  createSite: (data: any) => request<any>('/sites', { method: 'POST', body: JSON.stringify(data) }),
  getProjects: (companyId?: string) => request<any[]>(`/projects${companyId ? `?company_id=${companyId}` : ''}`),
  createProject: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getStations: (companyId?: string) => request<any[]>(`/stations${companyId ? `?company_id=${companyId}` : ''}`),
  createStation: (data: any) => request<any>('/stations', { method: 'POST', body: JSON.stringify(data) }),
  getAssets: (companyId?: string) => request<any[]>(`/assets${companyId ? `?company_id=${companyId}` : ''}`),
  createAsset: (data: any) => request<any>('/assets', { method: 'POST', body: JSON.stringify(data) }),

  // Devices & Commissioning
  getDevices: (companyId?: string) => request<any[]>(`/devices${companyId ? `?company_id=${companyId}` : ''}`),
  discoverDevices: () => request<any[]>('/devices/discover'),
  commissionDevice: (data: any) => request<any>('/devices/commission', { method: 'POST', body: JSON.stringify(data) }),
  connectDevice: (deviceId: string) => request<any>(`/devices/${deviceId}/connect`, { method: 'POST' }),
  disconnectDevice: (deviceId: string) => request<any>(`/devices/${deviceId}/disconnect`, { method: 'POST' }),

  // Telemetry & Monitoring
  getLiveState: (assetId: string) => request<any>(`/telemetry/live/${assetId}`),
  getLatestTelemetry: (assetId: string) => request<any>(`/telemetry/latest/${assetId}`),
  simulateCondition: (condition: string) => request<any>(`/telemetry/simulate-condition?condition=${condition}`, { method: 'POST' }),
  getRuns: (companyId?: string) => request<any[]>(`/runs${companyId ? `?company_id=${companyId}` : ''}`),

  // AI & Models
  getModels: (companyId?: string) => request<any[]>(`/models${companyId ? `?company_id=${companyId}` : ''}`),
  deployModel: (versionId: string) => request<any>(`/models/${versionId}/deploy`, { method: 'POST' }),
  rollbackModel: () => request<any>('/models/rollback', { method: 'POST' }),

  // Policies
  getPolicies: (companyId?: string) => request<any[]>(`/policies${companyId ? `?company_id=${companyId}` : ''}`),
  createPolicy: (data: any) => request<any>('/policies', { method: 'POST', body: JSON.stringify(data) }),

  // Commands & Control
  getCommands: (companyId?: string) => request<any[]>(`/commands${companyId ? `?company_id=${companyId}` : ''}`),
  setSpeed: (data: { asset_id: string; target_rpm: number; reason?: string }) => request<any>('/commands/set-speed', { method: 'POST', body: JSON.stringify(data) }),
  stopMotor: (data: { asset_id: string; reason?: string }) => request<any>('/commands/stop', { method: 'POST', body: JSON.stringify(data) }),

  // Faults & Reset
  getFaults: (companyId?: string) => request<any[]>(`/faults${companyId ? `?company_id=${companyId}` : ''}`),
  acknowledgeFault: (id: string, notes?: string) => request<any>(`/faults/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ notes }) }),
  operatorResetFault: (data: { fault_id: string; reset_reason: string }) => request<any>('/faults/reset', { method: 'POST', body: JSON.stringify(data) }),

  // Events & Audit
  getEvents: (companyId?: string) => request<any[]>(`/events${companyId ? `?company_id=${companyId}` : ''}`),
  getAuditLogs: (companyId?: string) => request<any[]>(`/audit-logs${companyId ? `?company_id=${companyId}` : ''}`),

  // Reports & Health
  getOperationalReport: (companyId?: string) => request<any>(`/reports/operational${companyId ? `?company_id=${companyId}` : ''}`),
  getAiReport: (companyId?: string) => request<any>(`/reports/ai${companyId ? `?company_id=${companyId}` : ''}`),
  getAcceptanceReport: (companyId?: string) => request<any>(`/reports/acceptance${companyId ? `?company_id=${companyId}` : ''}`),
  runAcceptanceSuite: () => request<any>('/acceptance/run', { method: 'POST' }),
  getSystemHealth: () => request<any>('/system-health'),
};
