import { useState, useMemo } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
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
  Check,
  BookOpen,
  Building2,
  Star,
  Users,
} from "lucide-react";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
  PRIORITY_REASON_LABELS,
  PRIORITY_REASON_POINTS,
} from "../types/priorityPlacement";
import { Student } from "../types/placementTask";
import { PlacementTaskState, StudentPlacement } from "../types/studentPlacement";
import { Study } from "./SettingsView";
import { PeriodFilterButton } from "./PeriodFilterButton";
import {
  PeriodOption,
  getSemesterRanges,
  matchesPeriod,
  getPeriodChips,
  togglePeriod,
} from "./periodFilter";

interface PlacementReportViewProps {
  placements: StudentPlacement[];
  placementTaskStates: PlacementTaskState[];
  enrolledStudents: EnrolledStudent[];
  priorityApplications: PriorityPlacementApplication[];
  studies: Study[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "upload", label: "Upload students" },
  { value: "select", label: "Select praksis places" },
  { value: "publish", label: "First publish" },
  { value: "completed", label: "Completed" },
];

function termLabel(p: StudentPlacement): string {
  return [p.semester, p.year].filter(Boolean).join(" ");
}

function placementStatusClass(status?: string): string {
  switch (status) {
    case "completed":
      return "bg-gray-100 text-gray-600 border border-gray-200";
    case "publish":
      return "bg-green-100 text-green-700 border border-green-200";
    default:
      return "bg-blue-100 text-blue-700 border border-blue-200";
  }
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

export function PlacementReportView({
  placements,
  placementTaskStates,
  enrolledStudents,
  priorityApplications,
  studies,
}: PlacementReportViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filterStudy, setFilterStudy] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterEmne, setFilterEmne] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  // Period filter — defaults to this + next semester
  const [selectedPeriods, setSelectedPeriods] = useState<Set<PeriodOption>>(
    new Set<PeriodOption>(["current", "next"]),
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  const semesterRanges = useMemo(() => getSemesterRanges(new Date()), []);

  const studentsByPlacement = useMemo(() => {
    const m = new Map<string, Student[]>();
    placementTaskStates.forEach((ts) =>
      m.set(ts.placementId, (ts.students as Student[]) ?? []),
    );
    return m;
  }, [placementTaskStates]);

  const availableEmnes = useMemo(
    () => [...new Set(placements.map((p) => p.subject).filter(Boolean))].sort(),
    [placements],
  );

  const filteredPlacements = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return placements.filter((p) => {
      if (filterStudy !== "all" && p.studyId !== filterStudy) return false;
      if (filterProgram !== "all" && p.programId !== filterProgram) return false;
      if (filterEmne !== "all" && p.subject !== filterEmne) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (
        selectedPeriods.size > 0 &&
        !matchesPeriod(
          p.startDate,
          p.endDate,
          selectedPeriods,
          customStartDate,
          customEndDate,
          semesterRanges,
        )
      )
        return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.subject ?? "").toLowerCase().includes(q) ||
        termLabel(p).toLowerCase().includes(q)
      );
    });
  }, [
    placements,
    searchTerm,
    filterStudy,
    filterProgram,
    filterEmne,
    filterStatus,
    selectedPeriods,
    customStartDate,
    customEndDate,
    semesterRanges,
  ]);

  const selectedPlacements = useMemo(
    () => filteredPlacements.filter((p) => selectedIds.has(p.id)),
    [filteredPlacements, selectedIds],
  );

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allVisibleSelected =
    filteredPlacements.length > 0 &&
    filteredPlacements.every((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPlacements.map((p) => p.id)));
    }
  }

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
    (filterStatus !== "all" ? 1 : 0);

  function clearFilters() {
    setFilterStudy("all");
    setFilterProgram("all");
    setFilterEmne("all");
    setFilterStatus("all");
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Placement report</h1>
        <p className="text-sm text-gray-600 mt-1">
          Select one or more placements to review their students, praksis places &amp;
          priority requests
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

            {/* Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[170px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
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
              resetPeriods={["current", "next"]}
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
                placeholder="Search by title, emne, or term…"
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

      {/* Split: placement list (left) + details table (right) */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: selectable placements */}
        {!isExpanded && (
        <div className="w-96 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {filteredPlacements.length} placement
              {filteredPlacements.length === 1 ? "" : "s"}
              {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
            </span>
            {filteredPlacements.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {allVisibleSelected ? "Clear all" : "Select all"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredPlacements.length > 0 ? (
              filteredPlacements.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const count = studentsByPlacement.get(p.id)?.length ?? 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSelected(p.id)}
                    className={`w-full text-left rounded-md px-3 py-2 transition-colors flex items-start gap-3 ${
                      isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800 truncate">
                          {p.title || termLabel(p)}
                        </span>
                        <Badge className={`${placementStatusClass(p.status)} text-[10px]`}>
                          {p.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {termLabel(p)}
                        {p.subject ? ` · ${p.subject}` : ""}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Users className="h-3 w-3" /> {count} student
                        {count === 1 ? "" : "s"}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center text-sm text-gray-400 py-8">
                No placements match
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right: details grouped by placement */}
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
          {selectedPlacements.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-8">
              <BookOpen className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Select one or more placements
              </p>
              <p className="text-xs mt-1">
                Their student, praksis place and priority details appear here.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {selectedPlacements.map((p) => (
                <PlacementSection
                  key={p.id}
                  placement={p}
                  students={studentsByPlacement.get(p.id) ?? []}
                  enrolledStudents={enrolledStudents}
                  priorityApplications={priorityApplications}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlacementSection({
  placement,
  students,
  enrolledStudents,
  priorityApplications,
}: {
  placement: StudentPlacement;
  students: Student[];
  enrolledStudents: EnrolledStudent[];
  priorityApplications: PriorityPlacementApplication[];
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Placement details header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800">
              {placement.title || termLabel(placement)}
            </h3>
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              {termLabel(placement)}
            </Badge>
            {placement.subject && (
              <span className="text-xs text-gray-500">{placement.subject}</span>
            )}
            <Badge className={`${placementStatusClass(placement.status)} text-xs`}>
              {placement.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {placement.startDate} – {placement.endDate}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="h-3.5 w-3.5" /> {students.length} student
          {students.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Student / priority details table */}
      {students.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50 text-left">
                <th className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Student
                </th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Study / Programme
                </th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Praksis place
                </th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Supervisor(s)
                </th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((st) => {
                const enrolled = enrolledStudents.find((e) => e.id === st.id);
                const ap = st.assignedPraksisPlace;
                const supervisors =
                  st.supervisors && st.supervisors.length > 0
                    ? st.supervisors
                    : st.supervisor
                    ? [st.supervisor]
                    : [];
                const reqs = priorityApplications
                  .filter((a) => a.studentId === st.id)
                  .sort((a, b) => (a.submittedDate < b.submittedDate ? 1 : -1));
                const latest = reqs[0];
                const totalPoints = reqs.reduce(
                  (sum, r) => sum + (r.totalPoints || 0),
                  0,
                );
                return (
                  <tr key={st.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {enrolled?.name ?? st.name}
                      </p>
                      <p className="text-xs font-mono text-gray-400">
                        {enrolled?.personnummer ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {enrolled ? (
                        <>
                          <p>{enrolled.studyName}</p>
                          <p className="text-xs text-gray-400">
                            {enrolled.programName}
                          </p>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ap?.placeName ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span>
                            {ap.placeName}
                            {ap.departmentName ? (
                              <span className="text-gray-400">
                                {" "}
                                · {ap.departmentName}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {supervisors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {supervisors.map((sup, i) => (
                            <Badge
                              key={sup.id ?? i}
                              className="bg-violet-50 text-violet-700 border border-violet-200 text-xs"
                            >
                              {sup.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {reqs.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className="bg-violet-50 text-violet-700 border border-violet-200 text-xs gap-1">
                              <Star className="h-3 w-3" /> {totalPoints} pts
                            </Badge>
                            {latest && (
                              <Badge
                                className={`${priorityStatusClass(latest.status)} text-xs capitalize`}
                              >
                                {latest.status}
                              </Badge>
                            )}
                            {reqs.length > 1 && (
                              <span className="text-xs text-gray-400">
                                +{reqs.length - 1} more
                              </span>
                            )}
                          </div>
                          {latest && latest.selectedReasons.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {latest.selectedReasons.map((r) => (
                                <span
                                  key={r}
                                  title={PRIORITY_REASON_LABELS[r]}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200"
                                >
                                  {PRIORITY_REASON_LABELS[r]} (+
                                  {PRIORITY_REASON_POINTS[r]})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          No priority request
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic px-4 py-6">
          No students assigned to this placement yet.
        </p>
      )}
    </div>
  );
}
