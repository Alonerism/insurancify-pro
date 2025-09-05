# Insurance Document Management System - Frontend Integration Guide

## Overview

This backend provides a comprehensive insurance document management system with v1 API endpoints designed for seamless frontend integration. The system includes document processing, search capabilities, alerts management, and claims tracking.

## 🚀 Quick Start for Frontend Developers

### 1. API Base URL
- **Development**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`
- **v1 API Prefix**: `/v1`

### 2. Key Features Available
- ✅ **Policy File Management**: Upload, process, and manage PDF insurance documents
- ✅ **Full-Text Search**: Semantic search across all documents with ranking
- ✅ **Alert System**: Automated alerts for policy expiration, missing info, low confidence
- ✅ **Claims Management**: Track and manage insurance claims
- ✅ **Database Migrations**: Automatic schema management
- ✅ **Enhanced PDF Parsing**: Carrier normalization, date parsing, confidence scoring

### 3. Authentication
Currently **no authentication required** - all endpoints are open for development.

## 📋 API Endpoints Summary

### Core Policy Management
```typescript
// Upload and process policy document
POST /v1/policies/upload
Content-Type: multipart/form-data
Body: file (PDF), property_id (optional)
Response: Processing results with confidence score

// List policies with filtering
GET /v1/policies
Query params: page, limit, property_id, search, file_type, carrier, status
Response: Paginated policy list

// Get specific policy details
GET /v1/policies/{policy_id}
Query params: include_content (boolean)
Response: Detailed policy information

// Delete policy (soft delete default)
DELETE /v1/policies/{policy_id}
Query params: hard_delete (boolean)
Response: Deletion confirmation
```

### Search & Discovery
```typescript
// Full-text search across documents
GET /v1/search
Query params: q (required), page, limit, property_id, carrier
Response: Ranked search results with snippets
```

### Claims Management
```typescript
// List claims
GET /v1/claims
Query params: page, limit, policy_id, status, claim_type
Response: Paginated claims list
```

### Alerts & Notifications
```typescript
// Get system alerts
GET /v1/alerts
Query params: page, limit, alert_type, active_only
Response: Paginated alerts list
```

### System Health
```typescript
// API health check
GET /v1/health
Response: System status and service health
```

## 🔧 TypeScript Integration

### Install Required Packages
```bash
npm install axios @types/axios
# or
yarn add axios @types/axios
```

### API Client Setup
```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For file uploads
export const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

### Type Definitions
See `./types.ts` for complete TypeScript interfaces.

## 📊 Response Format

All v1 API endpoints follow a consistent response format:

### Success Response
```typescript
{
  "success": true,
  "message": "Success message",
  "data": any, // Actual response data
  "timestamp": "2024-01-15T10:30:00Z",
  "pagination"?: {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20,
    "has_next": true,
    "has_previous": false
  }
}
```

### Error Response
```typescript
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_TYPE",
  "timestamp": "2024-01-15T10:30:00Z",
  "details"?: any // Additional error details
}
```

## 🔍 Search Implementation

### Basic Search
```typescript
const searchPolicies = async (query: string, page: number = 1) => {
  const response = await apiClient.get('/v1/search', {
    params: { q: query, page, limit: 20 }
  });
  return response.data;
};
```

### Advanced Filtering
```typescript
const listPolicies = async (filters: PolicyFilters) => {
  const response = await apiClient.get('/v1/policies', {
    params: {
      page: filters.page || 1,
      limit: filters.limit || 20,
      search: filters.search,
      carrier: filters.carrier,
      status: filters.status,
      property_id: filters.propertyId
    }
  });
  return response.data;
};
```

## 📄 File Upload Implementation

### Policy Document Upload
```typescript
const uploadPolicy = async (file: File, propertyId?: number) => {
  const formData = new FormData();
  formData.append('file', file);
  if (propertyId) {
    formData.append('property_id', propertyId.toString());
  }

  const response = await uploadClient.post('/v1/policies/upload', formData);
  return response.data;
};
```

### Upload with Progress Tracking
```typescript
const uploadWithProgress = async (file: File, onProgress: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await uploadClient.post('/v1/policies/upload', formData, {
    onUploadProgress: (progressEvent) => {
      const progress = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 1)
      );
      onProgress(progress);
    }
  });
  return response.data;
};
```

## 🚨 Alert System Integration

### Real-time Alert Checking
```typescript
const checkAlerts = async () => {
  const response = await apiClient.get('/v1/alerts', {
    params: { active_only: true }
  });
  return response.data;
};

// For periodic checking
useEffect(() => {
  const interval = setInterval(checkAlerts, 60000); // Check every minute
  return () => clearInterval(interval);
}, []);
```

### Alert Types to Handle
- `policy_expiring` - Policies expiring within 30 days
- `policy_expired` - Expired policies  
- `policy_missing_info` - Missing critical information
- `low_confidence` - Low parsing confidence requiring review
- `processing_error` - Document processing failures

## 🎨 UI Implementation Suggestions

### Policy Dashboard Components
1. **PolicyList** - Paginated table with search and filters
2. **PolicyUpload** - Drag & drop file upload with progress
3. **PolicyDetails** - Detailed view with metadata and alerts
4. **SearchBar** - Global search with autocomplete
5. **AlertPanel** - Alert notifications and management

### Recommended Libraries
- **UI Framework**: React/Vue with component library (Ant Design, Material-UI, Chakra UI)
- **Data Fetching**: React Query or SWR for caching and optimistic updates
- **File Upload**: react-dropzone or vue-upload-component
- **Tables**: react-table or vue-good-table with pagination
- **Notifications**: react-hot-toast or vue-toastification

## 🔄 State Management Patterns

### Policy Data Management
```typescript
// React Query example
const { data: policies, isLoading, error } = useQuery(
  ['policies', filters],
  () => listPolicies(filters),
  { 
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false 
  }
);

// Upload mutation
const uploadMutation = useMutation(uploadPolicy, {
  onSuccess: () => {
    queryClient.invalidateQueries(['policies']);
    toast.success('Policy uploaded successfully!');
  },
  onError: (error) => {
    toast.error(`Upload failed: ${error.message}`);
  }
});
```

## 📱 Mobile Responsiveness

### Recommended Breakpoints
- **Desktop**: >= 1024px - Full table view with all columns
- **Tablet**: 768px - 1023px - Condensed table, some columns hidden
- **Mobile**: < 768px - Card-based layout, search overlay

### Touch-Friendly Features
- Large touch targets (min 44px)
- Swipe gestures for table navigation
- Pull-to-refresh for data updates
- Bottom sheet modals for mobile forms

## 🧪 Testing Integration

### API Testing
```typescript
// Jest + MSW example
import { rest } from 'msw';

export const handlers = [
  rest.get('http://localhost:8000/v1/policies', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: mockPolicies,
        pagination: mockPagination
      })
    );
  }),
];
```

### Component Testing
```typescript
// React Testing Library example
test('uploads policy file successfully', async () => {
  const file = new File(['test'], 'policy.pdf', { type: 'application/pdf' });
  
  render(<PolicyUpload />);
  
  const input = screen.getByLabelText(/upload/i);
  fireEvent.change(input, { target: { files: [file] } });
  
  await waitFor(() => {
    expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
  });
});
```

## 🚀 Deployment Considerations

### Environment Variables
```bash
# Backend API URL
REACT_APP_API_URL=http://localhost:8000
# or
VITE_API_URL=http://localhost:8000

# For production
REACT_APP_API_URL=https://your-api-domain.com
```

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:3000` (Create React App)
- `http://localhost:5173` (Vite)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

For production, update CORS origins in `api_server.py`.

## 🎯 Next Steps for Frontend Implementation

1. **Set up API client** with TypeScript types
2. **Create core components** (PolicyList, Upload, Search)
3. **Implement state management** (React Query/SWR)
4. **Add alert system** with real-time updates
5. **Design responsive layouts** for mobile/desktop
6. **Add error handling** and loading states
7. **Implement file upload** with progress tracking
8. **Create search interface** with filters
9. **Add pagination** and infinite scroll
10. **Set up testing** with mocked API responses

## 📞 Support

For questions about the backend API:
- **API Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/v1/health`
- **Database Migrations**: Automatic on server startup

Happy coding! 🚀
