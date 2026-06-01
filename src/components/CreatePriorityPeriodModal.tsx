import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "./ui/utils";
import { Users } from "lucide-react";
import { EnrolledStudent, PriorityPlacementPeriod } from "../types/priorityPlacement";

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string }[];
}

interface CreatePriorityPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    period: Omit<
      PriorityPlacementPeriod,
      "id" | "createdDate" | "createdBy" | "eligibleStudentIds" | "deadline"
    >
  ) => void;
  enrolledStudents: EnrolledStudent[];
  studies: Study[];
  currentUserName: string;
  existingPeriods: PriorityPlacementPeriod[];
}

function RadioOption({
  id,
  name,
  value,
  checked,
  label,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors ${
        checked
          ? "border-blue-400 bg-blue-50 text-blue-800"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-blue-600 shrink-0"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function CreatePriorityPeriodModal({
  isOpen,
  onClose,
  onCreate,
  enrolledStudents,
  studies,
  existingPeriods,
}: CreatePriorityPeriodModalProps) {
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState<"HT" | "VT" | "">("");
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allLocations = useMemo(
    () => [...new Set(enrolledStudents.map((s) => s.studyLocation))].sort(),
    [enrolledStudents]
  );

  const availablePrograms = useMemo(() => {
    if (!selectedStudyId) return [];
    return studies.find((s) => s.id === selectedStudyId)?.programs ?? [];
  }, [studies, selectedStudyId]);

  const eligibleCount = useMemo(() => {
    return enrolledStudents.filter(
      (s) =>
        (selectedStudyId === "" || s.studyId === selectedStudyId) &&
        (selectedProgramId === "" || s.programId === selectedProgramId) &&
        (selectedLocation === "" || s.studyLocation === selectedLocation)
    ).length;
  }, [enrolledStudents, selectedStudyId, selectedProgramId, selectedLocation]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!year) errs.year = "Select a year";
    if (!semester) errs.semester = "Select a semester";
    if (!selectedStudyId) errs.study = "Select a study";
    if (!selectedProgramId) errs.programs = "Select a programme";
    if (year && semester && selectedStudyId && selectedProgramId) {
      const duplicate = existingPeriods.some(
        (p) =>
          p.year === year &&
          p.semester === semester &&
          p.studyIds.includes(selectedStudyId) &&
          p.programIds.includes(selectedProgramId)
      );
      if (duplicate) errs.duplicate = "A priority period with the same year, semester, study and programme already exists.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleCreate() {
    if (!validate()) return;
    onCreate({
      year,
      semester: semester as "HT" | "VT",
      programIds: [selectedProgramId],
      studyIds: [selectedStudyId],
      admissionTerms: [],
      studyLocations: selectedLocation === "" ? allLocations : [selectedLocation],
      status: "open",
      importedStudentIds: [],
    });
    handleClose();
  }

  function handleClose() {
    setYear("");
    setSemester("");
    setSelectedStudyId("");
    setSelectedProgramId("");
    setSelectedLocation("");
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create application period</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Year */}
          <div>
            <Label>
              Year <span className="text-red-500">*</span>
            </Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className={cn("mt-1", errors.year && "border-red-400")}>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {["2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
          </div>

          {/* Semester */}
          <div>
            <Label>
              Semester <span className="text-red-500">*</span>
            </Label>
            {errors.semester && (
              <p className="text-xs text-red-500 mt-1">{errors.semester}</p>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <RadioOption
                id="sem-autumn"
                name="semester"
                value="HT"
                checked={semester === "HT"}
                label="Autumn"
                onChange={() => setSemester("HT")}
              />
              <RadioOption
                id="sem-spring"
                name="semester"
                value="VT"
                checked={semester === "VT"}
                label="Spring"
                onChange={() => setSemester("VT")}
              />
            </div>
          </div>

          {/* Study */}
          <div>
            <Label>
              Study <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedStudyId}
              onValueChange={(val: string) => {
                setSelectedStudyId(val);
                setSelectedProgramId("");
              }}
            >
              <SelectTrigger className={cn("mt-1", errors.study && "border-red-400")}>
                <SelectValue placeholder="Select study" />
              </SelectTrigger>
              <SelectContent>
                {studies.map((study) => (
                  <SelectItem key={study.id} value={study.id}>
                    {study.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.study && <p className="text-xs text-red-500 mt-1">{errors.study}</p>}
          </div>

          {/* Programme */}
          <div>
            <Label>
              Programme <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedProgramId}
              onValueChange={setSelectedProgramId}
              disabled={!selectedStudyId}
            >
              <SelectTrigger className={cn("mt-1", errors.programs && "border-red-400")}>
                <SelectValue placeholder={selectedStudyId ? "Select programme" : "Select a study first"} />
              </SelectTrigger>
              <SelectContent>
                {availablePrograms.map((prog) => (
                  <SelectItem key={prog.id} value={prog.id}>
                    {prog.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.programs && <p className="text-xs text-red-500 mt-1">{errors.programs}</p>}
          </div>

          {/* Study location */}
          <div>
            <Label>Study location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                {allLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duplicate error */}
          {errors.duplicate && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {errors.duplicate}
            </div>
          )}

          {/* Eligible count */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <Users size={16} className="text-blue-600 shrink-0" />
            <span className="text-sm text-blue-700">
              <span className="font-semibold">{eligibleCount}</span> eligible students with
              current selection
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate}>
            Create period
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
