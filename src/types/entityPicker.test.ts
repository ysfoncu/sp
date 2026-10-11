import { describe, expect, it } from "vitest";
import { PickerEntity, groupEntitiesByPlace, placesLabel, unassignedOf } from "./entityPicker";

const e = (id: string, place: string, remaining: number, over = 0): PickerEntity => ({
  id,
  name: id,
  praksisPlaceId: place.toLowerCase(),
  praksisPlaceName: place,
  remaining,
  over,
});

describe("entity picker", () => {
  const list = [e("Lunge", "Bergen", 2), e("Føde", "Bergen", 0, 1), e("Barne", "Oslo", 7), e("Dialyse", "Oslo", 3), e("Hud", "Trondheim", 0)];

  it("groups by place, places by name and entities with most room first", () => {
    const g = groupEntitiesByPlace(list, "");
    expect(g.map((x) => x.placeName)).toEqual(["Bergen", "Oslo", "Trondheim"]);
    expect(g[1].entities.map((x) => x.id)).toEqual(["Barne", "Dialyse"]);
    expect(g[0].entities.map((x) => x.id)).toEqual(["Lunge", "Føde"]);
  });

  it("keeps full entities and filters by entity or place name", () => {
    expect(groupEntitiesByPlace(list, "").flatMap((x) => x.entities)).toHaveLength(5);
    expect(groupEntitiesByPlace(list, "lun").flatMap((x) => x.entities.map((y) => y.id))).toEqual(["Lunge"]);
    expect(groupEntitiesByPlace(list, "oslo").flatMap((x) => x.entities.map((y) => y.id))).toEqual(["Barne", "Dialyse"]);
    expect(groupEntitiesByPlace(list, "nothing")).toEqual([]);
  });

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
