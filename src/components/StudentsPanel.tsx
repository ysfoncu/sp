import { useState } from "react";
import {
  Users,
  Search,
  X,
  Filter,
  Columns3,
  Network,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Trash2,
  File,
  Paperclip,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Student } from "../types/placementTask";
import { toast } from "sonner@2.0.3";

interface FileMetadata {
  name: string;
  size: number;
  uploadedAt: string;
}

interface StudentsPanelProps {
  students: Student[];
  isAssignmentPublished: boolean;
  isFirstPublishCompleted: boolean;
  isStudentsExpanded: boolean;
  quotaEntityKeys: Set<string>;
  onStudentsExpandChange: (expanded: boolean) => void;
  onImportStudents: () => void;
  onDetachStudent: (studentId: string) => void;
  onAttachFiles: (studentId: string, files: FileMetadata[]) => void;
  onBulkAttachFiles: (studentIds: string[], files: FileMetadata[]) => void;
  onRemoveFile: (studentId: string, fileId: string) => void;
  onOpenQuotaDialog: (student: Student) => void;
  onShowPublishWarning: () => void;
  onOpenNetworkDiagram: () => void;
}

export function StudentsPanel({
  students,
  isAssignmentPublished,
  isFirstPublishCompleted,
  isStudentsExpanded,
  quotaEntityKeys,
  onStudentsExpandChange,
  onImportStudents,
  onDetachStudent,
  onAttachFiles,
  onBulkAttachFiles,
  onRemoveFile,
  onOpenQuotaDialog,
  onShowPublishWarning,
  onOpenNetworkDiagram,
}: StudentsPanelProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    student: true,
    placementHistory: true,
    assignedPlace: true,
    supervisor: false,
    customRequest: true,
    attachFiles: true,
    priorities: true,
  });
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSortDir, setStudentSortDir] = useState<"asc" | "desc" | null>(null);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [expandedPlacementHistory, setExpandedPlacementHistory] = useState<Set<string>>(new Set());

  const studentsImported = students.length > 0 || isFirstPublishCompleted;

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const togglePlacementHistory = (studentId: string) => {
    setExpandedPlacementHistory((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const openFilePicker = (onFiles: (files: FileMetadata[]) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const meta = Array.from(target.files).map((f) => ({
          name: f.name,
          size: f.size,
          uploadedAt: new Date().toISOString(),
        }));
        onFiles(meta);
      }
    };
    input.click();
  };

  const filteredStudents = students
    .filter((s) => !showUnassignedOnly || !s.assignedPraksisPlace)
    .filter(
      (s) =>
        !studentSearch.trim() ||
        s.name.toLowerCase().includes(studentSearch.toLowerCase()),
    )
    .sort((a, b) =>
      studentSortDir === "asc"
        ? a.name.localeCompare(b.name)
        : studentSortDir === "desc"
          ? b.name.localeCompare(a.name)
          : 0,
    );

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
        <div className="text-center max-w-md">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No students imported yet
          </h3>
          <p className="text-gray-600 mb-6">
            Import students to start managing placements and assignments.
          </p>
          <Button
            onClick={onImportStudents}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Import Students
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Table Header Actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800">Students</h3>
            <button
              type="button"
              onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
              className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                showUnassignedOnly
                  ? "bg-amber-100 border-amber-300 text-amber-700 font-medium"
                  : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {showUnassignedOnly ? "Showing unassigned only" : "Show unassigned only"}
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search students…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="h-6 pl-7 pr-6 text-xs border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 w-44"
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{
                  width: `${(students.filter((s) => s.assignedPraksisPlace).length / students.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {students.filter((s) => s.assignedPraksisPlace).length} /{" "}
              {students.length} assigned
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {!isAssignmentPublished && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNetworkDiagram}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-300"
            >
              <Network className="h-4 w-4" />
              Diagram
            </Button>
          )}

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>

          {/* Column Visibility */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="flex items-center gap-2"
            >
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>

            {isColumnMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsColumnMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  <div className="p-3 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-800">Show Columns</h4>
                  </div>
                  <div className="p-2">
                    {(
                      [
                        ["student", "Student"],
                        ["placementHistory", "Placement History"],
                        ["assignedPlace", "Assigned Praksis Place"],
                        ["supervisor", "Supervisor"],
                        ["priorities", "Priorities"],
                        ["customRequest", "Custom Request"],
                        ["attachFiles", "Attach Files"],
                      ] as [keyof typeof visibleColumns, string][]
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={visibleColumns[key]}
                          onCheckedChange={() => toggleColumn(key)}
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Expand / collapse left panel */}
          <button
            type="button"
            onClick={() => onStudentsExpandChange(!isStudentsExpanded)}
            title={
              isStudentsExpanded
                ? "Collapse — show quotas panel"
                : "Expand — hide quotas panel"
            }
            className="p-1.5 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isStudentsExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Bulk Actions Dropdown */}
          {!isAssignmentPublished && (
            <div className="relative">
              <Button
                size="sm"
                disabled={selectedStudents.size === 0}
                onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                className={`flex items-center gap-2 ${
                  selectedStudents.size === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Actions
                <ChevronDown className="h-4 w-4" />
              </Button>

              {isActionsDropdownOpen && selectedStudents.size > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsActionsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        const selectedIds = Array.from(selectedStudents);
                        openFilePicker((files) => {
                          onBulkAttachFiles(selectedIds, files);
                        });
                        setIsActionsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Attach files to students</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Add file(s) to {selectedStudents.size} student
                          {selectedStudents.size !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-3 text-left w-12">
                <Checkbox
                  checked={
                    selectedStudents.size === students.length && students.length > 0
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStudents(new Set(students.map((s) => s.id)));
                    } else {
                      setSelectedStudents(new Set());
                    }
                  }}
                />
              </th>
              {visibleColumns.student && (
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    setStudentSortDir((d) =>
                      d === "asc" ? "desc" : d === "desc" ? null : "asc",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Student
                    {studentSortDir === "asc" ? (
                      <ChevronUp className="h-3.5 w-3.5 text-blue-500" />
                    ) : studentSortDir === "desc" ? (
                      <ChevronDown className="h-3.5 w-3.5 text-blue-500" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.placementHistory && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Placement History
                </th>
              )}
              {visibleColumns.assignedPlace && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-64">
                  Praksis Place
                </th>
              )}
              {visibleColumns.supervisor && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Supervisor
                </th>
              )}
              {visibleColumns.priorities && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Priorities
                </th>
              )}
              {visibleColumns.customRequest && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Custom Request
                </th>
              )}
              {visibleColumns.attachFiles && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Attach Files
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className={`border-b border-gray-100 transition-colors ${
                  student.assignedPraksisPlace
                    ? "bg-green-50/50 opacity-60 hover:opacity-80 hover:bg-green-50"
                    : "hover:bg-blue-50/40"
                }`}
              >
                <td className="px-2 py-4">
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => handleToggleStudentSelection(student.id)}
                  />
                </td>

                {visibleColumns.student && (
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-800">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </td>
                )}

                {visibleColumns.placementHistory && (
                  <td className="px-4 py-4">
                    {student.placementHistory && student.placementHistory.length > 0 ? (
                      <div className="space-y-1">
                        {(() => {
                          const isExpanded = expandedPlacementHistory.has(student.id);
                          const displayPlacements = isExpanded
                            ? student.placementHistory
                            : student.placementHistory.slice(-2);
                          return (
                            <>
                              {displayPlacements.map((ph) => {
                                const statusColor =
                                  ph.status === "current"
                                    ? "border-l-blue-400 bg-blue-50"
                                    : ph.status === "upcoming"
                                      ? "border-l-green-400 bg-green-50"
                                      : "border-l-gray-300 bg-gray-50";
                                const textColor =
                                  ph.status === "current"
                                    ? "text-blue-800"
                                    : ph.status === "upcoming"
                                      ? "text-green-800"
                                      : "text-gray-600";
                                const topLine = [ph.year, ph.semester, ph.emne]
                                  .filter(Boolean)
                                  .join(" / ");
                                const placeLabel = ph.unitName
                                  ? `${ph.praksisPlaceName} / ${ph.unitName}`
                                  : ph.praksisPlaceName;
                                const isConflict =
                                  ph.praksisPlaceName &&
                                  ph.unitName &&
                                  quotaEntityKeys.has(
                                    `${ph.praksisPlaceName.toLowerCase()}|${ph.unitName.toLowerCase()}`,
                                  );
                                return (
                                  <div
                                    key={ph.placementId}
                                    className={`border-l-2 pl-2 py-0.5 rounded-sm ${statusColor}`}
                                  >
                                    <div
                                      className={`text-xs font-medium ${textColor} flex items-center gap-1`}
                                    >
                                      {isConflict && (
                                        <span title="Student has already been placed at this entity">
                                          <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                        </span>
                                      )}
                                      {topLine}
                                    </div>
                                    {placeLabel && (
                                      <div
                                        className="text-xs text-gray-500 truncate max-w-[200px]"
                                        title={placeLabel}
                                      >
                                        {placeLabel}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {student.placementHistory.length > 2 && (
                                <button
                                  onClick={() => togglePlacementHistory(student.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
                                >
                                  {isExpanded
                                    ? "Show less"
                                    : `Show ${student.placementHistory.length - 2} more`}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No history</span>
                    )}
                  </td>
                )}

                {visibleColumns.assignedPlace && (
                  <td className="px-4 py-4">
                    {student.assignedPraksisPlace ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-[12px]">
                            {student.assignedPraksisPlace.placeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.assignedPraksisPlace.departmentName}
                          </div>
                          {student.assignedPraksisPlace.approvalRequested && (
                            <Badge
                              variant="outline"
                              className={`mt-1 text-xs ${
                                student.assignedPraksisPlace.approvalStatus === "pending"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : student.assignedPraksisPlace.approvalStatus === "approved"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {student.assignedPraksisPlace.approvalStatus === "pending" &&
                                "⏳ Approval pending"}
                              {student.assignedPraksisPlace.approvalStatus === "approved" &&
                                "✓ Approved"}
                              {student.assignedPraksisPlace.approvalStatus === "rejected" &&
                                "✗ Rejected"}
                            </Badge>
                          )}
                        </div>
                        {!isAssignmentPublished && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 text-xs cursor-pointer hover:bg-red-100"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onDetachStudent(student.id);
                              toast.success(
                                `${student.name} detached from praksis place`,
                              );
                            }}
                          >
                            Detach
                          </Badge>
                        )}
                      </div>
                    ) : (
                      !isAssignmentPublished && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!isFirstPublishCompleted) {
                              onShowPublishWarning();
                            } else {
                              onOpenQuotaDialog(student);
                            }
                          }}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          Add praksis place
                        </Button>
                      )
                    )}
                  </td>
                )}

                {visibleColumns.supervisor && (
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {student.supervisor ? student.supervisor.name : "Not assigned"}
                    </span>
                  </td>
                )}

                {visibleColumns.priorities && (
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {student.priorities || "Not set"}
                    </span>
                  </td>
                )}

                {visibleColumns.customRequest && (
                  <td className="px-4 py-4">
                    {student.customRequest ? (
                      <div className="max-w-xs">
                        <div className="font-medium text-sm text-gray-800 mb-1">
                          Preferred: {student.customRequest.preferredPlaceName}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {student.customRequest.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Submitted:{" "}
                          {new Date(
                            student.customRequest.submittedAt,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {student.customRequestSubmitted
                          ? "Submitted"
                          : "Not submitted yet"}
                      </span>
                    )}
                  </td>
                )}

                {visibleColumns.attachFiles && (
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {student.attachedFiles && student.attachedFiles.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {student.attachedFiles.map((file) => (
                              <div key={file.id} className="relative group">
                                <div
                                  className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
                                  title={file.name}
                                >
                                  <File className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                  <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 w-64">
                                    <div className="font-medium text-sm mb-1 break-words">
                                      {file.name}
                                    </div>
                                    <div className="text-xs text-gray-300 mb-2">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveFile(student.id, file.id);
                                      }}
                                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Remove
                                    </button>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                                      <div className="border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openFilePicker((files) =>
                                onAttachFiles(student.id, files),
                              )
                            }
                            className="text-xs"
                          >
                            <Paperclip className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openFilePicker((files) =>
                              onAttachFiles(student.id, files),
                            )
                          }
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 flex items-center gap-1"
                        >
                          <Upload className="h-4 w-4" />
                          Attach
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
