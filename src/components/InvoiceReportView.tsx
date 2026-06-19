import { useState, useMemo, Fragment } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Search,
  X,
  ChevronDown,
  CalendarRange,
  Receipt,
  Pencil,
} from "lucide-react";
import { EnrolledStudent } from "../types/priorityPlacement";
import { Student } from "../types/placementTask";
import { PlacementTaskState, StudentPlacement } from "../types/studentPlacement";
import { PraksisPlace } from "../types/praksisPlace";
import { OrganizationNode } from "../types/organizationStructure";
import { Study } from "./SettingsView";
import { PeriodFilterButton } from "./PeriodFilterButton";
import {
  PeriodOption,
  getSemesterRanges,
  matchesPeriod,
  getPeriodChips,
  togglePeriod,
} from "./periodFilter";

interface InvoiceReportViewProps {
  placements: StudentPlacement[];
  placementTaskStates: PlacementTaskState[];
  enrolledStudents: EnrolledStudent[];
  praksisPlaces: PraksisPlace[];
  studies: Study[];
}

const DEFAULT_WEEKLY_COST = 1809;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "booked", label: "Booked" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "canceled_extra", label: "Canceled — with extra cost" },
  { value: "canceled_noextra", label: "Canceled — without extra cost" },
];

// ISO-8601 week number
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  );
}

// Find the ancestor path (root → node) for a node id within an org tree.
function findOrgPath(
  node: OrganizationNode,
  id: string,
  trail: OrganizationNode[] = [],
): OrganizationNode[] | null {
  const next = [...trail, node];
  if (node.id === id) return next;
  for (const child of node.children) {
    const found = findOrgPath(child, id, next);
    if (found) return found;
  }
  return null;
}

interface InvoiceRow {
  key: string;
  personnummer: string;
  name: string;
  programName: string;
  emne?: string;
  studyId: string;
  programId: string;
  studyLocation: string;
  placeId?: string;
  placeName?: string;
  departmentId?: string;
  entityPath: string;
  startDate?: string;
  endDate?: string;
  cancellationDate?: string;
  fromWeek?: number;
  toWeek?: number;
  placeStatus: "Empty" | "Ongoing" | "Completed";
  invoiceStatus:
    | "booked"
    | "ongoing"
    | "completed"
    | "canceled_extra"
    | "canceled_noextra";
  weeks: number;
}

export function InvoiceReportView({
  placements,
  placementTaskStates,
  enrolledStudents,
  praksisPlaces,
  studies,
}: InvoiceReportViewProps) {
  const [weeklyCost, setWeeklyCost] = useState<number>(DEFAULT_WEEKLY_COST);
  const [weeklyCostOpen, setWeeklyCostOpen] = useState(false);
  const [weeklyCostDraft, setWeeklyCostDraft] = useState(String(DEFAULT_WEEKLY_COST));
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [selectedEmnes, setSelectedEmnes] = useState<Set<string>>(new Set());
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlaceId, setFilterPlaceId] = useState("all");
  const [filterDeptId, setFilterDeptId] = useState("all");
  const [selectedPeriods, setSelectedPeriods] = useState<Set<PeriodOption>>(
    new Set<PeriodOption>(),
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  // Editable per-row invoice fields
  const [invoiceState, setInvoiceState] = useState<
    Record<string, { invoiceNumber: string; isPaid: boolean }>
  >({});

  const semesterRanges = useMemo(() => getSemesterRanges(new Date()), []);

  // Build one row per assigned student (a requested place + assigned student)
  const allRows = useMemo<InvoiceRow[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows: InvoiceRow[] = [];

    placementTaskStates.forEach((ts) => {
      const placement = placements.find((p) => p.id === ts.placementId);
      (ts.students as Student[] | undefined)?.forEach((st) => {
        const ap = st.assignedPraksisPlace;
        if (!ap) return; // only students actually assigned to a place are invoiced
        const enrolled = enrolledStudents.find((e) => e.id === st.id);
        const place = praksisPlaces.find((pl) => pl.id === ap.placeId);

        const start = ap.startDate ?? placement?.startDate;
        const end = ap.endDate ?? placement?.endDate;
        const fromWeek = start ? isoWeek(new Date(start)) : undefined;
        const toWeek = end ? isoWeek(new Date(end)) : undefined;
        let weeks = 0;
        if (fromWeek != null && toWeek != null) {
          weeks = toWeek - fromWeek;
          if (weeks < 0) weeks += 52;
        }

        let placeStatus: InvoiceRow["placeStatus"] = "Empty";
        if (start && end) {
          const s = new Date(start);
          const e = new Date(end);
          if (today < s) placeStatus = "Empty";
          else if (today > e) placeStatus = "Completed";
          else placeStatus = "Ongoing";
        }
        const invoiceStatus =
          placeStatus === "Empty"
            ? "booked"
            : placeStatus === "Ongoing"
            ? "ongoing"
            : "completed";

        // Full hierarchy for the entity, including parent(s), separated by " / ".
        const fallbackPath =
          [ap.placeName, ap.departmentName].filter(Boolean).join(" / ") || "—";
        let entityPath = fallbackPath;
        if (place?.organizationStructure && ap.entityId) {
          const p = findOrgPath(place.organizationStructure, ap.entityId);
          if (p) entityPath = p.map((n) => n.name).join(" / ");
        }

        rows.push({
          key: `${ts.placementId}:${st.id}`,
          personnummer: enrolled?.personnummer ?? "—",
          name: enrolled?.name ?? st.name,
          programName: enrolled?.programName ?? placement?.programId ?? "—",
          emne: placement?.subject,
          studyId: placement?.studyId ?? enrolled?.studyId ?? "",
          programId: placement?.programId ?? enrolled?.programId ?? "",
          studyLocation: enrolled?.studyLocation ?? "—",
          placeId: ap.placeId,
          placeName: ap.placeName,
          departmentId: ap.departmentId,
          entityPath,
          startDate: start,
          endDate: end,
          cancellationDate: undefined,
          fromWeek,
          toWeek,
          placeStatus,
          invoiceStatus,
          weeks,
        });
      });
    });
    return rows;
  }, [placements, placementTaskStates, enrolledStudents, praksisPlaces]);

  const availableEmnes = useMemo(
    () => [...new Set(allRows.map((r) => r.emne).filter(Boolean) as string[])].sort(),
    [allRows],
  );
  const availableLocations = useMemo(
    () => [...new Set(allRows.map((r) => r.studyLocation).filter(Boolean))].sort(),
    [allRows],
  );

  const rows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allRows.filter((r) => {
      if (selectedPrograms.size > 0 && !selectedPrograms.has(r.programId)) return false;
      if (selectedEmnes.size > 0 && !(r.emne && selectedEmnes.has(r.emne))) return false;
      if (filterLocation !== "all" && r.studyLocation !== filterLocation) return false;
      if (filterStatus !== "all" && r.invoiceStatus !== filterStatus) return false;
      if (filterPlaceId !== "all" && r.placeId !== filterPlaceId) return false;
      if (filterDeptId !== "all" && r.departmentId !== filterDeptId) return false;
      if (
        selectedPeriods.size > 0 &&
        (!r.startDate ||
          !r.endDate ||
          !matchesPeriod(
            r.startDate,
            r.endDate,
            selectedPeriods,
            customStartDate,
            customEndDate,
            semesterRanges,
          ))
      )
        return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) || r.personnummer.toLowerCase().includes(q)
      );
    });
  }, [
    allRows,
    searchTerm,
    selectedPrograms,
    selectedEmnes,
    filterLocation,
    filterStatus,
    filterPlaceId,
    filterDeptId,
    selectedPeriods,
    customStartDate,
    customEndDate,
    semesterRanges,
  ]);

  // Expected cost: the standard ((to_week - from_week) - 1) * weekly_cost.
  function expectedCost(r: InvoiceRow): number {
    return Math.max(0, r.weeks - 1) * weeklyCost;
  }
  // Total (billable) cost: same as expected, except a placement canceled
  // WITHOUT extra cost is not charged.
  function billableCost(r: InvoiceRow): number {
    return r.invoiceStatus === "canceled_noextra" ? 0 : expectedCost(r);
  }
  const expectedTotal = rows.reduce((sum, r) => sum + expectedCost(r), 0);
  const grandTotal = rows.reduce((sum, r) => sum + billableCost(r), 0);

  // Group rows by assigned entity (for subtotals)
  const groups = useMemo(() => {
    const m = new Map<string, InvoiceRow[]>();
    rows.forEach((r) => {
      const key = r.entityPath || "—";
      const arr = m.get(key);
      if (arr) arr.push(r);
      else m.set(key, [r]);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  function setInvoice(key: string, patch: Partial<{ invoiceNumber: string; isPaid: boolean }>) {
    setInvoiceState((prev) => ({
      ...prev,
      [key]: { invoiceNumber: "", isPaid: false, ...prev[key], ...patch },
    }));
  }

  // Study / programme multi-select helpers
  function toggleProgram(id: string) {
    setSelectedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleStudy(study: Study, allSelected: boolean) {
    setSelectedPrograms((prev) => {
      const next = new Set(prev);
      study.programs.forEach((p) =>
        allSelected ? next.delete(p.id) : next.add(p.id),
      );
      return next;
    });
  }
  function toggleEmne(e: string) {
    setSelectedEmnes((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e);
      else next.add(e);
      return next;
    });
  }

  const praksisLabel = useMemo(() => {
    if (filterPlaceId === "all") return "Praksis place";
    const place = praksisPlaces.find((p) => p.id === filterPlaceId);
    if (!place) return "Praksis place";
    if (filterDeptId === "all") return place.name;
    const dept = place.departments.find((d) => d.id === filterDeptId);
    return dept ? `${place.name} / ${dept.name}` : place.name;
  }, [filterPlaceId, filterDeptId, praksisPlaces]);

  const activeFilterCount =
    selectedPrograms.size +
    selectedEmnes.size +
    (filterLocation !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0) +
    (filterPlaceId !== "all" ? 1 : 0);

  function clearFilters() {
    setSelectedPrograms(new Set());
    setSelectedEmnes(new Set());
    setFilterLocation("all");
    setFilterStatus("all");
    setFilterPlaceId("all");
    setFilterDeptId("all");
  }

  const triggerCls =
    "gap-2 text-gray-600 justify-between bg-gray-100 hover:bg-gray-200 border-gray-200";

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoicing</h1>
          <p className="text-sm text-gray-600 mt-1">
            Requested places &amp; assigned students — each booked place generates a cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Weekly cost</span>
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
            {weeklyCost.toLocaleString()}
          </Badge>
          <Popover
            open={weeklyCostOpen}
            onOpenChange={(o) => {
              setWeeklyCostOpen(o);
              if (o) setWeeklyCostDraft(String(weeklyCost));
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-500 hover:text-gray-800"
                title="Edit weekly cost"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3 space-y-2">
              <label className="text-xs font-medium text-gray-600">
                Weekly cost
              </label>
              <Input
                type="number"
                value={weeklyCostDraft}
                autoFocus
                onChange={(e) => setWeeklyCostDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setWeeklyCost(Number(weeklyCostDraft) || 0);
                    setWeeklyCostOpen(false);
                  }
                }}
                className="h-9"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeeklyCostOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setWeeklyCost(Number(weeklyCostDraft) || 0);
                    setWeeklyCostOpen(false);
                  }}
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filter toolbar */}
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

            {/* Study / Programme (multi) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`max-w-[240px] ${triggerCls}`}>
                  <span className="truncate">
                    Study / Programme
                    {selectedPrograms.size > 0 ? ` (${selectedPrograms.size})` : ""}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[280px] p-2 max-h-[360px] overflow-y-auto">
                {studies.map((study) => {
                  const progIds = study.programs.map((p) => p.id);
                  const allSel =
                    progIds.length > 0 && progIds.every((id) => selectedPrograms.has(id));
                  return (
                    <div key={study.id} className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleStudy(study, allSel)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-left"
                      >
                        <Checkbox checked={allSel} className="pointer-events-none" />
                        <span className="font-medium text-sm text-gray-800">
                          {study.name}
                        </span>
                      </button>
                      <div className="pl-7 space-y-0.5">
                        {study.programs.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                          >
                            <Checkbox
                              checked={selectedPrograms.has(p.id)}
                              onCheckedChange={() => toggleProgram(p.id)}
                            />
                            {p.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </PopoverContent>
            </Popover>

            {/* Emne (multi) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`max-w-[180px] ${triggerCls}`}>
                  <span className="truncate">
                    Emne{selectedEmnes.size > 0 ? ` (${selectedEmnes.size})` : ""}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[200px] p-2 max-h-[320px] overflow-y-auto">
                {availableEmnes.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-1">No emne available</p>
                ) : (
                  availableEmnes.map((e) => (
                    <label
                      key={e}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                    >
                      <Checkbox
                        checked={selectedEmnes.has(e)}
                        onCheckedChange={() => toggleEmne(e)}
                      />
                      {e}
                    </label>
                  ))
                )}
              </PopoverContent>
            </Popover>

            {/* Study location */}
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-[150px] bg-gray-100 border-gray-200">
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

            {/* Placement status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px] bg-gray-100 border-gray-200">
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

            {/* Praksis place (hierarchical) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`max-w-[240px] ${triggerCls}`}>
                  <span className="truncate">{praksisLabel}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px]">
                <DropdownMenuItem
                  onSelect={() => {
                    setFilterPlaceId("all");
                    setFilterDeptId("all");
                  }}
                  className={filterPlaceId === "all" ? "font-medium text-blue-600" : ""}
                >
                  All praksis places
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {praksisPlaces.map((pl) => (
                  <DropdownMenuSub key={pl.id}>
                    <DropdownMenuSubTrigger
                      className={
                        filterPlaceId === pl.id && filterDeptId === "all"
                          ? "font-medium text-blue-600"
                          : ""
                      }
                    >
                      {pl.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[220px]">
                      <DropdownMenuItem
                        onSelect={() => {
                          setFilterPlaceId(pl.id);
                          setFilterDeptId("all");
                        }}
                        className={
                          filterPlaceId === pl.id && filterDeptId === "all"
                            ? "font-medium text-blue-600"
                            : ""
                        }
                      >
                        All entities
                      </DropdownMenuItem>
                      {pl.departments.length > 0 && <DropdownMenuSeparator />}
                      {pl.departments.map((d) => (
                        <DropdownMenuItem
                          key={d.id}
                          onSelect={() => {
                            setFilterPlaceId(pl.id);
                            setFilterDeptId(d.id);
                          }}
                          className={
                            filterDeptId === d.id ? "font-medium text-blue-600" : ""
                          }
                        >
                          {d.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Period */}
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
                placeholder="Search student by name or personnummer…"
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

      {/* Period chips */}
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
                onClick={() => setSelectedPeriods(togglePeriod(selectedPeriods, chip.key))}
                className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Invoice table */}
      <div className="flex-1 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden min-h-0">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-700">
            {rows.length} invoice line{rows.length === 1 ? "" : "s"}
          </span>
          <span className="text-sm text-gray-600 flex items-center gap-2">
            Total cost:
            <Badge className="bg-blue-600 text-white border border-blue-600 font-semibold">
              {grandTotal.toLocaleString()}
            </Badge>
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-400 py-16">
              <Receipt className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No invoice lines</p>
              <p className="text-xs mt-1">
                Assign students to praksis places, or adjust the filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[1200px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-gray-50 text-left">
                  {[
                    "Personnummer",
                    "Student",
                    "Program / Emne",
                    "Main praksis place",
                    "Entity (full hierarchy)",
                    "Start / End",
                    "From wk",
                    "To wk",
                    "Cancellation",
                    "Place status",
                    "Expected cost",
                    "Total cost",
                    "Invoice no.",
                    "Paid",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 font-semibold text-gray-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {groups.map(([entity, groupRows]) => {
                  const expectedSub = groupRows.reduce(
                    (s, r) => s + expectedCost(r),
                    0,
                  );
                  const totalSub = groupRows.reduce(
                    (s, r) => s + billableCost(r),
                    0,
                  );
                  return (
                    <Fragment key={entity}>
                      {groupRows.map((r) => {
                        const inv = invoiceState[r.key];
                        return (
                          <tr key={r.key} className="hover:bg-gray-50 align-top">
                            <td className="px-3 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">
                              {r.personnummer}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                              {r.name}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                              {r.programName}
                              {r.emne ? (
                                <span className="text-gray-400"> / {r.emne}</span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                              {r.placeName ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">
                              {r.entityPath}
                            </td>
                            <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                              <div className="text-gray-700">{r.startDate ?? "—"}</div>
                              <div className="text-gray-400">{r.endDate ?? "—"}</div>
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 text-center">
                              {r.fromWeek ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 text-center">
                              {r.toWeek ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                              {r.cancellationDate ?? "—"}
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge
                                className={
                                  r.placeStatus === "Completed"
                                    ? "bg-gray-100 text-gray-600 border border-gray-200 text-xs"
                                    : r.placeStatus === "Ongoing"
                                    ? "bg-green-100 text-green-700 border border-green-200 text-xs"
                                    : "bg-blue-100 text-blue-700 border border-blue-200 text-xs"
                                }
                              >
                                {r.placeStatus}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <Badge className="bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-xs">
                                {expectedCost(r).toLocaleString()}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs">
                                {billableCost(r).toLocaleString()}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5">
                              <Input
                                value={inv?.invoiceNumber ?? ""}
                                onChange={(e) =>
                                  setInvoice(r.key, { invoiceNumber: e.target.value })
                                }
                                placeholder="—"
                                className="h-8 w-28 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Checkbox
                                checked={inv?.isPaid ?? false}
                                onCheckedChange={(v) => setInvoice(r.key, { isPaid: !!v })}
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {/* Subtotal for this entity */}
                      <tr className="bg-gray-50 border-t border-gray-200 text-gray-700 font-medium">
                        <td colSpan={10} className="px-3 py-2 text-right">
                          Subtotal — {entity}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge className="bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-xs">
                            {expectedSub.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs">
                            {totalSub.toLocaleString()}
                          </Badge>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50/70 font-semibold text-gray-800">
                  <td className="px-3 py-2.5" colSpan={10}>
                    Total ({rows.length} line{rows.length === 1 ? "" : "s"})
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge className="bg-gray-200 text-gray-700 border border-gray-300 font-semibold text-xs">
                      {expectedTotal.toLocaleString()}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge className="bg-blue-600 text-white border border-blue-600 font-semibold text-xs">
                      {grandTotal.toLocaleString()}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
