import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { PraksisPlace } from "../../types/praksisPlace";
import { ENTITY_TYPES, EntityType, createEntity, usePlacementProfiles, validateName } from "../../types/placementProfile";
import { EntityTypeIcon } from "../EntityTypeIcon";

interface CreateEntityDialogProps {
  place: PraksisPlace;
  onClose: () => void;
  onCreated: (entityId: string) => void;
}

// A new entity starts with a type and a name. Everything else is filled in on the entity's page.
export function CreateEntityDialog({ place, onClose, onCreated }: CreateEntityDialogProps) {
  const all = usePlacementProfiles();
  const [type, setType] = useState<EntityType | "">("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);

  const nameErrors = validateName(name, place.id, all);
  const canCreate = !!type && nameErrors.length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canCreate || !type) return;
    const created = createEntity(place.id, name, type);
    toast.success(`${created.name} created`, { description: "Add the rest on its page." });
    onCreated(created.id);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add entity</DialogTitle>
            <DialogDescription>{place.name}. Choose the type and give it a name. You add program, emner, contacts and information on its page.</DialogDescription>
          </DialogHeader>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Entity type <span className="text-red-500">*</span>
            </label>
            <Select value={type} onValueChange={(v) => setType(v as EntityType)}>
              <SelectTrigger className="bg-white border-gray-300" aria-label="Entity type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <EntityTypeIcon type={t.id} className="h-4 w-4 text-gray-500" />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              maxLength={80}
              placeholder="e.g. Surgery ward 3B"
              aria-label="Name"
              autoFocus
              className={touched && nameErrors.length > 0 && name !== "" ? "border-red-400" : ""}
            />
            {name !== "" && nameErrors.length > 0 && <p className="mt-1 text-xs text-red-600">{nameErrors[0]}</p>}
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={!canCreate}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
