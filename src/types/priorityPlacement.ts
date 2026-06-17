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

export const mockEnrolledStudents: EnrolledStudent[] = [
  {
    id: "1",
    name: "Emma Johnson",
    personnummer: "20010315-4821",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "emma.johnson@student.umu.se",
    phone: "070-123 45 67",
    hasDriversLicense: true,
  },
  {
    id: "2",
    name: "Michael Chen",
    personnummer: "20020712-3301",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "michael.chen@student.umu.se",
    hasDriversLicense: false,
  },
  {
    id: "3",
    name: "Sarah Williams",
    personnummer: "20000928-2145",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "sarah.williams@student.umu.se",
    phone: "073-987 65 43",
    hasDriversLicense: true,
  },
  {
    id: "4",
    name: "Lars Eriksson",
    personnummer: "20011104-5530",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "lars.eriksson@student.umu.se",
    temporaryAddress: "Storgatan 14, 903 27 Umeå",
    hasDriversLicense: true,
  },
  {
    id: "5",
    name: "Astrid Lindqvist",
    personnummer: "20020203-7812",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "VT-2026",
    email: "astrid.lindqvist@student.umu.se",
    hasDriversLicense: false,
  },
  {
    id: "6",
    name: "Johan Bergström",
    personnummer: "20010819-6620",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "VT-2026",
    email: "johan.bergstrom@student.umu.se",
    phone: "076-543 21 09",
    hasDriversLicense: true,
  },
  {
    id: "7",
    name: "Maria Svensson",
    personnummer: "20030115-9934",
    programId: "physiotherapy",
    programName: "Physiotherapy Programme",
    studyId: "health-social",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "maria.svensson@student.umu.se",
    hasDriversLicense: true,
  },
  {
    id: "8",
    name: "Anders Nilsson",
    personnummer: "20020507-1127",
    programId: "physiotherapy",
    programName: "Physiotherapy Programme",
    studyId: "health-social",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "anders.nilsson@student.umu.se",
    temporaryAddress: "Vasagatan 8B, 903 22 Umeå",
    hasDriversLicense: false,
  },
  {
    id: "9",
    name: "Karin Johansson",
    personnummer: "20011222-4456",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Stockholm",
    admissionTerm: "HT-2025",
    email: "karin.johansson@student.umu.se",
    phone: "072-345 67 89",
    hasDriversLicense: true,
  },
  {
    id: "10",
    name: "Erik Magnusson",
    personnummer: "20020908-3318",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Stockholm",
    admissionTerm: "VT-2026",
    email: "erik.magnusson@student.umu.se",
    hasDriversLicense: false,
  },
  {
    id: "11",
    name: "Frida Karlsson",
    personnummer: "20030428-7741",
    programId: "physiotherapy",
    programName: "Physiotherapy Programme",
    studyId: "health-social",
    studyName: "Health, Care and Welfare",
    studyLocation: "Stockholm",
    admissionTerm: "HT-2025",
    email: "frida.karlsson@student.umu.se",
    phone: "070-998 87 76",
    hasDriversLicense: true,
  },
  {
    id: "12",
    name: "Oskar Pettersson",
    personnummer: "20010630-2293",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "oskar.pettersson@student.umu.se",
    hasDriversLicense: true,
  },
  {
    id: "13",
    name: "Petra Holm",
    personnummer: "20020810-4421",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "petra.holm@student.umu.se",
    hasDriversLicense: false,
  },
  {
    id: "14",
    name: "Viktor Lundgren",
    personnummer: "20010425-7762",
    programId: "physiotherapy",
    programName: "Physiotherapy Programme",
    studyId: "health-social",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "viktor.lundgren@student.umu.se",
    phone: "073-567 89 01",
    hasDriversLicense: true,
  },
  {
    id: "15",
    name: "Lena Söderberg",
    personnummer: "20030617-3389",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    email: "lena.soderberg@student.umu.se",
    phone: "076-234 56 78",
    hasDriversLicense: true,
  },
];

export const mockPriorityPeriods: PriorityPlacementPeriod[] = [
  // Temporarily hidden — uncomment to restore mock priority periods.
  // {
  //   id: "pp-1",
  //   year: "2026",
  //   semester: "VT",
  //   programIds: ["1-1"],
  //   studyIds: ["1"],
  //   admissionTerms: ["HT-2025"],
  //   studyLocations: ["Umeå"],
  //   deadline: "2026-05-15",
  //   status: "open",
  //   createdBy: "John Coordinator",
  //   createdDate: "2026-03-01",
  //   eligibleStudentIds: ["1", "2", "3", "4", "12"],
  //   importedStudentIds: ["1", "2", "3", "4"],
  //   firstNoticeSentAt: "2026-04-01",
  //   firstNoticeDeadline: "2026-05-15",
  //   firstNoticeMessage: "You can now apply for priority placement for your upcoming clinical placement. Application deadline: 2026-05-15. Log in to the system and complete your application.",
  // },
  // {
  //   id: "pp-2",
  //   year: "2027",
  //   semester: "VT",
  //   programIds: ["1-1"],
  //   studyIds: ["1"],
  //   admissionTerms: ["VT-2026"],
  //   studyLocations: ["Umeå"],
  //   deadline: "2026-10-31",
  //   status: "closed",
  //   createdBy: "John Coordinator",
  //   createdDate: "2026-09-15",
  //   eligibleStudentIds: ["5", "6"],
  //   importedStudentIds: ["5", "6"],
  //   firstNoticeSentAt: "2026-09-20",
  //   firstNoticeDeadline: "2026-10-31",
  //   firstNoticeMessage: "You can now apply for priority placement for your upcoming clinical placement. Application deadline: 2026-10-31. Log in to the system and complete your application.",
  //   resultPublishedAt: "2026-11-01",
  // },
];

export const mockPriorityApplications: PriorityPlacementApplication[] = [
  {
    id: "pa-1",
    periodId: "pp-1",
    studentId: "1",
    studentName: "Emma Johnson",
    personnummer: "20010315-4821",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    targetSemester: "HT-2027",
    selectedReasons: ["medicinska_skal", "vardnadshavare_barn_8"],
    totalPoints: 5,
    hasDriversLicense: true,
    placementConstraints:
      "Cannot be placed in the Orthopaedics ward — a close relative works there.",
    submittedDate: "2026-04-10",
    status: "approved",
    decidedBy: "John Coordinator",
    decidedDate: "2026-04-25",
    decisionNotes: "Approved. Medical certificate and birth certificate submitted.",
    isManualGrant: false,
    published: false,
    noticeSentAt: "2026-04-01",
  },
  {
    id: "pa-2",
    periodId: "pp-1",
    studentId: "2",
    studentName: "Michael Chen",
    personnummer: "20020712-3301",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    targetSemester: "HT-2027",
    selectedReasons: ["ensam_vardnadshavare"],
    totalPoints: 2,
    hasDriversLicense: false,
    submittedDate: "2026-04-15",
    status: "pending",
    isManualGrant: false,
    published: false,
    noticeSentAt: "2026-04-01",
  },
  {
    id: "pa-3",
    periodId: "pp-1",
    studentId: "3",
    studentName: "Sarah Williams",
    personnummer: "20000928-2145",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    targetSemester: "HT-2027",
    selectedReasons: ["vard_av_funktionshindrad", "medicinska_skal"],
    totalPoints: 9,
    hasDriversLicense: true,
    placementConstraints:
      "Needs to be close to home due to care of a relative with a serious diagnosis.",
    submittedDate: "2026-04-20",
    status: "pending",
    isManualGrant: false,
    published: false,
    noticeSentAt: "2026-04-01",
  },
  {
    id: "pa-4",
    periodId: "pp-1",
    studentId: "4",
    studentName: "Lars Eriksson",
    personnummer: "20011104-5530",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    targetSemester: "HT-2027",
    selectedReasons: ["studerandefackligt"],
    totalPoints: 16,
    hasDriversLicense: true,
    submittedDate: "2026-04-22",
    status: "rejected",
    decidedBy: "John Coordinator",
    decidedDate: "2026-05-01",
    decisionNotes: "Certificate from student union organisation missing.",
    isManualGrant: false,
    published: false,
    noticeSentAt: "2026-04-01",
  },
  {
    id: "pa-5",
    periodId: "",
    studentId: "7",
    studentName: "Maria Svensson",
    personnummer: "20030115-9934",
    programId: "physiotherapy",
    programName: "Physiotherapy Programme",
    studyId: "health-social",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    targetSemester: "HT-2027",
    selectedReasons: ["andra_skal"],
    totalPoints: 32,
    hasDriversLicense: true,
    placementConstraints:
      "Elite athlete with agreement with Umeå University. Competition season requires a specific placement location.",
    submittedDate: "2027-04-01",
    status: "approved",
    decidedBy: "John Coordinator",
    decidedDate: "2027-04-10",
    decisionNotes: "Approved. Agreement with the sports federation verified.",
    isManualGrant: false,
    published: false,
  },
  {
    id: "pa-6",
    periodId: "pp-2",
    studentId: "5",
    studentName: "Astrid Lindqvist",
    personnummer: "20020203-7812",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "VT-2026",
    targetSemester: "VT-2027",
    selectedReasons: ["medicinska_skal"],
    totalPoints: 1,
    hasDriversLicense: false,
    submittedDate: "2026-10-15",
    status: "approved",
    decidedBy: "John Coordinator",
    decidedDate: "2026-10-28",
    isManualGrant: false,
    published: true,
    noticeSentAt: "2026-09-20",
  },
  {
    id: "pa-7",
    periodId: "pp-2",
    studentId: "6",
    studentName: "Johan Bergström",
    personnummer: "20010819-6620",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "VT-2026",
    targetSemester: "VT-2027",
    selectedReasons: ["vardnadshavare_barn_8", "ensam_vardnadshavare"],
    totalPoints: 6,
    hasDriversLicense: true,
    submittedDate: "2026-10-20",
    status: "approved",
    decidedBy: "John Coordinator",
    decidedDate: "2026-10-29",
    isManualGrant: false,
    published: true,
    noticeSentAt: "2026-09-20",
  },
  {
    id: "pa-8",
    periodId: "",
    studentId: "12",
    studentName: "Oskar Pettersson",
    personnummer: "20010630-2293",
    programId: "1-1",
    programName: "Nursing Programme",
    studyId: "1",
    studyName: "Health, Care and Welfare",
    studyLocation: "Umeå",
    admissionTerm: "HT-2025",
    targetSemester: "HT-2027",
    selectedReasons: [],
    totalPoints: 0,
    hasDriversLicense: true,
    submittedDate: "2027-02-10",
    status: "approved",
    decidedBy: "John Coordinator",
    decidedDate: "2027-02-10",
    decisionNotes: "Manual grant. Transferred from another university.",
    isManualGrant: true,
    published: true,
  },
];
