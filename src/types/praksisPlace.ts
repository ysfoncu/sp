import { OrganizationNode, OrganizationType } from './organizationStructure';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  organizationNodeId: string; // Links to specific node in the hierarchy
  type: string; // Same as OrganizationNode type (Helseforetak, Klinikk, etc.)
  unitName: string; // Name of the organizational unit
}

export interface Contract {
  id: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
  terms: string;
  tags: string[];
}

export interface Supervisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  organizationNodeId: string; // Links to specific node in the hierarchy
  type: string; // Same as OrganizationNode type
  unitName: string; // Name of the organizational unit
  role?: 'main_contact' | 'department_contact' | 'supervisor';
  isContactPerson?: boolean; // Keep for backward compatibility
  isActive?: boolean;
  workStatus?: 'available' | 'vacation' | 'sick' | 'leave' | 'unavailable';
  assignedStudents?: number; // Number of students assigned to this supervisor
  yearsOfExperience?: number;
  availability?: boolean;
}

export interface AssignedStudent {
  id: string;
  name: string;
  email: string;
  university: string;
  year: string;
  supervisorIds: string[]; // IDs of supervisors connected to this student
  startDate?: string;
  endDate?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  supervisors: Supervisor[];
  students?: AssignedStudent[]; // Students assigned to this department
  capacity: number;
  tags: string[];
  isActive: boolean;
  assignedStudents?: number; // Number of students assigned to this department
}

export interface QuotaRequestHistory {
  id: string;
  timestamp: string;
  action: 'created' | 'updated' | 'status_changed';
  performedBy: string; // Name of person who made the change
  performedByRole: 'coordinator'; // Role of person
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  status?: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface QuotaRequest {
  id: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  departmentId: string;
  departmentName: string;
  placementId: string;
  placementTitle: string;
  placementYear: string;
  placementSemester: string;
  fixedQuota: number; // Direct assignment quota (automatically approved)
  requestQuota: number; // Requested quota (needs approval)
  requestedDate: string;
  requestedBy: string; // Coordinator name
  requestQuotaStatus: 'pending' | 'approved' | 'rejected'; // Status of the request quota portion
  startDate: string; // Placement start date
  endDate: string; // Placement end date
  updatedDate?: string; // Last update timestamp
  updatedBy?: string; // Last person who updated
  history?: QuotaRequestHistory[]; // History of all changes
  placementStatus?: 'draft' | 'upload' | 'select' | 'publish' | 'completed'; // Track if placement is completed and published
}

export interface PraksisPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  contracts: Contract[];
  departments: Department[];
  totalCapacity: number;
  currentStudents: number;
  tags: string[];
  organizationType?: OrganizationType; // HF or Kommune
  organizationStructure?: OrganizationNode; // Hierarchical organization tree
}

// Mock data
export const mockPraksisPlaces: PraksisPlace[] = [
  {
    id: "place-oslo-university-hospital",
    name: "Oslo University Hospital HF",
    address: "Sognsvannsveien 20",
    city: "Oslo",
    postalCode: "0372",
    totalCapacity: 50,
    currentStudents: 18,
    tags: ["Hospital", "University", "HF"],
    organizationType: "HF",
    organizationStructure: {
      id: "hf-oslo",
      name: "Oslo University Hospital HF",
      type: "Helseforetak",
      level: 0,
      children: [
        {
          id: "klinikk-ortopedi",
          name: "Ortopedisk klinikk",
          type: "Klinikk",
          level: 1,
          parentId: "hf-oslo",
          children: [
            {
              id: "avd-akutt-ortopedi",
              name: "Akuttavdeling",
              type: "Avdeling",
              level: 2,
              parentId: "klinikk-ortopedi",
              children: [
                {
                  id: "seksjon-intensiv",
                  name: "Intensivseksjon",
                  type: "Seksjon",
                  level: 3,
                  parentId: "avd-akutt-ortopedi",
                  children: [
                    {
                      id: "sengepost-intensiv-a",
                      name: "Sengepost A",
                      type: "Sengepost",
                      level: 4,
                      parentId: "seksjon-intensiv",
                      children: [],
                    },
                  ],
                },
                {
                  id: "seksjon-overvaking",
                  name: "Overvåkingsseksjon",
                  type: "Seksjon",
                  level: 3,
                  parentId: "avd-akutt-ortopedi",
                  children: [],
                },
              ],
            },
            {
              id: "avd-poliklinikk-ortopedi",
              name: "Poliklinikk",
              type: "Avdeling",
              level: 2,
              parentId: "klinikk-ortopedi",
              children: [
                {
                  id: "seksjon-konsultasjon",
                  name: "Konsultasjonsseksjon",
                  type: "Seksjon",
                  level: 3,
                  parentId: "avd-poliklinikk-ortopedi",
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: "klinikk-kirurgi",
          name: "Kirurgisk klinikk",
          type: "Klinikk",
          level: 1,
          parentId: "hf-oslo",
          children: [
            {
              id: "avd-generell-kirurgi",
              name: "Generell kirurgi",
              type: "Avdeling",
              level: 2,
              parentId: "klinikk-kirurgi",
              children: [
                {
                  id: "seksjon-dag-kirurgi",
                  name: "Dagkirurgi",
                  type: "Seksjon",
                  level: 3,
                  parentId: "avd-generell-kirurgi",
                  children: [],
                },
              ],
            },
            {
              id: "avd-karkirurgi",
              name: "Karkirurgi",
              type: "Avdeling",
              level: 2,
              parentId: "klinikk-kirurgi",
              children: [],
            },
          ],
        },
        {
          id: "klinikk-akutt",
          name: "Akuttklinikk",
          type: "Klinikk",
          level: 1,
          parentId: "hf-oslo",
          children: [
            {
              id: "avd-emergency",
              name: "Emergency Department",
              type: "Avdeling",
              level: 2,
              parentId: "klinikk-akutt",
              children: [],
            },
          ],
        },
      ],
    },
    contracts: [
      {
        id: "contract-oslo-001",
        contractNumber: "CNT-2024-001",
        startDate: "2024-01-01",
        endDate: "2026-12-31",
        status: "active",
        terms: "Standard university partnership agreement",
        tags: ["Active", "Partnership"],
      },
    ],
    departments: [
      {
        id: "dept-emergency",
        name: "Emergency Department",
        description: "24/7 emergency medical services",
        capacity: 15,
        isActive: true,
        assignedStudents: 5,
        tags: ["Emergency", "Critical Care"],
        supervisors: [
          {
            id: "supervisor-anna-hansen",
            name: "Dr. Anna Hansen",
            email: "anna.hansen@ous.no",
            phone: "+47 23 07 00 00",
            specialization: "Emergency Medicine",
            isContactPerson: true,
            isActive: true,
            assignedStudents: 0,
            role: "main_contact",
            organizationNodeId: "avd-emergency",
            type: "Avdeling",
            unitName: "Emergency Department",
          },
          {
            id: "supervisor-lars-olsen",
            name: "Dr. Lars Olsen",
            email: "lars.olsen@ous.no",
            phone: "+47 23 07 00 01",
            specialization: "Critical Care",
            isActive: true,
            assignedStudents: 3,
            role: "supervisor",
            organizationNodeId: "avd-emergency",
            type: "Avdeling",
            unitName: "Emergency Department",
          },
        ],
      },
      {
        id: "dept-pediatrics",
        name: "Pediatrics",
        description: "Children's health and medical care",
        capacity: 10,
        isActive: true,
        assignedStudents: 3,
        tags: ["Pediatrics", "Children"],
        supervisors: [
          {
            id: "supervisor-maria-johansen",
            name: "Dr. Maria Johansen",
            email: "maria.johansen@ous.no",
            phone: "+47 23 07 00 02",
            specialization: "Pediatric Medicine",
            isActive: true,
            assignedStudents: 3,
            role: "department_contact",
            isContactPerson: true,
            organizationNodeId: "dept-pediatrics",
            type: "Department",
            unitName: "Pediatrics",
          },
        ],
      },
    ],
  },
  {
    id: "place-bergen-kommune",
    name: "Bergen Kommune",
    address: "Fjellveien 45",
    city: "Bergen",
    postalCode: "5020",
    totalCapacity: 35,
    currentStudents: 12,
    tags: ["Kommune", "Primary Care", "Elderly Care"],
    organizationType: "Kommune",
    organizationStructure: {
      id: "kommune-bergen",
      name: "Bergen Kommune",
      type: "Kommune",
      level: 0,
      children: [
        {
          id: "sykehjem-solhaugen",
          name: "Solhaugen Sykehjem",
          type: "Sykehjem",
          level: 1,
          parentId: "kommune-bergen",
          children: [
            {
              id: "avd-demens",
              name: "Demensavdeling",
              type: "Avdeling",
              level: 2,
              parentId: "sykehjem-solhaugen",
              children: [
                {
                  id: "gruppe-a-demens",
                  name: "Gruppe A",
                  type: "Gruppe",
                  level: 3,
                  parentId: "avd-demens",
                  children: [],
                },
                {
                  id: "gruppe-b-demens",
                  name: "Gruppe B",
                  type: "Gruppe",
                  level: 3,
                  parentId: "avd-demens",
                  children: [],
                },
              ],
            },
            {
              id: "avd-langtid",
              name: "Langtidsavdeling",
              type: "Avdeling",
              level: 2,
              parentId: "sykehjem-solhaugen",
              children: [],
            },
          ],
        },
        {
          id: "sykehjem-fjellsiden",
          name: "Fjellsiden Sykehjem",
          type: "Sykehjem",
          level: 1,
          parentId: "kommune-bergen",
          children: [
            {
              id: "avd-korttid",
              name: "Korttidsavdeling",
              type: "Avdeling",
              level: 2,
              parentId: "sykehjem-fjellsiden",
              children: [
                {
                  id: "gruppe-rehabilitering",
                  name: "Rehabiliteringsgruppe",
                  type: "Gruppe",
                  level: 3,
                  parentId: "avd-korttid",
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: "sykehjem-strandsiden",
          name: "Strandsiden Omsorgssenter",
          type: "Sykehjem",
          level: 1,
          parentId: "kommune-bergen",
          children: [
            {
              id: "avd-dagaktivitet",
              name: "Dagaktivitetsavdeling",
              type: "Avdeling",
              level: 2,
              parentId: "sykehjem-strandsiden",
              children: [],
            },
          ],
        },
      ],
    },
    contracts: [
      {
        id: "contract-bergen-002",
        contractNumber: "CNT-2025-015",
        startDate: "2025-06-01",
        endDate: "2027-05-31",
        status: "active",
        terms: "Community health partnership",
        tags: ["Active", "Community"],
      },
    ],
    departments: [
      {
        id: "dept-primary-care",
        name: "Primary Care",
        description: "General medical practice and consultations",
        capacity: 10,
        isActive: true,
        assignedStudents: 4,
        tags: ["Primary Care", "General Medicine"],
        supervisors: [
          {
            id: "supervisor-erik-andersen",
            name: "Dr. Erik Andersen",
            email: "erik.andersen@bergen.health",
            phone: "+47 55 50 50 50",
            specialization: "General Practice",
            isContactPerson: true,
            isActive: true,
            assignedStudents: 4,
            organizationNodeId: "dept-primary-care",
            type: "Department",
            unitName: "Primary Care",
          },
        ],
      },
      {
        id: "dept-physiotherapy",
        name: "Physiotherapy",
        description: "Physical therapy and rehabilitation",
        capacity: 8,
        isActive: true,
        assignedStudents: 2,
        tags: ["Physiotherapy", "Rehabilitation"],
        supervisors: [
          {
            id: "supervisor-sofia-berg",
            name: "Sofia Berg",
            email: "sofia.berg@bergen.health",
            phone: "+47 55 50 50 51",
            specialization: "Physical Therapy",
            isActive: true,
            assignedStudents: 2,
            organizationNodeId: "dept-physiotherapy",
            type: "Department",
            unitName: "Physiotherapy",
          },
        ],
      },
    ],
  },
  {
    id: "place-trondheim-mental-health",
    name: "Trondheim Mental Health Services",
    address: "Elgeseter gate 1",
    city: "Trondheim",
    postalCode: "7030",
    totalCapacity: 12,
    currentStudents: 5,
    tags: ["Mental Health", "Psychiatric Care"],
    contracts: [
      {
        id: "contract-trondheim-003",
        contractNumber: "CNT-2024-089",
        startDate: "2024-09-01",
        endDate: "2026-08-31",
        status: "active",
        terms: "Mental health services agreement",
        tags: ["Active", "Mental Health"],
      },
    ],
    departments: [
      {
        id: "dept-adult-psychiatry",
        name: "Adult Psychiatry",
        description: "Mental health services for adults",
        capacity: 12,
        isActive: true,
        assignedStudents: 5,
        tags: ["Psychiatry", "Mental Health"],
        supervisors: [
          {
            id: "supervisor-kristin-solberg",
            name: "Dr. Kristin Solberg",
            email: "kristin.solberg@trondheim.health",
            phone: "+47 73 86 00 00",
            specialization: "Psychiatry",
            isContactPerson: true,
            isActive: true,
            assignedStudents: 3,
            organizationNodeId: "dept-adult-psychiatry",
            type: "Department",
            unitName: "Adult Psychiatry",
          },
          {
            id: "supervisor-thomas-lie",
            name: "Psychologist Thomas Lie",
            email: "thomas.lie@trondheim.health",
            phone: "+47 73 86 00 01",
            specialization: "Clinical Psychology",
            isActive: true,
            assignedStudents: 2,
            organizationNodeId: "dept-adult-psychiatry",
            type: "Department",
            unitName: "Adult Psychiatry",
          },
        ],
      },
    ],
  },
];

// Mock Quota Requests
export const mockQuotaRequests: QuotaRequest[] = [];