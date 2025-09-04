import { Building, Agent, Policy, CoverageType } from '@/types';

export const mockBuildings: Building[] = [
  {
    id: 'bld-1',
    name: 'Sunset Plaza',
    address: '123 Main St, Los Angeles, CA 90210',
    notes: '24-unit apartment complex',
    primaryAgentId: 'agent-1'
  },
  {
    id: 'bld-2', 
    name: 'Ocean View Towers',
    address: '456 Pacific Ave, Santa Monica, CA 90401',
    notes: 'High-rise residential building',
    primaryAgentId: 'agent-2'
  },
  {
    id: 'bld-3',
    name: 'Downtown Lofts',
    address: '789 Spring St, Los Angeles, CA 90014',
    notes: 'Historic converted warehouse',
    primaryAgentId: 'agent-2'
  },
  {
    id: 'bld-4',
    name: 'Beverly Gardens',
    address: '321 Rodeo Dr, Beverly Hills, CA 90210',
    notes: 'Luxury apartment complex',
    primaryAgentId: 'agent-4'
  }
];

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Sarah Johnson',
    company: 'Premier Insurance Partners',
    email: 'sarah@premierinsurance.com',
    phone: '(555) 123-4567'
  },
  {
    id: 'agent-2',
    name: 'Mike Chen',
    company: 'West Coast Insurance Group',
    email: 'mike@westcoastins.com', 
    phone: '(555) 234-5678'
  },
  {
    id: 'agent-3',
    name: 'Lisa Rodriguez',
    company: 'California Property Shield',
    email: 'lisa@capropshield.com',
    phone: '(555) 345-6789'
  },
  {
    id: 'agent-4',
    name: 'David Park',
    company: 'Metro Insurance Solutions',
    email: 'david@metroins.com',
    phone: '(555) 456-7890'
  }
];

// Helper to determine policy status based on expiration date
const getPolicyStatus = (expirationDate: string) => {
  const expDate = new Date(expirationDate);
  const today = new Date();
  const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 30) return 'expiring-soon';
  return 'active';
};

export const mockPolicies: Policy[] = [
  {
    id: 'pol-1',
    buildingId: 'bld-1',
    agentId: 'agent-1', 
    coverageType: 'general-liability',
    policyNumber: 'GL-2024-001',
    carrier: 'State Farm',
    effectiveDate: '2024-01-01',
    expirationDate: '2024-12-31',
    limits: { aggregate: 2000000, occurrence: 1000000 },
    deductibles: { general: 5000 },
    premiumAnnual: 12500,
    status: getPolicyStatus('2024-12-31'),
    documents: []
  },
  {
    id: 'pol-2',
    buildingId: 'bld-1',
    agentId: 'agent-1',
    coverageType: 'property',
    policyNumber: 'PROP-2024-001', 
    carrier: 'Allstate',
    effectiveDate: '2024-03-01',
    expirationDate: '2025-03-01',
    limits: { building: 5000000, contents: 500000 },
    deductibles: { windstorm: 25000, other: 10000 },
    premiumAnnual: 45000,
    status: getPolicyStatus('2025-03-01'),
    documents: []
  },
  {
    id: 'pol-3',
    buildingId: 'bld-2',
    agentId: 'agent-2',
    coverageType: 'general-liability', 
    policyNumber: 'GL-2024-002',
    carrier: 'Travelers',
    effectiveDate: '2024-06-01',
    expirationDate: '2025-06-01',
    limits: { aggregate: 3000000, occurrence: 1500000 },
    deductibles: { general: 10000 },
    premiumAnnual: 18500,
    status: getPolicyStatus('2025-06-01'),
    documents: []
  },
  {
    id: 'pol-4',
    buildingId: 'bld-2',
    agentId: 'agent-3',
    coverageType: 'umbrella',
    policyNumber: 'UMB-2024-001',
    carrier: 'Liberty Mutual', 
    effectiveDate: '2024-04-01',
    expirationDate: '2025-04-01',
    limits: { umbrella: 10000000 },
    deductibles: {},
    premiumAnnual: 8200,
    status: getPolicyStatus('2025-04-01'),
    documents: []
  },
  {
    id: 'pol-5',
    buildingId: 'bld-3',
    agentId: 'agent-2',
    coverageType: 'property',
    policyNumber: 'PROP-2024-002',
    carrier: 'Farmers',
    effectiveDate: '2024-02-15',
    expirationDate: '2024-12-15', // Expiring soon
    limits: { building: 3500000, contents: 350000 },
    deductibles: { windstorm: 15000, other: 7500 },
    premiumAnnual: 32000,
    status: getPolicyStatus('2024-12-15'),
    documents: []
  },
  {
    id: 'pol-6',
    buildingId: 'bld-4',
    agentId: 'agent-4',
    coverageType: 'general-liability',
    policyNumber: 'GL-2024-003', 
    carrier: 'CSAA',
    effectiveDate: '2024-08-01',
    expirationDate: '2025-08-01',
    limits: { aggregate: 2500000, occurrence: 1250000 },
    deductibles: { general: 7500 },
    premiumAnnual: 15200,
    status: getPolicyStatus('2025-08-01'),
    documents: []
  }
];

export const coverageTypeLabels: Record<CoverageType, string> = {
  'general-liability': 'General Liability',
  'property': 'Property',
  'umbrella': 'Umbrella',
  'flood': 'Flood',
  'earthquake': 'Earthquake',
  'workers-comp': "Worker's Comp"
};

export const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-300',
  'expiring-soon': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  expired: 'bg-red-100 text-red-800 border-red-300', 
  missing: 'bg-gray-100 text-gray-800 border-gray-300'
};