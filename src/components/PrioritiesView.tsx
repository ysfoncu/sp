import { useState, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Plus,
  Star,
  Trash2,
  Search,
  ChevronDown,
  X,
  CalendarRange,
} from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
  PriorityPlacementPeriod,
} from "../types/priorityPlacement";
import { CreatePriorityPeriodModal } from "./CreatePriorityPeriodModal";
import { SelectDatePopover } from "./SelectDatePopover";
import { PeriodFilterButton } from "./PeriodFilterButton";
import {
  PeriodOption,
  getSemesterRanges,
  matchesPeriod,
  getPeriodChips,
  togglePeriod,
} from "./periodFilter";

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string; emner?: { id: string; name: string }[] }[];
}

interface PrioritiesViewProps {
  periods: PriorityPlacementPeriod[];
  applications: PriorityPlacementApplication[];
  enrolledStudents: EnrolledStudent[];
  studies: Study[];
  currentUserName: string;
  onPeriodCreate: (
    period: Omit<
      PriorityPlacementPeriod,
      "id" | "createdDate" | "createdBy" | "eligibleStudentIds"
    >
  ) => void;
  onPeriodToggleStatus: (id: string) => void;
  onSelectPeriod: (period: PriorityPlacementPeriod) => void;
  onDeletePeriod: (id: string) => void;
  onUpdatePeriodDate: (
    periodId: string,
    field: "firstNoticeDate" | "firstNoticeDeadline",
    date: string
  ) => void;
}

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string; emner?: { id: string; name: string }[] }[];
}

function getEmneName(
  emneId: string,
  studies: Study[]
): string {
  for (const study of studies) {
    for (const prog of study.programs) {
      const emne = prog.emner?.find((e) => e.id === emneId);
      if (emne) return emne.name;
    }
  }
  return emneId;
}

function getProgramName(
  programId: string,
  studies: Study[],
  enrolledStudents: EnrolledStudent[]
): string {
  for (const study of studies) {
    const prog = study.programs.find((p) => p.id === programId);
    if (prog) return prog.name;
  }
  return enrolledStudents.find((s) => s.programId === programId)?.programName ?? programId;
}

function getStudyName(
  studyId: string,
  studies: Study[],
  enrolledStudents: EnrolledStudent[]
): string {
  return (
    studies.find((s) => s.id === studyId)?.name ??
    enrolledStudents.find((s) => s.studyId === studyId)?.studyName ??
    studyId
  );
}

function termLabel(period: PriorityPlacementPeriod): string {
  return `${period.semester === "HT" ? "Autumn" : "Spring"} ${period.year}`;
}

// Approximate calendar range for a period's target term, so the semester-based
// period filter can match it. HT (Autumn) ≈ Aug–Dec, VT (Spring) ≈ Jan–Jul.
function periodTermRange(period: PriorityPlacementPeriod): {
  start: string;
  end: string;
} {
  const year = period.year;
  if (period.semester === "HT") {
    return { start: `${year}-08-01`, end: `${year}-12-31` };
  }
  return { start: `${year}-01-01`, end: `${year}-07-31` };
}

export function PrioritiesView({
  periods,
  applications,
  enrolledStudents,
  studies,
  currentUserName,
  onPeriodCreate,
  onSelectPeriod,
  onDeletePeriod,
  onUpdatePeriodDate,
}: PrioritiesViewProps) {
  const [isCreatePeriodOpen, setIsCreatePeriodOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filterYear, setFilterYear] = useState("all");
  const [filterSemester, setFilterSemester] = useState<"all" | "HT" | "VT">("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterEmne, setFilterEmne] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  // Period filter — always applied; defaults to this + next semester
  const [selectedPeriods, setSelectedPeriods] = useState<Set<PeriodOption>>(
    new Set<PeriodOption>(["current", "next"])
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [deletingPeriod, setDeletingPeriod] = useState<PriorityPlacementPeriod | null>(null);
  const [activeChipFilter, setActiveChipFilter] = useState<
    "no_students" | "needs_review" | "not_published" | null
  >(null);

  const today = new Date().toISOString().split("T")[0];

  // Term tree: each year with the semesters present for it
  const termTree = useMemo(() => {
    const m = new Map<string, Set<"HT" | "VT">>();
    periods.forEach((p) => {
      if (!m.has(p.year)) m.set(p.year, new Set());
      m.get(p.year)!.add(p.semester);
    });
    return Array.from(m.entries())
      .map(([year, sems]) => ({ year, semesters: Array.from(sems).sort() }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [periods]);

  const availablePrograms = useMemo(() => {
    const seen = new Set<string>();
    const progs: { id: string; name: string }[] = [];
    periods.forEach((p) =>
      p.programIds.forEach((pid) => {
        if (!seen.has(pid)) {
          seen.add(pid);
          progs.push({ id: pid, name: getProgramName(pid, studies, enrolledStudents) });
        }
      })
    );
    return progs;
  }, [periods, enrolledStudents]);

  const availableEmnes = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    periods.forEach((p) =>
      (p.emneIds ?? []).forEach((eid) => {
        if (!seen.has(eid)) {
          seen.add(eid);
          list.push({ id: eid, name: getEmneName(eid, studies) });
        }
      })
    );
    return list;
  }, [periods, studies]);

  const availableLocations = useMemo(
    () => [...new Set(periods.flatMap((p) => p.studyLocations))].sort(),
    [periods]
  );

  const termTriggerLabel =
    filterYear === "all"
      ? "Term"
      : filterSemester === "all"
      ? filterYear
      : `${filterSemester === "HT" ? "Autumn" : "Spring"} ${filterYear}`;

  const semesterRanges = useMemo(() => getSemesterRanges(new Date()), []);

  const filteredPeriods = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return periods.filter((p) => {
      if (filterYear !== "all" && p.year !== filterYear) return false;
      if (filterSemester !== "all" && p.semester !== filterSemester) return false;
      if (filterProgram !== "all" && !p.programIds.includes(filterProgram)) return false;
      if (filterEmne !== "all" && !(p.emneIds ?? []).includes(filterEmne)) return false;
      if (filterLocation !== "all" && !p.studyLocations.includes(filterLocation)) return false;
      // Period filter — always applied; only periods whose target term falls
      // into the selected period(s) are shown.
      const range = periodTermRange(p);
      if (
        !matchesPeriod(
          range.start,
          range.end,
          selectedPeriods,
          customStartDate,
          customEndDate,
          semesterRanges
        )
      )
        return false;
      if (q) {
        const haystack = [
          termLabel(p),
          ...p.studyIds.map((sid) => getStudyName(sid, studies, enrolledStudents)),
          ...p.programIds.map((pid) => getProgramName(pid, studies, enrolledStudents)),
          ...(p.emneIds ?? []).map((eid) => getEmneName(eid, studies)),
          ...p.studyLocations,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    periods,
    searchTerm,
    filterYear,
    filterSemester,
    filterProgram,
    filterEmne,
    filterLocation,
    selectedPeriods,
    customStartDate,
    customEndDate,
    semesterRanges,
    studies,
    enrolledStudents,
  ]);

  const noStudentsCount = useMemo(
    () => filteredPeriods.filter((p) => p.importedStudentIds.length === 0).length,
    [filteredPeriods]
  );
  const needsReviewCount = useMemo(
    () =>
      filteredPeriods.filter((p) =>
        applications.some(
          (a) => a.periodId === p.id && a.selectedReasons.length > 0 && a.status === "pending"
        )
      ).length,
    [filteredPeriods, applications]
  );
  const notPublishedCount = useMemo(
    () =>
      filteredPeriods.filter(
        (p) => p.firstNoticeDeadline && p.firstNoticeDeadline < today && !p.resultPublishedAt
      ).length,
    [filteredPeriods, today]
  );

  const displayedPeriods = useMemo(() => {
    if (!activeChipFilter) return filteredPeriods;
    return filteredPeriods.filter((p) => {
      if (activeChipFilter === "no_students") return p.importedStudentIds.length === 0;
      if (activeChipFilter === "needs_review")
        return applications.some(
          (a) => a.periodId === p.id && a.selectedReasons.length > 0 && a.status === "pending"
        );
      if (activeChipFilter === "not_published")
        return p.firstNoticeDeadline && p.firstNoticeDeadline < today && !p.resultPublishedAt;
      return true;
    });
  }, [filteredPeriods, activeChipFilter, applications, today]);

  const activeFilterCount =
    (filterYear !== "all" ? 1 : 0) +
    (filterProgram !== "all" ? 1 : 0) +
    (filterEmne !== "all" ? 1 : 0) +
    (filterLocation !== "all" ? 1 : 0);

  function clearFilters() {
    setFilterYear("all");
    setFilterSemester("all");
    setFilterProgram("all");
    setFilterEmne("all");
    setFilterLocation("all");
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Priorities</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage priority applications for upcoming clinical placement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={() => setIsCreatePeriodOpen(true)}
          >
            <Plus size={15} />
            Create new priority list
          </Button>
        </div>
      </div>

      {/* Search & filter toolbar */}
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

            {/* Term: year then semester */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-gray-600 max-w-[240px] justify-between bg-gray-100 hover:bg-gray-200 border-gray-200"
                >
                  <span className="truncate">{termTriggerLabel}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem
                  onSelect={() => {
                    setFilterYear("all");
                    setFilterSemester("all");
                  }}
                  className={filterYear === "all" ? "font-medium text-blue-600" : ""}
                >
                  All terms
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {termTree.map(({ year, semesters }) => (
                  <DropdownMenuSub key={year}>
                    <DropdownMenuSubTrigger
                      className={
                        filterYear === year && filterSemester === "all"
                          ? "font-medium text-blue-600"
                          : ""
                      }
                    >
                      {year}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[160px]">
                      <DropdownMenuItem
                        onSelect={() => {
                          setFilterYear(year);
                          setFilterSemester("all");
                        }}
                        className={
                          filterYear === year && filterSemester === "all"
                            ? "font-medium text-blue-600"
                            : ""
                        }
                      >
                        All semesters
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {semesters.map((sem) => (
                        <DropdownMenuItem
                          key={sem}
                          onSelect={() => {
                            setFilterYear(year);
                            setFilterSemester(sem);
                          }}
                          className={
                            filterYear === year && filterSemester === sem
                              ? "font-medium text-blue-600"
                              : ""
                          }
                        >
                          {sem === "HT" ? "Autumn" : "Spring"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Programme */}
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-[180px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="Programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programmes</SelectItem>
                {availablePrograms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Emne */}
            <Select value={filterEmne} onValueChange={setFilterEmne}>
              <SelectTrigger className="w-[150px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="Emne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All emne</SelectItem>
                {availableEmnes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
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

            {/* Period filter — always applied */}
            <PeriodFilterButton
              selectedPeriods={selectedPeriods}
              setSelectedPeriods={setSelectedPeriods}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
              semesterRanges={semesterRanges}
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
                placeholder="Search by term, programme, emne, or location..."
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
      {getPeriodChips(selectedPeriods, customStartDate, customEndDate, semesterRanges).length >
        0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Showing:</span>
          {getPeriodChips(
            selectedPeriods,
            customStartDate,
            customEndDate,
            semesterRanges
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

      {/* Items table */}
      <Card className="overflow-hidden">
        {/* Table title + chips */}
        <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b bg-gray-50/50">
          <p className="text-sm font-semibold text-gray-700 mr-1">Priority items</p>
          {(
            [
              {
                key: "no_students" as const,
                label: "Students not added",
                value: noStudentsCount,
                active: "bg-gray-200 text-gray-700 border-gray-400",
                inactive: "hover:border-gray-300 hover:text-gray-700",
              },
              {
                key: "needs_review" as const,
                label: "Needs review",
                value: needsReviewCount,
                active: "bg-amber-100 text-amber-700 border-amber-300",
                inactive: "hover:border-amber-200 hover:text-amber-600",
              },
              {
                key: "not_published" as const,
                label: "Not published",
                value: notPublishedCount,
                active: "bg-red-100 text-red-700 border-red-300",
                inactive: "hover:border-red-200 hover:text-red-600",
              },
            ] as const
          ).map(({ key, label, value, active, inactive }) => (
            <button
              key={key}
              onClick={() => setActiveChipFilter((f) => (f === key ? null : key))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                activeChipFilter === key
                  ? active
                  : `bg-white text-gray-500 border-gray-200 ${inactive}`
              }`}
            >
              {label}
              <span className={`font-semibold ${activeChipFilter === key ? "" : "text-gray-700"}`}>
                {value}
              </span>
            </button>
          ))}
        </div>

        {displayedPeriods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Star size={40} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              {periods.length === 0
                ? "No priority periods created yet"
                : "No periods match the current filters"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {periods.length === 0
                ? 'Click "Create new priority list" to get started'
                : "Try adjusting or clearing the filters"}
            </p>
            {(activeFilterCount > 0 || activeChipFilter) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => { clearFilters(); setActiveChipFilter(null); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Term</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Study / Programme</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Emne</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Study location</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Students</th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap"
                    title="Sent / Not sent yet / Approved / Rejected / Pending"
                  >
                    Requests
                    <span className="block text-[10px] font-normal text-gray-400">
                      sent / not&nbsp;sent / appr / rej / pend
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">First notice</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Deadline</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Published</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayedPeriods.map((period) => {
                  const periodApps = applications.filter(
                    (a) => a.periodId === period.id && a.selectedReasons.length > 0
                  );
                  const sentCount = periodApps.length;
                  const approvedCount = periodApps.filter((a) => a.status === "approved").length;
                  const rejectedCount = periodApps.filter((a) => a.status === "rejected").length;
                  const pendingCount = periodApps.filter((a) => a.status === "pending").length;
                  const notSentCount = period.importedStudentIds.filter((id) => {
                    const app = applications.find(
                      (a) => a.periodId === period.id && a.studentId === id
                    );
                    return !app || app.selectedReasons.length === 0;
                  }).length;
                  return (
                    <tr
                      key={period.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onSelectPeriod(period)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{termLabel(period)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {period.studyIds.map((sid) => (
                            <p key={sid} className="text-xs text-gray-400">
                              {getStudyName(sid, studies, enrolledStudents)}
                            </p>
                          ))}
                          <div className="flex flex-wrap gap-1">
                            {period.programIds.map((pid) => (
                              <Badge
                                key={pid}
                                variant="outline"
                                className="text-xs border-blue-200 text-blue-700 bg-blue-50"
                              >
                                {getProgramName(pid, studies, enrolledStudents)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {period.emneIds && period.emneIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {period.emneIds.map((eid) => (
                              <Badge
                                key={eid}
                                variant="outline"
                                className="text-xs border-violet-200 text-violet-700 bg-violet-50"
                              >
                                {getEmneName(eid, studies)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {period.studyLocations.join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        {period.importedStudentIds.length === 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs">
                            Import students
                          </Badge>
                        ) : (
                          <span className="text-gray-600">
                            {period.importedStudentIds.length}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <HoverCard openDelay={100} closeDelay={50}>
                          <HoverCardTrigger asChild>
                            <div className="inline-flex items-center gap-1 text-xs cursor-default">
                              <span className="font-semibold text-gray-700">{sentCount}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-gray-500">{notSentCount}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-green-600 font-medium">{approvedCount}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-red-600 font-medium">{rejectedCount}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-amber-600 font-medium">{pendingCount}</span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent align="start" className="w-60 p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Requests breakdown
                            </p>
                            <div className="space-y-1.5 text-sm">
                              {(
                                [
                                  {
                                    label: "Total requests sent",
                                    value: sentCount,
                                    dot: "bg-gray-400",
                                  },
                                  {
                                    label: "Not sent yet",
                                    value: notSentCount,
                                    dot: "bg-gray-300",
                                  },
                                  {
                                    label: "Approved",
                                    value: approvedCount,
                                    dot: "bg-green-500",
                                  },
                                  {
                                    label: "Rejected",
                                    value: rejectedCount,
                                    dot: "bg-red-500",
                                  },
                                  {
                                    label: "Pending",
                                    value: pendingCount,
                                    dot: "bg-amber-500",
                                  },
                                ] as const
                              ).map((row) => (
                                <div
                                  key={row.label}
                                  className="flex items-center justify-between gap-4"
                                >
                                  <span className="flex items-center gap-2 text-gray-600">
                                    <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                                    {row.label}
                                  </span>
                                  <span className="font-semibold text-gray-800">{row.value}</span>
                                </div>
                              ))}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SelectDatePopover
                          value={period.firstNoticeDate}
                          onPick={(iso) =>
                            onUpdatePeriodDate(period.id, "firstNoticeDate", iso)
                          }
                        >
                          {period.firstNoticeDate ? (
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="cursor-pointer"
                            >
                              <Badge
                                className={
                                  period.firstNoticeDate < today
                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs cursor-pointer"
                                    : "bg-green-100 text-green-700 border border-green-200 text-xs cursor-pointer"
                                }
                              >
                                {period.firstNoticeDate}
                              </Badge>
                            </button>
                          ) : undefined}
                        </SelectDatePopover>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <SelectDatePopover
                          value={period.firstNoticeDeadline}
                          onPick={(iso) =>
                            onUpdatePeriodDate(period.id, "firstNoticeDeadline", iso)
                          }
                        >
                          {period.firstNoticeDeadline ? (
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className={
                                period.firstNoticeDeadline < today
                                  ? "text-red-500 font-medium cursor-pointer hover:underline"
                                  : "text-gray-500 cursor-pointer hover:underline"
                              }
                            >
                              {period.firstNoticeDeadline}
                            </button>
                          ) : undefined}
                        </SelectDatePopover>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {period.resultPublishedAt ? (
                          <span className="text-gray-600">{period.resultPublishedAt}</span>
                        ) : period.firstNoticeDeadline && period.firstNoticeDeadline < today && !period.resultPublishedAt ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs">
                            Not published
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            period.status === "open"
                              ? "bg-green-100 text-green-700 border border-green-200 text-xs"
                              : "bg-gray-100 text-gray-500 border border-gray-200 text-xs"
                          }
                        >
                          {period.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setDeletingPeriod(period);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete confirm */}
      <AlertDialog
        open={deletingPeriod !== null}
        onOpenChange={(open: boolean) => !open && setDeletingPeriod(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete period</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{" "}
              <span className="font-semibold">
                {deletingPeriod ? termLabel(deletingPeriod) : ""}
              </span>{" "}
              priority period? All associated applications will also be removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deletingPeriod) {
                  onDeletePeriod(deletingPeriod.id);
                  setDeletingPeriod(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create period modal */}
      <CreatePriorityPeriodModal
        isOpen={isCreatePeriodOpen}
        onClose={() => setIsCreatePeriodOpen(false)}
        onCreate={onPeriodCreate}
        enrolledStudents={enrolledStudents}
        studies={studies}
        currentUserName={currentUserName}
        existingPeriods={periods}
      />
    </div>
  );
}
