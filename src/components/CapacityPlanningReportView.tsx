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
  ClipboardList,
  Building2,
  Users,
} from "lucide-react";
import { Student } from "../types/placementTask";
import { PlacementTaskState, StudentPlacement } from "../types/studentPlacement";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";
import { Study } from "./SettingsView";
import { PeriodFilterButton } from "./PeriodFilterButton";
import {
  PeriodOption,
  getSemesterRanges,
  matchesPeriod,
  getPeriodChips,
  togglePeriod,
} from "./periodFilter";

interface CapacityPlanningReportViewProps {
  requests: CoordinatorQuotaRequest[];
  placements: StudentPlacement[];
  placementTaskStates: PlacementTaskState[];
  studies: Study[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "fulfilled", label: "Fulfilled" },
];

function termLabel(p: StudentPlacement): string {
  return [p.semester, p.year].filter(Boolean).join(" ");
}

function quotaStatusClass(status?: string): string {
  switch (status) {
    case "approved":
    case "fulfilled":
      return "bg-green-100 text-green-700 border border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    default:
      return "bg-gray-100 text-gray-500 border border-gray-200";
  }
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

function requestRequested(r: CoordinatorQuotaRequest): number {
  if (r.entityDistributions && r.entityDistributions.length > 0)
    return r.entityDistributions.reduce((s, e) => s + (e.requestedQuota ?? 0), 0);
  return r.requestedCapacity ?? 0;
}
function requestApproved(r: CoordinatorQuotaRequest): number {
  if (r.entityDistributions && r.entityDistributions.length > 0)
    return r.entityDistributions.reduce((s, e) => s + (e.approvedQuota ?? 0), 0);
  return r.approvedCapacity ?? 0;
}

export function CapacityPlanningReportView({
  requests,
  placements,
  placementTaskStates,
  studies,
}: CapacityPlanningReportViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filterStudy, setFilterStudy] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterEmne, setFilterEmne] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
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

  const placementById = useMemo(() => {
    const m = new Map<string, StudentPlacement>();
    placements.forEach((p) => m.set(p.id, p));
    return m;
  }, [placements]);

  const availableEmnes = useMemo(
    () => [...new Set(requests.map((r) => r.emne).filter(Boolean))].sort() as string[],
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((r) => {
      if (filterStudy !== "all" && r.studyId !== filterStudy) return false;
      if (filterProgram !== "all" && r.programId !== filterProgram) return false;
      if (filterEmne !== "all" && r.emne !== filterEmne) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (
        selectedPeriods.size > 0 &&
        !matchesPeriod(
          r.startDate,
          r.endDate,
          selectedPeriods,
          customStartDate,
          customEndDate,
          semesterRanges,
        )
      )
        return false;
      if (!q) return true;
      const entityNames = (r.entityDistributions ?? [])
        .map((e) => e.entityName)
        .join(" ");
      return (
        r.praksisPlaceName.toLowerCase().includes(q) ||
        (r.studyName ?? "").toLowerCase().includes(q) ||
        (r.programName ?? "").toLowerCase().includes(q) ||
        (r.emne ?? "").toLowerCase().includes(q) ||
        entityNames.toLowerCase().includes(q)
      );
    });
  }, [
    requests,
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

  const selectedRequests = useMemo(
    () => filteredRequests.filter((r) => selectedIds.has(r.id)),
    [filteredRequests, selectedIds],
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
    filteredRequests.length > 0 &&
    filteredRequests.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (allVisibleSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredRequests.map((r) => r.id)));
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
        <h1 className="text-2xl font-bold text-gray-800">Capacity planning report</h1>
        <p className="text-sm text-gray-600 mt-1">
          Select one or more quota requests to compare requested &amp; approved capacity
          against what their placement actually consumes
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

                {/* Period filter */}
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
                    placeholder="Search by praksis place, study, programme, emne…"
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

      {/* Split: request list (left) + comparison (right) */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: selectable requests */}
        {!isExpanded && (
          <div className="w-96 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {filteredRequests.length} request
                {filteredRequests.length === 1 ? "" : "s"}
                {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
              </span>
              {filteredRequests.length > 0 && (
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
              {filteredRequests.length > 0 ? (
                filteredRequests.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleSelected(r.id)}
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
                            {r.praksisPlaceName}
                          </span>
                          <Badge className={`${quotaStatusClass(r.status)} text-[10px] capitalize`}>
                            {r.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {r.programName}
                          {r.emne ? ` · ${r.emne}` : ""}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Requested {requestRequested(r)} · Approved {requestApproved(r)}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center text-sm text-gray-400 py-8">
                  No requests match
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: comparison grouped by request */}
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
          {selectedRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-8">
              <ClipboardList className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Select one or more quota requests
              </p>
              <p className="text-xs mt-1">
                Their requested vs consumed capacity appears here.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {selectedRequests.map((r) => {
                // All placement tasks linked to this request: the placement it
                // was created in, plus any whose students reference it directly.
                const linkedIds = new Set<string>();
                if (r.placementId) linkedIds.add(r.placementId);
                placementTaskStates.forEach((ts) => {
                  if (
                    (ts.students as Student[] | undefined)?.some(
                      (s) => s.assignedPraksisPlace?.quotaRequestId === r.id,
                    )
                  )
                    linkedIds.add(ts.placementId);
                });
                const linked = [...linkedIds]
                  .map((id) => ({
                    placement: placementById.get(id),
                    students: studentsByPlacement.get(id) ?? [],
                  }))
                  .filter(
                    (x): x is { placement: StudentPlacement; students: Student[] } =>
                      !!x.placement,
                  );
                return <RequestSection key={r.id} request={r} linked={linked} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestSection({
  request,
  linked,
}: {
  request: CoordinatorQuotaRequest;
  linked: { placement: StudentPlacement; students: Student[] }[];
}) {
  const period = [request.startDate, request.endDate].filter(Boolean).join(" – ");

  const entities =
    request.entityDistributions && request.entityDistributions.length > 0
      ? request.entityDistributions
      : [
          {
            id: request.departmentId,
            entityId: request.departmentId,
            entityName: request.departmentName,
            requestedQuota: request.requestedCapacity,
            approvedQuota: request.approvedCapacity,
            status: request.status,
          },
        ];

  // Students assigned to this request's praksis place, across all linked placements.
  const allStudents = linked.flatMap((l) => l.students);
  const consumedForEntity = (entityId: string) =>
    allStudents.filter((s) => {
      const ap = s.assignedPraksisPlace;
      if (!ap) return false;
      return (
        ap.placeId === request.praksisPlaceId &&
        (ap.entityId ?? ap.departmentId) === entityId
      );
    }).length;

  const rows = entities.map((e) => {
    const requested = e.requestedQuota ?? 0;
    const approved = e.approvedQuota ?? 0;
    const consumed = consumedForEntity(e.entityId);
    return {
      key: e.entityId,
      name: e.entityName,
      requested,
      approved,
      consumed,
      available: approved - consumed,
    };
  });

  const totals = rows.reduce(
    (a, r) => ({
      requested: a.requested + r.requested,
      approved: a.approved + r.approved,
      consumed: a.consumed + r.consumed,
    }),
    { requested: 0, approved: 0, consumed: 0 },
  );
  const totalAvailable = totals.approved - totals.consumed;

  const entityCols = ["Entity", "Requested", "Approved", "Consumed", "Available"];
  const placementCols = ["Title", "Start date", "End date", "Total assigned students"];

  // Students assigned to this request's praksis place within a given placement.
  const assignedInPlacement = (students: Student[]) =>
    students.filter((s) => s.assignedPraksisPlace?.placeId === request.praksisPlaceId)
      .length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* General info about the request */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">{request.praksisPlaceName}</h3>
        <div className="mt-1 flex items-center gap-3 flex-wrap text-sm text-gray-600">
          <span>
            {request.studyName}
            {request.programName ? (
              <span className="text-gray-400"> / {request.programName}</span>
            ) : null}
          </span>
          <span className="text-gray-300">·</span>
          <span>{request.emne || "—"}</span>
          <span className="text-gray-300">·</span>
          <span className="whitespace-nowrap">{period || "—"}</span>
          <Badge className={`${quotaStatusClass(request.status)} text-xs capitalize`}>
            {request.status}
          </Badge>
        </div>
      </div>

      {/* Request details — per entity */}
      <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Request details
      </div>
      <div className="overflow-x-auto border-b border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/50 text-left">
              {entityCols.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{row.name || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{row.requested}</td>
                <td className="px-4 py-3 text-gray-700">{row.approved}</td>
                <td className="px-4 py-3 text-gray-700">{row.consumed}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    row.available < 0 ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  {row.available}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 bg-gray-50/70 font-semibold text-gray-800">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3">{totals.requested}</td>
              <td className="px-4 py-3">{totals.approved}</td>
              <td className="px-4 py-3">{totals.consumed}</td>
              <td className={`px-4 py-3 ${totalAvailable < 0 ? "text-red-600" : ""}`}>
                {totalAvailable}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Linked placement tasks */}
      <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Linked placement tasks ({linked.length})
      </div>
      {linked.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50 text-left">
                {placementCols.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {linked.map(({ placement, students }) => (
                <tr key={placement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {placement.title || termLabel(placement)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {placement.startDate || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {placement.endDate || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {assignedInPlacement(students)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic px-4 py-6">
          No placement tasks linked to this request.
        </p>
      )}
    </div>
  );
}
