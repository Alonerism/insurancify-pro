# 🚀 SUPER PROMPT FOR LOVABLE - INSURANCE MANAGEMENT FRONTEND

## 🎯 PROJECT OVERVIEW
Create a comprehensive **Insurance Document Management System Frontend** using React/TypeScript with modern UI components. The backend is **100% COMPLETE** with v1 API endpoints ready for integration.

## 📋 BACKEND API STATUS ✅
- **Backend URL**: `http://localhost:8001` (change for production)
- **API Documentation**: `http://localhost:8001/docs` (Swagger UI)
- **All endpoints tested and operational**
- **Complete TypeScript definitions provided**
- **Sample API client implementation available**

## 🎨 FRONTEND REQUIREMENTS

### Core Pages & Features

1. **Dashboard Page** 📊
   - Policy statistics cards (total, active, expiring, expired)
   - Recent activity feed
   - Alert notifications center
   - Quick actions (upload policy, search, view reports)
   - Charts showing policy distribution by carrier, coverage type

2. **Policy Management** 📄
   - **Policy List**: Table with sorting, filtering, pagination
     - Columns: Policy Number, Carrier, Coverage Type, Status, Effective Date, Expiration Date, Premium
     - Actions: View, Edit, Delete, Download PDF
   - **Policy Upload**: Drag & drop PDF upload with progress
   - **Policy Details**: Full policy information with PDF viewer
   - **Bulk Operations**: Select multiple policies for actions

3. **Search & Discovery** 🔍
   - **Global Search**: Full-text search across all policies
   - **Advanced Filters**: By carrier, coverage type, date range, status
   - **Search Results**: Highlighted matches, relevance scoring
   - **Saved Searches**: Save frequent search queries

4. **Claims Management** 🏥
   - **Claims List**: All insurance claims with status tracking
   - **Claim Details**: Full claim information and documents
   - **New Claim**: Create claims linked to policies
   - **Claim Timeline**: Track claim progress and updates

5. **Alerts & Notifications** 🚨
   - **Alert Dashboard**: Real-time notifications
   - **Alert Types**: Policy expiring, expired, missing info, system warnings
   - **Alert Management**: Mark as read, dismiss, configure preferences
   - **Email Notifications**: Configure email alerts (future feature)

6. **Reports & Analytics** 📈
   - **Policy Reports**: Generate custom reports
   - **Coverage Analysis**: Analyze coverage gaps and overlaps
   - **Premium Tracking**: Track premium costs over time
   - **Export Options**: PDF, Excel, CSV export

### 🛠️ Technical Requirements

**Framework & Libraries**
```typescript
// Core Framework
- React 18+ with TypeScript
- Vite for build tooling
- React Router for navigation

// UI Components
- Shadcn/ui or similar component library
- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form for forms
- Zod for validation

// Data Management
- TanStack Query (React Query) for API calls
- Zustand or Context API for state management
- Date-fns for date manipulation

// File Handling
- React-PDF for PDF viewing
- React-Dropzone for file uploads

// Utilities
- Axios for HTTP client
- React-Hot-Toast for notifications
```

**API Integration Setup**
```typescript
// API Client Configuration
const API_BASE_URL = 'http://localhost:8001';

// Use the provided TypeScript types from backend/docs/types.ts
// Use the provided API client from backend/docs/api-client.ts

// Key API Endpoints:
// GET /v1/health - Health check
// GET /v1/policies - List policies (with pagination)
// POST /v1/policies/upload - Upload policy PDF
// GET /v1/policies/{id} - Get specific policy
// DELETE /v1/policies/{id} - Delete policy
// GET /v1/search - Search policies
// GET /v1/alerts - Get system alerts
// GET /v1/claims - List claims
// POST /v1/claims - Create new claim
```

### 🎨 UI/UX Design Requirements

**Color Scheme & Branding**
- Primary: Professional blue (#2563eb)
- Secondary: Green for success (#16a34a)
- Warning: Orange for alerts (#ea580c)
- Error: Red for errors (#dc2626)
- Background: Clean white/gray (#f9fafb)

**Layout Structure**
```
┌─────────────────────────────────────────┐
│ Header (Logo, Search, User Menu)        │
├─────────┬───────────────────────────────┤
│ Sidebar │ Main Content Area             │
│ - Nav   │ - Breadcrumbs                 │
│ - Quick │ - Page Title                  │
│   Acess │ - Content Cards/Tables        │
│         │ - Action Buttons              │
└─────────┴───────────────────────────────┘
```

**Component Guidelines**
- **Cards**: Use for policy items, statistics, alerts
- **Tables**: Sortable, filterable with pagination
- **Forms**: Clean, validated forms with helpful errors
- **Modals/Dialogs**: For confirmations, quick actions
- **Loading States**: Skeleton loaders for better UX
- **Empty States**: Helpful illustrations when no data

### 📱 Responsive Design

**Mobile-First Approach**
- Sidebar collapses to hamburger menu on mobile
- Tables become cards on small screens
- Touch-friendly buttons and interactions
- Swipe gestures for mobile actions

**Breakpoints**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px  
- Desktop: 1024px+

### 🔧 Key Features to Implement

**1. Policy Upload Component**
```typescript
// Features needed:
- Drag & drop PDF upload
- File validation (PDF only, max 10MB)
- Upload progress indicator
- Auto-processing notification
- Error handling for failed uploads
```

**2. Policy List Component**
```typescript
// Features needed:
- Pagination (20 items per page)
- Sorting by any column
- Filtering by carrier, coverage type, status
- Bulk selection for operations
- Quick view modal for policy details
```

**3. Search Interface**
```typescript
// Features needed:
- Debounced search input
- Search suggestions/autocomplete
- Filter chips for active filters
- Search history (local storage)
- Clear search functionality
```

**4. Alert System**
```typescript
// Features needed:
- Real-time alert badges
- Alert dropdown/panel
- Different alert types with icons
- Mark as read functionality
- Alert preferences settings
```

**5. PDF Viewer Component**
```typescript
// Features needed:
- Embedded PDF viewer
- Zoom in/out controls
- Page navigation
- Download button
- Fullscreen mode
```

## 🗂️ File Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── policy/          # Policy-specific components
│   ├── search/          # Search-related components
│   └── alerts/          # Alert components
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── Policies.tsx
│   ├── PolicyDetail.tsx
│   ├── Search.tsx
│   ├── Claims.tsx
│   ├── Alerts.tsx
│   └── Reports.tsx
├── hooks/               # Custom React hooks
│   ├── useApi.ts
│   ├── usePolicies.ts
│   ├── useSearch.ts
│   └── useAlerts.ts
├── lib/                 # Utilities and configurations
│   ├── api.ts           # API client
│   ├── utils.ts         # Helper functions
│   └── types.ts         # TypeScript types (copy from backend)
├── store/               # State management
│   ├── policyStore.ts
│   ├── alertStore.ts
│   └── userStore.ts
└── assets/              # Static assets
    ├── images/
    └── icons/
```

## 🚀 Implementation Priority

**Phase 1: Core Foundation (Week 1)**
1. Set up project structure with Vite + React + TypeScript
2. Install and configure UI library (Shadcn/ui)
3. Create layout components (Header, Sidebar, MainLayout)
4. Set up API client and types from backend
5. Implement routing structure

**Phase 2: Policy Management (Week 2)**
1. Policy upload component with drag & drop
2. Policy list with pagination and sorting
3. Policy detail view with PDF viewer
4. Basic search functionality
5. Delete policy confirmation

**Phase 3: Advanced Features (Week 3)**
1. Advanced search with filters
2. Alert system and notifications
3. Claims management pages
4. Dashboard with statistics
5. Reports and analytics

**Phase 4: Polish & Production (Week 4)**
1. Mobile responsiveness
2. Loading states and error handling
3. Performance optimization
4. Testing and bug fixes
5. Production deployment setup

## 📊 Data Flow Examples

**Policy Upload Flow**
```typescript
1. User drags PDF to upload area
2. Validate file (PDF, <10MB)
3. Show upload progress
4. Call POST /v1/policies/upload
5. Show processing notification
6. Refresh policy list
7. Navigate to new policy detail
```

**Search Flow**
```typescript
1. User types in search box (debounced)
2. Call GET /v1/search?q=query
3. Display results with highlights
4. Allow filtering results
5. Save search to history
6. Enable saved searches
```

**Alert Flow**
```typescript
1. Fetch alerts on app load: GET /v1/alerts
2. Display alert badge with count
3. Show alerts in dropdown/panel
4. Allow mark as read (local state)
5. Auto-refresh alerts every 5 minutes
```

## 🎯 Success Metrics

**User Experience**
- Page load time < 2 seconds
- Upload success rate > 95%
- Search results in < 500ms
- Zero-click policy access from dashboard

**Technical Quality**
- TypeScript strict mode enabled
- Component test coverage > 80%
- Lighthouse score > 90
- Zero console errors in production

## 🔗 Resources Provided

**From Backend (Already Available)**
1. **Complete API Documentation**: `http://localhost:8001/docs`
2. **TypeScript Types**: Copy from `backend/docs/types.ts`
3. **API Client Example**: Copy from `backend/docs/api-client.ts`
4. **Integration Guide**: See `backend/docs/FRONTEND_INTEGRATION.md`

**Sample API Responses**
```typescript
// Policy List Response
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "policy_number": "POL-2024-001",
        "carrier": "State Farm",
        "coverage_type": "Auto",
        "status": "active",
        "effective_date": "2024-01-01",
        "expiration_date": "2025-01-01",
        "premium": 1200.00,
        "confidence": 89,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20,
    "pages": 1
  }
}

// Search Response
{
  "success": true,
  "data": {
    "items": [...],
    "total": 5,
    "query": "auto insurance",
    "execution_time": 0.045
  }
}

// Alerts Response
{
  "success": true,
  "data": [
    {
      "id": "alert_1",
      "type": "policy_expiring",
      "severity": "warning",
      "title": "Policy Expiring Soon",
      "message": "POL-2024-001 expires in 30 days",
      "policy_id": 1,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## 🎉 FINAL NOTES

**Backend is 100% Ready!** 
- All API endpoints are tested and operational
- Complete documentation provided
- TypeScript definitions available
- Sample implementations included

**Your Focus**: Create an amazing user experience for insurance professionals to manage their policies, search documents, track claims, and stay on top of important alerts.

**Expected Outcome**: A modern, responsive, and intuitive insurance management dashboard that makes complex policy management simple and efficient.

**Good luck building something amazing!** 🚀💪
