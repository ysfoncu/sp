import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  IMPORT_TOTAL,
  PraksisStudent,
  addPraksisStudents,
  claimStudents,
  countAssigned,
  countByStatus,
  derivePlacementWindow,
  deriveRows,
  filterRows,
  generateImportStudents,
  getPraksisState,
  importStudents,
  importSummary,
  intakeTerm,
  priorityPointsOf,
  priorityOf,
  pruneClaims,
  releasePlacement,
  sortRows,
  waitingForEmne,
} from "./praksisStudent";
import type { PriorityPlacementApplication } from "./priorityPlacement";
import { CURRENT_UNIVERSITY, ensureEmne, ensureProgram, ensureStudy, getStudies } from "./studyCatalog";

const student = (id: string, emneId: string, startDate = "2026-10-12", endDate = "2026-12-18"): PraksisStudent => ({
  id,
  name: `S ${id}`,
  personnummer: "010100-12345",
  email: `${id}@x.no`,
  studyId: "st",
  programId: "pr",
  emneId,
  startDate,
  endDate,
  expectedHours: 100,
  studyLocation: "Oslo",
  importedAt: "2026-10-01",
});

describe("generateImportStudents", () => {
  const fake = (r: { programCode: string; startDate: string }) => ({
    studyId: "study",
    programId: r.programCode,
    emneId: `${r.programCode}/${intakeTerm(r.startDate)}`,
  });
  const list = generateImportStudents(fake, "now");

  it("brings every student of the Umeå sheets, each once", () => {
    expect(list).toHaveLength(IMPORT_TOTAL);
    expect(IMPORT_TOTAL).toBe(485);
    expect(new Set(list.map((s) => s.id)).size).toBe(IMPORT_TOTAL);
    expect(new Set(list.map((s) => s.programId)).size).toBe(4);
    expect(new Set(list.map((s) => s.emneId)).size).toBe(6);
    expect(importSummary()).toEqual({ students: 485, studies: 1, programs: 4, emner: 6 });
  });

  it("carries what the sheets say about each student", () => {
    const s = list[0];
    expect(s).toMatchObject({ name: "Samuel Andersson", personnummer: "1900151338D", studyLocation: "Umeå", startDate: "2022-09-01", priorityPoints: 0, registered: true });
    expect(list.filter((x) => x.priorityPoints).length).toBe(17);
    expect(list.filter((x) => x.registered === false).length).toBe(49);
  });

  it("gives every student a 10-week period from the intake", () => {
    expect(list.every((s) => s.startDate < s.endDate)).toBe(true);
    expect(list[0].endDate).toBe("2022-11-09");
    expect(generateImportStudents(fake, "now")).toEqual(list);
  });

  it("names the intake term", () => {
    expect(intakeTerm("2022-09-01")).toBe("HT 2022");
    expect(intakeTerm("2023-01-01")).toBe("VT 2023");
  });
});

describe("derived state", () => {
  const students = [student("a", "e1"), student("b", "e1"), student("c", "e2")];
  const placements = [{ id: "p1", title: "P1", status: "select" }];
  const a = { placeId: "x", placeName: "Hospital", departmentName: "Unit", status: "planned" };

  it("counts students with and without a praksis place", () => {
    const rows = deriveRows(students, {}, placements, new Map());
    expect(countAssigned(rows)).toEqual({ assigned: 0, notAssigned: 3 });
    const withPlace = rows.map((r, i) => (i === 0 ? { ...r, assignment: { status: "planned", placeId: "p1" } } : i === 1 ? { ...r, assignment: { status: "cancelled" } } : r));
    expect(countAssigned(withPlace)).toEqual({ assigned: 1, notAssigned: 2 });
    expect(countAssigned([])).toEqual({ assigned: 0, notAssigned: 0 });
  });

  it("starts waiting and not in a placement", () => {
    const rows = deriveRows(students, {}, placements, new Map());
    expect(countByStatus(rows)).toEqual({ waiting: 3, inPlacement: 0, planned: 0, placed: 0, completed: 0 });
    expect(waitingForEmne(rows, "e1")).toHaveLength(2);
  });
  it("a claimed student is in the placement, not available for another", () => {
    const rows = deriveRows(students, { a: "p1", b: "p1" }, placements, new Map([["p1", [{ id: "a" }, { id: "b" }]]]));
    expect(rows[0]).toMatchObject({ status: "inPlacement", inPlacement: true, placementId: "p1" });
    expect(waitingForEmne(rows, "e1")).toHaveLength(0);
  });
  it("is planned when assigned, placed once published, and completed when the placement completes", () => {
    const tasks = new Map([["p1", [{ id: "a", assignedPraksisPlace: a }, { id: "b" }]]]);
    let rows = deriveRows(students, { a: "p1", b: "p1" }, placements, tasks);
    expect(rows[0]).toMatchObject({ status: "planned", inPlacement: true, assignment: a });
    expect(rows[1].status).toBe("inPlacement");
    // publishing books the assignment
    const published = new Map([["p1", [{ id: "a", assignedPraksisPlace: { ...a, status: "booked" } }, { id: "b" }]]]);
    rows = deriveRows(students, { a: "p1", b: "p1" }, placements, published);
    expect(rows[0].status).toBe("placed");
    // an assignment without a status is not published either
    const bare = new Map([["p1", [{ id: "a", assignedPraksisPlace: { placeId: "x" } }]]]);
    expect(deriveRows(students, { a: "p1" }, placements, bare)[0].status).toBe("planned");
    rows = deriveRows(students, { a: "p1", b: "p1" }, placements, tasks);
    rows = deriveRows(students, { a: "p1", b: "p1" }, [{ ...placements[0], status: "completed" }], tasks);
    expect(rows[0]).toMatchObject({ status: "completed", assignment: a });
    // not placed when the placement ended: waiting again and free to join another placement
    expect(rows[1]).toMatchObject({ status: "waiting", inPlacement: false });
  });
  it("a cancelled assignment is not placed; a claim by a missing placement is ignored", () => {
    const tasks = new Map([["p1", [{ id: "a", assignedPraksisPlace: { ...a, status: "cancelled" } }]]]);
    expect(deriveRows(students, { a: "p1" }, placements, tasks)[0].status).toBe("inPlacement");
    expect(deriveRows(students, { a: "gone" }, placements, new Map())[0].inPlacement).toBe(false);
  });
});

describe("filters", () => {
  const rows = deriveRows(
    [student("a", "e1", "2026-10-12"), student("b", "e2", "2027-01-18"), { ...student("c", "e1"), name: "Kari Nordmann", studyLocation: "Bergen" }],
    { a: "p1" },
    [{ id: "p1", title: "P1", status: "completed" }],
    new Map([["p1", [{ id: "a", assignedPraksisPlace: { status: "planned" } }]]]),
  );
  it("hides completed by default and shows them with All", () => {
    expect(filterRows(rows, EMPTY_FILTERS).map((r) => r.student.id)).toEqual(["b", "c"]);
    expect(filterRows(rows, { ...EMPTY_FILTERS, status: "all" })).toHaveLength(3);
    expect(filterRows(rows, { ...EMPTY_FILTERS, status: "completed" }).map((r) => r.student.id)).toEqual(["a"]);
  });
  it("filters by emne, location, start dates and search", () => {
    const all = { ...EMPTY_FILTERS, status: "all" as const };
    expect(filterRows(rows, { ...all, emneId: "e1" })).toHaveLength(2);
    expect(filterRows(rows, { ...all, location: "Bergen" })).toHaveLength(1);
    expect(filterRows(rows, { ...all, startFrom: "2027-01-01" }).map((r) => r.student.id)).toEqual(["b"]);
    expect(filterRows(rows, { ...all, query: "nordmann" }).map((r) => r.student.id)).toEqual(["c"]);
  });
});

describe("placement period", () => {
  it("runs from the earliest start to the latest end; semester follows the start", () => {
    expect(derivePlacementWindow([])).toBeUndefined();
    expect(
      derivePlacementWindow([
        { startDate: "2026-10-19", endDate: "2026-12-11" },
        { startDate: "2026-10-12", endDate: "2026-12-18" },
      ]),
    ).toEqual({ startDate: "2026-10-12", endDate: "2026-12-18", year: "2026", semester: "Autumn" });
    expect(derivePlacementWindow([{ startDate: "2027-01-18", endDate: "2027-03-26" }])?.semester).toBe("Spring");
  });
});

describe("store", () => {
  it("imports into the catalog once, claims, releases and prunes", () => {
    expect(importStudents()).toBe(485);
    expect(importStudents()).toBe(0); // no duplicates
    const studies = getStudies();
    const umea = studies.filter((s) => s.universityId === CURRENT_UNIVERSITY.id);
    expect(umea.map((s) => s.name)).toEqual(["Hälso- och sjukvård samt social omsorg"]);
    expect(umea[0].programs.map((p) => p.name).sort()).toEqual(["Barnmorskeprogrammet", "Fysioterapeutprogrammet", "Logopedprogrammet", "Sjuksköterskeprogrammet"]);
    expect(umea[0].programs.map((p) => p.code).sort()).toEqual(["MYLOG", "VYBAR", "VYFYS", "VYSJS"]);
    const emner = umea.flatMap((s) => s.programs.flatMap((p) => p.emner ?? []));
    expect(emner).toHaveLength(6);
    expect(emner.map((e) => e.startTerm).sort()).toEqual(["HT 2022", "HT 2022", "HT 2022", "HT 2022", "HT 2023", "VT 2023"]);

    const [first, second] = getPraksisState().students;
    expect(claimStudents([first.id, "nope"], "p1")).toEqual([first.id]);
    expect(getPraksisState().claims).toEqual({ [first.id]: "p1" });
    claimStudents([second.id], "p2");
    pruneClaims(new Set(["p2"]));
    expect(Object.keys(getPraksisState().claims)).toEqual([second.id]);
    releasePlacement("p2");
    expect(getPraksisState().claims).toEqual({});
    expect(addPraksisStudents([first])).toBe(0);
  });
  it("ensure* find existing items regardless of case and spacing", () => {
    const study = ensureStudy("  helse- og sosialfag ");
    expect(getStudies().filter((s) => s.id === study)).toHaveLength(1);
    const program = ensureProgram(study, "SYKEPLEIE");
    expect(ensureProgram(study, "Sykepleie")).toBe(program);
    expect(ensureEmne(study, program, "kull 2026 høst")).toBe(ensureEmne(study, program, "Kull 2026 Høst"));
  });
});

describe("profile validation", () => {
  it("needs an accepted emne but never needs places", async () => {
    const { validateProfile } = await import("./placementProfile");
    const study = ensureStudy("Valideringsstudie");
    const program = ensureProgram(study, "Valideringsprogram");
    const emne = ensureEmne(study, program, "Kull 1");
    const base = { id: "x", name: "P", programId: program };
    expect(validateProfile({ ...base, emneIds: [], places: 0 })).toContain("Select at least one emne");
    expect(validateProfile({ ...base, emneIds: [emne], places: 0 })).toEqual([]);
    // a program with no emner has nothing to pick
    const bare = ensureProgram(study, "Uten emner");
    expect(validateProfile({ ...base, programId: bare, emneIds: [], places: 0 })).toEqual([]);
  });
});

describe("sortRows", () => {
  const names = {
    study: (id: string) => id,
    program: (id: string) => id,
    emne: (id: string) => id,
    profile: (id?: string) => id ?? "",
  };
  const mk = (id: string, name: string, over: Partial<PraksisStudent> = {}) => ({ ...student(id, "e1"), name, ...over });
  const students = [
    mk("a", "Ola Øye", { expectedHours: 100, startDate: "2026-11-02" }),
    mk("b", "Kari Berg", { expectedHours: 210, startDate: "2026-10-12" }),
    mk("c", "Per Aas", { expectedHours: 90, startDate: "2026-10-26" }),
  ];
  const placed = { placeId: "x", placeName: "Hospital", departmentName: "Unit 2", profileId: "p2", mentor: { name: "Zed" }, status: "booked" };
  const planned = { placeId: "x", placeName: "Hospital", departmentName: "Unit 10", profileId: "p1", status: "planned" };
  const rows = deriveRows(
    students,
    { a: "p1", b: "p1" },
    [{ id: "p1", title: "P1", status: "select" }],
    new Map([["p1", [{ id: "a", assignedPraksisPlace: placed }, { id: "b", assignedPraksisPlace: planned }]]]),
  );
  const ids = (list: ReturnType<typeof deriveRows>) => list.map((r) => r.student.id);

  it("sorts text by what the user reads, in Norwegian order and both directions", () => {
    // names are shown as "First Last", so the order follows the first name: Kari, Ola, Per
    expect(ids(sortRows(rows, "student", "asc", names))).toEqual(["b", "a", "c"]);
    expect(ids(sortRows(rows, "student", "desc", names))).toEqual(["c", "a", "b"]);
    // Norwegian letters come after Z, not among the A's
    const nordic = [mk("x", "Øyvind Z"), mk("y", "Åse Y"), mk("z", "Zoe X"), mk("w", "Aron W")];
    const nr = deriveRows(nordic, {}, [], new Map());
    expect(ids(sortRows(nr, "student", "asc", names))).toEqual(["w", "z", "x", "y"]);
  });
  it("sorts numbers as numbers and dates by start", () => {
    expect(ids(sortRows(rows, "hours", "asc", names))).toEqual(["c", "a", "b"]);
    expect(ids(sortRows(rows, "period", "asc", names))).toEqual(["b", "c", "a"]);
  });
  it("sorts status in workflow order, not alphabetically", () => {
    // c is waiting, b is planned, a is placed
    expect(ids(sortRows(rows, "status", "asc", names))).toEqual(["c", "b", "a"]);
    expect(ids(sortRows(rows, "status", "desc", names))).toEqual(["a", "b", "c"]);
  });
  it("sorts numbers inside text naturally", () => {
    const entity = { ...names, profile: (id?: string) => (id === "p2" ? "Ward 2" : "Ward 10") };
    expect(ids(sortRows(rows, "profile", "asc", entity)).slice(0, 2)).toEqual(["a", "b"]); // Ward 2 before Ward 10
    expect(ids(sortRows(rows, "place", "asc", names)).slice(0, 2)).toEqual(["b", "a"]); // same place: then by name (Kari before Ola)
  });
  it("puts rows without a value last in both directions", () => {
    expect(ids(sortRows(rows, "mentor", "asc", names))).toEqual(["a", "b", "c"]);
    expect(ids(sortRows(rows, "mentor", "desc", names))).toEqual(["a", "b", "c"]);
    expect(ids(sortRows(rows, "profile", "asc", names))).toEqual(["b", "a", "c"]);
  });
  it("keeps a steady order for equal values and does not change the input", () => {
    const before = ids(rows);
    expect(ids(sortRows(rows, "emne", "asc", names))).toEqual(["b", "a", "c"]); // all e1: by name
    expect(ids(rows)).toEqual(before);
  });
});

describe("priority points", () => {
  it("shows the approved application's points, else the points from the import", () => {
    const s = { ...student("a", "e1"), priorityPoints: 16 };
    expect(priorityPointsOf(s, [])).toBe(16);
    expect(priorityPointsOf({ ...s, priorityPoints: 0 }, [])).toBeUndefined();
    const app = { personnummer: "010100-12345", programId: "pr", totalPoints: 8, status: "approved" } as PriorityPlacementApplication;
    expect(priorityPointsOf(s, [app])).toBe(8);
  });
});

describe("priority", () => {
  const app = (over: Partial<PriorityPlacementApplication>): PriorityPlacementApplication =>
    ({ id: "x", studentId: "enrolled-1", personnummer: "010100-12345", programId: "pr", totalPoints: 4, status: "approved", ...over }) as PriorityPlacementApplication;
  const s = student("a", "e1");

  it("finds the approved application of the student by personnummer, however it is written", () => {
    expect(priorityOf(s, [app({ personnummer: "0101001 2345" })])?.totalPoints).toBe(4);
    expect(priorityOf(s, [app({ personnummer: "999999-99999" })])).toBeUndefined();
    expect(priorityOf({ ...s, personnummer: "" }, [app({ personnummer: "" })])).toBeUndefined();
  });

  it("ignores applications that are not approved", () => {
    expect(priorityOf(s, [app({ status: "pending" }), app({ status: "rejected" })])).toBeUndefined();
  });

  it("prefers the application for the student's program, then the most points", () => {
    const apps = [app({ id: "1", programId: "other", totalPoints: 32 }), app({ id: "2", totalPoints: 2 }), app({ id: "3", totalPoints: 8 })];
    expect(priorityOf(s, apps)?.id).toBe("3");
    expect(priorityOf(s, [apps[0]])?.id).toBe("1");
  });

  it("sorts by points, with students without priority last in both directions", () => {
    const mk = (id: string) => deriveRows([{ ...student(id, "e1"), name: id }], {}, [], new Map())[0];
    const rows = ["a", "b", "c"].map(mk);
    const points: Record<string, number | undefined> = { a: 4, b: undefined, c: 16 };
    const names = { study: (i: string) => i, program: (i: string) => i, emne: (i: string) => i, profile: (i?: string) => i ?? "", priority: (st: PraksisStudent) => points[st.id] };
    const ids = (l: typeof rows) => l.map((r) => r.student.id);
    expect(ids(sortRows(rows, "priority", "asc", names))).toEqual(["a", "c", "b"]);
    expect(ids(sortRows(rows, "priority", "desc", names))).toEqual(["c", "a", "b"]);
  });
});
