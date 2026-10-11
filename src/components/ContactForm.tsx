import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ContactAvatar, readPhoto } from "./ContactAvatar";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "./ui/utils";
import { PraksisPlace } from "../types/praksisPlace";
import {
  CONTACT_TYPE_LABEL,
  ContactType,
  MAX_ABOUT_WORDS,
  PlaceContact,
  addPlaceContact,
  isValidEmail,
  updatePlaceContact,
  validateContact,
  wordCount,
} from "../types/placeContact";
import { entitiesOfContact, profilesOfPlace, setContactEntities, usePlacementProfiles } from "../types/placementProfile";

interface ContactFormProps {
  place: PraksisPlace;
  contact?: PlaceContact; // when set, the person is edited
  // Show the entities of the place to tick; the person is put on the ticked ones (and taken off the others)
  chooseEntities?: boolean;
  presetEntityIds?: string[];
  onClose: () => void;
  onSaved?: (contact: PlaceContact) => void;
}

// Makes or edits a person of a praksis place: a supervisor or an entity contact. It is shown in the page, not
// in an overlay. The person can be added to several entities here or later, from an entity.
export function ContactForm({ place, contact, chooseEntities = false, presetEntityIds = [], onClose, onSaved }: ContactFormProps) {
  const allProfiles = usePlacementProfiles();
  const entities = profilesOfPlace(allProfiles, place.id).filter((p) => p.status === "active");
  const [type, setType] = useState<ContactType>(contact?.type ?? "supervisor");
  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [entityIds, setEntityIds] = useState<string[]>(() =>
    contact ? entitiesOfContact(allProfiles, contact.id).map((p) => p.id) : presetEntityIds,
  );
  const [photo, setPhoto] = useState(contact?.photo ?? "");
  const [about, setAbout] = useState(contact?.about ?? "");
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);

  const words = wordCount(about);
  const reasons = validateContact({ name, email, about });

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try {
      setPhoto(await readPhoto(file));
      setPhotoError("");
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Could not read the image");
    }
  };

  const save = () => {
    setTouched(true);
    if (reasons.length > 0) return;
    const saved = contact
      ? (updatePlaceContact(contact.id, { type, name, email, phone, photo, about }), { ...contact, type, name: name.trim(), email: email.trim(), phone: phone.trim(), photo, about: about.trim() })
      : addPlaceContact({ praksisPlaceId: place.id, type, name, role: "", email, phone, photo, about });
    if (chooseEntities) setContactEntities(saved.id, place.id, entityIds);
    onSaved?.(saved);
    onClose();
  };

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5" aria-label={contact ? "Edit contact" : "Add contact"}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{contact ? "Edit contact" : "Add contact"}</h3>
        <p className="text-sm text-gray-500">{place.name}. A person is made once for the place and can be added to several entities.</p>
      </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <Select value={type} onValueChange={(v) => setType(v as ContactType)}>
              <SelectTrigger className="bg-white border-gray-300" aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["supervisor", "contact"] as ContactType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {CONTACT_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              {type === "supervisor" ? "A supervisor follows students and can be their mentor." : "An entity contact is someone students or coordinators can reach."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ContactAvatar name={name} photo={photo} className="size-16 text-base" />
            <div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  {photo ? "Change picture" : "Add picture"}
                </Button>
                {photo && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setPhoto("")}>
                    Remove
                  </Button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Picture" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
              <p className="mt-1 text-xs text-gray-500">Shown in a circle. A square picture works best.</p>
              {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Name"
                autoFocus
                className={cn(touched && !name.trim() && "border-red-400")}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs font-semibold text-gray-700">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" className={cn(!isValidEmail(email) && "border-red-400")} />
              {!isValidEmail(email) && <p className="mt-1 text-xs text-red-600">Enter a valid email address</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs font-semibold text-gray-700">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Phone" />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="contact-about" className="block text-xs font-semibold text-gray-700">About me</label>
              <span className={cn("text-xs", words > MAX_ABOUT_WORDS ? "text-red-600" : "text-gray-500")}>
                {words} / {MAX_ABOUT_WORDS} words
              </span>
            </div>
            <Textarea
              id="contact-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              placeholder="A few words students can read about this person"
              className={cn("bg-white", words > MAX_ABOUT_WORDS && "border-red-400")}
            />
          </div>

          {chooseEntities && (
            <div>
              <p className="mb-1 text-xs font-semibold text-gray-700">Add to entities</p>
              {entities.length === 0 ? (
                <p className="text-sm text-gray-500">This place has no entities yet. Add the person to entities later.</p>
              ) : (
                <div className="max-h-44 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
                  {entities.map((e) => (
                    <label key={e.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                      <Checkbox
                        checked={entityIds.includes(e.id)}
                        onCheckedChange={(on) => setEntityIds((prev) => (on ? [...prev, e.id] : prev.filter((x) => x !== e.id)))}
                        aria-label={`Add to ${e.name}`}
                      />
                      {e.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {touched && reasons.length > 0 && <p className="text-xs text-red-600">{reasons.join(". ")}</p>}
        </div>


      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" className="bg-purple-600 hover:bg-purple-700" onClick={save} disabled={reasons.length > 0 && touched}>
          {contact ? "Save contact" : "Add contact"}
        </Button>
      </div>
    </section>
  );
}
