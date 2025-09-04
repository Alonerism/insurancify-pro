import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building, Agent, Policy } from '@/types';
import { toast } from '@/hooks/use-toast';

// Query Keys
export const queryKeys = {
  buildings: (agentId?: string) => ['buildings', agentId].filter(Boolean),
  agents: () => ['agents'],
  policies: (buildingId?: string, agentId?: string) => ['policies', buildingId, agentId].filter(Boolean),
  policyHistory: (policyId: string) => ['policy-history', policyId],
  search: (query: string) => ['search', query],
  systemStats: () => ['system-stats'],
  alerts: (limit: number, unreadOnly: boolean) => ['alerts', limit, unreadOnly],
};

// Buildings
export function useBuildings(agentId?: string) {
  return useQuery({
    queryKey: queryKeys.buildings(agentId),
    queryFn: () => api.buildings.list(agentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.buildings.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create building',
        variant: 'destructive',
      });
    },
  });
}

// Agents
export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents(),
    queryFn: api.agents.list,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.agents.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error', 
        description: error.message || 'Failed to create agent',
        variant: 'destructive',
      });
    },
  });
}

// Policies
export function usePolicies(buildingId?: string, agentId?: string) {
  return useQuery({
    queryKey: queryKeys.policies(buildingId, agentId),
    queryFn: () => api.policies.list(buildingId, agentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.policies.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create policy',
        variant: 'destructive',
      });
    },
  });
}

export function usePolicyHistory(policyId: string) {
  return useQuery({
    queryKey: queryKeys.policyHistory(policyId),
    queryFn: () => api.policies.history(policyId),
    enabled: !!policyId,
    staleTime: 5 * 60 * 1000,
  });
}

// Search
export function useSearchPolicies(query: string) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.search.policies(query),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// System
export function useSystemStats() {
  return useQuery({
    queryKey: queryKeys.systemStats(),
    queryFn: api.system.stats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAlerts(limit = 50, unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.alerts(limit, unreadOnly),
    queryFn: () => api.system.alerts(limit, unreadOnly),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Claims (using alerts as proxy since no dedicated claims endpoint found)
export function useClaims(policyId?: string) {
  return useQuery({
    queryKey: ['claims', policyId].filter(Boolean),
    queryFn: () => api.system.alerts(50, false), // Using alerts as proxy for now
    staleTime: 5 * 60 * 1000,
  });
}

// Policy Notes
export function useAddPolicyNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ policyId, note, fileId }: { policyId: string; note: string; fileId?: string }) =>
      api.policies.addNote(policyId, note, fileId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['policy-history', variables.policyId] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add note',
        variant: 'destructive',
      });
    },
  });
}

// File Upload
export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.files.upload,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      if (data.policy_id) {
        queryClient.invalidateQueries({ queryKey: ['policy-history', data.policy_id] });
      }
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });
}