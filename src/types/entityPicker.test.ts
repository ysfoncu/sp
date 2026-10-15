import { describe, expect, it } from "vitest";
import { placesLabel, unassignedOf } from "./entityPicker";

describe("floating bar helpers", () => {
  it("says how many places are left", () => {
    expect(placesLabel(3, 0)).toBe("3 places left");
    expect(placesLabel(1, 0)).toBe("1 place left");
    expect(placesLabel(0, 0)).toBe("Full");
    expect(placesLabel(0, 2)).toBe("Full, 2 over");
  });

  it("keeps the picked students that still have no entity, in table order", () => {
    const students = [{ id: "a" }, { id: "b", assignedPraksisPlace: {} as never }, { id: "c" }];
    expect(unassignedOf(new Set(["c", "b", "a", "zzz"]), students)).toEqual(["a", "c"]);
  });
});
