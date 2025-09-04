import { Building, Agent, Policy } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
      throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// API Functions
export const api = {
  // Buildings
  buildings: {
    list: (agentId?: string): Promise<Building[]> => 
      fetchApi(`/buildings${agentId ? `?agent_id=${agentId}` : ''}`),
    
    create: (building: Omit<Building, 'id'>): Promise<{ success: boolean; building_id: string; message: string }> =>
      fetchApi('/buildings', {
        method: 'POST',
        body: JSON.stringify(building),
      }),
  },

  // Agents  
  agents: {
    list: (): Promise<Agent[]> => fetchApi('/agents'),
    
    create: (agent: Omit<Agent, 'id'>): Promise<{ success: boolean; agent_id: string; message: string }> =>
      fetchApi('/agents', {
        method: 'POST', 
        body: JSON.stringify(agent),
      }),
  },

  // Policies
  policies: {
    list: (buildingId?: string, agentId?: string): Promise<Policy[]> => {
      const params = new URLSearchParams();
      if (buildingId) params.append('building_id', buildingId);
      if (agentId) params.append('agent_id', agentId);
      return fetchApi(`/policies${params.toString() ? `?${params}` : ''}`);
    },
    
    create: (policy: Omit<Policy, 'id' | 'status' | 'documents'>): Promise<{ success: boolean; policy_id: string; message: string }> =>
      fetchApi('/policies', {
        method: 'POST',
        body: JSON.stringify(policy),
      }),
      
    history: (policyId: string): Promise<any[]> =>
      fetchApi(`/policies/${policyId}/history`),
      
    addNote: (policyId: string, note: string, fileId?: string): Promise<{ success: boolean; message: string }> =>
      fetchApi(`/policies/${policyId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note, file_id: fileId }),
      }),
  },

  // Search
  search: {
    policies: (query: string, limit = 50): Promise<any[]> =>
      fetchApi(`/search?q=${encodeURIComponent(query)}&limit=${limit}`),
      
    suggestions: (query: string, limit = 10): Promise<string[]> =>
      fetchApi(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`),
  },

  // Files
  files: {
    upload: (formData: FormData): Promise<{ success: boolean; file_id?: string; policy_id?: string; message: string; parsing_results?: any }> =>
      fetchApi('/files/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set Content-Type for FormData
      }),
  },

  // System
  system: {
    stats: (): Promise<{ success: boolean; stats: any }> =>
      fetchApi('/system/stats'),
      
    alerts: (limit = 50, unreadOnly = false): Promise<any[]> =>
      fetchApi(`/alerts?limit=${limit}&unread_only=${unreadOnly}`),
  },
};

export { ApiError };