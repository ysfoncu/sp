import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../ui/utils";
import { emneMeta, findProgram, programLabel, useStudyCatalog } from "../../types/studyCatalog";
import { periodLabel, usePlacePeriod } from "../../types/placePeriod";
import { placesError } from "../../types/profileRules";
import { AcceptedProgram, PlacementProfile, setProgramEntry, updateProfile } from "../../types/placementProfile";
import { AcceptedProgramTree } from "../AcceptedProgramTree";
import { SectionCard, EmptyHint } from "./SectionCard";
import { useDirtyGuard } from "../../navGuard";
import { programEntryDirty } from "../../types/entityDirty";
import { useLockedEmneIds, usePlacedOnProfile } from "../ProfileUsageContext";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The programs an entity accepts. Each program is a card of its own: the emner of the program the entity takes and
// the places it offers to students of that program (places are counted per program). A card is edited and saved
// on its own; "Add program" opens a new card on the page.
export function AcceptedProgramsSection({ entity, placeName, missing }: { entity: PlacementProfile; placeName: string; missing: { label: string; programId?: string }[] }) {
  const period = usePlacePeriod(entity.praksisPlaceId);
  const { active: studies } = useStudyCatalog();
  const [adding, setAdding] = useState(false);
  const used = entity.programs.map((e) => e.programId);
  const free = studies.flatMap((s) => s.programs).filter((p) => !used.includes(p.id));

  return (
    <section id="entity-programs" aria-label="Accepted programs" className="scroll-mt-16 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Accepted programs</h4>
          <p className="text-xs text-gray-500">
            The programs this entity takes students from, with the emner and the places for each. Period: <span className="font-medium text-gray-700">{periodLabel(period)}</span> (set for {placeName}). Places are a guide for planning and never block a placement.
          </p>
        </div>
        {!adding && entity.programs.length > 0 && (
          <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs" onClick={() => setAdding(true)} disabled={free.length === 0} title={free.length === 0 ? "Every program is already added" : undefined}>
            <Plus className="h-3 w-3" />
            Add program
          </Button>
        )}
      </div>

      {entity.programs.length === 0 && !adding && (
        <div className="rounded-lg border border-amber-200 bg-white px-4 py-3">
          <EmptyHint>
            {free.length === 0 && studies.length === 0 ? "There are no programs yet. Add one under Settings → Studies & Programs." : "No program yet. Add the programs this entity takes students from."}
          </EmptyHint>
          <Button type="button" size="sm" className="mt-3 gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={() => setAdding(true)} disabled={free.length === 0}>
            <Plus className="h-3.5 w-3.5" />
            Add program
          </Button>
        </div>
      )}

      {entity.programs.map((e) => (
        <ProgramCard
          key={e.programId}
          entity={entity}
          entry={e}
          missing={missing.filter((m) => m.programId === e.programId).map((m) => (m.key === "emner" ? "Emner missing" : "Program missing")).join(", ") || undefined}
        />
      ))}

      {adding && <ProgramCard entity={entity} onClose={() => setAdding(false)} />}
    </section>
  );
}

// One accepted program. Without `entry` it is a new card, open for editing from the start.
function ProgramCard({ entity, entry, missing, onClose }: { entity: PlacementProfile; entry?: AcceptedProgram; missing?: string; onClose?: () => void }) {
  const { active: studies } = useStudyCatalog();
  const placedFor = usePlacedOnProfile();
  const lockedFor = useLockedEmneIds();
  const [editing, setEditing] = useState(!entry);
  const [programId, setProgramId] = useState(entry?.programId ?? "");
  const [emneIds, setEmneIds] = useState(entry?.emneIds ?? []);
  const [places, setPlaces] = useState(String(entry?.places ?? 0));

  const placed = entry ? placedFor(entity, entry.programId) : { total: 0, peak: 0 };
  const lockedEmner = entry ? lockedFor(entity, entry.programId) : [];
  const typedPlaces = Math.max(0, parseInt(places, 10) || 0);
  const tooLow = placesError(typedPlaces, placed.peak);
  const taken = entity.programs.map((e) => e.programId).filter((id) => id !== entry?.programId);

  const found = programId ? findProgram(programId) : undefined;
  const programOptions = studies.flatMap((s) => s.programs);
  const archivedCurrent = !!found && !programOptions.some((p) => p.id === programId);
  const emneChoices = (found?.program.emner ?? []).filter((e) => !e.archived || emneIds.includes(e.id));
  const needsEmner = emneChoices.some((e) => !e.archived);
  const noEmner = needsEmner && !emneIds.some((id) => emneChoices.some((e) => e.id === id && !e.archived));
  const reason = !found ? "Choose a program" : noEmner ? "Tick at least one emne" : tooLow;

  const title = found ? programLabel(found.program) : entry ? "Unknown program" : "New program";
  useDirtyGuard(`entity-program-${entry?.programId ?? "new"}`, found ? `Program ${found.program.name}` : "New program", editing && programEntryDirty({ programId, emneIds, places }, entry));

  const start = () => {
    setProgramId(entry!.programId);
    setEmneIds(entry!.emneIds);
    setPlaces(String(entry!.places));
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    onClose?.();
  };
  const save = () => {
    if (reason) return;
    setProgramEntry(entity.id, { programId, emneIds, places: typedPlaces });
    setEditing(false);
    toast.success(entry ? `${found?.program.name}: saved` : `${found?.program.name} added`);
    onClose?.();
  };
  const remove = () => {
    const before = entity.programs;
    updateProfile(entity.id, { programs: before.filter((e) => e.programId !== entry!.programId) });
    toast(`${found?.program.name ?? "Program"} removed from ${entity.name}`, { action: { label: "Undo", onClick: () => updateProfile(entity.id, { programs: before }) } });
  };

  return (
    <SectionCard
      id={entry ? `program-${entry.programId}` : "program-new"}
      title={title}
      missing={missing}
      editing={editing}
      onEdit={entry ? start : undefined}
      onCancel={cancel}
      onSave={save}
      saveDisabled={!!reason}
      saveHint={reason}
    >
      {!editing && entry ? (
        <>
          <AcceptedProgramTree programId={entry.programId} emneIds={entry.emneIds} showRequirements />
          {entry.emneIds.length === 0 && missing?.includes("Emner") && <EmptyHint>No emne is picked. Press Edit and tick the emner students of this program are placed in.</EmptyHint>}
          <p className="text-sm text-gray-900">
            <span className={cn("text-lg font-semibold", entry.places > 0 ? "text-purple-600" : "text-gray-500")}>{entry.places}</span> {entry.places === 1 ? "place" : "places"} per period
            {placed.peak > 0 && <span className={cn("ml-2 text-xs", placed.peak > entry.places ? "text-red-600" : "text-gray-500")}>{placed.peak} placed in the busiest period{placed.peak > entry.places ? ` (over by ${placed.peak - entry.places})` : ""}</span>}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {placed.total > 0 ? (
              <p className="text-xs text-gray-500">{plural(placed.total, "student is", "students are")} placed here from this program, so it can't be removed and the emner they use stay.</p>
            ) : (
              <span />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-gray-600 hover:text-red-700"
              disabled={placed.total > 0}
              title={placed.total > 0 ? `${plural(placed.total, "student is", "students are")} placed here from this program. Take them off in the placement first.` : undefined}
              onClick={remove}
              aria-label={`Remove ${title}`}
            >
              <Trash2 className="h-3 w-3" />
              Remove program
            </Button>
          </div>
        </>
      ) : (
        <>
          {!entry && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Program</label>
              <Select
                value={programId}
                onValueChange={(id) => {
                  if (id === programId) return;
                  setProgramId(id);
                  setEmneIds(activeEmnesOf(id)); // emner belong to one program; start with all of them ticked
                }}
              >
                <SelectTrigger className="bg-white border-gray-300 sm:w-[340px]" aria-label="Program">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {studies
                    .filter((s) => s.programs.some((p) => !taken.includes(p.id)))
                    .map((study) => (
                      <SelectGroup key={study.id}>
                        <SelectLabel>{study.name}</SelectLabel>
                        {study.programs
                          .filter((p) => !taken.includes(p.id))
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {programLabel(p)}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                  {archivedCurrent && found && <SelectItem value={programId}>{found.program.name} (archived)</SelectItem>}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">An entity takes each program once. The programs it already has are not listed.</p>
            </div>
          )}
          {found && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Accepted emner</label>
              {emneChoices.length === 0 ? (
                <p className="text-sm text-gray-500">This program has no emner, so the entity covers all of it.</p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                    <Checkbox
                      checked={emneChoices.every((e) => emneIds.includes(e.id))}
                      onCheckedChange={(on) => setEmneIds(on ? emneChoices.map((e) => e.id) : emneIds.filter((id) => lockedEmner.includes(id)))}
                    />
                    Select all emner of {found.program.name}
                  </label>
                  {emneChoices.map((emne) => {
                    const locked = lockedEmner.includes(emne.id);
                    return (
                      <label key={emne.id} className={cn("flex flex-wrap items-center gap-2 px-3 py-2 pl-8 text-sm", locked ? "cursor-not-allowed" : "cursor-pointer")} title={locked ? "Students are placed here under this emne" : undefined}>
                        <Checkbox
                          checked={emneIds.includes(emne.id)}
                          disabled={locked}
                          onCheckedChange={(on) => setEmneIds((prev) => (on ? [...prev, emne.id] : prev.filter((x) => x !== emne.id)))}
                        />
                        {emne.name}
                        {emneMeta(emne).length > 0 && <span className="text-xs text-gray-500">{emneMeta(emne).join(" · ")}</span>}
                        {emne.archived && <span className="text-xs text-gray-400">(archived)</span>}
                        {emne.requirement && <span className="basis-full pl-7 text-xs text-amber-800">Requirement: {emne.requirement}</span>}
                        {locked && <span className="text-xs text-gray-500">(students placed)</span>}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {found && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Places per period for {found.program.name}</label>
              <Input
                type="number"
                min={0}
                value={places}
                aria-label={`Places per period for ${found.program.name}`}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPlaces(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                className="w-28 bg-white border-gray-300 text-center"
              />
              <p className="mt-1 text-xs text-gray-500">Only students of this program use these places. A guide for planning; it never stops a placement.</p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

// The emner of a program that can be picked (archived ones can't)
const activeEmnesOf = (programId: string) => (findProgram(programId)?.program.emner ?? []).filter((e) => !e.archived).map((e) => e.id);
