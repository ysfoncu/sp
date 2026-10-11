import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Input } from "../ui/input";
import { periodLabel, usePlacePeriod } from "../../types/placePeriod";
import { placesError } from "../../types/profileRules";
import { PlacementProfile, updateProfile } from "../../types/placementProfile";
import { SectionCard, EmptyHint } from "./SectionCard";
import { useDirtyGuard } from "../../navGuard";
import { placesDirty } from "../../types/entityDirty";

export function PlacesSection({ entity, placedPeak, missing, placeName }: { entity: PlacementProfile; placedPeak: number; missing?: string; placeName: string }) {
  const period = usePlacePeriod(entity.praksisPlaceId);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(entity.places));
  const typed = Math.max(0, parseInt(text, 10) || 0);
  const tooLow = placesError(typed, placedPeak);
  useDirtyGuard("entity-places", "Entity places", editing && placesDirty(text, entity.places));

  const save = () => {
    if (tooLow) return;
    updateProfile(entity.id, { places: typed });
    setEditing(false);
    toast.success("Places saved");
  };

  return (
    <SectionCard
      id="places"
      title="Entity places"
      missing={missing}
      editing={editing}
      onEdit={() => {
        setText(String(entity.places));
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={save}
      saveDisabled={!!tooLow}
      saveHint={tooLow}
    >
      {!editing ? (
        <>
          {entity.places > 0 ? (
            <p className="text-sm text-gray-900">
              <span className="text-lg font-semibold text-purple-600">{entity.places}</span> places per period
            </p>
          ) : (
            <EmptyHint>No places set. Press Edit to say how many students can be placed here in one period. It is a guide for planning and never blocks a placement.</EmptyHint>
          )}
          <p className="text-xs text-gray-500">
            Period: <span className="font-medium text-gray-700">{periodLabel(period)}</span> (set for {placeName})
            {placedPeak > 0 && ` · ${placedPeak} placed in the busiest period`}
          </p>
        </>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Places per period</label>
          <Input
            type="number"
            min={0}
            value={text}
            autoFocus
            aria-label="Places per period"
            onFocus={(e) => e.target.select()}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="w-28 bg-white border-gray-300 text-center"
          />
          <p className="mt-1 text-xs text-gray-500">Period: {periodLabel(period)}. A guide for planning; it never stops a placement.</p>
        </div>
      )}
    </SectionCard>
  );
}
