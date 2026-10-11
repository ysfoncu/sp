// Types for Student Placements
export interface StudentPlacement {
  id: string;
  title: string;
  year: string;
  semester: string;
  subject: string; // the emne's name, as a label
  emneId?: string; // the emne's id in the catalog; what matching uses
  students: number;
  startDate: string;
  endDate: string;
  status: "draft" | "upload" | "select" | "publish" | "completed";
  studyId: string;
  programId: string;
  totalPraksisHours?: number;
}

// Placement Task State - stores the working state of a placement
export interface PlacementTaskState {
  placementId: string;
  studentsImported: boolean;
  students: any[]; // Student[] from placementTask.ts
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