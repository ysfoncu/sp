export type PriorityReason =
  | "medicinska_skal"
  | "ensam_vardnadshavare"
  | "vardnadshavare_barn_8"
  | "vard_av_funktionshindrad"
  | "studerandefackligt"
  | "andra_skal";

export const PRIORITY_REASON_LABELS: Record<PriorityReason, string> = {
  medicinska_skal: "Medical reasons",
  ensam_vardnadshavare: "Sole guardian of a child under 18 years of age",
  vardnadshavare_barn_8: "Guardian of a child under 8 years of age",
  vard_av_funktionshindrad: "Care of a person with disability or serious illness",
  studerandefackligt: "Student union work or active research",
  andra_skal:
    "Other compelling or social reasons (e.g. elite athlete with agreement with Umeå University)",
};

export const PRIORITY_REASON_POINTS: Record<PriorityReason, number> = {
  medicinska_skal: 1,
  ensam_vardnadshavare: 2,
  vardnadshavare_barn_8: 4,
  vard_av_funktionshindrad: 8,
  studerandefackligt: 16,
  andra_skal: 32,
};

export interface EnrolledStudent {
  id: string;
  name: string;
  personnummer: string;
  programId: string;
  programName: string;
  studyId: string;
  studyName: string;
  studyLocation: string;
  admissionTerm: string;
  email: string;
  phone?: string;
  temporaryAddress?: string;
  hasDriversLicense: boolean;
  emneId?: string; // students from Praksis-students carry their emne and the start of their praksis
  startDate?: string;
}

export interface PriorityPlacementPeriod {
  id: string;
  year: string;
  semester: "HT" | "VT";
  programIds: string[];
  studyIds: string[];
  emneIds?: string[];
  admissionTerms: string[];
  studyLocations: string[];
  deadline?: string;
  status: "open" | "closed";
  createdBy: string;
  createdDate: string;
  eligibleStudentIds: string[];
  importedStudentIds: string[];
  firstNoticeDate?: string; // Planned "noticing students" date, set at creation
  firstNoticeSentAt?: string;
  firstNoticeDeadline?: string;
  firstNoticeMessage?: string;
  resultPublishedAt?: string;
}

export interface PriorityPlacementApplication {
  id: string;
  periodId: string;
  studentId: string;
  studentName: string;
  personnummer: string;
  programId: string;
  programName: string;
  studyId: string;
  studyName: string;
  studyLocation: string;
  admissionTerm: string;
  targetSemester: string;
  selectedReasons: PriorityReason[];
  totalPoints: number;
  hasDriversLicense: boolean;
  placementConstraints?: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: string;
  decidedDate?: string;
  decisionNotes?: string;
  isManualGrant: boolean;
  published: boolean;
  noticeSentAt?: string;
  attachedDocuments?: { name: string; size: number }[];
}

export const mockEnrolledStudents: EnrolledStudent[] = [];

export const mockPriorityPeriods: PriorityPlacementPeriod[] = [];

export const mockPriorityApplications: PriorityPlacementApplication[] = [];
