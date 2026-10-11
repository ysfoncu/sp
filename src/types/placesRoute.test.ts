import { describe, expect, it } from "vitest";
import { DEFAULT_ROUTE, formatPlacesHash, parsePlacesHash, resolveRoute } from "./placesRoute";

describe("places route in the hash", () => {
  it("is null for hashes that are not about this page", () => {
    expect(parsePlacesHash("")).toBeNull();
    expect(parsePlacesHash("#")).toBeNull();
    expect(parsePlacesHash("#/settings")).toBeNull();
  });

  it("reads each shape", () => {
    expect(parsePlacesHash("#/places")).toEqual(DEFAULT_ROUTE);
    expect(parsePlacesHash("#/places/p1")).toEqual({ placeId: "p1", tab: "entities", entityId: null });
    expect(parsePlacesHash("#/places/p1/contacts")).toEqual({ placeId: "p1", tab: "contacts", entityId: null });
    expect(parsePlacesHash("#/places/p1/info/")).toEqual({ placeId: "p1", tab: "info", entityId: null });
    expect(parsePlacesHash("#/places/p1/entities/e1")).toEqual({ placeId: "p1", tab: "entities", entityId: "e1" });
    expect(parsePlacesHash("#places/p1")).toEqual({ placeId: "p1", tab: "entities", entityId: null });
  });

  it("treats an unknown tab or a missing entity id as the place's list", () => {
    expect(parsePlacesHash("#/places/p1/whatever")).toEqual({ placeId: "p1", tab: "entities", entityId: null });
    expect(parsePlacesHash("#/places/p1/entities")).toEqual({ placeId: "p1", tab: "entities", entityId: null });
  });

  it("round-trips, including ids with spaces and slashes", () => {
    const routes = [
      DEFAULT_ROUTE,
      { placeId: "a b/c", tab: "entities" as const, entityId: null },
      { placeId: "p1", tab: "contacts" as const, entityId: null },
      { placeId: "p/1", tab: "entities" as const, entityId: "e 1/x" },
    ];
    routes.forEach((r) => expect(parsePlacesHash(formatPlacesHash(r))).toEqual(r));
  });

  it("lets an entity win over the tab and never loops", () => {
    const hash = formatPlacesHash({ placeId: "p1", tab: "contacts", entityId: "e1" });
    expect(hash).toBe("#/places/p1/entities/e1");
    expect(formatPlacesHash(parsePlacesHash(hash)!)).toBe(hash);
  });

  it("survives a broken escape", () => {
    expect(parsePlacesHash("#/places/%E0%A4%A")?.placeId).toBe("%E0%A4%A");
  });
});

describe("resolveRoute", () => {
  const placeIds = ["p1", "p2"];
  const entities = [{ id: "e1", praksisPlaceId: "p1" }];

  it("keeps a route that points at something real", () => {
    const r = { placeId: "p1", tab: "entities" as const, entityId: "e1" };
    expect(resolveRoute(r, placeIds, entities)).toEqual({ route: r, fixed: false });
  });

  it("sends no place or an unknown place to the first place", () => {
    expect(resolveRoute(DEFAULT_ROUTE, placeIds, entities)).toEqual({ route: { placeId: "p1", tab: "entities", entityId: null }, fixed: true });
    expect(resolveRoute({ placeId: "gone", tab: "info", entityId: null }, placeIds, entities).route).toEqual({ placeId: "p1", tab: "info", entityId: null });
  });

  it("drops an entity that is gone or belongs to another place", () => {
    expect(resolveRoute({ placeId: "p1", tab: "entities", entityId: "nope" }, placeIds, entities)).toEqual({
      route: { placeId: "p1", tab: "entities", entityId: null },
      fixed: true,
    });
    expect(resolveRoute({ placeId: "p2", tab: "entities", entityId: "e1" }, placeIds, entities).route.entityId).toBeNull();
  });

  it("has nothing to show without places", () => {
    expect(resolveRoute(DEFAULT_ROUTE, [], []).route.placeId).toBeNull();
  });
});
