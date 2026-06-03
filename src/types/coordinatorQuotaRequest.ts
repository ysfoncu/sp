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

// Mock data for Coordinator Quota Requests
export const mockCoordinatorQuotaRequests: CoordinatorQuotaRequest[] = [
  {
    id: "cqr-mock-1",
    placementId: "mock-placement-1",
    praksisPlaceId: "place-oslo-university-hospital",
    praksisPlaceName: "Oslo University Hospital HF",
    departmentId: "klinikk-kirurgi",
    departmentName: "Kirurgisk klinikk",
    entityDistributions: [
      { id: "ed-1", entityId: "klinikk-kirurgi", entityName: "Kirurgisk klinikk", requestedQuota: 3, approvedQuota: 2, status: "approved" },
    ],
    universityId: "U1",
    universityName: "University of Oslo",
    studyId: "1",
    studyName: "Helse-, sosial og idrettsfag",
    programId: "1-1",
    programName: "Nursing",
    emne: "SYK301",
    requestedCapacity: 3,
    approvedCapacity: 2,
    startDate: "2026-08-01",
    endDate: "2026-12-15",
    requestedDate: "2026-05-01T10:00:00.000Z",
    status: "approved",
  },
  {
    id: "cqr-mock-2",
    placementId: "mock-placement-1",
    praksisPlaceId: "place-oslo-university-hospital",
    praksisPlaceName: "Oslo University Hospital HF",
    departmentId: "klinikk-ortopedi",
    departmentName: "Ortopedisk klinikk",
    entityDistributions: [
      { id: "ed-2", entityId: "klinikk-ortopedi", entityName: "Ortopedisk klinikk", requestedQuota: 2, status: "pending" },
    ],
    universityId: "U1",
    universityName: "University of Oslo",
    studyId: "1",
    studyName: "Helse-, sosial og idrettsfag",
    programId: "1-1",
    programName: "Nursing",
    emne: "SYK201",
    requestedCapacity: 2,
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    requestedDate: "2026-05-10T10:00:00.000Z",
    status: "pending",
  },
  {
    id: "cqr-mock-3",
    placementId: "mock-placement-2",
    praksisPlaceId: "place-bergen-kommune",
    praksisPlaceName: "Bergen Kommune",
    departmentId: "dept-physiotherapy",
    departmentName: "Physiotherapy Unit",
    entityDistributions: [
      { id: "ed-3", entityId: "dept-physiotherapy", entityName: "Physiotherapy Unit", requestedQuota: 4, status: "pending" },
    ],
    universityId: "U1",
    universityName: "University of Oslo",
    studyId: "1",
    studyName: "Helse-, sosial og idrettsfag",
    programId: "1-2",
    programName: "Physiotherapy",
    emne: "FYS301",
    requestedCapacity: 4,
    startDate: "2026-08-15",
    endDate: "2026-12-01",
    requestedDate: "2026-05-12T10:00:00.000Z",
    status: "pending",
  },
];