import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { PlacementInfo, PlacementProfile, missingInfo, updateProfile } from "../../types/placementProfile";
import { SectionCard } from "./SectionCard";
import { useDirtyGuard } from "../../navGuard";
import { infoDirty } from "../../types/entityDirty";

const toggles = [
  ["housing", "Reserved housing exists"],
  ["publicTransport", "Public transport exists"],
  ["changingRoom", "Changing room / locker exists"],
] as const;

// What students are told. View shows what is filled in and marks what is empty; Edit changes all the fields and
// Save stores them together.
export function InfoSection({ entity, missing }: { entity: PlacementProfile; missing?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlacementInfo>(entity.info);
  useDirtyGuard("entity-info", "Placement information", editing && infoDirty(draft, entity.info));
  const set = (patch: Partial<PlacementInfo>) => setDraft((prev) => ({ ...prev, ...patch }));

  const text = (label: string, key: "contactBeforePlacement" | "contactPhone" | "activityDescription" | "workOrganisation" | "workClothes", rows = 3) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      <Textarea value={draft[key]} onChange={(e) => set({ [key]: e.target.value })} rows={rows} aria-label={label} className="bg-white border-gray-300" />
    </div>
  );

  const info = entity.info;
  const rows: [string, string][] = [
    ["Who to contact before the placement", info.contactBeforePlacement],
    ["Contact person's phone number", info.contactPhone],
    ["Activity description", info.activityDescription],
    ["Work organisation", info.workOrganisation],
    ["Rules for work clothes", info.workClothes],
  ];
  const facts: [string, { available: boolean; text: string }][] = [
    ["Reserved housing", info.housing],
    ["Public transport", info.publicTransport],
    ["Changing room / locker", info.changingRoom],
  ];

  return (
    <SectionCard
      id="info"
      title="Placement information"
      missing={missing}
      editing={editing}
      onEdit={() => {
        setDraft(JSON.parse(JSON.stringify(entity.info)));
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={() => {
        updateProfile(entity.id, { info: draft });
        setEditing(false);
        toast.success("Placement information saved");
      }}
    >
      {!editing ? (
        <>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[220px_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-gray-500">{label}</dt>
                <dd className={value.trim() ? "whitespace-pre-line text-gray-900" : "text-amber-700"}>{value.trim() || "Not filled in"}</dd>
              </div>
            ))}
            {facts.map(([label, v]) => (
              <div key={label} className="contents">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-gray-900">{v.available ? v.text || "Yes" : <span className="text-gray-400">No</span>}</dd>
              </div>
            ))}
          </dl>
          {missingInfo(info).length > 0 && <p className="text-xs text-gray-500">Press Edit to fill in the empty fields. This replaces the welcome letter students would otherwise get.</p>}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {text("Who to contact before the placement", "contactBeforePlacement", 2)}
            {text("Contact person's phone number", "contactPhone", 2)}
          </div>
          {text("Activity description", "activityDescription", 4)}
          {text("Work organisation, e.g. team and key people", "workOrganisation")}
          {text("Rules for work clothes", "workClothes", 2)}
          {toggles.map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-700">
                <Switch checked={draft[key].available} onCheckedChange={(on) => set({ [key]: { ...draft[key], available: on } })} />
                {label}
              </label>
              <Textarea
                value={draft[key].text}
                onChange={(e) => set({ [key]: { ...draft[key], text: e.target.value } })}
                rows={2}
                aria-label={`${label} details`}
                placeholder={draft[key].available ? "Details students should know" : "Turn on if this exists"}
                className="bg-white border-gray-300"
              />
            </div>
          ))}
        </>
      )}
    </SectionCard>
  );
}
