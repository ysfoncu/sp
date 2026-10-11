import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { PlacementProfile, updateProfile } from "../types/placementProfile";
import { placesError } from "../types/profileRules";

interface SetPlacesDialogProps {
  entity: PlacementProfile;
  placed: number; // students already placed on it in the period; places can't go below this
  periodLabel: string;
  onClose: () => void;
}

// Sets how many places an entity has, from where it is offered (the placement page), so the coordinator doesn't
// have to leave the placement.
export function SetPlacesDialog({ entity, placed, periodLabel, onClose }: SetPlacesDialogProps) {
  const [text, setText] = useState(String(entity.places));
  const places = Math.max(0, parseInt(text, 10) || 0);
  const error = placesError(places, placed);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;
    updateProfile(entity.id, { places });
    toast.success(`${entity.name}: ${places} place${places === 1 ? "" : "s"}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Set places · {entity.name}</DialogTitle>
            <DialogDescription>
              How many students can be placed here per period ({periodLabel}). {placed > 0 ? `${placed} are already placed in this period.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Places per period</label>
            <Input type="number" min={0} value={text} autoFocus aria-label="Places per period" onFocus={(e) => e.target.select()} onChange={(e) => setText(e.target.value)} className="w-28 text-center" />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={!!error}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
