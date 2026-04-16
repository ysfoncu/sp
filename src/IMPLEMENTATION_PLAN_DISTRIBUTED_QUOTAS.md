# Implementation Plan: Distributed Quota Request System

## Overview
Transform the quota request system to allow users to distribute quota requests among multiple sub-entities within a parent praksis place organization.

---

## 1. Data Structure Changes

### 1.1 Quota Request Model Updates

**Current Structure:**
```
QuotaRequest {
  - praksisPlace (single entity)
  - requested (single number)
  - approved (single number)
  - consumed (single number)
}
```

**New Structure:**
```
QuotaRequest {
  - parentPraksisPlace (top-level organization)
  - startDate
  - endDate
  - semester
  - program
  - emne (optional subject code)
  - entityDistributions: [
      {
        - entityId
        - entityName
        - entityType
        - entityPath (full hierarchy path)
        - requested
        - approved
        - consumed
        - contact (assigned contact for this entity)
      }
    ]
  - totalRequested (calculated sum)
  - totalApproved (calculated sum)
  - totalConsumed (calculated sum)
  - notes
  - status
}
```

### 1.2 Key Calculations
- `totalRequested` = sum of all entity distributions
- `totalApproved` = sum of all approved amounts
- `totalConsumed` = sum of all consumed amounts
- Each entity can have individual approval/consumption tracking

---

## 2. UI Component Changes

### 2.1 Quota Requests Table

#### Current Design:
- Flat table with one row per request
- Columns: Praksis Place, Contact, Requested, Approved, Consumed, Actions

#### New Design - Grouped/Nested Rows:

**Visual Structure:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Oslo University Hospital HF                                    [Actions]│
├─────────────────┬───────────┬───────────┬──────────┬──────────┬────────┤
│ Entity          │ Contact   │ Requested │ Approved │ Consumed │        │
├─────────────────┼───────────┼───────────┼──────────┼──────────┼────────┤
│ Ortopedisk      │ John Doe  │     2     │    2     │    1     │        │
│ klinikk         │           │           │          │          │        │
├─────────────────┼───────────┼───────────┼──────────┼──────────┼────────┤
│ Kirurgisk       │ Jane Smith│     3     │    3     │    2     │        │
│ klinikk         │           │           │          │          │        │
├─────────────────┼───────────┼───────────┼──────────┼──────────┼────────┤
│ TOTAL           │           │     5     │    5     │    3     │        │
└─────────────────┴───────────┴───────────┴──────────┴──────────┴────────┘
```

**Implementation Approach:**
- Parent row: Shows praksis place name, dates, and actions
- Expand/collapse button to show entity distributions
- Child rows: Show individual entity details
- Summary row: Shows totals
- Color-coded backgrounds to distinguish parent/child/summary rows

**New Columns:**
1. Entity (sub-organization name + type badge)
2. Contact (per entity)
3. Requested (per entity + total)
4. Approved (per entity + total)
5. Consumed (per entity + total)
6. Actions (on parent row only)

---

### 2.2 Request Quota Dialog - Complete Redesign

#### Step 1: Date Selection & Basic Info
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

---

#### Step 2: Praksis Place & Entity Distribution
**Purpose:** Select parent organization and distribute requests among entities

**Layout Structure:**

**2A: Select Parent Praksis Place**
```
┌────────────────────────────────────────────────────────────┐
│  Step 2: Select Place & Distribute Requests               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Parent Organization:                                      │
│  [Search or select praksis place...]                      │
│                                                            │
│  Selected: Oslo University Hospital HF                     │
│            [Helseforetak] Level 1                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**2B: Entity Distribution Builder**
```
┌────────────────────────────────────────────────────────────┐
│  Distribute Quota Requests:                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [+ Add Entity]                                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Ortopedisk klinikk        [Klinikk]          [×]     │ │
│  │ Path: Oslo UH HF / Ortopedisk klinikk                │ │
│  │                                                       │ │
│  │ Requested: [2]                                        │ │
│  │ Contact:   [Select contact... ▼]                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Kirurgisk klinikk         [Klinikk]          [×]     │ │
│  │ Path: Oslo UH HF / Kirurgisk klinikk                 │ │
│  │                                                       │ │
│  │ Requested: [3]                                        │ │
│  │ Contact:   [Select contact... ▼]                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Total Requested: 5 quotas                                 │
│                                                            │
│         [Back]  [Cancel]  [Next: Review]                  │
└────────────────────────────────────────────────────────────┘
```

**Entity Selection Modal:**
When user clicks "[+ Add Entity]", open a modal:
```
┌────────────────────────────────────────────────────────────┐
│  Select Entity from Oslo University Hospital HF         [×]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Search: [_____________________] 🔍                        │
│                                                            │
│  Available Entities:                                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ☐ Ortopedisk klinikk        [Klinikk]               │ │
│  │ ☐ Kirurgisk klinikk         [Klinikk]               │ │
│  │ ☐ Medisinsk klinikk         [Klinikk]               │ │
│  │ ☐ Akuttmedisinsk klinikk    [Klinikk]               │ │
│  │   ▼ Show sub-entities                                 │ │
│  │     ☐ Kardiologi avdeling   [Avdeling]              │ │
│  │     ☐ Nevrologi avdeling    [Avdeling]              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│                    [Cancel]  [Add Selected]                │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Hierarchical entity selector (tree view)
- Only show entities under selected parent praksis place
- Each entity card shows:
  - Entity name and type badge
  - Full hierarchical path
  - Requested amount input
  - Contact dropdown (optional)
  - Remove button
- Add multiple entities dynamically
- Real-time total calculation
- Validation: At least one entity required

---

#### Step 3: Review & Submit
**Purpose:** Display summary and add notes before submission

```
┌────────────────────────────────────────────────────────────┐
│  Step 3: Review & Submit                                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Period:                                                   │
│  • Start: 01/09/2024                                      │
│  • End: 31/12/2024                                        │
│  • Semester: Fall 2024                                    │
│  • Program: Nursing                                       │
│  • Emne: SYP2000                                          │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│                                                            │
│  Parent Organization:                                      │
│  Oslo University Hospital HF [Helseforetak]               │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│                                                            │
│  Quota Distribution:                                       │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Ortopedisk klinikk          Requested: 2             │ │
│  │ Contact: John Doe                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Kirurgisk klinikk           Requested: 3             │ │
│  │ Contact: Jane Smith                                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Total Requested: 5 quotas                                 │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│                                                            │
│  Notes (optional):                                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │                                                       │ │
│  │                                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│         [Back]  [Cancel]  [Submit Request]                │
└────────────────────────────────────────────────────────────┘
```

**Summary Display:**
- Read-only review of all selections
- Grouped by section (Period, Organization, Distribution)
- Shows emne if provided
- Highlight total requested
- Notes textarea for additional information
- Edit links to go back to previous steps

---

## 3. Component Structure

### 3.1 New Components to Create

```
components/
├── quota-management/
│   ├── QuotaRequestsTable.tsx (major update)
│   ├── QuotaRequestRow.tsx (new - parent row)
│   ├── QuotaDistributionRows.tsx (new - child rows)
│   ├── RequestQuotaDialog.tsx (major update)
│   ├── RequestQuotaStep1.tsx (updated - dates moved here)
│   ├── RequestQuotaStep2.tsx (new - place & distribution)
│   ├── EntityDistributionBuilder.tsx (new)
│   ├── EntitySelectionModal.tsx (new)
│   ├── EntityDistributionCard.tsx (new)
│   └── RequestQuotaStep3.tsx (updated - summary)
```

### 3.2 Shared Components to Update

```
components/
├── ui/
│   ├── collapsible-table-row.tsx (new)
│   └── entity-tree-selector.tsx (new)
```

---

## 4. State Management

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

### 4.2 Validation Rules

**Step 1:**
- All dates required
- End date > Start date
- Emne is optional (can be empty)

**Step 2:**
- Parent praksis place required
- At least one entity distribution required
- Each entity must have:
  - Valid requested amount (> 0)
  - Unique entity (no duplicates)
- Contact optional but recommended

**Step 3:**
- No additional validation
- Just confirmation

---

## 5. Table Implementation Details

### 5.1 Collapsible Row Pattern

**Parent Row:**
- Shows expand/collapse icon
- Displays parent praksis place name
- Shows date range
- Shows emne (if provided)
- Shows total requested/approved/consumed
- Contains action buttons
- Highlighted background color

**Child Rows:**
- Indented slightly
- Shows entity name + type badge
- Shows contact
- Shows individual amounts
- Light background color

**Summary Row:**
- Bold text
- Shows "TOTAL"
- Sums all child row amounts
- Slightly different background

### 5.2 Row Grouping Logic

```typescript
// Pseudo-code
quotaRequests.map(request => {
  return (
    <ParentRow
      praksisPlace={request.parentPraksisPlace}
      dateRange={`${request.startDate} - ${request.endDate}`}
      emne={request.emne}
      totalRequested={request.totalRequested}
      totalApproved={request.totalApproved}
      totalConsumed={request.totalConsumed}
      onExpand={() => toggleExpand(request.id)}
      isExpanded={expandedRows.includes(request.id)}
    />
    
    {isExpanded && request.entityDistributions.map(entity => (
      <ChildRow
        entity={entity.entityName}
        entityType={entity.entityType}
        contact={entity.contactName}
        requested={entity.requested}
        approved={entity.approved}
        consumed={entity.consumed}
      />
    ))}
    
    {isExpanded && (
      <SummaryRow
        totalRequested={request.totalRequested}
        totalApproved={request.totalApproved}
        totalConsumed={request.totalConsumed}
      />
    )}
  )
})
```

---

## 6. Implementation Steps

### Phase 1: Data Structure (Day 1)
1. Create new QuotaRequest type with entity distributions
2. Add emne field to request model
3. Update mock data to include sample distributed requests
4. Create helper functions for calculating totals

### Phase 2: Table Updates (Day 2-3)
1. Create collapsible row components
2. Update QuotaRequestsTable to handle grouped rows
3. Add expand/collapse functionality
4. Style parent/child/summary rows
5. Display emne in parent row
6. Test with mock data

### Phase 3: Dialog Step 1 (Day 4)
1. Move date selection to step 1
2. Add emne field (optional)
3. Update validation
4. Update navigation flow
5. Test step 1 independently

### Phase 4: Dialog Step 2 - Part A (Day 5-6)
1. Create parent praksis place selector
2. Display selected organization details
3. Add navigation between steps
4. Test place selection

### Phase 5: Dialog Step 2 - Part B (Day 7-8)
1. Create EntityDistributionBuilder component
2. Create EntitySelectionModal with tree selector
3. Create EntityDistributionCard component
4. Add/remove entity functionality
5. Real-time total calculation
6. Validation for distributions

### Phase 6: Dialog Step 3 (Day 9)
1. Update summary view to show distributed data
2. Display emne in summary
3. Add notes field
4. Update submission logic
5. Test end-to-end flow

### Phase 7: Integration & Testing (Day 10)
1. Connect all steps
2. Test full workflow
3. Handle edge cases
4. Polish UI/UX
5. Add loading states

---

## 7. Edge Cases & Considerations

### 7.1 Edge Cases

**Empty States:**
- No entities available under selected praksis place
- No contacts available for entity
- All entities already selected

**Validation:**
- Duplicate entity selection prevention
- Minimum 1 entity required
- Maximum entities limit (optional)
- Requested amount validation (> 0)
- Emne format validation (optional)

**Data Integrity:**
- Handle deleted entities
- Handle reassigned contacts
- Handle organizational structure changes

### 7.2 User Experience

**Feedback:**
- Loading indicators during entity fetch
- Success messages on submission
- Error messages with clear guidance
- Confirmation dialog before submission

**Accessibility:**
- Keyboard navigation for entity selection
- Screen reader support for nested rows
- Focus management in modal
- Clear visual hierarchy

### 7.3 Performance

**Optimization:**
- Lazy load entities on praksis place selection
- Virtualize entity list if > 100 items
- Debounce search in entity selector
- Memoize calculated totals

---

## 8. Migration Strategy

### 8.1 Backward Compatibility

**Option A: Convert Old Requests**
- Transform single-entity requests to distribution format
- Single entity becomes one-item distribution array
- Maintain data integrity

**Option B: Support Both Formats**
- Keep old requests as-is
- New requests use distribution format
- Table handles both display formats

**Recommendation:** Option A - cleaner, consistent data structure

### 8.2 Migration Script (Pseudo-code)

```typescript
// Convert old quota requests to new format
oldQuotaRequests.map(request => ({
  id: request.id,
  parentPraksisPlace: request.praksisPlace,
  startDate: request.startDate,
  endDate: request.endDate,
  semester: request.semester,
  program: request.program,
  emne: request.emne || "", // Handle missing emne
  entityDistributions: [
    {
      entityId: request.praksisPlace.id,
      entityName: request.praksisPlace.name,
      entityType: request.praksisPlace.type,
      entityPath: getFullPath(request.praksisPlace),
      requested: request.requested,
      approved: request.approved,
      consumed: request.consumed,
      contact: request.contact
    }
  ],
  totalRequested: request.requested,
  totalApproved: request.approved,
  totalConsumed: request.consumed,
  notes: request.notes,
  status: request.status
}))
```

---

## 9. Testing Plan

### 9.1 Unit Tests
- Entity distribution calculations
- Validation functions
- Helper functions (path generation, totals)
- Emne field handling

### 9.2 Integration Tests
- Step navigation flow
- Data persistence across steps
- Submission workflow
- Emne optional behavior

### 9.3 User Acceptance Tests
- Create request with single entity
- Create request with multiple entities
- Create request with/without emne
- Edit entity distributions
- Remove entities
- View distributed requests in table
- Expand/collapse table rows

---

## 10. Documentation Updates

### 10.1 User Guide
- How to create distributed quota requests
- How to use emne field
- How to read the new table format
- Best practices for entity distribution

### 10.2 Technical Docs
- Update ARCHITECTURE.md with new workflow
- Component documentation
- API contracts (for future backend)

---

## Summary

**Estimated Timeline:** 10 days

**Key Changes:**
1. ✅ Table: Nested row structure with expand/collapse
2. ✅ Step 1: Date selection moved from step 3 + emne field added
3. ✅ Step 2: Entity distribution builder (major new feature)
4. ✅ Step 3: Summary and notes only (displays emne)

**Benefits:**
- More granular quota tracking
- Subject code tracking (emne)
- Better organizational hierarchy utilization
- Clearer responsibility assignment
- Improved reporting capabilities

**Risks:**
- Increased UI complexity
- More user steps
- Data migration needed

**Mitigation:**
- Progressive disclosure (collapse by default)
- Clear visual hierarchy
- Helpful empty states and guidance
- Thorough testing before rollout
