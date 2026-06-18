import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";
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
import { Search, X, CalendarRange, Grid3X3, List } from "lucide-react";
import {
  PeriodOption,
  SemesterRanges,
  getPeriodChips,
  togglePeriod,
} from "./periodFilter";
import { PeriodFilterButton } from "./PeriodFilterButton";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "upload", label: "Upload students" },
  { value: "select", label: "Select praksis places" },
  { value: "publish", label: "First publish" },
  { value: "completed", label: "Completed" },
];

interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string }[];
}

interface PlacementFilterBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  studies: Study[];
  selectedStudy: string;
  onStudyChange: (v: string) => void;
  selectedProgram: string;
  onProgramChange: (v: string) => void;
  selectedSubject: string;
  onSubjectChange: (v: string) => void;
  subjects: string[];
  selectedStatus: string;
  onStatusChange: (v: string) => void;
  // Period filter (always applied)
  selectedPeriods: Set<PeriodOption>;
  setSelectedPeriods: (next: Set<PeriodOption>) => void;
  customStartDate: string;
  setCustomStartDate: (v: string) => void;
  customEndDate: string;
  setCustomEndDate: (v: string) => void;
  semesterRanges: SemesterRanges;
  // View toggle
  viewMode: "list" | "gantt";
  onViewModeChange: (v: "list" | "gantt") => void;
  // Right-side page actions (Create / Help)
  actions?: ReactNode;
}

export function PlacementFilterBar({
  searchTerm,
  onSearchChange,
  studies,
  selectedStudy,
  onStudyChange,
  selectedProgram,
  onProgramChange,
  selectedSubject,
  onSubjectChange,
  subjects,
  selectedStatus,
  onStatusChange,
  selectedPeriods,
  setSelectedPeriods,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  semesterRanges,
  viewMode,
  onViewModeChange,
  actions,
}: PlacementFilterBarProps) {
  const [isSearchMode, setIsSearchMode] = useState(false);

  const periodChips = getPeriodChips(
    selectedPeriods,
    customStartDate,
    customEndDate,
    semesterRanges
  );

  const activeFilterCount =
    (selectedStudy !== "all" ? 1 : 0) +
    (selectedSubject !== "all" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0);

  function clearFilters() {
    onStudyChange("all");
    onProgramChange("all");
    onSubjectChange("all");
    onStatusChange("all");
  }

  const study = studies.find((s) => s.id === selectedStudy);
  const studyProgramLabel =
    selectedStudy === "all" || !study
      ? "Study / Program"
      : selectedProgram === "all"
      ? study.name
      : study.programs.find((p) => p.id === selectedProgram)
      ? `${study.name} / ${study.programs.find((p) => p.id === selectedProgram)!.name}`
      : study.name;

  return (
    <div className="flex flex-col gap-3 w-full">
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

            {/* Study / Program (cascading) */}
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
              <DropdownMenuContent align="start" className="w-[220px]">
                <DropdownMenuItem
                  onSelect={() => {
                    onStudyChange("all");
                    onProgramChange("all");
                  }}
                  className={selectedStudy === "all" ? "font-medium text-blue-600" : ""}
                >
                  All Studies
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {studies.map((s) => (
                  <DropdownMenuSub key={s.id}>
                    <DropdownMenuSubTrigger
                      className={
                        selectedStudy === s.id && selectedProgram === "all"
                          ? "font-medium text-blue-600"
                          : ""
                      }
                    >
                      {s.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[180px]">
                      <DropdownMenuItem
                        onSelect={() => {
                          onStudyChange(s.id);
                          onProgramChange("all");
                        }}
                        className={
                          selectedStudy === s.id && selectedProgram === "all"
                            ? "font-medium text-blue-600"
                            : ""
                        }
                      >
                        All programs
                      </DropdownMenuItem>
                      {s.programs.length > 0 && <DropdownMenuSeparator />}
                      {s.programs.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onSelect={() => {
                            onStudyChange(s.id);
                            onProgramChange(p.id);
                          }}
                          className={
                            selectedStudy === s.id && selectedProgram === p.id
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

            <Select value={selectedSubject} onValueChange={onSubjectChange}>
              <SelectTrigger className="w-[130px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="Emne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All emne</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={onStatusChange}>
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

            {/* Right cluster: view toggle + page actions */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-600 text-xs mr-1">View by</span>
              <Button
                variant={viewMode === "gantt" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("gantt")}
                className="p-2 h-8 w-8"
                title="Calendar view"
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="p-2 h-8 w-8"
                title="Table view"
              >
                <List className="h-5 w-5" />
              </Button>
              {actions}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search placements by title..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsSearchMode(false);
                onSearchChange("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </>
        )}
      </div>

      {/* Period chips */}
      {periodChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Showing:</span>
          {periodChips.map((chip) => (
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
    </div>
  );
}
