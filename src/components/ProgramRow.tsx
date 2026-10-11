import { useState } from "react";
import { Archive, ArchiveRestore, BookOpen, Layers, Pencil, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import {
  Study,
  StudyEmne,
  StudyProgram,
  MAX_TERM,
  addEmne,
  emneMeta,
  setEmneArchived,
  setProgramArchived,
  updateEmne,
  updateProgram,
  validateEmne,
  validateProgram,
} from "../types/studyCatalog";

const field = "mb-1 block text-xs font-semibold text-gray-700";

// The name and code of a program, edited in place
function ProgramForm({ study, program, onClose }: { study: Study; program: StudyProgram; onClose: () => void }) {
  const [name, setName] = useState(program.name);
  const [code, setCode] = useState(program.code ?? "");
  const errors = validateProgram({ name, code }, study.programs.filter((p) => p.id !== program.id));
  const save = () => {
    if (errors.length > 0) return;
    updateProgram(study.id, program.id, { name, code });
    onClose();
  };
  return (
    <div className="mt-2 space-y-3 rounded-lg border border-blue-200 bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <div>
          <label className={field}>Program name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} aria-label="Program name" autoFocus />
        </div>
        <div>
          <label className={field}>Program code</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="e.g. SYK-B" aria-label="Program code" />
        </div>
      </div>
      {errors.length > 0 && <p className="text-xs text-red-600">{errors[0]}</p>}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={save} disabled={errors.length > 0}>
          Save
        </Button>
      </div>
    </div>
  );
}

// Make or change one emne: the practice course of a program
function EmneForm({ study, program, emne, onClose }: { study: Study; program: StudyProgram; emne?: StudyEmne; onClose: () => void }) {
  const [name, setName] = useState(emne?.name ?? "");
  const [code, setCode] = useState(emne?.code ?? "");
  const [term, setTerm] = useState(emne?.term ? String(emne.term) : "");
  const [subject, setSubject] = useState(emne?.subject ?? "");
  const [pair, setPair] = useState(!!emne?.pairPlacement);
  const [startTerm, setStartTerm] = useState(emne?.startTerm ?? "");

  const termNumber = term.trim() === "" ? undefined : Number(term);
  const errors = validateEmne({ name, code, term: termNumber }, (program.emner ?? []).filter((e) => e.id !== emne?.id));

  const save = () => {
    if (errors.length > 0) return;
    const input = { name, code, term: termNumber, subject, pairPlacement: pair, startTerm };
    if (emne) updateEmne(study.id, program.id, emne.id, input);
    else addEmne(study.id, program.id, input);
    onClose();
  };
  const enter = (e: React.KeyboardEvent) => e.key === "Enter" && save();

  return (
    <div className="space-y-3 rounded-lg border border-violet-200 bg-white p-3" aria-label={emne ? "Edit emne" : "Add emne"}>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_100px]">
        <div>
          <label className={field}>
            Emne name <span className="text-red-500">*</span>
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={enter} placeholder="e.g. Praksis 2 – Medisinsk sykepleie" aria-label="Emne name" autoFocus />
        </div>
        <div>
          <label className={field}>Course code</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={enter} placeholder="e.g. NSK201" aria-label="Course code" />
        </div>
        <div>
          <label className={field}>Term</label>
          <Input type="number" min={1} max={MAX_TERM} value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={enter} placeholder="1–12" aria-label="Term in the program" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={field}>Subject</label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} onKeyDown={enter} placeholder="e.g. Medical ward, Nursing home" aria-label="Subject" />
        </div>
        <div>
          <label className={field}>Start term</label>
          <Input value={startTerm} onChange={(e) => setStartTerm(e.target.value)} onKeyDown={enter} placeholder="e.g. 2026 Høst" aria-label="Start term" />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <Checkbox checked={pair} onCheckedChange={(on) => setPair(!!on)} aria-label="Pair placement requested" />
        Pair placement requested (two students on the same entity)
      </label>
      {errors.length > 0 && name.trim() !== "" && <p className="text-xs text-red-600">{errors[0]}</p>}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={save} disabled={errors.length > 0}>
          {emne ? "Save" : "Add emne"}
        </Button>
      </div>
    </div>
  );
}

// One program in Settings: its name and code, and its emner as rows that can be edited in place
export function ProgramRow({ study, program }: { study: Study; program: StudyProgram }) {
  const [editingProgram, setEditingProgram] = useState(false);
  const [emneForm, setEmneForm] = useState<{ emneId?: string } | null>(null); // {} = adding

  return (
    <div className={`rounded border border-gray-200 bg-white p-2 transition-colors hover:border-gray-300 ${program.archived ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{program.name}</span>
          {program.code && (
            <Badge variant="outline" className="text-xs text-gray-600">
              {program.code}
            </Badge>
          )}
          {program.archived && (
            <Badge variant="outline" className="text-xs text-gray-500">
              Archived
            </Badge>
          )}
        </div>
        <div className="flex items-center">
          {!program.archived && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100" title="Edit program name and code" aria-label={`Edit ${program.name}`} onClick={() => setEditingProgram(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100" title={program.archived ? "Restore program" : "Archive program"} onClick={() => setProgramArchived(study.id, program.id, !program.archived)}>
            {program.archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {editingProgram && <ProgramForm study={study} program={program} onClose={() => setEditingProgram(false)} />}

      <div className="ml-6 mt-2 space-y-1.5">
        {(program.emner ?? []).map((emne) =>
          emneForm?.emneId === emne.id ? (
            <EmneForm key={emne.id} study={study} program={program} emne={emne} onClose={() => setEmneForm(null)} />
          ) : (
            <div key={emne.id} className={`flex items-center justify-between gap-2 rounded-md border border-violet-100 bg-violet-50/50 px-2.5 py-1.5 ${emne.archived ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm text-violet-900">
                  <Layers className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{emne.name}</span>
                  {emne.archived && <span className="text-xs text-gray-500">(archived)</span>}
                </p>
                {emneMeta(emne).length > 0 && <p className="ml-[18px] text-xs text-gray-600">{emneMeta(emne).join(" · ")}</p>}
              </div>
              <div className="flex flex-shrink-0 items-center">
                {!emne.archived && (
                  <button type="button" onClick={() => setEmneForm({ emneId: emne.id })} className="rounded p-1 text-violet-700 hover:bg-violet-100" title="Edit emne" aria-label={`Edit ${emne.name}`}>
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button type="button" onClick={() => setEmneArchived(study.id, program.id, emne.id, !emne.archived)} className="rounded p-1 text-violet-700 hover:bg-violet-100" title={emne.archived ? "Restore emne" : "Archive emne"} aria-label={`${emne.archived ? "Restore" : "Archive"} ${emne.name}`}>
                  {emne.archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                </button>
              </div>
            </div>
          ),
        )}
        {emneForm && !emneForm.emneId ? (
          <EmneForm study={study} program={program} onClose={() => setEmneForm(null)} />
        ) : (
          <Button size="sm" variant="outline" className="h-7 gap-1 border-violet-300 text-violet-600 hover:bg-violet-50" onClick={() => setEmneForm({})}>
            <Plus className="h-3 w-3" />
            Add Emne
          </Button>
        )}
      </div>
    </div>
  );
}
