import { useState, useMemo } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Search,
  X,
  ChevronDown,
  CalendarRange,
  Maximize2,
  Minimize2,
  GraduationCap,
  BookOpen,
  Building2,
  Star,
  Mail,
  Phone,
  MapPin,
  Car,
  FileText,
} from "lucide-react";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
  PRIORITY_REASON_LABELS,
  PRIORITY_REASON_POINTS,
} from "../types/priorityPlacement";
import { PlacementTaskState, StudentPlacement } from "../types/studentPlacement";
import { Study } from "./SettingsView";
import {
  getStudentPlacements,
  getStudentPriorityRequests,
  getStudentSummary,
} from "./studentHistory";
import { PeriodFilterButton } from "./PeriodFilterButton";
import {
  PeriodOption,
  getSemesterRanges,
  matchesPeriod,
  getPeriodChips,
  togglePeriod,
} from "./periodFilter";

interface StudentsViewProps {
  students: EnrolledStudent[];
  placementTaskStates: PlacementTaskState[];
  studentPlacements: StudentPlacement[];
  priorityApplications: PriorityPlacementApplication[];
  studies: Study[];
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Convert a priority application's target semester (e.g. "HT-2027" / "VT2027")
// to an approximate calendar range so it can be matched by the period filter.
function termRange(targetSemester?: string): { start: string; end: string } | null {
  const m = /^(HT|VT)-?(\d{4})$/.exec((targetSemester ?? "").trim());
  if (!m) return null;
  const [, sem, year] = m;
  return sem === "HT"
    ? { start: `${year}-08-01`, end: `${year}-12-31` }
    : { start: `${year}-01-01`, end: `${year}-07-31` };
}

function priorityStatusClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700 border border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  }
}

function placementStatusClass(status?: string): string {
  switch (status) {
    case "completed":
      return "bg-gray-100 text-gray-600 border border-gray-200";
    case "publish":
    case "current":
      return "bg-green-100 text-green-700 border border-green-200";
    default:
      return "bg-blue-100 text-blue-700 border border-blue-200";
  }
}

export function StudentsView({
  students,
  placementTaskStates,
  studentPlacements,
  priorityApplications,
  studies,
}: StudentsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filterStudy, setFilterStudy] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterEmne, setFilterEmne] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  // Period filter — no default selection
  const [selectedPeriods, setSelectedPeriods] = useState<Set<PeriodOption>>(
    new Set<PeriodOption>(),
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const semesterRanges = useMemo(() => getSemesterRanges(new Date()), []);

  // student id -> aggregated placement records (for emne + period filtering)
  const placementsByStudent = useMemo(() => {
    const m = new Map<string, ReturnType<typeof getStudentPlacements>>();
    students.forEach((s) =>
      m.set(s.id, getStudentPlacements(s.id, placementTaskStates, studentPlacements)),
    );
    return m;
  }, [students, placementTaskStates, studentPlacements]);

  const availableEmnes = useMemo(() => {
    const set = new Set<string>();
    placementsByStudent.forEach((recs) =>
      recs.forEach((r) => {
        if (r.subject) set.add(r.subject);
      }),
    );
    return Array.from(set).sort();
  }, [placementsByStudent]);

  const availableLocations = useMemo(
    () => [...new Set(students.map((s) => s.studyLocation).filter(Boolean))].sort(),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return students.filter((s) => {
      if (filterStudy !== "all" && s.studyId !== filterStudy) return false;
      if (filterProgram !== "all" && s.programId !== filterProgram) return false;
      if (filterLocation !== "all" && s.studyLocation !== filterLocation) return false;

      const recs = placementsByStudent.get(s.id) ?? [];
      if (filterEmne !== "all" && !recs.some((r) => r.subject === filterEmne))
        return false;

      // Period: a student matches if any placement OR priority request falls
      // into the selected period(s). No selection = all students.
      if (selectedPeriods.size > 0) {
        const ranges: { start: string; end: string }[] = [];
        recs.forEach((r) => {
          if (r.startDate && r.endDate) ranges.push({ start: r.startDate, end: r.endDate });
        });
        getStudentPriorityRequests(s.id, priorityApplications).forEach((a) => {
          const tr = termRange(a.targetSemester);
          if (tr) ranges.push(tr);
        });
        const inPeriod = ranges.some((r) =>
          matchesPeriod(
            r.start,
            r.end,
            selectedPeriods,
            customStartDate,
            customEndDate,
            semesterRanges,
          ),
        );
        if (!inPeriod) return false;
      }

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.personnummer.toLowerCase().includes(q)
      );
    });
  }, [
    students,
    searchTerm,
    filterStudy,
    filterProgram,
    filterEmne,
    filterLocation,
    selectedPeriods,
    customStartDate,
    customEndDate,
    semesterRanges,
    placementsByStudent,
    priorityApplications,
  ]);

  const byId = (id: string) => students.find((s) => s.id === id);
  const activeStudent = selectedId ? byId(selectedId) : null;

  const selectedStudyObj = studies.find((s) => s.id === filterStudy);
  const studyProgramLabel =
    filterStudy === "all" || !selectedStudyObj
      ? "Study / Programme"
      : filterProgram === "all"
      ? selectedStudyObj.name
      : selectedStudyObj.programs.find((p) => p.id === filterProgram)
      ? `${selectedStudyObj.name} / ${
          selectedStudyObj.programs.find((p) => p.id === filterProgram)!.name
        }`
      : selectedStudyObj.name;

  const activeFilterCount =
    (filterStudy !== "all" ? 1 : 0) +
    (filterEmne !== "all" ? 1 : 0) +
    (filterLocation !== "all" ? 1 : 0);

  function clearFilters() {
    setFilterStudy("all");
    setFilterProgram("all");
    setFilterEmne("all");
    setFilterLocation("all");
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Student report</h1>
        <p className="text-sm text-gray-600 mt-1">
          Browse students and review their placement &amp; priority request history
        </p>
      </div>

      {/* Search & filter toolbar */}
      {!isExpanded && (
        <>
      <div className="flex items-center gap-3 flex-wrap">
        {!isSearchMode ? (
          <>
            <Button
              variant="outline"
              onClick={() => setIsSearchMode(true)}
              className="justify-start text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Study / Programme (cascading) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-gray-600 max-w-[260px] justify-between bg-gray-100 hover:bg-gray-200 border-gray-200"
                >
                  <span className="truncate">{studyProgramLabel}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[260px]">
                <DropdownMenuItem
                  onSelect={() => {
                    setFilterStudy("all");
                    setFilterProgram("all");
                  }}
                  className={filterStudy === "all" ? "font-medium text-blue-600" : ""}
                >
                  All studies
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {studies.map((s) => (
                  <DropdownMenuSub key={s.id}>
                    <DropdownMenuSubTrigger
                      className={
                        filterStudy === s.id && filterProgram === "all"
                          ? "font-medium text-blue-600"
                          : ""
                      }
                    >
                      {s.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[220px]">
                      <DropdownMenuItem
                        onSelect={() => {
                          setFilterStudy(s.id);
                          setFilterProgram("all");
                        }}
                        className={
                          filterStudy === s.id && filterProgram === "all"
                            ? "font-medium text-blue-600"
                            : ""
                        }
                      >
                        All programmes
                      </DropdownMenuItem>
                      {s.programs.length > 0 && <DropdownMenuSeparator />}
                      {s.programs.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onSelect={() => {
                            setFilterStudy(s.id);
                            setFilterProgram(p.id);
                          }}
                          className={
                            filterStudy === s.id && filterProgram === p.id
                              ? "font-medium text-blue-600"
                              : ""
                          }
                        >
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Emne */}
            <Select value={filterEmne} onValueChange={setFilterEmne}>
              <SelectTrigger className="w-[150px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="Emne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All emne</SelectItem>
                {availableEmnes.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location */}
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-[160px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {availableLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period filter — no default selection */}
            <PeriodFilterButton
              selectedPeriods={selectedPeriods}
              setSelectedPeriods={setSelectedPeriods}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
              semesterRanges={semesterRanges}
              resetPeriods={[]}
            />

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or personnummer…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsSearchMode(false);
                setSearchTerm("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </>
        )}
      </div>

      {/* Active period chips */}
      {getPeriodChips(selectedPeriods, customStartDate, customEndDate, semesterRanges)
        .length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Showing:</span>
          {getPeriodChips(
            selectedPeriods,
            customStartDate,
            customEndDate,
            semesterRanges,
          ).map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700"
            >
              <CalendarRange className="h-3 w-3 opacity-70" />
              <span>{chip.label}</span>
              <span className="text-blue-400">·</span>
              <span className="font-normal text-blue-500">{chip.range}</span>
              <button
                type="button"
                onClick={() =>
                  setSelectedPeriods(togglePeriod(selectedPeriods, chip.key))
                }
                className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
        </>
      )}

      {/* Split: list (left) + selected profile (right) */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: student cards */}
        {!isExpanded && (
        <div className="w-96 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((s) => {
                const isActive = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left rounded-md px-3 py-2 transition-colors flex items-center gap-3 ${
                      isActive
                        ? "bg-[#155dfc] text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback
                        className={`text-xs font-semibold ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {initials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{s.name}</div>
                      <div
                        className={`text-xs truncate ${
                          isActive ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {s.email}
                      </div>
                      <div
                        className={`text-xs font-mono truncate ${
                          isActive ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {s.personnummer}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center text-sm text-gray-400 py-8">
                No students match
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right: selected student profile */}
        <div className="flex-1 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden min-w-0">
          <div className="flex items-center justify-end px-3 py-2 border-b border-gray-200 bg-gray-50/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((v) => !v)}
              className="h-8 gap-1.5 text-gray-600"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
          {!activeStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-8">
              <GraduationCap className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Select a student to see their history
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <StudentProfile
                student={activeStudent}
                placementTaskStates={placementTaskStates}
                studentPlacements={studentPlacements}
                priorityApplications={priorityApplications}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentProfile({
  student,
  placementTaskStates,
  studentPlacements,
  priorityApplications,
}: {
  student: EnrolledStudent;
  placementTaskStates: PlacementTaskState[];
  studentPlacements: StudentPlacement[];
  priorityApplications: PriorityPlacementApplication[];
}) {
  const placements = getStudentPlacements(
    student.id,
    placementTaskStates,
    studentPlacements,
  );
  const requests = getStudentPriorityRequests(student.id, priorityApplications);
  const summary = getStudentSummary(
    student.id,
    placementTaskStates,
    studentPlacements,
    priorityApplications,
  );

  return (
    <div className="space-y-6">
      {/* Identity header */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
              {initials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-800">{student.name}</h2>
              <span className="text-sm font-mono text-gray-500">
                {student.personnummer}
              </span>
              {student.hasDriversLicense && (
                <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs gap-1">
                  <Car className="h-3 w-3" /> Driver&apos;s license
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-400" /> {student.email}
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {student.phone || "—"}
              </span>
              <span className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {student.temporaryAddress || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* At-a-glance KPIs */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-gray-800">{summary.placementCount}</p>
            <p className="text-xs text-gray-500">Placements</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold text-gray-800">
              {summary.priorityCount}
              {summary.pendingPriorityCount > 0 && (
                <span className="text-sm font-semibold text-yellow-600">
                  {" "}
                  ({summary.pendingPriorityCount} pending)
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">Priority requests</p>
          </div>
        </div>
      </Card>

      {/* Placement history */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-blue-600" /> Placement history
        </h3>
        {placements.length > 0 ? (
          <div className="space-y-2">
            {placements.map((p) => (
              <div
                key={p.key}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">
                        {p.title || p.subject || "Placement"}
                      </span>
                      {p.term && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                          {p.term}
                        </Badge>
                      )}
                      {p.subject && (
                        <span className="text-xs text-gray-500">{p.subject}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      {p.placeName ? (
                        <span>
                          {p.placeName}
                          {p.unitName ? ` · ${p.unitName}` : ""}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">
                          No praksis place assigned
                        </span>
                      )}
                    </div>
                    {(p.startDate || p.endDate) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {p.startDate ?? "?"} – {p.endDate ?? "?"}
                      </p>
                    )}
                  </div>
                  {p.status && (
                    <Badge className={`${placementStatusClass(p.status)} text-xs`}>
                      {p.status}
                    </Badge>
                  )}
                </div>

                {p.supervisors.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-xs text-gray-500">Supervisor(s):</span>
                    {p.supervisors.map((sup, i) => (
                      <Badge
                        key={sup.id ?? i}
                        className="bg-violet-50 text-violet-700 border border-violet-200 text-xs"
                      >
                        {sup.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic border border-dashed border-gray-200 rounded-lg p-4">
            No placements yet for this student.
          </p>
        )}
      </section>

      {/* Priority request history */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-violet-600" /> Priority request history
        </h3>
        {requests.length > 0 ? (
          <div className="space-y-2">
            {requests.map((a) => (
              <div
                key={a.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">
                      {a.targetSemester}
                    </span>
                    <Badge className="bg-violet-50 text-violet-700 border border-violet-200 text-xs">
                      {a.totalPoints} pts
                    </Badge>
                    {a.isManualGrant && (
                      <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs">
                        Manual grant
                      </Badge>
                    )}
                  </div>
                  <Badge className={`${priorityStatusClass(a.status)} text-xs capitalize`}>
                    {a.status}
                  </Badge>
                </div>

                {a.selectedReasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.selectedReasons.map((r) => (
                      <Badge
                        key={r}
                        className="bg-white text-gray-600 border border-gray-200 text-xs"
                      >
                        {PRIORITY_REASON_LABELS[r]} (+{PRIORITY_REASON_POINTS[r]})
                      </Badge>
                    ))}
                  </div>
                )}

                {a.placementConstraints && (
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Constraints:</span>{" "}
                    {a.placementConstraints}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 flex-wrap">
                  <span>Submitted {a.submittedDate}</span>
                  {a.decidedBy && (
                    <span>
                      · {a.status} by {a.decidedBy}
                      {a.decidedDate ? ` on ${a.decidedDate}` : ""}
                    </span>
                  )}
                  {a.attachedDocuments && a.attachedDocuments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {a.attachedDocuments.length} document
                      {a.attachedDocuments.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {a.decisionNotes && (
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Note:</span> {a.decisionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic border border-dashed border-gray-200 rounded-lg p-4">
            No priority requests submitted by this student.
          </p>
        )}
      </section>
    </div>
  );
}
