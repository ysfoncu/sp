// Extended types for hierarchical praksis place structure
// Place → Unit → Department → Members

import { ContactPerson, Supervisor, AssignedStudent, Department } from './praksisPlace';

export interface Unit {
  id: string;
  name: string;
  description?: string;
  praksisPlaceId: string;
  contactPersons: ContactPerson[]; // Contact persons at unit level
  departments: Department[];
  isActive: boolean;
  
  // Computed properties (calculated from departments)
  get totalDepartments(): number;
  get totalContactPersons(): number; // Unit + dept contacts
  get totalSupervisors(): number; // Sum from all departments
  get totalStudents(): number; // Sum from all departments
}

export interface PraksisPlaceHierarchical {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  contactPersons: ContactPerson[]; // Main contacts at place level
  units: Unit[];
  tags: string[];
  
  // Computed properties
  get totalUnits(): number;
  get totalDepartments(): number;
  get totalContactPersons(): number; // Place + unit + dept contacts
  get totalSupervisors(): number;
  get totalStudents(): number;
  get unassignedStudents(): number;
}

// Helper functions to calculate aggregated stats
export const calculateUnitStats = (unit: Unit) => {
  const totalDepartments = unit.departments.length;
  const totalContactPersons = 
    unit.contactPersons.length + 
    unit.departments.reduce((sum, d) => sum + (d.contactPerson ? 1 : 0), 0);
  const totalSupervisors = 
    unit.departments.reduce((sum, d) => sum + d.supervisors.length, 0);
  const totalStudents = 
    unit.departments.reduce((sum, d) => sum + (d.students?.length || 0), 0);
  
  return {
    totalDepartments,
    totalContactPersons,
    totalSupervisors,
    totalStudents,
  };
};

export const calculatePlaceStats = (place: PraksisPlaceHierarchical) => {
  const totalUnits = place.units.length;
  const totalDepartments = 
    place.units.reduce((sum, u) => sum + u.departments.length, 0);
  const totalContactPersons = 
    place.contactPersons.length +
    place.units.reduce((sum, u) => {
      const unitStats = calculateUnitStats(u);
      return sum + unitStats.totalContactPersons;
    }, 0);
  const totalSupervisors =
    place.units.reduce((sum, u) => {
      const unitStats = calculateUnitStats(u);
      return sum + unitStats.totalSupervisors;
    }, 0);
  const totalStudents =
    place.units.reduce((sum, u) => {
      const unitStats = calculateUnitStats(u);
      return sum + unitStats.totalStudents;
    }, 0);
  const unassignedStudents =
    place.units.reduce((sum, u) => 
      sum + u.departments.reduce((deptSum, d) => 
        deptSum + (d.students?.filter(s => !s.supervisorIds || s.supervisorIds.length === 0).length || 0), 0
      ), 0
    );
  
  return {
    totalUnits,
    totalDepartments,
    totalContactPersons,
    totalSupervisors,
    totalStudents,
    unassignedStudents,
  };
};

// Helper to convert flat PraksisPlace to hierarchical structure
export const convertToHierarchical = (
  flatPlace: any,
  units?: Unit[]
): PraksisPlaceHierarchical => {
  // If units are not provided, create a default unit with all departments
  const placeUnits = units || [{
    id: `${flatPlace.id}-default-unit`,
    name: 'Main Unit',
    description: 'Default organizational unit',
    praksisPlaceId: flatPlace.id,
    contactPersons: [],
    departments: flatPlace.departments || [],
    isActive: true,
  } as Unit];
  
  return {
    ...flatPlace,
    units: placeUnits,
  } as PraksisPlaceHierarchical;
};

// Types for filtering and search
export interface PeopleFilter {
  searchQuery: string;
  unitId: string | null;
  departmentId: string | null;
  role: 'all' | 'contact' | 'supervisor' | 'student';
  availability?: 'all' | 'available' | 'full' | 'unavailable';
  assignmentStatus?: 'all' | 'assigned' | 'unassigned';
}

// Flattened view for People Management table
export interface FlattenedSupervisor extends Supervisor {
  unitId: string;
  unitName: string;
  departmentId: string;
  departmentName: string;
  assignedStudentCount: number;
  maxCapacity: number;
  availabilityStatus: 'available' | 'full' | 'unavailable';
}

export interface FlattenedStudent extends AssignedStudent {
  unitId: string;
  unitName: string;
  departmentId: string;
  departmentName: string;
  supervisorNames: string[];
  isAssigned: boolean;
}

export interface FlattenedContactPerson extends ContactPerson {
  level: 'place' | 'unit' | 'department';
  parentId: string; // praksisPlaceId | unitId | departmentId
  parentName: string;
  unitId?: string;
  unitName?: string;
  departmentId?: string;
  departmentName?: string;
}
