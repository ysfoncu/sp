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
  totalPraksisHours?: number;
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
export const mockStudentPlacements: StudentPlacement[] = [
  {
    id: "sp-1",
    title: "Nursing clinical placement — Spring 2026",
    year: "2026",
    semester: "Spring",
    subject: "SYK301",
    students: 3,
    startDate: "2026-01-15",
    endDate: "2026-05-30",
    status: "publish",
    studyId: "1",
    programId: "1-1",
    totalPraksisHours: 320,
  },
  {
    id: "sp-2",
    title: "Nursing clinical placement — Autumn 2026",
    year: "2026",
    semester: "Autumn",
    subject: "SYK201",
    students: 3,
    startDate: "2026-08-20",
    endDate: "2026-12-15",
    status: "select",
    studyId: "1",
    programId: "1-1",
    totalPraksisHours: 280,
  },
];

// Mock Placement Task States - represents the state of each placement task
export const mockPlacementTaskStates: PlacementTaskState[] = [
  {
    placementId: "sp-1",
    studentsImported: true,
    students: [
      {
        id: "1",
        name: "Emma Johnson",
        personnummer: "20011014-2398",
        email: "emma.johnson@student.umu.se",
        year: "2026",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: "place-oslo-university-hospital",
          placeName: "Oslo University Hospital HF",
          departmentId: "dept-emergency",
          departmentName: "Emergency Department",
          startDate: "2026-01-15",
          endDate: "2026-05-30",
          placementTitle: "Nursing clinical placement — Spring 2026",
          assignedDate: "2026-01-05",
          approvalStatus: "approved",
        },
        supervisor: { id: "supervisor-anna-hansen", name: "Dr. Anna Hansen" },
        supervisors: [{ id: "supervisor-anna-hansen", name: "Dr. Anna Hansen" }],
      },
      {
        id: "2",
        name: "Michael Chen",
        personnummer: "19990822-1547",
        email: "michael.chen@student.umu.se",
        year: "2026",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: "place-oslo-university-hospital",
          placeName: "Oslo University Hospital HF",
          departmentId: "dept-emergency",
          departmentName: "Emergency Department",
          startDate: "2026-01-15",
          endDate: "2026-05-30",
          placementTitle: "Nursing clinical placement — Spring 2026",
          assignedDate: "2026-01-05",
          approvalStatus: "approved",
        },
        supervisor: { id: "supervisor-lars-olsen", name: "Dr. Lars Olsen" },
        supervisors: [{ id: "supervisor-lars-olsen", name: "Dr. Lars Olsen" }],
      },
      {
        id: "3",
        name: "Sarah Williams",
        personnummer: "20020203-8821",
        email: "sarah.williams@student.umu.se",
        year: "2026",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: "place-oslo-university-hospital",
          placeName: "Oslo University Hospital HF",
          departmentId: "dept-pediatrics",
          departmentName: "Pediatrics",
          startDate: "2026-01-15",
          endDate: "2026-05-30",
          placementTitle: "Nursing clinical placement — Spring 2026",
          assignedDate: "2026-01-05",
          approvalStatus: "approved",
        },
        supervisor: { id: "supervisor-maria-johansen", name: "Dr. Maria Johansen" },
        supervisors: [
          { id: "supervisor-maria-johansen", name: "Dr. Maria Johansen" },
        ],
      },
    ],
    quotasSelected: true,
    quotas: [],
    firstPublished: true,
    studentsAssigned: true,
    documentsAttached: false,
    finalPublished: false,
    completedTasks: ["import-students", "select-quotas", "assign-students"],
    assignmentPublished: true,
    assignmentPublishedDate: "2026-01-08",
  },
  {
    placementId: "sp-2",
    studentsImported: true,
    students: [
      {
        id: "4",
        name: "Lars Eriksson",
        personnummer: "20000118-7723",
        email: "lars.eriksson@student.umu.se",
        year: "2026",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: "place-bergen-kommune",
          placeName: "Bergen Kommune",
          departmentId: "dept-primary-care",
          departmentName: "Primary Care",
          startDate: "2026-08-20",
          endDate: "2026-12-15",
          placementTitle: "Nursing clinical placement — Autumn 2026",
          assignedDate: "2026-08-10",
          approvalStatus: "pending",
        },
        supervisor: { id: "supervisor-erik-andersen", name: "Dr. Erik Andersen" },
        supervisors: [
          { id: "supervisor-erik-andersen", name: "Dr. Erik Andersen" },
        ],
      },
      {
        id: "5",
        name: "Astrid Lindqvist",
        personnummer: "20010906-5512",
        email: "astrid.lindqvist@student.umu.se",
        year: "2026",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: "place-bergen-kommune",
          placeName: "Bergen Kommune",
          departmentId: "dept-primary-care",
          departmentName: "Primary Care",
          startDate: "2026-08-20",
          endDate: "2026-12-15",
          placementTitle: "Nursing clinical placement — Autumn 2026",
          assignedDate: "2026-08-10",
          approvalStatus: "pending",
        },
        supervisor: { id: "supervisor-erik-andersen", name: "Dr. Erik Andersen" },
        supervisors: [
          { id: "supervisor-erik-andersen", name: "Dr. Erik Andersen" },
        ],
      },
      {
        // Imported but not yet assigned to a praksis place
        id: "6",
        name: "Johan Bergström",
        personnummer: "19991203-3340",
        email: "johan.bergstrom@student.umu.se",
        year: "2026",
        customRequestSubmitted: false,
      },
    ],
    quotasSelected: true,
    quotas: [],
    firstPublished: false,
    studentsAssigned: false,
    documentsAttached: false,
    finalPublished: false,
    completedTasks: ["import-students", "select-quotas"],
  },
];