import { useSyncExternalStore } from "react";

// The period a praksis place's profiles count places in. One per place, so every profile of the place
// counts students the same way and the totals above the lowest units are plain sums.
//   yearly   — resets on a day each year (MM/DD); a period runs from that day to the day before it next year
//   semester — resets every semester

export interface PlacePeriod {
  limitType: "yearly" | "semester";
  periodStart?: string; // yearly: the reset day (MM/DD)
}

export const DEFAULT_PLACE_PERIOD: PlacePeriod = { limitType: "yearly", periodStart: "01/01" };

// "MM/DD" that is a real calendar day (Feb 29 allowed)
export const isValidMonthDay = (value: string): boolean => {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day <= daysInMonth;
};

const STORAGE_KEY = "praksisPlacePeriods";

const load = (): Record<string, PlacePeriod> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

let periods: Record<string, PlacePeriod> = load();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// The place's period: the one chosen for it, else yearly from 01/01
export const placePeriodOf = (placeId: string): PlacePeriod => periods[placeId] ?? DEFAULT_PLACE_PERIOD;

export const usePlacePeriod = (placeId: string | undefined): PlacePeriod => {
  const chosen = useSyncExternalStore(subscribe, () => periods);
  return (placeId && chosen[placeId]) || DEFAULT_PLACE_PERIOD;
};

// A yearly period needs a reset day, otherwise no placement can be counted in it
export const isPeriodComplete = (period: PlacePeriod) =>
  period.limitType === "semester" || isValidMonthDay(period.periodStart ?? "");

export const setPlacePeriod = (placeId: string, period: PlacePeriod) => {
  if (!isPeriodComplete(period)) return; // never save a period that can't count anything
  periods = { ...periods, [placeId]: period };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(periods));
  } catch {
    // Storage unavailable — keep the in-memory copy
  }
  listeners.forEach((l) => l());
};

export const periodLabel = (period: PlacePeriod) =>
  period.limitType === "yearly" ? `Yearly · resets ${period.periodStart ?? "01/01"}` : "Semester";

// ── Which period a placement falls in ─────────────────────────────────────────
export interface PeriodContext {
  year: number | string;
  semester: string;
  startDate?: string; // yyyy-MM-dd
}

export const normalizeSemester = (semester: string): "VT" | "HT" => {
  const s = semester.trim().toLowerCase();
  return s === "autumn" || s === "fall" || s === "ht" || s === "høst" ? "HT" : "VT";
};

const pad = (n: number) => String(n).padStart(2, "0");

// Days since epoch for a calendar date, ignoring time zones
const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / 86400000;

const parseMonthDay = (value?: string): [number, number] | null => {
  const match = /^(\d{2})\/(\d{2})$/.exec(value ?? "");
  return match ? [Number(match[1]), Number(match[2])] : null;
};

// The period of `period` that a placement falls in, as a key: placements with the same key count against
// the same places. A yearly period starts on its reset day and runs up to (not including) the same day the
// next year, so every date belongs to exactly one period. Null when the reset day is missing.
export const periodKeyFor = (period: PlacePeriod, ctx: PeriodContext): string | null => {
  if (period.limitType === "semester") return `S:${Number(ctx.year)}-${normalizeSemester(ctx.semester)}`;

  const reset = parseMonthDay(period.periodStart);
  if (!reset) return null;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(ctx.startDate ?? "");
  const [y, m, d] = dateMatch ? [Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3])] : [Number(ctx.year), 1, 1];
  const date = dayNumber(y, m, d);

  // Before this year's reset day the placement still belongs to last year's period
  const periodYear = date >= dayNumber(y, reset[0], reset[1]) ? y : y - 1;
  return `Y:${periodYear}-${pad(reset[0])}-${pad(reset[1])}`;
};
