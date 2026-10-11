import { describe, expect, it } from "vitest";
import type { Student } from "./placementTask";
import { EMPTY_QUICK_ASSIGN_FILTERS, matchesFilters, overBy, pointsOf, rankStudents } from "./quickAssign";

const student = (id: string, over: Partial<Student> = {}): Student => ({
  id,
  name: id,
  email: `${id}@x.no`,
  year: "2022",
  customRequestSubmitted: false,
  ...over,
});
const ask = (place: string): Student["customRequest"] => ({ preferredPlaceName: place, message: "", submittedAt: "" });

describe("quick assign list", () => {
  const list = [
    student("Anna", { priorityPoints: 10, studyLocation: "Umeå" }),
    student("Berit", { priorityPoints: 30, studyLocation: "Skellefteå", customRequest: ask("Bergen Kommune") }),
    student("Cecilie", { studyLocation: "Umeå", customRequest: ask("Oslo University Hospital HF") }),
    student("Dina", { priorityPoints: 30, customRequest: ask("Oslo University Hospital HF") }),
  ];
  const none = new Map<string, number>();

  it("ranks by points, then those who asked for this place, then by name", () => {
    expect(rankStudents(list, EMPTY_QUICK_ASSIGN_FILTERS, none, "Oslo University Hospital HF").map((s) => s.id)).toEqual(["Dina", "Berit", "Anna", "Cecilie"]);
    expect(rankStudents(list, EMPTY_QUICK_ASSIGN_FILTERS, none, "Bergen Kommune").map((s) => s.id)).toEqual(["Berit", "Dina", "Anna", "Cecilie"]);
  });

  it("an approved application beats the imported points", () => {
    expect(pointsOf(list[0], new Map([["Anna", 50]]))).toBe(50);
    expect(pointsOf(list[0], none)).toBe(10);
    expect(pointsOf(list[2], none)).toBeUndefined();
    expect(rankStudents(list, EMPTY_QUICK_ASSIGN_FILTERS, new Map([["Anna", 50]]), "x")[0].id).toBe("Anna");
  });

  it("searches name, email, personnummer and address", () => {
    const ids = (query: string) => rankStudents(list, { query }, none, "x").map((s) => s.id);
    expect(ids("ber")).toEqual(["Berit"]);
    expect(ids("")).toHaveLength(4);
    expect(ids("nobody")).toEqual([]);
    expect(matchesFilters(list[0], { query: "ANNA@" })).toBe(true);
    expect(matchesFilters({ ...list[0], address: "Kungsvägen 4" }, { query: "kungsv" })).toBe(true);
    expect(matchesFilters(list[0], { query: "kungsv" })).toBe(false);
  });

  it("never blocks: over by how many above the places left", () => {
    expect(overBy(3, 2)).toBe(0);
    expect(overBy(3, 5)).toBe(2);
    expect(overBy(0, 4)).toBe(4);
  });
});
