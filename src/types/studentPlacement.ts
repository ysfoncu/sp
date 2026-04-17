// Types for Student Placements
export interface StudentPlacement {
  id: string;
  title: string;
  year: string;
  semester: string;
  subject: string;
  students: number;
  startDate: string;
  endDate: string;
  status: "draft" | "upload" | "select" | "publish" | "completed";
  studyId: string;
  programId: string;
}

// Placement Task State - stores the working state of a placement
export interface PlacementTaskState {
  placementId: string;
  studentsImported: boolean;
  students: any[]; // Student[] from placementTask.ts
  quotasSelected: boolean;
  quotas: any[]; // QuotaSelection[] from SlideOverManageQuota
  firstPublished: boolean;
  studentsAssigned: boolean;
  documentsAttached: boolean;
  finalPublished: boolean;
  completedTasks: string[]; // Task IDs
  assignmentPublished?: boolean;
  assignmentPublishedDate?: string;
}

// Mock data for Student Placements
export const mockStudentPlacements: StudentPlacement[] = [];

// Mock Placement Task States - represents the state of each placement task
export const mockPlacementTaskStates: PlacementTaskState[] = [];