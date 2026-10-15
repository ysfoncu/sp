// Small helpers of the floating bar that places students: the label of the places left on the chosen entity, and the
// ticked students that still have no entity. Pure, so they can be tested.
import type { Student } from "./placementTask";

export const placesLabel = (remaining: number, over: number): string => {
  if (remaining > 0) return `${remaining} place${remaining === 1 ? "" : "s"} left`;
  return over > 0 ? `Full, ${over} over` : "Full";
};

// The picked students that still have no entity, in table order (one placed elsewhere meanwhile drops out)
export const unassignedOf = (selected: Set<string>, students: Pick<Student, "id" | "assignedPraksisPlace">[]): string[] =>
  students.filter((s) => selected.has(s.id) && !s.assignedPraksisPlace).map((s) => s.id);
