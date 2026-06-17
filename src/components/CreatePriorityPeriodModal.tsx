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
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "./ui/utils";
import { Users, Calendar as CalendarIcon, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { EnrolledStudent, PriorityPlacementPeriod } from "../types/priorityPlacement";

interface StudyEmne {
  id: string;
  name: string;
}

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string; emner?: StudyEmne[] }[];
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

const DEFAULT_NOTICE_MESSAGE =
  "You can now apply for priority placement for your upcoming clinical placement. Log in to the system and complete your application before the deadline.";

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

function toggleArrayItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function CreatePriorityPeriodModal({
  isOpen,
  onClose,
  onCreate,
  enrolledStudents,
  studies,
  existingPeriods,
}: CreatePriorityPeriodModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — attributes
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState<"HT" | "VT" | "">("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedEmneIds, setSelectedEmneIds] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Step 2 — first notice details
  const [noticeDate, setNoticeDate] = useState<Date | undefined>(undefined);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [message, setMessage] = useState(DEFAULT_NOTICE_MESSAGE);
  const [noticeCalOpen, setNoticeCalOpen] = useState(false);
  const [deadlineCalOpen, setDeadlineCalOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allLocations = useMemo(
    () => [...new Set(enrolledStudents.map((s) => s.studyLocation))].sort(),
    [enrolledStudents]
  );

  // Flatten every programme across all studies, labelled "Study / Programme".
  const programOptions = useMemo(() => {
    const list: {
      programId: string;
      label: string;
      studyId: string;
      studyName: string;
      emner: StudyEmne[];
    }[] = [];
    studies.forEach((study) => {
      study.programs.forEach((p) => {
        list.push({
          programId: p.id,
          label: `${study.name} / ${p.name}`,
          studyId: study.id,
          studyName: study.name,
          emner: p.emner ?? [],
        });
      });
    });
    return list;
  }, [studies]);

  const selectedProgram = useMemo(
    () => programOptions.find((p) => p.programId === selectedProgramId),
    [programOptions, selectedProgramId]
  );
  const availableEmner = selectedProgram?.emner ?? [];

  const eligibleCount = useMemo(() => {
    return enrolledStudents.filter(
      (s) =>
        (selectedProgramId === "" || s.programId === selectedProgramId) &&
        (selectedLocations.length === 0 || selectedLocations.includes(s.studyLocation))
    ).length;
  }, [enrolledStudents, selectedProgramId, selectedLocations]);

  function validateStep1() {
    const errs: Record<string, string> = {};
    if (!year) errs.year = "Select a year";
    if (!semester) errs.semester = "Select a semester";
    if (!selectedProgramId) errs.programs = "Select a programme";
    if (availableEmner.length > 0 && selectedEmneIds.length === 0)
      errs.emne = "Select at least one emne";
    if (year && semester && selectedProgram) {
      const duplicate = existingPeriods.some(
        (p) =>
          p.year === year &&
          p.semester === semester &&
          p.studyIds.includes(selectedProgram.studyId) &&
          p.programIds.includes(selectedProgramId)
      );
      if (duplicate)
        errs.duplicate =
          "A priority period with the same year, semester, study and programme already exists.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2() {
    const errs: Record<string, string> = {};
    // Noticing students date and application deadline are optional and can be set later
    // from the priorities table. Only validate ordering when both are provided.
    if (noticeDate && deadline && deadline <= noticeDate)
      errs.deadline = "Deadline must be after the noticing students date";
    if (!message.trim()) errs.message = "Enter a message";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep1()) setStep(2);
  }

  function handleBack() {
    setErrors({});
    setStep(1);
  }

  function handleCreate() {
    if (!validateStep2() || !selectedProgram) return;
    onCreate({
      year,
      semester: semester as "HT" | "VT",
      programIds: [selectedProgramId],
      studyIds: [selectedProgram.studyId],
      emneIds: selectedEmneIds,
      admissionTerms: [],
      studyLocations: selectedLocations.length === 0 ? allLocations : selectedLocations,
      status: "open",
      importedStudentIds: [],
      firstNoticeDate: noticeDate ? noticeDate.toISOString().split("T")[0] : undefined,
      firstNoticeDeadline: deadline ? deadline.toISOString().split("T")[0] : undefined,
      firstNoticeMessage: message.trim(),
    });
    handleClose();
  }

  function handleClose() {
    setStep(1);
    setYear("");
    setSemester("");
    setSelectedProgramId("");
    setSelectedEmneIds([]);
    setSelectedLocations([]);
    setNoticeDate(undefined);
    setDeadline(undefined);
    setMessage(DEFAULT_NOTICE_MESSAGE);
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create application period</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
              step === 1
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-green-50 text-green-700 border-green-200"
            )}
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/70 text-[10px] font-bold">
              1
            </span>
            Details
          </span>
          <span className="h-px w-4 bg-gray-300" />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
              step === 2
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            )}
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/70 text-[10px] font-bold">
              2
            </span>
            First notice
          </span>
        </div>

        {step === 1 ? (
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

            {/* Programme (Study / Programme) */}
            <div>
              <Label>
                Programme <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedProgramId}
                onValueChange={(val: string) => {
                  setSelectedProgramId(val);
                  setSelectedEmneIds([]);
                  setErrors((e) => ({ ...e, programs: "", emne: "" }));
                }}
              >
                <SelectTrigger className={cn("mt-1", errors.programs && "border-red-400")}>
                  <SelectValue placeholder="Select study / programme" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((p) => (
                    <SelectItem key={p.programId} value={p.programId}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.programs && <p className="text-xs text-red-500 mt-1">{errors.programs}</p>}
            </div>

            {/* Emne (depends on selected programme) */}
            {selectedProgramId !== "" && (
              <div>
                <Label>
                  Emne <span className="text-red-500">*</span>
                </Label>
                {availableEmner.length === 0 ? (
                  <p className="text-sm text-gray-400 mt-1 italic">
                    No emne available for this programme.
                  </p>
                ) : (
                  <div
                    className={cn(
                      "mt-1 space-y-2 max-h-40 overflow-y-auto rounded-md border p-3",
                      errors.emne ? "border-red-400" : "border-gray-200"
                    )}
                  >
                    {availableEmner.map((emne) => (
                      <div key={emne.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`emne-${emne.id}`}
                          checked={selectedEmneIds.includes(emne.id)}
                          onCheckedChange={() => {
                            setSelectedEmneIds((prev) => toggleArrayItem(prev, emne.id));
                            setErrors((e) => ({ ...e, emne: "" }));
                          }}
                        />
                        <Label
                          htmlFor={`emne-${emne.id}`}
                          className="font-normal cursor-pointer text-sm"
                        >
                          {emne.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {errors.emne && <p className="text-xs text-red-500 mt-1">{errors.emne}</p>}
              </div>
            )}

            {/* Study locations (multi-select) */}
            <div>
              <Label>Study locations</Label>
              <div className="mt-1 space-y-2 max-h-40 overflow-y-auto rounded-md border border-gray-200 p-3">
                {allLocations.map((loc) => (
                  <div key={loc} className="flex items-center gap-2">
                    <Checkbox
                      id={`loc-${loc}`}
                      checked={selectedLocations.includes(loc)}
                      onCheckedChange={() =>
                        setSelectedLocations((prev) => toggleArrayItem(prev, loc))
                      }
                    />
                    <Label htmlFor={`loc-${loc}`} className="font-normal cursor-pointer text-sm">
                      {loc}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to include all locations.
              </p>
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
        ) : (
          <div className="space-y-5 py-2">
            <p className="text-sm text-gray-500">
              Set when students are notified and when their applications are due. These details
              are saved with the period.
            </p>

            {/* Noticing students date */}
            <div>
              <Label>
                Noticing students date{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Popover open={noticeCalOpen} onOpenChange={setNoticeCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !noticeDate && "text-gray-400",
                      errors.noticeDate && "border-red-400"
                    )}
                  >
                    <CalendarIcon size={16} className="mr-2" />
                    {noticeDate ? format(noticeDate, "d MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={noticeDate}
                    onSelect={(d: Date | undefined) => {
                      setNoticeDate(d);
                      setNoticeCalOpen(false);
                      setErrors((e) => ({ ...e, noticeDate: "" }));
                    }}
                    disabled={(d: Date) => d < today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.noticeDate && (
                <p className="text-xs text-red-500 mt-1">{errors.noticeDate}</p>
              )}
            </div>

            {/* Application deadline */}
            <div>
              <Label>
                Application deadline{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Popover open={deadlineCalOpen} onOpenChange={setDeadlineCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !deadline && "text-gray-400",
                      errors.deadline && "border-red-400"
                    )}
                  >
                    <CalendarIcon size={16} className="mr-2" />
                    {deadline ? format(deadline, "d MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(d: Date | undefined) => {
                      setDeadline(d);
                      setDeadlineCalOpen(false);
                      setErrors((e) => ({ ...e, deadline: "" }));
                    }}
                    disabled={(d: Date) => (noticeDate ? d <= noticeDate : d < today)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.deadline && (
                <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>
              )}
            </div>

            {/* Message to students */}
            <div>
              <Label htmlFor="notice-message">
                Message to students <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="notice-message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrors((err) => ({ ...err, message: "" }));
                }}
                rows={4}
                className={cn("mt-1", errors.message && "border-red-400")}
              />
              {errors.message && (
                <p className="text-xs text-red-500 mt-1">{errors.message}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleNext}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack} className="flex items-center gap-1">
                <ChevronLeft size={14} />
                Back
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate}>
                Create period
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
