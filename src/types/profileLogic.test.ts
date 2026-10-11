import { beforeAll, describe, expect, it } from "vitest";
import { PraksisPlace } from "./praksisPlace";
import { isPeriodComplete, periodKeyFor } from "./placePeriod";
import { addEmne, addProgram, addStudy, getStudies } from "./studyCatalog";
import {
  ENTITY_TYPES,
  EntityContactLink,
  PlacementProfile,
  addProfile,
  createEntity,
  deleteContact,
  duplicateProfile,
  entitiesOfContact,
  entityMissing,
  entityTypeLabel,
  isPlaceable,
  migrateProfilesV3,
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
import { activationErrors, mentorState, peopleToNotify, placedOnProfile, placesError, studentsNeedingMentor } from "./profileRules";
import { OtherPlacementUsage, UsageStudent, profileTreeForPlacement } from "./profileUsage";
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

const profile = (over: Partial<PlacementProfile> & { id: string }): PlacementProfile => ({
  praksisPlaceId: "place1",
  name: over.id,
  status: "active",
  studyId,
  programId,
  emneIds: [emne1, emne2], // the emner it accepts; none picked would mean it takes nobody
  places: 4,
  contacts: [],
  info: {} as PlacementProfile["info"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
  ...over,
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
    const draft = { id: "new", praksisPlaceId: "place1", name: " ward 3b ", programId, emneIds: [emne1], places: 4 };
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
    const created = addProfile({ praksisPlaceId: "place1", name: "Original", studyId, programId, places: 3 });
    expect(versionOf(created.id)).toBe(1);
    updateProfile(created.id, { name: "Renamed" });
    expect(versionOf(created.id)).toBe(1);
    updateProfile(created.id, { places: 3 }); // same value: nothing changed
    expect(versionOf(created.id)).toBe(1);
    updateProfile(created.id, { places: 5 });
    expect(versionOf(created.id)).toBe(2);
    updateProfile(created.id, { emneIds: [emne1] });
    expect(versionOf(created.id)).toBe(3);
    updateProfile(created.id, { contacts: [contact("c1")] });
    expect(versionOf(created.id)).toBe(4);
    setProfileStatus(created.id, "archived");
    expect(versionOf(created.id)).toBe(4);
  });
  it("copies an entity as 'Copy of X' with the same people on it, at version 1", () => {
    const created = addProfile({ praksisPlaceId: "place1", name: "Source", studyId, programId, places: 2, contacts: [contact("c1")] });
    updateProfile(created.id, { places: 9 });
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
  const entity = (name: string, placeId = "place1") => addProfile({ praksisPlaceId: placeId, name, studyId, programId, places: 2 });
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
    const created = addProfile({ praksisPlaceId: "place1", name: "Typed ward", entityType: "avdeling", studyId, programId, places: 1 });
    expect(duplicateProfile(created.id)?.entityType).toBe("avdeling");
    updateProfile(created.id, { entityType: "seksjon" });
    const after = getProfiles().find((p) => p.id === created.id)!;
    expect(after.entityType).toBe("seksjon");
    expect(after.version).toBe(1);
  });
});

// ── An entity that is made with only a type and a name ─────────────────────────
describe("incomplete entities", () => {
  const blank = (over: Partial<PlacementProfile> = {}) => ({ ...profile({ id: "blank", programId: "", studyId: "", emneIds: [], places: 0, info: emptyInfo() }), ...over });
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
    expect(e).toMatchObject({ name: "Ny avdeling", entityType: "avdeling", programId: "", studyId: "", emneIds: [], places: 0, contacts: [], version: 1, status: "active" });
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
    expect(keys(blank())).toEqual(["program", "places", "contacts", "info"]); // no program: emner can't be judged yet
    expect(keys(blank({ programId, studyId }))).toEqual(["emner", "places", "contacts", "info"]);
    expect(keys(blank({ programId, studyId, emneIds: [emne1] }))).toEqual(["places", "contacts", "info"]);
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
    updateProfile(e.id, { studyId, programId, emneIds: [] });
    expect(v()).toBe(2);
    updateProfile(e.id, { programId, emneIds: [] }); // same values
    expect(v()).toBe(2);
    updateProfile(e.id, { info: { ...e.info, activityDescription: "Day shifts" } });
    expect(v()).toBe(2);
    updateProfile(e.id, { emneIds: [emne1] });
    expect(v()).toBe(3);
  });
  it("writes out every emne for entities that left them empty to mean 'all'", () => {
    const old = [profile({ id: "old", emneIds: [] }), profile({ id: "explicit", emneIds: [emne2] }), blank({ id: "noprogram" })];
    const out = migrateProfilesV3(old);
    expect(out[0].emneIds).toEqual([emne1, emne2]);
    expect(out[1].emneIds).toEqual([emne2]);
    expect(out[2].emneIds).toEqual([]);
  });
});
