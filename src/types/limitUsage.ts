// How placement tasks use Praksis place limits.
//
// Limits nest: a limit caps its entity and everything under it, per emne, in its own period.
// Nothing is booked against a limit — a placed student only records the unit they go to
// (`assignedPraksisPlace.placeId` + `entityId`/`departmentId`), and usage is worked out from that:
// a student counts toward every limit on the path from the praksis place down to their unit.
// - Where an emne may place: units with at least one limit on their path, where every limit on
//   the path has a share for the emne (a limit's emne split is also who may use it)
// - Places left at a unit: the smallest remainder over the limits on its path
// - Periods: yearly limits count placements whose start date falls in the same MM/DD–MM/DD
//   window, semester limits count placements in the same year and semester
import { PraksisPlaceLimit } from "./praksisLimit";
import { PraksisPlace } from "./praksisPlace";
import { OrganizationNode } from "./organizationStructure";

// What a placement needs to be matched against limits
export interface LimitPlacementContext {
  programId?: string;
  emne?: string;
  year: number | string;
  semester: string;
  startDate?: string; // yyyy-MM-dd
}

export interface LimitStudent {
  assignedPraksisPlace?: { placeId: string; entityId?: string; departmentId: string };
}

// Another placement's students, with enough placement info to know its emne and period
export interface LimitOtherPlacement {
  placementId: string;
  year?: number | string;
  semester?: string;
  startDate?: string;
  programId?: string;
  emne?: string;
  students: LimitStudent[];
}

// A limit that applies to the placement's emne, with its usage
export interface LimitNodeInfo {
  limit: PraksisPlaceLimit;
  depth: number; // number of limits above it
  share: number; // the emne's share
  used: number; // by this placement
  usedElsewhere: number; // by other placements in the same period
  remaining: number; // share − used − usedElsewhere
  // Smallest remainder over this limit and the limits above it, and whose it is
  effectiveRemaining: number;
  limitingName: string;
  periodLabel: string;
}

// A unit the placement's emne may place students in
export interface LimitUnitInfo {
  id: string;
  name: string;
  depth: number; // below the topmost limit on its path
  effectiveRemaining: number;
  limitingName: string;
  governingNodeId: string; // nearest limit on its path (the unit itself when it has one)
  governingName: string;
  governingLimitId: string;
  limitPath: string[]; // entity ids of every limit on its path, top first
}

export interface PlaceLimitTree {
  praksisPlaceId: string;
  praksisPlaceName: string;
  nodes: LimitNodeInfo[];
  units: LimitUnitInfo[];
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

// The period of `limit` that a placement falls in, or null when the placement is outside every
// window of the limit (e.g. a 01/01–06/30 yearly limit and a placement starting in September).
export const periodKeyFor = (limit: PraksisPlaceLimit, ctx: LimitPlacementContext): string | null => {
  if (limit.limitType === "semester") return `S:${Number(ctx.year)}-${normalizeSemester(ctx.semester)}`;

  const start = parseMonthDay(limit.periodStart);
  const end = parseMonthDay(limit.periodEnd);
  if (!start || !end) return null;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(ctx.startDate ?? "");
  const [y, m, d] = dateMatch ? [Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3])] : [Number(ctx.year), 1, 1];
  const date = dayNumber(y, m, d);

  // A window runs from start in year Y to end in Y (or Y+1 when it wraps past New Year)
  const wraps = end[0] < start[0] || (end[0] === start[0] && end[1] < start[1]);
  for (const windowYear of [y - 1, y]) {
    const from = dayNumber(windowYear, start[0], start[1]);
    const to = dayNumber(wraps ? windowYear + 1 : windowYear, end[0], end[1]);
    if (date >= from && date <= to) return `Y:${windowYear}-${pad(start[0])}-${pad(start[1])}`;
  }
  return null;
};

export const limitPeriodLabel = (limit: PraksisPlaceLimit) =>
  limit.limitType === "yearly" ? `Yearly ${limit.periodStart} – ${limit.periodEnd}` : "Semester";

export const findNode = (node: OrganizationNode, id: string): OrganizationNode | null => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
};

// Ids from the root down to the node (inclusive), or [] when it isn't in the tree
export const pathToNode = (root: OrganizationNode, id: string): string[] => {
  if (root.id === id) return [root.id];
  for (const child of root.children) {
    const path = pathToNode(child, id);
    if (path.length) return [root.id, ...path];
  }
  return [];
};

const subtreeIds = (node: OrganizationNode): Set<string> => {
  const ids = new Set<string>();
  const walk = (n: OrganizationNode) => {
    ids.add(n.id);
    n.children.forEach(walk);
  };
  walk(node);
  return ids;
};

export const emneShareFor = (limit: PraksisPlaceLimit, ctx: { programId?: string; emne?: string }) =>
  limit.emneShares.find((s) => s.programId === ctx.programId && s.emneName === ctx.emne);

const studentUnit = (s: LimitStudent) => s.assignedPraksisPlace?.entityId ?? s.assignedPraksisPlace?.departmentId;

// The limits on the placement's emne and the units it may use, per praksis place
export const limitTreeForPlacement = (
  limits: PraksisPlaceLimit[],
  places: PraksisPlace[],
  ctx: LimitPlacementContext,
  students: LimitStudent[],
  otherPlacements: LimitOtherPlacement[],
): PlaceLimitTree[] => {
  if (!ctx.programId || !ctx.emne) return [];
  const sameEmne = otherPlacements.filter((p) => p.programId === ctx.programId && p.emne === ctx.emne);

  return places.flatMap((place) => {
    const root = place.organizationStructure;
    const placeLimits = limits.filter((l) => l.praksisPlaceId === place.id);
    if (!root || placeLimits.length === 0) return [];
    const limitAt = new Map(placeLimits.map((l) => [l.entityId, l]));

    // Usage per limit, only for limits this emne can use in this period
    const usage = new Map<string, { share: number; used: number; usedElsewhere: number; remaining: number }>();
    placeLimits.forEach((limit) => {
      const share = emneShareFor(limit, ctx);
      const periodKey = periodKeyFor(limit, ctx);
      const node = findNode(root, limit.entityId);
      if (!share || !periodKey || !node) return;
      const inside = subtreeIds(node);
      const counts = (s: LimitStudent) => s.assignedPraksisPlace?.placeId === place.id && inside.has(studentUnit(s) ?? "");
      const used = students.filter(counts).length;
      const usedElsewhere = sameEmne
        .filter(
          (p) =>
            periodKeyFor(limit, { year: p.year ?? ctx.year, semester: p.semester ?? "", startDate: p.startDate }) === periodKey,
        )
        .reduce((sum, p) => sum + p.students.filter(counts).length, 0);
      usage.set(limit.id, { share: share.limit, used, usedElsewhere, remaining: Math.max(0, share.limit - used - usedElsewhere) });
    });

    const nodes: LimitNodeInfo[] = [];
    const units: LimitUnitInfo[] = [];
    // `path` = the limits on the way down to (not including) `node`
    const walk = (node: OrganizationNode, path: PraksisPlaceLimit[], topDepth: number | null, depth: number) => {
      const own = limitAt.get(node.id);
      const onPath = own ? [...path, own] : path;
      // A limit on the path that isn't for this emne (or period) closes everything below it
      if (onPath.some((l) => !usage.has(l.id))) return;
      const top = onPath.length > 0 ? (topDepth ?? depth) : null;
      if (onPath.length > 0) {
        let limiting = onPath[0];
        onPath.forEach((l) => {
          if (usage.get(l.id)!.remaining < usage.get(limiting.id)!.remaining) limiting = l;
        });
        const effectiveRemaining = usage.get(limiting.id)!.remaining;
        const governing = onPath[onPath.length - 1];
        units.push({
          id: node.id,
          name: node.name,
          depth: depth - (top ?? depth),
          effectiveRemaining,
          limitingName: limiting.entityName,
          governingNodeId: governing.entityId,
          governingName: governing.entityName,
          governingLimitId: governing.id,
          limitPath: onPath.map((l) => l.entityId),
        });
        if (own) {
          nodes.push({
            limit: own,
            depth: path.length,
            ...usage.get(own.id)!,
            effectiveRemaining,
            limitingName: limiting.entityName,
            periodLabel: limitPeriodLabel(own),
          });
        }
      }
      node.children.forEach((c) => walk(c, onPath, top, depth + 1));
    };
    walk(root, [], null, 0);

    return units.length > 0 ? [{ praksisPlaceId: place.id, praksisPlaceName: place.name, nodes, units }] : [];
  });
};

// Places the placement can use: every topmost limit's share minus what other placements used
export const totalPlacesForPlacement = (trees: PlaceLimitTree[]) =>
  trees.reduce(
    (sum, t) => sum + t.nodes.filter((n) => n.depth === 0).reduce((s, n) => s + Math.max(0, n.share - n.usedElsewhere), 0),
    0,
  );

// The nearest limit above an entity at the same praksis place, if any
export const parentLimitOf = (
  entityId: string,
  placeLimits: PraksisPlaceLimit[],
  root: OrganizationNode,
): PraksisPlaceLimit | undefined => {
  const ancestors = pathToNode(root, entityId).slice(0, -1).reverse();
  for (const id of ancestors) {
    const limit = placeLimits.find((l) => l.entityId === id);
    if (limit) return limit;
  }
  return undefined;
};

// ── Nesting rules ─────────────────────────────────────────────────────────────
// For every limit N: N's total and each emne share must be at least the sum over the limits
// directly under it (C(N): the nearest limits below, not the ones nested inside those), and a
// limit has the same type and period as the nearest limit above it (P(N)). "A limit can't exceed
// its parent" follows from the parent's rule — a limit must fit in the room its siblings leave.

type ShareRef = { programId: string; emneId: string };
const shareKey = (s: ShareRef) => `${s.programId}|${s.emneId}`;
const shareOf = (limit: PraksisPlaceLimit, key: string) =>
  limit.emneShares.find((s) => shareKey(s) === key)?.limit ?? 0;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// The nearest limits below an entity (whether or not the entity has a limit itself)
export const childLimitsOf = (
  entityId: string,
  placeLimits: PraksisPlaceLimit[],
  root: OrganizationNode,
): PraksisPlaceLimit[] => {
  const limited = new Set(placeLimits.map((l) => l.entityId));
  return placeLimits.filter((l) => {
    if (l.entityId === entityId) return false;
    const path = pathToNode(root, l.entityId);
    const at = path.indexOf(entityId);
    return at >= 0 && path.slice(at + 1, -1).every((id) => !limited.has(id));
  });
};

// Every limit anywhere below an entity
export const limitsBelow = (
  entityId: string,
  placeLimits: PraksisPlaceLimit[],
  root: OrganizationNode,
): PraksisPlaceLimit[] =>
  placeLimits.filter((l) => l.entityId !== entityId && pathToNode(root, l.entityId).includes(entityId));

export const samePeriod = (
  a: Pick<PraksisPlaceLimit, "limitType" | "periodStart" | "periodEnd">,
  b: Pick<PraksisPlaceLimit, "limitType" | "periodStart" | "periodEnd">,
) => a.limitType === b.limitType && (a.limitType === "semester" || (a.periodStart === b.periodStart && a.periodEnd === b.periodEnd));

export interface EmneBounds {
  key: string;
  emneName: string;
  min: number; // sum of this emne over the limits directly below
  max?: number; // room left for this emne in the parent limit
  missingInParent: boolean;
}

export interface LimitBounds {
  parent?: PraksisPlaceLimit;
  children: PraksisPlaceLimit[];
  siblingsTotal: number; // what the parent's other direct limits already use
  minTotal: number;
  maxTotal?: number;
  perEmne: EmneBounds[];
}

// The allowed range for a (possibly unsaved) limit, worked out as if it were saved
export const limitBounds = (
  draft: PraksisPlaceLimit,
  placeLimits: PraksisPlaceLimit[],
  root: OrganizationNode,
): LimitBounds => {
  const all = [...placeLimits.filter((l) => l.id !== draft.id && l.entityId !== draft.entityId), draft];
  const parent = parentLimitOf(draft.entityId, all, root);
  const children = childLimitsOf(draft.entityId, all, root);
  const siblings = parent ? childLimitsOf(parent.entityId, all, root).filter((l) => l.id !== draft.id) : [];

  const names = new Map<string, string>();
  [draft, ...children].forEach((l) => l.emneShares.forEach((s) => names.set(shareKey(s), s.emneName)));
  const perEmne = [...names.entries()].map(([key, emneName]) => ({
    key,
    emneName,
    min: sum(children.map((c) => shareOf(c, key))),
    max: parent ? shareOf(parent, key) - sum(siblings.map((l) => shareOf(l, key))) : undefined,
    missingInParent: !!parent && !parent.emneShares.some((s) => shareKey(s) === key),
  }));

  const siblingsTotal = sum(siblings.map((l) => l.limit));
  return {
    parent,
    children,
    siblingsTotal,
    minTotal: sum(children.map((c) => c.limit)),
    maxTotal: parent ? parent.limit - siblingsTotal : undefined,
    perEmne,
  };
};

// Why a (possibly unsaved) limit breaks the nesting rules; empty when it's fine
export const validateLimit = (
  draft: PraksisPlaceLimit,
  placeLimits: PraksisPlaceLimit[],
  root: OrganizationNode,
): string[] => {
  const b = limitBounds(draft, placeLimits, root);
  const reasons: string[] = [];
  const parentName = b.parent?.entityName;

  if (draft.limit < b.minTotal) {
    reasons.push(`Limit must be at least ${b.minTotal}: units under it have ${b.minTotal}`);
  }
  if (b.maxTotal !== undefined && draft.limit > b.maxTotal) {
    reasons.push(
      `Limit can be at most ${Math.max(0, b.maxTotal)}: room left in ${parentName}` +
        (b.siblingsTotal > 0 ? ` (${b.parent!.limit} − ${b.siblingsTotal} on other units)` : ""),
    );
  }
  b.perEmne.forEach((e) => {
    const share = shareOf(draft, e.key);
    const has = draft.emneShares.some((s) => shareKey(s) === e.key);
    if (has && share > 0 && e.missingInParent) {
      reasons.push(`${e.emneName} isn't in ${parentName}'s limit`);
    } else if (e.max !== undefined && share > e.max) {
      reasons.push(`${e.emneName} can be at most ${Math.max(0, e.max)}: room left in ${parentName}`);
    }
    if (share < e.min) {
      reasons.push(
        has
          ? `${e.emneName} must be at least ${e.min}: units under it have ${e.min}`
          : `${e.emneName} ${e.min} is set on units under it but missing here`,
      );
    }
  });
  if (b.parent && !samePeriod(draft, b.parent)) {
    reasons.push(`Type/period must match ${parentName} (${limitPeriodLabel(b.parent)})`);
  }
  return reasons;
};

// Saved limits that break the rules (e.g. saved before the rules existed), with the reasons
export const limitViolations = (placeLimits: PraksisPlaceLimit[], root: OrganizationNode) => {
  const out = new Map<string, string[]>();
  placeLimits.forEach((l) => {
    const reasons = validateLimit(l, placeLimits, root);
    if (reasons.length) out.set(l.id, reasons);
  });
  return out;
};
