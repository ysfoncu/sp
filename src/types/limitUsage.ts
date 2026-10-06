// How placement tasks use Praksis place limits.
//
// Limits are set on the lowest units only (units with nothing under them) — that is where students
// are placed. A limit is a number per emne; every unit stands alone, and the totals above the
// lowest units are plain sums (see `limitsUnder`). There is nothing to keep consistent between levels.
// Nothing is booked against a limit — a placed student only records the unit they go to
// (`assignedPraksisPlace.placeId` + `entityId`/`departmentId`), and usage is worked out from that.
// - Where an emne may place: lowest units whose limit has a number above 0 for the emne
// - Places left at a unit: its number for the emne − students placed there in the same period
// - Periods: one per praksis place. Yearly limits count placements whose start date falls in the
//   same MM/DD–MM/DD window, semester limits count placements in the same year and semester
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

// The period of `limit` that a placement falls in. A yearly limit resets every year on its reset
// day (`periodStart`, MM/DD): a period runs from that day up to (not including) the same day the
// next year, so every date belongs to exactly one period. Null when the reset day is missing.
export const periodKeyFor = (limit: PraksisPlaceLimit, ctx: LimitPlacementContext): string | null => {
  if (limit.limitType === "semester") return `S:${Number(ctx.year)}-${normalizeSemester(ctx.semester)}`;

  const reset = parseMonthDay(limit.periodStart);
  if (!reset) return null;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(ctx.startDate ?? "");
  const [y, m, d] = dateMatch ? [Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3])] : [Number(ctx.year), 1, 1];
  const date = dayNumber(y, m, d);

  // Before this year's reset day the placement still belongs to last year's period
  const periodYear = date >= dayNumber(y, reset[0], reset[1]) ? y : y - 1;
  return `Y:${periodYear}-${pad(reset[0])}-${pad(reset[1])}`;
};

export const limitPeriodLabel = (limit: Pick<PraksisPlaceLimit, "limitType" | "periodStart">) =>
  limit.limitType === "yearly" ? `Yearly · resets ${limit.periodStart}` : "Semester";

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

// A unit with nothing under it: where students are placed and limits are set
export const isLowestUnit = (node: OrganizationNode) => node.children.length === 0;

// The limits on the lowest units under (and including) a node, for totals
export const limitsUnder = (node: OrganizationNode, placeLimits: PraksisPlaceLimit[]): PraksisPlaceLimit[] => {
  if (isLowestUnit(node)) return placeLimits.filter((l) => l.entityId === node.id);
  return node.children.flatMap((c) => limitsUnder(c, placeLimits));
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

    const nodes: LimitNodeInfo[] = [];
    const units: LimitUnitInfo[] = [];
    const walk = (node: OrganizationNode) => {
      if (!isLowestUnit(node)) {
        node.children.forEach(walk);
        return;
      }
      const limit = placeLimits.find((l) => l.entityId === node.id);
      const share = limit && emneShareFor(limit, ctx);
      const periodKey = limit && periodKeyFor(limit, ctx);
      if (!limit || !share || share.limit <= 0 || !periodKey) return;

      const atUnit = (s: LimitStudent) => s.assignedPraksisPlace?.placeId === place.id && studentUnit(s) === node.id;
      const used = students.filter(atUnit).length;
      const usedElsewhere = sameEmne
        .filter(
          (p) =>
            periodKeyFor(limit, { year: p.year ?? ctx.year, semester: p.semester ?? "", startDate: p.startDate }) === periodKey,
        )
        .reduce((sum, p) => sum + p.students.filter(atUnit).length, 0);
      const remaining = Math.max(0, share.limit - used - usedElsewhere);

      nodes.push({
        limit,
        depth: 0,
        share: share.limit,
        used,
        usedElsewhere,
        remaining,
        effectiveRemaining: remaining,
        limitingName: limit.entityName,
        periodLabel: limitPeriodLabel(limit),
      });
      units.push({
        id: node.id,
        name: node.name,
        depth: 0,
        effectiveRemaining: remaining,
        limitingName: limit.entityName,
        governingNodeId: node.id,
        governingName: node.name,
        governingLimitId: limit.id,
        limitPath: [node.id],
      });
    };
    walk(root);

    return units.length > 0 ? [{ praksisPlaceId: place.id, praksisPlaceName: place.name, nodes, units }] : [];
  });
};

// Places the placement can use: every unit's number for the emne minus what other placements used
export const totalPlacesForPlacement = (trees: PlaceLimitTree[]) =>
  trees.reduce((sum, t) => sum + t.nodes.reduce((s, n) => s + Math.max(0, n.share - n.usedElsewhere), 0), 0);

// Saved limits that break the one rule left: limits belong on the lowest units. Older limits on a
// unit that has units under it are listed with the reason, to be deleted and set on the units below.
export const limitViolations = (placeLimits: PraksisPlaceLimit[], root: OrganizationNode) => {
  const out = new Map<string, string[]>();
  placeLimits.forEach((l) => {
    const node = findNode(root, l.entityId);
    if (node && !isLowestUnit(node)) {
      out.set(l.id, ["Capacity is set on the lowest units. Delete this one and set capacity on the units below."]);
    }
  });
  return out;
};
