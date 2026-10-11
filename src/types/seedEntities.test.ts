import { describe, expect, it } from "vitest";
import { SEED_CATALOG, SEED_CONTACTS, SEED_PROFILES } from "../data/seedEntities";

describe("starting data", () => {
  const programs = SEED_CATALOG.flatMap((s) => s.programs);
  it("has 40 entities, ten per program, and 3 people on each", () => {
    expect(SEED_PROFILES).toHaveLength(40);
    expect(SEED_CONTACTS).toHaveLength(120);
    programs.forEach((p) => expect(SEED_PROFILES.filter((e) => e.programId === p.id)).toHaveLength(10));
    SEED_PROFILES.forEach((e) => expect(e.contacts).toHaveLength(3));
  });
  it("refers only to things that exist, and names are unique within a place", () => {
    const people = new Map(SEED_CONTACTS.map((c) => [c.id, c]));
    expect(people.size).toBe(120);
    SEED_PROFILES.forEach((e) => {
      const program = programs.find((p) => p.id === e.programId)!;
      expect(program.emner!.map((x) => x.id)).toEqual(e.emneIds);
      e.contacts.forEach((l) => expect(people.get(l.contactId)?.praksisPlaceId).toBe(e.praksisPlaceId));
    });
    const keys = SEED_PROFILES.map((e) => `${e.praksisPlaceId}|${e.name}`);
    expect(new Set(keys).size).toBe(40);
    expect(new Set(SEED_PROFILES.map((e) => e.id)).size).toBe(40);
  });
});
