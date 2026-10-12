import { createContext, useContext, useMemo } from "react";
import { PlacementProfile, usePlacementProfiles } from "../types/placementProfile";
import { OtherPlacementUsage } from "../types/profileUsage";
import { lockedEmneIds, placedOnProfile, studentsOnProfile } from "../types/profileRules";

// Every placement with its students, so any screen can tell how many students sit on a profile
const PlacementsContext = createContext<OtherPlacementUsage[]>([]);

export const ProfileUsageProvider = PlacementsContext.Provider;

// Every placement with its students
export const useUsagePlacements = () => useContext(PlacementsContext);

export const usePlacedOnProfile = () => {
  const placements = useContext(PlacementsContext);
  const profiles = usePlacementProfiles();
  return useMemo(
    // With a program id only that program's students count (an entity's places are per program)
    () => (profile: PlacementProfile, programId?: string) => placedOnProfile(profile, profiles, placements, undefined, programId),
    [placements, profiles],
  );
};

// The students placed on a profile, for lists
export const useStudentsOnProfile = () => {
  const placements = useContext(PlacementsContext);
  const profiles = usePlacementProfiles();
  return useMemo(
    () => (profile: PlacementProfile) => studentsOnProfile(profile, profiles, placements),
    [placements, profiles],
  );
};

// The emner of one program of an entity that placed students use (they can't be taken off the entity)
export const useLockedEmneIds = () => {
  const placements = useContext(PlacementsContext);
  const profiles = usePlacementProfiles();
  return useMemo(
    () => (profile: PlacementProfile, programId: string) => lockedEmneIds(profile, profiles, placements, programId),
    [placements, profiles],
  );
};
