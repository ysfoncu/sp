import { beforeAll, describe, expect, it } from "vitest";
import { PraksisPlace } from "./praksisPlace";
import { isPeriodComplete, periodKeyFor } from "./placePeriod";
import { addEmne, addProgram, addStudy, emneIdRemap, getStudies } from "./studyCatalog";
import {
  ENTITY_TYPES,
  EntityContactLink,
  FlatProfile,
  PlacementProfile,
  addProfile,
  createEntity,
  deleteContact,
  duplicateProfile,
  entitiesOfContact,
  entityMissing,
  entityTypeLabel,
  isPlaceable,
  migrateProfilesV3, migrateProfilesV5, migrateProfilesV6,
  placesFor, totalPlaces, emptyPlacementInfo,
  validateName,
  profileAudienceLabel,
  profileMatches,
  getProfiles,
  linkContact,
  migrateProfilesV1,
  migrateProfilesV2,
  resolveContacts,
  setContactEntities,
  unlinkContact,
  placementEmneId,
  resolveAssignmentProfile,
  setProfileStatus,
  uniqueEntityName,
  updateProfile,
  validateProfile,
} from "./placementProfile";
import { activationErrors, lockedEmneIds, mentorState, peopleToNotify, placedOnProfile, placesError, studentsNeedingMentor } from "./profileRules";
import { OtherPlacementUsage, UsageStudent, nodeCapacity, profileTreeForPlacement, totalPlacesForPlacement } from "./profileUsage";
import {
  addSlot, canRemove, defaultSlots, minSlots, parseSlots, removeSlot, setSlot, slotCandidates, slotsFromTrees, slotsOver, studentsWithoutSlot, totalSlots, validateSlots,
} from "./placementSlots";
import { buildStudentView, missingInfo, takeSnapshot, viewChangedSince } from "./studentView";
import { PlaceContact, addPlaceContact, getPlaceContacts, validateContact } from "./placeContact";

// ── Fixtures: one place, one program with two emner ───────────────────────────────
const place = { id: "place1", name: "Hospital" } as unknown as PraksisPlace;

let programId = "";
let emne1 = "";
let emne2 = "";
let studyId = "";

beforeAll(() => {
  // The catalog starts with the seed study, so the tests make their own
  addStudy("Health");
  const study = () => getStudies().find((s) => s.name === "Health")!;
  studyId = study().id;
  addProgram(studyId, "Nursing");
  programId = study().programs[0].id;
  addEmne(studyId, programId, "Autumn cohort");
  addEmne(studyId, programId, "Spring cohort");
  [emne1, emne2] = study().programs[0].emner!.map((e) => e.id);
});

// An entity that accepts the test program: the short forms programId / emneIds / places stand for its one entry
// (`programs` itself can be given for several). An empty programId means no program.
type Over = Partial<PlacementProfile> & { id: string; programId?: string; emneIds?: string[]; places?: number; studyId?: string };
const profile = ({ programId: pid = programId, emneIds = [emne1, emne2], places = 4, studyId: _study, programs, ...over }: Over): PlacementProfile => ({
  praksisPlaceId: "place1",
  name: over.id,
  status: "active",
  programs: programs ?? (pid ? [{ programId: pid, emneIds, places }] : []), // the emne it accepts; none picked would mean it takes nobody
  contacts: [],
  info: {} as PlacementProfile["info"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
  ...over,
});

// The same entity as saved before it accepted several programs (storage versions 1 to 5)
const flat = (over: Over): FlatProfile => {
  const { programs, ...rest } = profile(over);
  return { ...rest, studyId, programId: programs[0]?.programId ?? "", emneIds: programs[0]?.emneIds ?? [], places: programs[0]?.places ?? 0 };
};

// What the store functions take for an entity of the test program
const one = (o: { programId?: string; emneIds?: string[]; places?: number }) => ({
  programs: o.programId ? [{ programId: o.programId, emneIds: o.emneIds ?? [], places: o.places ?? 0 }] : [],
});

// A person added to an entity, and the person on the place
const contact = (id: string, over: Partial<EntityContactLink> = {}): EntityContactLink => ({
  contactId: id,
  notifyOnPlacement: true,
  availableToStudents: true,
  ...over,
});
const person = (id: string, over: Partial<PlaceContact> = {}): PlaceContact => ({
  id,
  praksisPlaceId: "place1",
  name: id,
  role: "Supervisor",
  email: `${id}@x.no`,
  phone: "1",
  type: "supervisor",
  ...over,
});

// A student placed on an entity: the assignment stores the entity id as profile, entity and department id
const onProfile = (profileId: string, status?: string): UsageStudent => ({
  assignedPraksisPlace: { placeId: "place1", departmentId: profileId, entityId: profileId, profileId, status },
});

const ctx = () => ({ programId, emne: "Autumn cohort", emneId: emne1, year: 2026, semester: "Autumn", startDate: "2026-10-12" });
const remainingOf = (trees: ReturnType<typeof profileTreeForPlacement>, id: string) =>
  trees.flatMap((t) => t.nodes).find((n) => n.profile.id === id)?.remaining;

// ── Period ────────────────────────────────────────────────────────────────────
describe("period", () => {
  it("puts a date before the reset day in last year's period", () => {
    const period = { limitType: "yearly" as const, periodStart: "08/01" };
    expect(periodKeyFor(period, { year: 2026, semester: "Spring", startDate: "2026-03-01" })).toBe("Y:2025-08-01");
    expect(periodKeyFor(period, { year: 2026, semester: "Autumn", startDate: "2026-10-01" })).toBe("Y:2026-08-01");
  });
  it("keys a semester period by year and semester", () => {
    const period = { limitType: "semester" as const };
    expect(periodKeyFor(period, { year: 2026, semester: "Autumn" })).toBe("S:2026-HT");
    expect(periodKeyFor(period, { year: 2026, semester: "Spring" })).toBe("S:2026-VT");
  });
  it("cannot count in a yearly period without a reset day", () => {
    expect(periodKeyFor({ limitType: "yearly" }, { year: 2026, semester: "Autumn" })).toBeNull();
    expect(isPeriodComplete({ limitType: "yearly" })).toBe(false);
    expect(isPeriodComplete({ limitType: "yearly", periodStart: "01/01" })).toBe(true);
    expect(isPeriodComplete({ limitType: "semester" })).toBe(true);
  });
});

// ── Matching by id ──────────────────────────────────────────────────────────────
describe("emne identity", () => {
  it("matches a subset entity by emne id even when the stored name is out of date", () => {
    const subset = profile({ id: "p-subset", emneIds: [emne1] });
    const trees = profileTreeForPlacement([subset], [place], { ...ctx(), emne: "Old name of the emne" }, [], []);
    expect(remainingOf(trees, "p-subset")).toBe(4);
  });
  it("does not match a subset entity for another emne", () => {
    const subset = profile({ id: "p-subset", emneIds: [emne1] });
    expect(profileTreeForPlacement([subset], [place], { ...ctx(), emne: "Spring cohort", emneId: emne2 }, [], [])).toEqual([]);
  });
  it("prefers a stored emne id over the name", () => {
    expect(placementEmneId({ programId, subject: "Autumn cohort", emneId: emne2 })).toBe(emne2);
    expect(placementEmneId({ programId, subject: "Autumn cohort" })).toBe(emne1);
  });
});

// ── Counting by entity ──────────────────────────────────────────────────────────
describe("usage by entity", () => {
  it("counts students on the entity they are assigned to", () => {
    const a = profile({ id: "a" });
    const trees = profileTreeForPlacement([a], [place], ctx(), [onProfile("a"), onProfile("a")], []);
    expect(remainingOf(trees, "a")).toBe(2);
  });
  it("counts each entity on its own, even when two cover the same program and emne", () => {
    const a = profile({ id: "a", emneIds: [emne1] });
    const b = profile({ id: "b", emneIds: [emne1] });
    const trees = profileTreeForPlacement([a, b], [place], ctx(), [onProfile("a"), onProfile("a"), onProfile("b")], []);
    expect(remainingOf(trees, "a")).toBe(2);
    expect(remainingOf(trees, "b")).toBe(3);
  });
  it("lists the entities of the place as the places students can go to", () => {
    const a = profile({ id: "a", name: "Ward A" });
    const [tree] = profileTreeForPlacement([a, profile({ id: "elsewhere", praksisPlaceId: "other" })], [place], ctx(), [], []);
    expect(tree.units).toEqual([{ id: "a", name: "Ward A", remaining: 4, profileId: "a", profileName: "Ward A" }]);
  });
  it("finds the entity of an assignment by its profile id, or by the entity id when it has no profile id", () => {
    const a = profile({ id: "a" });
    expect(resolveAssignmentProfile([a], { placeId: "place1", profileId: "a" })?.id).toBe("a");
    expect(resolveAssignmentProfile([a], { placeId: "place1", unitId: "a" })?.id).toBe("a");
    expect(resolveAssignmentProfile([a], { placeId: "other", profileId: "a" })).toBeUndefined();
    expect(resolveAssignmentProfile([a], { placeId: "place1", unitId: "nope" })).toBeUndefined();
  });
  it("ignores cancelled assignments", () => {
    const a = profile({ id: "a" });
    const trees = profileTreeForPlacement([a], [place], ctx(), [onProfile("a", "cancelled"), onProfile("a", "planned")], []);
    expect(remainingOf(trees, "a")).toBe(3);
  });
  it("counts other placements in the same period only", () => {
    const a = profile({ id: "a" });
    const base = { placementId: "o1", programId, emne: "Autumn cohort", emneId: emne1, semester: "Autumn" };
    const same: OtherPlacementUsage = { ...base, year: 2026, startDate: "2026-11-02", students: [onProfile("a")] };
    const next: OtherPlacementUsage = { ...base, placementId: "o2", year: 2027, startDate: "2027-03-01", students: [onProfile("a")] };
    expect(remainingOf(profileTreeForPlacement([a], [place], ctx(), [], [same]), "a")).toBe(3);
    expect(remainingOf(profileTreeForPlacement([a], [place], ctx(), [], [next]), "a")).toBe(4);
  });
  it("reports students placed beyond the places as over", () => {
    const a = profile({ id: "a", places: 1 });
    const node = profileTreeForPlacement([a], [place], ctx(), [onProfile("a"), onProfile("a"), onProfile("a")], [])[0].nodes[0];
    expect(node.remaining).toBe(0);
    expect(node.over).toBe(2);
  });
});

// ── An assignment end to end ────────────────────────────────────────────────────
describe("assignment lifecycle", () => {
  it("books, fills an entity up, frees a place on cancel, and keeps counting after archive", () => {
    const a = profile({ id: "a", places: 2 });
    const planned: UsageStudent[] = [onProfile("a", "planned"), onProfile("a", "planned")];
    expect(remainingOf(profileTreeForPlacement([a], [place], ctx(), planned, []), "a")).toBe(0);

    // publishing books them: still two places in use
    const booked = planned.map((s) => ({ assignedPraksisPlace: { ...s.assignedPraksisPlace!, status: "booked" } }));
    expect(remainingOf(profileTreeForPlacement([a], [place], ctx(), booked, []), "a")).toBe(0);

    // cancelling one frees a place
    const oneCancelled = [booked[0], { assignedPraksisPlace: { ...booked[1].assignedPraksisPlace!, status: "cancelled" } }];
    expect(remainingOf(profileTreeForPlacement([a], [place], ctx(), oneCancelled, []), "a")).toBe(1);

    // an archived entity no longer takes new students, but its placed students still resolve to it
    const archived = { ...a, status: "archived" as const };
    expect(profileTreeForPlacement([archived], [place], ctx(), booked, [])).toEqual([]);
    const other: OtherPlacementUsage = { placementId: "x", programId, emne: "Autumn cohort", emneId: emne1, year: 2026, semester: "Autumn", startDate: "2026-10-12", students: booked };
    expect(placedOnProfile(archived, [archived], [other], { limitType: "yearly", periodStart: "01/01" }).total).toBe(2);
  });
});

// ── Rules ─────────────────────────────────────────────────────────────────────
describe("rules", () => {
  it("refuses places below the number placed in one period", () => {
    expect(placesError(2, 3)).toMatch(/can't go below 3/);
    expect(placesError(3, 3)).toBeUndefined();
  });
  it("finds the busiest period and keeps archived entities' students", () => {
    const a = profile({ id: "a", status: "archived" });
    const period = { limitType: "yearly" as const, periodStart: "01/01" };
    const mk = (id: string, year: number, n: number): OtherPlacementUsage => ({
      placementId: id,
      programId,
      emne: "Autumn cohort",
      emneId: emne1,
      year,
      semester: "Autumn",
      startDate: `${year}-10-01`,
      students: Array.from({ length: n }, () => onProfile("a")),
    });
    const result = placedOnProfile(a, [a], [mk("p1", 2026, 2), mk("p2", 2027, 3)], period);
    expect(result).toEqual({ total: 5, peak: 3 });
  });
  it("needs a name that no other active entity of the place has, but allows the same program and emne", () => {
    const a = profile({ id: "a", name: "Ward 3B", emneIds: [emne1] });
    const draft = { id: "new", praksisPlaceId: "place1", name: " ward 3b ", programs: [{ programId, emneIds: [emne1], places: 4 }] };
    expect(validateProfile(draft, [a])).toEqual(["An entity with this name already exists at this place"]);
    expect(validateProfile({ ...draft, name: "Ward 3C" }, [a])).toEqual([]); // same program and emne is fine
    expect(validateProfile({ ...draft, praksisPlaceId: "other" }, [a])).toEqual([]); // another place
    expect(validateProfile({ ...draft, name: "  " }, [a])).toContain("Give the entity a name");
    expect(validateProfile({ ...draft, name: "Ward 3B" }, [{ ...a, status: "archived" }])).toEqual([]);
  });
  it("refuses to restore an entity whose name has been taken since", () => {
    const active = profile({ id: "active", name: "Ward 3B" });
    const archived = profile({ id: "old", name: "ward 3b", status: "archived" });
    expect(activationErrors({ ...archived, status: "active" }, [active, archived])[0]).toMatch(/name already exists/);
    const other = profile({ id: "other", name: "Ward 9", status: "archived" });
    expect(activationErrors({ ...other, status: "active" }, [active, other])).toEqual([]);
  });
});

// ── Store: versions, copies and names ─────────────────────────────────────────
describe("entity store", () => {
  const versionOf = (id: string) => getProfiles().find((p) => p.id === id)?.version;

  it("rises in version when something a placement relies on changes, not when the name or status does", () => {
    const created = addProfile({ praksisPlaceId: "place1", name: "Original", ...one({ programId, places: 3 }) });
    expect(versionOf(created.id)).toBe(1);
    updateProfile(created.id, { name: "Renamed" });
    expect(versionOf(created.id)).toBe(1);
    updateProfile(created.id, one({ programId, places: 3 })); // same value: nothing changed
    expect(versionOf(created.id)).toBe(1);
    updateProfile(created.id, one({ programId, places: 5 }));
    expect(versionOf(created.id)).toBe(2);
    updateProfile(created.id, one({ programId, places: 5, emneIds: [emne1] }));
    expect(versionOf(created.id)).toBe(3);
    updateProfile(created.id, { contacts: [contact("c1")] });
    expect(versionOf(created.id)).toBe(4);
    setProfileStatus(created.id, "archived");
    expect(versionOf(created.id)).toBe(4);
  });
  it("copies an entity as 'Copy of X' with the same people on it, at version 1", () => {
    const created = addProfile({ praksisPlaceId: "place1", name: "Source", ...one({ programId, places: 2 }), contacts: [contact("c1")] });
    updateProfile(created.id, one({ programId, places: 9 }));
    const copy = duplicateProfile(created.id);
    expect(copy?.version).toBe(1);
    expect(copy?.name).toBe("Copy of Source");
    expect(copy?.contacts).toEqual([contact("c1")]);
    expect(copy?.contacts).not.toBe(created.contacts); // its own list
    expect(versionOf(created.id)).toBe(2);
    // a second copy gets a free name too
    expect(duplicateProfile(created.id)?.name).toBe("Copy of Source (2)");
    expect(duplicateProfile(created.id, "Ward 1")?.name).toBe("Ward 1");
  });
  it("makes names unique per place, ignoring case", () => {
    const all = [profile({ id: "a", name: "Ward A" }), profile({ id: "b", name: "ward a (2)" }), profile({ id: "c", name: "Ward Z", praksisPlaceId: "other" })];
    expect(uniqueEntityName(all, "place1", "Ward A")).toBe("Ward A (3)");
    expect(uniqueEntityName(all, "place1", "Ward Z")).toBe("Ward Z"); // taken at another place only
  });
});

// ── Saved data from before entities ────────────────────────────────────────────
describe("migration from profiles on units", () => {
  const old = (over: Record<string, unknown>) => ({
    id: "p1",
    praksisPlaceId: "place-oslo-university-hospital",
    unitId: "sengepost-intensiv-a",
    name: "Sengepost A – Nursing",
    status: "active",
    studyId,
    programId,
    emneIds: [emne1],
    places: 4,
    contacts: [],
    info: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 3,
    ...over,
  });

  it("drops the unit and keeps the rest", () => {
    const [m] = migrateProfilesV1([old({})]);
    expect("unitId" in m).toBe(false);
    expect(m).toMatchObject({ id: "p1", name: "Sengepost A – Nursing", places: 4, version: 3, emneIds: [emne1] });
  });
  it("copies the people the contacts pointed at into the entity, with their flags", () => {
    const [m] = migrateProfilesV1([
      old({
        contacts: [
          { id: "1", personType: "contact", personId: "contact-avd-akutt-1", associated: true, notifyOnPlacement: true, availableToStudents: false },
          { id: "2", personType: "supervisor", personId: "supervisor-does-not-exist", associated: true, notifyOnPlacement: true, availableToStudents: true },
          { id: "3", personType: "contact", personId: "contact-hf-oslo-1", associated: false, notifyOnPlacement: true, availableToStudents: true },
        ],
      }),
    ]);
    expect(m.contacts).toHaveLength(1); // not associated and unknown people are left out
    expect(m.contacts[0]).toMatchObject({ id: "ec-contact-contact-avd-akutt-1", notifyOnPlacement: true, availableToStudents: false });
    expect(m.contacts[0].name).toBeTruthy();
    expect(m.contacts[0].email).toContain("@");
  });
  it("makes names unique within a place and fills in a missing name", () => {
    const out = migrateProfilesV1([
      old({ id: "a", name: "Ward" }),
      old({ id: "b", name: "ward" }),
      old({ id: "c", name: " " }),
      old({ id: "d", name: "Ward", praksisPlaceId: "elsewhere" }),
    ]);
    expect(out.map((p) => p.name)).toEqual(["Ward", "ward (2)", "Entity", "Ward"]);
  });
  it("leaves entity contacts alone, so running it twice changes nothing", () => {
    const once = migrateProfilesV1([old({ contacts: [{ id: "1", personType: "contact", personId: "contact-avd-akutt-1", associated: true, notifyOnPlacement: true, availableToStudents: true }] })]);
    const twice = migrateProfilesV1(once);
    expect(twice).toEqual(once);
  });
});

// ── Mentors ───────────────────────────────────────────────────────────────────
describe("mentors", () => {
  const withContacts = (contacts: PlacementProfile["contacts"]) => profile({ id: "m", contacts });
  const lise = { personType: "contact" as const, personId: "c1" };

  it("is ok while the person is a contact of the entity", () => {
    expect(mentorState(lise, withContacts([contact("c1")]))).toBe("ok");
  });
  it("is flagged when the person is taken off the entity", () => {
    expect(mentorState(lise, withContacts([]))).toBe("removed");
    expect(mentorState(lise, withContacts([contact("c2")]))).toBe("removed");
  });
  it("has no state without a mentor, and is ok when there is no entity to compare with", () => {
    expect(mentorState(undefined, withContacts([]))).toBe("none");
    expect(mentorState(lise, undefined)).toBe("ok");
  });
  it("counts placed students without a mentor, ignoring cancelled ones", () => {
    const mk = (status: string, mentor?: object): UsageStudent => ({ assignedPraksisPlace: { placeId: "p", departmentId: "u", status, mentor: mentor as any } });
    const list: UsageStudent[] = [mk("booked"), mk("booked", lise as any), mk("cancelled"), {}];
    expect(studentsNeedingMentor(list)).toHaveLength(1);
  });
  it("lists who is told, only from contacts flagged to be notified", () => {
    const a = withContacts([contact("c1"), contact("c2", { notifyOnPlacement: false })]);
    expect(peopleToNotify([a], [person("c1"), person("c2")]).map((n) => n.personId)).toEqual(["c1"]);
    expect(peopleToNotify([a], [person("c1", { type: "contact" })])[0]).toMatchObject({ personType: "contact", name: "c1" });
  });
});

// ── What students are told ───────────────────────────────────────────────────────
describe("student view and snapshot", () => {
  const people = [person("ann"), person("hidden"), person("bob", { name: "Bob", role: "Mentor" })];
  const viewOf = (p: PlacementProfile, a: Parameters<typeof buildStudentView>[1], list = people) => buildStudentView(p, a, list);
  const base = (): PlacementProfile =>
    profile({
      id: "v",
      name: "Ward A",
      version: 3,
      contacts: [contact("ann"), contact("hidden", { availableToStudents: false }), contact("bob")],
      info: { ...({} as PlacementProfile["info"]), contactBeforePlacement: "Call ward", contactPhone: "", activityDescription: "Day shifts", workOrganisation: "", workClothes: "", housing: { available: false, text: "" }, publicTransport: { available: false, text: "" }, changingRoom: { available: false, text: "" } },
    });
  const assignment = { placeName: "Hospital", departmentName: "Ward A", startDate: "2026-10-12T00:00:00.000Z", endDate: "2026-12-18", mentor: { personType: "contact", personId: "bob", name: "Bob" } };

  it("shows the contacts shown to students, the mentor and the dates, under the entity name", () => {
    const v = viewOf(base(), assignment);
    expect(v.profileName).toBe("Ward A");
    expect(v.contacts.map((c) => c.name)).toEqual(["ann", "Bob"]);
    expect(v.mentor).toMatchObject({ name: "Bob", detail: "Mentor" });
    expect(v.startDate).toBe("2026-10-12");
    expect(v.endDate).toBe("2026-12-18");
  });
  it("keeps the mentor's name when the person is no longer a contact", () => {
    const p = base();
    p.contacts = p.contacts.filter((c) => c.contactId !== "bob");
    expect(viewOf(p, assignment).mentor?.name).toBe("Bob");
  });
  it("records the entity version, and a later edit can't change the stored snapshot", () => {
    const p = base();
    const snap = takeSnapshot(p, viewOf(p, assignment));
    expect(snap.version).toBe(3);
    p.info.activityDescription = "Night shifts";
    expect(snap.view.info.activityDescription).toBe("Day shifts");
  });
  it("sees a change in the information text even though the version did not move", () => {
    const p = base();
    const snap = takeSnapshot(p, viewOf(p, assignment));
    expect(viewChangedSince(snap, viewOf(p, assignment))).toBe(false);
    p.info.activityDescription = "Night shifts";
    expect(viewChangedSince(snap, viewOf(p, assignment))).toBe(true);
  });
  it("sees a change of mentor or of the contacts shown to students", () => {
    const p = base();
    const snap = takeSnapshot(p, viewOf(p, assignment));
    expect(viewChangedSince(snap, viewOf(p, { ...assignment, mentor: { personType: "contact", personId: "cy", name: "Cy" } }))).toBe(true);
    p.contacts[1].availableToStudents = true;
    expect(viewChangedSince(snap, viewOf(p, assignment))).toBe(true);
  });
  it("has nothing to compare without a snapshot", () => {
    expect(viewChangedSince(undefined, viewOf(base(), assignment))).toBe(false);
  });
  it("lists the information a student would find empty", () => {
    expect(missingInfo(base().info)).toEqual(["contact phone number", "work organisation", "work clothes"]);
  });
});

// ── People of a place, added to several entities ──────────────────────────────
describe("contacts of a place", () => {
  const entity = (name: string, placeId = "place1") => addProfile({ praksisPlaceId: placeId, name, ...one({ programId, places: 2 }) });
  const profileOf = (id: string) => getProfiles().find((p) => p.id === id)!;

  it("needs a name and, when given, a valid email", () => {
    expect(validateContact({ name: "", email: "" })).toEqual(["Enter a name"]);
    expect(validateContact({ name: "Kari", email: "kari@" })).toEqual(["Enter a valid email address"]);
    expect(validateContact({ name: "Kari", email: "" })).toEqual([]);
    expect(validateContact({ name: "Kari", email: "kari@ous.no" })).toEqual([]);
    expect(validateContact({ name: "Kari", email: "", about: Array(150).fill("ord").join(" ") })).toEqual([]);
    expect(validateContact({ name: "Kari", email: "", about: Array(151).fill("ord").join(" ") })).toEqual(["About me can have at most 150 words"]);
  });
  it("is made once on the place and added to several entities, with flags per entity", () => {
    const kari = addPlaceContact({ praksisPlaceId: "place1", name: " Kari ", role: "Supervisor", email: "kari@ous.no", phone: "", type: "supervisor" });
    expect(kari.name).toBe("Kari"); // trimmed
    const a = entity("Ward A");
    const b = entity("Ward B");
    linkContact(a.id, kari.id);
    linkContact(b.id, kari.id, { notifyOnPlacement: false });
    linkContact(b.id, kari.id); // already there: nothing changes
    expect(profileOf(a.id).contacts).toEqual([contact(kari.id)]);
    expect(profileOf(b.id).contacts).toEqual([contact(kari.id, { notifyOnPlacement: false })]);
    expect(entitiesOfContact(getProfiles(), kari.id).map((p) => p.name)).toEqual(["Ward A", "Ward B"]);
    const resolved = resolveContacts(profileOf(b.id), getPlaceContacts());
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ name: "Kari", type: "supervisor", notifyOnPlacement: false });
  });
  it("raises the entity's version when a person is added or taken off", () => {
    const kari = addPlaceContact({ praksisPlaceId: "place1", name: "Ola", role: "", email: "", phone: "", type: "contact" });
    const a = entity("Ward V");
    linkContact(a.id, kari.id);
    expect(profileOf(a.id).version).toBe(2);
    unlinkContact(a.id, kari.id);
    expect(profileOf(a.id).version).toBe(3);
    unlinkContact(a.id, kari.id); // not on it: nothing changes
    expect(profileOf(a.id).version).toBe(3);
  });
  it("sets the entities of a person at once, only within their place", () => {
    const sam = addPlaceContact({ praksisPlaceId: "place1", name: "Sam", role: "", email: "", phone: "", type: "contact" });
    const a = entity("Ward S1");
    const b = entity("Ward S2");
    const elsewhere = entity("Ward S3", "other");
    setContactEntities(sam.id, "place1", [a.id, elsewhere.id]);
    expect(entitiesOfContact(getProfiles(), sam.id).map((p) => p.name)).toEqual(["Ward S1"]); // the other place is left alone
    setContactEntities(sam.id, "place1", [b.id]);
    expect(entitiesOfContact(getProfiles(), sam.id).map((p) => p.name)).toEqual(["Ward S2"]);
  });
  it("leaves out people who are no longer on the place, and deleting one takes them off every entity", () => {
    const kim = addPlaceContact({ praksisPlaceId: "place1", name: "Kim", role: "", email: "", phone: "", type: "supervisor" });
    const a = entity("Ward D1");
    const b = entity("Ward D2");
    linkContact(a.id, kim.id);
    linkContact(b.id, kim.id);
    deleteContact(kim.id);
    expect(getPlaceContacts().some((c) => c.id === kim.id)).toBe(false);
    expect(profileOf(a.id).contacts).toEqual([]);
    expect(profileOf(b.id).contacts).toEqual([]);
    expect(resolveContacts({ contacts: [contact("gone")] }, getPlaceContacts())).toEqual([]);
  });
});

// ── Entities that held a copy of each person ───────────────────────────────────
describe("migration to shared contacts", () => {
  const embedded = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    name: id,
    role: "Contact",
    email: `${id}@x.no`,
    phone: "1",
    notifyOnPlacement: true,
    availableToStudents: true,
    ...over,
  });
  const old = (id: string, contacts: unknown[], placeId = "place1") => ({ id, praksisPlaceId: placeId, name: id, contacts, version: 4 });

  it("turns copies of the same person on one place into one contact, linked from each entity", () => {
    const { profiles, contacts } = migrateProfilesV2([
      old("a", [embedded("ec-1", { name: "Kari", email: "KARI@x.no" })]),
      old("b", [embedded("ec-2", { name: "Kari N.", email: "kari@x.no", availableToStudents: false })]),
    ]);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({ id: "ec-1", praksisPlaceId: "place1", name: "Kari" });
    expect(profiles[0].contacts).toEqual([{ contactId: "ec-1", notifyOnPlacement: true, availableToStudents: true }]);
    expect(profiles[1].contacts).toEqual([{ contactId: "ec-1", notifyOnPlacement: true, availableToStudents: false }]); // flags stay per entity
    expect(profiles[0].version).toBe(4);
  });
  it("keeps the same person on two places apart, and matches by name when there is no email", () => {
    const { contacts } = migrateProfilesV2([
      old("a", [embedded("ec-1", { email: "same@x.no" })], "place1"),
      old("b", [embedded("ec-2", { email: "same@x.no" })], "place2"),
      old("c", [embedded("ec-3", { name: "No Mail", email: "" })], "place1"),
      old("d", [embedded("ec-4", { name: "no mail", email: "" })], "place1"),
    ]);
    expect(contacts.map((c) => c.praksisPlaceId)).toEqual(["place1", "place2", "place1"]);
  });
  it("makes a supervisor of whoever was one, and an entity contact of the rest", () => {
    const { contacts } = migrateProfilesV2([
      old("a", [embedded("ec-supervisor-s1", { role: "Supervisor" }), embedded("ec-contact-c1", { role: "Klinikk" }), embedded("ec-x", { role: "Practice mentor" })]),
    ]);
    expect(contacts.map((c) => c.type)).toEqual(["supervisor", "contact", "supervisor"]);
  });
  it("leaves entities that already link to people alone, so running it twice changes nothing", () => {
    const once = migrateProfilesV2([old("a", [embedded("ec-1")])]);
    const twice = migrateProfilesV2(once.profiles);
    expect(twice.profiles).toEqual(once.profiles);
    expect(twice.contacts).toEqual([]);
  });
});

describe("entity type", () => {
  it("is one of klinikk, avdeling, seksjon, sengepost and gruppe, with a label", () => {
    expect(ENTITY_TYPES.map((t) => t.id)).toEqual(["klinikk", "avdeling", "seksjon", "sengepost", "gruppe"]);
    expect(entityTypeLabel("sengepost")).toBe("Sengepost");
    expect(entityTypeLabel(undefined)).toBeUndefined(); // entities from before types have none
  });
  it("is kept when an entity is copied and doesn't raise the version when changed", () => {
    const created = addProfile({ praksisPlaceId: "place1", name: "Typed ward", entityType: "avdeling", ...one({ programId, places: 1 }) });
    expect(duplicateProfile(created.id)?.entityType).toBe("avdeling");
    updateProfile(created.id, { entityType: "seksjon" });
    const after = getProfiles().find((p) => p.id === created.id)!;
    expect(after.entityType).toBe("seksjon");
    expect(after.version).toBe(1);
  });
});

// ── An entity that is made with only a type and a name ─────────────────────────
describe("incomplete entities", () => {
  const blank = (over: Partial<Over> = {}) => profile({ id: "blank", programId: "", emneIds: [], places: 0, info: emptyInfo(), ...over });
  const emptyInfo = () =>
    ({
      contactBeforePlacement: "",
      contactPhone: "",
      activityDescription: "",
      workOrganisation: "",
      workClothes: "",
      housing: { available: false, text: "" },
      publicTransport: { available: false, text: "" },
      changingRoom: { available: false, text: "" },
    }) as PlacementProfile["info"];

  it("is created with a type and a name and nothing else", () => {
    const e = createEntity("place1", "  Ny avdeling ", "avdeling");
    expect(e).toMatchObject({ name: "Ny avdeling", entityType: "avdeling", programs: [], contacts: [], version: 1, status: "active" });
    expect(profileAudienceLabel(e)).toBe("No program yet");
  });
  it("needs only a name that no other active entity of the place has", () => {
    const others = [profile({ id: "a", name: "Ward 3B" }), profile({ id: "b", name: "Old", status: "archived" })];
    expect(validateName("", "place1", others)).toEqual(["Give the entity a name"]);
    expect(validateName(" ward 3b ", "place1", others)).toEqual(["An entity with this name already exists at this place"]);
    expect(validateName("Ward 3B", "place1", others, "a")).toEqual([]); // its own name
    expect(validateName("Old", "place1", others)).toEqual([]); // archived names are free
    expect(validateName("Ward 3B", "place2", others)).toEqual([]);
  });
  it("lists everything that is missing, and drops items as they are filled in", () => {
    const keys = (e: PlacementProfile, people: PlaceContact[] = []) => entityMissing(e, people).map((m) => m.key);
    expect(keys(blank())).toEqual(["program", "contacts", "info"]); // no program: emner and places can't be judged yet
    expect(keys(blank({ programId, studyId }))).toEqual(["emner", "contacts", "info"]);
    // 0 places is a valid number: places are never listed as missing
    expect(keys(blank({ programId, studyId, emneIds: [emne1] }))).toEqual(["contacts", "info"]);
    expect(keys(blank({ programId, studyId, emneIds: [emne1], places: 3 }))).toEqual(["contacts", "info"]);
    const withPerson = blank({ programId, studyId, emneIds: [emne1], places: 3, contacts: [contact("p1")] });
    expect(keys(withPerson, [person("p1")])).toEqual(["info"]);
    expect(keys(withPerson, [])).toEqual(["contacts", "info"]); // a link to a removed person doesn't count
    const full = { ...withPerson, info: { ...emptyInfo(), contactBeforePlacement: "x", contactPhone: "1", activityDescription: "x", workOrganisation: "x", workClothes: "x" } };
    expect(keys(full, [person("p1")])).toEqual([]);
  });
  it("can take students only with a program and its emner; places and contacts don't stop it", () => {
    expect(isPlaceable(blank())).toBe(false);
    expect(isPlaceable(blank({ programId, studyId }))).toBe(false);
    expect(isPlaceable(blank({ programId, studyId, emneIds: [emne1] }))).toBe(true);
    expect(profileMatches(blank(), { programId, emneId: emne1 })).toBe(false);
    expect(profileMatches(blank({ programId, emneIds: [] }), { programId, emneId: emne1 })).toBe(false); // none picked: takes nobody
    expect(profileMatches(blank({ programId, emneIds: [emne1] }), { programId, emneId: emne1 })).toBe(true);
    expect(profileMatches(blank({ programId, emneIds: [emne1] }), { programId, emneId: emne2 })).toBe(false);
  });
  it("is left out of a placement until it has a program and emner", () => {
    const ctxFor = { programId, emne: "Autumn cohort", emneId: emne1, year: 2026, semester: "Autumn", startDate: "2026-10-12" };
    expect(profileTreeForPlacement([blank()], [place], ctxFor, [], [])).toEqual([]);
    expect(profileTreeForPlacement([blank({ programId, studyId })], [place], ctxFor, [], [])).toEqual([]);
    const ready = blank({ programId, studyId, emneIds: [emne1] });
    expect(profileTreeForPlacement([ready], [place], ctxFor, [], [])[0].nodes).toHaveLength(1);
  });
  it("changing the program in one update bumps the version once; text-only and identical updates don't", () => {
    const e = createEntity("place1", "Version test", "gruppe");
    const v = () => getProfiles().find((p) => p.id === e.id)!.version;
    updateProfile(e.id, one({ programId }));
    expect(v()).toBe(2);
    updateProfile(e.id, one({ programId })); // same values
    expect(v()).toBe(2);
    updateProfile(e.id, { info: { ...e.info, activityDescription: "Day shifts" } });
    expect(v()).toBe(2);
    updateProfile(e.id, one({ programId, emneIds: [emne1] }));
    expect(v()).toBe(3);
  });
  it("writes out every emne for entities that left them empty to mean 'all'", () => {
    const old = [flat({ id: "old", emneIds: [] }), flat({ id: "explicit", emneIds: [emne2] }), flat({ id: "noprogram", programId: "", emneIds: [] })];
    const out = migrateProfilesV3(old);
    expect(out[0].emneIds).toEqual([emne1, emne2]);
    expect(out[1].emneIds).toEqual([emne2]);
    expect(out[2].emneIds).toEqual([]);
  });
});

describe("emner merged when the starting data moved to 2026", () => {
  it("makes entities follow the id that was kept, without listing an emne twice", () => {
    emneIdRemap.clear();
    emneIdRemap.set("gone", "kept");
    const out = migrateProfilesV5([flat({ id: "p", emneIds: ["kept", "gone", "other"] }), flat({ id: "q", emneIds: ["other"] })]);
    expect(out[0].emneIds).toEqual(["kept", "other"]);
    expect(out[1].emneIds).toEqual(["other"]);
    emneIdRemap.clear();
  });
});

// ── An entity that accepts several programs ─────────────────────────────────────
describe("entities with several programs", () => {
  let program2 = "";
  let p2emne = "";
  beforeAll(() => {
    addProgram(studyId, "Logopedics");
    const study = getStudies().find((s) => s.id === studyId)!;
    program2 = study.programs.find((p) => p.name === "Logopedics")!.id;
    addEmne(studyId, program2, "Autumn cohort");
    p2emne = getStudies().find((s) => s.id === studyId)!.programs.find((p) => p.id === program2)!.emner![0].id;
  });
  // takes Nursing (3 places) and Logopedics (5 places)
  const two = (over: Partial<Over> = {}) =>
    profile({ id: "two", programs: [{ programId, emneIds: [emne1], places: 3 }, { programId: program2, emneIds: [p2emne], places: 5 }], ...over });
  const ctx2 = () => ({ programId: program2, emne: "Autumn cohort", emneId: p2emne, year: 2026, semester: "Autumn", startDate: "2026-10-12" });

  it("offers the places of the program of the placement, and the total over its programs", () => {
    const e = two();
    expect(placesFor(e, programId)).toBe(3);
    expect(placesFor(e, program2)).toBe(5);
    expect(placesFor(e, "other")).toBe(0);
    expect(totalPlaces(e)).toBe(8);
    expect(profileTreeForPlacement([e], [place], ctx(), [], [])[0].nodes[0]).toMatchObject({ places: 3, remaining: 3, otherPrograms: [program2] });
    expect(profileTreeForPlacement([e], [place], ctx2(), [], [])[0].nodes[0]).toMatchObject({ places: 5, remaining: 5, otherPrograms: [programId] });
  });
  it("matches each program on its own emner", () => {
    const e = two();
    expect(profileMatches(e, { programId, emneId: emne1 })).toBe(true);
    expect(profileMatches(e, { programId, emneId: emne2 })).toBe(false); // an emne of the first program it does not take
    expect(profileMatches(e, { programId: program2, emneId: p2emne })).toBe(true);
    expect(profileMatches(e, { programId: "other", emneId: emne1 })).toBe(false);
  });
  it("counts only students of the same program against a program's places", () => {
    const e = two();
    // Another placement (the Logopedics one, same period) has two students on the entity
    const logopedics: OtherPlacementUsage = {
      placementId: "o1", year: 2026, startDate: "2026-10-12", programId: program2, emne: "Autumn cohort", emneId: p2emne,
      students: [onProfile("two"), onProfile("two")],
    };
    expect(profileTreeForPlacement([e], [place], ctx(), [], [logopedics])[0].nodes[0]).toMatchObject({ remaining: 3, usedElsewhere: 0 });
    expect(profileTreeForPlacement([e], [place], ctx2(), [], [logopedics])[0].nodes[0]).toMatchObject({ remaining: 3, usedElsewhere: 2 });
    // and in the other direction: this placement's Nursing students leave Logopedics' places alone
    const nursing: OtherPlacementUsage = { ...logopedics, placementId: "o2", programId, emne: "Autumn cohort", emneId: emne1, students: [onProfile("two")] };
    expect(profileTreeForPlacement([e], [place], ctx2(), [], [nursing])[0].nodes[0]).toMatchObject({ remaining: 5, usedElsewhere: 0 });
    expect(profileTreeForPlacement([e], [place], ctx(), [], [nursing])[0].nodes[0]).toMatchObject({ remaining: 2, usedElsewhere: 1 });
  });
  it("shows students placed beyond one program's places as over, without touching the other", () => {
    const e = two();
    const node = profileTreeForPlacement([e], [place], ctx(), [onProfile("two"), onProfile("two"), onProfile("two"), onProfile("two")], [])[0].nodes[0];
    expect(node).toMatchObject({ places: 3, remaining: 0, over: 1 });
  });
  it("counts the students placed per program, and which emner they use", () => {
    const e = two();
    const nursing: OtherPlacementUsage = { placementId: "n", year: 2026, startDate: "2026-10-12", programId, emne: "Autumn cohort", emneId: emne1, students: [onProfile("two"), onProfile("two")] };
    const logo: OtherPlacementUsage = { placementId: "l", year: 2026, startDate: "2026-10-12", programId: program2, emne: "Autumn cohort", emneId: p2emne, students: [onProfile("two")] };
    expect(placedOnProfile(e, [e], [nursing, logo])).toEqual({ total: 3, peak: 3 });
    expect(placedOnProfile(e, [e], [nursing, logo], undefined, programId)).toEqual({ total: 2, peak: 2 });
    expect(placedOnProfile(e, [e], [nursing, logo], undefined, program2)).toEqual({ total: 1, peak: 1 });
    expect(lockedEmneIds(e, [e], [nursing, logo], programId)).toEqual([emne1]);
    expect(lockedEmneIds(e, [e], [nursing, logo], program2)).toEqual([p2emne]);
    expect(lockedEmneIds(e, [e], [nursing], program2)).toEqual([]);
  });
  it("says which program lacks what, and is placeable only when every program has its emner", () => {
    const e = two({ programs: [{ programId, emneIds: [emne1], places: 3 }, { programId: program2, emneIds: [], places: 0 }], info: emptyPlacementInfo() });
    expect(entityMissing(e, []).map((m) => [m.key, m.programId ?? ""])).toEqual([["emner", program2], ["contacts", ""], ["info", ""]]);
    expect(entityMissing(e, [])[0].label).toMatch(/^Emner for Logopedics/);
    expect(isPlaceable(e)).toBe(false);
    expect(isPlaceable(two())).toBe(true);
  });
  it("is checked per program: each only once, its own emner, no duplicates", () => {
    const base = { id: "x", name: "N" };
    expect(validateProfile({ ...base, programs: two().programs })).toEqual([]);
    expect(validateProfile({ ...base, programs: [two().programs[0], two().programs[0]] })).toContain("Each program can only be added once");
    expect(validateProfile({ ...base, programs: [{ programId, emneIds: [p2emne], places: 1 }] })).toContain("Some emner don't belong to the program");
    expect(validateProfile({ ...base, programs: [{ programId, emneIds: [emne1, emne1], places: 1 }] })).toContain("An emne can only be picked once");
    expect(validateProfile({ ...base, programs: [{ programId, emneIds: [emne1], places: -1 }] })).toContain("Places must be a whole number, 0 or more");
  });
  it("lists every program in its audience label", () => {
    expect(profileAudienceLabel(two())).toBe("Nursing · Autumn cohort | Logopedics · Autumn cohort");
  });
  it("is copied with its own list of programs, and a change to one program raises the version", () => {
    const created = addProfile({ praksisPlaceId: "place1", name: "Multi", programs: two().programs });
    const copy = duplicateProfile(created.id)!;
    expect(copy.programs).toEqual(created.programs);
    expect(copy.programs[0]).not.toBe(created.programs[0]);
    expect(copy.programs[0].emneIds).not.toBe(created.programs[0].emneIds);
    updateProfile(created.id, { programs: [created.programs[0], { ...created.programs[1], places: 6 }] });
    expect(getProfiles().find((p) => p.id === created.id)!.version).toBe(2);
  });
  it("moves a saved single-program entity to one entry, and leaves a new one alone", () => {
    const old = flat({ id: "old", emneIds: [emne2], places: 7 });
    const [out] = migrateProfilesV6([old]);
    expect(out.programs).toEqual([{ programId, emneIds: [emne2], places: 7 }]);
    expect(out).not.toHaveProperty("programId");
    expect(out).not.toHaveProperty("studyId");
    expect(out).not.toHaveProperty("emneIds");
    expect(out).not.toHaveProperty("places");
    expect(out.version).toBe(old.version);
    expect(migrateProfilesV6([out])[0]).toBe(out); // already in the new shape
    expect(migrateProfilesV6([flat({ id: "none", programId: "", emneIds: [] })])[0].programs).toEqual([]);
  });
});

// ── Entities and slots of a placement ─────────────────────────────────────────
describe("slots of a placement", () => {
  const a = () => profile({ id: "a", places: 4 });
  const b = () => profile({ id: "b", places: 2 });
  const other = (...ids: string[]): OtherPlacementUsage => ({
    placementId: "o1", programId, emne: "Autumn cohort", emneId: emne1, semester: "Autumn", year: 2026, startDate: "2026-11-02", students: ids.map((i) => onProfile(i)),
  });
  const candidates = (students: UsageStudent[] = [], others: OtherPlacementUsage[] = []) =>
    slotCandidates(profileTreeForPlacement([a(), b()], [place], ctx(), students, others));
  const cand = (id: string, students: UsageStudent[] = [], others: OtherPlacementUsage[] = []) => candidates(students, others).find((c) => c.node.profile.id === id)!;

  it("lists every fitting entity as a candidate, with the places other placements left free", () => {
    expect(candidates().map((c) => [c.node.profile.id, c.places, c.free])).toEqual([["a", 4, 4], ["b", 2, 2]]);
    const c = cand("a", [], [other("a", "a", "a")]);
    expect([c.places, c.usedElsewhere, c.free]).toEqual([4, 3, 1]);
    expect(cand("b", [], [other("b", "b", "b")]).free).toBe(0); // never below 0
  });
  it("offers only the chosen entities, with the slots as their places", () => {
    const trees = profileTreeForPlacement([a(), b()], [place], ctx(), [], [], [{ profileId: "b", slots: 5 }]);
    const nodes = trees.flatMap((t) => t.nodes);
    expect(nodes.map((n) => n.profile.id)).toEqual(["b"]);
    expect(nodes[0]).toMatchObject({ places: 5, programPlaces: 2, fromSlots: true, remaining: 5, over: 0 });
    expect(totalPlacesForPlacement(trees)).toBe(5);
    expect(nodeCapacity(nodes[0])).toBe(5);
  });
  it("measures the places left against the slots, not the entity's places", () => {
    const slots = [{ profileId: "a", slots: 2 }];
    const trees = profileTreeForPlacement([a()], [place], ctx(), [onProfile("a")], [other("a", "a", "a")], slots);
    // other placements' students were counted when the slots were set, so they are not subtracted again
    expect(trees[0].nodes[0]).toMatchObject({ places: 2, used: 1, usedElsewhere: 3, remaining: 1, over: 0 });
  });
  it("shows students beyond the slots as over, and never blocks", () => {
    const slots = [{ profileId: "a", slots: 1 }];
    const node = profileTreeForPlacement([a()], [place], ctx(), [onProfile("a"), onProfile("a"), onProfile("a")], [], slots)[0].nodes[0];
    expect([node.remaining, node.over]).toEqual([0, 2]);
  });
  it("keeps an entity that is not chosen visible while students of the placement are on it", () => {
    const trees = profileTreeForPlacement([a(), b()], [place], ctx(), [onProfile("b")], [], [{ profileId: "a", slots: 3 }]);
    expect(trees.flatMap((t) => t.nodes).map((n) => [n.profile.id, n.places, n.over])).toEqual([["a", 3, 0], ["b", 0, 1]]);
  });
  it("without slots behaves as before: every fitting entity, places minus other placements", () => {
    const trees = profileTreeForPlacement([a(), b()], [place], ctx(), [onProfile("a")], [other("a")]);
    const nodes = trees.flatMap((t) => t.nodes);
    expect(nodes.map((n) => [n.profile.id, n.places, n.fromSlots, n.remaining])).toEqual([["a", 4, false, 2], ["b", 2, false, 2]]);
    expect(totalPlacesForPlacement(trees)).toBe(3 + 2);
  });
  it("adds an entity with its free places (at least 1), once", () => {
    const c = cand("a", [], [other("a", "a")]);
    expect(defaultSlots(c)).toBe(2);
    expect(defaultSlots(cand("b", [], [other("b", "b")]))).toBe(1); // full: still 1
    const once = addSlot([], c);
    expect(once).toEqual([{ profileId: "a", slots: 2 }]);
    expect(addSlot(once, c)).toBe(once);
  });
  it("changes slots but not below the students already placed, and removes only an entity with none", () => {
    const c = cand("a", [onProfile("a"), onProfile("a")]);
    expect([minSlots(c), canRemove(c)]).toEqual([2, false]);
    const list = [{ profileId: "a", slots: 3 }];
    expect(setSlot(list, c, 1)[0].slots).toBe(2);
    expect(setSlot(list, c, 7.9)[0].slots).toBe(7);
    expect(canRemove(cand("a"))).toBe(true);
    expect(removeSlot(list, "a")).toEqual([]);
  });
  it("warns when slots exceed the free places, and counts the students no slot covers", () => {
    const c = cand("a", [], [other("a", "a", "a")]); // 1 free
    expect([slotsOver(c, 1), slotsOver(c, 4)]).toEqual([0, 3]);
    expect([totalSlots([{ profileId: "a", slots: 2 }, { profileId: "b", slots: 3 }]), studentsWithoutSlot(10, [{ profileId: "a", slots: 4 }]), studentsWithoutSlot(2, [{ profileId: "a", slots: 4 }])]).toEqual([5, 6, 0]);
  });
  it("reads typed slots as a whole number of at least the minimum", () => {
    expect([parseSlots("5"), parseSlots("0"), parseSlots(""), parseSlots("abc"), parseSlots("2.7"), parseSlots("1", 3)]).toEqual([5, 1, 1, 1, 2, 3]);
  });
  it("is complete with each entity once and whole slots of 1 or more (no entity at all is allowed too)", () => {
    expect(validateSlots([])).toBeNull(); // no entity yet is fine: they can be added after the students are shown
    expect(validateSlots([{ profileId: "a", slots: 1 }, { profileId: "a", slots: 2 }])).toMatch(/only be chosen once/);
    expect(validateSlots([{ profileId: "a", slots: 0 }])).toMatch(/whole number/);
    expect(validateSlots([{ profileId: "a", slots: 1.5 }])).toMatch(/whole number/);
    expect(validateSlots([{ profileId: "a", slots: 3 }])).toBeNull();
  });
  it("turns a placement without slots into slots: every fitting entity with the places it had left", () => {
    const trees = profileTreeForPlacement([a(), b()], [place], ctx(), [onProfile("a")], [other("a")]);
    expect(slotsFromTrees(trees)).toEqual([{ profileId: "a", slots: 3 }, { profileId: "b", slots: 2 }]);
  });
});
