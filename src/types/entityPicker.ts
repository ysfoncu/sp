// What the entity picker of the students-first bar shows: the entities grouped by place, filtered by a search,
// with a short label of the places left. Pure, so it can be tested.
import type { Student } from "./placementTask";

export interface PickerEntity {
  id: string;
  name: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  remaining: number; // places left, never below 0
  over: number; // students already placed beyond the places
}

export interface PlaceGroup {
  placeId: string;
  placeName: string;
  entities: PickerEntity[];
}

// Case-insensitive match on the entity name or the place name (a place match keeps all of its entities). Places
// by name, entities with most room first, then by name. Full entities stay in the list: places never block.
export const groupEntitiesByPlace = (options: PickerEntity[], query: string): PlaceGroup[] => {
  const q = query.trim().toLowerCase();
  const groups = new Map<string, PlaceGroup>();
  options.forEach((o) => {
    if (q && !o.name.toLowerCase().includes(q) && !o.praksisPlaceName.toLowerCase().includes(q)) return;
    const g = groups.get(o.praksisPlaceId) ?? { placeId: o.praksisPlaceId, placeName: o.praksisPlaceName, entities: [] };
    g.entities.push(o);
    groups.set(o.praksisPlaceId, g);
  });
  return [...groups.values()]
    .map((g) => ({ ...g, entities: [...g.entities].sort((a, b) => b.remaining - a.remaining || a.name.localeCompare(b.name, "nb")) }))
    .sort((a, b) => a.placeName.localeCompare(b.placeName, "nb"));
};

export const placesLabel = (remaining: number, over: number): string => {
  if (remaining > 0) return `${remaining} place${remaining === 1 ? "" : "s"} left`;
  return over > 0 ? `Full, ${over} over` : "Full";
};

// The picked students that still have no entity, in table order (one placed elsewhere meanwhile drops out)
export const unassignedOf = (selected: Set<string>, students: Pick<Student, "id" | "assignedPraksisPlace">[]): string[] =>
  students.filter((s) => selected.has(s.id) && !s.assignedPraksisPlace).map((s) => s.id);
