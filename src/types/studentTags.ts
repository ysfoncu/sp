// Tags the user makes and puts on students (a student can have several). A tag is shown as a chip, and a click on it
// shows the students that carry it. Saved in localStorage.studentTags, by student id (the id of a Praksis-student, which
// is also the student's id inside a placement), so the tags stay when a placement is opened again.
import { useSyncExternalStore } from "react";

export const TAG_COLORS = ["blue", "green", "amber", "rose", "violet", "teal", "orange", "slate"] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export interface StudentTag {
  id: string;
  name: string;
  color: TagColor;
}

export interface TagState {
  tags: StudentTag[];
  byStudent: Record<string, string[]>; // student id -> tag ids
}

export const MAX_TAG_NAME = 30;
export const EMPTY_TAGS: TagState = { tags: [], byStudent: {} };

// A tag name is 1 to 30 characters and unique (ignoring case)
export const validateTagName = (name: string, tags: StudentTag[]): string | null => {
  const n = name.trim();
  if (!n) return "Give the tag a name";
  if (n.length > MAX_TAG_NAME) return `At most ${MAX_TAG_NAME} characters`;
  if (tags.some((t) => t.name.toLowerCase() === n.toLowerCase())) return "A tag with this name exists";
  return null;
};

// Makes a tag; its colour is the next one of the palette
export const addTag = (s: TagState, name: string, id = `tag-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`): { state: TagState; tag?: StudentTag; error?: string } => {
  const error = validateTagName(name, s.tags);
  if (error) return { state: s, error };
  const tag: StudentTag = { id, name: name.trim(), color: TAG_COLORS[s.tags.length % TAG_COLORS.length] };
  return { state: { ...s, tags: [...s.tags, tag] }, tag };
};

// Deleting a tag takes it off every student
export const removeTag = (s: TagState, tagId: string): TagState => ({
  tags: s.tags.filter((t) => t.id !== tagId),
  byStudent: Object.fromEntries(
    Object.entries(s.byStudent)
      .map(([id, ids]) => [id, ids.filter((t) => t !== tagId)] as const)
      .filter(([, ids]) => ids.length > 0),
  ),
});

export type TagOn = "all" | "some" | "none";

// How many of the students carry the tag
export const tagOn = (s: TagState, studentIds: string[], tagId: string): TagOn => {
  const n = studentIds.filter((id) => s.byStudent[id]?.includes(tagId)).length;
  return n === 0 ? "none" : n === studentIds.length ? "all" : "some";
};

// Puts the tag on all the students, or takes it off all of them when they all have it already
export const toggleTag = (s: TagState, studentIds: string[], tagId: string): TagState => {
  if (studentIds.length === 0) return s;
  const remove = tagOn(s, studentIds, tagId) === "all";
  const byStudent = { ...s.byStudent };
  studentIds.forEach((id) => {
    const have = byStudent[id] ?? [];
    const next = remove ? have.filter((t) => t !== tagId) : have.includes(tagId) ? have : [...have, tagId];
    if (next.length > 0) byStudent[id] = next;
    else delete byStudent[id];
  });
  return { ...s, byStudent };
};

// The tags of a student, in the order the tags were made
export const tagsOf = (s: TagState, studentId: string): StudentTag[] => {
  const ids = s.byStudent[studentId] ?? [];
  return s.tags.filter((t) => ids.includes(t.id));
};

// True when no tag is picked, or the student has at least one of the picked tags
export const hasAnyTag = (s: TagState, studentId: string, pickedTagIds: string[]) =>
  pickedTagIds.length === 0 || (s.byStudent[studentId] ?? []).some((t) => pickedTagIds.includes(t));

export const tagCount = (s: TagState, studentIds: string[], tagId: string) => studentIds.filter((id) => s.byStudent[id]?.includes(tagId)).length;

// ── The store ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "studentTags";

const load = (): TagState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (parsed && Array.isArray(parsed.tags) && parsed.byStudent && typeof parsed.byStudent === "object") {
      const tags: StudentTag[] = parsed.tags.filter((t: StudentTag) => t && typeof t.id === "string" && typeof t.name === "string");
      const known = new Set(tags.map((t) => t.id));
      const byStudent = Object.fromEntries(
        Object.entries(parsed.byStudent as Record<string, string[]>)
          .map(([id, ids]) => [id, (Array.isArray(ids) ? ids : []).filter((t) => known.has(t))] as const)
          .filter(([, ids]) => ids.length > 0),
      );
      return { tags: tags.map((t) => ({ ...t, color: TAG_COLORS.includes(t.color) ? t.color : "slate" })), byStudent };
    }
  } catch {
    // unreadable: start without tags
  }
  return EMPTY_TAGS;
};

let state: TagState = load();
const listeners = new Set<() => void>();

const setState = (next: TagState) => {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...next }));
  } catch {
    // Storage unavailable: keep the in-memory copy
  }
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useStudentTags = (): TagState => useSyncExternalStore(subscribe, () => state);

// Makes a tag (and returns it), or says why not
export const createTag = (name: string): { tag?: StudentTag; error?: string } => {
  const r = addTag(state, name);
  if (r.tag) setState(r.state);
  return { tag: r.tag, error: r.error };
};
export const deleteTag = (tagId: string) => setState(removeTag(state, tagId));
export const toggleStudentTag = (studentIds: string[], tagId: string) => setState(toggleTag(state, studentIds, tagId));
