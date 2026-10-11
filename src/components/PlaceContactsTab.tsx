import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Edit, Mail, Phone, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { PraksisPlace } from "../types/praksisPlace";
import { CONTACT_TYPE_LABEL, ContactType, PlaceContact, contactsOfPlace, usePlaceContacts } from "../types/placeContact";
import { deleteContact, entitiesOfContact, usePlacementProfiles } from "../types/placementProfile";
import { ContactForm } from "./ContactForm";
import { ContactAvatar } from "./ContactAvatar";

interface PlaceContactsTabProps {
  place: PraksisPlace;
  onOpenEntity: (entityId: string) => void;
}

// The people of one praksis place: supervisors and entity contacts. A person is made here once and added to
// as many entities as needed.
export function PlaceContactsTab({ place, onOpenEntity }: PlaceContactsTabProps) {
  const all = usePlaceContacts();
  const profiles = usePlacementProfiles();
  const contacts = contactsOfPlace(all, place.id);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | ContactType>("all");
  const [editing, setEditing] = useState<{ contact?: PlaceContact } | null>(null);
  const [deleting, setDeleting] = useState<PlaceContact | null>(null);

  const q = query.trim().toLowerCase();
  const shown = contacts
    .filter((c) => (type === "all" || c.type === type) && (!q || `${c.name} ${c.role} ${c.email} ${c.phone}`.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  const filtering = q !== "" || type !== "all";
  const supervisors = contacts.filter((c) => c.type === "supervisor").length;

  // Adding or editing a person takes the page: the list is shown again when it is saved or cancelled
  if (editing) {
    return (
      <div className="p-6">
        <ContactForm place={place} contact={editing.contact} chooseEntities onClose={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[260px] flex-1">
          <h3 className="mb-1 font-semibold text-gray-900">Contacts</h3>
          <p className="text-sm text-gray-500">
            The people of {place.name}. Make a person once, then add them to the entities they work with.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing({})} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
          <Plus className="h-3.5 w-3.5" />
          Add contact
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
        <span>
          <span className="text-lg font-semibold text-gray-900">{contacts.length}</span> contact{contacts.length === 1 ? "" : "s"}
        </span>
        <span>
          <span className="font-semibold text-gray-900">{supervisors}</span> supervisor{supervisors === 1 ? "" : "s"}
        </span>
        <span>
          <span className="font-semibold text-gray-900">{contacts.length - supervisors}</span> entity contact{contacts.length - supervisors === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone…" className="h-9 border-gray-300 pl-8 pr-8" />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" title="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={type} onValueChange={(v) => setType(v as "all" | ContactType)}>
          <SelectTrigger className="h-9 w-[190px] border-gray-300 bg-white" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="supervisor">Supervisors</SelectItem>
            <SelectItem value="contact">Entity contacts</SelectItem>
          </SelectContent>
        </Select>
        {filtering && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setType("all");
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-600">{contacts.length === 0 ? "No contacts yet." : "No contacts match the filter."}</p>
          <p className="mt-1 text-xs text-gray-500">{contacts.length === 0 ? "Add the supervisors and contacts of this place." : "Try another search or type."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Entities</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((c) => {
                const on = entitiesOfContact(profiles, c.id);
                return (
                  <tr key={c.id} className="align-top">
                    <td className="px-4 py-2.5">
                      <div className="flex items-start gap-3">
                        <ContactAvatar name={c.name} photo={c.photo} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          {c.role && <p className="text-xs text-gray-500">{c.role}</p>}
                          {c.about && <p className="mt-0.5 line-clamp-2 max-w-xs text-xs text-gray-600">{c.about}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={c.type === "supervisor" ? "border-purple-200 bg-purple-50 text-purple-800" : "text-gray-700"}>
                        {CONTACT_TYPE_LABEL[c.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">
                      {c.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {c.phone}
                        </p>
                      )}
                      {!c.email && !c.phone && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {on.length === 0 ? (
                        <span className="text-xs text-gray-400">Not on any entity</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {on.map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => onOpenEntity(e.id)}
                              className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-blue-700 hover:bg-blue-50"
                            >
                              {e.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600" title="Edit contact" aria-label={`Edit ${c.name}`} onClick={() => setEditing({ contact: c })}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600" title="Delete contact" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <Dialog open onOpenChange={() => setDeleting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete {deleting.name}?</DialogTitle>
              <DialogDescription>
                {(() => {
                  const n = entitiesOfContact(profiles, deleting.id).length;
                  return n === 0
                    ? "They are not on any entity."
                    : `They are taken off ${n} entit${n === 1 ? "y" : "ies"}. Students who have them as mentor keep the name but are flagged to pick a new mentor.`;
                })()}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  deleteContact(deleting.id);
                  toast.success(`${deleting.name} deleted`);
                  setDeleting(null);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
