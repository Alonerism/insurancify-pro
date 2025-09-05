# 🚀 LOVABLE INTEGRATION PROMPT - Insurance Master Frontend

## 🎯 **MISSION: Complete Frontend Integration**

You have access to a **FULLY FUNCTIONAL** Python backend with REST API. Your job is to integrate the existing React/TypeScript frontend with the real backend API, replacing all mock data with live data.

## 📋 **CURRENT STATUS**

### ✅ **BACKEND READY** (100% Complete)
- **REST API**: Running on `http://127.0.0.1:8000` with 20+ endpoints
- **Database**: SQLite with 4 agents, 4 buildings, 6 policies + sample data
- **PDF Processing**: Advanced parser with metadata extraction
- **Search Engine**: Full-text search with FTS5
- **File Upload**: Complete ingestion workflow
- **Documentation**: Available at `http://127.0.0.1:8000/docs`

### ✅ **FRONTEND READY** (95% Complete)
- **React Query**: Already installed (`@tanstack/react-query`)
- **Environment**: `.env.local` configured with API URLs
- **UI Components**: Complete insurance management interface
- **Build System**: Vite working correctly

## 🎯 **YOUR TASKS**

### 1. **Replace Mock Data with Real API Calls**

**Current State**: Frontend uses `src/data/mockData.ts`
**Target**: Replace with API service layer

```typescript
// Create: src/services/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const apiService = {
  // Agents
  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE}/agents`);
    return response.json();
  },

  // Buildings  
  async getBuildings(agentId?: string): Promise<Building[]> {
    const url = agentId ? `${API_BASE}/buildings?agent_id=${agentId}` : `${API_BASE}/buildings`;
    const response = await fetch(url);
    return response.json();
  },

  // Policies
  async getPolicies(buildingId?: string): Promise<Policy[]> {
    const url = buildingId ? `${API_BASE}/policies?building_id=${buildingId}` : `${API_BASE}/policies`;
    const response = await fetch(url);
    return response.json();
  },

  // Search
  async searchPolicies(query: string): Promise<SearchResult[]> {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 50 })
    });
    return response.json();
  },

  // File Upload
  async uploadPDF(file: File, buildingId: string, policyId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('building_id', buildingId);
    if (policyId) formData.append('policy_id', policyId);

    const response = await fetch(`${API_BASE}/upload/pdf`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
};
```

### 2. **Add React Query Integration**

```typescript
// Update: src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

### 3. **Create Data Hooks**

```typescript
// Create: src/hooks/useAgents.ts
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
    queryFn: () => apiService.getBuildings(agentId),
    enabled: true
  });
};

export const usePolicies = (buildingId?: string) => {
  return useQuery({
    queryKey: ['policies', buildingId], 
    queryFn: () => apiService.getPolicies(buildingId),
    enabled: true
  });
};
```

### 4. **Update Key Components**

#### Dashboard Page
```typescript
// Update: src/pages/Dashboard.tsx
import { useAgents, useBuildings, usePolicies } from '@/hooks/useAgents';

export default function Dashboard() {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const { data: policies, isLoading: policiesLoading } = usePolicies();

  if (agentsLoading || buildingsLoading || policiesLoading) {
    return <div>Loading...</div>;
  }

  // Use real data instead of mockData
  return (
    <div className="space-y-6">
      {/* Existing dashboard UI with real data */}
      <StatsCards agents={agents} buildings={buildings} policies={policies} />
    </div>
  );
}
```

#### Policies Page
```typescript
// Update: src/pages/Policies.tsx  
import { usePolicies } from '@/hooks/useAgents';

export default function Policies() {
  const { data: policies, isLoading, error } = usePolicies();

  if (isLoading) return <div>Loading policies...</div>;
  if (error) return <div>Error loading policies</div>;

  return (
    <div className="space-y-6">
      {policies?.map((policy) => (
        <PolicyCard key={policy.id} policy={policy} />
      ))}
    </div>
  );
}
```

### 5. **Add Search Functionality**

```typescript
// Create: src/components/PolicySearch.tsx
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
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. **Add File Upload Component**

```typescript
// Create: src/components/PDFUploader.tsx
import { useState } from 'react';
import { apiService } from '@/services/api';

interface PDFUploaderProps {
  buildingId: string;
  policyId?: string;
  onUploadComplete?: (result: any) => void;
}

export function PDFUploader({ buildingId, policyId, onUploadComplete }: PDFUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await apiService.uploadPDF(file, buildingId, policyId);
      onUploadComplete?.(result);
      // Show success message
    } catch (error) {
      console.error('Upload failed:', error);
      // Show error message  
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    if (pdfFile) {
      handleFileUpload(pdfFile);
    }
  };

  return (
    <div 
      className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading ? 'Uploading...' : 'Drop PDF here or click to upload'}
    </div>
  );
}
```

## 🎯 **API REFERENCE**

**Base URL**: `http://127.0.0.1:8000/api`
**Docs**: `http://127.0.0.1:8000/docs`

### Key Endpoints:
- `GET /api/agents` - List all agents
- `GET /api/buildings?agent_id={id}` - List buildings (optionally filtered)
- `GET /api/policies?building_id={id}` - List policies (optionally filtered)
- `POST /api/search` - Search policies (`{"query": "...", "limit": 50}`)
- `POST /api/upload/pdf` - Upload PDF file
- `GET /api/system/stats` - System statistics

### Data Types:
```typescript
interface Agent {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface Building {
  id: string;
  name: string;
  address: string;
  notes?: string;
  primary_agent_id?: string;
  primary_agent?: Agent;
  policy_count: number;
}

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
  building: Building;
  agent: Agent;
  document_count: number;
}
```

## 🚨 **CRITICAL REQUIREMENTS**

1. **Keep Existing UI**: Don't change the visual design, just replace data sources
2. **Error Handling**: Add proper loading states and error messages
3. **Type Safety**: Maintain TypeScript types for all API responses  
4. **Performance**: Use React Query caching effectively
5. **User Experience**: Add loading spinners, success/error notifications

## 🎯 **TESTING CHECKLIST**

- [ ] Dashboard loads with real data from API
- [ ] Agents page shows actual agents from database
- [ ] Buildings page shows real buildings
- [ ] Policies page displays actual policies
- [ ] Search functionality works with real search API
- [ ] File upload component uploads PDFs successfully
- [ ] Navigation between pages works
- [ ] Loading states display properly
- [ ] Error states handle API failures gracefully

## 🚀 **START HERE**

1. **First**: Test that backend is running: `curl http://127.0.0.1:8000/health`
2. **Second**: Check API docs: Open `http://127.0.0.1:8000/docs`
3. **Third**: Start with Dashboard page - replace mock data with real API calls
4. **Fourth**: Add React Query integration
5. **Fifth**: Update remaining pages one by one

## ⚡ **BACKEND COMMANDS** (For Reference)

```bash
# Start backend (Terminal 1)
cd backend && ../·venv/bin/python main.py serve

# Test backend (Terminal 2)  
curl "http://127.0.0.1:8000/api/agents" | jq

# Frontend dev server (Terminal 3)
npm run dev
```

---

**🎯 YOUR GOAL**: Transform this React app from using mock data to a fully functional insurance management system with real data, search, and file upload capabilities!

The backend is 100% ready and tested. Focus on the frontend integration and user experience. You've got this! 🚀
