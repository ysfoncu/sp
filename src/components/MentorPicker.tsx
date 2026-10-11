import { useState } from "react";
import { ChevronDown, UserCheck, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mentor } from "../types/placementTask";
import { ResolvedContact } from "../types/placementProfile";
import { MentorState } from "../types/profileRules";

interface MentorPickerProps {
  mentor?: Mentor;
  state: MentorState;
  profileName?: string; // the entity the student is on; without one there is nothing to pick from
  contacts: ResolvedContact[];
  onChoose: (contact: ResolvedContact) => void;
  // A new person typed in here becomes a supervisor of the place and a contact of the entity, then the mentor
  onAddContact: (person: { name: string; role: string; email: string; phone: string }) => void;
  onClear: () => void;
}

const emptyPerson = { name: "", role: "", email: "", phone: "" };

// Picks the mentor of one student from the entity's contacts. A person who isn't a contact yet can be added
// on the spot.
export function MentorPicker({ mentor, state, profileName, contacts, onChoose, onAddContact, onClear }: MentorPickerProps) {
  const [adding, setAdding] = useState(false);
  const [person, setPerson] = useState(emptyPerson);

  if (!profileName) {
    return <span className="text-sm text-gray-400" title="Place the student on an entity first">—</span>;
  }

  const emailOk = !person.email.trim() || /^\S+@\S+\.\S+$/.test(person.email.trim());
  const canSave = person.name.trim() !== "" && emailOk;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-left text-sm hover:bg-gray-50 ${
              state === "none" ? "border-amber-200 bg-amber-50 text-amber-800" : state === "removed" ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 text-gray-800"
            }`}
          >
            {state === "none" ? <UserPlus className="h-3.5 w-3.5 flex-shrink-0" /> : <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />}
            <span className="min-w-0 truncate">{mentor ? mentor.name : "Needs mentor"}</span>
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-gray-500">Contacts of {profileName}</DropdownMenuLabel>
          {contacts.length === 0 && <p className="px-2 py-1.5 text-xs text-gray-500">This entity has no contacts yet.</p>}
          {[...contacts].sort((a, b) => Number(b.type === "supervisor") - Number(a.type === "supervisor")).map((c) => (
            <DropdownMenuItem key={c.id} onSelect={() => onChoose(c)} className="flex-col items-start gap-0">
              <span className="text-sm">{c.name}</span>
              <span className="text-xs text-gray-500">
                {c.type === "supervisor" ? "Supervisor" : "Entity contact"}
                {c.role ? ` · ${c.role}` : ""}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setAdding(true)}>Add a person…</DropdownMenuItem>
          {mentor && (
            <DropdownMenuItem onSelect={onClear} className="text-red-600">
              Remove mentor
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {state === "removed" && <p className="mt-1 text-[11px] text-red-600">No longer a contact of {profileName}</p>}

      <Dialog
        open={adding}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false);
            setPerson(emptyPerson);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a person to {profileName}</DialogTitle>
            <DialogDescription>The person becomes a supervisor of the place, a contact of the entity and this student's mentor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} placeholder="Name *" aria-label="Name" />
            <Input value={person.email} onChange={(e) => setPerson({ ...person, email: e.target.value })} placeholder="Email" aria-label="Email" />
            {!emailOk && <p className="text-xs text-red-600">Enter a valid email address</p>}
            <Input value={person.phone} onChange={(e) => setPerson({ ...person, phone: e.target.value })} placeholder="Phone" aria-label="Phone" />
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAdding(false);
                setPerson(emptyPerson);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!canSave}
              onClick={() => {
                onAddContact({ name: person.name.trim(), role: person.role.trim(), email: person.email.trim(), phone: person.phone.trim() });
                setAdding(false);
                setPerson(emptyPerson);
              }}
            >
              Add and assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
