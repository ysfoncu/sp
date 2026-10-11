import { describe, expect, it } from "vitest";
import { contactsDirty, infoDirty, nameDirty, placesDirty, programDirty } from "./entityDirty";
import { emptyPlacementInfo } from "./placementProfile";

describe("is an open block changed?", () => {
  it("name and type", () => {
    expect(nameDirty({ name: "S1 ", type: "seksjon" }, { name: "S1", entityType: "seksjon" })).toBe(false);
    expect(nameDirty({ name: "S2", type: "seksjon" }, { name: "S1", entityType: "seksjon" })).toBe(true);
    expect(nameDirty({ name: "S1", type: "" }, { name: "S1" })).toBe(false);
    expect(nameDirty({ name: "S1", type: "klinikk" }, { name: "S1" })).toBe(true);
  });

  it("program and emner, whatever the order", () => {
    expect(programDirty({ programId: "p", emneIds: ["b", "a"] }, { programId: "p", emneIds: ["a", "b"] })).toBe(false);
    expect(programDirty({ programId: "p", emneIds: ["a"] }, { programId: "p", emneIds: ["a", "b"] })).toBe(true);
    expect(programDirty({ programId: "q", emneIds: [] }, { programId: "p", emneIds: [] })).toBe(true);
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
