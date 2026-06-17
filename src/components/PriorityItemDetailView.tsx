import { useState, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Users,
  CheckCircle,
  Clock,
  Upload,
  Send,
  ClipboardEdit,
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  FileText,
  X,
} from "lucide-react";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
  PriorityPlacementPeriod,
} from "../types/priorityPlacement";
import { ReviewPriorityApplicationModal } from "./ReviewPriorityApplicationModal";
import { SubmitOnBehalfModal } from "./SubmitOnBehalfModal";
import { AddStudentModal } from "./AddStudentModal";
import { SelectDatePopover } from "./SelectDatePopover";

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string }[];
}

interface PriorityItemDetailViewProps {
  period: PriorityPlacementPeriod;
  applications: PriorityPlacementApplication[];
  enrolledStudents: EnrolledStudent[];
  studies: Study[];
  currentUserName: string;
  onBack: () => void;
  onImportStudents: (periodId: string) => void;
  onAddStudents: (periodId: string, studentIds: string[]) => void;
  onSendFirstNotice: (periodId: string, deadline: string, message: string) => void;
  onSendIndividualNotice: (periodId: string, studentId: string) => void;
  onPublishResults: (periodId: string) => void;
  onReopenPeriod: (periodId: string) => void;
  onUpdatePeriodDate: (
    periodId: string,
    field: "firstNoticeDate" | "firstNoticeDeadline",
    date: string
  ) => void;
  onApplicationApprove: (id: string, notes?: string) => void;
  onApplicationReject: (id: string, notes: string) => void;
  onSetRequestOnBehalf: (
    application: Omit<PriorityPlacementApplication, "id" | "submittedDate">
  ) => void;
}

function getDisplayStatus(
  app: PriorityPlacementApplication
): { label: string; className: string } | null {
  if (app.selectedReasons.length === 0) return null;
  switch (app.status) {
    case "approved":
      return { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" };
    default:
      return { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  }
}

export function PriorityItemDetailView({
  period,
  applications,
  enrolledStudents,
  studies,
  onBack,
  onImportStudents,
  onAddStudents,
  onPublishResults,
  onReopenPeriod,
  onUpdatePeriodDate,
  onApplicationApprove,
  onApplicationReject,
  onSetRequestOnBehalf,
}: PriorityItemDetailViewProps) {
  const [reviewingApp, setReviewingApp] = useState<PriorityPlacementApplication | null>(null);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [onBehalfStudent, setOnBehalfStudent] = useState<EnrolledStudent | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [sortCol, setSortCol] = useState<"student" | "notified" | "submitted" | "points" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterNotified, setFilterNotified] = useState<"all" | "notified" | "not_notified">("all");
  const [filterApplication, setFilterApplication] = useState<"all" | "submitted" | "not_submitted">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  function handleSort(col: typeof sortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const termLabel = `${period.semester === "HT" ? "Autumn" : "Spring"} ${period.year}`;
  const isPublished = !!period.resultPublishedAt;
  const hasStudents = period.importedStudentIds.length > 0;
  const noticeSent = !!period.firstNoticeSentAt;
  const today = new Date().toISOString().split("T")[0];



  const addableStudents = enrolledStudents.filter(
    (s) =>
      period.programIds.includes(s.programId) &&
      !period.importedStudentIds.includes(s.id)
  );

  const statusOrder: Record<string, number> = { Pending: 0, Approved: 1, Rejected: 2 };

  const sortedStudentIds = useMemo(() => {
    if (!sortCol) return period.importedStudentIds;
    return [...period.importedStudentIds].sort((a, b) => {
      const sA = enrolledStudents.find((s) => s.id === a);
      const sB = enrolledStudents.find((s) => s.id === b);
      const appA = applications.find((ap) => ap.studentId === a);
      const appB = applications.find((ap) => ap.studentId === b);
      let vA: string | number = "";
      let vB: string | number = "";
      if (sortCol === "student") {
        vA = sA?.name ?? "";
        vB = sB?.name ?? "";
      } else if (sortCol === "notified") {
        vA = appA?.noticeSentAt ?? "";
        vB = appB?.noticeSentAt ?? "";
      } else if (sortCol === "submitted") {
        vA = appA && appA.selectedReasons.length > 0 ? appA.submittedDate : "";
        vB = appB && appB.selectedReasons.length > 0 ? appB.submittedDate : "";
      } else if (sortCol === "points") {
        vA = appA?.totalPoints ?? 0;
        vB = appB?.totalPoints ?? 0;
      } else if (sortCol === "status") {
        const labelA = appA ? (getDisplayStatus(appA)?.label ?? "") : "";
        const labelB = appB ? (getDisplayStatus(appB)?.label ?? "") : "";
        vA = labelA !== "" ? (statusOrder[labelA] ?? 99) : 99;
        vB = labelB !== "" ? (statusOrder[labelB] ?? 99) : 99;
      }
      if (vA < vB) return sortDir === "asc" ? -1 : 1;
      if (vA > vB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [period.importedStudentIds, sortCol, sortDir, enrolledStudents, applications]);

  const activeFilterCount =
    (filterNotified !== "all" ? 1 : 0) +
    (filterApplication !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0);

  const filteredStudentIds = useMemo(() => {
    let ids = sortedStudentIds.filter((id) => {
      const app = applications.find((a) => a.studentId === id);
      const notified = !!app?.noticeSentAt;
      const submitted = !!app && app.selectedReasons.length > 0;

      if (filterNotified === "notified" && !notified) return false;
      if (filterNotified === "not_notified" && notified) return false;

      if (filterApplication === "submitted" && !submitted) return false;
      if (filterApplication === "not_submitted" && submitted) return false;

      if (filterStatus !== "all" && app?.status !== filterStatus) return false;

      return true;
    });
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      ids = ids.filter((id) => {
        const student = enrolledStudents.find((s) => s.id === id);
        return student?.name.toLowerCase().includes(q);
      });
    }
    return ids;
  }, [
    sortedStudentIds,
    filterNotified,
    filterApplication,
    filterStatus,
    searchQuery,
    applications,
    enrolledStudents,
  ]);

  // Reset to first page whenever the result set or page size changes
  useEffect(() => {
    setPage(1);
  }, [filterNotified, filterApplication, filterStatus, searchQuery, pageSize]);

  const totalStudents = filteredStudentIds.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedStudentIds = filteredStudentIds.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const rangeStart = totalStudents === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalStudents);

  function resolveProgramName(pid: string): string {
    for (const study of studies) {
      const prog = study.programs.find((p) => p.id === pid);
      if (prog) return prog.name;
    }
    return enrolledStudents.find((s) => s.programId === pid)?.programName ?? pid;
  }

  function resolveStudyName(sid: string): string {
    return (
      studies.find((s) => s.id === sid)?.name ??
      enrolledStudents.find((s) => s.studyId === sid)?.studyName ??
      sid
    );
  }

  const studyNames = [...new Set(period.studyIds.map(resolveStudyName))].join(", ");
  const programNames = [...new Set(period.programIds.map(resolveProgramName))].join(", ");

  return (
    <div className="w-full space-y-6">
      {!isExpanded && (
        <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 -ml-2"
          >
            <ChevronLeft size={16} />
            Priorities
          </Button>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
          {!hasStudents && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => onImportStudents(period.id)}
            >
              <Upload size={14} />
              Import students
            </Button>
          )}
          {hasStudents && !isPublished && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
              onClick={() => setIsAddStudentOpen(true)}
            >
              <UserPlus size={14} />
              Add student
            </Button>
          )}
          {hasStudents && !isPublished && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              onClick={() => setIsPublishConfirmOpen(true)}
            >
              <Send size={14} />
              Publish decisions
            </Button>
          )}
          {isPublished && (
            <>
              <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">
                Decisions published {period.resultPublishedAt}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onReopenPeriod(period.id)}
              >
                Reopen for editing
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Period title card */}
      <Card className="p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{termLabel}</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {studyNames} · {programNames}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {period.studyLocations.join(", ")}
            </p>

            {/* First notice / deadline dates (set at creation, or pick here if empty) */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">First notice:</span>
                <SelectDatePopover
                  value={period.firstNoticeDate}
                  onPick={(iso) =>
                    onUpdatePeriodDate(period.id, "firstNoticeDate", iso)
                  }
                >
                  {period.firstNoticeDate ? (
                    <button type="button" className="cursor-pointer">
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
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Deadline:</span>
                <SelectDatePopover
                  value={period.firstNoticeDeadline}
                  onPick={(iso) =>
                    onUpdatePeriodDate(period.id, "firstNoticeDeadline", iso)
                  }
                >
                  {period.firstNoticeDeadline ? (
                    <button
                      type="button"
                      className={
                        period.firstNoticeDeadline < today
                          ? "text-red-500 font-medium cursor-pointer hover:underline"
                          : "text-gray-700 font-medium cursor-pointer hover:underline"
                      }
                    >
                      {period.firstNoticeDeadline}
                    </button>
                  ) : undefined}
                </SelectDatePopover>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Published:</span>
                {isPublished ? (
                  <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">
                    Published at {period.resultPublishedAt}
                  </Badge>
                ) : (
                  <span className="text-gray-500">Not published to students</span>
                )}
              </div>
            </div>
          </div>
          <Badge
            className={
              period.status === "open"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }
          >
            {period.status === "open" ? "Open" : "Closed"}
          </Badge>
        </div>
      </Card>
        </>
      )}

      {/* Search & filter toolbar */}
      {hasStudents && (
        <div className="flex items-center gap-3">
          {!isSearchMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsSearchMode(true)}
                className="justify-start text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200"
              >
                <Search className="h-4 w-4" />
              </Button>

              <Select
                value={filterNotified}
                onValueChange={(v: string) => setFilterNotified(v as typeof filterNotified)}
              >
                <SelectTrigger className="w-[160px] bg-gray-100 border-gray-200">
                  <SelectValue placeholder="Notified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notified</SelectItem>
                  <SelectItem value="notified">Notified</SelectItem>
                  <SelectItem value="not_notified">Not notified</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterApplication}
                onValueChange={(v: string) => setFilterApplication(v as typeof filterApplication)}
              >
                <SelectTrigger className="w-[180px] bg-gray-100 border-gray-200">
                  <SelectValue placeholder="Application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All applications</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="not_submitted">Not submitted</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(v: string) => setFilterStatus(v as typeof filterStatus)}
              >
                <SelectTrigger className="w-[150px] bg-gray-100 border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterNotified("all");
                    setFilterApplication("all");
                    setFilterStatus("all");
                  }}
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
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSearchMode(false);
                  setSearchQuery("");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </>
          )}
        </div>
      )}

      {/* Students table / empty state */}
      <Card className="overflow-hidden">
        {!hasStudents ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No students imported yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">
              Import students to start the priority process
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              onClick={() => onImportStudents(period.id)}
            >
              <Upload size={14} />
              Import students
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50 flex-wrap gap-2">
              <p className="text-sm font-semibold text-gray-700">
                Students ({period.importedStudentIds.length})
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded((v) => !v)}
                className="h-8 gap-1.5 text-gray-600"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("student")}
                        className="flex items-center gap-1 hover:text-gray-900 group"
                      >
                        Student
                        {sortCol === "student" ? (
                          sortDir === "asc" ? (
                            <ArrowUp size={12} className="text-blue-500" />
                          ) : (
                            <ArrowDown size={12} className="text-blue-500" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-gray-300 group-hover:text-gray-400" />
                        )}
                      </button>
                    </th>
                    {(
                      [
                        { key: "notified", label: "Notified" },
                        { key: "submitted", label: "Application submitted" },
                        { key: "points", label: "Points" },
                        { key: "status", label: "Status" },
                      ] as const
                    ).map(({ key, label }) => (
                      <th
                        key={key}
                        className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap"
                      >
                        <button
                          onClick={() => handleSort(key)}
                          className="flex items-center gap-1 hover:text-gray-900 group"
                        >
                          {label}
                          {sortCol === key ? (
                            sortDir === "asc" ? (
                              <ArrowUp size={12} className="text-blue-500" />
                            ) : (
                              <ArrowDown size={12} className="text-blue-500" />
                            )
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-300 group-hover:text-gray-400" />
                          )}
                        </button>
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                      Documents
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagedStudentIds.map((studentId) => {
                    const student = enrolledStudents.find((s) => s.id === studentId);
                    const app = applications.find((a) => a.studentId === studentId);
                    const displayStatus = app ? getDisplayStatus(app) : null;

                    return (
                      <tr key={studentId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">
                            {student?.name ?? `Student ${studentId}`}
                          </p>
                          <p className="text-xs text-gray-400">{student?.personnummer ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {app?.noticeSentAt ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {app && app.selectedReasons.length > 0 ? app.submittedDate : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {app && app.totalPoints > 0 ? (
                            <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                              {app.totalPoints} pts
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {displayStatus ? (
                            <Badge
                              className={`${displayStatus.className} border flex items-center gap-1 w-fit`}
                            >
                              {displayStatus.label === "Pending" ? (
                                <Clock size={11} />
                              ) : displayStatus.label === "Approved" ? (
                                <CheckCircle size={11} />
                              ) : null}
                              {displayStatus.label}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const docs = app?.attachedDocuments ?? [];
                            if (docs.length === 0) return <span className="text-gray-400 text-xs">—</span>;
                            const visible = docs.slice(0, 2);
                            const overflow = docs.length - 2;
                            return (
                              <div className="flex items-center gap-1.5">
                                {visible.map((doc, i) => (
                                  <span
                                    key={i}
                                    title={doc.name}
                                    className="flex items-center justify-center w-7 h-7 rounded bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors cursor-default"
                                  >
                                    <FileText size={14} />
                                  </span>
                                ))}
                                {overflow > 0 && (
                                  <span
                                    title={docs.slice(2).map((d) => d.name).join("\n")}
                                    className="inline-flex items-center justify-center h-7 px-1.5 rounded bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium cursor-default"
                                  >
                                    +{overflow}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {app && app.selectedReasons.length > 0 ? (
                              <Button
                                size="sm"
                                variant={app.status === "pending" ? "default" : "outline"}
                                className={
                                  app.status === "pending"
                                    ? "bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                    : "text-xs"
                                }
                                onClick={() => setReviewingApp(app)}
                              >
                                {app.status === "pending" ? "Review" : "View"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={!noticeSent}
                                title={
                                  noticeSent
                                    ? "Submit on behalf of student"
                                    : "Send the first notice before submitting on behalf of a student"
                                }
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:pointer-events-none"
                                onClick={() => {
                                  const s = enrolledStudents.find((e) => e.id === studentId);
                                  if (s) setOnBehalfStudent(s);
                                }}
                              >
                                <ClipboardEdit size={15} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v: string) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[72px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>
                  {rangeStart}–{rangeEnd} of {totalStudents}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Review modal */}
      <ReviewPriorityApplicationModal
        isOpen={reviewingApp !== null}
        onClose={() => setReviewingApp(null)}
        application={reviewingApp}
        onApprove={onApplicationApprove}
        onReject={onApplicationReject}
      />

      {/* Add student modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        availableStudents={addableStudents}
        noticeSent={noticeSent}
        onAdd={(ids) => onAddStudents(period.id, ids)}
      />

      {/* Submit on behalf modal */}
      <SubmitOnBehalfModal
        isOpen={onBehalfStudent !== null}
        onClose={() => setOnBehalfStudent(null)}
        student={onBehalfStudent}
        period={period}
        onSubmit={onSetRequestOnBehalf}
      />

      {/* Publish confirm dialog */}
      <AlertDialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish decisions</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish all decisions and close the priority period. Students who submitted
              a request will be notified by email. You can reopen the period for editing afterwards
              if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                onPublishResults(period.id);
                setIsPublishConfirmOpen(false);
              }}
            >
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
