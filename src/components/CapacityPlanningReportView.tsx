import { Fragment, useMemo, useState } from "react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertOctagon,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Layers,
  Search,
} from "lucide-react";
import { Student } from "../types/placementTask";
import { PlacementTaskState, StudentPlacement } from "../types/studentPlacement";
import { PraksisPlace } from "../types/praksisPlace";
import { usePraksisLimits } from "../types/praksisLimit";
import {
  LimitOtherPlacement,
  PlaceLimitTree,
  limitTreeForPlacement,
  limitViolations,
  periodKeyFor,
} from "../types/limitUsage";
import { Study, StudyEmne, StudyProgram } from "./SettingsView";

interface CapacityPlanningReportViewProps {
  placements: StudentPlacement[];
  placementTaskStates: PlacementTaskState[];
  praksisPlaces: PraksisPlace[];
  studies: Study[];
}

type Selection =
  | { kind: "study"; studyId: string }
  | { kind: "program"; studyId: string; programId: string }
  | { kind: "emne"; studyId: string; programId: string; emneId: string };

type Semester = "Spring" | "Autumn";

// A day inside the semester, so yearly limit windows can be matched to it
const semesterDate = (year: number, semester: Semester) => `${year}-${semester === "Spring" ? "03" : "10"}-01`;

// Capacity planning report: the Praksis place limits of each study → program → emne, and how
// much of them placements use in the chosen semester
export function CapacityPlanningReportView({
  placements,
  placementTaskStates,
  praksisPlaces,
  studies,
}: CapacityPlanningReportViewProps) {
  const allLimits = usePraksisLimits();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [semester, setSemester] = useState<Semester>(today.getMonth() < 7 ? "Spring" : "Autumn");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const years = useMemo(() => {
    const set = new Set<number>([today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]);
    placements.forEach((p) => Number(p.year) && set.add(Number(p.year)));
    return [...set].sort();
  }, [placements]);

  // Number of limits that give the emne a share
  const limitCount = (programId: string, emneName?: string) =>
    allLimits.filter((l) =>
      l.emneShares.some((s) => s.programId === programId && (!emneName || s.emneName === emneName)),
    ).length;

  // ── Tree (left) ──────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  const matches = (text: string) => !q || text.toLowerCase().includes(q);
  const programVisible = (study: Study, p: StudyProgram) =>
    matches(study.name) || matches(p.name) || (p.emner ?? []).some((e) => matches(e.name));
  const studyVisible = (study: Study) => matches(study.name) || study.programs.some((p) => programVisible(study, p));
  // While searching, everything that matches is shown expanded
  const isOpen = (key: string) => !!q || !collapsed.has(key);
  const toggle = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const selectionKey = (s: Selection | null) =>
    !s ? "" : s.kind === "study" ? `s:${s.studyId}` : s.kind === "program" ? `p:${s.programId}` : `e:${s.programId}:${s.emneId}`;

  const renderTreeRow = (
    key: string,
    level: number,
    label: string,
    icon: (selected: boolean) => React.ReactNode,
    onSelect: () => void,
    hasChildren: boolean,
    count?: number,
  ) => {
    const selected = selectionKey(selection) === key;
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
          selected ? "bg-[#155dfc] text-white" : "hover:bg-gray-50 text-gray-700"
        }`}
        style={{ paddingLeft: `${12 + level * 24}px` }}
        onClick={onSelect}
      >
        {hasChildren ? (
          <button type="button" onClick={(e) => toggle(key, e)} className="flex-shrink-0">
            {isOpen(key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        {icon(selected)}
        <span className="text-sm font-medium truncate flex-1">{label}</span>
        {count !== undefined && count > 0 && (
          <span
            className={`text-xs rounded-full px-1.5 ${selected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {count}
          </span>
        )}
      </div>
    );
  };

  // ── Selected emner (right) ─────────────────────────────────────────────────
  const selectedStudy = selection ? studies.find((s) => s.id === selection.studyId) : undefined;
  const selectedEmner: Array<{ program: StudyProgram; emne: StudyEmne }> = !selectedStudy
    ? []
    : selectedStudy.programs
        .filter((p) => selection!.kind === "study" || p.id === (selection as { programId: string }).programId)
        .flatMap((p) =>
          (p.emner ?? [])
            .filter((e) => selection!.kind !== "emne" || e.id === selection!.emneId)
            .map((emne) => ({ program: p, emne })),
        );

  const studentsByPlacement = useMemo(
    () => new Map(placementTaskStates.map((ts) => [ts.placementId, (ts.students as Student[]) ?? []])),
    [placementTaskStates],
  );

  const reportCtx = { year, semester, startDate: semesterDate(year, semester) };

  // Limits of one emne with their usage in the chosen semester
  const emneReport = (program: StudyProgram, emne: StudyEmne) => {
    const ctx = { ...reportCtx, programId: program.id, emne: emne.name };
    const emnePlacements = placements.filter((p) => p.programId === program.id && p.subject === emne.name);
    const others: LimitOtherPlacement[] = emnePlacements.map((p) => ({
      placementId: p.id,
      year: p.year,
      semester: p.semester,
      startDate: p.startDate,
      programId: p.programId,
      emne: p.subject,
      students: studentsByPlacement.get(p.id) ?? [],
    }));
    const trees = limitTreeForPlacement(allLimits, praksisPlaces, ctx, [], others);
    return { trees, emnePlacements };
  };

  // Placements (in the limit's period) with students inside the limit's subtree, and how many
  const placementsUsing = (
    tree: PlaceLimitTree,
    limitEntityId: string,
    limit: Parameters<typeof periodKeyFor>[0],
    emnePlacements: StudentPlacement[],
  ) => {
    const key = periodKeyFor(limit, reportCtx);
    return emnePlacements.flatMap((p) => {
      if (periodKeyFor(limit, { year: p.year, semester: p.semester, startDate: p.startDate }) !== key) return [];
      const n = (studentsByPlacement.get(p.id) ?? []).filter((s) => {
        const a = s.assignedPraksisPlace;
        if (a?.placeId !== tree.praksisPlaceId) return false;
        const unit = tree.units.find((u) => u.id === (a.entityId ?? a.departmentId));
        return !!unit && unit.limitPath.includes(limitEntityId);
      }).length;
      return n > 0 ? [{ title: p.title || `${p.semester} ${p.year}`, n }] : [];
    });
  };

  const violationsByPlace = useMemo(() => {
    const m = new Map<string, string[]>();
    praksisPlaces.forEach((place) => {
      if (!place.organizationStructure) return;
      limitViolations(
        allLimits.filter((l) => l.praksisPlaceId === place.id),
        place.organizationStructure,
      ).forEach((v, k) => m.set(k, v));
    });
    return m;
  }, [allLimits, praksisPlaces]);

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">Capacity planning report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Praksis place capacity per study, program and emne, and how many places placements use
          </p>
        </div>
        {/* Semester the usage is counted for */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[100px] bg-gray-100 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-md border border-gray-200 p-0.5 bg-gray-50">
            {(["Spring", "Autumn"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSemester(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  semester === s ? "bg-white text-purple-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split layout, as on the Praksis places page */}
      <div className="flex gap-6 items-start">
        {/* Left: Study → Program → Emne tree */}
        <div className="w-80 flex-shrink-0 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden sticky top-0 max-h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search studies, programs, emner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white border-gray-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {studies.filter(studyVisible).map((study) => (
                <div key={study.id}>
                  {renderTreeRow(
                    `s:${study.id}`,
                    0,
                    study.name,
                    (sel) => <GraduationCap className={`h-4 w-4 flex-shrink-0 ${sel ? "text-white" : "text-purple-600"}`} />,
                    () => setSelection({ kind: "study", studyId: study.id }),
                    study.programs.length > 0,
                  )}
                  {isOpen(`s:${study.id}`) &&
                    study.programs
                      .filter((p) => programVisible(study, p))
                      .map((program) => (
                        <div key={program.id}>
                          {renderTreeRow(
                            `p:${program.id}`,
                            1,
                            program.name,
                            (sel) => <BookOpen className={`h-4 w-4 flex-shrink-0 ${sel ? "text-white" : "text-blue-600"}`} />,
                            () => setSelection({ kind: "program", studyId: study.id, programId: program.id }),
                            (program.emner ?? []).length > 0,
                            limitCount(program.id),
                          )}
                          {isOpen(`p:${program.id}`) &&
                            (program.emner ?? [])
                              .filter((e) => matches(e.name) || matches(program.name) || matches(study.name))
                              .map((emne) => (
                                <div key={emne.id}>
                                  {renderTreeRow(
                                    `e:${program.id}:${emne.id}`,
                                    2,
                                    emne.name,
                                    (sel) => <Layers className={`h-4 w-4 flex-shrink-0 ${sel ? "text-white" : "text-green-600"}`} />,
                                    () =>
                                      setSelection({ kind: "emne", studyId: study.id, programId: program.id, emneId: emne.id }),
                                    false,
                                    limitCount(program.id, emne.name),
                                  )}
                                </div>
                              ))}
                        </div>
                      ))}
                </div>
              ))}
              {studies.filter(studyVisible).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">
                  {studies.length === 0 ? "No studies yet. Add them in Settings → Studies & Programs." : "No matches"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: limits of the selected emner */}
        <div className="flex-1 min-w-0 space-y-6 mb-[50px]">
          {!selection || !selectedStudy ? (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 min-h-[400px]">
              <div className="text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium">Select a study, program or emne</p>
                <p className="text-sm text-gray-400 mt-1">Its praksis place capacity and its usage are shown here</p>
              </div>
            </div>
          ) : selectedEmner.length === 0 ? (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 min-h-[200px]">
              <p className="text-sm text-gray-500">No emner defined here. Add them in Settings → Studies &amp; Programs.</p>
            </div>
          ) : (
            selectedEmner.map(({ program, emne }) => {
              const { trees, emnePlacements } = emneReport(program, emne);
              const tops = trees.flatMap((t) => t.nodes.filter((n) => n.depth === 0));
              const total = tops.reduce((s, n) => s + n.share, 0);
              const used = tops.reduce((s, n) => s + n.usedElsewhere, 0);
              return (
                <div key={`${program.id}-${emne.id}`} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        <span className="text-gray-500 font-normal">{program.name} ·</span> {emne.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {semester} {year} · {emnePlacements.length} placement{emnePlacements.length === 1 ? "" : "s"} for this emne
                      </p>
                    </div>
                    {trees.length > 0 && (
                      <div className="flex items-center gap-4 text-sm flex-shrink-0">
                        <span className="text-gray-600">
                          Places <span className="font-semibold text-gray-900">{total}</span>
                        </span>
                        <span className="text-gray-600">
                          Used <span className="font-semibold text-orange-600">{used}</span>
                        </span>
                        <span className="text-gray-600">
                          Left <span className="font-semibold text-green-600">{Math.max(0, total - used)}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {trees.length === 0 ? (
                    <p className="text-sm text-gray-500 px-4 py-6">
                      No capacity includes {emne.name} for {semester} {year}. Add it under Praksis places → Capacity.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50/50 text-left">
                            {["Praksis place / Entity", "Type / Period", "Capacity", "Used", "Left", "Used by placements"].map((h) => (
                              <th key={h} className="px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {trees.map((tree) => (
                            <Fragment key={tree.praksisPlaceId}>
                              <tr className="bg-gray-50">
                                <td colSpan={6} className="px-4 py-2 font-semibold text-gray-900">
                                  {tree.praksisPlaceName}
                                </td>
                              </tr>
                              {tree.nodes.map((node) => {
                                const reasons = violationsByPlace.get(node.limit.id) ?? [];
                                const users = placementsUsing(tree, node.limit.entityId, node.limit, emnePlacements);
                                const capped = node.effectiveRemaining < node.remaining;
                                return (
                                  <tr key={node.limit.id} className={reasons.length ? "bg-red-50/40" : "hover:bg-gray-50"}>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1.5" style={{ paddingLeft: `${16 + node.depth * 24}px` }}>
                                        <span className="font-medium text-gray-800">{node.limit.entityName}</span>
                                        {reasons.length > 0 && (
                                          <span title={reasons.join("\n")} className="flex-shrink-0">
                                            <AlertOctagon className="h-4 w-4 text-red-600" />
                                          </span>
                                        )}
                                      </div>
                                      {reasons.map((r) => (
                                        <p key={r} className="text-xs text-red-600" style={{ paddingLeft: `${16 + node.depth * 24}px` }}>
                                          {r}
                                        </p>
                                      ))}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{node.periodLabel}</td>
                                    <td className="px-4 py-3 font-semibold text-purple-600">{node.share}</td>
                                    <td className="px-4 py-3 text-gray-700">{node.usedElsewhere}</td>
                                    <td className="px-4 py-3">
                                      <span className={`font-medium ${node.remaining > 0 ? "text-green-600" : "text-gray-400"}`}>
                                        {node.remaining}
                                      </span>
                                      {capped && (
                                        <span className="block text-[11px] text-amber-700">
                                          capped by {node.limitingName}: {node.effectiveRemaining}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                      {users.length === 0 ? (
                                        <span className="text-gray-300">—</span>
                                      ) : (
                                        users.map((u) => (
                                          <div key={u.title} className="text-sm">
                                            {u.title} <span className="text-gray-500">({u.n})</span>
                                          </div>
                                        ))
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

