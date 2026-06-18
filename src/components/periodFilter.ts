// Shared semester/period filtering helpers — same logic used by the
// Capacity planning (CoordinatorQuotasView) period filter, reused for the
// Student placement page.

export type PeriodOption = "previous" | "current" | "next" | "expired" | "custom";

export interface SemesterRange {
  start: Date;
  end: Date;
}

export interface SemesterRanges {
  previous: SemesterRange;
  current: SemesterRange;
  next: SemesterRange;
}

export function getSemesterRanges(today: Date): SemesterRanges {
  const year = today.getFullYear();
  const aug1 = new Date(year, 7, 1); // Aug 1
  if (today < aug1) {
    return {
      previous: { start: new Date(year - 1, 7, 1), end: new Date(year - 1, 11, 1) },
      current: { start: new Date(year, 0, 1), end: new Date(year, 7, 1) },
      next: { start: new Date(year, 7, 1), end: new Date(year, 11, 1) },
    };
  }
  return {
    previous: { start: new Date(year, 0, 1), end: new Date(year, 7, 1) },
    current: { start: new Date(year, 7, 1), end: new Date(year, 11, 1) },
    next: { start: new Date(year + 1, 0, 1), end: new Date(year + 1, 7, 1) },
  };
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Returns true if a record's [start, end] overlaps the active period filter.
export function matchesPeriod(
  startDateStr: string,
  endDateStr: string,
  selectedPeriods: Set<PeriodOption>,
  customStartDate: string,
  customEndDate: string,
  semesterRanges: SemesterRanges
): boolean {
  if (selectedPeriods.size === 0) return true;
  const rStart = new Date(startDateStr);
  const rEnd = new Date(endDateStr);
  if (selectedPeriods.has("custom")) {
    if (!customStartDate || !customEndDate) return false;
    const cStart = new Date(customStartDate);
    const cEnd = new Date(customEndDate);
    return rStart <= cEnd && rEnd >= cStart;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedPeriods.has("expired") && rEnd < today) return true;
  const ranges: SemesterRange[] = [];
  if (selectedPeriods.has("previous")) ranges.push(semesterRanges.previous);
  if (selectedPeriods.has("current")) ranges.push(semesterRanges.current);
  if (selectedPeriods.has("next")) ranges.push(semesterRanges.next);
  return ranges.some((r) => rStart <= r.end && rEnd >= r.start);
}

// Returns a new Set with the given period toggled. Selecting "custom" is
// exclusive; selecting any other clears "custom".
export function togglePeriod(
  selected: Set<PeriodOption>,
  period: PeriodOption
): Set<PeriodOption> {
  const next = new Set(selected);
  if (period === "custom") {
    if (next.has("custom")) {
      next.delete("custom");
      return next;
    }
    return new Set<PeriodOption>(["custom"]);
  }
  if (next.has("custom")) next.delete("custom");
  if (next.has(period)) next.delete(period);
  else next.add(period);
  return next;
}

export function getPeriodChips(
  selectedPeriods: Set<PeriodOption>,
  customStartDate: string,
  customEndDate: string,
  semesterRanges: SemesterRanges
): Array<{ key: PeriodOption; label: string; range: string }> {
  const chips: Array<{ key: PeriodOption; label: string; range: string }> = [];
  if (selectedPeriods.has("custom")) {
    chips.push({
      key: "custom",
      label: "Custom Range",
      range:
        customStartDate && customEndDate
          ? `${fmtDate(new Date(customStartDate))} – ${fmtDate(new Date(customEndDate))}`
          : "Select dates",
    });
  } else {
    if (selectedPeriods.has("previous"))
      chips.push({
        key: "previous",
        label: "Previous Semester",
        range: `${fmtDate(semesterRanges.previous.start)} – ${fmtDate(semesterRanges.previous.end)}`,
      });
    if (selectedPeriods.has("current"))
      chips.push({
        key: "current",
        label: "This Semester",
        range: `${fmtDate(semesterRanges.current.start)} – ${fmtDate(semesterRanges.current.end)}`,
      });
    if (selectedPeriods.has("next"))
      chips.push({
        key: "next",
        label: "Next Semester",
        range: `${fmtDate(semesterRanges.next.start)} – ${fmtDate(semesterRanges.next.end)}`,
      });
    if (selectedPeriods.has("expired"))
      chips.push({ key: "expired", label: "Expired", range: "End date passed" });
  }
  return chips;
}
