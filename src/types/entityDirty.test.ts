import { describe, expect, it } from "vitest";
import { contactsDirty, infoDirty, nameDirty, placesDirty, programEntryDirty } from "./entityDirty";
import { emptyPlacementInfo } from "./placementProfile";

describe("is an open block changed?", () => {
  it("name and type", () => {
    expect(nameDirty({ name: "S1 ", type: "seksjon" }, { name: "S1", entityType: "seksjon" })).toBe(false);
    expect(nameDirty({ name: "S2", type: "seksjon" }, { name: "S1", entityType: "seksjon" })).toBe(true);
    expect(nameDirty({ name: "S1", type: "" }, { name: "S1" })).toBe(false);
    expect(nameDirty({ name: "S1", type: "klinikk" }, { name: "S1" })).toBe(true);
  });

  it("one accepted program: its emner (whatever the order) and its places together", () => {
    const saved = { programId: "p", emneIds: ["a", "b"], places: 4 };
    expect(programEntryDirty({ programId: "p", emneIds: ["b", "a"], places: "4" }, saved)).toBe(false);
    expect(programEntryDirty({ programId: "p", emneIds: ["a"], places: "4" }, saved)).toBe(true);
    expect(programEntryDirty({ programId: "p", emneIds: ["a", "b"], places: "5" }, saved)).toBe(true);
    expect(programEntryDirty({ programId: "q", emneIds: ["a", "b"], places: "4" }, saved)).toBe(true);
    // a program that is not saved yet always counts as changed
    expect(programEntryDirty({ programId: "p", emneIds: [], places: "0" }, undefined)).toBe(true);
  });

  it("places as typed", () => {
    expect(placesDirty("4", 4)).toBe(false);
    expect(placesDirty("04", 4)).toBe(false);
    expect(placesDirty("", 0)).toBe(false);
    expect(placesDirty("5", 4)).toBe(true);
  });

  it("contacts, whatever the order", () => {
    const a = { contactId: "a", notifyOnPlacement: true, availableToStudents: true };
    const b = { contactId: "b", notifyOnPlacement: true, availableToStudents: true };
    expect(contactsDirty([b, a], [a, b])).toBe(false);
    expect(contactsDirty([a], [a, b])).toBe(true);
    expect(contactsDirty([{ ...a, notifyOnPlacement: false }, b], [a, b])).toBe(true);
  });

  it("placement information", () => {
    const saved = emptyPlacementInfo();
    expect(infoDirty(JSON.parse(JSON.stringify(saved)), saved)).toBe(false);
    expect(infoDirty({ ...saved, workClothes: "White" }, saved)).toBe(true);
    expect(infoDirty({ ...saved, housing: { available: true, text: "" } }, saved)).toBe(true);
  });
});
