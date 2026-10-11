import { useMemo, useSyncExternalStore } from "react";
import { SEED_CATALOG, SEED_PRISTINE } from "../data/seedEntities";

// The shared catalog of studies → programs → emner (cohorts).
//
// One catalog for the whole app, owned per university: a praksis place (e.g. a hospital) works with
// programs from several universities, so everything that refers to a study, program or emne uses the
// ids below and looks the names up here. Names are labels; ids are what other data stores.
//
// Items are archived, never deleted: an archived study/program/emne leaves the pickers
// (`useStudyCatalog().active`) but still resolves by id, so existing data keeps its names.

// An emne is one practice course (VFU course) of a program, e.g. "Praksis 2 – Medisinsk sykepleie". Everything
// but the name is optional.
export interface StudyEmne {
  id: string;
  name: string;
  code?: string; // course code, unique within the program; used to match imported students
  term?: number; // the term of the program the course is in (1, 2, 3 …)
  subject?: string; // what the placement is about, e.g. "Medical ward"
  pairPlacement?: boolean; // two students are wanted on the same entity
  startTerm?: string; // the intake the course is for, e.g. "2026 Høst" (it was a "Kull …" emne before)
  archived?: boolean;
}

export type EmneInput = Pick<StudyEmne, "name"> & Partial<Omit<StudyEmne, "id" | "name" | "archived">>;

export interface StudyProgram {
  id: string;
  name: string;
  code?: string; // program code, shown next to the name so similar programs can be told apart
  // The practice courses of a program. A program may have none.
  emner?: StudyEmne[];
  archived?: boolean;
}

export interface Study {
  id: string;
  name: string;
  universityId: string;
  universityName: string;
  programs: StudyProgram[];
  archived?: boolean;
}

export interface University {
  id: string;
  name: string;
}

// The prototype only has one user, who belongs to this university. Settings edits the studies it
// owns; every picker elsewhere shows the studies of all universities.
export const CURRENT_UNIVERSITY: University = { id: "U1", name: "University of Oslo" };

const STORAGE_KEY = "studyCatalog";

// A new browser starts with the study, programs and emner of the Umeå import (data/seedEntities.ts); more are made in Settings
const DEFAULT_CATALOG: Study[] = SEED_CATALOG;

// Version 2: an emne named "Kull 2026 Høst" was an intake, not a course. It keeps its id and name (placements
// and entities refer to them) and gets the intake as its start term.
export const migrateCatalogV2 = (studies: Study[]): Study[] =>
  studies.map((s) => ({
    ...s,
    programs: s.programs.map((p) => ({
      ...p,
      emner: p.emner?.map((e) => {
        const intake = /^kull\s+(.+)$/i.exec(e.name.trim());
        return intake && !e.startTerm ? { ...e, startTerm: intake[1].trim() } : e;
      }),
    })),
  }));

// Version 3: the practice courses of the starting data ("VFU HT 2022", "VFU HT 2023", "VFU VT 2023") are dated in 2026.
// Their names and start terms take the year; two of the same season in one program become one (the later id is
// remembered in emneIdRemap, so entities and students that pointed at it follow). Other emner are left as they are.
export const IMPORT_YEAR = "2026";
export const emneIdRemap = new Map<string, string>();
export const remapEmneId = (id: string) => emneIdRemap.get(id) ?? id;
export const migrateCatalogV3 = (studies: Study[]): Study[] =>
  studies.map((s) => ({
    ...s,
    programs: s.programs.map((p) => {
      if (!p.emner) return p;
      const kept: StudyEmne[] = [];
      const byName = new Map<string, StudyEmne>();
      p.emner.forEach((e) => {
        const m = /^VFU (HT|VT) \d{4}$/.exec(e.name.trim());
        if (!m) {
          kept.push(e);
          return;
        }
        const name = `VFU ${m[1]} ${IMPORT_YEAR}`;
        const twin = byName.get(name);
        if (twin) {
          emneIdRemap.set(e.id, twin.id);
          return;
        }
        const renamed = { ...e, name, startTerm: `${m[1]} ${IMPORT_YEAR}` };
        byName.set(name, renamed);
        kept.push(renamed);
      });
      return { ...p, emner: kept };
    }),
  }));

const load = (): Study[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!Array.isArray(parsed?.studies)) return DEFAULT_CATALOG;
    if (SEED_PRISTINE && parsed.studies.length === 0) {
      // An untouched browser that saved an empty catalog before the starting data existed: save the starting one
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, studies: DEFAULT_CATALOG }));
      return DEFAULT_CATALOG;
    }
    const version = parsed.version ?? 1;
    const v2 = version < 2 ? migrateCatalogV2(parsed.studies) : parsed.studies;
    return version < 3 ? migrateCatalogV3(v2) : v2;
  } catch {
    return DEFAULT_CATALOG;
  }
};

let catalog: Study[] = load();
const listeners = new Set<() => void>();

const setCatalog = (next: Study[]) => {
  catalog = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, studies: next }));
  } catch {
    // Storage unavailable (private mode etc.) — keep the in-memory copy
  }
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}`;

// What pickers show: archived studies, programs and emner left out
const activeOf = (studies: Study[]): Study[] =>
  studies
    .filter((s) => !s.archived)
    .map((s) => ({
      ...s,
      programs: s.programs
        .filter((p) => !p.archived)
        .map((p) => (p.emner ? { ...p, emner: p.emner.filter((e) => !e.archived) } : p)),
    }));

export const useStudyCatalog = () => {
  const all = useSyncExternalStore(subscribe, () => catalog);
  const active = useMemo(() => activeOf(all), [all]);
  return { all, active };
};

// The whole catalog, archived items included (for code that is not a component, and for tests)
export const getStudies = () => catalog;

// ── Lookups (archived items included, so names still resolve) ─────────────────
export const findStudy = (studyId: string) => catalog.find((s) => s.id === studyId);

export const findProgram = (programId: string) => {
  for (const study of catalog) {
    const program = study.programs.find((p) => p.id === programId);
    if (program) return { study, program };
  }
  return undefined;
};

export const findEmne = (programId: string, emneId: string) => {
  const found = findProgram(programId);
  const emne = found?.program.emner?.find((e) => e.id === emneId);
  return found && emne ? { ...found, emne } : undefined;
};

// Older data (placements) refers to an emne by name. Names repeat across programs, so the program is
// needed to find the right one.
export const findEmneByName = (programId: string, name: string) =>
  findProgram(programId)?.program.emner?.find((e) => e.name === name);

// "Nursing · Praksis 2 – Medisinsk sykepleie"
export const emneLabel = (programId: string, emneId: string) => {
  const found = findEmne(programId, emneId);
  return found ? `${found.program.name} · ${found.emne.name}` : undefined;
};

// ── Labels ────────────────────────────────────────────────────────────────────
// "Sykepleie (SYK-B)": the code tells similar programs apart
export const programLabel = (program: Pick<StudyProgram, "name" | "code">) => (program.code ? `${program.name} (${program.code})` : program.name);

// What else is known about an emne, for a line under its name: "Term 3 · NSK201 · Medical ward · Pair placement · Start 2026 Høst"
export const emneMeta = (e: Omit<StudyEmne, "id" | "name" | "archived">): string[] =>
  [
    e.term ? `Term ${e.term}` : "",
    e.code ?? "",
    e.subject ?? "",
    e.pairPlacement ? "Pair placement" : "",
    e.startTerm ? `Start ${e.startTerm}` : "",
  ].filter(Boolean);

// ── Validation ────────────────────────────────────────────────────────────────
export const MAX_TERM = 12;

// Why an emne can't be saved; empty when it is fine. `others` are the program's other emner.
export const validateEmne = (input: { name: string; code?: string; term?: number }, others: StudyEmne[]): string[] => {
  const out: string[] = [];
  const name = input.name.trim();
  if (!name) out.push("Give the emne a name");
  else if (others.some((o) => !o.archived && same(o.name, name))) out.push("This program already has an emne with this name");
  const code = (input.code ?? "").trim();
  if (code && others.some((o) => !o.archived && o.code && same(o.code, code))) out.push("Another emne of this program has this code");
  if (input.term !== undefined && !(Number.isInteger(input.term) && input.term >= 1 && input.term <= MAX_TERM)) out.push(`The term must be a whole number from 1 to ${MAX_TERM}`);
  return out;
};

// Why a program can't be saved; empty when it is fine. `others` are the other programs of the study.
export const validateProgram = (input: { name: string; code?: string }, others: StudyProgram[]): string[] => {
  const out: string[] = [];
  const name = input.name.trim();
  if (!name) out.push("Give the program a name");
  else if (others.some((o) => !o.archived && same(o.name, name))) out.push("This study already has a program with this name");
  const code = (input.code ?? "").trim();
  if (code && others.some((o) => !o.archived && o.code && same(o.code, code))) out.push("Another program of this study has this code");
  return out;
};

// Empty text and zero mean "not set"; the stored emne carries only what was given
const cleanEmne = (input: EmneInput): Omit<StudyEmne, "id"> => ({
  name: input.name.trim(),
  ...(input.code?.trim() ? { code: input.code.trim() } : {}),
  ...(input.term ? { term: input.term } : {}),
  ...(input.subject?.trim() ? { subject: input.subject.trim() } : {}),
  ...(input.pairPlacement ? { pairPlacement: true } : {}),
  ...(input.startTerm?.trim() ? { startTerm: input.startTerm.trim() } : {}),
});

// ── Find or create by name (an import brings names, not ids) ─────────────────
// Returns the id of the study with this name under the university, creating it when it is not there yet
// (an archived one is reused as is, not restored). The same goes for programs and emner.
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
export const ensureStudy = (name: string, university: University = CURRENT_UNIVERSITY): string => {
  const found = catalog.find((s) => same(s.name, name) && s.universityId === university.id);
  if (found) return found.id;
  const id = newId("study");
  setCatalog([...catalog, { id, name, universityId: university.id, universityName: university.name, programs: [] }]);
  return id;
};

export const ensureProgram = (studyId: string, name: string, code?: string): string => {
  const program = catalog.find((s) => s.id === studyId)?.programs.find((p) => same(p.name, name));
  if (program) return program.id;
  const id = newId("program");
  mapStudy(studyId, (s) => ({ ...s, programs: [...s.programs, { id, name, ...(code ? { code } : {}) }] }));
  return id;
};

// `details` are set when the emne is made; an emne that is already there is left as it is
export const ensureEmne = (studyId: string, programId: string, name: string, details: Partial<EmneInput> = {}): string => {
  const emne = catalog
    .find((s) => s.id === studyId)
    ?.programs.find((p) => p.id === programId)
    ?.emner?.find((e) => same(e.name, name));
  if (emne) return emne.id;
  const id = newId("emne");
  mapProgram(studyId, programId, (p) => ({ ...p, emner: [...(p.emner ?? []), { id, ...cleanEmne({ ...details, name }) }] }));
  return id;
};

// ── Changes ───────────────────────────────────────────────────────────────────
const mapStudy = (studyId: string, change: (s: Study) => Study) =>
  setCatalog(catalog.map((s) => (s.id === studyId ? change(s) : s)));

const mapProgram = (studyId: string, programId: string, change: (p: StudyProgram) => StudyProgram) =>
  mapStudy(studyId, (s) => ({ ...s, programs: s.programs.map((p) => (p.id === programId ? change(p) : p)) }));

export const addStudy = (name: string, university: University = CURRENT_UNIVERSITY) => {
  const trimmed = name.trim();
  if (!trimmed) return;
  setCatalog([
    ...catalog,
    { id: newId("study"), name: trimmed, universityId: university.id, universityName: university.name, programs: [] },
  ]);
};

export const setStudyArchived = (studyId: string, archived: boolean) => mapStudy(studyId, (s) => ({ ...s, archived }));

export const addProgram = (studyId: string, name: string, code?: string) => {
  const trimmed = name.trim();
  if (!trimmed) return;
  mapStudy(studyId, (s) => ({ ...s, programs: [...s.programs, { id: newId("program"), name: trimmed, ...(code?.trim() ? { code: code.trim() } : {}) }] }));
};

export const updateProgram = (studyId: string, programId: string, patch: { name: string; code?: string }) =>
  mapProgram(studyId, programId, (p) => {
    const { code: _old, ...rest } = p;
    return { ...rest, name: patch.name.trim() || p.name, ...(patch.code?.trim() ? { code: patch.code.trim() } : {}) };
  });

export const setProgramArchived = (studyId: string, programId: string, archived: boolean) =>
  mapProgram(studyId, programId, (p) => ({ ...p, archived }));

export const addEmne = (studyId: string, programId: string, input: string | EmneInput) => {
  const given = typeof input === "string" ? { name: input } : input;
  if (!given.name.trim()) return;
  mapProgram(studyId, programId, (p) => ({ ...p, emner: [...(p.emner ?? []), { id: newId("emne"), ...cleanEmne(given) }] }));
};

// Replaces what an emne says about itself; its id (and so everything that refers to it) stays
export const updateEmne = (studyId: string, programId: string, emneId: string, input: EmneInput) =>
  mapProgram(studyId, programId, (p) => ({
    ...p,
    emner: (p.emner ?? []).map((e) => (e.id === emneId ? { id: e.id, ...(e.archived ? { archived: true } : {}), ...cleanEmne(input) } : e)),
  }));

export const setEmneArchived = (studyId: string, programId: string, emneId: string, archived: boolean) =>
  mapProgram(studyId, programId, (p) => ({
    ...p,
    emner: (p.emner ?? []).map((e) => (e.id === emneId ? { ...e, archived } : e)),
  }));
