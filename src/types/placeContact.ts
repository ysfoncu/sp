import { useSyncExternalStore } from "react";
import { SEED_CONTACTS } from "../data/seedEntities";

// People of a praksis place: a supervisor or an entity contact. A person is created once on the place and
// can then be added to several entities (see EntityContactLink in placementProfile.ts). Saved in
// localStorage.placeContacts.

export type ContactType = "supervisor" | "contact";

export interface PlaceContact {
  id: string;
  praksisPlaceId: string;
  name: string;
  role: string; // title or role, e.g. "Practice supervisor"
  email: string;
  phone: string;
  type: ContactType;
  photo?: string; // a small square picture as a data URL; empty or missing means none
  about?: string; // a short text about the person, at most MAX_ABOUT_WORDS words
}

export const MAX_ABOUT_WORDS = 150;

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = {
  supervisor: "Supervisor",
  contact: "Entity contact",
};

export const isValidEmail = (email: string) => !email.trim() || /^\S+@\S+\.\S+$/.test(email.trim());

// Why a (possibly unsaved) contact can't be saved; empty when it's fine
export const validateContact = (c: Pick<PlaceContact, "name" | "email"> & { about?: string }): string[] => {
  const reasons: string[] = [];
  if (!c.name.trim()) reasons.push("Enter a name");
  if (!isValidEmail(c.email)) reasons.push("Enter a valid email address");
  if (wordCount(c.about ?? "") > MAX_ABOUT_WORDS) reasons.push(`About me can have at most ${MAX_ABOUT_WORDS} words`);
  return reasons;
};

const STORAGE_KEY = "placeContacts";

const load = (): PlaceContact[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return SEED_CONTACTS; // first run: the starting people, saved with the next change
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.contacts) ? parsed.contacts : [];
  } catch {
    return [];
  }
};

let contacts: PlaceContact[] = load();
const listeners = new Set<() => void>();

const setContacts = (next: PlaceContact[]) => {
  contacts = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, contacts: next }));
  } catch {
    // Storage unavailable — keep the in-memory copy
  }
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePlaceContacts = (): PlaceContact[] => useSyncExternalStore(subscribe, () => contacts);

// The current contacts, for code that is not a component (and for tests)
export const getPlaceContacts = () => contacts;

let idCounter = 0;
const newId = () => `pc-${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export const contactsOfPlace = (all: PlaceContact[], placeId: string) => all.filter((c) => c.praksisPlaceId === placeId);

export const addPlaceContact = (input: Omit<PlaceContact, "id">): PlaceContact => {
  const contact: PlaceContact = {
    ...input,
    id: newId(),
    name: input.name.trim(),
    role: input.role.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    about: (input.about ?? "").trim(),
  };
  setContacts([...contacts, contact]);
  return contact;
};

export const updatePlaceContact = (id: string, patch: Partial<Omit<PlaceContact, "id" | "praksisPlaceId">>) =>
  setContacts(
    contacts.map((c) =>
      c.id === id
        ? {
            ...c,
            ...patch,
            name: (patch.name ?? c.name).trim(),
            role: (patch.role ?? c.role).trim(),
            email: (patch.email ?? c.email).trim(),
            phone: (patch.phone ?? c.phone).trim(),
            about: (patch.about ?? c.about ?? "").trim(),
          }
        : c,
    ),
  );

// Removes the person from the place. Taking them off the entities is done by deleteContact in placementProfile.ts.
export const removePlaceContact = (id: string) => setContacts(contacts.filter((c) => c.id !== id));

// Adds contacts that are not there yet (an existing id is kept as it is); used when saved data is migrated
export const mergePlaceContacts = (list: PlaceContact[]) => {
  const have = new Set(contacts.map((c) => c.id));
  const fresh = list.filter((c) => !have.has(c.id));
  if (fresh.length > 0) setContacts([...contacts, ...fresh]);
};

export const clearPlaceContacts = () => setContacts([]);
