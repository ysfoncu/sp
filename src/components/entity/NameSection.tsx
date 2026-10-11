import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PraksisPlace } from "../../types/praksisPlace";
import { ENTITY_TYPES, EntityType, PlacementProfile, entityTypeLabel, updateProfile, usePlacementProfiles, validateName } from "../../types/placementProfile";
import { EntityTypeIcon } from "../EntityTypeIcon";
import { SectionCard } from "./SectionCard";
import { useDirtyGuard } from "../../navGuard";
import { nameDirty } from "../../types/entityDirty";

// The entity's type and name. The name must be free at the place.
export function NameSection({ place, entity }: { place: PraksisPlace; entity: PlacementProfile }) {
  const all = usePlacementProfiles();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entity.name);
  const [type, setType] = useState<EntityType | "">(entity.entityType ?? "");
  const errors = validateName(name, place.id, all, entity.id);
  useDirtyGuard("entity-name", "Entity", editing && nameDirty({ name, type }, entity));

  const save = () => {
    if (errors.length > 0) return;
    updateProfile(entity.id, { name: name.trim(), ...(type ? { entityType: type } : {}) });
    setEditing(false);
    toast.success("Entity saved");
  };

  return (
    <SectionCard
      id="entity"
      title="Entity"
      editing={editing}
      onEdit={() => {
        setName(entity.name);
        setType(entity.entityType ?? "");
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={save}
      saveDisabled={errors.length > 0}
      saveHint={errors[0]}
    >
      {!editing ? (
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-gray-500">Type</dt>
          <dd className="flex items-center gap-2 text-gray-900">
            <EntityTypeIcon type={entity.entityType} className="h-4 w-4 text-gray-500" />
            {entityTypeLabel(entity.entityType) ?? <span className="text-gray-400">Not set</span>}
          </dd>
          <dt className="text-gray-500">Name</dt>
          <dd className="text-gray-900">{entity.name}</dd>
          <dt className="text-gray-500">Place</dt>
          <dd className="text-gray-900">{place.name}</dd>
        </dl>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Entity type</label>
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
            <label className="mb-1 block text-xs font-semibold text-gray-700">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} maxLength={80} autoFocus aria-label="Entity name" className={errors.length ? "border-red-400" : ""} />
            {errors.length > 0 && <p className="mt-1 text-xs text-red-600">{errors[0]}</p>}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
