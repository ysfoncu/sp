# Implementation Plan: Coordinator Quota Request Feature

## Overview
Add functionality for PK coordinators to request quotas directly from the Placement Details page. These requests will be visible to both PK and SK users with appropriate workflows.

---

## Current State Analysis

### ✅ Already Exists
- **Data Structure**: `CoordinatorQuotaRequest` type in `/types/coordinatorQuotaRequest.ts`
- **State Management**: `coordinatorQuotaRequests` state in `App.tsx`
- **Handlers**: 
  - `handleCoordinatorQuotaRequestCreate`
  - `handleCoordinatorQuotaRequestUpdate`
  - `handleCoordinatorQuotaRequestDelete`
  - `handleCoordinatorQuotaRequestApprove`
  - `handleCoordinatorQuotaRequestReject`
- **Display Components**:
  - `CoordinatorQuotasView` (PK person) - shows quota requests table
  - `QuotaManagementView` (SK person) - shows quota requests for review

### ❌ Needs to be Added
1. "Request Quota" button in PlacementTaskView quotas section
2. Request Quota modal component
3. Integration with placement task to auto-populate study/program
4. Display requested quotas in PlacementTaskView quota table with status
5. Enable/disable Assign button based on approval status
6. Pass quota requests data to PlacementTaskView

---

## Implementation Steps

### **STEP 1: Create Request Quota Modal Component**

**File**: `/components/RequestQuotaModal.tsx` (NEW)

**Purpose**: Modal for PK coordinators to request quotas from praksis places

**Requirements**:
- Modal with form fields:
  - **Praksis Place** (dropdown) - populated from available praksis places
  - **Department** (dropdown) - filtered based on selected praksis place
  - **Number of Places** (number input) - requested capacity
  - **Period** (date range picker) - start and end dates
  - **Notes** (textarea, optional) - additional request details
- **Auto-populated fields** (read-only/display):
  - Study (from placement)
  - Study Program (from placement)
  - University (Oslo University)
- **Validation**:
  - All fields required except notes
  - Number of places > 0
  - End date must be after start date
  - Dates should be within reasonable range
- **Actions**:
  - Submit button - creates the request
  - Cancel button - closes modal

**Props Interface**:
```typescript
interface RequestQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => void;
  praksisPlaces: PraksisPlace[];
  placement: {
    studyId: string;
    studyName: string;
    programId: string;
    programName: string;
  };
  studies: Study[];
  currentUserName: string;
}
```

**Design Notes**:
- Use existing modal patterns from `SlideOverManageQuota`
- Use shadcn/ui components (Dialog, Select, Input, Calendar)
- Department dropdown should be disabled until praksis place is selected
- Show department options based on selected praksis place's departments

---

### **STEP 2: Update PlacementTaskView Component**

**File**: `/components/PlacementTaskView.tsx`

#### 2.1 Add Props
```typescript
interface PlacementTaskViewProps {
  // ... existing props
  coordinatorQuotaRequests?: CoordinatorQuotaRequest[];
  onCoordinatorQuotaRequestCreate?: (request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => void;
  currentUserName?: string;
}
```

#### 2.2 Add State
```typescript
const [isRequestQuotaModalOpen, setIsRequestQuotaModalOpen] = useState(false);
```

#### 2.3 Add "Request Quota" Button
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
    className="h-9 px-4 text-sm bg-white hover:bg-gray-50"
  >
    Request Quota
  </Button>
</div>
```

#### 2.4 Update Quota Table Structure
**Add new column**: "Requested Quota" with status chip

Current columns:
- Praksis Place
- Department
- Fixed Quota (from offerings)
- Request Quota (manually requested)
- Assigned
- Available
- Quick Assign

**New column additions**:
- **Requested Quota** - Shows pending/approved coordinator requests
  - Display format: "5 (Pending)" or "5 (Approved)"
  - Chip colors:
    - Pending: Yellow/amber background
    - Approved: Green background
    - Rejected: Red background (hidden or shown with strikethrough?)

#### 2.5 Update Assign Button Logic
**Current logic**: Enable when quota > 0
**New logic**: 
```typescript
const canAssign = (quota: QuotaSelection) => {
  // Can assign from fixed quota
  if (quota.fixedQuota > 0 && getAvailableQuota(quota.fixedQuota, getAssignedStudentsForQuota(quota.id)) > 0) {
    return true;
  }
  
  // Can assign from approved coordinator requests
  const approvedRequests = coordinatorQuotaRequests?.filter(req => 
    req.praksisPlaceId === quota.praksisPlaceId &&
    req.departmentId === quota.departmentId &&
    req.status === 'approved' &&
    req.studyId === metadataFormData.studyId &&
    req.programId === metadataFormData.programId
  ) || [];
  
  const approvedCapacity = approvedRequests.reduce((sum, req) => sum + req.requestedCapacity, 0);
  
  return approvedCapacity > 0;
};
```

#### 2.6 Add Modal Component
```typescript
{isRequestQuotaModalOpen && (
  <RequestQuotaModal
    isOpen={isRequestQuotaModalOpen}
    onClose={() => setIsRequestQuotaModalOpen(false)}
    onSubmit={handleRequestQuotaSubmit}
    praksisPlaces={praksisPlaces}
    placement={{
      studyId: metadataFormData.studyId,
      studyName: getStudyName(metadataFormData.studyId),
      programId: metadataFormData.programId,
      programName: getProgramName(metadataFormData.programId),
    }}
    studies={studies}
    currentUserName={currentUserName || 'PK Coordinator'}
  />
)}
```

#### 2.7 Add Submit Handler
```typescript
const handleRequestQuotaSubmit = (requestData: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => {
  if (onCoordinatorQuotaRequestCreate) {
    onCoordinatorQuotaRequestCreate(requestData);
    setIsRequestQuotaModalOpen(false);
  }
};
```

---

### **STEP 3: Update App.tsx Integration**

**File**: `/App.tsx`

#### 3.1 Pass Props to PlacementTaskView
**Location**: Where PlacementTaskView is rendered (~line 1280)

```typescript
<PlacementTaskView
  // ... existing props
  coordinatorQuotaRequests={coordinatorQuotaRequests.filter(
    req => req.studyId === placement.studyId && req.programId === placement.programId
  )}
  onCoordinatorQuotaRequestCreate={handleCoordinatorQuotaRequestCreate}
  currentUserName={userRole === 'PK' ? 'John Coordinator' : 'Sarah Contact'}
/>
```

#### 3.2 Update Handler to Include Placement Context
**Current handler** (line ~544):
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

**Enhancement**: Add placement ID to track which placement the request is for
- Consider adding `placementId?: string` to CoordinatorQuotaRequest type

---

### **STEP 4: Update Quota Display in PlacementTaskView**

#### 4.1 Enhance Quota Table Row Data
**Location**: Where quota rows are rendered (~line 2115+)

**Add data processing**:
```typescript
const getRequestedQuotasForRow = (quota: QuotaSelection) => {
  if (!coordinatorQuotaRequests) return { pending: 0, approved: 0, rejected: 0 };
  
  const requests = coordinatorQuotaRequests.filter(req =>
    req.praksisPlaceId === quota.praksisPlaceId &&
    req.departmentId === quota.departmentId &&
    req.studyId === metadataFormData.studyId &&
    req.programId === metadataFormData.programId
  );
  
  return {
    pending: requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.requestedCapacity, 0),
    approved: requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.requestedCapacity, 0),
    rejected: requests.filter(r => r.status === 'rejected').reduce((sum, r) => sum + r.requestedCapacity, 0),
  };
};
```

#### 4.2 Add Column to Table
**New column header**:
```typescript
<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
  Requested
</th>
```

**New column data**:
```typescript
<td className="px-4 py-3 text-sm">
  {(() => {
    const requested = getRequestedQuotasForRow(quota);
    return (
      <div className="flex flex-col gap-1">
        {requested.pending > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{requested.pending}</span>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Pending
            </Badge>
          </div>
        )}
        {requested.approved > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{requested.approved}</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Approved
            </Badge>
          </div>
        )}
        {requested.rejected > 0 && (
          <div className="flex items-center gap-2 opacity-50">
            <span className="text-gray-500 line-through">{requested.rejected}</span>
            <Badge className="bg-red-100 text-red-800 border-red-200">
              Rejected
            </Badge>
          </div>
        )}
        {requested.pending === 0 && requested.approved === 0 && requested.rejected === 0 && (
          <span className="text-gray-400">-</span>
        )}
      </div>
    );
  })()}
</td>
```

---

### **STEP 5: Update CoordinatorQuotasView (PK Person)**

**File**: `/components/CoordinatorQuotasView.tsx`

**Current State**: Already displays quota requests table

**Verification Needed**:
- ✅ Check if quota requests table exists
- ✅ Ensure "Pending" status is displayed correctly
- ✅ Add placement title/context if not present
- ✅ Ensure proper filtering (only show requests for Oslo University)

**Enhancements**:
- Add placement reference column if missing
- Add visual indicator for urgent/old requests
- Add ability to cancel pending requests

---

### **STEP 6: Update QuotaManagementView (SK Person)**

**File**: `/components/QuotaManagementView.tsx`

**Current State**: Shows quota requests in a table

**Required Changes**:
1. **Add "Actions" column** with "Review" button
2. **Review Modal/Dialog** with:
   - Display full request details
   - Approve button (with optional notes)
   - Reject button (with required reason)
   - Cancel button

**Action Handlers**:
```typescript
const handleReviewClick = (request: CoordinatorQuotaRequest) => {
  setSelectedRequest(request);
  setIsReviewModalOpen(true);
};

const handleApprove = (requestId: string, notes?: string) => {
  onCoordinatorQuotaRequestApprove(requestId, notes);
  setIsReviewModalOpen(false);
};

const handleReject = (requestId: string, reason: string, notes?: string) => {
  onCoordinatorQuotaRequestReject(requestId, reason, notes);
  setIsReviewModalOpen(false);
};
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ PK Person: Placement Details Page                           │
│                                                              │
│  1. Click "Request Quota" button                            │
│  2. Modal opens with:                                       │
│     - Praksis Place selector                                │
│     - Department selector                                   │
│     - Number of places input                                │
│     - Period (date range)                                   │
│     - Study/Program (auto-filled from placement)            │
│  3. Submit request                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ App.tsx: handleCoordinatorQuotaRequestCreate                │
│                                                              │
│  - Generate unique ID                                       │
│  - Set status: 'pending'                                    │
│  - Add timestamp                                            │
│  - Add to coordinatorQuotaRequests state                    │
│  - Show success toast                                       │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│ PK Person Views Request  │  │ SK Person Views Request      │
│                          │  │                              │
│ • Quotas View            │  │ • Quota Management View      │
│   - Table shows pending  │  │   - Table shows pending      │
│   - Status: Pending      │  │   - Actions: Review button   │
│                          │  │   - Click Review opens modal │
│ • Placement Details      │  │                              │
│   - Quota table shows:   │  │ • Review Modal:              │
│     "5 (Pending)"        │  │   - Shows request details    │
│   - Assign btn disabled  │  │   - Approve button           │
└──────────────────────────┘  │   - Reject button            │
                              └──────────┬───────────────────┘
                                         │
                    ┌────────────────────┴─────────────────┐
                    │                                      │
                    ▼                                      ▼
        ┌─────────────────────┐              ┌─────────────────────┐
        │ SK Approves Request │              │ SK Rejects Request  │
        │                     │              │                     │
        │ - Status: 'approved'│              │ - Status: 'rejected'│
        │ - approvedDate set  │              │ - rejectedDate set  │
        │ - approvedBy set    │              │ - rejectedBy set    │
        └──────────┬──────────┘              └──────────┬──────────┘
                   │                                    │
                   └──────────┬─────────────────────────┘
                              │
                              ▼
                  ┌────────────────────────────┐
                  │ PK Person Sees Update      │
                  │                            │
                  │ • Quotas View:             │
                  │   - Status: Approved/Rej   │
                  │                            │
                  │ • Placement Details:       │
                  │   - Shows "5 (Approved)"   │
                  │   - Assign btn ENABLED     │
                  │   - Can assign students    │
                  └────────────────────────────┘
```

---

## UI/UX Considerations

### Button Placement
```
┌─────────────────────────────────────────────────────────┐
│ Quota Overview                      [Columns ▼]         │
│                                     [Manage Quotas]     │
│                                     [Request Quota] ←NEW│
└─────────────────────────────────────────────────────────┘
```

### Requested Quota Column Display
```
┌──────────────────────────────────────────────────┐
│ Requested                                        │
├──────────────────────────────────────────────────┤
│ 5 [Pending]     ← Yellow chip, Assign disabled   │
│ 3 [Approved]    ← Green chip, Assign enabled     │
│ 2 [Rejected]    ← Red chip, grayed out           │
│ -               ← No requests                    │
└──────────────────────────────────────────────────┘
```

### Request Quota Modal Layout
```
┌────────────────────────────────────────────────┐
│ Request Quota                              [X] │
├────────────────────────────────────────────────┤
│                                                │
│ From Placement:                                │
│ ├─ Study: Helse-, sosial og idrettsfag        │
│ └─ Program: Nursing                            │
│                                                │
│ Praksis Place *                                │
│ [Select praksis place ▼]                       │
│                                                │
│ Department *                                   │
│ [Select department ▼]                          │
│                                                │
│ Number of Places *                             │
│ [____]                                         │
│                                                │
│ Period *                                       │
│ Start Date: [📅 Select date]                   │
│ End Date:   [📅 Select date]                   │
│                                                │
│ Notes (optional)                               │
│ [________________________________]             │
│ [________________________________]             │
│                                                │
├────────────────────────────────────────────────┤
│                        [Cancel] [Submit Request]│
└────────────────────────────────────────────────┘
```

---

## Validation Rules

### Request Quota Modal
1. **Praksis Place**: Required
2. **Department**: Required (must belong to selected praksis place)
3. **Number of Places**: Required, must be > 0, max 999
4. **Start Date**: Required, cannot be in the past
5. **End Date**: Required, must be after start date
6. **Notes**: Optional, max 500 characters

### Business Rules
1. Can request quota even if offerings exist
2. Can have multiple pending requests for same place/department
3. Cannot edit submitted requests (only cancel if pending)
4. SK can only see requests for their praksis place
5. PK can see all their requests regardless of praksis place
6. Approved quotas are available for assignment
7. Rejected quotas cannot be used for assignment

---

## Testing Checklist

### PK Person - Create Request
- [ ] Click "Request Quota" button opens modal
- [ ] Modal shows placement study/program (read-only)
- [ ] Can select praksis place from dropdown
- [ ] Department dropdown updates based on selected place
- [ ] Can enter number of places (validation works)
- [ ] Can select date range (validation works)
- [ ] Can add optional notes
- [ ] Submit creates request with "pending" status
- [ ] Success toast appears
- [ ] Modal closes after submit
- [ ] Cancel button closes modal without saving

### PK Person - View Requests
- [ ] New request appears in "Quotas View" → "Quota Requests" table
- [ ] Status shows as "Pending" with yellow chip
- [ ] Request details are correct (place, dept, capacity, dates)
- [ ] Request appears in Placement Details quota table
- [ ] Shows "X (Pending)" in Requested column
- [ ] Assign button is DISABLED for pending requests

### SK Person - Review Request
- [ ] Request appears in SK "Quota Management" view
- [ ] Can see request details (university, study, program, capacity)
- [ ] "Review" button in Actions column
- [ ] Click "Review" opens review modal/dialog
- [ ] Can approve with optional notes
- [ ] Can reject with required reason
- [ ] Approval updates status to "approved"
- [ ] Rejection updates status to "rejected"

### PK Person - See Approval
- [ ] Approved request shows "Approved" status in Quotas View
- [ ] Placement Details shows "X (Approved)" with green chip
- [ ] Assign button is ENABLED for approved requests
- [ ] Can assign students to approved quota
- [ ] Rejected requests show grayed out in table

### Integration Tests
- [ ] Multiple requests for same place/dept work correctly
- [ ] Requests from different placements don't interfere
- [ ] Approved quota count added to available capacity
- [ ] Assignment respects both fixed + approved quotas
- [ ] Status updates reflect immediately in all views

---

## File Summary

### New Files
1. `/components/RequestQuotaModal.tsx` - Modal for creating quota requests

### Modified Files
1. `/components/PlacementTaskView.tsx`
   - Add "Request Quota" button
   - Add modal integration
   - Update quota table with "Requested" column
   - Update Assign button logic
   - Add props for quota requests

2. `/App.tsx`
   - Pass coordinatorQuotaRequests to PlacementTaskView
   - Pass handler to PlacementTaskView
   - Pass currentUserName

3. `/components/QuotaManagementView.tsx` (SK Person)
   - Add "Review" action button
   - Add review modal/dialog
   - Wire up approve/reject handlers

4. `/types/coordinatorQuotaRequest.ts` (optional)
   - Consider adding `placementId` field

---

## Timeline Estimate

### Phase 1: Core Modal (1-2 hours)
- Create RequestQuotaModal component
- Implement form with validation
- Connect to handlers

### Phase 2: PlacementTaskView Integration (1-2 hours)
- Add button and modal
- Update quota table structure
- Add "Requested" column with status chips
- Update Assign button logic

### Phase 3: App.tsx Wiring (30 minutes)
- Pass props to PlacementTaskView
- Filter quota requests by placement context

### Phase 4: SK Review Interface (1 hour)
- Add Review button to QuotaManagementView
- Create review dialog
- Connect approve/reject handlers

### Phase 5: Testing & Polish (1 hour)
- Test all workflows
- Fix UI issues
- Add loading states
- Improve error handling

**Total Estimate**: 4-6 hours

---

## Success Criteria

✅ PK coordinator can click "Request Quota" from Placement Details page
✅ Modal opens with proper fields and validation
✅ Request is created with "pending" status
✅ Request appears in PK "Quotas View" table
✅ Request appears in Placement Details quota table with status
✅ Assign button is disabled for pending requests
✅ SK person sees request in Quota Management view
✅ SK person can review and approve/reject
✅ Approved requests enable Assign button
✅ Status updates reflect in real-time across all views

---

## Notes

- Use existing modal patterns (Dialog from shadcn/ui)
- Match existing design system (colors, spacing, typography)
- Reuse date picker component from other modals
- Consider adding request ID to toast messages for tracking
- Consider adding audit trail (who approved, when, why)
- Future enhancement: Email notifications on status change

---

**Status**: Ready for Implementation
**Priority**: High
**Complexity**: Medium
