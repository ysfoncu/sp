import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronDown, CalendarRange, Check, AlertCircle } from "lucide-react";
import { PeriodOption, SemesterRanges, fmtDate, togglePeriod } from "./periodFilter";

interface PeriodFilterButtonProps {
  selectedPeriods: Set<PeriodOption>;
  setSelectedPeriods: (next: Set<PeriodOption>) => void;
  customStartDate: string;
  setCustomStartDate: (v: string) => void;
  customEndDate: string;
  setCustomEndDate: (v: string) => void;
  semesterRanges: SemesterRanges;
  /** Periods applied when "Reset" is clicked (default: current + next). */
  resetPeriods?: PeriodOption[];
}

export function PeriodFilterButton({
  selectedPeriods,
  setSelectedPeriods,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  semesterRanges,
  resetPeriods = ["current", "next"],
}: PeriodFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  const toggle = (period: PeriodOption) =>
    setSelectedPeriods(togglePeriod(selectedPeriods, period));

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen((v) => !v)}
        className="gap-2 justify-between text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100"
      >
        <CalendarRange className="h-4 w-4 flex-shrink-0" />
        <span>Period</span>
        {selectedPeriods.size > 0 && (
          <span className="ml-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-semibold leading-none">
            {selectedPeriods.size}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 opacity-50 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 w-[300px] bg-white rounded-xl shadow-xl border border-gray-200 p-1 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Show items for
            </p>
          </div>
          <div className="p-2 space-y-0.5">
            {(
              [
                {
                  key: "previous" as PeriodOption,
                  label: "Previous Semester",
                  range: `${fmtDate(semesterRanges.previous.start)} – ${fmtDate(
                    semesterRanges.previous.end
                  )}`,
                },
                {
                  key: "current" as PeriodOption,
                  label: "This Semester",
                  range: `${fmtDate(semesterRanges.current.start)} – ${fmtDate(
                    semesterRanges.current.end
                  )}`,
                },
                {
                  key: "next" as PeriodOption,
                  label: "Next Semester",
                  range: `${fmtDate(semesterRanges.next.start)} – ${fmtDate(
                    semesterRanges.next.end
                  )}`,
                },
                {
                  key: "expired" as PeriodOption,
                  label: "Expired",
                  range: "End date in the past",
                },
              ] as const
            ).map(({ key, label, range }) => {
              const isCustomMode = selectedPeriods.has("custom");
              const checked = selectedPeriods.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !isCustomMode && toggle(key)}
                  disabled={isCustomMode}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isCustomMode
                      ? "opacity-40 cursor-not-allowed"
                      : checked
                      ? "bg-blue-50 hover:bg-blue-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium ${
                        checked ? "text-blue-700" : "text-gray-800"
                      }`}
                    >
                      {label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{range}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-2 pb-2">
            <div className="border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => toggle("custom")}
                className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedPeriods.has("custom") ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedPeriods.has("custom")
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPeriods.has("custom") && (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      selectedPeriods.has("custom") ? "text-blue-700" : "text-gray-800"
                    }`}
                  >
                    Custom Date Range
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Pick a specific start and end date
                  </div>
                </div>
              </button>

              {selectedPeriods.has("custom") && (
                <div className="mt-2 mx-3 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={customEndDate}
                      min={customStartDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {(!customStartDate || !customEndDate) && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Select both dates to apply filter
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedPeriods(new Set<PeriodOption>(resetPeriods))}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
