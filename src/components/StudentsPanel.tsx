import { useState, useMemo, useEffect, useRef } from "react";
import {
  Users,
  Search,
  X,
  Columns3,
  Network,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  File,
  Paperclip,
  Upload,
  AlertTriangle,
  Star,
  MapPin,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Student } from "../types/placementTask";
import { usePlacementProfiles } from "../types/placementProfile";
import { PriorityPlacementApplication } from "../types/priorityPlacement";
import { overBy, pointsOf, rankStudents } from "../types/quickAssign";
import { placesLabel, unassignedOf } from "../types/entityPicker";
import { EntityPickerPopover } from "./EntityPickerPopover";
import { PriorityApplicationDetailsModal } from "./PriorityApplicationDetailsModal";
import { toast } from "sonner@2.0.3";

interface FileMetadata {
  name: string;
  size: number;
  uploadedAt: string;
}

export interface AssignOption {
  id: string;
  name: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  remaining: number;
  over: number;
}

interface StudentsPanelProps {
  students: Student[];
  isAssignmentPublished: boolean;
  isStudentsExpanded: boolean;
  quotaEntityKeys: Set<string>;
  connectedPraksisPlaces?: { id: string; name: string }[];
  priorityApplications?: PriorityPlacementApplication[];
  // Places still free on the entities of this placement (never below 0)
  placesLeft?: number;
  onStudentsExpandChange: (expanded: boolean) => void;
  onDetachStudent: (studentId: string) => void;
  // Placing students on an entity: the students are picked in this table and added from a bar at the bottom
  assignTarget?: AssignOption | null;
  // Every entity the students can be placed on, for the students-first bar
  assignOptions?: AssignOption[];
  // The ticked students and the entity chosen for them live on the page, because the entity cards read them too
  selectedStudents: Set<string>;
  onSelectedStudentsChange: React.Dispatch<React.SetStateAction<Set<string>>>;
  pickedEntityId?: string | null;
  onPickEntity?: (entityId: string | null) => void;
  onAddToTarget?: (studentIds: string[], targetId?: string) => void;
  onCancelAssign?: () => void;
  onAttachFiles: (studentId: string, files: FileMetadata[]) => void;
  onRemoveFile: (studentId: string, fileId: string) => void;
  onOpenQuotaDialog: (student: Student) => void;
  onOpenNetworkDiagram: () => void;
  // The mentor control for one placed student
  renderMentor?: (student: Student) => React.ReactNode;
  // The profile now says something different from what the student was told at publish
  changedSincePublish?: (student: Student) => boolean;
}

// One collator for all name comparisons, instead of a new locale lookup on every comparison
const NAME_COLLATOR = new Intl.Collator();

export function StudentsPanel({
  students,
  isAssignmentPublished,
  isStudentsExpanded,
  quotaEntityKeys,
  connectedPraksisPlaces = [],
  priorityApplications,
  placesLeft,
  onStudentsExpandChange,
  onDetachStudent,
  assignTarget,
  assignOptions = [],
  selectedStudents,
  onSelectedStudentsChange: setSelectedStudents,
  pickedEntityId = null,
  onPickEntity,
  onAddToTarget,
  onCancelAssign,
  onAttachFiles,
  onRemoveFile,
  onOpenQuotaDialog,
  onOpenNetworkDiagram,
  renderMentor,
  changedSincePublish,
}: StudentsPanelProps) {
  const profiles = usePlacementProfiles();
  const [viewingPriorityApp, setViewingPriorityApp] = useState<PriorityPlacementApplication | null>(null);

  const priorityMap = useMemo(
    () => new Map((priorityApplications ?? []).map((a) => [a.studentId, a])),
    [priorityApplications]
  );
  // Points of approved applications by student; a student without one has the points from the import, if any
  const applicationPoints = useMemo(
    () => new Map((priorityApplications ?? []).map((a) => [a.studentId, a.totalPoints])),
    [priorityApplications],
  );
  const [visibleColumns, setVisibleColumns] = useState({
    student: true,
    placementHistory: true,
    assignedPlace: true,
    supervisor: true,
    customRequest: true,
    attachFiles: true,
    priorities: true,
  });
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [studentSortDir, setStudentSortDir] = useState<"asc" | "desc" | null>(null);
  const [prioritySortDir, setPrioritySortDir] = useState<"asc" | "desc" | null>(null);
  // Assignment filter: "all" | "unassigned" | <praksisPlaceId>
  const [filterAssignment, setFilterAssignment] = useState("all");
  // Priority filter: "all" | "with" | "without"
  const [filterPriority, setFilterPriority] = useState("all");
  const [expandedPlacementHistory, setExpandedPlacementHistory] = useState<Set<string>>(new Set());

  const studentsImported = students.length > 0;

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

  // Filtering, counting and sorting in one pass that only runs when what it depends on changes. The students
  // that pass the search and the priority filter come first; the assignment filter comes after, so the assigned /
  // not assigned counts say what pressing them will show.
  const { filteredStudents, assignedCount, notAssignedCount } = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    const base = students.filter((s) => {
      const hasPoints = pointsOf(s, applicationPoints) !== undefined;
      if (filterPriority === "with" && !hasPoints) return false;
      if (filterPriority === "without" && hasPoints) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.personnummer ?? "").toLowerCase().includes(q) ||
        (s.address ?? "").toLowerCase().includes(q)
      );
    });
    const assigned = base.filter((s) => s.assignedPraksisPlace).length;
    const shown = base
      .filter((s) => {
        if (filterAssignment === "all") return true;
        if (filterAssignment === "assigned") return !!s.assignedPraksisPlace;
        if (filterAssignment === "unassigned") return !s.assignedPraksisPlace;
        return s.assignedPraksisPlace?.placeId === filterAssignment;
      })
      .sort((a, b) => {
        if (prioritySortDir) {
          const apts = pointsOf(a, applicationPoints) ?? -1;
          const bpts = pointsOf(b, applicationPoints) ?? -1;
          return prioritySortDir === "asc" ? apts - bpts : bpts - apts;
        }
        return studentSortDir === "asc"
          ? NAME_COLLATOR.compare(a.name, b.name)
          : studentSortDir === "desc"
            ? NAME_COLLATOR.compare(b.name, a.name)
            : 0;
      });
    return { filteredStudents: shown, assignedCount: assigned, notAssignedCount: base.length - assigned };
  }, [students, studentSearch, filterPriority, filterAssignment, applicationPoints, prioritySortDir, studentSortDir]);
  const placing = !!assignTarget;
  const pickable = useMemo(() => filteredStudents.filter((s) => !s.assignedPraksisPlace), [filteredStudents]);
  // The ticked students that still have no entity (one placed elsewhere meanwhile drops out)
  const selectedIds = useMemo(() => unassignedOf(selectedStudents, students), [students, selectedStudents]);
  // Students-first: ticked students and no entity chosen from the + yet; the entity is picked in the bar
  const studentsFirst = !assignTarget && selectedIds.length > 0;
  const pickedEntity = assignOptions.find((o) => o.id === pickedEntityId) ?? null;
  const tableRef = useRef<HTMLDivElement>(null);
  const topForPlacing = () => {
    if (!assignTarget) return;
    const top = rankStudents(pickable, { query: "" }, applicationPoints, assignTarget.praksisPlaceName).slice(0, Math.max(0, assignTarget.remaining));
    setSelectedStudents(new Set(top.map((s) => s.id)));
  };
  const addSelected = () => {
    onAddToTarget?.(selectedIds);
    setSelectedStudents(new Set());
    // The bar closes once the students are added; the + on an entity starts the next batch
    onCancelAssign?.();
  };
  // Students-first: the group goes to the entity picked in the bar, and the bar closes (nothing is ticked any more)
  const addToPicked = () => {
    if (!pickedEntity) return;
    onAddToTarget?.(selectedIds, pickedEntity.id);
    setSelectedStudents(new Set());
    onPickEntity?.(null);
    setTimeout(() => tableRef.current?.focus(), 0);
  };
  // Students no free place covers: the places left do not reach them
  const shortBy = placesLeft === undefined ? 0 : Math.max(0, notAssignedCount - placesLeft);

  // Every student is shown: there is no paging
  const totalStudents = filteredStudents.length;

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
        <div className="text-center max-w-md">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No students in this placement
          </h3>
          <p className="text-gray-600">
            Students come from Praksis-students. Import them there, then start a new placement for their emne.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Table Header Actions */}
      <div className="flex items-end justify-between gap-3 p-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800">Students</h3>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600" aria-live="polite">
              <span>
                <span className="font-semibold text-gray-900">{filteredStudents.length}</span>
                {filteredStudents.length !== students.length && ` of ${students.length}`} student{students.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                aria-pressed={filterAssignment === "assigned"}
                title="Show only assigned students"
                onClick={() => setFilterAssignment(filterAssignment === "assigned" ? "all" : "assigned")}
                className={`rounded px-1.5 py-0.5 hover:bg-gray-100 ${filterAssignment === "assigned" ? "bg-green-50 ring-1 ring-green-300" : ""}`}
              >
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-green-700" aria-hidden="true" />
                <span className="font-semibold text-green-700">{assignedCount}</span> assigned
              </button>
              <button
                type="button"
                aria-pressed={filterAssignment === "unassigned"}
                title="Show only students without a place"
                onClick={() => setFilterAssignment(filterAssignment === "unassigned" ? "all" : "unassigned")}
                className={`rounded px-1.5 py-0.5 hover:bg-gray-100 ${filterAssignment === "unassigned" ? "bg-amber-50 ring-1 ring-amber-300" : ""}`}
              >
                <CircleDashed className="mr-1 inline h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                <span className="font-semibold text-amber-700">{notAssignedCount}</span> not assigned
              </button>
              {placesLeft !== undefined && (
                <span title="Free places on the entities of this placement">
                  <span className="font-semibold text-gray-900">{placesLeft}</span> places left
                </span>
              )}
              {shortBy > 0 && (
                <span className="text-amber-800" title="Students no free place covers. They can still be placed; raise places or add an entity.">
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-semibold">{shortBy}</span> without a free place
                </span>
              )}
            </p>
          </div>

          {/* Search & filters */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {!isSearchMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSearchMode(true)}
                  className="justify-start text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200"
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* Assignment */}
                <Select value={filterAssignment} onValueChange={setFilterAssignment}>
                  <SelectTrigger className="h-8 w-[200px] bg-gray-100 border-gray-200">
                    <SelectValue placeholder="Assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All assignments</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unassigned">Not assigned</SelectItem>
                    {connectedPraksisPlaces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority */}
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-8 w-[170px] bg-gray-100 border-gray-200">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="with">With priority</SelectItem>
                    <SelectItem value="without">Without priority</SelectItem>
                  </SelectContent>
                </Select>

                {(filterAssignment !== "all" || filterPriority !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterAssignment("all");
                      setFilterPriority("all");
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
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, personnummer or address..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="h-8 pl-10"
                    autoFocus
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSearchMode(false);
                    setStudentSearch("");
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </>
            )}
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
                        ["supervisor", "Mentor"],
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

        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} tabIndex={-1} className={`overflow-x-auto outline-none ${placing || studentsFirst ? "pb-28" : ""}`}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-3 text-left w-12">
                <Checkbox
                  checked={pickable.length > 0 && pickable.every((s) => selectedStudents.has(s.id))}
                  aria-label="Select all students without an entity in this list"
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      // Every student without an entity that the filters show, over all pages
                      setSelectedStudents(new Set(pickable.map((s) => s.id)));
                    } else {
                      setSelectedStudents(new Set());
                    }
                  }}
                />
              </th>
              {visibleColumns.student && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 select-none">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-gray-900 transition-colors w-fit"
                    onClick={() =>
                      setStudentSortDir((d) =>
                        d === "asc" ? "desc" : d === "desc" ? null : "asc",
                      )
                    }
                  >
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
                  Mentor
                </th>
              )}
              {visibleColumns.priorities && (
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    setPrioritySortDir((d) =>
                      d === "asc" ? "desc" : d === "desc" ? null : "asc",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Priorities
                    {prioritySortDir === "asc" ? (
                      <ChevronUp className="h-3.5 w-3.5 text-blue-500" />
                    ) : prioritySortDir === "desc" ? (
                      <ChevronDown className="h-3.5 w-3.5 text-blue-500" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </div>
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
                  {!student.assignedPraksisPlace && (
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      aria-label={`Select ${student.name}`}
                      onCheckedChange={() => handleToggleStudentSelection(student.id)}
                    />
                  )}
                </td>

                {visibleColumns.student && (
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-800">{student.name}</div>
                    {student.personnummer && (
                      <div className="text-xs text-gray-400 font-mono">{student.personnummer}</div>
                    )}
                    <div className="text-sm text-gray-500">{student.email}</div>
                    {(student.studyLocation || student.registered === false) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                        {student.studyLocation && (
                          <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-gray-600" title="Study location">
                            {student.studyLocation}
                          </span>
                        )}
                        {student.registered === false && (
                          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-800">Not registered</span>
                        )}
                      </div>
                    )}
                    {student.address && (
                      <div className="mt-0.5 flex items-start gap-1 text-xs text-gray-500" title="Home address">
                        <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span>{student.address}</span>
                      </div>
                    )}
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
                      <div>
                        <div>
                          <div className="font-medium text-gray-800 text-[12px]">
                            {student.assignedPraksisPlace.placeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.assignedPraksisPlace.departmentName}
                          </div>
                          {(() => {
                            const a = student.assignedPraksisPlace!;
                            const prof = a.profileId ? profiles.find((x) => x.id === a.profileId) : undefined;
                            const label =
                              a.status === "booked" ? "Booked" : a.status === "completed" ? "Completed" : a.status === "cancelled" ? "Cancelled" : "Planned";
                            const tone =
                              a.status === "booked"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : a.status === "completed"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : a.status === "cancelled"
                                    ? "bg-gray-50 text-gray-500 border-gray-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200";
                            return (
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className={`text-xs ${tone}`}>
                                  {label}
                                </Badge>
                                {!isAssignmentPublished && (
                                  <Badge
                                    variant="outline"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Detach ${student.name} from ${a.departmentName || a.placeName}`}
                                    className="cursor-pointer border-red-200 bg-red-50 text-xs text-red-600 hover:bg-red-100"
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      onDetachStudent(student.id);
                                      toast.success(`${student.name} detached from praksis place`);
                                    }}
                                    onKeyDown={(e: React.KeyboardEvent) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onDetachStudent(student.id);
                                        toast.success(`${student.name} detached from praksis place`);
                                      }
                                    }}
                                  >
                                    Detach
                                  </Badge>
                                )}
                                {changedSincePublish?.(student) && (
                                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-800" title="The entity now says something different from what the student was told">
                                    Info changed
                                  </Badge>
                                )}
                                {prof ? (
                                  // The entity name is already shown above; only an archived entity needs a note
                                  prof.status === "archived" && <span className="text-xs text-gray-400">(archived)</span>
                                ) : (
                                  <span className="text-xs text-amber-700" title="Not linked to an entity">
                                    Unlinked
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      !isAssignmentPublished && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenQuotaDialog(student)}
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
                    {student.assignedPraksisPlace && renderMentor ? (
                      renderMentor(student)
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                )}

                {visibleColumns.priorities && (
                  <td className="px-4 py-4">
                    {priorityMap.has(student.id) ? (
                      <button
                        onClick={() => setViewingPriorityApp(priorityMap.get(student.id)!)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                      >
                        <Star size={11} />
                        {priorityMap.get(student.id)!.totalPoints} pts
                      </button>
                    ) : pointsOf(student, applicationPoints) !== undefined ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                        title="Priority points from the import"
                      >
                        <Star size={11} />
                        {pointsOf(student, applicationPoints)} pts
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
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

      {/* All students are listed; this line says how many */}
      <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3 text-xs text-gray-500">
        {totalStudents} student{totalStudents === 1 ? "" : "s"}
        {totalStudents !== students.length && ` of ${students.length}`}
      </div>
    </div>

    {/* Placing students: the bar that shows the pick and adds it to the entity */}
    {placing && assignTarget && (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:pr-24">
        <div
          role="region"
          aria-label="Place the selected students"
          className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white shadow-xl"
        >
          <div role="status" aria-live="polite" className="text-sm text-slate-200">
            <span className="font-semibold text-white">{selectedIds.length}</span> student
            {selectedIds.length !== 1 ? "s" : ""} selected
            <span className="text-slate-400"> · </span>
            <span className="font-semibold text-white">{assignTarget.remaining}</span> place{assignTarget.remaining !== 1 ? "s" : ""} left
            {overBy(assignTarget.remaining, selectedIds.length) > 0 && (
              <span className="ml-1 inline-flex items-center gap-1 font-semibold text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                over by {overBy(assignTarget.remaining, selectedIds.length)}
              </span>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={topForPlacing}
              disabled={assignTarget.remaining <= 0 || pickable.length === 0}
              className="text-xs font-medium text-sky-300 hover:underline disabled:text-slate-500 disabled:no-underline"
              title="Select the students with most points, as many as there are places left"
            >
              Select top {Math.max(0, assignTarget.remaining)} by points
            </button>
            {selectedIds.length > 0 && (
              <button type="button" onClick={() => setSelectedStudents(new Set())} className="text-xs text-slate-300 hover:underline">
                Clear
              </button>
            )}
            <Button
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={addSelected}
              className="bg-sky-500 text-white hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
            >
              Add {selectedIds.length} to {assignTarget.name}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelAssign} className="border-slate-500 bg-transparent text-white hover:bg-slate-800 hover:text-white">
              Done
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Students first: the group is ticked, the entity is picked here (a light bar, not the dark one of the + flow) */}
    {studentsFirst && (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:pr-24">
        <div
          role="region"
          aria-label="Add the selected students to a praksis place"
          className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 border-indigo-600 bg-indigo-50 px-4 py-3 text-indigo-950 shadow-xl"
        >
          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Students first</span>
          <div role="status" aria-live="polite" className="text-sm">
            <span className="font-semibold">{selectedIds.length}</span> student{selectedIds.length !== 1 ? "s" : ""} selected
            <span className="text-indigo-400"> · </span>
            {pickedEntity ? (
              <>
                <span className="font-semibold">{pickedEntity.praksisPlaceName} - {pickedEntity.name}</span>
                <span className="text-indigo-700">, {placesLabel(pickedEntity.remaining, pickedEntity.over)}</span>
                {overBy(pickedEntity.remaining, selectedIds.length) > 0 && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    over by {overBy(pickedEntity.remaining, selectedIds.length)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-indigo-700">no place chosen yet</span>
            )}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setSelectedStudents(new Set())} className="text-xs text-indigo-800 hover:underline">
              Clear
            </button>
            <EntityPickerPopover options={assignOptions} selectedCount={selectedIds.length} onPick={(id) => onPickEntity?.(id)}>
              <Button size="sm" variant="outline" className="border-indigo-600 bg-white text-indigo-900 hover:bg-indigo-100" aria-haspopup="listbox">
                {pickedEntity ? "Change place" : "Choose praksis place…"}
              </Button>
            </EntityPickerPopover>
            <Button
              size="sm"
              disabled={!pickedEntity}
              onClick={addToPicked}
              className="bg-indigo-700 text-white hover:bg-indigo-800 disabled:bg-indigo-200 disabled:text-indigo-500"
            >
              {pickedEntity ? `Add ${selectedIds.length} to ${pickedEntity.name}` : `Add ${selectedIds.length}`}
            </Button>
          </div>
        </div>
      </div>
    )}

    {viewingPriorityApp && (
      <PriorityApplicationDetailsModal
        application={viewingPriorityApp}
        onClose={() => setViewingPriorityApp(null)}
      />
    )}
    </>
  );
}
