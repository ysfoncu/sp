export interface Student {
  id: string;
  name: string;
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
  customRequestSubmitted: boolean;
  customRequest?: {
    preferredPlaceName: string;
    message: string;
    submittedAt: string;
  };
  placementHistory?: {
    placementId: string;
    placementName: string;
    status: "previous" | "current" | "upcoming";
    semester: string;
    year: string;
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
    email: "emma.johnson@university.edu",
    year: "3rd Year",
    customRequestSubmitted: false,
    placementHistory: [
      {
        placementId: "p1",
        placementName: "Nursing Placement Fall 2024",
        status: "previous",
        semester: "Fall",
        year: "2024",
      },
      {
        placementId: "p2",
        placementName: "Clinical Practice Spring 2025",
        status: "previous",
        semester: "Spring",
        year: "2025",
      },
    ],
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@university.edu",
    year: "2nd Year",
    customRequestSubmitted: false,
    placementHistory: [],
  },
  {
    id: "3",
    name: "Sarah Williams",
    email: "sarah.williams@university.edu",
    year: "4th Year",
    customRequestSubmitted: false,
    placementHistory: [
      {
        placementId: "p5",
        placementName: "Foundation Fall 2023",
        status: "previous",
        semester: "Fall",
        year: "2023",
      },
      {
        placementId: "p6",
        placementName: "Intermediate Spring 2024",
        status: "previous",
        semester: "Spring",
        year: "2024",
      },
      {
        placementId: "p7",
        placementName: "Advanced Fall 2024",
        status: "previous",
        semester: "Fall",
        year: "2024",
      },
      {
        placementId: "current",
        placementName: "Advanced Clinical Fall 2025",
        status: "current",
        semester: "Fall",
        year: "2025",
      },
    ],
  },
  {
    id: "4",
    name: "David Rodriguez",
    email: "david.rodriguez@university.edu",
    year: "3rd Year",
    customRequestSubmitted: false,
    placementHistory: [],
  },
  {
    id: "5",
    name: "Lisa Anderson",
    email: "lisa.anderson@university.edu",
    year: "2nd Year",
    customRequestSubmitted: false,
    placementHistory: [
      {
        placementId: "p9",
        placementName: "Specialization Spring 2026",
        status: "upcoming",
        semester: "Spring",
        year: "2026",
      },
    ],
  },
];