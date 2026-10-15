import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Study, emneMeta, programLabel } from "../types/studyCatalog";

// The title a placement gets when none is typed: study · program · emne · location
export const placementTitleFor = (studies: Study[], f: { studyId: string; programId: string; subject: string; location?: string }) => {
  const study = studies.find((x) => x.id === f.studyId);
  const program = study?.programs.find((p) => p.id === f.programId);
  return [study?.name, program?.name, f.subject, f.location].filter(Boolean).join(" · ");
};

const ALL_LOCATIONS = "all"; // Select items can't have an empty value

export interface MetadataFormData {
  title: string;
  year: string;
  semester: string;
  subject: string;
  startDate: string;
  endDate: string;
  students: number;
  studyId: string;
  programId: string;
  emne?: string;
  emneId?: string; // the emne's id in the catalog; `subject` keeps its name as a label
  location?: string; // optional: only the students who study here are added
  totalPraksisHours?: number;
}

interface PlacementMetadataFormProps {
  formData: MetadataFormData;
  studies: Study[];
  waitingCount: number; // students waiting in Praksis-students for the chosen emne (and location)
  locations: { name: string; count: number }[]; // study locations of the students waiting for the emne
  onChange: (data: MetadataFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function PlacementMetadataForm({
  formData,
  studies,
  waitingCount,
  locations,
  onChange,
  onSubmit,
  onCancel,
}: PlacementMetadataFormProps) {
  const availableEmner =
    studies
      .find((s) => s.id === formData.studyId)
      ?.programs.find((p) => p.id === formData.programId)?.emner ?? [];
  // Study, program and emne are mandatory (the selects aren't covered by native `required`)
  const defaultTitle = placementTitleFor(studies, formData);
  const missingSelection = !formData.studyId || !formData.programId || !formData.subject;

  return (
    <div className="px-8 py-6 max-w-3xl">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Placement Details
          </h2>
          <p className="text-sm text-gray-600">
            Choose the study, program and emne. The students waiting for it come
            from Praksis-students, with their own praksis dates.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Study *
            </label>
            <Select
              value={formData.studyId}
              onValueChange={(value: string) =>
                onChange({ ...formData, studyId: value, programId: "", subject: "", emneId: "", location: "" })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a study" />
              </SelectTrigger>
              <SelectContent>
                {studies.map((study) => (
                  <SelectItem key={study.id} value={study.id}>
                    {study.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Study Program *
            </label>
            <Select
              value={formData.programId}
              onValueChange={(value: string) =>
                onChange({ ...formData, programId: value, subject: "", emneId: "", location: "" })
              }
              disabled={!formData.studyId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {formData.studyId &&
                  studies
                    .find((s) => s.id === formData.studyId)
                    ?.programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {programLabel(program)}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Emne *
            </label>
            {/* Emne must be one of the program's emner defined in Settings */}
            <Select
              value={formData.emneId || availableEmner.find((e) => e.name === formData.subject)?.id || ""}
              onValueChange={(id) =>
                onChange({
                  ...formData,
                  emneId: id,
                  subject: availableEmner.find((e) => e.id === id)?.name ?? "",
                  location: "", // the locations on offer depend on the emne
                })
              }
              disabled={!formData.programId || availableEmner.length === 0}
            >
              <SelectTrigger className="h-10">
                <SelectValue
                  placeholder={
                    formData.programId && availableEmner.length === 0
                      ? "No emner defined for this program"
                      : "Select an emne"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableEmner.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                    {emneMeta(e).length > 0 && <span className="ml-2 text-xs text-gray-500">{emneMeta(e).join(" · ")}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.programId && availableEmner.length === 0 && (
              <p className="text-xs text-gray-500">
                Add emner to this program in Settings → Studies & Programs.
              </p>
            )}
          </div>

          {/* Always shown; the locations on offer depend on the emne, so it waits for one */}
          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Location <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Select
              value={formData.emneId ? formData.location || ALL_LOCATIONS : ""}
              onValueChange={(value: string) =>
                onChange({ ...formData, location: value === ALL_LOCATIONS ? "" : value })
              }
              disabled={!formData.emneId || locations.length === 0}
            >
              <SelectTrigger className="h-10" aria-label="Location">
                <SelectValue placeholder="Select an emne first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LOCATIONS}>All locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.name} value={l.name}>
                    {l.name}
                    <span className="ml-2 text-xs text-gray-500">{l.count} waiting</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              With a location, only the students who study there are added to the placement.
            </p>
          </div>

          {formData.emneId && (
            <p className={`text-sm ${waitingCount > 0 ? "text-gray-700" : "text-amber-700"}`}>
              {waitingCount > 0
                ? `${waitingCount} student${waitingCount === 1 ? " is" : "s are"} waiting for this emne${formData.location ? ` at ${formData.location}` : ""} in Praksis-students. They are added to the placement automatically.`
                : formData.location
                  ? `No students are waiting for this emne at ${formData.location}. Choose another location or all locations.`
                  : "No students are waiting for this emne. Import students in Praksis-students first."}
            </p>
          )}

          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Placement title <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                onChange({ ...formData, title: e.target.value })
              }
              placeholder={defaultTitle || "Built from the study, program and emne"}
              className="h-10"
            />
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={missingSelection || waitingCount === 0}
              title={
                missingSelection
                  ? "Select study, program and emne"
                  : waitingCount === 0
                    ? "No students are waiting for this emne"
                    : undefined
              }
              className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
