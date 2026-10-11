import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Mail, Phone, UserPlus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PraksisPlace } from "../../types/praksisPlace";
import { CONTACT_TYPE_LABEL, contactsOfPlace, usePlaceContacts } from "../../types/placeContact";
import { EntityContactLink, PlacementProfile, resolveContacts, updateProfile } from "../../types/placementProfile";
import { ContactForm } from "../ContactForm";
import { ContactAvatar } from "../ContactAvatar";
import { SectionCard, EmptyHint } from "./SectionCard";
import { useDirtyGuard } from "../../navGuard";
import { contactsDirty } from "../../types/entityDirty";

// The people on this entity. Edit changes the list and the two flags of each person; Save stores them together.
// A new person made here belongs to the place at once (the form has its own Add contact), and is then put on
// the list being edited.
export function ContactsSection({ place, entity, missing }: { place: PraksisPlace; entity: PlacementProfile; missing?: string }) {
  const people = usePlaceContacts();
  const [editing, setEditing] = useState(false);
  const [links, setLinks] = useState<EntityContactLink[]>(entity.contacts);
  const [adding, setAdding] = useState(false);

  useDirtyGuard("entity-contacts", "Entity contacts", editing && (adding || contactsDirty(links, entity.contacts)));
  const shown = resolveContacts({ contacts: editing ? links : entity.contacts }, people);
  const notLinked = contactsOfPlace(people, place.id).filter((c) => !links.some((l) => l.contactId === c.id));
  const flag = (id: string, patch: Partial<EntityContactLink>) => setLinks((prev) => prev.map((l) => (l.contactId === id ? { ...l, ...patch } : l)));
  const add = (contactId: string) => setLinks((prev) => (prev.some((l) => l.contactId === contactId) ? prev : [...prev, { contactId, notifyOnPlacement: true, availableToStudents: true }]));

  const close = () => {
    setEditing(false);
    setAdding(false);
  };
  const save = () => {
    updateProfile(entity.id, { contacts: links });
    close();
    toast.success("Contacts saved");
  };

  return (
    <SectionCard
      id="contacts"
      title={`Entity contacts (${shown.length})`}
      missing={missing}
      editing={editing}
      onEdit={() => {
        setLinks(entity.contacts.map((l) => ({ ...l })));
        setEditing(true);
      }}
      onCancel={close}
      onSave={save}
      saveDisabled={adding}
      saveHint="Finish or cancel the new contact first"
    >
      {shown.length === 0 && !adding && (
        <EmptyHint>{editing ? `No one is on this entity yet. Add a person of ${place.name} below, or make a new one.` : `No contacts yet. Press Edit to add a supervisor or a contact of ${place.name}.`}</EmptyHint>
      )}
      {shown.map((c) =>
        editing ? (
          <div key={c.id} className="rounded-md border border-gray-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <ContactAvatar name={c.name} photo={c.photo} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {c.name} <span className="font-normal text-gray-500">· {c.role || CONTACT_TYPE_LABEL[c.type]}</span>
                </p>
                <p className="truncate text-xs text-gray-500">
                  {CONTACT_TYPE_LABEL[c.type]}
                  {c.email && ` · ${c.email}`}
                  {c.phone && ` · ${c.phone}`}
                </p>
              </div>
              <button type="button" onClick={() => setLinks((prev) => prev.filter((l) => l.contactId !== c.id))} className="flex flex-shrink-0 items-center gap-1 text-xs text-red-600 hover:underline" aria-label={`Remove ${c.name} from this entity`}>
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-700">
              <label className="flex cursor-pointer items-center gap-1.5">
                <Checkbox checked={c.notifyOnPlacement} onCheckedChange={(on) => flag(c.id, { notifyOnPlacement: !!on })} />
                Notified when a student is placed to this entity.
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <Checkbox checked={c.availableToStudents} onCheckedChange={(on) => flag(c.id, { availableToStudents: !!on })} />
                Shown to students
              </label>
            </div>
          </div>
        ) : (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-sm">
            <ContactAvatar name={c.name} photo={c.photo} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">
                {c.name} <span className="font-normal text-gray-500">· {c.role || CONTACT_TYPE_LABEL[c.type]}</span>
              </p>
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-gray-600">
                {c.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    {c.email}
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {c.phone}
                  </span>
                )}
              </p>
              {c.about && <p className="mt-1 line-clamp-2 max-w-prose text-xs text-gray-600">{c.about}</p>}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className={c.type === "supervisor" ? "border-purple-200 bg-purple-50 text-purple-800" : "text-gray-700"}>
                {CONTACT_TYPE_LABEL[c.type]}
              </Badge>
              {c.notifyOnPlacement && <Badge variant="outline">Notified when a student is placed to this entity.</Badge>}
              {c.availableToStudents && <Badge variant="outline">Shown to students</Badge>}
            </div>
          </div>
        ),
      )}

      {editing &&
        (adding ? (
          <ContactForm place={place} chooseEntities={false} onClose={() => setAdding(false)} onSaved={(c) => add(c.id)} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Select value="" onValueChange={add} disabled={notLinked.length === 0}>
              <SelectTrigger className="h-9 w-[250px] bg-white border-gray-300" aria-label="Add an existing contact">
                <SelectValue placeholder={notLinked.length === 0 ? "No other people at this place" : "Add an existing contact…"} />
              </SelectTrigger>
              <SelectContent>
                {notLinked.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {CONTACT_TYPE_LABEL[c.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
              <UserPlus className="mr-1 h-4 w-4" />
              New contact
            </Button>
          </div>
        ))}
    </SectionCard>
  );
}
