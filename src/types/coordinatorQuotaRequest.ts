// Types for Coordinator Quota Requests - PK person requesting capacity from praksis places

// Entity distribution for distributed quota requests
export interface EntityDistribution {
  id: string; // Unique ID for this distribution
  entityId: string; // Sub-entity (department) ID
  entityName: string; // e.g., "Ortopedisk klinikk"
  requestedQuota: number; // e.g., 2
  approvedQuota?: number; // Capacity approved by SK person for this entity
  consumedQuota?: number; // How many actually used for this entity
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
 
];