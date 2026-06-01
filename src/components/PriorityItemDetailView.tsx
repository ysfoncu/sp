import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
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
  Users,
  Bell,
  CheckCircle,
  Clock,
  CheckCircle2,
  Upload,
  Send,
  ClipboardEdit,
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  FileText,
} from "lucide-react";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
  PriorityPlacementPeriod,
} from "../types/priorityPlacement";
import { ReviewPriorityApplicationModal } from "./ReviewPriorityApplicationModal";
import { SendFirstNoticeModal } from "./SendFirstNoticeModal";
import { SubmitOnBehalfModal } from "./SubmitOnBehalfModal";
import { AddStudentModal } from "./AddStudentModal";

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
  onApplicationApprove: (id: string, notes?: string) => void;
  onApplicationReject: (id: string, notes: string) => void;
  onSetRequestOnBehalf: (
    application: Omit<PriorityPlacementApplication, "id" | "submittedDate">
  ) => void;
}

function StepIndicator({
  step,
  label,
  done,
}: {
  step: number;
  label: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {done ? <CheckCircle2 size={14} /> : step}
      </div>
      <span className={`text-sm ${done ? "text-green-700 font-medium" : "text-gray-500"}`}>
        {label}
      </span>
    </div>
  );
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
  onSendFirstNotice,
  onSendIndividualNotice,
  onPublishResults,
  onReopenPeriod,
  onApplicationApprove,
  onApplicationReject,
  onSetRequestOnBehalf,
}: PriorityItemDetailViewProps) {
  const [reviewingApp, setReviewingApp] = useState<PriorityPlacementApplication | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [onBehalfStudent, setOnBehalfStudent] = useState<EnrolledStudent | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [sortCol, setSortCol] = useState<"student" | "notified" | "submitted" | "points" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activeFilter, setActiveFilter] = useState<"notified" | "review" | "approved" | "rejected" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const notNotifiedCount = period.importedStudentIds.filter(
    (id) => !applications.find((a) => a.studentId === id)?.noticeSentAt
  ).length;
  const reviewCount = applications.filter(
    (a) => a.selectedReasons.length > 0 && a.status === "pending"
  ).length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  const filteredStudentIds = useMemo(() => {
    let ids = sortedStudentIds;
    if (activeFilter) {
      ids = ids.filter((id) => {
        const app = applications.find((a) => a.studentId === id);
        if (activeFilter === "notified") return !app?.noticeSentAt;
        if (activeFilter === "review")
          return app && app.selectedReasons.length > 0 && app.status === "pending";
        if (activeFilter === "approved") return app?.status === "approved";
        if (activeFilter === "rejected") return app?.status === "rejected";
        return true;
      });
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      ids = ids.filter((id) => {
        const student = enrolledStudents.find((s) => s.id === id);
        return student?.name.toLowerCase().includes(q);
      });
    }
    return ids;
  }, [sortedStudentIds, activeFilter, searchQuery, applications, enrolledStudents]);

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
          {hasStudents && !noticeSent && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              onClick={() => setIsNoticeModalOpen(true)}
            >
              <Bell size={14} />
              Send first notice
            </Button>
          )}
          {hasStudents && noticeSent && !isPublished && (
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
              {period.firstNoticeDeadline && ` · Deadline: ${period.firstNoticeDeadline}`}
            </p>
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

        {/* Progress steps */}
        <div className="mt-5 flex items-center gap-6 flex-wrap">
          <StepIndicator step={1} label="Import students" done={hasStudents} />
          <div className="w-8 h-px bg-gray-300 hidden sm:block" />
          <StepIndicator step={2} label="Send first notice" done={noticeSent} />
          <div className="w-8 h-px bg-gray-300 hidden sm:block" />
          <StepIndicator step={3} label="Publish decisions" done={isPublished} />
        </div>
      </Card>

      {/* Notice sent info */}
      {noticeSent && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <Bell size={15} className="shrink-0" />
          <span>
            Notice sent{" "}
            <span className="font-medium">{period.firstNoticeSentAt}</span> · Deadline:{" "}
            <span className="font-medium">{period.firstNoticeDeadline}</span>
          </span>
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
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-700">
                  Students ({period.importedStudentIds.length})
                </p>
                {(
                  [
                    {
                      key: "notified" as const,
                      label: "Not notified",
                      value: notNotifiedCount,
                      active: "bg-gray-200 text-gray-700 border-gray-400",
                      inactive: "hover:border-gray-300 hover:text-gray-700",
                    },
                    {
                      key: "review" as const,
                      label: "Review",
                      value: reviewCount,
                      active: "bg-yellow-100 text-yellow-700 border-yellow-300",
                      inactive: "hover:border-yellow-200 hover:text-yellow-600",
                    },
                    {
                      key: "approved" as const,
                      label: "Approved",
                      value: approvedCount,
                      active: "bg-green-100 text-green-700 border-green-300",
                      inactive: "hover:border-green-200 hover:text-green-600",
                    },
                    {
                      key: "rejected" as const,
                      label: "Rejected",
                      value: rejectedCount,
                      active: "bg-red-100 text-red-700 border-red-300",
                      inactive: "hover:border-red-200 hover:text-red-600",
                    },
                  ] as const
                ).map(({ key, label, value, active, inactive }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter((f) => (f === key ? null : key))}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                      activeFilter === key
                        ? active
                        : `bg-white text-gray-500 border-gray-200 ${inactive}`
                    }`}
                  >
                    {label}
                    <span className={`font-semibold ${activeFilter === key ? "" : "text-gray-700"}`}>
                      {value}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {activeFilter
                  ? `${filteredStudentIds.length} of ${period.importedStudentIds.length} students`
                  : `${period.importedStudentIds.length} students`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
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
                          <button
                            onClick={() => {
                              setIsSearchOpen((v) => !v);
                              if (isSearchOpen) setSearchQuery("");
                            }}
                            className="ml-0.5"
                            title="Search by name"
                          >
                            <Search
                              size={12}
                              className={isSearchOpen ? "text-blue-500" : "text-gray-300 hover:text-gray-500"}
                            />
                          </button>
                        </div>
                        {isSearchOpen && (
                          <input
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name..."
                            className="px-2 py-1 text-xs font-normal border border-blue-300 rounded bg-white focus:outline-none focus:border-blue-500 w-40"
                          />
                        )}
                      </div>
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
                  {filteredStudentIds.map((studentId) => {
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
                            {noticeSent && !app?.noticeSentAt && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Send first notice to this student"
                                className="h-8 w-8 p-0 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => onSendIndividualNotice(period.id, studentId)}
                              >
                                <Bell size={15} />
                              </Button>
                            )}
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
                                title="Submit on behalf of student"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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

      {/* Send first notice modal */}
      <SendFirstNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        studentCount={period.importedStudentIds.length}
        onSend={(deadline, message) => onSendFirstNotice(period.id, deadline, message)}
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
