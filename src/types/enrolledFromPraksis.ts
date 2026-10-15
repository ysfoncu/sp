// The students of the priority part of the app (application periods, applications, the Students list) are the ones
// in Praksis-students: this turns them into the shape that part works with, and works out who belongs to a period.
import type { PraksisStudent } from "./praksisStudent";
import { derivePlacementWindow, intakeTerm } from "./praksisStudent";
import type { EnrolledStudent } from "./priorityPlacement";

interface CatalogStudy {
  id: string;
  name: string;
  programs: { id: string; name: string }[];
}

export const enrolledFromPraksis = (students: PraksisStudent[], studies: CatalogStudy[]): EnrolledStudent[] =>
  students.map((s) => {
    const study = studies.find((x) => x.id === s.studyId);
    const program = study?.programs.find((p) => p.id === s.programId);
    return {
      id: s.id,
      name: s.name,
      personnummer: s.personnummer,
      programId: s.programId,
      programName: program?.name ?? s.programId,
      studyId: s.studyId,
      studyName: study?.name ?? s.studyId,
      studyLocation: s.studyLocation,
      admissionTerm: intakeTerm(s.startDate),
      email: s.email,
      phone: s.phone,
      hasDriversLicense: false,
      emneId: s.emneId,
      startDate: s.startDate,
    };
  });

// The students an application period for this emne takes: everyone in Praksis-students for the emne, or only those
// who study at the chosen location
export const periodStudents = (students: EnrolledStudent[], emneId: string, location?: string): EnrolledStudent[] =>
  students.filter((s) => s.emneId === emneId && (!location || s.studyLocation === location));

// The study locations of the students of an emne, with how many study at each (for the location choice)
export const emneLocations = (students: EnrolledStudent[], emneId: string): { name: string; count: number }[] => {
  const counts = new Map<string, number>();
  periodStudents(students, emneId).forEach((s) => counts.set(s.studyLocation, (counts.get(s.studyLocation) ?? 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
};

// The period's year and semester follow the students' praksis start dates (spring before August), as in a placement
export const periodTerm = (students: EnrolledStudent[]): { year: string; semester: "HT" | "VT" } | undefined => {
  const dated = students.filter((s) => s.startDate).map((s) => ({ startDate: s.startDate!, endDate: s.startDate! }));
  const w = derivePlacementWindow(dated);
  return w ? { year: w.year, semester: w.semester === "Autumn" ? "HT" : "VT" } : undefined;
};
