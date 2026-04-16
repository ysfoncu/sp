# Student Placement Management System - Architecture Overview

## System Overview

A comprehensive web application for managing student placements (praksis) in healthcare organizations. The system supports coordinators and teachers in managing quotas, students, supervisors, and placement workflows.

---

## Core User Roles

### Coordinator (PK - Praksiskoordinator)
- Primary system user
- Manages quotas, students, and placements
- Approves and coordinates placement requests
- Configures workflows and system settings

---

## Main Modules

### 1. **Dashboard**
**Purpose:** Central hub providing system-wide overview and quick actions

**Key Features:**
- System statistics (students, quotas, placements)
- Recent activity feed
- Quick action shortcuts
- Status indicators for pending tasks

---

### 2. **Student Management**
**Purpose:** Manage student records and placement assignments

**Key Features:**
- Student list with filtering and search
- Student profile details
- Placement history tracking
- Assignment status management
- Bulk operations support

**Key Views:**
- Student List Table
- Student Detail View
- Quick Assign Modal (batch assignments)

---

### 3. **Praksis Places Management**
**Purpose:** Manage healthcare organizations and their hierarchical structure

**Key Features:**
- Hierarchical organization tree (8 levels)
  - Helseforetak (Health Trust)
  - Kommune (Municipality)
  - Klinikk (Clinic)
  - Sykehjem (Nursing Home)
  - Avdeling (Department)
  - Seksjon (Section)
  - Gruppe (Group)
  - Sengepost (Ward)
- Color-coded organization types
- Breadcrumb navigation
- Search and filter across hierarchy
- Auto-expanding tree on search

**Key Views:**
- Split Layout (Tree + Details)
- Contacts Tab (contact persons at each level)
- Supervisors Tab (supervisors with student assignments)
- Slots Tab (student capacity configuration)

---

### 4. **Quota Management**
**Purpose:** Manage placement quotas and availability

**Key Features:**
- Coordinator quota requests
- Bi-directional quota management
- Quota availability tracking
- Request and approval workflows
- "Request Quota" shortcut button
- Smart matching logic
- Conflict detection

**Key Components:**
- Available Quotas Table (simplified filtering)
- Quota Request Forms
- Approval Interface
- Quick Assign Students Modal

### 4.1 Dialog State Structure

```typescript
// Step 1 State
{
  startDate: Date,
  endDate: Date,
  semester: string,
  program: string,
  emne: string // Optional subject code
}

// Step 2 State
{
  parentPraksisPlace: {
    id: string,
    name: string,
    type: string,
    organizationStructure: OrganizationNode
  },
  entityDistributions: [
    {
      entityId: string,
      entityName: string,
      entityType: string,
      entityPath: string,
      requested: number,
      contactId: string,
      contactName: string
    }
  ]
}

// Step 3 State (read-only summary)
- Combines Step 1 + Step 2 data
- Adds notes field
```

---

### 5. **Supervisor Management**
**Purpose:** Track and manage placement supervisors

**Key Features:**
- Supervisor directory
- Specialization tracking
- Active/inactive status
- Student assignment tracking
- Hierarchical organization association
- Filter by status and assignments

---

### 6. **Contact Management**
**Purpose:** Manage contact persons across organizations

**Key Features:**
- Contact directory
- Multiple contact types
- Organization association
- Hierarchical filtering
- Contact type categorization

---

### 7. **Workflow Management**
**Purpose:** Configure optional workflow steps

**Key Features:**
- Workflows settings page
- Enable/disable workflow steps
- Configurable approval processes
- Workflow customization

---

### 8. **Onboarding System**
**Purpose:** Guide users through system features

**Key Features:**
- Page-aware onboarding overlays
- Step-by-step guidance
- Contextual help
- Access-controlled views
- Help button integration

---

## Key Workflows

### Quota Request Workflow
1. Coordinator browses available quotas
2. Selects quota and requests
3. System detects conflicts (if any)
4. Approval process (if enabled)
5. Quota becomes available
6. Students can be assigned

### Student Assignment Workflow
1. Coordinator views available quotas
2. Uses "Quick Assign Students" modal
3. Batch selects students
4. System validates assignments
5. Assignments confirmed
6. Students notified (future)

### Placement Capacity Configuration
1. Coordinator navigates to Praksis Place
2. Selects organization node
3. Opens Slots tab
4. Configures student capacity per semester
5. Views all sub-places (optional)
6. Saves capacity settings

---

## System Architecture Layers

### Presentation Layer
- **React Components** - Modular UI components
- **Routing** - React Router for navigation
- **State Management** - React hooks (useState, useEffect)
- **Styling** - Tailwind CSS for responsive design

### Business Logic Layer
- **Filtering & Search** - Client-side data filtering
- **Validation** - Form and data validation
- **Conflict Detection** - Smart matching and conflict checking
- **Hierarchical Navigation** - Tree traversal and path finding

### Data Layer
- **Mock Data** - Development data structures
- **Future: Supabase Integration** - Backend persistence (optional)
- **Local State** - Component-level state management

---

## Data Structures (Conceptual)

### Core Entities

#### Students
- Identity information
- Program details
- Placement status
- Assignment history

#### Praksis Places (Organizations)
- Hierarchical structure (parent-child relationships)
- Organization type and level
- Location information
- Capacity settings (slots)

#### Quotas
- Organization association
- Time period (semester)
- Availability status
- Capacity limits

#### Supervisors
- Identity and contact
- Specialization
- Organization association
- Active status
- Student assignments

#### Contacts
- Identity and contact information
- Contact type
- Organization association

---

## Key Features

### Hierarchical Organization Management
- 8-level deep organization tree
- Parent-child relationships
- Path-based navigation
- Recursive data traversal
- Filter inheritance (show/hide children)

### Smart Search & Filtering
- Search across hierarchy
- Auto-expand matching nodes
- Multi-level filtering
- Type-based filtering
- Status-based filtering

### Access Control
- Role-based features
- Page-specific permissions
- Onboarding access control

### User Experience
- Split-panel layouts
- Tab-based navigation
- Pagination for large datasets
- Color-coded visual hierarchy
- Breadcrumb trails
- Empty states with guidance

---

## Navigation Structure

```
├── Dashboard (/)
├── Students (/students)
│   └── Student Detail (/students/:id)
├── Praksis Places (/praksis-places)
│   ├── Contacts Tab
│   ├── Supervisors Tab
│   └── Slots Tab
├── Quotas (/quotas)
│   └── Available Quotas View
├── Settings (/settings)
│   └── Workflows (/settings/workflows)
└── Help & Onboarding
```

---

## Design Patterns

### Component Patterns
- **Container/Presentational** - Separation of logic and UI
- **Composition** - Nested component hierarchies
- **Controlled Components** - Form inputs with state
- **Conditional Rendering** - Dynamic UI based on state

### Data Patterns
- **Recursive Structures** - For hierarchical organizations
- **Normalized Data** - References between entities
- **Computed Values** - Derived data from base entities
- **State Lifting** - Shared state in parent components

### UI Patterns
- **Master-Detail** - List with detail panel
- **Tree Navigation** - Expandable/collapsible hierarchy
- **Tab Panels** - Grouped related content
- **Modal Dialogs** - Focused interactions
- **Pagination** - Large dataset handling
- **Filter Chips** - Visual active filters
- **Badge Indicators** - Status and type visualization

---

## Future Considerations

### Potential Enhancements
- Real-time notifications
- Email integration
- Document management
- Reporting and analytics
- Calendar integration
- Mobile responsive optimizations
- Offline support
- Multi-language support

### Scalability
- Backend API integration (Supabase)
- Database persistence
- User authentication
- Role-based access control (RBAC)
- Audit logging
- Data export capabilities

---

## System Constraints

### Current Limitations
- Client-side only (no backend)
- Mock data for development
- No persistent storage
- Single user session
- No real authentication

### Design Decisions
- Simplified quota management (removed Quota Offerings)
- Removed SK-User/ContactPerson complexity
- Coordinator-focused workflow
- Hierarchical organization structure throughout
- Page-aware onboarding system

---

## Technology Stack (High Level)

- **Frontend Framework:** React
- **Routing:** React Router (Data mode)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **UI Components:** Custom component library
- **State Management:** React Hooks
- **Future Backend:** Supabase (optional)

---

## Key Success Metrics

- Efficient quota management workflow
- Clear hierarchical navigation
- Intuitive student assignment process
- Comprehensive supervisor tracking
- Flexible capacity configuration
- User-friendly onboarding experience

---

## Step 1: Date Selection & Basic Info
**Purpose:** Capture time period first to guide available entities

**Fields:**
- Semester/Period selector
- Start Date (date picker)
- End Date (date picker)
- Program/Course (if applicable)
- Emne/Subject Code (optional)

**Validation:**
- End date must be after start date
- No overlapping periods (optional warning)

**UI Layout:**
```
┌────────────────────────────────────────┐
│  Step 1: Select Period                 │
├────────────────────────────────────────┤
│                                        │
│  Semester:     [Fall 2024 ▼]          │
│                                        │
│  Start Date:   [📅 01/09/2024]        │
│                                        │
│  End Date:     [📅 31/12/2024]        │
│                                        │
│  Program:      [Nursing ▼]            │
│                                        │
│  Emne:         [SYP2000_______]       │
│                (optional)              │
│                                        │
│         [Cancel]  [Next: Select Place] │
└────────────────────────────────────────┘
```