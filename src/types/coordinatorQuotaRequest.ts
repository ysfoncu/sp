// Types for Coordinator Quota Requests - PK person requesting capacity from praksis places

// Entity distribution for distributed quota requests
export interface EntityDistribution {
  id: string; // Unique ID for this distribution
  entityId: string; // Sub-entity (department) ID
  entityName: string; // e.g., "Ortopedisk klinikk"
  requestedQuota: number; // e.g., 2
  approvedQuota?: number; // Capacity approved by SK person for this entity
  consumedQuota?: number; // How many actually used for this entity
  status?: 'pending' | 'approved' | 'rejected'; // Per-entity review status
  contactPersonId?: string; // Contact person ID for this specific entity
  contactPersonName?: string; // Contact person name for this specific entity
  contactPersonEmail?: string; // Contact person email for this specific entity
}

export interface CoordinatorQuotaRequest {
  id: string;
  
  // Placement context
  placementId: string; // Link to specific placement task
  
  // From (Praksis Place)
  praksisPlaceId: string;
  praksisPlaceName: string;
  
  // Entity distributions - NEW: Support for distributing quota across multiple departments
  entityDistributions?: EntityDistribution[]; // Array of entity distributions
  
  // Legacy fields for backward compatibility (deprecated - use entityDistributions instead)
  departmentId: string;
  departmentName: string;
  
  // To (University - Oslo University)
  universityId: string;
  universityName: string;
  studyId: string;
  studyName: string;
  programId: string;
  programName: string;
  emne?: string; // Optional course/subject field
  
  // Request details
  requestedCapacity: number;
  approvedCapacity?: number; // Capacity approved by SK person (may differ from requested)
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  
  // Metadata
  requestedBy: string; // PK person name
  requestedDate: string;
  approvedDate?: string;
  approvedBy?: string; // SK person name
  rejectedDate?: string;
  rejectedBy?: string; // SK person name
  rejectionReason?: string;
  responseNotes?: string; // SK person's notes on approval/rejection
  notes?: string; // PK person's original request notes
}

// Mock data for Coordinator Quota Requests — connected to mockStudentPlacements
// (sp-1: Oslo University Hospital HF; sp-2: Bergen Kommune). Entities and
// capacities line up with the students assigned in mockPlacementTaskStates.
export const mockCoordinatorQuotaRequests: CoordinatorQuotaRequest[] = [
  {
    id: "cqr-sp1-oslo",
    placementId: "sp-1",
    praksisPlaceId: "place-oslo-university-hospital",
    praksisPlaceName: "Oslo University Hospital HF",
    entityDistributions: [
      {
        id: "ed-sp1-emergency",
        entityId: "dept-emergency",
        entityName: "Emergency Department",
        requestedQuota: 3,
        approvedQuota: 3,
        consumedQuota: 2,
        status: "approved",
      },
      {
        id: "ed-sp1-pediatrics",
        entityId: "dept-pediatrics",
        entityName: "Pediatrics",
        requestedQuota: 2,
        approvedQuota: 1,
        consumedQuota: 1,
        status: "approved",
      },
    ],
    departmentId: "dept-emergency",
    departmentName: "Emergency Department",
    universityId: "U1",
    universityName: "University of Oslo",
    studyId: "1",
    studyName: "Helse-, sosial og idrettsfag",
    programId: "1-1",
    programName: "Nursing",
    emne: "SYK301",
    requestedCapacity: 5,
    approvedCapacity: 4,
    startDate: "2026-01-15",
    endDate: "2026-05-30",
    status: "approved",
    requestedBy: "John Coordinator",
    requestedDate: "2025-11-10T09:00:00.000Z",
    approvedDate: "2025-11-14T10:30:00.000Z",
    approvedBy: "Sarah Contact",
  },
  {
    id: "cqr-sp1-oslo-surgery",
    placementId: "sp-1",
    praksisPlaceId: "place-oslo-university-hospital",
    praksisPlaceName: "Oslo University Hospital HF",
    entityDistributions: [
      {
        id: "ed-sp1-surgery",
        entityId: "dept-surgery",
        entityName: "Surgery",
        requestedQuota: 2,
        status: "pending",
      },
    ],
    departmentId: "dept-surgery",
    departmentName: "Surgery",
    universityId: "U1",
    universityName: "University of Oslo",
    studyId: "1",
    studyName: "Helse-, sosial og idrettsfag",
    programId: "1-1",
    programName: "Nursing",
    emne: "SYK301",
    requestedCapacity: 2,
    startDate: "2026-01-15",
    endDate: "2026-05-30",
    status: "pending",
    requestedBy: "John Coordinator",
    requestedDate: "2025-11-20T09:00:00.000Z",
  },
  {
    id: "cqr-sp1-bergen",
    placementId: "sp-1",
    praksisPlaceId: "place-bergen-kommune",
    praksisPlaceName: "Bergen Kommune",
    entityDistributions: [
      {
        id: "ed-sp1-bergen-primary",
        entityId: "dept-primary-care",
        entityName: "Primary Care",
        requestedQuota: 2,
        approvedQuota: 2,
        consumedQuota: 0,
        status: "approved",
      },
    ],
    departmentId: "dept-primary-care",
    departmentName: "Primary Care",
    universityId: "U1",
    universityName: "University of Oslo",
    studyId: "1",
    studyName: "Helse-, sosial og idrettsfag",
    programId: "1-1",
    programName: "Nursing",
    emne: "SYK301",
    requestedCapacity: 2,
    approvedCapacity: 2,
    startDate: "2026-01-15",
    endDate: "2026-05-30",
    status: "approved",
    requestedBy: "John Coordinator",
    requestedDate: "2025-11-12T09:00:00.000Z",
    approvedDate: "2025-11-15T10:00:00.000Z",
    approvedBy: "Sarah Contact",
  },
  {
    id: "cqr-sp2-bergen",
    placementId: "sp-2",
    praksisPlaceId: "place-bergen-kommune",
    praksisPlaceName: "Bergen Kommune",
    entityDistributions: [
      {
        id: "ed-sp2-primary",
        entityId: "dept-primary-care",
        entityName: "Primary Care",
        requestedQuota: 4,
        approvedQuota: 3,
        consumedQuota: 2,
        status: "approved",
      },
    ],
    departmentId: "dept-primary-care",
    departmentName: "Primary Care",
    universityId: "U1",
    universityName: "University of Oslo",
    studyId: "1",
    studyName: "Helse-, sosial og idrettsfag",
    programId: "1-1",
    programName: "Nursing",
    emne: "SYK201",
    requestedCapacity: 4,
    approvedCapacity: 3,
    startDate: "2026-08-20",
    endDate: "2026-12-15",
    status: "approved",
    requestedBy: "John Coordinator",
    requestedDate: "2026-05-12T09:00:00.000Z",
    approvedDate: "2026-05-16T11:00:00.000Z",
    approvedBy: "Sarah Contact",
  },
];