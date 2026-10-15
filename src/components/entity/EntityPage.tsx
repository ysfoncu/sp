import { useEffect, useRef, useState } from "react";
import { toast } from "sonner@2.0.3";
import { Archive, ArchiveRestore, CheckCircle2, Copy, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { PraksisPlace } from "../../types/praksisPlace";
import { activationErrors } from "../../types/profileRules";
import { usePlaceContacts } from "../../types/placeContact";
import {
  PlacementProfile,
  duplicateProfile,
  entityMissing,
  entityTypeLabel,
  setProfileStatus,
  usePlacementProfiles,
} from "../../types/placementProfile";
import { usePlacedOnProfile, useStudentsOnProfile } from "../ProfileUsageContext";
import { consumeFocusRequest } from "../../navigation";
import { EntityTypeIcon } from "../EntityTypeIcon";
import { SectionCard } from "./SectionCard";
import { AcceptedProgramsSection } from "./AcceptedProgramsSection";
import { ContactsSection } from "./ContactsSection";
import { InfoSection } from "./InfoSection";
import { NameSection } from "./NameSection";

interface EntityPageProps {
  place: PraksisPlace;
  entity: PlacementProfile;
  onCopied: (entityId: string) => void;
}

const fmt = (d?: string) => (d ? d.slice(0, 10).split("-").reverse().join(".") : "");

// One page for an entity, with no separate edit mode: every block can be filled in where it is and saves as
// soon as it is changed. What is still missing is listed at the top and marked on its block.
export function EntityPage({ place, entity, onCopied }: EntityPageProps) {
  const all = usePlacementProfiles();
  const people = usePlaceContacts();
  const placed = usePlacedOnProfile()(entity); // all programs: the archive warning
  const students = useStudentsOnProfile()(entity);
  const [archiving, setArchiving] = useState(false);

  // Opening an entity from a click moves focus to its title, like a page change (a restored URL does not)
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!consumeFocusRequest()) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 80); // after a closing dialog has handed focus back
    return () => window.clearTimeout(t);
  }, []);

  const archived = entity.status === "archived";
  const missing = entityMissing(entity, people);
  const missingOf = (key: string) => missing.find((m) => m.key === key);
  const emptyInfo = missingOf("info")?.label.match(/\((\d+) of 5/)?.[1];

  const changeStatus = () => {
    if (archived) {
      const errors = activationErrors({ ...entity, status: "active" }, all);
      if (errors.length > 0) return void toast.error("Can't restore this entity", { description: errors[0] });
      setProfileStatus(entity.id, "active");
      toast.success(`${entity.name} restored`);
    } else if (placed.total > 0) setArchiving(true);
    else archive();
  };
  const archive = () => {
    setProfileStatus(entity.id, "archived");
    toast(`${entity.name} archived`, { action: { label: "Undo", onClick: () => setProfileStatus(entity.id, "active") } });
  };

  // A gap on one program opens at that program's card; the others at their block
  const jump = (m: { key: string; programId?: string }) => {
    const id = m.programId ? `program-${m.programId}` : m.key === "program" || m.key === "emner" ? "programs" : m.key;
    document.getElementById(`entity-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-5 p-6 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[260px] flex-1">
          <div className="flex items-center gap-2">
            <EntityTypeIcon type={entity.entityType} className="h-4 w-4 text-gray-500" />
            <h3 ref={titleRef} tabIndex={-1} className="font-semibold text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
              {entity.name}
            </h3>
            {archived && (
              <Badge variant="outline" className="text-gray-500">
                Archived
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {entityTypeLabel(entity.entityType) ?? "Entity"} at {place.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={archived}
            className="gap-1.5"
            onClick={() => {
              const copy = duplicateProfile(entity.id);
              if (copy) {
                toast.success(`${copy.name} created`);
                onCopied(copy.id);
              }
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={changeStatus} className="gap-1.5">
            {archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {archived ? "Restore" : "Archive"}
          </Button>
        </div>
      </div>

      {archived ? (
        <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">This entity is archived, so it is read-only and can't take students. Restore it to change it.</p>
      ) : missing.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3" role="status">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <TriangleAlert className="h-4 w-4" />
            To complete: {missing.length} thing{missing.length === 1 ? "" : "s"} missing
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {missing.map((m) => (
              <li key={`${m.key}-${m.programId ?? ""}`}>
                <button type="button" onClick={() => jump(m)} className="rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs text-amber-900 hover:bg-amber-100">
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
          {(missingOf("program") || missingOf("emner")) && <p className="mt-2 text-xs text-amber-800">Until a program and emner are set, this entity is not offered when students are placed.</p>}
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
          <CheckCircle2 className="h-4 w-4" />
          Ready for placements. Everything is filled in.
        </p>
      )}

      <fieldset disabled={archived} className="min-w-0 space-y-5 border-0 p-0">
        <NameSection place={place} entity={entity} />
        <AcceptedProgramsSection entity={entity} placeName={place.name} missing={missing} />
        <ContactsSection place={place} entity={entity} missing={missingOf("contacts") ? "No contacts" : undefined} />
        <InfoSection entity={entity} missing={emptyInfo ? `${emptyInfo} of 5 empty` : undefined} />
      </fieldset>

      <SectionCard id="placed" title={`Placed here (${students.length})`}>
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">No students are placed on this entity yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
            {students.map((s, i) => (
              <div key={`${s.studentId}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-gray-900">{s.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {s.placementTitle}
                    {s.startDate && ` · ${fmt(s.startDate)}${s.endDate ? ` – ${fmt(s.endDate)}` : ""}`}
                  </p>
                  <p className={`truncate text-xs ${s.mentor ? "text-gray-500" : "text-amber-700"}`}>{s.mentor ? `Mentor: ${s.mentor}` : "Needs mentor"}</p>
                </div>
                <span className="rounded border border-gray-200 px-1.5 py-0.5 text-xs capitalize text-gray-600">{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {archiving && (
        <Dialog open onOpenChange={() => setArchiving(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Archive {entity.name}?</DialogTitle>
              <DialogDescription>
                {placed.total} student{placed.total === 1 ? " is" : "s are"} placed on this entity. They keep their placement and the entity's name, but no new students can be placed on it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setArchiving(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  archive();
                  setArchiving(false);
                }}
              >
                Archive
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
