import { createContext, useContext, useMemo } from "react";
import { PlacementProfile, usePlacementProfiles } from "../types/placementProfile";
import { OtherPlacementUsage } from "../types/profileUsage";
import { placedOnProfile, studentsOnProfile } from "../types/profileRules";

// Every placement with its students, so any screen can tell how many students sit on a profile
const PlacementsContext = createContext<OtherPlacementUsage[]>([]);

export const ProfileUsageProvider = PlacementsContext.Provider;

// Every placement with its students
export const useUsagePlacements = () => useContext(PlacementsContext);

export const usePlacedOnProfile = () => {
  const placements = useContext(PlacementsContext);
  const profiles = usePlacementProfiles();
  return useMemo(
    () => (profile: PlacementProfile) => placedOnProfile(profile, profiles, placements),
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
