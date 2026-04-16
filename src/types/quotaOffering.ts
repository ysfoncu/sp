// Types for Quota Offerings - SK person offering capacity to universities/programs

export interface QuotaOffering {
  id: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  universityId: string;
  universityName: string;
  departmentId: string;
  departmentName: string;
  studyId: string; // Links to Study
  studyName: string;
  programId: string; // Links to StudyProgram
  programName: string;
  capacity: number; // Number of student places offered
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "expired";
  createdDate: string;
  updatedDate: string;
  notes?: string;
}

// Mock data for Quota Offerings - SK person side
// Start empty - use "Generate Praksis Places" button to create test data
export const mockQuotaOfferings: QuotaOffering[] = [];