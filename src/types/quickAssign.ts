// What the Quick Assign dialog does with its list of unassigned students: search them and rank by priority
// points. Pure, so it can be tested.
import type { Student } from "./placementTask";

export interface QuickAssignFilters {
  query: string;
}

export const EMPTY_QUICK_ASSIGN_FILTERS: QuickAssignFilters = { query: "" };

const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// The points of a student: an approved priority application (by student id) first, else the points from the import
export const pointsOf = (student: Pick<Student, "id" | "priorityPoints">, applicationPoints: Map<string, number>): number | undefined =>
  applicationPoints.get(student.id) ?? (student.priorityPoints ? student.priorityPoints : undefined);

export const preferredPlaceOf = (student: Pick<Student, "customRequest">): string | undefined =>
  student.customRequest?.preferredPlaceName?.trim() || undefined;

export const matchesFilters = (student: Student, f: QuickAssignFilters): boolean => {
  const q = f.query.trim().toLowerCase();
  return !q || `${student.name} ${student.email} ${student.personnummer ?? ""} ${student.address ?? ""}`.toLowerCase().includes(q);
};

// Most points first (students without points last), then those who asked for this place, then by name
export const rankStudents = (
  students: Student[],
  filters: QuickAssignFilters,
  applicationPoints: Map<string, number>,
  placeName: string,
): Student[] =>
  students
    .filter((s) => matchesFilters(s, filters))
    .sort((a, b) => {
      const pa = pointsOf(a, applicationPoints) ?? -1;
      const pb = pointsOf(b, applicationPoints) ?? -1;
      if (pa !== pb) return pb - pa;
      const wa = same(preferredPlaceOf(a), placeName) ? 1 : 0;
      const wb = same(preferredPlaceOf(b), placeName) ? 1 : 0;
      if (wa !== wb) return wb - wa;
      return a.name.localeCompare(b.name, "nb");
    });

// Places never block a placement: picking more students than there are places is allowed and shown as "over by N"
export const overBy = (placesLeft: number, selected: number) => Math.max(0, selected - Math.max(0, placesLeft));
