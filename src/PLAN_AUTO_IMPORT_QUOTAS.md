# Plan: Auto-Import Quotas from Quota Offerings in Step 1/6

## Overview
Automatically populate the quotas table when Placement Details are saved by matching available quota offerings from SK persons with the selected study program and date range.

## Current State
- **Placement Details Form**: Located in PlacementTaskView.tsx, saves metadata via `handleMetadataFormSubmit()`
- **Quotas Table**: Stored in `PlacementTaskState.quotas` as `QuotaSelection[]`
- **Quota Offerings**: Available from `quotaOfferings` prop (QuotaOffering[]) - SK person offerings in CoordinatorQuotasView
- **Manual Management**: Users can currently manage quotas via SlideOverManageQuota

## Data Structures

### StudentPlacement (metadata)
```typescript
{
  id: string;
  title: string;
  year: string;
  semester: string;
  subject: string;
  students: number;
  startDate: string;      // e.g., "2026-03-01"
  endDate: string;        // e.g., "2026-05-30"
  status: "draft" | "upload" | ...;
  studyId: string;        // MATCHING KEY
  programId: string;      // MATCHING KEY
}
```

### QuotaOffering (SK person offerings)
```typescript
{
  id: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  universityId: string;
  universityName: string;
  departmentId: string;
  departmentName: string;
  studyId: string;        // MATCHING KEY
  studyName: string;
  programId: string;      // MATCHING KEY
  programName: string;
  capacity: number;       // Available quota to import
  startDate: string;      // MATCHING KEY (date overlap)
  endDate: string;        // MATCHING KEY (date overlap)
  status: "active" | "inactive" | "expired";  // Must be "active"
  createdDate: string;
  updatedDate: string;
  notes?: string;
}
```

### QuotaSelection (quotas table)
```typescript
{
  placeId: string;        // From praksisPlaceId
  placeName: string;      // From praksisPlaceName
  departmentId: string;   // From departmentId
  departmentName: string; // From departmentName
  fixedQuota: number;     // From capacity (auto-imported)
  requestQuota: number;   // Set to 0 initially
}
```

## Matching Logic

### Criteria for Auto-Import:
1. **Study & Program Match**: 
   - `quotaOffering.studyId === placement.studyId`
   - `quotaOffering.programId === placement.programId`

2. **Date Overlap**:
   - Offering period overlaps with placement period
   - Check if: `offeringStartDate <= placementEndDate` AND `offeringEndDate >= placementStartDate`

3. **Status Check**:
   - `quotaOffering.status === "active"`

4. **Avoid Duplicates**:
   - Check if quota for same placeId + departmentId already exists in quotas array

## Implementation Plan

### Phase 1: Create Auto-Import Function (2 hours)

**File**: `/components/PlacementTaskView.tsx`

**New Function**: `autoImportQuotasFromOfferings`

```typescript
const autoImportQuotasFromOfferings = (
  placementId: string,
  studyId: string,
  programId: string,
  startDate: string,
  endDate: string
) => {
  // 1. Filter quota offerings by study/program match
  const matchingOfferings = quotaOfferings.filter(
    (offering) =>
      offering.studyId === studyId &&
      offering.programId === programId &&
      offering.status === 'active'
  );

  // 2. Filter by date overlap
  const placementStart = new Date(startDate);
  const placementEnd = new Date(endDate);
  
  const overlappingOfferings = matchingOfferings.filter((offering) => {
    const offeringStart = new Date(offering.startDate);
    const offeringEnd = new Date(offering.endDate);
    
    // Check for date overlap
    return offeringStart <= placementEnd && offeringEnd >= placementStart;
  });

  // 3. Get current quotas for this placement
  const currentState = placementTaskStates.find(
    (state) => state.placementId === placementId
  );
  const existingQuotas = currentState?.quotas || [];

  // 4. Convert to QuotaSelection format and avoid duplicates
  const newQuotas: QuotaSelection[] = overlappingOfferings
    .filter((offering) => {
      // Check if this combination already exists
      return !existingQuotas.some(
        (quota) =>
          quota.placeId === offering.praksisPlaceId &&
          quota.departmentId === offering.departmentId
      );
    })
    .map((offering) => ({
      placeId: offering.praksisPlaceId,
      placeName: offering.praksisPlaceName,
      departmentId: offering.departmentId,
      departmentName: offering.departmentName,
      fixedQuota: offering.capacity,
      requestQuota: 0, // Initially 0, user can adjust
    }));

  // 5. Update the placement task state with new quotas
  if (newQuotas.length > 0) {
    setPlacementTaskStates((prevStates) =>
      prevStates.map((state) =>
        state.placementId === placementId
          ? {
              ...state,
              quotas: [...existingQuotas, ...newQuotas],
              quotasSelected: true, // Mark as having quotas
            }
          : state
      )
    );

    // Show success toast
    toast.success(`Auto-imported ${newQuotas.length} quota(s)`, {
      description: `Found ${newQuotas.length} matching quota offering(s) for ${studyName} / ${programName}`,
      duration: 4000,
    });
  }

  return newQuotas.length;
};
```

### Phase 2: Update handleMetadataFormSubmit (1 hour)

**File**: `/components/PlacementTaskView.tsx`

**Modification**: Add auto-import call after metadata update

```typescript
const handleMetadataFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (onPlacementMetadataUpdate) {
    onPlacementMetadataUpdate(placement.id, metadataFormData);
  }
  
  // ✨ NEW: Auto-import quotas based on placement details
  if (metadataFormData.studyId && metadataFormData.programId) {
    const importedCount = autoImportQuotasFromOfferings(
      placement.id,
      metadataFormData.studyId,
      metadataFormData.programId,
      metadataFormData.startDate,
      metadataFormData.endDate
    );
    
    console.log(`Auto-imported ${importedCount} quotas for placement ${placement.id}`);
  }
  
  // Update status from draft to upload
  if (
    onPlacementStatusUpdate &&
    placement.status === "draft"
  ) {
    onPlacementStatusUpdate(placement.id, "upload");
  }

  // Progress onboarding if in step 3
  if (onboardingStep === 3 && setOnboardingStep) {
    setOnboardingStep(0); // Complete onboarding
  }
};
```

### Phase 3: Pass quotaOfferings Prop (30 minutes)

**Files to Update**:
1. `/App.tsx` - Pass quotaOfferings to PlacementTaskView
2. `/components/PlacementTaskView.tsx` - Add quotaOfferings to props interface

**App.tsx Changes**:
```typescript
<PlacementTaskView
  placement={selectedPlacement}
  praksisPlaces={praksisPlaces}
  studies={studies}
  quotaOfferings={quotaOfferings}  // ✨ NEW
  quotaRequests={quotaRequests}
  // ... other props
/>
```

**PlacementTaskView.tsx Props Interface**:
```typescript
interface PlacementTaskViewProps {
  placement: StudentPlacement;
  praksisPlaces: PraksisPlace[];
  studies: Study[];
  quotaOfferings: QuotaOffering[];  // ✨ NEW
  quotaRequests: CoordinatorQuotaRequest[];
  // ... other props
}
```

### Phase 4: UI Feedback Enhancement (1 hour)

**Add visual indicators for auto-imported quotas**:

1. **Info Alert in Quotas Tab**:
```typescript
{autoImportedCount > 0 && (
  <Alert className="mb-4 bg-green-50 border-green-200">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <AlertTitle className="text-green-900">
      Quotas Auto-Imported
    </AlertTitle>
    <AlertDescription className="text-green-800">
      {autoImportedCount} quota offering(s) were automatically imported based on 
      your placement details. You can review and adjust them below.
    </AlertDescription>
  </Alert>
)}
```

2. **Badge on Auto-Imported Items**:
Add a small badge to quota items that were auto-imported:
```typescript
<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
  Auto-imported
</Badge>
```

### Phase 5: Handle Edge Cases (1 hour)

1. **No Matching Offerings**:
   - Show info message: "No matching quota offerings found for this study program"
   - User can still manually add quotas

2. **Partial Matches**:
   - Some offerings match, some don't
   - Show count of auto-imported quotas

3. **Re-saving Placement Details**:
   - Don't duplicate quotas on re-save
   - Check for existing quotas before importing

4. **Date Changes**:
   - If user changes dates and re-saves, should we re-import?
   - Decision: Only auto-import on first save from draft status

### Phase 6: Update Step 1/6 Completion Logic (30 minutes)

**Current logic**: Step 1/6 auto-completes when both students and quotas exist

**Update**: Step 1/6 should auto-complete when:
- Students are imported, OR
- Quotas are auto-imported or manually added

```typescript
// Check if Step 1/6 should auto-complete
useEffect(() => {
  const step1 = tasks.find((t) => t.step === "1/6");
  if (step1 && !step1.completed) {
    // Auto-complete if students OR quotas exist
    if (students.length > 0 || quotas.length > 0) {
      setTasks((prev) =>
        prev.map((t) =>
          t.step === "1/6" ? { ...t, completed: true } : t
        )
      );
    }
  }
}, [students, quotas]);
```

## Testing Plan

### Test Cases:

1. **Happy Path - Exact Match**:
   - Create placement with Study: "Medicine", Program: "Clinical Practice"
   - Dates: 2026-03-01 to 2026-05-30
   - Verify quota offerings with same study/program/overlapping dates are imported

2. **No Matches**:
   - Create placement with study/program that has no offerings
   - Verify no quotas imported, no errors

3. **Partial Date Overlap**:
   - Placement: 2026-03-01 to 2026-05-30
   - Offering: 2026-04-01 to 2026-06-30
   - Verify offering is imported (dates overlap)

4. **No Date Overlap**:
   - Placement: 2026-03-01 to 2026-05-30
   - Offering: 2026-06-01 to 2026-08-30
   - Verify offering is NOT imported (no overlap)

5. **Inactive/Expired Offerings**:
   - Verify only "active" status offerings are imported

6. **Duplicate Prevention**:
   - Save placement details
   - Manually add same quota
   - Re-save placement details
   - Verify no duplicates created

7. **Multiple Departments**:
   - Multiple quota offerings for same study/program but different departments
   - Verify all matching departments are imported as separate quota entries

## File Changes Summary

### Files to Modify:
1. `/App.tsx` - Pass quotaOfferings prop to PlacementTaskView
2. `/components/PlacementTaskView.tsx` - Main implementation
   - Add quotaOfferings to props
   - Create autoImportQuotasFromOfferings function
   - Update handleMetadataFormSubmit
   - Add UI feedback for auto-import
   - Update Step 1/6 completion logic

### Dependencies:
- Import QuotaOffering type from `../types/quotaOffering`
- Import QuotaSelection type from `./SlideOverManageQuota`
- Use existing toast from sonner

## Estimated Time

| Phase | Task | Time |
|-------|------|------|
| 1 | Create auto-import function | 2 hours |
| 2 | Update form submit handler | 1 hour |
| 3 | Pass quotaOfferings prop | 30 min |
| 4 | UI feedback enhancement | 1 hour |
| 5 | Handle edge cases | 1 hour |
| 6 | Update completion logic | 30 min |
| **Total** | | **6 hours** |

## Rollback Strategy

If issues arise:
1. Remove autoImportQuotasFromOfferings call from handleMetadataFormSubmit
2. Remove quotaOfferings prop from PlacementTaskView
3. Revert to manual quota management only

## Future Enhancements

1. **Smart Re-Import**: 
   - Detect when placement dates change significantly
   - Offer to re-import quotas based on new dates

2. **Conflict Detection**:
   - Warn if imported quotas exceed total capacity
   - Show visual indicators for capacity conflicts

3. **Import History**:
   - Track which quotas were auto-imported vs. manually added
   - Allow filtering/sorting by import source

4. **Batch Actions**:
   - Allow user to accept/reject all auto-imported quotas
   - Bulk edit auto-imported quotas

## Notes

- ✅ Preserves manual quota management workflow
- ✅ Non-destructive - only adds new quotas, doesn't modify existing
- ✅ Respects quota offering status (only "active")
- ✅ Handles date overlaps correctly
- ✅ Provides clear user feedback
- ✅ Prevents duplicates
- ✅ Maintains backward compatibility
