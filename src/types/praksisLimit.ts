import { useSyncExternalStore } from "react";

// A cap on how many students can be sent to a praksis place entity per period.
// Example: Oslo University Hospital / Ortopedisk klinikk, 100, yearly 01/01–12/31
// → at most 100 students every year.

// The part of a limit given to one emne
export interface LimitEmneShare {
  studyId: string;
  programId: string;
  programName: string;
  emneId: string;
  emneName: string;
  limit: number;
}

export interface PraksisPlaceLimit {
  id: string;
  praksisPlaceId: string;
  entityId: string;
  entityName: string;
  limit: number;
  limitType: "yearly" | "semester";
  // Yearly limits: the day ("MM/DD") the limit resets each year — a period runs from this day
  // to the day before it next year. (Older data may still carry a `periodEnd`; it's ignored.)
  periodStart?: string;
  periodEnd?: string;
  // Which emner can use the limit, and how it is split between them (shares add up to `limit`)
  emneShares: LimitEmneShare[];
  createdAt: string;
}

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

// Small store shared by the Praksis places page and placement tasks. Kept outside App state and
// saved to localStorage, so limits survive navigation, reloads and code edits.
const STORAGE_KEY = "praksisPlaceLimits";

// An entity has at most one limit. Limits for the same entity are merged into the oldest one:
// its id, type and period are kept, emne shares are combined (same emne: added up) and the
// total becomes the sum of the shares.
export const mergeDuplicateLimits = (list: PraksisPlaceLimit[]): PraksisPlaceLimit[] => {
  const groups = new Map<string, PraksisPlaceLimit[]>();
  list.forEach((l) => {
    const key = `${l.praksisPlaceId}|${l.entityId}`;
    groups.set(key, [...(groups.get(key) ?? []), l]);
  });
  const merged = new Map<string, PraksisPlaceLimit>(); // kept id → merged limit
  const removed = new Set<string>();
  groups.forEach((group) => {
    if (group.length === 1) return;
    const [keep, ...rest] = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const shares = new Map<string, LimitEmneShare>();
    [keep, ...rest].forEach((l) =>
      l.emneShares.forEach((share) => {
        const key = `${share.programId}|${share.emneId}`;
        const existing = shares.get(key);
        shares.set(key, existing ? { ...existing, limit: existing.limit + share.limit } : { ...share });
      }),
    );
    const emneShares = [...shares.values()];
    merged.set(keep.id, { ...keep, emneShares, limit: emneShares.reduce((sum, s) => sum + s.limit, 0) });
    rest.forEach((l) => removed.add(l.id));
    console.info(
      `[limits] merged ${group.length} limits for ${keep.entityName} into ${keep.id}`,
      group.map((l) => l.id),
    );
  });
  if (merged.size === 0) return list;
  return list.filter((l) => !removed.has(l.id)).map((l) => merged.get(l.id) ?? l);
};

const loadLimits = (): PraksisPlaceLimit[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const cleaned = mergeDuplicateLimits(parsed);
    if (cleaned !== parsed) localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch {
    return [];
  }
};

let limits: PraksisPlaceLimit[] = loadLimits();
const listeners = new Set<() => void>();

const setLimits = (next: PraksisPlaceLimit[]) => {
  limits = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode etc.) — keep the in-memory copy
  }
  listeners.forEach((l) => l());
};

// Adds new limits and replaces existing ones (same id). Never leaves two limits on one entity.
export const savePraksisLimits = (saved: PraksisPlaceLimit[]) => {
  const byId = new Map(saved.map((l) => [l.id, l]));
  const next = [
    ...limits.map((l) => byId.get(l.id) ?? l),
    ...saved.filter((l) => !limits.some((existing) => existing.id === l.id)),
  ];
  setLimits(mergeDuplicateLimits(next));
};
export const addPraksisLimits = (newLimits: PraksisPlaceLimit[]) => savePraksisLimits(newLimits);
export const updatePraksisLimit = (updated: PraksisPlaceLimit) => savePraksisLimits([updated]);
export const praksisLimitExists = (id: string) => limits.some((l) => l.id === id);
export const removePraksisLimit = (id: string) => setLimits(limits.filter((l) => l.id !== id));

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePraksisLimits = (): PraksisPlaceLimit[] =>
  useSyncExternalStore(subscribe, () => limits);
