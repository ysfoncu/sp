import { AcceptedProgram, EntityContactLink, PlacementInfo } from "./placementProfile";

// Is what is typed in an open block different from what is saved? Only then does leaving the block need a
// warning; a block that is open but unchanged does not.

const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join("\u0000") === [...b].sort().join("\u0000");

export const nameDirty = (draft: { name: string; type: string }, saved: { name: string; entityType?: string }) =>
  draft.name.trim() !== saved.name || draft.type !== (saved.entityType ?? "");

export const placesDirty = (text: string, saved: number) => Math.max(0, parseInt(text, 10) || 0) !== saved;

// One accepted program of an entity (its emner and places together, as the page edits them). A program that is
// not saved yet (`saved` missing) is always changed.
export const programEntryDirty = (draft: { programId: string; emneIds: string[]; places: string }, saved?: AcceptedProgram) =>
  !saved || draft.programId !== saved.programId || !sameSet(draft.emneIds, saved.emneIds) || placesDirty(draft.places, saved.places);

export const contactsDirty = (draft: EntityContactLink[], saved: EntityContactLink[]) => {
  const norm = (l: EntityContactLink[]) => [...l].sort((a, b) => a.contactId.localeCompare(b.contactId));
  return stable(norm(draft)) !== stable(norm(saved));
};

export const infoDirty = (draft: PlacementInfo, saved: PlacementInfo) => stable(draft) !== stable(saved);
