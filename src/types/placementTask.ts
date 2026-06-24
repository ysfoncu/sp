export interface Student {
  id: string;
  name: string;
  personnummer?: string;
  email: string;
  year: string;
  assignedPraksisPlace?: {
    placeId: string;
    placeName: string;
    departmentId: string;
    departmentName: string;
    entityId?: string; // For multi-entity requests - specific entity (department/unit) ID
    placementTaskId?: string; // Link to specific placement task
    quotaRequestId?: string; // Link to specific coordinator quota request
    approvalRequested?: boolean;
    approvalStatus?: "pending" | "approved" | "rejected";
    startDate?: string;
    endDate?: string;
    placementTitle?: string;
    assignedDate?: string;
  };
  supervisor?: {
    id: string;
    name: string;
  };
  supervisors?: Array<{
    id: string;
    name: string;
  }>;
  priorities?: string;
  customRequestSubmitted: boolean;
  customRequest?: {
    preferredPlaceName: string;
    message: string;
    submittedAt: string;
  };
  placementHistory?: {
    placementId: string;
    status: "previous" | "current" | "upcoming";
    semester: string;
    year: string;
    emne?: string; // Subject code, e.g. "SYK301"
    praksisPlaceName?: string; // e.g. "Oslo University Hospital HF"
    unitName?: string; // Optional sub-unit, e.g. "Kirurgisk klinikk"
  }[];
  attachedFiles?: {
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
  }[];
}

export interface PlacementTask {
  id: string;
  step: string;
  title: string;
  description: string;
  status: "mandatory" | "optional";
  completed: boolean;
  actionType: "navigate" | "publish" | "mark" | "auto";
  actionLabel: string;
}

export const placementTasks: PlacementTask[] = [
  {
    id: "1",
    step: "1/6",
    title: "Setup Students & Quotas",
    description:
      "Select/request quotas from praksis places, then import students",
    status: "mandatory",
    completed: false,
    actionType: "auto",
    actionLabel: "Auto-completes",
  },
  {
    id: "3",
    step: "2/6",
    title: "First publish",
    description:
      "Students will be able to submit their custom requests",
    status: "mandatory",
    completed: false,
    actionType: "publish",
    actionLabel: "Publish",
  },
  {
    id: "4",
    step: "3/6",
    title: "Attach praksis places to the students",
    description:
      "Use students tab or praksis places tab to assign praksis places to the students",
    status: "mandatory",
    completed: false,
    actionType: "auto",
    actionLabel: "Auto-completes",
  },
  {
    id: "5",
    step: "4/6",
    title: "Attach required documents",
    description:
      "Use praksis places tab to send documents to praksis places",
    status: "optional",
    completed: false,
    actionType: "mark",
    actionLabel: "Mark as completed",
  },
  {
    id: "6",
    step: "5/6",
    title: "Assign supervisors to the students",
    description:
      "Use students tab to assign supervisors to the students",
    status: "optional",
    completed: false,
    actionType: "mark",
    actionLabel: "Mark as completed",
  },
  {
    id: "7",
    step: "6/6",
    title: "Second publish",
    description: "Finalise and publish the placement",
    status: "mandatory",
    completed: false,
    actionType: "auto",
    actionLabel: "Auto-completes",
  },
];

export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Emma Johnson",
    personnummer: "20011014-2398",
    email: "emma.johnson@university.edu",
    year: "3rd Year",
    customRequestSubmitted: false,
    placementHistory: [
      {
        placementId: "p1",
        status: "previous",
        semester: "Fall",
        year: "2024",
        emne: "SYK201",
        praksisPlaceName: "Oslo University Hospital HF",
        unitName: "Akuttavdeling",
      },
      {
        placementId: "p2",
        status: "previous",
        semester: "Spring",
        year: "2025",
        emne: "SYK301",
        praksisPlaceName: "Bergen Kommune",
        unitName: "Solhaugen Sykehjem",
      },
    ],
  },
  {
    id: "2",
    name: "Michael Chen",
    personnummer: "19990822-1547",
    email: "michael.chen@university.edu",
    year: "2nd Year",
    customRequestSubmitted: false,
    placementHistory: [],
  },
  {
    id: "3",
    name: "Sarah Williams",
    personnummer: "20020203-8821",
    email: "sarah.williams@university.edu",
    year: "4th Year",
    customRequestSubmitted: false,
    placementHistory: [
      {
        placementId: "p5",
        status: "previous",
        semester: "Fall",
        year: "2023",
        emne: "SYK101",
        praksisPlaceName: "Trondheim Mental Health Services",
        unitName: "Adult Psychiatry",
      },
      {
        placementId: "p6",
        status: "previous",
        semester: "Spring",
        year: "2024",
        emne: "SYK201",
        praksisPlaceName: "Bergen Kommune",
        unitName: "Fjellsiden Sykehjem",
      },
      {
        placementId: "p7",
        status: "previous",
        semester: "Fall",
        year: "2024",
        emne: "SYK301",
        praksisPlaceName: "Oslo University Hospital HF",
        unitName: "Kirurgisk klinikk",
      },
      {
        placementId: "current",
        status: "current",
        semester: "Fall",
        year: "2025",
        emne: "SYK401",
        praksisPlaceName: "Oslo University Hospital HF",
        unitName: "Akuttklinikk",
      },
    ],
  },
  {
    id: "4",
    name: "David Rodriguez",
    personnummer: "20000511-6390",
    email: "david.rodriguez@university.edu",
    year: "3rd Year",
    customRequestSubmitted: false,
    placementHistory: [],
  },
  {
    id: "5",
    name: "Lisa Anderson",
    personnummer: "20010727-4412",
    email: "lisa.anderson@university.edu",
    year: "2nd Year",
    customRequestSubmitted: false,
    placementHistory: [
      {
        placementId: "p9",
        status: "upcoming",
        semester: "Spring",
        year: "2026",
        emne: "SYK202",
        praksisPlaceName: "Bergen Kommune",
        unitName: "Strandsiden Omsorgssenter",
      },
    ],
  },
];