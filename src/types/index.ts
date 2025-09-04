// Core data types for Insurance Master v2
export interface Building {
  id: string;
  name: string;
  address: string;
  notes?: string;
  primaryAgentId?: string; // Primary agent assignment
}

export interface Agent {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

export interface Policy {
  id: string;
  buildingId: string;
  agentId: string;
  coverageType: CoverageType;
  policyNumber: string;
  carrier: string;
  effectiveDate: string;
  expirationDate: string;
  limits: Record<string, number>;
  deductibles: Record<string, number>;
  premiumAnnual: number;
  status: PolicyStatus;
  documents: string[];
}

export type CoverageType = 
  | 'general-liability'
  | 'property'
  | 'umbrella'
  | 'flood'
  | 'earthquake'
  | 'workers-comp';

export type PolicyStatus = 'active' | 'expiring-soon' | 'expired' | 'missing';

export interface PolicyComparison {
  policyA: Policy | ProspectivePolicy;
  policyB: Policy | ProspectivePolicy;
  differences: PolicyDifference[];
  regressions: string[];
  improvements: string[];
}

export interface ProspectivePolicy {
  buildingId: string;
  coverageType: CoverageType;
  carrier: string;
  limits: Record<string, number>;
  deductibles: Record<string, number>;
  premiumAnnual: number;
  effectiveDate: string;
  expirationDate: string;
}

export interface PolicyDifference {
  field: string;
  valueA: any;
  valueB: any;
  type: 'regression' | 'improvement' | 'neutral';
}

export interface ChatMessage {
  question: string;
  answer: string;
  highlights: string[];
  policyId?: string;
  documentId?: string;
}