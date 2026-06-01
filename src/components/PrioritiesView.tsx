import { useState, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
import { Plus, Star, SlidersHorizontal, Trash2, AlertCircle } from "lucide-react";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
  PriorityPlacementPeriod,
} from "../types/priorityPlacement";
import { CreatePriorityPeriodModal } from "./CreatePriorityPeriodModal";

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string }[];
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
}

interface FilterState {
  terms: string[];
  programIds: string[];
  studyLocations: string[];
  noticeSent: "all" | "sent" | "not_sent";
  deadlineBeforeToday: boolean;
}

const defaultFilter: FilterState = {
  terms: [],
  programIds: [],
  studyLocations: [],
  noticeSent: "all",
  deadlineBeforeToday: false,
};

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string }[];
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

function toggleArrayItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
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
}: PrioritiesViewProps) {
  const [isCreatePeriodOpen, setIsCreatePeriodOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [deletingPeriod, setDeletingPeriod] = useState<PriorityPlacementPeriod | null>(null);
  const [activeChipFilter, setActiveChipFilter] = useState<
    "no_students" | "no_notice" | "needs_review" | "not_published" | null
  >(null);

  const today = new Date().toISOString().split("T")[0];

  const availableTerms = useMemo(() => {
    const seen = new Set<string>();
    return periods
      .map((p) => ({ key: `${p.semester}-${p.year}`, label: termLabel(p) }))
      .filter(({ key }) => {
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
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

  const availableLocations = useMemo(
    () => [...new Set(periods.flatMap((p) => p.studyLocations))].sort(),
    [periods]
  );

  const filteredPeriods = useMemo(() => {
    return periods.filter((p) => {
      const key = `${p.semester}-${p.year}`;
      if (filter.terms.length > 0 && !filter.terms.includes(key)) return false;
      if (
        filter.programIds.length > 0 &&
        !p.programIds.some((pid) => filter.programIds.includes(pid))
      )
        return false;
      if (
        filter.studyLocations.length > 0 &&
        !p.studyLocations.some((loc) => filter.studyLocations.includes(loc))
      )
        return false;
      if (filter.noticeSent === "sent" && !p.firstNoticeSentAt) return false;
      if (filter.noticeSent === "not_sent" && p.firstNoticeSentAt) return false;
      if (
        filter.deadlineBeforeToday &&
        (!p.firstNoticeDeadline || p.firstNoticeDeadline >= today)
      )
        return false;
      return true;
    });
  }, [periods, filter, today]);

  const noStudentsCount = useMemo(
    () => filteredPeriods.filter((p) => p.importedStudentIds.length === 0).length,
    [filteredPeriods]
  );
  const noNoticeCount = useMemo(
    () =>
      filteredPeriods.filter(
        (p) => p.importedStudentIds.length > 0 && !p.firstNoticeSentAt
      ).length,
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
      if (activeChipFilter === "no_notice")
        return p.importedStudentIds.length > 0 && !p.firstNoticeSentAt;
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
    filter.terms.length +
    filter.programIds.length +
    filter.studyLocations.length +
    (filter.noticeSent !== "all" ? 1 : 0) +
    (filter.deadlineBeforeToday ? 1 : 0);

  function clearFilters() {
    setFilter(defaultFilter);
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
            variant="outline"
            className="flex items-center gap-2 relative"
            onClick={() => setIsFilterOpen(true)}
          >
            <SlidersHorizontal size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={() => setIsCreatePeriodOpen(true)}
          >
            <Plus size={15} />
            Create period
          </Button>
        </div>
      </div>

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
                key: "no_notice" as const,
                label: "First notice",
                value: noNoticeCount,
                active: "bg-yellow-100 text-yellow-700 border-yellow-300",
                inactive: "hover:border-yellow-200 hover:text-yellow-600",
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
                ? 'Click "Create period" to get started'
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Study location</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Students</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Requests</th>
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
                  const appCount = periodApps.length;
                  const pendingCount = periodApps.filter((a) => a.status === "pending").length;
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600">{appCount}</span>
                          {pendingCount > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200"
                              title={`${pendingCount} unreviewed request${pendingCount > 1 ? "s" : ""}`}
                            >
                              <AlertCircle size={10} />
                              {pendingCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {period.importedStudentIds.length > 0 && !period.firstNoticeSentAt ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs">
                            First notice not sent
                          </Badge>
                        ) : period.firstNoticeSentAt ? (
                          <span className="text-gray-600 text-xs">{period.firstNoticeSentAt}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {period.importedStudentIds.length > 0 && !period.firstNoticeSentAt ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs">
                            First notice not sent
                          </Badge>
                        ) : period.firstNoticeDeadline ? (
                          <span
                            className={
                              period.firstNoticeDeadline < today
                                ? "text-red-500 font-medium"
                                : "text-gray-500"
                            }
                          >
                            {period.firstNoticeDeadline}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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

      {/* Filter dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Filter periods</DialogTitle>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mr-6"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 py-1">
            {/* Term */}
            {availableTerms.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Term
                </p>
                <div className="space-y-2">
                  {availableTerms.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`filter-term-${key}`}
                        checked={filter.terms.includes(key)}
                        onCheckedChange={() =>
                          setFilter((f) => ({ ...f, terms: toggleArrayItem(f.terms, key) }))
                        }
                      />
                      <Label
                        htmlFor={`filter-term-${key}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Programme */}
            {availablePrograms.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Programme
                </p>
                <div className="space-y-2">
                  {availablePrograms.map((prog) => (
                    <div key={prog.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`filter-prog-${prog.id}`}
                        checked={filter.programIds.includes(prog.id)}
                        onCheckedChange={() =>
                          setFilter((f) => ({
                            ...f,
                            programIds: toggleArrayItem(f.programIds, prog.id),
                          }))
                        }
                      />
                      <Label
                        htmlFor={`filter-prog-${prog.id}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {prog.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study location */}
            {availableLocations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Study location
                </p>
                <div className="space-y-2">
                  {availableLocations.map((loc) => (
                    <div key={loc} className="flex items-center gap-2">
                      <Checkbox
                        id={`filter-loc-${loc}`}
                        checked={filter.studyLocations.includes(loc)}
                        onCheckedChange={() =>
                          setFilter((f) => ({
                            ...f,
                            studyLocations: toggleArrayItem(f.studyLocations, loc),
                          }))
                        }
                      />
                      <Label
                        htmlFor={`filter-loc-${loc}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {loc}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* First notice */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                First notice
              </p>
              <div className="space-y-2">
                {(
                  [
                    { value: "all", label: "All" },
                    { value: "sent", label: "Sent" },
                    { value: "not_sent", label: "Not sent" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="filter-notice"
                      checked={filter.noticeSent === value}
                      onChange={() => setFilter((f) => ({ ...f, noticeSent: value }))}
                      className="accent-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Deadline
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-deadline"
                  checked={filter.deadlineBeforeToday}
                  onCheckedChange={(v: boolean) =>
                    setFilter((f) => ({ ...f, deadlineBeforeToday: !!v }))
                  }
                />
                <Label htmlFor="filter-deadline" className="font-normal cursor-pointer text-sm">
                  Deadline passed (before today)
                </Label>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
