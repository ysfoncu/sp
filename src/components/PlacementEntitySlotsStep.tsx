import { useMemo, useState } from "react";
import { Info, Minus, Plus, Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { EntityTypeIcon } from "./EntityTypeIcon";
import { StepInfoBanner } from "./StepInfoBanner";
import { entityTypeLabel, programAudienceLabel } from "../types/placementProfile";
import {
  EntitySlot,
  SlotCandidate,
  addSlot,
  canRemove,
  minSlots,
  parseSlots,
  removeSlot,
  setSlot,
  slotsOf,
  slotsOver,
  studentsWithoutSlot,
  totalSlots,
  validateSlots,
} from "../types/placementSlots";

interface PlacementEntitySlotsStepProps {
  candidates: SlotCandidate[]; // every entity that fits the placement's program and emne
  slots: EntitySlot[]; // the entities chosen so far
  onChange: (next: EntitySlot[]) => void;
  studentCount: number;
  emne?: string;
  onContinue: () => void;
  onOpenProfiles?: () => void;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Step 2: which entities this placement uses and how many slots of each. Same layout as the students step:
// the chosen entities on the left, everything that fits on the right. Slots never block, they only warn.
export default function PlacementEntitySlotsStep({
  candidates,
  slots,
  onChange,
  studentCount,
  emne,
  onContinue,
  onOpenProfiles,
}: PlacementEntitySlotsStepProps) {
  const [query, setQuery] = useState("");
  const [chosenQuery, setChosenQuery] = useState(""); // search in the chosen entities (left)
  const problem = validateSlots(slots);
  const uncovered = studentsWithoutSlot(studentCount, slots);

  const chosen = candidates.filter((c) => slotsOf(slots, c.node.profile.id) !== undefined);
  const matches = (c: SlotCandidate, text: string) => {
    const q = text.trim().toLowerCase();
    return !q || c.node.profile.name.toLowerCase().includes(q) || c.praksisPlaceName.toLowerCase().includes(q);
  };
  const chosenShown = chosen.filter((c) => matches(c, chosenQuery));
  const byPlace = (list: SlotCandidate[]) => {
    const groups = new Map<string, { name: string; items: SlotCandidate[] }>();
    list.forEach((c) => {
      const g = groups.get(c.praksisPlaceId) ?? { name: c.praksisPlaceName, items: [] };
      g.items.push(c);
      groups.set(c.praksisPlaceId, g);
    });
    return [...groups].map(([id, g]) => ({ id, ...g }));
  };
  // The list on the right holds only the entities not chosen yet; removing one on the left puts it back
  const notChosen = candidates.filter((c) => slotsOf(slots, c.node.profile.id) === undefined);
  const shown = useMemo(() => {
    return notChosen.filter((c) => matches(c, query));
  }, [notChosen, query]);
  const chosenInPlace = (placeId: string) => chosen.filter((c) => c.praksisPlaceId === placeId).length;
  const totalInPlace = (placeId: string) => candidates.filter((c) => c.praksisPlaceId === placeId).length;

  return (
    <div className="space-y-4">
      <StepInfoBanner key="2" taskId="2" storageKey="spm_hide_entities_step_info" />

    <div className="flex gap-4 items-start">
      {/* Left: the entities this placement uses, with their slots */}
      <div className="w-[400px] flex-shrink-0 sticky top-6 max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Available entities</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {emne} · {plural(chosen.length, "entity", "entities")} chosen · {plural(totalSlots(slots), "slot")} in total · {plural(studentCount, "student")}
          </p>
          {chosen.length > 0 && (
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input value={chosenQuery} onChange={(e) => setChosenQuery(e.target.value)} placeholder="Search chosen entities" className="h-9 pl-8" aria-label="Search chosen entities" />
            </div>
          )}
        </div>

        {chosen.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No entities chosen yet. Add entities from the list on the right.</p>
        ) : chosenShown.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            No chosen entities match "{chosenQuery}".{" "}
            <button type="button" onClick={() => setChosenQuery("")} className="text-blue-600 hover:underline">
              Clear search
            </button>
          </p>
        ) : (
          byPlace(chosenShown).map((g, i) => (
            <div key={g.id} className={i > 0 ? "border-t-2 border-gray-100" : ""}>
              <div className="bg-gray-50 px-4 py-2">
                <p className="truncate text-sm font-bold text-gray-900">{g.name}</p>
              </div>
              {g.items.map((c) => {
                const { profile } = c.node;
                const value = slotsOf(slots, profile.id) ?? 1;
                const min = minSlots(c);
                const over = slotsOver(c, value);
                return (
                  <div key={profile.id} className="border-t border-gray-100 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <EntityTypeIcon type={profile.entityType} className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">{profile.name}</p>
                      <button
                        type="button"
                        onClick={() => onChange(removeSlot(slots, profile.id))}
                        disabled={!canRemove(c)}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title={canRemove(c) ? `Remove ${profile.name}` : `${plural(c.placed, "student")} placed here. Take them off first.`}
                        aria-label={`Remove ${profile.name}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Slots for this placement</span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={value <= min}
                          onClick={() => onChange(setSlot(slots, c, value - 1))}
                          aria-label={`Fewer slots for ${profile.name}`}
                          title={value <= min && c.placed > 0 ? `${plural(c.placed, "student")} placed here` : undefined}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          type="number"
                          min={min}
                          value={value}
                          onChange={(e) => onChange(setSlot(slots, c, parseSlots(e.target.value, min)))}
                          className="h-7 w-14 px-1 text-center"
                          aria-label={`Slots for ${profile.name}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onChange(setSlot(slots, c, value + 1))}
                          aria-label={`More slots for ${profile.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      Offers {c.places} · {c.usedElsewhere} used by other placements · {c.free} free
                      {c.placed > 0 && ` · ${plural(c.placed, "student")} placed here`}
                    </p>
                    {over > 0 && (
                      <p className="mt-1 text-[11px] font-medium text-amber-700" role="status">
                        Over by {over}. The entity has {c.free} free; you can still use {value}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-600">
            {plural(studentCount, "student")} · {plural(totalSlots(slots), "slot")}
          </p>
          {chosen.length > 0 && uncovered > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              {plural(totalSlots(slots), "slot")} for {plural(studentCount, "student")}. You can continue and add more later.
            </p>
          )}
          <Button
            type="button"
            onClick={onContinue}
            disabled={!!problem}
            title={problem ?? undefined}
            className="mt-2 w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Continue to students
          </Button>
          {problem && <p className="mt-1 text-center text-[11px] text-red-600">{problem}</p>}
          {!problem && chosen.length === 0 && (
            <p className="mt-1 text-center text-[11px] text-gray-500">
              You can continue without entities and add them later with Change entities.
            </p>
          )}
        </div>
      </div>

      {/* Right: every entity that fits, to add to the left */}
      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Entities that fit {emne ?? "this emne"}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Add the entities this placement uses, then set how many slots of each. An entity with no free places can still be used.
          </p>
          <div className="relative mt-3 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search entity or praksis place" className="h-9 pl-8" aria-label="Search entities" />
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            <p>No entity accepts {emne ?? "this emne"} for this program yet. Add or complete one under Praksis places.</p>
            {onOpenProfiles && (
              <Button type="button" size="sm" onClick={onOpenProfiles} className="mt-3 bg-blue-600 text-white hover:bg-blue-700">
                Open Praksis places
              </Button>
            )}
          </div>
        ) : notChosen.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">All entities that fit are chosen.</p>
        ) : shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            No entities match "{query}".{" "}
            <button type="button" onClick={() => setQuery("")} className="text-blue-600 hover:underline">
              Clear search
            </button>
          </p>
        ) : (
          byPlace(shown).map((g, i) => {
            return (
              <div key={g.id} className={i > 0 ? "border-t-2 border-gray-100" : ""}>
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5">
                  <p className="truncate text-sm font-bold text-gray-900">{g.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {chosenInPlace(g.id)} of {totalInPlace(g.id)} chosen
                  </p>
                </div>
                {g.items.map((c) => {
                  const { profile } = c.node;
                  const audience = programAudienceLabel(profile.programs.find((e) => !c.node.otherPrograms.includes(e.programId)) ?? profile.programs[0]);
                  return (
                    <div key={profile.id} className="flex items-start gap-3 border-t border-gray-100 px-4 py-3">
                      <EntityTypeIcon type={profile.entityType} className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {profile.name}
                          {entityTypeLabel(profile.entityType) && <span className="ml-2 text-xs font-normal text-gray-400">{entityTypeLabel(profile.entityType)}</span>}
                        </p>
                        <p className="truncate text-[11px] text-gray-500">{audience}</p>
                        <p className="mt-1 text-xs text-gray-600">
                          {c.places} {c.places === 1 ? "place" : "places"} · {c.usedElsewhere} used by other placements · <span className={c.free > 0 ? "font-medium text-green-700" : "font-medium text-amber-700"}>{c.free} free</span>
                          <span className="ml-2 text-gray-400">{c.node.periodLabel}</span>
                        </p>
                        {c.free === 0 && <p className="text-[11px] text-amber-700">Full this period. You can still use it, over by 1.</p>}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onChange(addSlot(slots, c))}
                        className="h-8 flex-shrink-0 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                        aria-label={`Add ${profile.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        <div className="flex items-start gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 rounded-b-lg">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <div className="space-y-1">
            <p>
              Can't see an entity you expected for {emne ?? "this emne"}? An entity needs a program and emner before it is offered here. Add or complete it under{" "}
              {onOpenProfiles ? (
                <button type="button" onClick={onOpenProfiles} className="text-blue-600 hover:underline">
                  Praksis places → Entities
                </button>
              ) : (
                "Praksis places → Entities"
              )}
              .
            </p>
            <p>Slots belong to this placement only. They do not change the places the entity offers.</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
