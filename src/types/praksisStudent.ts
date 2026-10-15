import type { PriorityPlacementApplication } from "./priorityPlacement";
import { useSyncExternalStore } from "react";
import { IMPORT_YEAR, ensureEmne, ensureProgram, ensureStudy, remapEmneId } from "./studyCatalog";
import { ImportRow, UMEA_STUDENTS } from "../data/umeaStudents";

// Students who are registered for a praksis before any placement exists.
//
// A student is imported with study, program, emne and their praksis dates; only the praksis PLACE is
// still open. They stay in this registry until their placement is completed. What a student's state is
// (waiting / in placement / planned / placed / completed) is worked out from the placements — it is never stored — so it can't
// drift from what the placement screens show. The only thing stored besides the student is a "claim":
// which placement pulled the student in.

export interface PraksisStudent {
  id: string;
  name: string;
  personnummer: string;
  email: string;
  studyId: string;
  programId: string;
  emneId: string;
  startDate: string; // yyyy-MM-dd, the student's praksis period
  endDate: string;
  expectedHours: number;
  studyLocation: string;
  importedAt: string;
  phone?: string;
  address?: string;
  priorityPoints?: number; // points of the priority reasons the student came with (0 or absent: none)
  registered?: boolean; // false: the student is not registered on the course
}

// waiting: in no placement yet · inPlacement: in a placement, no place yet · planned: has a place that is not
// published yet · placed: the place is published · completed: the placement is completed
export type StudentStatus = "waiting" | "inPlacement" | "planned" | "placed" | "completed";

// The parts of a placement and of its students that the state is worked out from
export interface PlacementLike {
  id: string;
  title: string;
  status: string;
}
export interface AssignmentLike {
  status?: string;
  placeId?: string;
  placeName?: string;
  departmentName?: string;
  profileId?: string;
  mentor?: { name: string };
}
export interface TaskStudentLike {
  id: string;
  assignedPraksisPlace?: AssignmentLike;
}

export interface StudentRow {
  student: PraksisStudent;
  status: StudentStatus;
  // The placement that pulled the student in (a placement that completed without placing them doesn't count)
  placementId?: string;
  placementTitle?: string;
  placementStatus?: string;
  inPlacement: boolean; // in a placement that is still open (in placement, planned, placed)
  assignment?: AssignmentLike;
}

// Works out every student's state. `taskStudents` holds each placement's students (where the assignments are).
export const deriveRows = (
  students: PraksisStudent[],
  claims: Record<string, string>,
  placements: PlacementLike[],
  taskStudents: Map<string, TaskStudentLike[]>,
): StudentRow[] => {
  const byId = new Map(placements.map((p) => [p.id, p]));
  return students.map((student) => {
    const placement = claims[student.id] ? byId.get(claims[student.id]) : undefined;
    if (!placement) return { student, status: "waiting", inPlacement: false };
    const assignment = taskStudents.get(placement.id)?.find((s) => s.id === student.id)?.assignedPraksisPlace;
    const placed = !!assignment && assignment.status !== "cancelled";
    const base = { student, placementId: placement.id, placementTitle: placement.title, placementStatus: placement.status };
    if (placement.status === "completed") {
      // Completed once placed; a student the placement never placed is waiting again
      return placed
        ? { ...base, status: "completed", inPlacement: false, assignment }
        : { student, status: "waiting", inPlacement: false };
    }
    if (!placed) return { ...base, status: "inPlacement", inPlacement: true };
    // Publishing the placement books its assignments; until then the place is only planned
    return { ...base, status: assignment?.status === "booked" ? "placed" : "planned", inPlacement: true, assignment };
  });
};

// Students a new placement for this emne can take: waiting and not already in another placement.
// With a location only the students who study there are taken.
export const waitingForEmne = (rows: StudentRow[], emneId: string, studentIds?: Set<string>, location?: string) =>
  rows
    .filter((r) => r.status === "waiting" && r.student.emneId === emneId)
    .filter((r) => !location || r.student.studyLocation === location)
    .filter((r) => !studentIds || studentIds.has(r.student.id))
    .map((r) => r.student);

// The study locations of the students waiting for this emne, with how many wait at each
export const waitingLocations = (rows: StudentRow[], emneId: string) => {
  const counts = new Map<string, number>();
  waitingForEmne(rows, emneId).forEach((s) => counts.set(s.studyLocation, (counts.get(s.studyLocation) ?? 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
};

// ── A student's placement history ───────────────────────────────────────────────
// Every placement the student was part of, newest first: where they were placed (entity, mentor) and how it went.
export interface HistoryPlacement extends PlacementLike {
  year?: string;
  semester?: string;
  subject?: string;
  startDate?: string;
  endDate?: string;
}
export interface HistoryEntry {
  placementId: string;
  title: string;
  placementStatus: string;
  emne?: string;
  year?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  assignment?: AssignmentLike; // undefined: in the placement but never placed on an entity
  state: "completed" | "placed" | "planned" | "notPlaced";
}

export const placementHistoryOf = (studentId: string, placements: HistoryPlacement[], taskStudents: Map<string, TaskStudentLike[]>): HistoryEntry[] =>
  placements
    .flatMap((p) => {
      const inIt = taskStudents.get(p.id)?.find((s) => s.id === studentId);
      if (!inIt) return [];
      const a = inIt.assignedPraksisPlace;
      const placed = !!a && a.status !== "cancelled";
      const state: HistoryEntry["state"] = !placed ? "notPlaced" : p.status === "completed" ? "completed" : a?.status === "booked" ? "placed" : "planned";
      return [
        {
          placementId: p.id,
          title: p.title,
          placementStatus: p.status,
          emne: p.subject,
          year: p.year,
          semester: p.semester,
          startDate: p.startDate,
          endDate: p.endDate,
          assignment: placed ? a : undefined,
          state,
        },
      ];
    })
    .sort((x, y) => (y.startDate ?? "").localeCompare(x.startDate ?? ""));

// ── Filters ───────────────────────────────────────────────────────────────────
export interface StudentFilters {
  query: string;
  studyId: string; // "all" or an id
  programId: string;
  emneId: string;
  status: "active" | "all" | StudentStatus; // active = not completed
  placement: "any" | "none" | "in"; // not in a placement / in a placement
  startFrom: string; // yyyy-MM-dd or ""
  startTo: string;
  location: string; // "all" or a location
}

export const EMPTY_FILTERS: StudentFilters = {
  query: "",
  studyId: "all",
  programId: "all",
  emneId: "all",
  status: "active",
  placement: "any",
  startFrom: "",
  startTo: "",
  location: "all",
};

// Everything except the status, so the status chips can show counts for the rest of the filters
export const filterRows = (rows: StudentRow[], f: StudentFilters, ignoreStatus = false): StudentRow[] => {
  const q = f.query.trim().toLowerCase();
  return rows.filter((r) => {
    const s = r.student;
    if (f.studyId !== "all" && s.studyId !== f.studyId) return false;
    if (f.programId !== "all" && s.programId !== f.programId) return false;
    if (f.emneId !== "all" && s.emneId !== f.emneId) return false;
    if (f.location !== "all" && s.studyLocation !== f.location) return false;
    if (f.startFrom && s.startDate < f.startFrom) return false;
    if (f.startTo && s.startDate > f.startTo) return false;
    if (f.placement === "none" && r.inPlacement) return false;
    if (f.placement === "in" && !r.inPlacement) return false;
    if (!ignoreStatus) {
      if (f.status === "active" && r.status === "completed") return false;
      if (f.status !== "active" && f.status !== "all" && r.status !== f.status) return false;
    }
    if (q && !`${s.name} ${s.personnummer} ${s.email}`.toLowerCase().includes(q)) return false;
    return true;
  });
};

// The points shown for a student: the approved application when there is one, else the points the student came
// with in the import
export const priorityPointsOf = (student: PraksisStudent, applications: PriorityPlacementApplication[]): number | undefined =>
  priorityOf(student, applications)?.totalPoints ?? (student.priorityPoints ? student.priorityPoints : undefined);

// ── Priority ──────────────────────────────────────────────────────────────────
// A student's priority is the approved priority application they have (Priorities page). Applications belong to
// the student by personnummer; when there are several, the one for the student's program counts, then the one
// with the most points.
const digits = (personnummer: string) => personnummer.replace(/\D/g, "");

export const priorityOf = (
  student: Pick<PraksisStudent, "personnummer" | "programId">,
  applications: PriorityPlacementApplication[],
): PriorityPlacementApplication | undefined => {
  const own = digits(student.personnummer);
  if (!own) return undefined;
  return applications
    .filter((a) => a.status === "approved" && digits(a.personnummer) === own)
    .sort((x, y) => Number(y.programId === student.programId) - Number(x.programId === student.programId) || y.totalPoints - x.totalPoints)[0];
};

// ── Sorting ───────────────────────────────────────────────────────────────────
export type SortKey =
  | "student"
  | "program"
  | "emne"
  | "period"
  | "hours"
  | "location"
  | "status"
  | "placement"
  | "profile"
  | "place"
  | "mentor"
  | "priority";
export type SortDir = "asc" | "desc";

// How ids become names (the catalog and the profiles hold them); the sort works on what the user reads
export interface SortNames {
  study: (id: string) => string;
  program: (id: string) => string;
  emne: (id: string) => string;
  profile: (id?: string) => string;
  priority?: (student: PraksisStudent) => number | undefined; // points of the student's approved priority application
}

const STATUS_ORDER: Record<StudentStatus, number> = { waiting: 0, inPlacement: 1, planned: 2, placed: 3, completed: 4 };
const collator = new Intl.Collator("nb", { numeric: true, sensitivity: "base" });

// A row's value for a column: text, a number, or undefined when it has none (those rows sort last either way)
const sortValue = (r: StudentRow, key: SortKey, n: SortNames): string | number | undefined => {
  const s = r.student;
  const a = r.assignment;
  switch (key) {
    case "student":
      return s.name;
    case "program":
      return `${n.study(s.studyId)} ${n.program(s.programId)}`;
    case "emne":
      return n.emne(s.emneId);
    case "period":
      return s.startDate;
    case "hours":
      return s.expectedHours || undefined; // 0: not known
    case "location":
      return s.studyLocation;
    case "status":
      return STATUS_ORDER[r.status];
    case "placement":
      return r.placementTitle;
    case "profile":
      return a ? n.profile(a.profileId) || a.departmentName || undefined : undefined;
    case "place":
      return a ? a.placeName || undefined : undefined;
    case "mentor":
      return a?.mentor?.name;
    case "priority":
      return n.priority?.(s);
  }
};

// A sorted copy: by the column, then by name so equal values keep a steady order. Rows with no value come last.
export const sortRows = (rows: StudentRow[], key: SortKey, dir: SortDir, names: SortNames): StudentRow[] =>
  rows
    .map((row) => ({ row, v: sortValue(row, key, names) }))
    .sort((x, y) => {
      const xe = x.v === undefined || x.v === "";
      const ye = y.v === undefined || y.v === "";
      if (xe !== ye) return xe ? 1 : -1;
      let c = 0;
      if (!xe) c = typeof x.v === "number" && typeof y.v === "number" ? x.v - y.v : collator.compare(String(x.v), String(y.v));
      if (dir === "desc") c = -c;
      return c || collator.compare(x.row.student.name, y.row.student.name) || x.row.student.id.localeCompare(y.row.student.id);
    })
    .map((x) => x.row);

export const countByStatus = (rows: StudentRow[]): Record<StudentStatus, number> => {
  const out: Record<StudentStatus, number> = { waiting: 0, inPlacement: 0, planned: 0, placed: 0, completed: 0 };
  rows.forEach((r) => (out[r.status] += 1));
  return out;
};

// Students with a praksis place (an assignment that is not cancelled) and those without, in the rows given
export const countAssigned = (rows: StudentRow[]) => {
  const assigned = rows.filter((r) => r.assignment && r.assignment.status !== "cancelled").length;
  return { assigned, notAssigned: rows.length - assigned };
};

// The few numbers the dashboard shows from this page. Completed students need no action, so they are left out of
// everything but the totals.
export interface StudentMetrics {
  total: number;
  open: number; // not completed
  waiting: number; // in no placement
  inPlacement: number; // in a placement, with no entity yet
  planned: number; // has an entity, not published to the student yet
  hasPlace: number; // planned or placed (an entity, not cancelled)
  hasPlacePct: number; // of the open students
  noMentor: number; // open students with an entity but no mentor (supervisor) attached yet
  emneCount: number; // the different emner the open students belong to
}

export const studentMetrics = (rows: StudentRow[]): StudentMetrics => {
  const c = countByStatus(rows);
  const openRows = rows.filter((r) => r.status !== "completed");
  const placedRows = openRows.filter((r) => r.assignment && r.assignment.status !== "cancelled");
  return {
    total: rows.length,
    open: openRows.length,
    waiting: c.waiting,
    inPlacement: c.inPlacement,
    planned: c.planned,
    hasPlace: placedRows.length,
    hasPlacePct: openRows.length ? Math.round((placedRows.length / openRows.length) * 100) : 0,
    noMentor: placedRows.filter((r) => !r.assignment?.mentor?.name).length,
    emneCount: new Set(openRows.map((r) => r.student.emneId)).size,
  };
};

// ── The placement's period, from its students ─────────────────────────────────
// The earliest start and the latest end. Year and semester follow the start (Spring before August).
export const derivePlacementWindow = (students: { startDate: string; endDate: string }[]) => {
  if (students.length === 0) return undefined;
  const startDate = students.reduce((min, s) => (s.startDate < min ? s.startDate : min), students[0].startDate);
  const endDate = students.reduce((max, s) => (s.endDate > max ? s.endDate : max), students[0].endDate);
  const month = parseInt(startDate.slice(5, 7), 10) - 1;
  return { startDate, endDate, year: startDate.slice(0, 4), semester: month < 7 ? "Spring" : "Autumn" };
};

// How a registry student looks inside a placement (the placement screens work with this shape)
export const toPlacementStudent = (s: PraksisStudent) => ({
  id: s.id,
  name: s.name,
  personnummer: s.personnummer,
  email: s.email,
  year: s.startDate.slice(0, 4),
  customRequestSubmitted: false,
  praksisStartDate: s.startDate,
  praksisEndDate: s.endDate,
  expectedHours: s.expectedHours,
  studyLocation: s.studyLocation,
  address: s.address,
  priorityPoints: s.priorityPoints,
  registered: s.registered,
});

// ── Import data ───────────────────────────────────────────────────────────────
// The students of the Umeå University sheets (src/data/umeaStudents.ts). The sheets say which program and intake
// ("Kull") a student is in, not a study, a course or when the praksis is. So the programs go under one study of your university (so
// Settings lists and edits it), each named and coded as in the sheet, and the import makes one VFU course per program and intake,
// named "VFU HT 2022", and gives its students a 10-week period from the intake date. The real dates are set when
// the placement is made.
// The study the programs are under: the Swedish education field (SUN 72) of health care and social care
export const IMPORT_STUDY = "Hälso- och sjukvård samt social omsorg";
export const IMPORT_TOTAL = UMEA_STUDENTS.length;
export const IMPORT_PERIOD_DAYS = 69; // 10 weeks, Monday to Friday

// "HT 2022" for an intake in autumn, "VT 2023" for one in spring (August and later is autumn)
export const intakeTerm = (startDate: string) => `${parseInt(startDate.slice(5, 7), 10) >= 8 ? "HT" : "VT"} ${startDate.slice(0, 4)}`;

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface ResolvedEmne {
  studyId: string;
  programId: string;
  emneId: string;
}

// What the import brings: how many programs and VFU courses the students are spread over
export const importSummary = (rows: ImportRow[] = UMEA_STUDENTS) => ({
  students: rows.length,
  studies: 1,
  programs: new Set(rows.map((r) => r.programCode)).size,
  emner: new Set(rows.map((r) => `${r.programCode}|${intakeTerm(r.startDate)}`)).size,
});

// The students as registry students. `resolve` turns a program and an intake into catalog ids.
export const generateImportStudents = (
  resolve: (row: ImportRow) => ResolvedEmne,
  importedAt: string,
  rows: ImportRow[] = UMEA_STUDENTS,
): PraksisStudent[] =>
  rows.map((r) => ({
    id: `umu-${r.personnummer}-${r.startDate}`,
    name: `${r.firstName} ${r.lastName}`,
    personnummer: r.personnummer,
    email: r.email,
    ...resolve(r),
    startDate: r.startDate,
    endDate: addDays(r.startDate, IMPORT_PERIOD_DAYS),
    expectedHours: 0,
    studyLocation: r.studyLocation,
    importedAt,
    ...(r.phone ? { phone: r.phone } : {}),
    ...(r.address ? { address: r.address } : {}),
    priorityPoints: r.priorityPoints,
    registered: r.registered,
  }));

// ── Store ─────────────────────────────────────────────────────────────────────
interface State {
  students: PraksisStudent[];
  claims: Record<string, string>; // studentId → the placement that pulled them in
}

const STORAGE_KEY = "praksisStudents";

const load = (): State => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (parsed && Array.isArray(parsed.students)) {
      // The earlier generated demo students ("imp-…") gave way to the Umeå students
      // The imported students' praksis periods were dated 2022 and 2023; they are now in 2026, and their emne
      // follows the catalog (see migrateCatalogV3)
      const toImportYear = (date: string) => (/^20(22|23)-/.test(date) ? `${IMPORT_YEAR}${date.slice(4)}` : date);
      const students = parsed.students
        .filter((s: PraksisStudent) => !s.id.startsWith("imp-"))
        .map((s: PraksisStudent) => ({ ...s, startDate: toImportYear(s.startDate), endDate: toImportYear(s.endDate), emneId: remapEmneId(s.emneId) }));
      const claims = Object.fromEntries(Object.entries((parsed.claims ?? {}) as Record<string, string>).filter(([id]) => !id.startsWith("imp-")));
      return { students, claims };
    }
  } catch {
    // unreadable: start empty
  }
  return { students: [], claims: {} };
};

let state: State = load();
const listeners = new Set<() => void>();

const setState = (next: State) => {
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

export const usePraksisStudents = (): State => useSyncExternalStore(subscribe, () => state);
export const getPraksisState = () => state;

// Adds students that are not there yet (an existing id is never overwritten). Returns how many were added.
export const addPraksisStudents = (list: PraksisStudent[]): number => {
  const have = new Set(state.students.map((s) => s.id));
  const fresh = list.filter((s) => !have.has(s.id));
  if (fresh.length > 0) setState({ ...state, students: [...state.students, ...fresh] });
  return fresh.length;
};

// Brings the Umeå students in, adding any study, program and VFU course they need to the catalog first (one study
// with a program per program of the sheets)
export const importStudents = (now = new Date()): number =>
  addPraksisStudents(
    generateImportStudents((row) => {
      const studyId = ensureStudy(IMPORT_STUDY);
      const programId = ensureProgram(studyId, row.program, row.programCode);
      const term = intakeTerm(row.startDate);
      return { studyId, programId, emneId: ensureEmne(studyId, programId, `VFU ${term}`, { startTerm: term }) };
    }, now.toISOString()),
  );

// A placement pulls these students in. Returns the ids that were claimed.
export const claimStudents = (ids: string[], placementId: string): string[] => {
  const known = new Set(state.students.map((s) => s.id));
  const ok = ids.filter((id) => known.has(id));
  if (ok.length === 0) return [];
  const claims = { ...state.claims };
  ok.forEach((id) => (claims[id] = placementId));
  setState({ ...state, claims });
  return ok;
};

export const releasePlacement = (placementId: string) => {
  const claims = Object.fromEntries(Object.entries(state.claims).filter(([, p]) => p !== placementId));
  if (Object.keys(claims).length !== Object.keys(state.claims).length) setState({ ...state, claims });
};

// Drops claims by placements that no longer exist (placements are not saved across a reload)
export const pruneClaims = (validPlacementIds: Set<string>) => {
  const entries = Object.entries(state.claims);
  const kept = entries.filter(([, p]) => validPlacementIds.has(p));
  if (kept.length !== entries.length) setState({ ...state, claims: Object.fromEntries(kept) });
};

export const clearPraksisStudents = () => setState({ students: [], claims: {} });
