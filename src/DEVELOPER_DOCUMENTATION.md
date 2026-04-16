# Student Placement Management System - Developer Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles](#user-roles)
3. [Core Workflows](#core-workflows)
4. [Key Features](#key-features)
5. [Technical Architecture](#technical-architecture)
6. [Data Models](#data-models)
7. [Component Structure](#component-structure)
8. [Authentication System](#authentication-system)
9. [State Management](#state-management)
10. [Important Business Logic](#important-business-logic)

---

## System Overview

The Student Placement Management System is a comprehensive web application designed to manage student placements at praksis (internship) locations. The system coordinates the workflow between educational coordinators/teachers and contact persons at praksis places.

### Main Objectives
- Import and manage student lists
- Create and manage praksis place quotas
- Assign students to praksis places
- Handle quota requests and approvals
- Track placement progress through guided tasks
- Provide multiple views (Table, Gantt chart, Calendar)

---

## User Roles

### 1. PK (Praksis Koordinator) - Coordinator/Teacher Role

**Access Code Format**: 8-character static code

**Responsibilities:**
- Import student lists
- Create and manage praksis places
- Add fixed quotas to praksis places
- Request additional quotas from SK contacts
- Assign students to praksis places (direct assignment or request)
- Monitor overall placement progress
- Manage placement workflows through guided tasks

**Key Permissions:**
- Full CRUD operations on students
- Full CRUD operations on praksis places
- Can create direct assignments (auto-approved)
- Can create quota requests to SK contacts
- Can view all placement data
- Access to dashboard, settings, and all management features

### 2. SK (Stedkontakt) - Contact Person Role

**Access Code Format**: 8-character static code

**Responsibilities:**
- Review incoming student assignment requests
- Approve or reject assignment requests
- Review and respond to quota requests
- View students assigned to their praksis place
- Manage their praksis place information

**Key Permissions:**
- Read-only access to students assigned to them
- Approve/reject assignment requests for their place
- Approve/reject quota requests for their place
- Limited dashboard view (only their place data)
- Cannot create new placements or students

---

## Core Workflows

### 1. Placement Creation Workflow (PK Role)

```
Step 1: Import Students (Task 1/7)
├─ Click "Import students" button
├─ System imports mock student data
└─ Task auto-completes when students.length > 0

Step 2: Add/Request Quotas (Task 2/7)
├─ Click "Manage quotas" on a praksis place
├─ Add fixed quotas (immediate)
├─ OR request quotas from SK (requires approval)
└─ Task auto-completes when totalQuotas >= students.length

Step 3: Assign Students (Task 3/7)
├─ Select students from table
├─ Click "Assign student" button
├─ Choose praksis place and department
├─ Select assignment type:
│  ├─ Direct Assignment → Auto-approved
│  └─ Request Assignment → Needs SK approval
└─ Task tracks assignment progress

Step 4: Wait for SK Approvals (if requests sent)
├─ SK receives notification of requests
├─ SK approves or rejects
└─ Approved requests become "approved_assignment"

Step 5: Complete Remaining Tasks
├─ Task 4/7: Send documents
├─ Task 5/7: Schedule meetings
├─ Task 6/7: Follow up
└─ Task 7/7: Complete placement
```

### 2. Assignment Type Logic

**Direct Assignment** (Auto-approved):
```
PK creates assignment → Status: "approved_assignment"
├─ No SK approval needed
├─ Immediately visible to SK
└─ Counts toward quota usage
```

**Request Assignment** (Manual approval):
```
PK creates assignment → Status: "request"
├─ SK receives approval request
├─ SK approves → Status: "approved_assignment"
├─ SK rejects → Status: "rejected_assignment"
└─ Only approved requests count toward quota
```

### 3. Quota Request Workflow

```
PK Requests Quota:
├─ Opens "Manage quotas" slide-over
├─ Adds request quota amount
├─ Request sent to SK
└─ Status: "pending"

SK Reviews Request:
├─ Receives notification
├─ Reviews request details
├─ Approves → requestQuotaStatus: "approved"
│  └─ Approved quota added to totalQuotas
└─ Rejects → requestQuotaStatus: "rejected"
   └─ Request removed from available quotas
```

---

## Key Features

### 1. Step-by-Step Task System (7 Tasks)

**Task 1/7: Import Students**
- Auto-completes when `students.length > 0`
- Imports mock student data for prototype

**Task 2/7: Add/Request Quotas**
- Auto-completes when `totalQuotas >= students.length`
- Recalculates on every state change
- Includes both fixed quotas and approved request quotas

**Task 3/7 - 7/7**: Manual completion tasks
- Track document sending, meetings, follow-ups, etc.
- Can be marked complete via modal

### 2. Quota Management System

**Total Quotas Calculation**:
```javascript
totalQuotas = totalFixedQuotas + totalApprovedRequestQuotas
```

**Fixed Quotas**:
- Added directly by PK
- Immediately available
- No approval needed

**Approved Request Quotas**:
- Requested by PK from SK
- Only count when `requestQuotaStatus === "approved"`
- Dynamically added to total

**Quota Badge Display**:
```
Quota: {totalQuotas} / {activeStudentsCount}
```
- Updates in real-time
- Shown in purple badge at top of placement view

### 3. Dashboard Views

**Table View**:
- List of all students with assignment status
- Filter by status, tags, department
- Column visibility controls
- Bulk selection and actions
- Empty state messages

**Gantt Chart View**:
- Timeline visualization of placements
- Date range controls
- Student grouping

**Calendar View**:
- Monthly calendar display
- Placement date visualization

### 4. Settings & Management

**Praksis Places**:
- Create, edit, delete praksis places
- Manage departments
- Manage contact persons (SK accounts)

**Students**:
- Import students
- Edit student information
- Track assignment status

**Access Codes**:
- Static 8-character codes for testing
- Separate codes for PK and SK roles

### 5. Draft Status Workflow

Students can have draft assignments that are saved but not finalized. Draft assignments:
- Are visible only to PK
- Can be edited before finalization
- Don't count toward quota usage
- Can be converted to actual assignments

### 6. Column Visibility Features

**Students Table**:
- Show/hide columns dynamically
- Saved preferences
- Columns: Status, Department, Tags, Dates, etc.

**Quota Overview Table**:
- Show/hide quota columns
- Toggle between fixed, requested, approved quotas

### 7. Tag Filtering System

- Filter students by tags
- Multi-select tag filters
- Visual tag badges
- Custom tag colors

### 8. Work Status Management

Track student work progress:
- Not started
- In progress
- Completed
- On hold

### 9. Authentication

**Static Access Codes** (for prototype):
- PK Code: `PK123456`
- SK Code: `SK123456`
- 8-character format
- Case-insensitive
- No backend validation (frontend only)

---

## Technical Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router (Data mode)
- **UI Components**: Custom components + shadcn/ui patterns
- **State Management**: React useState/useEffect
- **Icons**: Lucide React
- **Date Handling**: date-fns (recommended)

### Project Structure
```
/
├── App.tsx                          # Main app component
├── routes.ts                        # React Router configuration
├── components/
│   ├── PlacementTaskView.tsx        # Main placement workflow view
│   ├── Dashboard.tsx                # Dashboard with table/gantt views
│   ├── Settings.tsx                 # Settings page
│   ├── LoginPage.tsx                # Authentication page
│   ├── PlacementTasksModal.tsx      # Task management modal
│   ├── SlideOverAssignStudent.tsx   # Student assignment slide-over
│   ├── SlideOverManageQuota.tsx     # Quota management slide-over
│   ├── AISupportSidebar.tsx         # AI assistance panel
│   ├── FirstPublishModal.tsx        # First-time publish workflow
│   └── ui/                          # Reusable UI components
├── types/
│   ├── studentPlacement.ts          # Student placement types
│   ├── praksisPlace.ts              # Praksis place types
│   └── placementTask.ts             # Task and student types
├── imports/                         # Figma imported assets
└── styles/
    └── globals.css                  # Global styles and tokens
```

---

## Data Models

### Student
```typescript
interface Student {
  id: string;
  name: string;
  email: string;
  studentNumber: string;
  department: string;
  status: 'unassigned' | 'pending' | 'assigned' | 'draft';
  tags?: string[];
  assignedPraksisPlace?: {
    placeId: string;
    placeName: string;
    departmentId: string;
    departmentName: string;
    assignmentType: 'direct_assignment' | 'request' | 'approved_assignment' | 'rejected_assignment';
  };
  placementDates?: {
    startDate: string;
    endDate: string;
  };
  workStatus?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  notes?: string;
}
```

### Praksis Place
```typescript
interface PraksisPlace {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  departments: Department[];
  quotas?: Quota[];
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Quota {
  placeId: string;
  departmentId: string;
  fixedQuota: number;      // Directly added quotas
  requestQuota: number;    // Requested quotas (pending approval)
}
```

### Quota Request
```typescript
interface QuotaRequest {
  id: string;
  placementId: string;
  placeId: string;
  placeName: string;
  departmentId: string;
  departmentName: string;
  requestQuota: number;
  requestQuotaStatus: 'pending' | 'approved' | 'rejected';
  requestedBy: string;      // PK user ID
  requestedAt: string;
  reviewedBy?: string;      // SK user ID
  reviewedAt?: string;
  notes?: string;
}
```

### Student Placement
```typescript
interface StudentPlacement {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  students: Student[];
  praksisPlaces: PraksisPlace[];
  quotas: Quota[];
  quotaRequests?: QuotaRequest[];
  createdBy: string;        // PK user ID
  status: 'draft' | 'published' | 'in_progress' | 'completed';
  tasks: PlacementTask[];
}
```

### Placement Task
```typescript
interface PlacementTask {
  id: string;
  step: string;             // "1/7", "2/7", etc.
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  category: 'required' | 'optional';
}
```

---

## Component Structure

### PlacementTaskView.tsx
**Main component for placement workflow**

**Key State Variables**:
```typescript
const [students, setStudents] = useState<Student[]>([]);
const [quotas, setQuotas] = useState<Quota[]>([]);
const [tasks, setTasks] = useState<PlacementTask[]>([]);
const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
const [isAssignSlideOverOpen, setIsAssignSlideOverOpen] = useState(false);
const [isQuotaSlideOverOpen, setIsQuotaSlideOverOpen] = useState(false);
```

**Key Calculated Values**:
```typescript
// Total fixed quotas (directly added)
const totalFixedQuotas = quotas.reduce((sum, q) => sum + q.fixedQuota, 0);

// Total approved request quotas (SK approved)
const totalApprovedRequestQuotas = quotas.reduce((sum, quota) => {
  const matchingRequest = quotaRequests.find(
    (qr) => qr.placementId === placement.id && 
            qr.departmentId === quota.departmentId
  );
  return matchingRequest?.requestQuotaStatus === "approved" 
    ? sum + matchingRequest.requestQuota 
    : sum;
}, 0);

// Total available quotas
const totalQuotas = totalFixedQuotas + totalApprovedRequestQuotas;

// Active students count (non-draft status)
const activeStudentsCount = students.filter(s => s.status !== 'draft').length;
```

**Key Functions**:
- `handleImportStudents()`: Imports mock students and completes Task 1/7
- `handleAssignStudent()`: Assigns selected students to praksis places
- `handleManageQuota()`: Opens quota management slide-over
- `handleTaskComplete()`: Manually marks tasks as complete

### Dashboard.tsx
**Main dashboard with table and Gantt views**

**Features**:
- Tab navigation (Table, Gantt, Calendar)
- Student table with filtering
- Column visibility controls
- Bulk actions
- Empty states

### SlideOverAssignStudent.tsx
**Student assignment interface**

**Assignment Types**:
- Direct Assignment (auto-approved)
- Request Assignment (needs SK approval)

**Validation**:
- Checks available quota before assignment
- Warns if quota exceeded
- Validates date ranges

### SlideOverManageQuota.tsx
**Quota management interface**

**Features**:
- Add fixed quotas
- Request additional quotas from SK
- View quota utilization
- Department-level quota management

---

## Authentication System

### Current Implementation (Prototype)
Static 8-character access codes stored in frontend:

```typescript
// Example codes for testing
const PK_ACCESS_CODE = "PK123456";  // Coordinator/Teacher
const SK_ACCESS_CODE = "SK123456";  // Contact Person
```

### Login Flow
```
User enters 8-character code
↓
Frontend validates format (8 characters)
↓
Check if code matches PK or SK role
↓
Set userRole in state
↓
Redirect to appropriate dashboard
```

### Role-Based Access Control
```typescript
// In App.tsx or auth context
const [userRole, setUserRole] = useState<'PK' | 'SK' | null>(null);

// Conditional rendering based on role
{userRole === 'PK' && <PKFeatures />}
{userRole === 'SK' && <SKFeatures />}
```

### Production Recommendations
For production implementation:
1. Replace static codes with database-backed authentication
2. Implement JWT or session-based auth
3. Add password hashing (bcrypt)
4. Add email verification
5. Implement role-based permissions system
6. Add audit logging for sensitive actions

---

## State Management

### Current Approach
React useState/useEffect for local component state

**Props Drilling**:
- `App.tsx` holds main application state
- Props passed down to child components
- Callbacks passed for state updates

### Key State Flows

**Student Assignment Flow**:
```
PlacementTaskView
├─ selectedStudents (state)
├─ opens SlideOverAssignStudent
│  └─ onAssign callback
└─ updates students array in parent
   └─ triggers useEffect for quota check
      └─ auto-completes Task 2/7 if sufficient
```

**Quota Update Flow**:
```
PlacementTaskView
├─ quotas (state)
├─ opens SlideOverManageQuota
│  └─ onSave callback
└─ updates quotas array
   └─ recalculates totalQuotas
      └─ triggers Task 2/7 completion check
```

### Production Recommendations
For larger scale:
1. Consider React Context API for global state
2. Implement Redux or Zustand for complex state
3. Add proper state persistence (localStorage/backend)
4. Implement optimistic updates
5. Add loading/error states

---

## Important Business Logic

### 1. Task 2/7 Auto-Completion Logic

**Location**: `PlacementTaskView.tsx` lines 791-819

```typescript
useEffect(() => {
  if (students.length > 0) {
    // Check if there are enough total quotas (fixed + approved requests)
    if (totalQuotas >= students.length) {
      // Mark Task 2/7 as complete
      setTasks((prev) =>
        prev.map((t, idx) =>
          idx === 1 ? { ...t, completed: true } : t
        )
      );
    } else {
      // Mark incomplete if quotas are insufficient
      setTasks((prev) =>
        prev.map((t, idx) =>
          idx === 1 ? { ...t, completed: false } : t
        )
      );
    }
  }
}, [students.length, totalQuotas]);
```

**Key Points**:
- Runs on every state change affecting `students.length` or `totalQuotas`
- Uses pre-calculated `totalQuotas` (not recalculating inside effect)
- Marks complete when `totalQuotas >= students.length`
- Marks incomplete when quotas insufficient
- This fixes the selection state loss bug by avoiding unnecessary re-renders

### 2. Quota Calculation

**Fixed Quotas**:
```typescript
const totalFixedQuotas = quotas.reduce(
  (sum, q) => sum + q.fixedQuota,
  0
);
```

**Approved Request Quotas**:
```typescript
const totalApprovedRequestQuotas = quotas.reduce((sum, quota) => {
  const matchingRequest = quotaRequests.find(
    (qr) =>
      qr.placementId === placement.id &&
      qr.departmentId === quota.departmentId
  );
  
  if (matchingRequest?.requestQuotaStatus === "approved") {
    return sum + matchingRequest.requestQuota;
  }
  return sum;
}, 0);
```

**Total Available Quotas**:
```typescript
const totalQuotas = totalFixedQuotas + totalApprovedRequestQuotas;
```

### 3. Assignment Status Logic

**Status Hierarchy**:
```
draft → unassigned → pending → assigned
```

**Status Definitions**:
- `draft`: Saved but not finalized (doesn't count toward quotas)
- `unassigned`: No placement assigned
- `pending`: Request sent to SK (awaiting approval)
- `assigned`: Successfully assigned to praksis place

**Assignment Type → Status Mapping**:
```typescript
if (assignmentType === 'direct_assignment') {
  studentStatus = 'assigned';
  assignmentType = 'approved_assignment'; // Auto-approved
}

if (assignmentType === 'request') {
  studentStatus = 'pending';
  // Awaits SK approval
}

// After SK approval:
if (approved) {
  assignmentType = 'approved_assignment';
  studentStatus = 'assigned';
} else {
  assignmentType = 'rejected_assignment';
  studentStatus = 'unassigned';
}
```

### 4. Quota Validation

**Before Student Assignment**:
```typescript
// Check if department has available quota
const availableQuota = quota.fixedQuota + approvedRequestQuota;
const assignedCount = students.filter(
  s => s.assignedPraksisPlace?.departmentId === departmentId
).length;

const remainingQuota = availableQuota - assignedCount;

if (remainingQuota <= 0) {
  // Show warning: No quota available
  // Still allow assignment but show alert
}
```

### 5. Department Filtering

Students and quotas are filtered by department:
```typescript
const filteredStudents = students.filter(
  s => selectedDepartment === 'all' || s.department === selectedDepartment
);
```

### 6. Empty State Logic

**Students Table Empty State**:
```typescript
if (students.length === 0) {
  return <EmptyState 
    message="No students imported yet"
    action="Import students to get started"
  />;
}
```

**Quota Overview Empty State**:
```typescript
if (quotas.length === 0) {
  return <EmptyState 
    message="No quotas added yet"
    action="Add quotas to praksis places"
  />;
}
```

---

## Key Improvements & Bug Fixes

### Fixed Issues

1. **Quota Badge Not Updating**
   - **Issue**: Badge only showed `totalFixedQuotas`, missing approved request quotas
   - **Fix**: Changed to display `totalQuotas` (fixed + approved)
   - **Location**: PlacementTaskView.tsx line 1071

2. **Task 2/7 Not Auto-Completing**
   - **Issue**: Task didn't progress when SK approved quotas
   - **Fix**: Updated useEffect to use calculated `totalQuotas` and proper dependencies
   - **Location**: PlacementTaskView.tsx lines 791-819

3. **Selection State Loss**
   - **Issue**: Selected items deselected when quotas updated
   - **Fix**: Removed `quotaRequests` from useEffect dependencies, using memoized `totalQuotas` instead
   - **Location**: PlacementTaskView.tsx lines 791-819

4. **Accessibility Warnings**
   - **Issue**: Dialog components missing descriptions
   - **Fix**: Added DialogDescription to all modals
   - **Locations**: All modal components

---

## Testing Scenarios

### Scenario 1: Complete Placement Workflow (PK)
```
1. Login with PK code
2. Click "Import students" → Task 1/7 completes
3. Open "Manage quotas" on a praksis place
4. Add fixed quota = 5
5. Verify Task 2/7 auto-completes (if 5 students)
6. Select students → Click "Assign student"
7. Choose direct assignment → Students assigned immediately
8. Verify quota count updates
9. Complete remaining tasks manually
```

### Scenario 2: Request & Approval Workflow
```
PK Side:
1. Open "Manage quotas"
2. Add request quota = 3
3. Verify request shows as "pending"
4. Request quota NOT counted in totalQuotas yet

SK Side:
5. Login with SK code
6. See pending quota request
7. Click "Approve"
8. Verify request status = "approved"

PK Side:
9. Refresh/reload
10. Verify approved quota NOW counted in totalQuotas
11. Verify Task 2/7 auto-completes if now sufficient
12. Verify quota badge shows updated count
```

### Scenario 3: Assignment Request Workflow
```
PK Side:
1. Select students
2. Click "Assign student"
3. Choose "Request" assignment type
4. Send request
5. Student status = "pending"

SK Side:
6. Login with SK code
7. See pending assignment request
8. Click "Approve" or "Reject"

PK Side:
9. If approved: Student status = "assigned"
10. If rejected: Student status = "unassigned"
```

---

## Production Readiness Checklist

### Backend Requirements
- [ ] Implement real authentication system
- [ ] Create database schema for all models
- [ ] Implement RESTful API or GraphQL
- [ ] Add data validation and sanitization
- [ ] Implement file upload for documents
- [ ] Add email notifications for approvals
- [ ] Implement audit logging
- [ ] Add data backup and recovery

### Frontend Requirements
- [ ] Replace mock data with API calls
- [ ] Add proper error handling and retry logic
- [ ] Implement loading states for all async operations
- [ ] Add form validation with error messages
- [ ] Implement proper state persistence
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Implement responsive design for mobile
- [ ] Add unit and integration tests
- [ ] Add error boundary components
- [ ] Implement analytics tracking

### Security Requirements
- [ ] Implement HTTPS/SSL
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Implement role-based access control (RBAC)
- [ ] Add session timeout
- [ ] Implement secure password policies
- [ ] Add two-factor authentication (optional)
- [ ] Implement data encryption at rest
- [ ] Add security headers

### Performance Requirements
- [ ] Implement pagination for large lists
- [ ] Add lazy loading for components
- [ ] Optimize bundle size (code splitting)
- [ ] Add caching strategy
- [ ] Implement debouncing for search/filter
- [ ] Optimize images and assets
- [ ] Add service worker for offline support
- [ ] Implement virtual scrolling for large tables

### Monitoring & Maintenance
- [ ] Add application monitoring (Sentry, LogRocket)
- [ ] Implement health checks
- [ ] Add performance monitoring
- [ ] Setup CI/CD pipeline
- [ ] Add automated testing
- [ ] Implement feature flags
- [ ] Add user feedback mechanism
- [ ] Setup documentation site

---

## API Endpoints (Recommended Structure)

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh-token
```

### Students
```
GET    /api/students
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
POST   /api/students/import
```

### Praksis Places
```
GET    /api/praksis-places
POST   /api/praksis-places
GET    /api/praksis-places/:id
PUT    /api/praksis-places/:id
DELETE /api/praksis-places/:id
```

### Placements
```
GET    /api/placements
POST   /api/placements
GET    /api/placements/:id
PUT    /api/placements/:id
DELETE /api/placements/:id
POST   /api/placements/:id/publish
```

### Quotas
```
GET    /api/placements/:id/quotas
POST   /api/placements/:id/quotas
PUT    /api/quotas/:id
DELETE /api/quotas/:id
```

### Quota Requests
```
GET    /api/quota-requests
POST   /api/quota-requests
PUT    /api/quota-requests/:id/approve
PUT    /api/quota-requests/:id/reject
```

### Assignments
```
POST   /api/assignments
PUT    /api/assignments/:id/approve
PUT    /api/assignments/:id/reject
DELETE /api/assignments/:id
```

### Tasks
```
GET    /api/placements/:id/tasks
PUT    /api/tasks/:id/complete
PUT    /api/tasks/:id/uncomplete
```

---

## Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=https://api.example.com
REACT_APP_API_TIMEOUT=30000

# Authentication
REACT_APP_AUTH_TOKEN_KEY=placement_auth_token
REACT_APP_SESSION_TIMEOUT=3600000

# Feature Flags
REACT_APP_ENABLE_AI_SUPPORT=true
REACT_APP_ENABLE_GANTT_VIEW=true
REACT_APP_ENABLE_CALENDAR_VIEW=true

# External Services
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_ANALYTICS_ID=your_analytics_id
```

---

## Known Limitations (Prototype)

1. **Mock Data**: All data is frontend-only, no persistence
2. **Static Auth**: Access codes are hardcoded, no real authentication
3. **No Email**: Notifications shown in-app only
4. **No File Upload**: Document attachments not implemented
5. **No Search**: Search functionality is UI-only, not functional
6. **Limited Validation**: Minimal form validation
7. **No Pagination**: All data loaded at once
8. **No Real-time Updates**: Manual refresh needed for updates
9. **Limited Error Handling**: Basic error messages only
10. **No Mobile Optimization**: Designed for desktop primarily

---

## Support & Contact

For questions or issues during development, please contact:
- **Product Owner**: [Contact Info]
- **Design Team**: [Contact Info]
- **Technical Lead**: [Contact Info]

---

## Change Log

### Version 1.0 (Current Prototype)
- Initial implementation of placement workflow
- 7-step task system
- Quota management with requests
- Assignment workflow with approvals
- Dashboard with table and Gantt views
- Authentication system with static codes
- Settings page with CRUD operations
- Fixed quota calculation bugs
- Fixed task auto-completion logic
- Fixed selection state loss issues

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Status**: Prototype Ready for Development
