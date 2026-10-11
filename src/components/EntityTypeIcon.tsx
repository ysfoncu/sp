import { BedDouble, Circle, Layers, LayoutGrid, Stethoscope, Users } from "lucide-react";
import { EntityType, entityTypeLabel } from "../types/placementProfile";

const ICONS = {
  klinikk: Stethoscope,
  avdeling: LayoutGrid,
  seksjon: Layers,
  sengepost: BedDouble,
  gruppe: Users,
} as const;

// The icon of an entity type; an entity without a type gets a plain circle
export function EntityTypeIcon({ type, className = "h-4 w-4" }: { type?: EntityType; className?: string }) {
  const Icon = type ? ICONS[type] : Circle;
  const label = entityTypeLabel(type);
  return <Icon className={className} aria-label={label} role="img" />;
}
