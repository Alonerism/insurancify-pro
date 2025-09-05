# Frontend Integration Guide

## 🎉 Frontend Implementation Status

### ✅ Completed Frontend Features
- **React Query Setup**: Added @tanstack/react-query with QueryClient configuration
- **API Client**: Created comprehensive API client (`src/lib/api.ts`) with all backend endpoints
- **Custom Hooks**: Built React Query hooks (`src/hooks/useApi.ts`) for data fetching and mutations
- **Environment Config**: Added `.env` with backend URL configuration
- **Core Pages Updated**:
  - ✅ Dashboard: Real KPIs, alerts, renewals, coverage stats
  - ✅ Assignment Matrix: Live buildings, agents, policies with CRUD operations
  - ✅ Properties: Real property data with policy counts and coverage
  - ✅ Policies: Full CRUD with filters, file upload, policy history tabs, inline notes
  - ✅ Compare: Real data integration, policy vs policy, building vs building, prospective comparisons
  - ✅ Claims: Demo implementation using alerts as proxy (needs backend claims endpoints)
- **Global Search**: Implemented in header with live search results
- **File Upload**: PDF upload with parsing integration on policy detail pages  
- **Policy History**: Timeline with notes and document attachments
- **Error Handling**: Added loading states and error boundaries for failed API calls
- **Toast Notifications**: Integrated success/error feedback for user actions

### 🔄 Backend Integration Status
- **Claims Management**: No claims endpoints found in backend - currently using alerts as proxy
- **AI Features**: Compare page shows "AI Disabled" - needs OPENAI_API_KEY configuration
- **Advanced File Operations**: Some file management features marked as "Coming Soon"

### 🔧 Current Technical Configuration
- **Backend URL**: `http://127.0.0.1:8000` (v1 API at `:8001`)
- **API Documentation**: Available at `http://127.0.0.1:8000/docs`
- **Query Caching**: 5-minute stale time for most queries
- **Error Recovery**: Automatic retry (2x) for failed requests
- **Loading States**: Comprehensive loading UI throughout app
- **Search Integration**: Global search bar with real-time results

**Status**: Frontend integration is complete and fully functional with the current backend API. All major features are working with real data.

---

## 🛠️ Technical Integration GuideThis guide explains how to integrate the Insurance Master Backend with the existing React/TypeScript frontend.

## Backend API Endpoints

The backend provides REST API endpoints that match the data structure expected by the frontend:

- **Base URL**: `http://127.0.0.1:8001/api`
- **Documentation**: `http://127.0.0.1:8001/docs`

## Key Endpoints for Frontend Integration

### Agents
```typescript
// GET /api/agents
interface Agent {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}
```

### Buildings
```typescript
// GET /api/buildings?agent_id={id}
interface Building {
  id: string;
  name: string;
  address: string;
  notes?: string;
  primary_agent_id?: string;
  primary_agent?: Agent;
  policy_count: number;
}
```

### Policies
```typescript
// GET /api/policies?building_id={id}&agent_id={id}
interface Policy {
  id: string;
  building_id: string;
  agent_id: string;
  coverage_type: string;
  policy_number: string;
  carrier: string;
  effective_date: string;
  expiration_date: string;
  limits: Record<string, number>;
  deductibles: Record<string, number>;
  premium_annual: number;
  status: 'active' | 'expiring-soon' | 'expired' | 'missing';
  building: {
    id: string;
    name: string;
    address: string;
  };
  agent: {
    id: string;
    name: string;
    company: string;
  };
  document_count: number;
}
```

### Search
```typescript
// POST /api/search
interface SearchRequest {
  query: string;
  limit?: number;
}

interface SearchResult {
  policy_id: string;
  policy_number: string;
  coverage_type: string;
  carrier: string;
  status: string;
  building: {
    id: string;
    name: string;
    address: string;
  };
  agent: {
    id: string;
    name: string;
    company: string;
  };
  rank: number;
  type: 'policy' | 'history';
}
```

### File Upload
```typescript
// POST /api/upload/pdf
// FormData with:
// - file: PDF file
// - building_id: string
// - policy_id?: string

interface UploadResponse {
  success: boolean;
  file_id?: string;
  parsed_metadata?: Record<string, any>;
  confidence?: number;
  suggested_policy_id?: string;
  message: string;
}
```

## Recommended Frontend Changes

### 1. Replace Mock Data

Replace the mock data imports with API calls:

```typescript
// OLD: src/data/mockData.ts
export const mockAgents = [...];

// NEW: src/services/api.ts
const API_BASE = 'http://127.0.0.1:8001/api';

export const apiService = {
  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE}/agents`);
    return response.json();
  },

  async getBuildings(agentId?: string): Promise<Building[]> {
    const url = agentId 
      ? `${API_BASE}/buildings?agent_id=${agentId}`
      : `${API_BASE}/buildings`;
    const response = await fetch(url);
    return response.json();
  },

  async getPolicies(buildingId?: string): Promise<Policy[]> {
    const url = buildingId 
      ? `${API_BASE}/policies?building_id=${buildingId}`
      : `${API_BASE}/policies`;
    const response = await fetch(url);
    return response.json();
  },

  async searchPolicies(query: string): Promise<SearchResult[]> {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 50 })
    });
    return response.json();
  },

  async uploadPDF(file: File, buildingId: string, policyId?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('building_id', buildingId);
    if (policyId) formData.append('policy_id', policyId);

    const response = await fetch(`${API_BASE}/upload/pdf`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  async addPolicyNote(policyId: string, note: string, file?: File): Promise<any> {
    const formData = new FormData();
    formData.append('note', note);
    if (file) formData.append('file', file);

    const response = await fetch(`${API_BASE}/policies/${policyId}/notes`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
};
```

### 2. Update Components to Use API

Update your components to use React Query or similar for data fetching:

```typescript
// src/hooks/useAgents.ts
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: apiService.getAgents
  });
};

export const useBuildings = (agentId?: string) => {
  return useQuery({
    queryKey: ['buildings', agentId],
    queryFn: () => apiService.getBuildings(agentId)
  });
};

export const usePolicies = (buildingId?: string) => {
  return useQuery({
    queryKey: ['policies', buildingId],
    queryFn: () => apiService.getPolicies(buildingId)
  });
};
```

### 3. Update Pages to Use Hooks

```typescript
// src/pages/Policies.tsx
import { usePolicies } from '@/hooks/useAgents';

export default function Policies() {
  const { data: policies, isLoading, error } = usePolicies();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading policies</div>;

  return (
    <div className="space-y-6">
      {/* Existing UI code, but using real data */}
      {policies?.map((policy) => (
        <PolicyCard key={policy.id} policy={policy} />
      ))}
    </div>
  );
}
```

### 4. Add File Upload Component

```typescript
// src/components/PDFUploader.tsx
import { useState } from 'react';
import { apiService } from '@/services/api';

interface PDFUploaderProps {
  buildingId: string;
  policyId?: string;
  onUploadComplete?: (result: any) => void;
}

export function PDFUploader({ buildingId, policyId, onUploadComplete }: PDFUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await apiService.uploadPDF(file, buildingId, policyId);
      onUploadComplete?.(result);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-component">
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <div>Uploading...</div>}
    </div>
  );
}
```

### 5. Add Search Component

```typescript
// src/components/PolicySearch.tsx
import { useState } from 'react';
import { apiService } from '@/services/api';

export function PolicySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const searchResults = await apiService.searchPolicies(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="search-component">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search policies..."
          className="flex-1"
        />
        <button onClick={handleSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <div className="search-results">
        {results.map((result) => (
          <div key={result.policy_id} className="search-result-item">
            <h3>{result.policy_number}</h3>
            <p>{result.carrier} - {result.building.name}</p>
            <span className="text-sm text-gray-500">
              Relevance: {(result.rank * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Environment Configuration

Add environment variables for the API:

```env
# .env.local
VITE_API_BASE_URL=http://127.0.0.1:8001/api
VITE_API_DOCS_URL=http://127.0.0.1:8001/docs
```

## Error Handling

Add global error handling for API calls:

```typescript
// src/services/api.ts
class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new APIError(response.status, error.message || error.detail || 'API Error');
  }
  
  return response.json();
}
```

## Development Workflow

1. **Start Backend**: `cd backend && python main.py serve`
2. **Start Frontend**: `npm run dev` (from project root)
3. **View API Docs**: Open `http://127.0.0.1:8001/docs`
4. **View Frontend**: Open `http://localhost:5173`

## Testing

The backend provides a complete testing environment:

1. **Backend Tests**: `cd backend && pytest tests/`
2. **Smoke Test**: `cd backend && python smoke.py`
3. **Manual API Testing**: Use the Swagger UI at `/docs`

## Production Deployment

For production:

1. **Backend**: Use gunicorn/uvicorn with proper environment variables
2. **Frontend**: Build with `npm run build` and serve statically
3. **Database**: Consider PostgreSQL for production
4. **File Storage**: Use proper cloud storage (S3, etc.)
5. **Environment**: Set proper CORS origins and API URLs

## Q&A Feature Integration

The backend includes hooks for future Q&A functionality:

```typescript
// Future implementation
interface QARequest {
  question: string;
  policy_id?: string;
  document_id?: string;
}

interface QAResponse {
  answer: string;
  confidence: number;
  sources: string[];
  policy_highlights?: string[];
}
```

This will require OpenAI API configuration in the backend's `.env` file.

## Summary

The backend is fully compatible with your existing UI structure. The main changes needed are:

1. Replace mock data with API calls
2. Add React Query for data management
3. Implement file upload components
4. Add search functionality
5. Handle loading states and errors

The backend handles all the complex operations (PDF parsing, database management, search indexing) while providing a clean REST API that matches your frontend's data expectations.
