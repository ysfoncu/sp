# Implementation Plan: Separate Quotas Table in Step 1/6 (Placement Details)

## Overview
Create a dedicated table in the Placement Details view (Step 1/6) to display available quotas from two sources:
1. **Offered Quotas** - Quotas offered by SK contact persons
2. **Requested & Approved Quotas** - Quotas requested by PK coordinators and approved by SK persons

## Current State Analysis

### Current Components
- **PlacementTaskView.tsx** - Main view for managing student placements
- **PlacementMetadataModal.tsx** - Modal for entering placement metadata (study, program, dates)
- **SlideOverManageQuota.tsx** - Current quota management interface
- **RequestQuotaModal.tsx** - Modal for requesting quotas from SK persons

### Current Data Sources
1. **quotaOfferings** (QuotaOffering[]) - Quotas offered by SK persons
2. **coordinatorQuotaRequests** (CoordinatorQuotaRequest[]) - Quotas requested by PK persons
3. **quotas** (QuotaSelection[]) - Currently selected/imported quotas (local state)

### Current Issues
- Managing multiple quota functionalities in one table is confusing
- Hard to distinguish between offered, requested, and approved quotas
- No clear visibility of which quotas are available for assignment
- Assignment tracking is not easily visible

## Proposed Solution

### 1. New Component: AvailableQuotasTable

**Location:** `/components/AvailableQuotasTable.tsx`

**Purpose:** Display all available quotas (offered + approved requests) with assignment tracking

**Table Columns:**
| Column | Description | Display Logic |
|--------|-------------|---------------|
| Praksis Place | Name of the praksis place | Standard text display |
| Department | Department within the place | Standard text display |
| Added Quota | Total quota capacity | Show normally if status is 'active' or 'approved'<br>Show with badge/chip if status is 'pending' |
| Assigned | Number of students assigned | Count of students assigned to this quota |
| Available | Remaining capacity | Added Quota - Assigned |
| Quick Assign | Quick action button | Button to open student assignment modal |

**Props Interface:**
```typescript
interface AvailableQuotasTableProps {
  // Data sources
  quotaOfferings: QuotaOffering[];
  coordinatorQuotaRequests: CoordinatorQuotaRequest[];
  students: Student[];
  praksisPlaces: PraksisPlace[];
  
  // Placement context for filtering
  placementId: string;
  studyId?: string;
  programId?: string;
  startDate?: string;
  endDate?: string;
  
  // Actions
  onQuickAssign: (quotaInfo: {
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
  }) => void;
  
  onRequestMoreQuotas?: () => void;
}
```

### 2. Data Aggregation Logic

**Combined Quota Item Structure:**
```typescript
interface CombinedQuotaItem {
  // Identification
  praksisPlaceId: string;
  praksisPlaceName: string;
  departmentId: string;
  departmentName: string;
  
  // Capacity tracking
  totalCapacity: number;
  assignedCount: number;
  availableCount: number;
  
  // Source information
  source: 'offered' | 'requested';
  status: 'active' | 'approved' | 'pending';
  
  // Original data references
  offeringId?: string;
  requestId?: string;
  
  // Dates
  startDate: string;
  endDate: string;
}
```

**Aggregation Steps:**
1. Filter quotaOfferings by:
   - Status === 'active'
   - Study/Program match
   - Date overlap with placement dates
   
2. Filter coordinatorQuotaRequests by:
   - placementId matches (if assigned to specific placement)
   - OR study/program matches (for general requests)
   - Status === 'approved' or 'pending'
   - Date overlap with placement dates

3. Merge both sources:
   - Group by (praksisPlaceId + departmentId)
   - Sum capacities if same place/department from multiple sources
   - Track source for display purposes

4. Calculate assignment counts:
   - Count students where assignedPraksisPlace matches this quota
   - Calculate available = total - assigned

### 3. UI/UX Design

#### Table Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Available Quotas                                    [+ Request More]   │
├─────────────────┬──────────────┬──────────┬──────────┬──────────┬──────┤
│ Praksis Place   │ Department   │ Added    │ Assigned │Available │ Action│
├─────────────────┼──────────────┼──────────┼──────────┼──────────┼──────┤
│ Oslo Hospital   │ Emergency    │ 10       │ 8        │ 2        │[Assign]│
│ Bergen Clinic   │ Pediatrics   │ 5 ⏰     │ 0        │ 5*       │[Assign]│
│ Trondheim Med   │ Surgery      │ 15       │ 12       │ 3        │[Assign]│
└─────────────────┴──────────────┴──────────┴──────────┴──────────┴──────┘

Legend:
⏰ = Pending approval (show with amber/yellow badge)
* = Available count for pending quotas shown but grayed out/disabled
```

#### Status Badges
- **Active/Approved Quotas**: No badge, just number
- **Pending Quotas**: Show with `<Badge variant="outline" className="text-amber-600">5 ⏰ Pending</Badge>`

#### Empty States
1. **No quotas at all**:
   ```
   ┌─────────────────────────────────────────────────┐
   │  No quotas available                             │
   │  Get started by requesting quotas from praksis   │
   │  places                                          │
   │                    [Request Quotas]              │
   └─────────────────────────────────────────────────┘
   ```

2. **All quotas fully assigned**:
   ```
   ┌─────────────────────────────────────────────────┐
   │  All quotas are fully assigned                   │
   │  Need more capacity?                             │
   │                    [Request More]                │
   └─────────────────────────────────────────────────┘
   ```

### 4. Integration with PlacementTaskView

#### Placement in UI
Insert the `AvailableQuotasTable` component after the metadata form and before the student list in Step 1/6.

**Visual Structure:**
```
┌─────────────────────────────────────────────┐
│ Step 1/6: Setup Students & Quotas          │
├─────────────────────────────────────────────┤
│                                             │
│ [Placement Metadata Form]                  │
│ - Study, Program, Dates, etc.              │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│ [Available Quotas Table] ← NEW             │
│ - Shows offered + approved quotas          │
│ - Assignment tracking                      │
│ - Quick assign buttons                     │
│                                             │
│ ─────────────────────────────────────────  │
│                                             │
│ [Existing Student Table/List]              │
│ - Import students button                   │
│ - Student assignments                      │
│                                             │
└─────────────────────────────────────────────┘
```

#### State Management
```typescript
// In PlacementTaskView.tsx
const [showQuotaTable, setShowQuotaTable] = useState(false);

// Show quota table only after placement metadata is filled
useEffect(() => {
  const hasMetadata = metadataFormData.studyId && 
                     metadataFormData.programId && 
                     metadataFormData.startDate && 
                     metadataFormData.endDate;
  setShowQuotaTable(hasMetadata && placement.status !== 'draft');
}, [metadataFormData, placement.status]);
```

#### Event Handlers
```typescript
// Quick Assign Handler
const handleQuickAssign = (quotaInfo: QuotaInfo) => {
  // Filter unassigned students
  const unassignedStudents = students.filter(s => !s.assignedPraksisPlace);
  
  if (unassignedStudents.length === 0) {
    toast.error('No unassigned students available');
    return;
  }
  
  if (quotaInfo.availableCapacity === 0) {
    toast.error('No available capacity in this quota');
    return;
  }
  
  // Open assignment modal with pre-filtered options
  setSelectedQuotaForAssignment(quotaInfo);
  setIsQuickAssignModalOpen(true);
};

// Request More Handler
const handleRequestMoreQuotas = () => {
  setIsRequestQuotaModalOpen(true);
};
```

### 5. Implementation Steps

#### Step 1: Create AvailableQuotasTable Component
- [ ] Create `/components/AvailableQuotasTable.tsx`
- [ ] Define TypeScript interfaces
- [ ] Implement data aggregation logic
- [ ] Create table UI with proper columns
- [ ] Add status badges for pending quotas
- [ ] Implement empty states
- [ ] Add Quick Assign button handlers

#### Step 2: Add Helper Functions
- [ ] Create `aggregateAvailableQuotas()` function
- [ ] Create `calculateAssignedCount()` function
- [ ] Create `filterQuotasByPlacement()` function
- [ ] Add date overlap checking utility

#### Step 3: Integrate into PlacementTaskView
- [ ] Import AvailableQuotasTable component
- [ ] Add state for quota table visibility
- [ ] Add quick assign modal state
- [ ] Position component in UI (after metadata, before students)
- [ ] Wire up event handlers
- [ ] Add conditional rendering logic

#### Step 4: Update Quick Assign Flow
- [ ] Create/update QuickAssignModal component
- [ ] Pre-populate with quota information
- [ ] Filter student list to show only unassigned
- [ ] Handle assignment submission
- [ ] Update both student state and quota display

#### Step 5: Testing & Refinement
- [ ] Test with only offered quotas
- [ ] Test with only requested quotas
- [ ] Test with mixed quotas
- [ ] Test with pending quotas
- [ ] Test assignment tracking updates
- [ ] Test edge cases (no quotas, all assigned, etc.)
- [ ] Verify auto-import quotas still works
- [ ] Verify Step 1/6 auto-completion logic

### 6. File Changes Required

#### New Files
1. `/components/AvailableQuotasTable.tsx` - Main table component
2. `/components/QuickAssignModal.tsx` - Quick assignment modal (if separate from existing)

#### Modified Files
1. `/components/PlacementTaskView.tsx`
   - Import AvailableQuotasTable
   - Add table in render section
   - Add event handlers
   - Update state management

2. `/components/SlideOverAssignStudent.tsx` (optional)
   - May need updates to support quick assign mode
   - Pre-filter by quota availability

### 7. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PlacementTaskView (Parent)                                      │
│                                                                  │
│  State:                                                          │
│  - quotaOfferings (from props)                                  │
│  - coordinatorQuotaRequests (from props)                        │
│  - students (local state)                                       │
│  - metadataFormData (local state)                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ AvailableQuotasTable                                   │    │
│  │                                                         │    │
│  │  Props:                                                 │    │
│  │  - quotaOfferings          ────────────┐               │    │
│  │  - coordinatorQuotaRequests ───────┐   │               │    │
│  │  - students                ────┐   │   │               │    │
│  │  - placement context       │   │   │   │               │    │
│  │                            ▼   ▼   ▼   ▼               │    │
│  │                    [Aggregate Data]                     │    │
│  │                            │                            │    │
│  │                            ▼                            │    │
│  │                    [Display Table]                      │    │
│  │                            │                            │    │
│  │                            ▼                            │    │
│  │              [Quick Assign Button Clicked]              │    │
│  │                            │                            │    │
│  │                            └──────────────────────┐     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                        │         │
│                                                        ▼         │
│                                          onQuickAssign()        │
│                                                        │         │
│                                                        ▼         │
│                                          [Open Assignment Modal]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8. Code Structure

#### Aggregation Logic (pseudocode)
```typescript
function aggregateAvailableQuotas(
  quotaOfferings: QuotaOffering[],
  coordinatorRequests: CoordinatorQuotaRequest[],
  students: Student[],
  placementContext: PlacementContext
): CombinedQuotaItem[] {
  const quotaMap = new Map<string, CombinedQuotaItem>();
  
  // Process offered quotas
  for (const offering of quotaOfferings) {
    if (matchesPlacementContext(offering, placementContext)) {
      const key = `${offering.praksisPlaceId}_${offering.departmentId}`;
      addOrMergeQuota(quotaMap, key, {
        source: 'offered',
        status: offering.status,
        capacity: offering.capacity,
        ...offering
      });
    }
  }
  
  // Process coordinator requests
  for (const request of coordinatorRequests) {
    if (matchesPlacementContext(request, placementContext)) {
      const key = `${request.praksisPlaceId}_${request.departmentId}`;
      addOrMergeQuota(quotaMap, key, {
        source: 'requested',
        status: request.status,
        capacity: request.requestedCapacity,
        ...request
      });
    }
  }
  
  // Calculate assigned counts
  const items = Array.from(quotaMap.values());
  for (const item of items) {
    item.assignedCount = students.filter(s => 
      s.assignedPraksisPlace?.placeId === item.praksisPlaceId &&
      s.assignedPraksisPlace?.departmentId === item.departmentId
    ).length;
    item.availableCount = item.totalCapacity - item.assignedCount;
  }
  
  return items.sort((a, b) => 
    a.praksisPlaceName.localeCompare(b.praksisPlaceName)
  );
}
```

### 9. Visual Design Specifications

#### Colors
- **Pending Badge**: `bg-amber-50 text-amber-700 border-amber-300`
- **Available Count (positive)**: `text-green-600 font-medium`
- **Available Count (zero)**: `text-gray-400`
- **Assigned Count**: `text-blue-600`

#### Icons
- **Pending**: `<Clock className="h-3 w-3" />` from lucide-react
- **Quick Assign**: `<UserPlus className="h-4 w-4" />` from lucide-react
- **Request More**: `<Plus className="h-4 w-4" />` from lucide-react

#### Spacing
- Table padding: `p-6`
- Row padding: `py-3 px-4`
- Button spacing: `gap-2`

### 10. Success Criteria

✅ **Functional Requirements**
- [ ] Table displays all offered quotas matching placement context
- [ ] Table displays all approved coordinator requests
- [ ] Pending requests shown with visual indicator
- [ ] Assignment counts update in real-time
- [ ] Quick Assign button opens assignment modal
- [ ] Only quotas with available capacity allow assignment
- [ ] Empty states guide users appropriately

✅ **Technical Requirements**
- [ ] Component is reusable and well-typed
- [ ] No performance issues with large datasets
- [ ] Data aggregation is accurate
- [ ] State management is clean and predictable
- [ ] All edge cases handled gracefully

✅ **UX Requirements**
- [ ] Clear visual distinction between different quota states
- [ ] Intuitive workflow for assigning students
- [ ] Helpful empty states and error messages
- [ ] Responsive and accessible design
- [ ] Consistent with existing design system

### 11. Future Enhancements (Out of Scope)

- Bulk assignment from quota table
- Filter/search within quota table
- Sort by different columns
- Export quota allocation report
- Quota utilization charts/graphs
- Historical quota tracking

---

## Timeline Estimate

- **Step 1**: 2-3 hours (Component creation)
- **Step 2**: 1 hour (Helper functions)
- **Step 3**: 1-2 hours (Integration)
- **Step 4**: 1 hour (Quick assign flow)
- **Step 5**: 2 hours (Testing)

**Total: 7-9 hours**

## Dependencies

- Existing quota offering system must be functional
- Coordinator quota request system must be functional
- Student assignment system must be functional
- Placement metadata must be properly stored

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data sync issues between sources | Implement proper React key props and useEffect dependencies |
| Performance with large datasets | Use React.memo and useMemo for expensive calculations |
| Confusion with multiple quota sources | Clear visual indicators and tooltips |
| Assignment conflicts | Validate capacity before allowing assignment |
