// Rules that keep profiles and placements consistent. Pure functions: the screens only show the
// result, so the same rule holds wherever a profile is changed.
import { PlacePeriod, periodKeyFor, placePeriodOf } from "./placePeriod";
import { PlaceContact } from "./placeContact";
import { PlacementProfile, placementEmneId, resolveContacts, resolveAssignmentProfile, validateProfile } from "./placementProfile";
import { OtherPlacementUsage, UsageStudent } from "./profileUsage";


// How many students are placed on a profile: in total, and at most in any one period (the number
// its places are measured against). Cancelled assignments don't count. With `programId` only the students of
// that program count: an entity's places are per program.
export const placedOnProfile = (
  profile: PlacementProfile,
  profiles: PlacementProfile[],
  placements: OtherPlacementUsage[],
  period: PlacePeriod = placePeriodOf(profile.praksisPlaceId),
  programId?: string,
): { total: number; peak: number } => {
  const perPeriod = new Map<string, number>();
  let total = 0;
  placements.forEach((p) => {
    if (!p.programId || (programId && p.programId !== programId)) return;
    const target = {
      programId: p.programId,
      emneId: p.emne || p.emneId ? placementEmneId({ programId: p.programId, subject: p.emne ?? "", emneId: p.emneId }) : undefined,
    };
    const n = p.students.filter((s) => {
      const a = s.assignedPraksisPlace;
      if (!a || a.status === "cancelled" || a.placeId !== profile.praksisPlaceId) return false;
      return resolveAssignmentProfile(profiles, { placeId: a.placeId, unitId: a.entityId ?? a.departmentId, profileId: a.profileId }, target)?.id === profile.id;
    }).length;
    if (n === 0) return;
    total += n;
    const key = periodKeyFor(period, { year: p.year ?? "", semester: p.semester ?? "", startDate: p.startDate }) ?? "?";
    perPeriod.set(key, (perPeriod.get(key) ?? 0) + n);
  });
  return { total, peak: Math.max(0, ...perPeriod.values()) };
};

export interface PlacedStudent {
  studentId: string;
  name: string;
  placementTitle: string;
  startDate?: string;
  endDate?: string;
  status: string;
  mentor?: string;
}

// The students placed on a profile, across every placement (cancelled ones left out)
export const studentsOnProfile = (
  profile: PlacementProfile,
  profiles: PlacementProfile[],
  placements: OtherPlacementUsage[],
): PlacedStudent[] =>
  placements.flatMap((p) => {
    if (!p.programId) return [];
    const target = {
      programId: p.programId,
      emneId: p.emne || p.emneId ? placementEmneId({ programId: p.programId, subject: p.emne ?? "", emneId: p.emneId }) : undefined,
    };
    return p.students.flatMap((s) => {
      const a = s.assignedPraksisPlace;
      if (!a || a.status === "cancelled" || a.placeId !== profile.praksisPlaceId) return [];
      const owner = resolveAssignmentProfile(profiles, { placeId: a.placeId, unitId: a.entityId ?? a.departmentId, profileId: a.profileId }, target);
      if (owner?.id !== profile.id) return [];
      return [
        {
          studentId: s.id ?? "",
          name: s.name ?? "Student",
          placementTitle: p.title ?? p.placementId,
          startDate: a.startDate,
          endDate: a.endDate,
          status: a.status ?? "planned",
          mentor: a.mentor?.name,
        },
      ];
    });
  });

// Fewer places than students already placed in one period would leave the placement over-booked
export const placesError = (newPlaces: number, peak: number): string | undefined =>
  newPlaces < peak
    ? `${peak} student${peak === 1 ? " is" : "s are"} already placed in one period, so places can't go below ${peak}`
    : undefined;

// Once students are placed on a program of an entity, what they rely on stays put: that program (it can't be
// removed) and the emner they are placed under (see lockedEmneIds)
export const isScopeLocked = (placedTotal: number) => placedTotal > 0;

// The emner of one program of an entity that placed students use (cancelled assignments left out): these can't
// be taken off the entity while the students are on it
export const lockedEmneIds = (
  profile: PlacementProfile,
  profiles: PlacementProfile[],
  placements: OtherPlacementUsage[],
  programId: string,
): string[] => {
  const used = new Set<string>();
  placements.forEach((p) => {
    if (p.programId !== programId) return;
    const emneId = p.emne || p.emneId ? placementEmneId({ programId, subject: p.emne ?? "", emneId: p.emneId }) : undefined;
    if (!emneId) return;
    const placed = p.students.some((s) => {
      const a = s.assignedPraksisPlace;
      if (!a || a.status === "cancelled" || a.placeId !== profile.praksisPlaceId) return false;
      return resolveAssignmentProfile(profiles, { placeId: a.placeId, unitId: a.entityId ?? a.departmentId, profileId: a.profileId })?.id === profile.id;
    });
    if (placed) used.add(emneId);
  });
  return [...used];
};

// Why an entity can't be made active (again): another active entity at the place has its name
export const activationErrors = (profile: PlacementProfile, all: PlacementProfile[]): string[] =>
  validateProfile(profile, all).filter((r) => r.startsWith("An entity with this name"));

// ── Mentors ───────────────────────────────────────────────────────────────────
// A student's mentor is picked from the entity's contacts. "removed" means the person has since been
// taken off the entity (or never was), so the coordinator should look at it again.
export type MentorState = "none" | "ok" | "removed";

export const mentorState = (
  mentor: { personType: string; personId: string } | undefined,
  profile: PlacementProfile | undefined,
): MentorState => {
  if (!mentor) return "none";
  if (!profile) return "ok"; // no profile to compare with
  return profile.contacts.some((c) => c.contactId === mentor.personId) ? "ok" : "removed";
};

// Students who are placed but have no mentor yet (cancelled assignments don't need one)
export const studentsNeedingMentor = (students: UsageStudent[]) =>
  students.filter((s) => s.assignedPraksisPlace && s.assignedPraksisPlace.status !== "cancelled" && !s.assignedPraksisPlace.mentor);

// The contacts that will be told about a placement: flagged "notify on placement", on the profiles in use
export const peopleToNotify = (profiles: PlacementProfile[], people: PlaceContact[]) =>
  profiles.flatMap((p) =>
    resolveContacts(p, people)
      .filter((c) => c.notifyOnPlacement)
      .map((c) => ({ profileId: p.id, profileName: p.name, personType: c.type, personId: c.id, name: c.name })),
  );
