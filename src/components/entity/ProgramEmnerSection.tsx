import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { emneMeta, findProgram, programLabel, useStudyCatalog } from "../../types/studyCatalog";
import { PlacementProfile, updateProfile } from "../../types/placementProfile";
import { AcceptedProgramTree } from "../AcceptedProgramTree";
import { SectionCard, EmptyHint } from "./SectionCard";
import { useDirtyGuard } from "../../navGuard";
import { programDirty } from "../../types/entityDirty";

// The program the entity is for and the emner of it that it accepts. Shown as a tree; Edit changes both and
// Save stores them together.
export function ProgramEmnerSection({ entity, placedTotal, missing }: { entity: PlacementProfile; placedTotal: number; missing?: string }) {
  const { active: studies } = useStudyCatalog();
  const [editing, setEditing] = useState(false);
  const [programId, setProgramId] = useState(entity.programId);
  const [emneIds, setEmneIds] = useState(entity.emneIds);
  const locked = placedTotal > 0;
  useDirtyGuard("entity-program", "Program and emner", editing && programDirty({ programId, emneIds }, entity));

  const start = () => {
    setProgramId(entity.programId);
    setEmneIds(entity.emneIds);
    setEditing(true);
  };

  const current = programId ? findProgram(programId) : undefined;
  const programOptions = studies.flatMap((s) => s.programs);
  const archivedCurrent = !!current && !programOptions.some((p) => p.id === programId);
  const emneChoices = (current?.program.emner ?? []).filter((e) => !e.archived || emneIds.includes(e.id));
  const needsEmner = emneChoices.some((e) => !e.archived);
  const reason = !current ? "Choose a program" : needsEmner && !emneIds.some((id) => emneChoices.some((e) => e.id === id && !e.archived)) ? "Tick at least one emne" : undefined;

  const save = () => {
    if (!current) return;
    updateProfile(entity.id, { studyId: current.study.id, programId, emneIds });
    setEditing(false);
    toast.success("Program and emner saved");
  };

  return (
    <SectionCard
      id="program"
      title="Program and emner"
      missing={missing}
      editing={editing}
      onEdit={start}
      editDisabled={locked ? `${placedTotal} student${placedTotal === 1 ? " is" : "s are"} placed here, so the program and emner can't change. Make a new entity instead.` : undefined}
      onCancel={() => setEditing(false)}
      onSave={save}
      saveDisabled={!!reason}
      saveHint={reason}
    >
      {!editing ? (
        entity.programId ? (
          <>
            <AcceptedProgramTree programId={entity.programId} emneIds={entity.emneIds} />
            {missing && <EmptyHint>No emne is picked. Press Edit and tick the emner students of this entity are placed in.</EmptyHint>}
            {locked && <p className="text-xs text-gray-500">{placedTotal} student{placedTotal === 1 ? " is" : "s are"} placed here, so the program and emner are locked.</p>}
          </>
        ) : (
          <EmptyHint>{programOptions.length === 0 ? "There are no programs yet. Add one under Settings → Studies & Programs." : "No program yet. Press Edit to choose the program this entity takes students from."}</EmptyHint>
        )
      ) : (
        <>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Program</label>
            <Select
              value={programId}
              onValueChange={(id) => {
                if (id === programId) return;
                setProgramId(id);
                setEmneIds([]); // emner belong to one program
              }}
            >
              <SelectTrigger className="bg-white border-gray-300 sm:w-[340px]" aria-label="Program">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {studies
                  .filter((s) => s.programs.length > 0)
                  .map((study) => (
                    <SelectGroup key={study.id}>
                      <SelectLabel>{study.name}</SelectLabel>
                      {study.programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {programLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                {archivedCurrent && current && <SelectItem value={programId}>{current.program.name} (archived)</SelectItem>}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">An entity is for one program. Changing it clears the emner below until you save or cancel.</p>
          </div>
          {current && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Accepted emner</label>
              {emneChoices.length === 0 ? (
                <p className="text-sm text-gray-500">This program has no emner, so the entity covers all of it.</p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                    <Checkbox checked={emneChoices.every((e) => emneIds.includes(e.id))} onCheckedChange={(on) => setEmneIds(on ? emneChoices.map((e) => e.id) : [])} />
                    Select all emner of {current.program.name}
                  </label>
                  {emneChoices.map((emne) => (
                    <label key={emne.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 pl-8 text-sm">
                      <Checkbox checked={emneIds.includes(emne.id)} onCheckedChange={(on) => setEmneIds((prev) => (on ? [...prev, emne.id] : prev.filter((x) => x !== emne.id)))} />
                      {emne.name}
                      {emneMeta(emne).length > 0 && <span className="text-xs text-gray-500">{emneMeta(emne).join(" · ")}</span>}
                      {emne.archived && <span className="text-xs text-gray-400">(archived)</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
