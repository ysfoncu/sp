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
  reservationType?: 'permanent' | 'deadline'; // Permanent reservation or usable until a deadline
  deadline?: string; // yyyy-MM-dd; required when reservationType is 'deadline'
  requiresApproval?: boolean; // Whether the praksis place must approve this entity's quota
}

// endDate used for permanent reservations so period filters and timelines keep working
export const PERMANENT_END_DATE = "9999-12-31";

// Human-readable reservation for an entity; falls back to the request period for legacy data
export const formatReservation = (
  entity: Pick<EntityDistribution, 'reservationType' | 'deadline'>,
  request: Pick<CoordinatorQuotaRequest, 'startDate' | 'endDate'>,
): string => {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (entity.reservationType === 'permanent') return "Permanent";
  if (entity.reservationType === 'deadline' && entity.deadline) return `Until ${fmt(entity.deadline)}`;
  if (request.endDate === PERMANENT_END_DATE) return "Permanent";
  return `${fmt(request.startDate)} - ${fmt(request.endDate)}`;
};

// Request-level status/approval derived from its entities: approved only when every entity is
export const deriveRequestApproval = (
  entities: EntityDistribution[],
): Pick<CoordinatorQuotaRequest, 'status' | 'approvedCapacity'> & { allApproved: boolean } => {
  const approved = entities.filter((e) => e.status === 'approved');
  const allApproved = entities.length > 0 && approved.length === entities.length;
  return {
    status: allApproved ? 'approved' : 'pending',
    approvedCapacity:
      approved.length > 0 ? approved.reduce((sum, e) => sum + (e.approvedQuota ?? 0), 0) : undefined,
    allApproved,
  };
};

// Emner covered by a request (new requests use emner[]; legacy ones a single emne)
export const getRequestEmner = (
  request: Pick<CoordinatorQuotaRequest, 'emne' | 'emner'>,
): string[] => request.emner ?? (request.emne ? [request.emne] : []);

// A placement can only use quota configured in Capacity planning for its study, program and emne,
// that is not rejected and whose reservation is still valid when the placement starts.
export const requestUsableForPlacement = (
  request: CoordinatorQuotaRequest,
  placement: { studyId?: string; programId?: string; emne?: string; startDate?: string },
): boolean => {
  if (!placement.studyId || !placement.programId || !placement.emne) return false;
  if (request.studyId !== placement.studyId || request.programId !== placement.programId) return false;
  if (!getRequestEmner(request).includes(placement.emne)) return false;
  if (request.status === 'rejected') return false;
  if (placement.startDate && request.endDate && request.endDate < placement.startDate) return false;
  return true;
};

export const isDeadlineExpired =(entity: Pick<EntityDistribution, 'reservationType' | 'deadline'>): boolean => {
  if (entity.reservationType !== 'deadline' || !entity.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(entity.deadline) < today;
};

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
  emne?: string; // Optional course/subject field (joined emner for new requests)
  emner?: string[]; // Selected emner sharing this request's quota pool
  
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

// Capacity planning starts empty — quota requests are created by the coordinator at runtime
export const mockCoordinatorQuotaRequests: CoordinatorQuotaRequest[] = [];
