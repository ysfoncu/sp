# Implementation Plan: Coordinator Quota Request Feature (v2 - Updated)

## Overview
Add a shortcut "Request Quota" button for PK coordinators to request quotas directly from the Placement Details page. This system is **completely separate** from the existing `requestQuota` field in `QuotaSelection` and uses the existing `CoordinatorQuotaRequest` infrastructure.

---

## Key Design Decisions (Based on Clarifications)

### ✅ Confirmed Decisions
1. **Separate Systems**: `CoordinatorQuotaRequest` is independent from `QuotaSelection.requestQuota`
2. **Separate Column**: Add NEW "Coordinator Requests" column (don't merge with existing "Requested Quota" column)
3. **Pre-populate Modal**: Show existing quota rows (praksis place + department) as quick-select options
4. **Placement Context**: Add `placementId` field to `CoordinatorQuotaRequest` for proper filtering
5. **Reuse Existing Components**: Use existing Review modal (`ApproveRejectQuotaModal`) for SK person
6. **Reuse Existing Infrastructure**: All handlers and state management already exist

---

## Current State Analysis

### ✅ Already Exists (No Changes Needed)
- **Data Structure**: `CoordinatorQuotaRequest` type (will add `placementId` field)
- **State Management**: `coordinatorQuotaRequests` state in App.tsx
- **Handlers**: 
  - `handleCoordinatorQuotaRequestCreate` ✅
  - `handleCoordinatorQuotaRequestUpdate` ✅
  - `handleCoordinatorQuotaRequestDelete` ✅
  - `handleCoordinatorQuotaRequestApprove` ✅
  - `handleCoordinatorQuotaRequestReject` ✅
- **PK Display**: `CoordinatorQuotasView` - shows all coordinator requests
- **SK Display**: `QuotaManagementView` with `IncomingQuotaRequestsSection` - shows "Review" button
- **Review Modal**: `ApproveRejectQuotaModal` - complete approve/reject workflow ✅

### ❌ Needs to Be Built/Modified

1. **Update Type**: Add `placementId` to `CoordinatorQuotaRequest`
2. **Create Modal**: `RequestQuotaModal.tsx` (NEW)
3. **Update PlacementTaskView**:
   - Add "Request Quota" button
   - Add new "Coordinator Requests" column
   - Integrate modal with pre-population
   - Update assign button logic
4. **Update App.tsx**: Pass coordinator requests filtered by placement

---

## Implementation Steps

### **STEP 1: Update CoordinatorQuotaRequest Type**

**File**: `/types/coordinatorQuotaRequest.ts`

**Add Field**:
```typescript
export interface CoordinatorQuotaRequest {
  id: string;
  
  // NEW: Link to placement
  placementId: string; // NEW FIELD
  
  // From (Praksis Place)
  praksisPlaceId: string;
  praksisPlaceName: string;
  departmentId: string;
  departmentName: string;
  
  // ... rest of existing fields
}
```

**Rationale**: We need `placementId` to:
- Filter requests per placement
- Show only relevant requests in Placement Details page
- Track which placement context the request was created from

---

### **STEP 2: Create RequestQuotaModal Component**

**File**: `/components/RequestQuotaModal.tsx` (NEW)

#### Purpose
Modal for PK coordinators to quickly request quotas, with smart pre-population from existing quota table.

#### Features
1. **Quick Select Section** (Primary UX):
   - Shows existing quota rows from table
   - Format: "Praksis Place Name - Department Name"
   - User can click to auto-fill form
   - If no quotas exist, show message: "No quotas configured yet. Add manually below."

2. **Manual Entry Section**:
   - Praksis Place dropdown (all available places)
   - Department dropdown (filtered by selected place)
   - Number of places input
   - Date range picker (start/end dates)
   - Optional notes textarea

3. **Read-Only Context**:
   - Display: Study name
   - Display: Program name
   - Display: University name

4. **Validation**:
   - All fields required except notes
   - Number of places > 0
   - End date must be after start date
   - No duplicate requests (same place+dept+dates)

#### Props Interface
```typescript
interface RequestQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => void;
  placement: {
    id: string;
    studyId: string;
    studyName: string;
    programId: string;
    programName: string;
    universityId: string;
    universityName: string;
  };
  existingQuotas: Array<{
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
  }>;
  praksisPlaces: PraksisPlace[];
  currentUserName: string;
  existingRequests: CoordinatorQuotaRequest[]; // To check for duplicates
}
```

#### UI Structure
```
┌──────────────────────────────────────────────────────┐
│ Request Quota                                    [X] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📋 Request Context                                   │
│ ├─ Study: Helse-, sosial og idrettsfag              │
│ ├─ Program: Nursing                                 │
│ └─ University: Oslo University                      │
│                                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                      │
│ ⚡ Quick Select (from existing quotas)              │
│ ┌────────────────────────────────────────────────┐  │
│ │ [○] Oslo Hospital - Cardiology                 │  │
│ │ [○] City Clinic - Pediatrics                   │  │
│ │ [○] Central Hospital - Emergency               │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                      │
│ 📝 Request Details                                   │
│                                                      │
│ Praksis Place *                                      │
│ [Select praksis place ▼]                             │
│                                                      │
│ Department *                                         │
│ [Select department ▼]                                │
│                                                      │
│ Number of Places *                                   │
│ [____]                                               │
│                                                      │
│ Period *                                             │
│ Start Date: [📅 Select date]                         │
│ End Date:   [📅 Select date]                         │
│                                                      │
│ Notes (optional)                                     │
│ [________________________________________]           │
│                                                      │
├──────────────────────────────────────────────────────┤
│                          [Cancel] [Submit Request]   │
└──────────────────────────────────────────────────────┘
```

#### Implementation Notes
- Use Radio buttons for quick select (single selection)
- When radio button clicked, auto-populate praksis place and department fields
- Use `react-hook-form` for form management
- Use date picker from shadcn/ui components
- Validate against existing requests to prevent duplicates

---

### **STEP 3: Update PlacementTaskView Component**

**File**: `/components/PlacementTaskView.tsx`

#### 3.1 Add Props
```typescript
interface PlacementTaskViewProps {
  // ... existing props
  coordinatorQuotaRequests?: CoordinatorQuotaRequest[];
  onCoordinatorQuotaRequestCreate?: (request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => void;
  currentUserName?: string;
}
```

#### 3.2 Add State
```typescript
const [isRequestQuotaModalOpen, setIsRequestQuotaModalOpen] = useState(false);
```

#### 3.3 Add Helper Functions
```typescript
// Get coordinator requests for a specific quota row
const getCoordinatorRequestsForQuota = (quota: QuotaSelection) => {
  if (!coordinatorQuotaRequests) return [];
  
  return coordinatorQuotaRequests.filter(req =>
    req.placementId === placement.id &&
    req.praksisPlaceId === quota.praksisPlaceId &&
    req.departmentId === quota.departmentId &&
    req.studyId === metadataFormData.studyId &&
    req.programId === metadataFormData.programId
  );
};

// Count coordinator requests by status
const countCoordinatorRequestsByStatus = (quota: QuotaSelection) => {
  const requests = getCoordinatorRequestsForQuota(quota);
  return {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.requestedCapacity, 0),
    rejected: requests.filter(r => r.status === 'rejected').length,
  };
};

// Check if can assign based on coordinator requests
const hasApprovedCoordinatorRequests = (quota: QuotaSelection) => {
  const counts = countCoordinatorRequestsByStatus(quota);
  return counts.approved > 0;
};
```

#### 3.4 Add "Request Quota" Button
**Location**: Line ~2110, after "Manage Quotas" button

```typescript
<div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setIsManageQuotaModalOpen(true)}
    className="h-9 px-4 text-sm bg-white hover:bg-gray-50"
  >
    Manage Quotas
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setIsRequestQuotaModalOpen(true)}
    className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
  >
    Request Quota
  </Button>
</div>
```

**Design Note**: Make "Request Quota" button more prominent (blue background) as it's the primary shortcut action.

#### 3.5 Add NEW Table Column: "Coordinator Requests"
**Location**: After "Requested Quota" column (around line 2175+)

**Column Header**:
```typescript
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
  <div className="flex items-center justify-center gap-2">
    <span>Coordinator Requests</span>
    <Tooltip>
      <TooltipTrigger>
        <Info className="h-4 w-4 text-gray-400" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Quota requests submitted to praksis places</p>
      </TooltipContent>
    </Tooltip>
  </div>
</th>
```

**Column Data**:
```typescript
<td className="px-4 py-3 text-center text-sm">
  {(() => {
    const counts = countCoordinatorRequestsByStatus(quota);
    const hasAny = counts.pending > 0 || counts.approved > 0 || counts.rejected > 0;
    
    if (!hasAny) {
      return <span className="text-gray-400">-</span>;
    }
    
    return (
      <div className="flex flex-col items-center gap-1">
        {counts.pending > 0 && (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            {counts.pending} Pending
          </Badge>
        )}
        {counts.approved > 0 && (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 text-xs font-semibold"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {counts.approved} Approved
          </Badge>
        )}
        {counts.rejected > 0 && (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 text-xs opacity-60"
          >
            <XCircle className="h-3 w-3 mr-1" />
            {counts.rejected} Rejected
          </Badge>
        )}
      </div>
    );
  })()}
</td>
```

#### 3.6 Update Assign Button Logic
**Current logic**: Enable when fixed quota or request quota available
**New logic**: ALSO enable when approved coordinator requests exist

```typescript
const canAssignToQuota = (quota: QuotaSelection) => {
  // Check fixed quota availability
  const hasFixedQuota = quota.fixedQuota > 0 && 
    getAvailableQuota(quota.fixedQuota, getAssignedStudentsForQuota(quota.id)) > 0;
  
  // Check request quota availability (existing system)
  const matchingRequest = quotaRequests.find(
    qr => qr.placementId === placement.id && qr.departmentId === quota.departmentId
  );
  const hasApprovedRequestQuota = 
    matchingRequest?.requestQuotaStatus === 'approved' && 
    matchingRequest.requestQuota > 0;
  
  // Check coordinator requests (NEW)
  const hasApprovedCoordinatorRequest = hasApprovedCoordinatorRequests(quota);
  
  return hasFixedQuota || hasApprovedRequestQuota || hasApprovedCoordinatorRequest;
};
```

#### 3.7 Add Modal Component
```typescript
{isRequestQuotaModalOpen && (
  <RequestQuotaModal
    isOpen={isRequestQuotaModalOpen}
    onClose={() => setIsRequestQuotaModalOpen(false)}
    onSubmit={handleRequestQuotaSubmit}
    placement={{
      id: placement.id,
      studyId: metadataFormData.studyId,
      studyName: getStudyName(metadataFormData.studyId),
      programId: metadataFormData.programId,
      programName: getProgramName(metadataFormData.programId),
      universityId: 'oslo-uni-001', // TODO: Get from placement or settings
      universityName: 'Oslo University',
    }}
    existingQuotas={quotas.map(q => ({
      praksisPlaceId: q.praksisPlaceId || q.placeId,
      praksisPlaceName: q.praksisPlaceName || q.placeName,
      departmentId: q.departmentId,
      departmentName: q.departmentName,
    }))}
    praksisPlaces={praksisPlaces}
    currentUserName={currentUserName || 'PK Coordinator'}
    existingRequests={coordinatorQuotaRequests?.filter(
      req => req.placementId === placement.id
    ) || []}
  />
)}
```

#### 3.8 Add Submit Handler
```typescript
const handleRequestQuotaSubmit = (requestData: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => {
  if (onCoordinatorQuotaRequestCreate) {
    onCoordinatorQuotaRequestCreate(requestData);
    setIsRequestQuotaModalOpen(false);
  }
};
```

---

### **STEP 4: Update App.tsx Integration**

**File**: `/App.tsx`

#### 4.1 Update Handler to Include PlacementId
**Location**: Line ~544

**Current**:
```typescript
const handleCoordinatorQuotaRequestCreate = (
  requestData: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>
) => {
  const newRequest: CoordinatorQuotaRequest = {
    ...requestData,
    id: `cqr-${Date.now()}`,
    requestedDate: new Date().toISOString(),
    status: 'pending',
  };
  setCoordinatorQuotaRequests([...coordinatorQuotaRequests, newRequest]);
  toast.success('Quota request submitted successfully');
};
```

**No changes needed** - handler already accepts `placementId` from the modal.

#### 4.2 Pass Props to PlacementTaskView
**Location**: Where PlacementTaskView is rendered (search for `<PlacementTaskView`)

**Add/Update**:
```typescript
<PlacementTaskView
  // ... existing props
  coordinatorQuotaRequests={coordinatorQuotaRequests.filter(
    req => req.placementId === placement.id
  )}
  onCoordinatorQuotaRequestCreate={handleCoordinatorQuotaRequestCreate}
  currentUserName={userRole === 'PK' ? 'John Coordinator' : 'Sarah Contact'}
/>
```

---

### **STEP 5: Verify Existing Components (No Changes)**

#### ✅ CoordinatorQuotasView (PK Person)
**File**: `/components/CoordinatorQuotasView.tsx`

**Current State**: Already displays all coordinator quota requests in table
**Verification Needed**:
- ✅ Shows all requests created by PK person
- ✅ Displays status with proper badges
- ✅ Has delete action for pending requests
- ✅ Shows request details (place, dept, capacity, period)

**No Changes Required** - Works as expected.

---

#### ✅ QuotaManagementView + IncomingQuotaRequestsSection (SK Person)
**Files**: 
- `/components/QuotaManagementView.tsx`
- `/components/IncomingQuotaRequestsSection.tsx`

**Current State**: 
- Shows coordinator requests for SK person's praksis place
- Has "Review" button for pending requests
- Opens `ApproveRejectQuotaModal` on click

**Verification Needed**:
- ✅ Filters requests by praksisPlaceId
- ✅ Shows "Review" button for pending status
- ✅ Displays approved/rejected status with proper badges

**No Changes Required** - Works as expected.

---

#### ✅ ApproveRejectQuotaModal (SK Person Review)
**File**: `/components/ApproveRejectQuotaModal.tsx`

**Current State**:
- Complete modal with approve/reject workflow
- Approve with optional notes
- Reject with required reason
- Shows all request details

**No Changes Required** - Works perfectly.

---

## Visual Changes Summary

### Before vs After

#### Placement Details - Quotas Section

**BEFORE**:
```
┌─────────────────────────────────────────────────────────────┐
│ Quota Overview                [Columns ▼] [Manage Quotas]  │
├─────────────────────────────────────────────────────────────┤
│ Place      │ Dept   │ Added │ Requested │ Assigned │ ...   │
├─────────────────────────────────────────────────────────────┤
│ Hospital A │ Cardio │   5   │     -     │    2     │ ...   │
└─────────────────────────────────────────────────────────────┘
```

**AFTER**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Quota Overview      [Columns ▼] [Manage Quotas] [Request Quota] ← NEW     │
├────────────────────────────────────────────────────────────────────────────┤
│ Place      │ Dept   │ Added │ Requested │ Coord. Requests │ Assigned │ ...│
│            │        │ Quota │ Quota     │    ← NEW        │          │    │
├────────────────────────────────────────────────────────────────────────────┤
│ Hospital A │ Cardio │   5   │     -     │  [3 Pending]    │    2     │ ...│
│ Clinic B   │ Pediat │   3   │  P:2 A:5  │  [5 Approved]   │    1     │ ...│
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Changes**:
1. New blue "Request Quota" button
2. New "Coordinator Requests" column showing request status
3. Assign button enabled when coordinator requests are approved

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│ PK Person: Placement Details Page                          │
│                                                             │
│  1. Click "Request Quota" button (shortcut)               │
│  2. Modal opens with:                                      │
│     ┌──────────────────────────────────────────┐          │
│     │ Quick Select (from existing quota rows): │          │
│     │  ○ Oslo Hospital - Cardiology            │          │
│     │  ○ City Clinic - Pediatrics              │          │
│     │                                           │          │
│     │ OR Manual Entry:                         │          │
│     │  - Praksis Place: [dropdown]             │          │
│     │  - Department: [dropdown]                │          │
│     │  - Number: [___]                         │          │
│     │  - Period: [date range]                  │          │
│     │                                           │          │
│     │ Auto-filled Context:                     │          │
│     │  - Study: Health Sciences                │          │
│     │  - Program: Nursing                      │          │
│     └──────────────────────────────────────────┘          │
│  3. Submit request                                         │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ App.tsx: handleCoordinatorQuotaRequestCreate                │
│                                                              │
│  - Add placementId: placement.id                            │
│  - Generate unique ID: cqr-{timestamp}                      │
│  - Set status: 'pending'                                    │
│  - Add timestamp                                            │
│  - Update coordinatorQuotaRequests state                    │
│  - Show success toast                                       │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│ PK Views Request         │  │ SK Views Request             │
│                          │  │                              │
│ • Placement Details:     │  │ • Quota Management View:     │
│   - New "Coordinator     │  │   - Incoming Requests table  │
│     Requests" column     │  │   - Shows: "Review" button   │
│   - Shows: "3 Pending"   │  │   - Filters by praksisPlace  │
│   - Badge: Amber/Yellow  │  │                              │
│   - Assign btn: DISABLED │  │ • Click Review opens:        │
│                          │  │   - ApproveRejectQuotaModal  │
│ • Quotas View:           │  │   - Full request details     │
│   - Request in table     │  │   - Approve/Reject actions   │
│   - Status: Pending      │  │                              │
│   - Delete button shown  │  │                              │
└──────────────────────────┘  └──────────┬───────────────────┘
                                         │
                    ┌────────────────────┴─────────────────┐
                    │                                      │
                    ▼                                      ▼
        ┌─────────────────────┐              ┌─────────────────────┐
        │ SK Approves         │              │ SK Rejects          │
        │                     │              │                     │
        │ - Status: approved  │              │ - Status: rejected  │
        │ - approvedDate set  │              │ - rejectedDate set  │
        │ - approvedBy set    │              │ - rejectedBy set    │
        │ - responseNotes     │              │ - rejectionReason   │
        └──────────┬──────────┘              └──────────┬──────────┘
                   │                                    │
                   └──────────┬─────────────────────────┘
                              │
                              ▼
                  ┌────────────────────────────┐
                  │ PK Sees Update             │
                  │                            │
                  │ • Placement Details:       │
                  │   - "5 Approved" (green)   │
                  │   - Assign btn: ENABLED ✓  │
                  │   - Can assign students    │
                  │                            │
                  │ • Quotas View:             │
                  │   - Status: Approved       │
                  │   - Green badge            │
                  │   - Shows approvedBy       │
                  └────────────────────────────┘
```

---

## Column Layout Reference

### Existing Columns (No Changes)
1. Praksis Place
2. Department
3. Fixed Quota (from offerings) - "Added Quota" 
4. Requested Quota (from QuotaSelection.requestQuota) - Shows P: and A: badges
5. Assigned
6. Available
7. Quick Assign

### NEW Column (Add After #4)
**5. Coordinator Requests** (NEW)
- Shows pending/approved/rejected coordinator quota requests
- Badge format: "3 Pending", "5 Approved", "2 Rejected"
- Colors: Amber (pending), Green (approved), Red (rejected)

### Updated Column Order
1. Praksis Place
2. Department
3. Fixed Quota
4. Requested Quota (existing system)
5. **Coordinator Requests** ← NEW
6. Assigned
7. Available
8. Quick Assign

**Note**: Make column toggleable in column visibility dropdown.

---

## Validation Rules

### Request Quota Modal Validation

#### Required Fields
1. **Praksis Place**: Must be selected
2. **Department**: Must be selected (filtered by praksis place)
3. **Number of Places**: Required, must be > 0, max 999
4. **Start Date**: Required, cannot be more than 1 year in past
5. **End Date**: Required, must be after start date
6. **Notes**: Optional, max 500 characters

#### Business Rules
1. **No Duplicate Requests**: Cannot create identical request (same place + dept + dates + placement)
2. **Date Range**: End date must be at least 1 day after start date
3. **Reasonable Dates**: End date cannot be more than 2 years in future
4. **Capacity Limit**: Requested capacity cannot exceed department's total capacity (if available)

#### Error Messages
- "Please select a praksis place"
- "Please select a department"
- "Number of places must be greater than 0"
- "End date must be after start date"
- "A similar request already exists for this placement"

---

## Testing Checklist

### ✅ Create Request (PK Person)
- [ ] "Request Quota" button visible in Placement Details
- [ ] Button opens modal
- [ ] Modal shows existing quotas as quick-select options
- [ ] Clicking quick-select auto-fills praksis place and department
- [ ] Can manually select different praksis place
- [ ] Department dropdown updates based on praksis place
- [ ] Can enter number of places (validation works)
- [ ] Can select date range (validation works)
- [ ] Can add optional notes
- [ ] Study/Program/University displayed (read-only)
- [ ] Submit creates request with status "pending"
- [ ] Success toast appears
- [ ] Modal closes after submit
- [ ] Cancel button works

### ✅ View Request in Placement Details (PK Person)
- [ ] New "Coordinator Requests" column visible
- [ ] Pending request shows "X Pending" with amber badge
- [ ] Badge has clock icon
- [ ] Assign button is DISABLED for pending requests
- [ ] Multiple requests aggregate correctly (e.g., "3 Pending")

### ✅ View Request in Quotas View (PK Person)
- [ ] Request appears in "Quota Requests" table
- [ ] Shows praksis place and department
- [ ] Shows requested capacity
- [ ] Shows period (date range)
- [ ] Status badge shows "Pending" (amber)
- [ ] Delete button available for pending requests
- [ ] Placement context visible (study/program)

### ✅ Review Request (SK Person)
- [ ] Request appears in Quota Management view
- [ ] "Incoming Quota Requests" section shows request
- [ ] Request shows university, study, program
- [ ] Shows requested capacity and period
- [ ] "Review" button visible for pending requests
- [ ] Click "Review" opens ApproveRejectQuotaModal
- [ ] Modal shows all request details
- [ ] Can approve with optional notes
- [ ] Can reject with required reason
- [ ] Validation works (reject requires reason)

### ✅ Approve Request (SK Person)
- [ ] Approval updates status to "approved"
- [ ] approvedDate and approvedBy populated
- [ ] Success toast appears
- [ ] Modal closes
- [ ] Request row updates (no longer shows Review button)
- [ ] Shows "By {approvedBy}" in Actions column

### ✅ View Approved Request (PK Person)
- [ ] Placement Details shows "X Approved" with green badge
- [ ] Badge has checkmark icon
- [ ] Assign button is ENABLED
- [ ] Can assign students to approved quota
- [ ] Quotas View shows status "Approved" (green badge)
- [ ] Shows approvedBy and approvedDate

### ✅ Reject Request (SK Person)
- [ ] Rejection updates status to "rejected"
- [ ] rejectedDate, rejectedBy, and rejectionReason populated
- [ ] Success toast appears
- [ ] Modal closes
- [ ] Request row updates

### ✅ View Rejected Request (PK Person)
- [ ] Placement Details shows "X Rejected" (red badge, faded)
- [ ] Badge has X icon
- [ ] Assign button remains disabled
- [ ] Quotas View shows status "Rejected" (red badge)
- [ ] Shows rejectedBy and rejection reason

### ✅ Integration Tests
- [ ] Multiple pending requests display correctly
- [ ] Multiple approved requests aggregate capacity
- [ ] Requests filter correctly by placement
- [ ] SK only sees requests for their praksis place
- [ ] PK sees all their requests across placements
- [ ] Delete pending request works
- [ ] Cannot delete approved/rejected requests
- [ ] Quick select works with 0 quotas (shows message)
- [ ] Quick select works with multiple quotas
- [ ] Duplicate request validation prevents submission
- [ ] Column toggle works for new column

### ✅ Edge Cases
- [ ] Empty state: No quotas in table (modal still works)
- [ ] Empty state: No requests created yet
- [ ] Trying to create duplicate request (blocked)
- [ ] Very long praksis place names (truncated properly)
- [ ] Very long department names (truncated properly)
- [ ] Large capacity numbers (100+) display correctly
- [ ] Date range spanning multiple years
- [ ] Multiple requests with different statuses for same quota row

---

## File Summary

### NEW Files
1. `/components/RequestQuotaModal.tsx` - Modal for creating quota requests

### MODIFIED Files
1. `/types/coordinatorQuotaRequest.ts`
   - Add `placementId: string` field

2. `/components/PlacementTaskView.tsx`
   - Add "Request Quota" button (line ~2110)
   - Add "Coordinator Requests" column (after line ~2175)
   - Add props: coordinatorQuotaRequests, onCoordinatorQuotaRequestCreate, currentUserName
   - Add state: isRequestQuotaModalOpen
   - Add helper functions: getCoordinatorRequestsForQuota, countCoordinatorRequestsByStatus
   - Update assign button logic: hasApprovedCoordinatorRequests
   - Add modal integration and submit handler
   - Import icons: Clock, CheckCircle, XCircle from lucide-react

3. `/App.tsx`
   - Pass coordinatorQuotaRequests (filtered by placementId) to PlacementTaskView
   - Pass onCoordinatorQuotaRequestCreate handler
   - Pass currentUserName
   - No changes to handler (already supports placementId)

### NO CHANGES (Verify Only)
1. `/components/CoordinatorQuotasView.tsx` ✅
2. `/components/QuotaManagementView.tsx` ✅
3. `/components/IncomingQuotaRequestsSection.tsx` ✅
4. `/components/ApproveRejectQuotaModal.tsx` ✅

---

## Timeline Estimate

### Phase 1: Type Update (15 minutes)
- Add `placementId` field to CoordinatorQuotaRequest type

### Phase 2: Create RequestQuotaModal (2 hours)
- Build modal structure
- Add quick-select section with radio buttons
- Add manual entry form
- Implement validation
- Add duplicate detection
- Style with shadcn/ui components

### Phase 3: PlacementTaskView Integration (2 hours)
- Add "Request Quota" button
- Add new "Coordinator Requests" column
- Add helper functions for request counting
- Update assign button logic
- Integrate modal with pre-population
- Add submit handler
- Test column layout and responsiveness

### Phase 4: App.tsx Wiring (30 minutes)
- Pass filtered coordinatorQuotaRequests to PlacementTaskView
- Pass handlers and currentUserName
- Test prop passing

### Phase 5: Testing & Polish (1.5 hours)
- Test all workflows (create, view, approve, reject)
- Test edge cases
- Fix UI issues (truncation, spacing, colors)
- Add loading states if needed
- Test column toggle
- Verify responsive design

**Total Estimate**: 6 hours

---

## Success Criteria

✅ **PK Coordinator Can**:
1. Click "Request Quota" button from Placement Details page
2. See existing quotas as quick-select options in modal
3. Auto-fill form by selecting existing quota row
4. Manually enter request details if needed
5. Submit request successfully
6. See "X Pending" badge in new "Coordinator Requests" column
7. View all requests in "Quotas View" table
8. Delete pending requests
9. See status updates when SK approves/rejects

✅ **SK Contact Person Can**:
1. See incoming requests in Quota Management view
2. Click "Review" button for pending requests
3. Approve request with optional notes
4. Reject request with required reason
5. See approval/rejection reflected immediately

✅ **System Behavior**:
1. Requests are filtered by placementId
2. Assign button enabled when coordinator requests approved
3. Status badges display with correct colors and icons
4. Duplicate requests prevented
5. Two quota systems work independently (requestQuota vs coordinatorRequests)
6. New column toggleable in column visibility settings

---

## Notes & Considerations

### Design Decisions
1. **Separate Systems**: CoordinatorQuotaRequest completely independent from QuotaSelection.requestQuota
2. **Pre-population Priority**: Quick-select from existing quotas for better UX
3. **Column Addition**: New column doesn't interfere with existing "Requested Quota" column
4. **PlacementId Required**: Essential for proper filtering and context
5. **Blue Button**: "Request Quota" is primary action (blue), "Manage Quotas" is secondary (outline)

### Future Enhancements
- **Email notifications**: Notify SK when new request created
- **Reminder system**: Remind SK of pending requests after X days
- **Bulk approval**: SK can approve multiple requests at once
- **History tracking**: Detailed audit log for each request
- **Capacity validation**: Check against department capacity before approval
- **Auto-linking**: Link approved requests to quota assignments
- **Request templates**: Save common request patterns
- **Expiration**: Auto-expire old pending requests

### Technical Notes
- Use `react-hook-form@7.55.0` for form management
- Use shadcn/ui Dialog, Select, Input components
- Use date picker from shadcn/ui (Calendar component)
- Icons from lucide-react (Clock, CheckCircle, XCircle, Info)
- Badge component for status displays
- Tooltip for column header info icon

---

**Status**: Ready for Implementation ✅
**Priority**: High 🔴
**Complexity**: Medium 🟡
**Dependencies**: None (all infrastructure exists)
