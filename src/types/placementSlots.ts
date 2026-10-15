// The entities a placement uses, and how many slots of each. Chosen in the step after Placement Details, before
// the students are placed. Slots are the placement's own: they are never written to the entity's places.
//   - Candidates: the entities that fit the placement's program and emne (the unrestricted usage tree)
//   - Free places of a candidate: its places for the program − students of other placements in the same period
//   - Slots never block: more slots than free places, or more students than slots, is a warning ("over by N")
//   - A placement that has no slots at all (made before this step existed) uses every fitting entity as before
import type { PlaceProfileTree, ProfileNodeInfo } from "./profileUsage";

export interface EntitySlot {
  profileId: string;
  slots: number;
}

// A fitting entity with what it offers this placement
export interface SlotCandidate {
  node: ProfileNodeInfo;
  praksisPlaceId: string;
  praksisPlaceName: string;
  places: number; // the entity's places for the placement's program
  usedElsewhere: number; // students of other placements of this program in the same period
  free: number; // places − usedElsewhere, never below 0
  placed: number; // students of this placement already on it
}

export const slotCandidates = (trees: PlaceProfileTree[]): SlotCandidate[] =>
  trees.flatMap((t) =>
    t.nodes.map((node) => ({
      node,
      praksisPlaceId: t.praksisPlaceId,
      praksisPlaceName: t.praksisPlaceName,
      places: node.programPlaces,
      usedElsewhere: node.usedElsewhere,
      free: Math.max(0, node.programPlaces - node.usedElsewhere),
      placed: node.used,
    })),
  );

export const slotsOf = (list: EntitySlot[], profileId: string): number | undefined => list.find((s) => s.profileId === profileId)?.slots;

// What an entity gets when it is added: the places it has free, at least 1 (it can still be raised)
export const defaultSlots = (c: Pick<SlotCandidate, "free">) => Math.max(1, c.free);

// The least slots an entity can have: the students already placed on it (and 1)
export const minSlots = (c: Pick<SlotCandidate, "placed">) => Math.max(1, c.placed);

// A slot count from typed text: a whole number of at least `min`; anything else gives the `min`
export const parseSlots = (text: string, min = 1) => {
  const n = Math.floor(Number(text.trim()));
  return Number.isFinite(n) && n >= min ? n : min;
};

export const addSlot = (list: EntitySlot[], c: SlotCandidate): EntitySlot[] =>
  list.some((s) => s.profileId === c.node.profile.id) ? list : [...list, { profileId: c.node.profile.id, slots: defaultSlots(c) }];

export const setSlot = (list: EntitySlot[], c: SlotCandidate, slots: number): EntitySlot[] =>
  list.map((s) => (s.profileId === c.node.profile.id ? { ...s, slots: Math.max(minSlots(c), Math.floor(slots)) } : s));

export const removeSlot = (list: EntitySlot[], profileId: string): EntitySlot[] => list.filter((s) => s.profileId !== profileId);

// An entity with students of this placement on it stays: they would be left without one
export const canRemove = (c: Pick<SlotCandidate, "placed">) => c.placed === 0;

// Slots beyond the places the entity has free (a warning, never an error)
export const slotsOver = (c: Pick<SlotCandidate, "free">, slots: number) => Math.max(0, slots - c.free);

export const totalSlots = (list: EntitySlot[]) => list.reduce((sum, s) => sum + s.slots, 0);

// Students that no slot covers (0 when the slots are enough)
export const studentsWithoutSlot = (students: number, list: EntitySlot[]) => Math.max(0, students - totalSlots(list));

// The slots that mean what a placement without any chosen slots did: every fitting entity, with the places it
// had left for this placement (and at least what is already placed there)
export const slotsFromTrees = (trees: PlaceProfileTree[]): EntitySlot[] =>
  trees.flatMap((t) => t.nodes.map((n) => ({ profileId: n.profile.id, slots: Math.max(1, n.used + n.remaining) })));

// Problems that stop the step from being completed. Over-capacity is not one, and neither is choosing no
// entity at all: the students can be shown first and the entities added later ("Change entities").
export const validateSlots = (list: EntitySlot[]): string | null => {
  if (new Set(list.map((s) => s.profileId)).size !== list.length) return "An entity can only be chosen once";
  if (list.some((s) => !Number.isInteger(s.slots) || s.slots < 1)) return "Slots must be a whole number, 1 or more";
  return null;
};
