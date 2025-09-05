/**
 * TypeScript Type Definitions for Insurance Document Management API
 * 
 * These types correspond to the backend API v1 endpoints.
 * Import these into your frontend project for type safety.
 */

// ==================== CORE DATA MODELS ====================

export interface PolicyFile {
  id: number;
  file_name: string;
  file_path?: string;
  property_id?: number;
  file_type: string;
  carrier?: string;
  carrier_raw?: string;
  policy_number?: string;
  coverage_type?: string;
  effective_date?: string; // ISO date string
  expiration_date?: string; // ISO date string
  status: 'active' | 'expired' | 'cancelled' | 'deleted';
  confidence_score?: number;
  upload_date?: string; // ISO date string
  last_updated?: string; // ISO date string
  is_deleted: boolean;
  version: number;
  file_size_kb?: number;
  has_content?: boolean;
  content?: string; // Only included when include_content=true
  alerts?: Alert[];
}

export interface Claim {
  id: number;
  claim_number: string;
  policy_id: number;
  claim_type: string;
  status: string;
  amount?: number;
  date_of_loss?: string; // ISO date string
  date_reported?: string; // ISO date string
  description?: string;
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  policy_id?: number;
  property_id?: number;
  created_at: string; // ISO date string
  metadata?: Record<string, any>;
  is_active: boolean;
}

export type AlertType = 
  | 'policy_expiring'
  | 'policy_expired'
  | 'policy_missing_info'
  | 'processing_error'
  | 'low_confidence'
  | 'system_warning'
  | 'duplicate_policy';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  pagination?: PaginationInfo;
  error_code?: string;
  details?: Record<string, any>;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SearchResult {
  id: number;
  file_name: string;
  carrier?: string;
  policy_number?: string;
  coverage_type?: string;
  effective_date?: string;
  expiration_date?: string;
  relevance_score: number;
  search_snippet: string;
}

export interface UploadResult {
  id: number;
  file_name: string;
  parsing_result: {
    confidence: number;
    message: string;
    metadata_extracted: number;
  };
  extracted_metadata: Record<string, any>;
  alerts: Alert[];
  search_indexed: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  services: {
    database: string;
    pdf_parser: string;
    search_engine: string;
    alert_service: string;
  };
}

// ==================== REQUEST TYPES ====================

export interface PolicyListParams {
  page?: number;
  limit?: number;
  property_id?: number;
  search?: string;
  file_type?: string;
  carrier?: string;
  status?: string;
}

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  property_id?: number;
  carrier?: string;
}

export interface ClaimListParams {
  page?: number;
  limit?: number;
  policy_id?: number;
  status?: string;
  claim_type?: string;
}

export interface AlertListParams {
  page?: number;
  limit?: number;
  alert_type?: AlertType;
  active_only?: boolean;
}

export interface PolicyUploadData {
  file: File;
  property_id?: number;
}

// ==================== API CLIENT TYPES ====================

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface ApiError {
  success: false;
  message: string;
  error_code: string;
  timestamp: string;
  details?: Record<string, any>;
}

// ==================== FILTER & SORT TYPES ====================

export interface PolicyFilters {
  search?: string;
  carrier?: string;
  status?: 'active' | 'expired' | 'cancelled';
  file_type?: string;
  property_id?: number;
  date_range?: {
    start?: string;
    end?: string;
  };
}

export interface SortOption {
  field: 'upload_date' | 'expiration_date' | 'carrier' | 'policy_number' | 'confidence_score';
  direction: 'asc' | 'desc';
}

// ==================== UI STATE TYPES ====================

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  hasSearched: boolean;
}

export interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  lastChecked?: string;
}

// ==================== FORM TYPES ====================

export interface PolicyUploadForm {
  file?: File;
  propertyId?: number;
  notes?: string;
}

export interface SearchForm {
  query: string;
  filters: PolicyFilters;
  sortBy: SortOption;
}

// ==================== UTILITY TYPES ====================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
  method: ApiMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// ==================== VALIDATION TYPES ====================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ==================== CONSTANTS ====================

export const ALERT_TYPES: Record<AlertType, string> = {
  policy_expiring: 'Policy Expiring',
  policy_expired: 'Policy Expired',
  policy_missing_info: 'Missing Information',
  processing_error: 'Processing Error',
  low_confidence: 'Low Confidence',
  system_warning: 'System Warning',
  duplicate_policy: 'Duplicate Policy'
};

export const ALERT_SEVERITIES: Record<AlertSeverity, string> = {
  low: 'Low',
  medium: 'Medium', 
  high: 'High',
  critical: 'Critical'
};

export const POLICY_STATUSES = [
  'active',
  'expired', 
  'cancelled',
  'deleted'
] as const;

export const FILE_TYPES = [
  'pdf',
  'doc',
  'docx',
  'txt'
] as const;

export const COVERAGE_TYPES = [
  'General Liability',
  'Property Insurance',
  'Workers Compensation',
  'Professional Liability',
  'Auto Insurance',
  'Umbrella Policy'
] as const;

// ==================== TYPE GUARDS ====================

export function isApiError(response: any): response is ApiError {
  return response && !response.success && typeof response.message === 'string';
}

export function isSuccessResponse<T>(response: any): response is ApiResponse<T> {
  return response && response.success === true && response.data !== undefined;
}

export function isValidPolicy(policy: any): policy is PolicyFile {
  return policy && 
         typeof policy.id === 'number' &&
         typeof policy.file_name === 'string' &&
         typeof policy.is_deleted === 'boolean';
}

// ==================== HELPER TYPES ====================

export type PolicyListResponse = ApiResponse<PolicyFile[]>;
export type PolicyDetailResponse = ApiResponse<PolicyFile>;
export type SearchResponse = ApiResponse<SearchResult[]>;
export type ClaimListResponse = ApiResponse<Claim[]>;
export type AlertListResponse = ApiResponse<Alert[]>;
export type UploadResponse = ApiResponse<UploadResult>;
export type HealthResponse = ApiResponse<HealthStatus>;

// Export utilities object for easy importing
export const TypeUtils = {
  ALERT_TYPES,
  ALERT_SEVERITIES,
  POLICY_STATUSES,
  FILE_TYPES,
  COVERAGE_TYPES,
  isApiError,
  isSuccessResponse,
  isValidPolicy
};
