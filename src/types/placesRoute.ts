// Where the Praksis places page is, kept in the URL hash so Back, refresh and links work:
//   #/places                          the first place, its entities
//   #/places/<place>                  a place, its entities
//   #/places/<place>/contacts|info    a place, another tab
//   #/places/<place>/entities/<id>    an entity of the place
export type PlacesTab = "entities" | "contacts" | "info";

export interface PlacesRoute {
  placeId: string | null;
  tab: PlacesTab;
  entityId: string | null;
}

export const PLACES_ROOT = "#/places";
export const DEFAULT_ROUTE: PlacesRoute = { placeId: null, tab: "entities", entityId: null };

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// The route a hash stands for, or null when the hash is not about this page
export const parsePlacesHash = (hash: string): PlacesRoute | null => {
  const path = hash.replace(/^#\/?/, "");
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "places") return null;
  const placeId = parts[1] ? decode(parts[1]) : null;
  if (!placeId) return { ...DEFAULT_ROUTE };
  if (parts[2] === "contacts" || parts[2] === "info") return { placeId, tab: parts[2], entityId: null };
  if (parts[2] === "entities" && parts[3]) return { placeId, tab: "entities", entityId: decode(parts[3]) };
  return { placeId, tab: "entities", entityId: null };
};

// An entity is always shown in the Entities tab, so it wins over any other tab
export const formatPlacesHash = (route: PlacesRoute): string => {
  if (!route.placeId) return PLACES_ROOT;
  const place = `${PLACES_ROOT}/${encodeURIComponent(route.placeId)}`;
  if (route.entityId) return `${place}/entities/${encodeURIComponent(route.entityId)}`;
  return route.tab === "entities" ? place : `${place}/${route.tab}`;
};

// A route that points at something that is gone (a deleted place, an entity of another place) falls back to what
// exists: no place or an unknown one becomes the first place, an unknown entity the place's list.
export const resolveRoute = (
  route: PlacesRoute,
  placeIds: string[],
  entities: { id: string; praksisPlaceId: string }[],
): { route: PlacesRoute; fixed: boolean } => {
  let placeId = route.placeId;
  let entityId = route.entityId;
  if (!placeId || !placeIds.includes(placeId)) {
    placeId = placeIds[0] ?? null;
    entityId = null;
  }
  if (entityId && !entities.some((e) => e.id === entityId && e.praksisPlaceId === placeId)) entityId = null;
  const next: PlacesRoute = { placeId, tab: entityId ? "entities" : route.tab, entityId };
  return { route: next, fixed: formatPlacesHash(next) !== formatPlacesHash(route) };
};
