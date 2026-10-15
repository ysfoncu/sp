// How placements use entities (placement profiles).
//
// An entity belongs to a praksis place and accepts one or more programs (each with its emner). For each
// program it offers a number of places per period; students of another program never use them. Nothing is booked against an entity — a placed student only records the
// entity they go to (`assignedPraksisPlace.placeId` + `profileId`), and usage is worked out from that:
//   - Where a placement may place: the place's active entities for the placement's program and emne
//   - Places left on an entity: its places for the placement's program − students of that program placed on it
//     in the same period, from this placement and from other placements of the same program whose emne the
//     entity also covers
//   - Period: one per praksis place (placePeriod.ts)
//   - With the placement's slots (placementSlots.ts) only the chosen entities are offered, `places` is the
//     slots chosen for this placement and other placements' students are not subtracted again: they were
//     counted when the slots were set
import { PraksisPlace } from "./praksisPlace";
import { PeriodContext, periodKeyFor, periodLabel, placePeriodOf } from "./placePeriod";
import type { EntitySlot } from "./placementSlots";
import { PlacementProfile, isPlaceable, placementEmneId, placesFor, profileMatches, resolveAssignmentProfile } from "./placementProfile";

// What a placement needs to be matched against profiles
export interface ProfilePlacementContext extends PeriodContext {
  programId?: string;
  emne?: string; // the emne's name, as placements store it
  emneId?: string; // the emne's id, when the placement has one
}

export interface UsageStudent {
  id?: string;
  name?: string;
  assignedPraksisPlace?: {
    startDate?: string;
    endDate?: string;
    placeId: string;
    entityId?: string;
    departmentId: string;
    profileId?: string;
    status?: string;
    mentor?: { personType: string; personId: string; name: string };
  };
}

// Another placement's students, with enough placement info to know its emne and period
export interface OtherPlacementUsage {
  placementId: string;
  title?: string;
  year?: number | string;
  semester?: string;
  startDate?: string;
  programId?: string;
  emne?: string;
  emneId?: string;
  students: UsageStudent[];
}

// A profile that applies to the placement, with its usage
export interface ProfileNodeInfo {
  profile: PlacementProfile;
  unitName: string; // the entity name
  places: number; // the places this placement can use: the entity's places for its program, or the placement's slots
  programPlaces: number; // the places the entity offers to the placement's program
  fromSlots: boolean; // `places` are the placement's slots
  otherPrograms: string[]; // ids of the other programs the entity accepts (for a note; their places are separate)
  used: number; // by this placement
  usedElsewhere: number; // by other placements in the same period
  remaining: number; // places − used (− usedElsewhere without slots), never below 0
  over: number; // students placed beyond the places (0 when within them)
  periodLabel: string;
}

// An entity the placement may place students in (id and profileId are the same)
export interface ProfileUnitInfo {
  id: string;
  name: string;
  remaining: number;
  profileId: string;
  profileName: string;
}

export interface PlaceProfileTree {
  praksisPlaceId: string;
  praksisPlaceName: string;
  nodes: ProfileNodeInfo[];
  units: ProfileUnitInfo[];
}

// A cancelled assignment no longer uses a place
const counts = (s: UsageStudent) => !!s.assignedPraksisPlace && s.assignedPraksisPlace.status !== "cancelled";

// The profiles that fit the placement's program and emne, per praksis place, with usage
export const profileTreeForPlacement = (
  profiles: PlacementProfile[],
  places: PraksisPlace[],
  ctx: ProfilePlacementContext,
  students: UsageStudent[],
  otherPlacements: OtherPlacementUsage[],
  // The entities chosen for the placement and their slots; undefined offers every fitting entity
  entitySlots?: EntitySlot[],
): PlaceProfileTree[] => {
  if (!ctx.programId || !ctx.emne) return [];
  const target = {
    programId: ctx.programId,
    emneId: placementEmneId({ programId: ctx.programId, subject: ctx.emne, emneId: ctx.emneId }),
  };

  return places.flatMap((place) => {
    const period = placePeriodOf(place.id);
    const periodKey = periodKeyFor(period, ctx);
    if (!periodKey) return [];

    const nodes: ProfileNodeInfo[] = [];
    const unitInfos: ProfileUnitInfo[] = [];
    profiles
      .filter((p) => p.praksisPlaceId === place.id && p.status === "active" && profileMatches(p, target) && isPlaceable(p))
      .forEach((profile) => {
        // A student counts on the entity the assignment points at
        const onProfile = (s: UsageStudent, studentTarget: { programId: string; emneId?: string }) => {
          const a = s.assignedPraksisPlace;
          if (!a || !counts(s) || a.placeId !== place.id) return false;
          return (
            resolveAssignmentProfile(profiles, { placeId: place.id, unitId: a.entityId ?? a.departmentId, profileId: a.profileId }, studentTarget)?.id ===
            profile.id
          );
        };
        const used = students.filter((s) => onProfile(s, target)).length;
        // Other placements count when the entity also covers their program and emne, in the same period
        const usedElsewhere = otherPlacements.reduce((sum, o) => {
          // Places are per program: students of another program never use these
          if (!o.programId || o.programId !== ctx.programId) return sum;
          const otherTarget = {
            programId: o.programId,
            emneId: o.emne ? placementEmneId({ programId: o.programId, subject: o.emne, emneId: o.emneId }) : undefined,
          };
          if (periodKeyFor(period, { year: o.year ?? ctx.year, semester: o.semester ?? "", startDate: o.startDate }) !== periodKey)
            return sum;
          return sum + o.students.filter((s) => onProfile(s, otherTarget)).length;
        }, 0);
        const programPlaces = placesFor(profile, ctx.programId!);
        const chosen = entitySlots?.find((s) => s.profileId === profile.id);
        // An entity that is not chosen but has students of this placement stays visible (with no slots)
        if (entitySlots && !chosen && used === 0) return;
        const fromSlots = !!entitySlots;
        const places = fromSlots ? (chosen?.slots ?? 0) : programPlaces;
        const taken = fromSlots ? used : used + usedElsewhere;
        const remaining = Math.max(0, places - taken);
        const over = Math.max(0, taken - places);
        const otherPrograms = profile.programs.filter((e) => e.programId !== ctx.programId).map((e) => e.programId);
        nodes.push({ profile, unitName: profile.name, places, programPlaces, fromSlots, otherPrograms, used, usedElsewhere, remaining, over, periodLabel: periodLabel(period) });
        unitInfos.push({ id: profile.id, name: profile.name, remaining, profileId: profile.id, profileName: profile.name });
      });

    return nodes.length > 0 ? [{ praksisPlaceId: place.id, praksisPlaceName: place.name, nodes, units: unitInfos }] : [];
  });
};

// What an entity can take for this placement: its slots, or its places minus what other placements used
export const nodeCapacity = (n: ProfileNodeInfo) => (n.fromSlots ? n.places : Math.max(0, n.places - n.usedElsewhere));

// Places the placement can use: the slots chosen, or every profile's places minus what other placements used
export const totalPlacesForPlacement = (trees: PlaceProfileTree[]) =>
  trees.reduce((sum, t) => sum + t.nodes.reduce((s, n) => s + nodeCapacity(n), 0), 0);
