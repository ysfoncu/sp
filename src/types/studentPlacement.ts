// Types for Student Placements
import type { EntitySlot } from "./placementSlots";

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
  location?: string; // optional: only the students who study at this location were taken
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
  assignmentPublished?: boolean; // published to students (the second publish step)
  assignmentPublishedDate?: string;
  entitiesPublished?: boolean; // published to entities (the first publish step); see publishState.ts
  entitiesPublishedDate?: string;
  // The entities this placement uses and their slots (see placementSlots.ts); undefined = every fitting entity
  entitySlots?: EntitySlot[];
  entitySlotsConfirmed?: boolean; // the entities step was completed
}

// Mock data for Student Placements
export const mockStudentPlacements: StudentPlacement[] = [];

// Mock Placement Task States - represents the state of each placement task
export const mockPlacementTaskStates: PlacementTaskState[] = [];