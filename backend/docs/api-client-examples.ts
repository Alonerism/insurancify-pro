/**
 * Example API Client Implementation for Insurance Document Management
 * 
 * Copy these examples into your frontend project and modify as needed.
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

// ==================== REACT HOOKS EXAMPLES ====================

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

// Singleton API client instance
export const apiClient = new InsuranceApiClient();

// ==================== CUSTOM HOOKS ====================

export const usePolicies = (params: PolicyListParams = {}) => {
  return useQuery(
    ['policies', params],
    () => apiClient.listPolicies(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );
};

export const usePolicy = (policyId: number, includeContent: boolean = false) => {
  return useQuery(
    ['policy', policyId, includeContent],
    () => apiClient.getPolicy(policyId, includeContent),
    {
      enabled: !!policyId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

export const useUploadPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ file, propertyId, onProgress }: { 
      file: File; 
      propertyId?: number; 
      onProgress?: UploadProgressCallback; 
    }) => apiClient.uploadPolicy(file, propertyId, onProgress),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['policies']);
      },
    }
  );
};

export const useSearch = () => {
  const [searchState, setSearchState] = useState({
    query: '',
    results: [] as SearchResult[],
    isSearching: false,
    hasSearched: false,
  });

  const performSearch = useCallback(async (query: string, params: Omit<SearchParams, 'q'> = {}) => {
    if (!query.trim()) return;

    setSearchState(prev => ({ ...prev, isSearching: true }));

    try {
      const { results } = await apiClient.searchPolicies({ q: query, ...params });
      setSearchState({
        query,
        results,
        isSearching: false,
        hasSearched: true,
      });
    } catch (error) {
      console.error('Search failed:', error);
      setSearchState(prev => ({ 
        ...prev, 
        isSearching: false, 
        results: [],
        hasSearched: true 
      }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      results: [],
      isSearching: false,
      hasSearched: false,
    });
  }, []);

  return {
    ...searchState,
    performSearch,
    clearSearch,
  };
};

export const useAlerts = (activeOnly: boolean = true) => {
  return useQuery(
    ['alerts', { active_only: activeOnly }],
    () => apiClient.getAlerts({ active_only: activeOnly }),
    {
      refetchInterval: 60000, // Refetch every minute
      staleTime: 30000, // 30 seconds
    }
  );
};

// ==================== UTILITY HOOKS ====================

export const useHealthCheck = () => {
  return useQuery(
    ['health'],
    () => apiClient.checkHealth(),
    {
      refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
      retry: 3,
    }
  );
};

export const usePagination = (initialPageSize: number = 20) => {
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: initialPageSize,
  });

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPagination({ currentPage: 1, pageSize: size });
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({ currentPage: 1, pageSize: initialPageSize });
  }, [initialPageSize]);

  return {
    ...pagination,
    goToPage,
    changePageSize,
    resetPagination,
  };
};

// ==================== COMPONENT EXAMPLES ====================

export const PolicyUploadExample = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadMutation = useUploadPolicy();

  const handleFileUpload = async (file: File) => {
    try {
      await uploadMutation.mutateAsync({
        file,
        onProgress: setUploadProgress,
      });
      setUploadProgress(0);
      alert('Upload successful!');
    } catch (error) {
      alert(`Upload failed: ${error}`);
      setUploadProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
      {uploadMutation.isLoading && (
        <div>Uploading... {uploadProgress}%</div>
      )}
    </div>
  );
};

export const PolicyListExample = () => {
  const pagination = usePagination();
  const { data, isLoading, error } = usePolicies({
    page: pagination.currentPage,
    limit: pagination.pageSize,
  });

  if (isLoading) return <div>Loading policies...</div>;
  if (error) return <div>Error loading policies</div>;

  return (
    <div>
      <div>Found {data?.pagination?.total_items} policies</div>
      {data?.policies.map((policy) => (
        <div key={policy.id}>
          <h3>{policy.file_name}</h3>
          <p>Carrier: {policy.carrier}</p>
          <p>Policy #: {policy.policy_number}</p>
        </div>
      ))}
      
      {/* Pagination */}
      <div>
        <button 
          onClick={() => pagination.goToPage(pagination.currentPage - 1)}
          disabled={!data?.pagination?.has_previous}
        >
          Previous
        </button>
        
        <span>Page {pagination.currentPage} of {data?.pagination?.total_pages}</span>
        
        <button 
          onClick={() => pagination.goToPage(pagination.currentPage + 1)}
          disabled={!data?.pagination?.has_next}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const SearchExample = () => {
  const { query, results, isSearching, hasSearched, performSearch, clearSearch } = useSearch();

  return (
    <div>
      <input
        type="text"
        placeholder="Search policies..."
        value={query}
        onChange={(e) => {
          if (e.target.value === '') {
            clearSearch();
          }
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            performSearch(e.currentTarget.value);
          }
        }}
      />
      
      {isSearching && <div>Searching...</div>}
      
      {hasSearched && !isSearching && (
        <div>
          <p>Found {results.length} results</p>
          {results.map((result) => (
            <div key={result.id}>
              <h4>{result.file_name}</h4>
              <p>Score: {result.relevance_score.toFixed(2)}</p>
              <p dangerouslySetInnerHTML={{ __html: result.search_snippet }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
