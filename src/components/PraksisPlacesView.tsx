import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, ChevronRight, Hospital, Home, Plus, Search, X } from "lucide-react";
import { PraksisPlace } from "../types/praksisPlace";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { cn } from "./ui/utils";
import { usePlacementProfiles, profilesOfPlace, entityMissing, getProfiles } from "../types/placementProfile";
import { contactsOfPlace, usePlaceContacts } from "../types/placeContact";
import { DEFAULT_ROUTE, PlacesTab, parsePlacesHash, resolveRoute } from "../types/placesRoute";
import { goPlaces, useHash } from "../navigation";
import { requestLeave } from "../navGuard";
import { EntitiesTab } from "./EntitiesTab";
import { EntityTypeIcon } from "./EntityTypeIcon";
import { EntityPage } from "./entity/EntityPage";
import { CreateEntityDialog } from "./entity/CreateEntityDialog";
import { PlaceContactsTab } from "./PlaceContactsTab";

interface PraksisPlacesViewProps {
  places: PraksisPlace[];
  onCreatePlace: () => void;
}

const placeIcon = (place: PraksisPlace) =>
  place.organizationType === "Kommune" ? Home : place.tags.some((t) => /hospital/i.test(t)) ? Hospital : Building2;

const tabClass =
  "h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 pt-0 text-sm font-medium text-gray-500 shadow-none hover:text-gray-800 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none";

// The praksis places as a list of places that open to show their entities. The place, tab and entity are in the
// URL hash (see placesRoute.ts), so Back, refresh and links work. A place shows its header and tabs (contacts,
// entities, place info); an entity opens inside the Entities tab.
export function PraksisPlacesView({ places, onCreatePlace }: PraksisPlacesViewProps) {
  const entities = usePlacementProfiles();
  const people = usePlaceContacts();
  const hash = useHash();

  // The route is what the hash says, with anything that no longer exists replaced by what does
  const parsed = parsePlacesHash(hash);
  const resolved = useMemo(() => resolveRoute(parsed ?? DEFAULT_ROUTE, places.map((p) => p.id), entities), [hash, places, entities]); // eslint-disable-line react-hooks/exhaustive-deps
  const route = resolved.route;
  useEffect(() => {
    // No hash yet, or a hash for something that is gone: write the real one without adding a history entry
    if (parsed === null || resolved.fixed) goPlaces(route, { replace: true });
  }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps

  const [creating, setCreating] = useState(false); // the "Add entity" dialog
  const [expanded, setExpanded] = useState<Set<string>>(new Set(route.placeId ? [route.placeId] : []));
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const activeOf = (placeId: string) => profilesOfPlace(entities, placeId).filter((e) => e.status === "active");
  const entityMatches = (name: string) => !!q && name.toLowerCase().includes(q);

  // A place is shown when its own name or one of its entities matches; matching entities open their place
  const visible = places.filter((p) => !q || `${p.name} ${p.city}`.toLowerCase().includes(q) || activeOf(p.id).some((e) => entityMatches(e.name)));
  const isOpen = (placeId: string) => expanded.has(placeId) || (!!q && activeOf(placeId).some((e) => entityMatches(e.name)));

  const place = places.find((p) => p.id === route.placeId) ?? null;
  const entity = place && route.entityId ? profilesOfPlace(entities, place.id).find((e) => e.id === route.entityId) ?? null : null;

  // The place of the route is open in the list
  useEffect(() => {
    if (route.placeId) setExpanded((prev) => (prev.has(route.placeId!) ? prev : new Set(prev).add(route.placeId!)));
  }, [route.placeId]);

  // One scroll area for the pane: it goes back to the top when another place or entity opens
  const paneRef = useRef<HTMLDivElement>(null);
  useEffect(() => paneRef.current?.scrollTo({ top: 0 }), [route.entityId, route.placeId]);

  // The page title says where you are (a single-page app has no other page title)
  useEffect(() => {
    if (!place) return;
    const before = document.title;
    document.title = [entity?.name, place.name, "Praksis places"].filter(Boolean).join(" – ");
    return () => {
      document.title = before;
    };
  }, [place?.name, entity?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (placeId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(placeId) ? next.delete(placeId) : next.add(placeId);
      return next;
    });

  const selectPlace = (placeId: string) => goPlaces({ placeId, tab: route.entityId ? "entities" : route.tab, entityId: null });
  const showList = () => place && goPlaces({ placeId: place.id, tab: "entities", entityId: null });

  // From a card, a contact, the list or after Copy or Create: the entity opens in the Entities tab of its place
  const openEntity = (entityId: string) => {
    const e = getProfiles().find((x) => x.id === entityId); // the live list: the entity may have been made a moment ago
    if (!e) return;
    goPlaces({ placeId: e.praksisPlaceId, tab: "entities", entityId }, { focusEntity: true });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-gray-900 text-2xl">Praksis places</h1>
        <Button onClick={() => requestLeave(onCreatePlace)} className="h-9 gap-2 bg-[#155dfc] hover:bg-[#1147d4] text-white">
          <Plus className="h-4 w-4" />
          New praksis place
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* The places and their entities: a list of places that open to show their entities */}
        <nav aria-label="Praksis places and entities" className="w-[280px] flex-shrink-0 flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places and entities…" className="h-9 pl-8 pr-8" aria-label="Search praksis places and entities" />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Clear search" title="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {visible.length === 0 && <p className="p-4 text-sm text-gray-500">Nothing matches.</p>}
            <ul>
              {visible.map((p) => {
                const Icon = placeIcon(p);
                const own = activeOf(p.id);
                const open = isOpen(p.id);
                const placeSelected = route.placeId === p.id && !route.entityId;
                const contactCount = contactsOfPlace(people, p.id).length;
                return (
                  <li key={p.id}>
                    <div className={cn("flex items-center gap-1 pr-2", placeSelected && "bg-blue-50")}>
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        className="flex h-8 w-7 flex-shrink-0 items-center justify-center text-gray-500 hover:text-gray-800"
                        aria-expanded={open}
                        aria-controls={`place-${p.id}-entities`}
                        aria-label={`${open ? "Collapse" : "Expand"} ${p.name}`}
                      >
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => selectPlace(p.id)} aria-current={placeSelected ? "page" : undefined} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left hover:text-blue-700">
                        <Icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900">{p.name}</span>
                          <span className="block truncate text-xs text-gray-500">
                            {own.length} entit{own.length === 1 ? "y" : "ies"} · {contactCount} contact{contactCount === 1 ? "" : "s"}
                          </span>
                        </span>
                      </button>
                    </div>
                    {open && (
                      <ul id={`place-${p.id}-entities`} className="ml-[18px] border-l border-gray-200 pl-1" aria-label={`Entities of ${p.name}`}>
                        {own.length === 0 && <li className="px-3 py-1.5 text-xs text-gray-400">No entities yet</li>}
                        {[...own]
                          .sort((a, b) => a.name.localeCompare(b.name, "nb", { numeric: true }))
                          .map((e) => {
                            const on = route.entityId === e.id;
                            const gaps = entityMissing(e, people);
                            return (
                              <li key={e.id}>
                                <button
                                  type="button"
                                  aria-current={on ? "page" : undefined}
                                  onClick={() => openEntity(e.id)}
                                  className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50", on ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700")}
                                >
                                  <EntityTypeIcon type={e.entityType} className={cn("h-3.5 w-3.5 flex-shrink-0", on ? "text-blue-600" : "text-gray-400")} />
                                  <span className="truncate">{e.name}</span>
                                  {gaps.length > 0 && (
                                    <span className="ml-auto flex flex-shrink-0 items-center gap-1" title={`Missing: ${gaps.map((g) => g.label.replace(/ \(.*\)$/, "")).join(", ")}`}>
                                      <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                                      <span className="sr-only">Missing information</span>
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* The picked place. Its header and tabs stay; an entity opens inside the Entities tab */}
        <div ref={paneRef} className="flex-1 min-w-0 overflow-y-auto rounded-lg border border-gray-200 bg-white">
          {!place ? (
            <div className="flex h-full items-center justify-center p-10 text-sm text-gray-500">Select a praksis place to see its contacts and entities.</div>
          ) : (
            <Tabs value={route.tab} onValueChange={(v) => goPlaces({ placeId: place.id, tab: v as PlacesTab, entityId: null })} className="gap-0">
              <div className="px-6 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-gray-900">{place.name}</h2>
                    <p className="text-sm text-gray-500">{[place.address, `${place.postalCode} ${place.city}`.trim()].filter(Boolean).join(", ")}</p>
                  </div>
                </div>
              </div>
              {/* The tabs stay in view while the entity scrolls */}
              <TabsList className="sticky top-0 z-10 h-auto w-full justify-start gap-6 rounded-none border-b border-gray-200 bg-white p-0 px-6 pt-4" aria-label={place.name}>
                <TabsTrigger value="contacts" className={tabClass}>
                  Place contacts ({contactsOfPlace(people, place.id).length})
                </TabsTrigger>
                <TabsTrigger value="entities" className={tabClass}>
                  Entities ({activeOf(place.id).length})
                </TabsTrigger>
                <TabsTrigger value="info" className={tabClass}>
                  Place info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts">
                <PlaceContactsTab key={place.id} place={place} onOpenEntity={openEntity} />
              </TabsContent>

              <TabsContent value="entities">
                {entity ? (
                  <>
                    <Breadcrumb className="px-6 pt-4" aria-label="Breadcrumb">
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <button type="button" onClick={showList} className="text-blue-600 hover:underline">
                              Entities
                            </button>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{entity.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                    <EntityPage key={entity.id} place={place} entity={entity} onCopied={openEntity} />
                  </>
                ) : (
                  <EntitiesTab key={place.id} place={place} onOpenEntity={openEntity} onAddEntity={() => setCreating(true)} />
                )}
              </TabsContent>

              <TabsContent value="info">
                <div className="p-6 space-y-6">
                  <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-gray-900">{place.name}</dd>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="text-gray-900">{place.organizationType ?? "—"}</dd>
                    <dt className="text-gray-500">Address</dt>
                    <dd className="text-gray-900">{place.address || "—"}</dd>
                    <dt className="text-gray-500">Postal code · city</dt>
                    <dd className="text-gray-900">{`${place.postalCode} ${place.city}`.trim() || "—"}</dd>
                  </dl>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {creating && place && <CreateEntityDialog place={place} onClose={() => setCreating(false)} onCreated={openEntity} />}
    </div>
  );
}
