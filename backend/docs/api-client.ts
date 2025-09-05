/**
 * API Client Implementation for Insurance Document Management
 * 
 * Pure TypeScript implementation without React components.
 * For React examples, see react-examples.tsx
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PolicyFile,
  PolicyListParams,
  SearchParams,
  SearchResult,
  Alert,
  AlertListParams,
  Claim,
  ClaimListParams,
  UploadResult,
  HealthStatus,
  UploadProgressCallback
} from './types';

// ==================== API CLIENT CLASS ====================

export class InsuranceApiClient {
  private client: AxiosInstance;
  private uploadClient: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.uploadClient = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for uploads
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', error.response?.data || error.message);
        return Promise.reject(this.handleApiError(error));
      }
    );

    // Same interceptors for upload client
    this.uploadClient.interceptors.request.use(
      (config) => {
        console.log(`📤 Upload Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.uploadClient.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.handleApiError(error))
    );
  }

  private handleApiError(error: any): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      return new Error(apiError.message || 'API request failed');
    }
    return new Error(error.message || 'Network error');
  }

  // ==================== HEALTH CHECK ====================

  async checkHealth(): Promise<HealthStatus> {
    const response: AxiosResponse<ApiResponse<HealthStatus>> = await this.client.get('/v1/health');
    return response.data.data;
  }

  // ==================== POLICY MANAGEMENT ====================

  async listPolicies(params: PolicyListParams = {}): Promise<{ 
    policies: PolicyFile[]; 
    pagination: any; 
  }> {
    const response: AxiosResponse<ApiResponse<PolicyFile[]>> = await this.client.get('/v1/policies', {
      params
    });
    
    return {
      policies: response.data.data,
      pagination: response.data.pagination
    };
  }

  async getPolicy(policyId: number, includeContent: boolean = false): Promise<PolicyFile> {
    const response: AxiosResponse<ApiResponse<PolicyFile>> = await this.client.get(
      `/v1/policies/${policyId}`,
      { params: { include_content: includeContent } }
    );
    return response.data.data;
  }

  async uploadPolicy(
    file: File, 
    propertyId?: number, 
    onProgress?: UploadProgressCallback
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (propertyId) {
      formData.append('property_id', propertyId.toString());
    }

    const response: AxiosResponse<ApiResponse<UploadResult>> = await this.uploadClient.post(
      '/v1/policies/upload',
      formData,
      {
        onUploadProgress: onProgress ? (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onProgress(progress);
        } : undefined
      }
    );

    return response.data.data;
  }

  async deletePolicy(policyId: number, hardDelete: boolean = false): Promise<void> {
    await this.client.delete(`/v1/policies/${policyId}`, {
      params: { hard_delete: hardDelete }
    });
  }

  // ==================== SEARCH ====================

  async searchPolicies(params: SearchParams): Promise<{
    results: SearchResult[];
    pagination: any;
  }> {
    const response: AxiosResponse<ApiResponse<SearchResult[]>> = await this.client.get('/v1/search', {
      params
    });

    return {
      results: response.data.data,
      pagination: response.data.pagination
    };
  }

  // ==================== CLAIMS ====================

  async listClaims(params: ClaimListParams = {}): Promise<{
    claims: Claim[];
    pagination: any;
  }> {
    const response: AxiosResponse<ApiResponse<Claim[]>> = await this.client.get('/v1/claims', {
      params
    });

    return {
      claims: response.data.data,
      pagination: response.data.pagination
    };
  }

  // ==================== ALERTS ====================

  async getAlerts(params: AlertListParams = {}): Promise<{
    alerts: Alert[];
    pagination: any;
  }> {
    const response: AxiosResponse<ApiResponse<Alert[]>> = await this.client.get('/v1/alerts', {
      params
    });

    return {
      alerts: response.data.data,
      pagination: response.data.pagination
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

export const createApiClient = (baseURL?: string): InsuranceApiClient => {
  return new InsuranceApiClient(baseURL);
};

// Singleton instance
export const apiClient = new InsuranceApiClient();

// ==================== ERROR HANDLING ====================

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return error.message || 'An unexpected error occurred';
};

// ==================== VALIDATION HELPERS ====================

export const validatePolicyUpload = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Only PDF files are supported' };
  }

  if (file.size > 50 * 1024 * 1024) { // 50MB
    return { isValid: false, error: 'File size must be less than 50MB' };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

// ==================== USAGE EXAMPLES ====================

export const exampleUsage = {
  // Basic policy listing
  async listAllPolicies() {
    try {
      const { policies, pagination } = await apiClient.listPolicies({
        page: 1,
        limit: 20
      });
      console.log(`Found ${policies.length} policies`);
      return policies;
    } catch (error) {
      console.error('Failed to list policies:', handleApiError(error));
      throw error;
    }
  },

  // Search with error handling
  async searchPolicies(query: string) {
    try {
      const { results } = await apiClient.searchPolicies({ q: query });
      console.log(`Search "${query}" returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error('Search failed:', handleApiError(error));
      return [];
    }
  },

  // Upload with progress tracking
  async uploadPolicyWithProgress(file: File) {
    const validation = validatePolicyUpload(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const result = await apiClient.uploadPolicy(
        file,
        undefined,
        (progress) => console.log(`Upload progress: ${progress}%`)
      );
      
      console.log(`Upload successful! Confidence: ${result.parsing_result.confidence}`);
      
      if (result.alerts.length > 0) {
        console.log(`⚠️ ${result.alerts.length} alerts generated`);
      }
      
      return result;
    } catch (error) {
      console.error('Upload failed:', handleApiError(error));
      throw error;
    }
  },

  // Health check
  async checkSystemHealth() {
    try {
      const health = await apiClient.checkHealth();
      console.log(`System status: ${health.status}`);
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }
};
