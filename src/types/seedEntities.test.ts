import { describe, expect, it } from "vitest";
import { SEED_CATALOG, SEED_CONTACTS, SEED_PROFILES, isPristine } from "../data/seedEntities";

describe("starting data", () => {
  const programs = SEED_CATALOG.flatMap((s) => s.programs);
  it("has 40 entities, ten per program (Barne seksjon takes three programs), and 3 people on each", () => {
    expect(SEED_PROFILES).toHaveLength(40);
    expect(SEED_CONTACTS).toHaveLength(120);
    const first = (e: (typeof SEED_PROFILES)[number]) => e.programs[0].programId; // the program an entity was made for
    programs.forEach((p) => expect(SEED_PROFILES.filter((e) => first(e) === p.id)).toHaveLength(10));
    const two = SEED_PROFILES.filter((e) => e.programs.length > 1);
    expect(two.map((e) => e.name)).toEqual(["Barne seksjon"]);
    expect(two[0].programs.map((e) => e.programId)).toEqual(["program-seed-vybar", "program-seed-vysjs", "program-seed-mylog"]);
    expect(two[0].programs.every((e) => e.places > 0)).toBe(true);
    SEED_PROFILES.filter((e) => e.programs.length === 1).forEach((e) => expect(e.programs).toHaveLength(1));
    SEED_PROFILES.forEach((e) => expect(e.contacts).toHaveLength(3));
  });
  it("refers only to things that exist, and names are unique within a place", () => {
    const people = new Map(SEED_CONTACTS.map((c) => [c.id, c]));
    expect(people.size).toBe(120);
    SEED_PROFILES.forEach((e) => {
      e.programs.forEach((entry) => {
        const program = programs.find((p) => p.id === entry.programId)!;
        expect(program.emner!.map((x) => x.id)).toEqual(entry.emneIds);
      });
      e.contacts.forEach((l) => expect(people.get(l.contactId)?.praksisPlaceId).toBe(e.praksisPlaceId));
    });
    const keys = SEED_PROFILES.map((e) => `${e.praksisPlaceId}|${e.name}`);
    expect(new Set(keys).size).toBe(40);
    expect(new Set(SEED_PROFILES.map((e) => e.id)).size).toBe(40);
  });
});

describe("an untouched browser", () => {
  it("is one where entities, people and studies are all missing or empty", () => {
    expect(isPristine([null, null, null])).toBe(true);
    expect(isPristine([[], [], null])).toBe(true);
    expect(isPristine([[], [{}], []])).toBe(false);
    expect(isPristine([null, [], [1]])).toBe(false);
  });
});
