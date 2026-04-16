# Auto-Import Quotas - Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PK COORDINATOR - CREATE PLACEMENT                     │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: Fill Placement Details Form
┌────────────────────────────────────────┐
│  Placement Details                     │
│                                        │
│  Study: [Helse-, sosial og idrettsfag]│
│  Program: [Nursing]                   │
│  Title: Spring 2026 Nursing           │
│  Dates: 2026-03-01 to 2026-05-30     │
│  Semester: Spring                     │
│  Year: 2026                           │
│  Students: 50                         │
│                                        │
│  [Save and Continue] ◄─── User clicks │
└────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  handleMetadataFormSubmit()                                            │
│  1. Save metadata ✓                                                    │
│  2. Call autoImportQuotasFromOfferings() ◄── NEW FEATURE              │
│  3. Update status to "upload" ✓                                        │
└────────────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  autoImportQuotasFromOfferings(studyId, programId, startDate, endDate)│
│                                                                         │
│  STEP 1: Filter by Study & Program                                     │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ ALL Quota Offerings (quotaOfferings)                    │          │
│  │ ├─ Oslo Hospital - Emergency (Nursing) ✓ MATCH         │          │
│  │ ├─ Bergen Health - Primary Care (Nursing) ✓ MATCH      │          │
│  │ ├─ Oslo Hospital - Pediatrics (Physiotherapy) ✗ SKIP   │          │
│  │ └─ Trondheim Mental - Psychiatry (Psychology) ✗ SKIP   │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  STEP 2: Filter by Date Overlap                                        │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ Placement: 2026-03-01 to 2026-05-30                    │          │
│  │                                                          │          │
│  │ Oslo Hospital Emergency: 2026-02-01 to 2026-06-30      │          │
│  │ ├─ Overlaps? YES ✓ (2026-02-01 <= 2026-05-30 AND      │          │
│  │ │              2026-06-30 >= 2026-03-01)               │          │
│  │ └─ IMPORT ✓                                             │          │
│  │                                                          │          │
│  │ Bergen Primary Care: 2026-03-15 to 2026-07-15         │          │
│  │ ├─ Overlaps? YES ✓                                     │          │
│  │ └─ IMPORT ✓                                             │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  STEP 3: Check Status & Duplicates                                     │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ Oslo Hospital Emergency                                 │          │
│  │ ├─ Status: "active" ✓                                  │          │
│  │ ├─ Already exists? NO ✓                                │          │
│  │ └─ ADD TO IMPORT LIST ✓                                │          │
│  │                                                          │          │
│  │ Bergen Primary Care                                     │          │
│  │ ├─ Status: "active" ✓                                  │          │
│  │ ├─ Already exists? NO ✓                                │          │
│  │ └─ ADD TO IMPORT LIST ✓                                │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  STEP 4: Transform Data                                                │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ QuotaOffering → QuotaSelection                          │          │
│  │                                                          │          │
│  │ {                              {                        │          │
│  │   praksisPlaceId: "place-1" ─→  placeId: "place-1"    │          │
│  │   praksisPlaceName: "Oslo..."─→  placeName: "Oslo..."  │          │
│  │   departmentId: "dept-1"    ─→  departmentId: "dept-1"│          │
│  │   departmentName: "Emerg..."─→  departmentName: "..."  │          │
│  │   capacity: 5               ─→  fixedQuota: 5         │          │
│  │                                 requestQuota: 0        │          │
│  │ }                              }                        │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  STEP 5: Update State                                                  │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ setQuotas([...existingQuotas, ...newQuotas])           │          │
│  │ setQuotasSelected(true)                                 │          │
│  │ setAutoImportedQuotasCount(2)                           │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  STEP 6: Show Feedback                                                 │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ toast.success("Auto-imported 2 quota(s)")              │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  Return: 2 (count of imported quotas)                                  │
└────────────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  USER SEES: Step 1/6 View                                              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🎉 Toast Notification (top-right)                                │ │
│  │ ┌────────────────────────────────────────────────────┐           │ │
│  │ │ ✓ Auto-imported 2 quota(s)                         │           │ │
│  │ │   Found 2 matching quota offering(s) for           │           │ │
│  │ │   Helse-, sosial og idrettsfag / Nursing           │           │ │
│  │ └────────────────────────────────────────────────────┘           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 💚 Green Alert (in Quotas section)                               │ │
│  │ ┌────────────────────────────────────────────────────┐           │ │
│  │ │ ✓ Quotas Auto-Imported                             │           │ │
│  │ │                                                     │           │ │
│  │ │ 2 quota offering(s) were automatically imported    │           │ │
│  │ │ based on your placement details. You can review    │           │ │
│  │ │ and adjust them below.                             │           │ │
│  │ └────────────────────────────────────────────────────┘           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Quota Overview                [Columns ▼] [Select/Request Quota] │ │
│  │ ┌────────────────────────────────────────────────────────────┐  │ │
│  │ │ Praksis Place               │ Department    │ Fixed │ Req.  │  │ │
│  │ ├────────────────────────────────────────────────────────────┤  │ │
│  │ │ Oslo University Hospital    │ Emergency...  │   5   │  0    │  │ │
│  │ │ Bergen Community Health Ctr │ Primary Care  │   3   │  0    │  │ │
│  │ └────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  USER CAN NOW:                                                          │
│  • Review auto-imported quotas ✓                                       │
│  • Adjust quantities ✓                                                 │
│  • Add more quotas manually ✓                                          │
│  • Delete unwanted quotas ✓                                            │
│  • Continue with uploading students ✓                                  │
└────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   SK Person     │ Creates Quota Offerings
│  (Contact)      │
└────────┬────────┘
         │
         │ Offers quotas to university programs
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  quotaOfferings: QuotaOffering[]                                        │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │ [                                                                   ││
│  │   {                                                                 ││
│  │     praksisPlaceId: "place-1",                                     ││
│  │     praksisPlaceName: "Oslo University Hospital",                  ││
│  │     studyId: "1",                                                   ││
│  │     programId: "1-1",                                               ││
│  │     capacity: 5,                                                    ││
│  │     startDate: "2026-02-01",                                        ││
│  │     endDate: "2026-06-30",                                          ││
│  │     status: "active"                                                ││
│  │   },                                                                ││
│  │   ...                                                               ││
│  │ ]                                                                   ││
│  └────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ Passed as prop
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PlacementTaskView Component                                            │
│  • Receives quotaOfferings prop                                         │
│  • Has autoImportQuotasFromOfferings() function                        │
│  • Manages quotas state                                                 │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ On form submit
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  autoImportQuotasFromOfferings()                                        │
│  • Filters quotaOfferings by study/program/date/status                 │
│  • Transforms to QuotaSelection format                                  │
│  • Updates component state                                              │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ Updates
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  placementTaskState.quotas: QuotaSelection[]                           │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │ [                                                                   ││
│  │   {                                                                 ││
│  │     placeId: "place-1",                                            ││
│  │     placeName: "Oslo University Hospital",                         ││
│  │     departmentId: "dept-1",                                         ││
│  │     departmentName: "Emergency Department",                         ││
│  │     fixedQuota: 5,                                                  ││
│  │     requestQuota: 0                                                 ││
│  │   },                                                                ││
│  │   ...                                                               ││
│  │ ]                                                                   ││
│  └────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
         │
         │ Used by
         ▼
┌─────────────────┐
│   PK Person     │ Reviews and uses quotas for student placement
│ (Coordinator)   │
└─────────────────┘
```

## Matching Algorithm

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MATCHING CRITERIA                                │
└─────────────────────────────────────────────────────────────────────────┘

Quota Offering                          Placement Details
┌─────────────────────────┐            ┌─────────────────────────┐
│ studyId: "1"            │ ══════════►│ studyId: "1"            │ ✓ MATCH
│ programId: "1-1"        │ ══════════►│ programId: "1-1"        │ ✓ MATCH
│ status: "active"        │ ══════════►│ (any status)            │ ✓ MATCH
│ startDate: 2026-02-01   │ ╗          │ startDate: 2026-03-01   │
│ endDate: 2026-06-30     │ ╚═══════► │ endDate: 2026-05-30     │ ✓ OVERLAP
└─────────────────────────┘            └─────────────────────────┘
         │                                          │
         └──────────────┬───────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   IMPORT THIS    │
              │   QUOTA! ✓       │
              └──────────────────┘

Date Overlap Logic:
─────────────────────
  Offering:    |═══════════════════════|
               02-01              06-30

  Placement:         |═══════════════|
                     03-01       05-30

  Overlap?    YES ✓  |═══════════|
                     03-01    05-30

  Formula: offeringStart <= placementEnd AND offeringEnd >= placementStart
           2026-02-01 <= 2026-05-30 (YES) AND 2026-06-30 >= 2026-03-01 (YES)
           → IMPORT ✓
```

---

**Legend**:
- `✓` = Success / Match / Yes
- `✗` = Skip / No Match / No
- `═` = Data flow
- `│` = Process flow
- `─` = Timeline

This visual diagram illustrates the complete flow from SK person creating offerings to PK coordinator receiving auto-imported quotas!
