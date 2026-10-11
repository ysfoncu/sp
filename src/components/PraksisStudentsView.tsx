import { useMemo, useState } from "react";
import { toast } from "sonner@2.0.3";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search, Star, Users, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "./ui/utils";
import { PriorityPlacementApplication } from "../types/priorityPlacement";
import { PriorityApplicationDetailsModal } from "./PriorityApplicationDetailsModal";
import { useStudyCatalog } from "../types/studyCatalog";
import { usePlacementProfiles } from "../types/placementProfile";
import {
  EMPTY_FILTERS,
  StudentFilters,
  StudentRow,
  SortDir,
  SortKey,
  StudentStatus,
  countAssigned,
  countByStatus,
  filterRows,
  importStudents,
  importSummary,
  priorityOf,
  priorityPointsOf,
  sortRows,
} from "../types/praksisStudent";

interface PraksisStudentsViewProps {
  rows: StudentRow[];
  priorityApplications?: PriorityPlacementApplication[];
  onOpenPlacement: (placementId: string) => void;
}

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<StudentStatus, string> = {
  waiting: "Waiting",
  inPlacement: "In placement · no place yet",
  planned: "Planned",
  placed: "Placed",
  completed: "Completed",
};
const STATUS_STYLE: Record<StudentStatus, string> = {
  waiting: "bg-amber-50 text-amber-800 border-amber-200",
  inPlacement: "bg-purple-50 text-purple-800 border-purple-200",
  planned: "bg-sky-50 text-sky-800 border-sky-200",
  placed: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-green-50 text-green-800 border-green-200",
};

const fmt = (d: string) => (d ? d.split("-").reverse().join(".") : "");

export function PraksisStudentsView({ rows, priorityApplications = [], onOpenPlacement }: PraksisStudentsViewProps) {
  const { all: studies } = useStudyCatalog();
  const profiles = usePlacementProfiles();
  const summary = importSummary();
  const profileName = (id?: string) => profiles.find((p) => p.id === id)?.name;
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  // Click a column to sort ascending, again for descending, a third time to go back to the default order
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);
  const [viewingPriority, setViewingPriority] = useState<PriorityPlacementApplication | null>(null);

  const set = (patch: Partial<StudentFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  // Names for ids (archived items included)
  const names = useMemo(() => {
    const study = new Map<string, string>();
    const program = new Map<string, string>();
    const emne = new Map<string, string>();
    studies.forEach((s) => {
      study.set(s.id, s.name);
      s.programs.forEach((p) => {
        program.set(p.id, p.name);
        (p.emner ?? []).forEach((e) => emne.set(e.id, e.name));
      });
    });
    return { study, program, emne };
  }, [studies]);

  // Only studies, programs and emner students actually belong to are offered
  const options = useMemo(() => {
    const unique = (ids: string[]) => Array.from(new Set(ids));
    const inStudy = (r: StudentRow) => filters.studyId === "all" || r.student.studyId === filters.studyId;
    const inProgram = (r: StudentRow) => filters.programId === "all" || r.student.programId === filters.programId;
    return {
      studies: unique(rows.map((r) => r.student.studyId)),
      programs: unique(rows.filter(inStudy).map((r) => r.student.programId)),
      emner: unique(rows.filter(inStudy).filter(inProgram).map((r) => r.student.emneId)),
      locations: unique(rows.map((r) => r.student.studyLocation)).sort(),
    };
  }, [rows, filters.studyId, filters.programId]);

  const counts = countByStatus(filterRows(rows, filters, true));
  const filtered = useMemo(() => {
    const list = filterRows(rows, filters);
    if (!sort) return list;
    const label = (m: Map<string, string>) => (id: string) => m.get(id) ?? "";
    return sortRows(list, sort.key, sort.dir, {
      study: label(names.study),
      program: label(names.program),
      emne: label(names.emne),
      profile: (id) => profiles.find((p) => p.id === id)?.name ?? "",
      priority: (student) => priorityPointsOf(student, priorityApplications),
    });
  }, [rows, filters, sort, names, profiles, priorityApplications]);
  const assignedCounts = countAssigned(filtered);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setSort((cur) => (cur?.key !== key ? { key, dir: "asc" } : cur.dir === "asc" ? { key, dir: "desc" } : null));
    setPage(1);
  };

  const dirty = JSON.stringify({ ...filters, status: "" }) !== JSON.stringify({ ...EMPTY_FILTERS, status: "" });

  const handleImport = () => {
    const added = importStudents();
    if (added === 0) toast.info("These students are already imported");
    else toast.success(`${added} students imported`, { description: `${summary.studies} ${summary.studies === 1 ? "study" : "studies"}, ${summary.programs} programs and ${summary.emner} VFU courses.` });
  };

  const chips: { id: StudentFilters["status"]; label: string; count?: number }[] = [
    { id: "active", label: "Open", count: counts.waiting + counts.inPlacement + counts.planned + counts.placed },
    { id: "waiting", label: "Waiting", count: counts.waiting },
    { id: "inPlacement", label: "In placement", count: counts.inPlacement },
    { id: "planned", label: "Planned", count: counts.planned },
    { id: "placed", label: "Placed", count: counts.placed },
    { id: "completed", label: "Completed", count: counts.completed },
    { id: "all", label: "All", count: counts.waiting + counts.inPlacement + counts.planned + counts.placed + counts.completed },
  ];

  const nameOf = (m: Map<string, string>, id: string) => m.get(id) ?? "—";

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Praksis-students</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Students who are registered for a praksis and need a place. They stay here until their placement is
            completed.
          </p>
        </div>
        <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Download className="h-4 w-4 mr-2" />
          Import students
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
          <div className="text-center max-w-md">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No students yet</h3>
            <p className="text-gray-600 mb-6">
              Import students to find praksis places for them. The import brings {summary.students} students of Umeå universitet:
              {" "}{summary.studies} {summary.studies === 1 ? "study" : "studies"}, {summary.programs} programs and {summary.emner} VFU courses.
            </p>
            <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700 text-white">
              Import students
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set({ status: c.id })}
                  className={cn(
                    "px-3 h-8 rounded-full border text-sm",
                    filters.status === c.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                  )}
                >
                  {c.label} <span className="opacity-80">{c.count}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={filters.query}
                  onChange={(e) => set({ query: e.target.value })}
                  placeholder="Search name, personnummer or email"
                  className="h-9 pl-8"
                />
              </div>
              <FilterSelect
                label="Study"
                value={filters.studyId}
                onChange={(v) => set({ studyId: v, programId: "all", emneId: "all" })}
                options={options.studies.map((id) => ({ id, name: nameOf(names.study, id) }))}
              />
              <FilterSelect
                label="Program"
                value={filters.programId}
                onChange={(v) => set({ programId: v, emneId: "all" })}
                options={options.programs.map((id) => ({ id, name: nameOf(names.program, id) }))}
              />
              <FilterSelect
                label="Emne"
                value={filters.emneId}
                onChange={(v) => set({ emneId: v })}
                options={options.emner.map((id) => ({ id, name: nameOf(names.emne, id) }))}
              />
              <FilterSelect
                label="Location"
                value={filters.location}
                onChange={(v) => set({ location: v })}
                options={options.locations.map((l) => ({ id: l, name: l }))}
              />
              <FilterSelect
                label="Placement"
                value={filters.placement}
                onChange={(v) => set({ placement: v as StudentFilters["placement"] })}
                allLabel="Any"
                allValue="any"
                options={[
                  { id: "none", name: "Not in a placement" },
                  { id: "in", name: "In a placement" },
                ]}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Starts between</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={filters.startFrom}
                    onChange={(e) => set({ startFrom: e.target.value })}
                    aria-label="Starts from"
                    className="h-9 w-36 [color-scheme:light]"
                  />
                  <span className="text-gray-400">–</span>
                  <Input
                    type="date"
                    value={filters.startTo}
                    onChange={(e) => set({ startTo: e.target.value })}
                    aria-label="Starts to"
                    className="h-9 w-36 [color-scheme:light]"
                  />
                </div>
              </div>
              {dirty && (
                <Button
                  variant="ghost"
                  className="h-9 text-gray-600"
                  onClick={() => set({ ...EMPTY_FILTERS, status: filters.status })}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-100 px-4 py-2 text-sm text-gray-600" aria-live="polite">
            <span>
              <span className="font-semibold text-gray-900">{filtered.length}</span> student{filtered.length === 1 ? "" : "s"}
            </span>
            <span title="Has a praksis place">
              <span className="font-semibold text-green-700">{assignedCounts.assigned}</span> assigned
            </span>
            <span title="No praksis place yet">
              <span className="font-semibold text-amber-700">{assignedCounts.notAssigned}</span> not assigned
            </span>
          </p>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <SortableTh label="Student" sortKey="student" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Study · program" sortKey="program" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Emne" sortKey="emne" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Praksis period" sortKey="period" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Hours" sortKey="hours" sort={sort} onSort={toggleSort} right />
                  <SortableTh label="Location" sortKey="location" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Placement" sortKey="placement" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Praksis place" sortKey="place" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Entity" sortKey="profile" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Mentor" sortKey="mentor" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Priority" sortKey="priority" sort={sort} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const s = r.student;
                  const a = r.assignment;
                  return (
                    <tr key={s.id} className="border-b border-gray-100 align-top">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.personnummer}</div>
                        {s.registered === false && <div className="text-xs text-amber-700">Not registered</div>}
                      </td>
                      <td className="px-4 py-2">
                        <div>{nameOf(names.study, s.studyId)}</div>
                        <div className="text-xs text-gray-500">{nameOf(names.program, s.programId)}</div>
                      </td>
                      <td className="px-4 py-2">{nameOf(names.emne, s.emneId)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {fmt(s.startDate)} – {fmt(s.endDate)}
                      </td>
                      <td className="px-4 py-2 text-right">{s.expectedHours || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2">{s.studyLocation}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className={STATUS_STYLE[r.status]}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {r.placementId ? (
                          <button type="button" className="text-blue-600 hover:underline text-left max-w-[260px] truncate block" title={r.placementTitle} onClick={() => onOpenPlacement(r.placementId as string)}>
                            {r.placementTitle}
                          </button>
                        ) : (
                          <span className="text-gray-400">Not in a placement</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{a ? a.placeName : <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2">{a ? (profileName(a.profileId) ?? a.departmentName ?? "—") : <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2">
                        {a?.mentor ? a.mentor.name : a ? <span className="text-amber-700">Needs mentor</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2">
                        {(() => {
                          const app = priorityOf(s, priorityApplications);
                          return app ? (
                            <button
                              type="button"
                              onClick={() => setViewingPriority(app)}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                              title="Show the priority application"
                            >
                              <Star size={11} />
                              {app.totalPoints} pts
                            </button>
                          ) : s.priorityPoints ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700" title="Priority points from the import">
                              <Star size={11} />
                              {s.priorityPoints} pts
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                      No students match the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-3 text-sm text-gray-600">
            <span>
              {filtered.length === 0
                ? "0 students"
                : `${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length} students`}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                Previous
              </Button>
              <span>
                Page {current} of {pageCount}
              </span>
              <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
      {viewingPriority && <PriorityApplicationDetailsModal application={viewingPriority} onClose={() => setViewingPriority(null)} />}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
  allValue = "all",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  allLabel?: string;
  allValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-44" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allValue}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SortableTh({
  label,
  sortKey,
  sort,
  onSort,
  right = false,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
  right?: boolean;
}) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-4 py-2 font-medium", right && "text-right")} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn("inline-flex items-center gap-1 hover:text-gray-900", active && "text-gray-900", right && "flex-row-reverse")}
        title={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} />
      </button>
    </th>
  );
}
