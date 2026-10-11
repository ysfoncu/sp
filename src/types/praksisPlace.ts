// A praksis place is the main parent: a hospital, a municipality or a service. It has no hierarchy of its
// own — the places where students are placed are its entities (placement profiles, see placementProfile.ts).

// People from before entities. Entities now hold their own contacts; these records are only read by the
// migration of saved profiles (placementProfile.ts) so old contacts carry over.
export type OrganizationType = "HF" | "Kommune";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  organizationNodeId: string;
  type: string;
  unitName: string;
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

export interface PraksisPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  contracts: Contract[];
  tags: string[];
  organizationType?: OrganizationType; // HF or Kommune, a label only
}

// Mock data
export const mockPraksisPlaces: PraksisPlace[] = [
  {
    id: "place-oslo-university-hospital",
    name: "Oslo University Hospital HF",
    address: "Sognsvannsveien 20",
    city: "Oslo",
    postalCode: "0372",
    tags: ["Hospital", "University", "HF"],
    organizationType: "HF",
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
  },
  {
    id: "place-bergen-kommune",
    name: "Bergen Kommune",
    address: "Fjellveien 45",
    city: "Bergen",
    postalCode: "5020",
    tags: ["Kommune", "Primary Care", "Elderly Care"],
    organizationType: "Kommune",
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
  },
  {
    id: "place-trondheim-mental-health",
    name: "Trondheim Mental Health Services",
    address: "Elgeseter gate 1",
    city: "Trondheim",
    postalCode: "7030",
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
  },
];
