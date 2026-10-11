import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "./ui/utils";
import { Plus, Search, Users, X } from "lucide-react";
import { PraksisPlace } from "../types/praksisPlace";
import { isPeriodComplete, periodLabel, setPlacePeriod, usePlacePeriod } from "../types/placePeriod";
import { findProgram, programLabel } from "../types/studyCatalog";
import { usePlaceContacts } from "../types/placeContact";
import { PlacementProfile, entityTypeLabel, profileAudienceLabel, profilesOfPlace, resolveContacts, entityMissing, usePlacementProfiles } from "../types/placementProfile";
import { usePlacedOnProfile } from "./ProfileUsageContext";
import { EntityTypeIcon } from "./EntityTypeIcon";
import { AcceptedProgramTree } from "./AcceptedProgramTree";
import { PlacePeriodDialog } from "./PlacePeriodDialog";

interface EntitiesTabProps {
  place: PraksisPlace;
  onOpenEntity: (entityId: string) => void;
  onAddEntity: () => void; // opens the dialog to add an entity
}

// All entities of one praksis place as cards. A card opens the entity's details.
export function EntitiesTab({ place, onOpenEntity, onAddEntity }: EntitiesTabProps) {
  const allProfiles = usePlacementProfiles();
  const people = usePlaceContacts();
  const period = usePlacePeriod(place.id);
  const placedFor = usePlacedOnProfile();

  const [query, setQuery] = useState("");
  const [programId, setProgramId] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  const placeEntities = profilesOfPlace(allProfiles, place.id);
  const programsInUse = [...new Set(placeEntities.map((p) => p.programId))].map((id) => ({
    id,
    name: findProgram(id) ? programLabel(findProgram(id)!.program) : "Unknown program",
  })).filter((p) => p.id);

  const q = query.trim().toLowerCase();
  const inView = placeEntities.filter(
    (p) =>
      (programId === "all" || p.programId === programId) &&
      (!q ||
        `${p.name} ${profileAudienceLabel(p)} ${resolveContacts(p, people)
          .map((c) => c.name)
          .join(" ")}`
          .toLowerCase()
          .includes(q)),
  );
  const shown = (showArchived ? inView : inView.filter((p) => p.status === "active")).sort((a, b) => a.name.localeCompare(b.name, "nb", { numeric: true }));
  const activeInView = inView.filter((p) => p.status === "active");
  const totalPlaces = activeInView.reduce((sum, p) => sum + p.places, 0);

  const filtering = q !== "" || programId !== "all";
  const clearFilters = () => {
    setQuery("");
    setProgramId("all");
  };

  // One row per entity; the accepted program and its emner are shown as a small tree
  const row = (p: PlacementProfile) => {
    const archived = p.status === "archived";
    const peak = placedFor(p).peak;
    const contactCount = resolveContacts(p, people).length;
    const gaps = archived ? [] : entityMissing(p, people);
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => onOpenEntity(p.id)}
        className={cn(
          "grid w-full grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_70px_110px] items-start gap-4 px-4 py-3 text-left transition hover:bg-purple-50/40",
          archived && "opacity-60",
        )}
        aria-label={`Open ${p.name}`}
      >
        <span className="flex min-w-0 items-center gap-2" title={entityTypeLabel(p.entityType)}>
          <EntityTypeIcon type={p.entityType} className="h-4 w-4 flex-shrink-0 text-gray-500" />
          <span className="truncate text-sm font-semibold text-gray-900">{p.name}</span>
          {archived && (
            <Badge variant="outline" className="text-[10px] text-gray-500">
              Archived
            </Badge>
          )}
          {gaps.length > 0 && (
            <span className="flex-shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800" title={`Missing: ${gaps.map((g) => g.label.replace(/ \(.*\)$/, "")).join(", ")}`}>
              Missing {gaps.length}
            </span>
          )}
        </span>
        {p.programId ? (
          <AcceptedProgramTree programId={p.programId} emneIds={p.emneIds} />
        ) : (
          <span className="text-sm text-amber-700">No program yet</span>
        )}
        <span className="flex items-center gap-1 text-sm text-gray-700" title={`${contactCount} contact${contactCount === 1 ? "" : "s"}`}>
          <Users className="h-3.5 w-3.5 text-gray-400" />
          {contactCount}
        </span>
        <span className="text-sm" title={`${peak} placed in the busiest period`}>
          <span className={`font-semibold ${peak > p.places ? "text-red-600" : "text-purple-600"}`}>{peak}</span>
          <span className="text-gray-400"> / </span>
          <span className="font-semibold text-purple-600">{p.places}</span>
          <span className="text-xs text-gray-500"> placed</span>
        </span>
      </button>
    );
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[260px] flex-1">
            <h3 className="mb-1 font-semibold text-gray-900">Entities</h3>
            <p className="text-sm text-gray-500">
              An entity is where students are placed at {place.name}: the program it is for, how many places it offers,
              who students contact and what they are told. Open one to fill in what is missing.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
              <span className="text-xs text-gray-500">Period</span>
              <span className="whitespace-nowrap font-medium">{periodLabel(period)}</span>
              <Button variant="ghost" size="sm" onClick={() => setPeriodOpen(true)} className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                Change
              </Button>
            </div>
            <Button
              size="sm"
              onClick={onAddEntity}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add entity
            </Button>
          </div>
        </div>

        {!isPeriodComplete(period) && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            The period for this praksis place has no reset day, so no placement can be counted in it. Change the period to fix it.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
          <span>
            <span className="text-lg font-semibold text-gray-900">{activeInView.length}</span> entit{activeInView.length === 1 ? "y" : "ies"}
          </span>
          <span>
            <span className="font-semibold text-gray-900">{totalPlaces}</span> places
          </span>
          {filtering && <span className="text-xs text-gray-400">for the current filter</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search entity, program or contact…" className="h-9 border-gray-300 pl-8 pr-8" />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" title="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger className="h-9 w-[190px] border-gray-300 bg-white" aria-label="Program">
              <SelectValue placeholder="All programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programsInUse.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-gray-600">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived
          </label>
          {filtering && (
            <button type="button" onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-600">{placeEntities.length === 0 ? "No entities yet." : "No entities match the filter."}</p>
            <p className="mt-1 text-xs text-gray-500">
              {placeEntities.length === 0 ? "Add the first entity for this place." : "Try another program or search."}
            </p>
            {filtering && (
              <button type="button" onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_70px_110px] gap-4 border-b border-gray-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <span>Entity</span>
                <span>Accepted program and emner</span>
                <span>Contacts</span>
                <span>Placed / places</span>
              </div>
              <div className="divide-y divide-gray-100">{shown.map(row)}</div>
            </div>
          </div>
        )}
      </div>

      {periodOpen && (
        <PlacePeriodDialog
          placeName={place.name}
          period={period}
          placed={placeEntities.reduce((sum, p) => sum + placedFor(p).total, 0)}
          onClose={() => setPeriodOpen(false)}
          onSave={(next) => setPlacePeriod(place.id, next)}
        />
      )}
    </div>
  );
}
