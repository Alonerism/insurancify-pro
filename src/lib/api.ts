import { Building, Agent, Policy } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!response.ok) {
      console.error('API error', { url, status: response.status, statusText: response.statusText });
      throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API fetch failed', { url, error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// API Functions
export const api = {
  // Health check
  health: {
    check: (): Promise<any> => fetchApi('/v1/health'),
  },

  // Policies (main V1 endpoint)
  policies: {
    list: (buildingId?: string, agentId?: string): Promise<Policy[]> => {
      const params = new URLSearchParams();
      if (buildingId) params.append('building_id', buildingId);
      if (agentId) params.append('agent_id', agentId);
      return fetchApi<any>(`/v1/policies${params.toString() ? `?${params}` : ''}`)
        .then(r => {
          const raw = Array.isArray(r?.data) ? r.data : [];
          // Map backend policy file objects -> UI Policy shape
            // Backend fields available: id, file_name, carrier, policy_number, effective_date, expiration_date, status, confidence_score
          const mapped: Policy[] = raw.map((p: any) => ({
            id: p.id,
            buildingId: p.property_id || 'bld-unknown', // backend currently lacks building reference
            agentId: 'agent-unknown', // placeholder until backend supplies
            coverageType: (p.coverage_type || 'general-liability') as any,
            policyNumber: p.policy_number || p.file_name || 'UNKNOWN-POLICY',
            carrier: p.carrier || 'Unknown Carrier',
            effectiveDate: p.effective_date || new Date().toISOString(),
            expirationDate: p.expiration_date || new Date(Date.now() + 31536000000).toISOString(),
            limits: {},
            deductibles: {},
            premiumAnnual: typeof p.premium_annual === 'number' ? p.premium_annual : 0,
            status: (p.status || 'active'),
            documents: [p.file_name].filter(Boolean),
          }));
          return mapped;
        });
    },
    get: (id: string): Promise<any> => fetchApi(`/v1/policies/${id}`),
    delete: (id: string): Promise<any> => fetchApi(`/v1/policies/${id}`, { method: 'DELETE' }),
    upload: (file: File): Promise<any> => {
      const formData = new FormData();
      formData.append('file', file);
      return fetchApi('/v1/policies/upload', { method: 'POST', body: formData, headers: {} });
    },
    // Stubs for UI expectations
    create: (_policy: Omit<Policy, 'id' | 'status' | 'documents'>): Promise<{ success: boolean; policy_id: string; message: string }> =>
      Promise.resolve({ success: true, policy_id: 'mock-policy', message: 'Create policy not implemented in V1 backend' }),
    history: (_policyId: string): Promise<any[]> => Promise.resolve([]),
    addNote: (_policyId: string, _note: string, _fileId?: string): Promise<{ success: boolean; message: string }> =>
      Promise.resolve({ success: true, message: 'Notes feature coming soon' }),
  },

  // Search (V1 endpoint)
  search: {
    query: (q: string, limit = 50): Promise<any> => 
      fetchApi(`/v1/search?q=${encodeURIComponent(q)}&limit=${limit}`),
      
    suggestions: (query: string, limit = 10): Promise<string[]> =>
      Promise.resolve([]), // Not implemented yet
  },

  // Alerts (V1 endpoint)
  alerts: {
    list: (limit = 50, unreadOnly = false): Promise<any> => 
      fetchApi(`/v1/alerts?limit=${limit}&unread_only=${unreadOnly}`),
  },

  // Claims (V1 endpoint)
  claims: {
    list: (): Promise<any> => fetchApi('/v1/claims'),
  },

  // Buildings - mock data for now since V1 API doesn't have building/agent endpoints
  buildings: {
    list: (agentId?: string): Promise<Building[]> => 
      Promise.resolve([
        {
          id: 'bld-1',
          name: 'Sunset Plaza',
          address: '123 Main St, Los Angeles, CA 90210',
          primaryAgentId: 'agent-1',
          notes: '24-unit apartment complex',
          policies: [],
        },
        {
          id: 'bld-2', 
          name: 'Ocean View Towers',
          address: '456 Pacific Ave, Santa Monica, CA 90401',
          primaryAgentId: 'agent-2',
          notes: 'High-rise residential building',
          policies: [],
        },
        {
          id: 'bld-3',
          name: 'Downtown Lofts', 
          address: '789 Spring St, Los Angeles, CA 90014',
          primaryAgentId: 'agent-2',
          notes: 'Historic converted warehouse',
          policies: [],
        },
        {
          id: 'bld-4',
          name: 'Beverly Gardens',
          address: '321 Rodeo Dr, Beverly Hills, CA 90210', 
          primaryAgentId: 'agent-4',
          notes: 'Luxury apartment complex',
          policies: [],
        }
      ].filter(building => !agentId || building.primaryAgentId === agentId)),
    
    create: (building: Omit<Building, 'id'>): Promise<{ success: boolean; building_id: string; message: string }> =>
      Promise.resolve({ success: true, building_id: 'mock-building', message: 'Buildings endpoint not yet implemented' }),
  },

  // Agents - mock data for now since V1 API doesn't have building/agent endpoints  
  agents: {
    list: (): Promise<Agent[]> =>
      Promise.resolve([
        {
          id: 'agent-1',
          name: 'Sarah Johnson',
          company: 'Premier Insurance Partners',
          email: 'sarah@premierinsurance.com',
          phone: '(555) 123-4567',
        },
        {
          id: 'agent-2',
          name: 'Mike Chen', 
          company: 'West Coast Insurance Group',
          email: 'mike@westcoastins.com',
          phone: '(555) 234-5678',
        },
        {
          id: 'agent-3',
          name: 'Lisa Rodriguez',
          company: 'California Property Shield', 
          email: 'lisa@capropshield.com',
          phone: '(555) 345-6789',
        },
        {
          id: 'agent-4',
          name: 'David Park',
          company: 'Metro Insurance Solutions',
          email: 'david@metroins.com', 
          phone: '(555) 456-7890',
        }
      ]),
    
    create: (agent: Omit<Agent, 'id'>): Promise<{ success: boolean; agent_id: string; message: string }> =>
      Promise.resolve({ success: true, agent_id: 'mock-agent', message: 'Agents endpoint not yet implemented' }),
  },

  // System stats - derived from available endpoints
  system: {
    stats: (): Promise<{ success: boolean; stats: any }> =>
      fetchApi('/v1/health').then((healthData: any) => ({ success: true, stats: healthData.data || {} })),
    // Provide alerts under system to satisfy existing hooks referencing api.system.alerts
    alerts: (limit = 50, unreadOnly = false): Promise<any> =>
      fetchApi(`/v1/alerts?limit=${limit}&unread_only=${unreadOnly}`).then((r: any) => r.data || r || []),
  },

  // Files
  files: {
    upload: (formData: FormData): Promise<{ success: boolean; file_id?: string; policy_id?: string; message: string; parsing_results?: any }> =>
      fetchApi('/v1/policies/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set Content-Type for FormData
      }),
  },
};

export { ApiError };