import { useMemo, useState } from "react";
import { ArrowLeft, Calendar as CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { cn } from "./ui/utils";
import { StepInfoBanner } from "./StepInfoBanner";
import { EnrolledStudent, PriorityPlacementPeriod } from "../types/priorityPlacement";
import { emneLocations, periodStudents, periodTerm } from "../types/enrolledFromPraksis";

interface StudyEmne {
  id: string;
  name: string;
  startTerm?: string;
}

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string; emner?: StudyEmne[] }[];
}

interface CreatePriorityPeriodViewProps {
  studies: Study[];
  enrolledStudents: EnrolledStudent[]; // the students of Praksis-students
  existingPeriods: PriorityPlacementPeriod[];
  onCreate: (period: Omit<PriorityPlacementPeriod, "id" | "createdDate" | "createdBy" | "eligibleStudentIds" | "deadline">) => void;
  onBack: () => void; // back to the Priorities list
}

const DEFAULT_NOTICE_MESSAGE =
  "You can now apply for priority placement for your upcoming clinical placement. Log in to the system and complete your application before the deadline.";

// Creating a priority list goes the way creating a placement does: a page, not a dialog. Step 1 chooses the study,
// program, emne and an optional location (the students come from Praksis-students); step 2 has the priority details
// (the dates and the message). Back on step 2 returns to the choices, back on step 1 returns to the Priorities list.
export function CreatePriorityPeriodView({ studies, enrolledStudents, existingPeriods, onCreate, onBack }: CreatePriorityPeriodViewProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [studyId, setStudyId] = useState("");
  const [programId, setProgramId] = useState("");
  const [emneId, setEmneId] = useState("");
  const [location, setLocation] = useState(""); // "" = all locations

  // Step 2
  const [noticeDate, setNoticeDate] = useState<Date | undefined>(undefined);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [message, setMessage] = useState(DEFAULT_NOTICE_MESSAGE);
  const [noticeCalOpen, setNoticeCalOpen] = useState(false);
  const [deadlineCalOpen, setDeadlineCalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const study = studies.find((x) => x.id === studyId);
  const program = study?.programs.find((p) => p.id === programId);
  const availableEmner = program?.emner ?? [];
  const emne = availableEmner.find((e) => e.id === emneId);

  // The students of the emne in Praksis-students (at the location, when one is chosen), and the period they give
  const locations = useMemo(() => (emneId ? emneLocations(enrolledStudents, emneId) : []), [enrolledStudents, emneId]);
  const students = useMemo(() => (emneId ? periodStudents(enrolledStudents, emneId, location || undefined) : []), [enrolledStudents, emneId, location]);
  const term = useMemo(() => periodTerm(students), [students]);

  const duplicate =
    !!term &&
    existingPeriods.some(
      (p) =>
        p.year === term.year &&
        p.semester === term.semester &&
        p.studyIds.includes(studyId) &&
        p.programIds.includes(programId) &&
        (p.emneIds ?? []).includes(emneId) &&
        p.studyLocations.some((l) => (location ? l === location : true))
    );
  const step1Problem = !studyId || !programId || !emneId
    ? "Select study, program and emne"
    : students.length === 0
      ? "No students are waiting for this emne"
      : duplicate
        ? "A priority list for this emne, semester and location already exists"
        : null;

  function validateStep2() {
    const errs: Record<string, string> = {};
    // The dates are optional and can be set later from the list; only their order is checked
    if (noticeDate && deadline && deadline <= noticeDate) errs.deadline = "Deadline must be after the noticing students date";
    if (!message.trim()) errs.message = "Enter a message";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleCreate() {
    if (!validateStep2() || !study || !term) return;
    onCreate({
      year: term.year,
      semester: term.semester,
      programIds: [programId],
      studyIds: [studyId],
      emneIds: [emneId],
      admissionTerms: [],
      studyLocations: location ? [location] : [...new Set(students.map((x) => x.studyLocation))].sort(),
      status: "open",
      importedStudentIds: students.map((x) => x.id), // the list takes the students from Praksis-students
      firstNoticeDate: noticeDate ? noticeDate.toISOString().split("T")[0] : undefined,
      firstNoticeDeadline: deadline ? deadline.toISOString().split("T")[0] : undefined,
      firstNoticeMessage: message.trim(),
    });
  }

  const title = [study?.name, program?.name, emne?.name, location].filter(Boolean).join(" · ");

  return (
    <div className="w-full">
      {/* Header, as on a new placement: back arrow, breadcrumb, title and the step */}
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Priorities"
            className="flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={onBack} className="cursor-pointer text-gray-600 hover:text-gray-900">
                  Priorities
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900">{title || "New Priority List"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">{title || "New Priority List"}</h1>
          <span className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
            <span className="font-bold">{step}/2</span>
            {step === 1 ? "Choose study, program and emne" : "Priority details"}
          </span>
        </div>
      </div>

      <div className="max-w-3xl space-y-4 py-4">
        <StepInfoBanner key={`p${step}`} taskId={`p${step}`} stepLabel={`${step}/2`} />

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          {step === 1 ? (
            <>
              <div className="mb-6">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Priority List Details</h2>
                <p className="text-sm text-gray-600">
                  Choose the study, program and emne. The students come from Praksis-students, and the list follows their praksis dates.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!step1Problem) setStep(2);
                }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Study *</label>
                  <Select
                    value={studyId}
                    onValueChange={(v: string) => {
                      setStudyId(v);
                      setProgramId("");
                      setEmneId("");
                      setLocation("");
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a study" />
                    </SelectTrigger>
                    <SelectContent>
                      {studies.map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Study Program *</label>
                  <Select
                    value={programId}
                    disabled={!studyId}
                    onValueChange={(v: string) => {
                      setProgramId(v);
                      setEmneId("");
                      setLocation("");
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {(study?.programs ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Emne *</label>
                  <Select
                    value={emneId}
                    disabled={!programId || availableEmner.length === 0}
                    onValueChange={(v: string) => {
                      setEmneId(v);
                      setLocation("");
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={programId && availableEmner.length === 0 ? "No emner defined for this program" : "Select an emne"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmner.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                          {e.startTerm && <span className="ml-2 text-xs text-gray-500">Start {e.startTerm}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {programId && availableEmner.length === 0 && (
                    <p className="text-xs text-gray-500">Add emner to this program in Settings → Studies & Programs.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Location <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <Select
                    value={emneId ? location || "all" : ""}
                    disabled={!emneId || locations.length === 0}
                    onValueChange={(v: string) => setLocation(v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="h-10" aria-label="Location">
                      <SelectValue placeholder="Select an emne first" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.name} value={l.name}>
                          {l.name}
                          <span className="ml-2 text-xs text-gray-500">{l.count} students</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">With a location, only the students who study there are added to the list.</p>
                </div>

                {/* The students from Praksis-students, and the period they give */}
                {emneId && (
                  <div
                    className={cn(
                      "flex items-start gap-2 rounded-md border p-3",
                      students.length > 0 ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"
                    )}
                  >
                    <Users size={16} className={cn("mt-0.5 shrink-0", students.length > 0 ? "text-blue-600" : "text-amber-600")} />
                    <div className={cn("text-sm", students.length > 0 ? "text-blue-700" : "text-amber-800")}>
                      {students.length > 0 ? (
                        <>
                          <span className="font-semibold">{students.length}</span> student{students.length === 1 ? " is" : "s are"} in Praksis-students for {emne?.name}
                          {location ? ` at ${location}` : ""}. They are added to the list automatically.
                          {term && (
                            <div className="mt-0.5 text-blue-800">
                              Period: <span className="font-medium">{term.semester === "HT" ? "Autumn" : "Spring"} {term.year}</span>, from their praksis start dates.
                            </div>
                          )}
                        </>
                      ) : (
                        <>No students are waiting for this emne. Import students in Praksis-students first.</>
                      )}
                    </div>
                  </div>
                )}
                {duplicate && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    A priority list for this emne, semester and location already exists.
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                  <Button type="button" variant="outline" onClick={onBack} className="h-10 px-6">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!!step1Problem} title={step1Problem ?? undefined} className="h-10 bg-blue-600 px-6 text-white hover:bg-blue-700">
                    Continue
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Priority Details</h2>
                <p className="text-sm text-gray-600">
                  Set when the {students.length} students are notified and when their applications are due, and what they are told. These details are saved with the list.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label>
                    Noticing students date <span className="font-normal text-gray-400">(optional)</span>
                  </Label>
                  <Popover open={noticeCalOpen} onOpenChange={setNoticeCalOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("mt-1 w-full justify-start text-left font-normal", !noticeDate && "text-gray-400")}>
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
                        }}
                        disabled={(d: Date) => d < today}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>
                    Application deadline <span className="font-normal text-gray-400">(optional)</span>
                  </Label>
                  <Popover open={deadlineCalOpen} onOpenChange={setDeadlineCalOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("mt-1 w-full justify-start text-left font-normal", !deadline && "text-gray-400", errors.deadline && "border-red-400")}>
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
                  {errors.deadline && <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>}
                </div>

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
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10 px-6">
                    Back
                  </Button>
                  <Button type="button" onClick={handleCreate} className="h-10 bg-blue-600 px-6 text-white hover:bg-blue-700">
                    Create priority list
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
