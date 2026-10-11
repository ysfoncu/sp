import { useSyncExternalStore } from "react";
import { findEmne, findEmneByName, findProgram, remapEmneId } from "./studyCatalog";
import { allMockContacts, allMockSupervisors } from "../data/mockContactsAndSupervisors";
import { ContactType, PlaceContact, mergePlaceContacts, removePlaceContact } from "./placeContact";
import { SEED_PRISTINE, SEED_PROFILES } from "../data/seedEntities";

// Entities: a placement profile is an entity of a praksis place.
//
// A praksis place (a hospital, a municipality) has entities. An entity has a name (written when it is
// made; it is the entity's name everywhere), targets ONE program, optionally narrowed to some of its
// emner, and carries one number — the places it offers per period — plus the contacts students are told
// about and the information they get before the placement. Its contacts are people of the praksis place
// (supervisors and entity contacts, see placeContact.ts) that are added to the entity; one person can be on
// several entities.
//
// Other data refers to programs and emner by id (see studyCatalog.ts); names are looked up there.
// The period the places count in is set once per praksis place (placePeriod.ts).

// A person of the place added to an entity, with what that means for this entity. A student's mentor is one
// of the entity's contacts.
export interface EntityContactLink {
  contactId: string; // a PlaceContact of the same place
  notifyOnPlacement: boolean; // told when a student is placed
  availableToStudents: boolean; // shown to students
}

// A person with their flags on one entity, as the screens show them
export type ResolvedContact = PlaceContact & { notifyOnPlacement: boolean; availableToStudents: boolean };

// What an entity's contacts looked like before places had their own contacts: a copy of the person on the entity
export interface LegacyEntityContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  notifyOnPlacement: boolean;
  availableToStudents: boolean;
}

// An on/off fact with an optional description, e.g. "reserved housing exists" + details
export interface ToggleText {
  available: boolean;
  text: string;
}

// What students are told about the placement
export interface PlacementInfo {
  contactBeforePlacement: string; // who to contact before the placement
  contactPhone: string;
  housing: ToggleText; // reserved housing
  publicTransport: ToggleText;
  activityDescription: string;
  workOrganisation: string; // team, key people
  workClothes: string; // rules for work clothes
  changingRoom: ToggleText; // changing room / locker
}

export const emptyPlacementInfo = (): PlacementInfo => ({
  contactBeforePlacement: "",
  contactPhone: "",
  housing: { available: false, text: "" },
  publicTransport: { available: false, text: "" },
  activityDescription: "",
  workOrganisation: "",
  workClothes: "",
  changingRoom: { available: false, text: "" },
});

export type ProfileStatus = "active" | "archived";

// What kind of unit an entity is. New entities must have one; entities from before types have none.
export type EntityType = "klinikk" | "avdeling" | "seksjon" | "sengepost" | "gruppe";

export const ENTITY_TYPES: { id: EntityType; label: string }[] = [
  { id: "klinikk", label: "Klinikk" },
  { id: "avdeling", label: "Avdeling" },
  { id: "seksjon", label: "Seksjon" },
  { id: "sengepost", label: "Sengepost" },
  { id: "gruppe", label: "Gruppe" },
];

export const entityTypeLabel = (type?: EntityType) => ENTITY_TYPES.find((t) => t.id === type)?.label;

export interface PlacementProfile {
  id: string;
  praksisPlaceId: string;
  name: string; // the entity name, unique within the place
  entityType?: EntityType;

  status: ProfileStatus;
  studyId: string;
  programId: string; // exactly one program
  emneIds: string[]; // the program's emner it is for; empty = every emne of the program
  places: number; // places offered per period
  contacts: EntityContactLink[];
  info: PlacementInfo;
  createdAt: string;
  updatedAt: string;
  // Raised by every edit that changes what a placement relies on (places, program, emner,
  // contacts), so a placement can tell that its profile has changed since
  version: number;
  // Set on profiles created from an old limit, so the conversion never makes the same one twice
  migratedFromLimitId?: string;
}

// ── Store ─────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "placementProfiles";
const LIMITS_KEY = "praksisPlaceLimits"; // the old per-emne capacity, read once to create profiles

let idCounter = 0;
const newId = () => `profile-${Date.now().toString(36)}${(idCounter++).toString(36)}`;

// Old capacity (limits) → profiles: one profile per unit and program, places = the sum of the program's emne
// shares, emner = those with a share. Limits whose program is no longer in the catalog are left out.
const profilesFromLimits = (): PlacementProfile[] => {
  let limits: any[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LIMITS_KEY) ?? "[]");
    limits = Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
  const out: PlacementProfile[] = [];
  let skipped = 0;
  limits.forEach((limit) => {
    const byProgram = new Map<string, any[]>();
    (limit.emneShares ?? []).forEach((s: any) => {
      if (s.limit > 0) byProgram.set(s.programId, [...(byProgram.get(s.programId) ?? []), s]);
    });
    byProgram.forEach((shares, programId) => {
      const found = findProgram(programId);
      if (!found) {
        skipped++;
        return;
      }
      const now = limit.createdAt ?? new Date().toISOString();
      out.push({
        id: `profile-${limit.id}-${programId}`,
        praksisPlaceId: limit.praksisPlaceId,
        name: `${limit.entityName} – ${found.program.name}`,
        status: "active",
        studyId: found.study.id,
        programId,
        emneIds: shares.map((s) => s.emneId).filter((id) => found.program.emner?.some((e) => e.id === id)),
        places: shares.reduce((sum, s) => sum + s.limit, 0),
        contacts: [],
        info: emptyPlacementInfo(),
        createdAt: now,
        updatedAt: now,
        version: 1,
        migratedFromLimitId: limit.id,
      });
    });
  });
  if (out.length > 0 || skipped > 0) {
    console.info(`[profiles] created ${out.length} profile(s) from old limits, skipped ${skipped} (program not in catalog)`);
  }
  return out;
};

// Saved profiles from before entities: they were put on a unit and their contacts pointed at people of the
// place. They become entities: the contacts on the profile are copied in, names are made unique per place,
// and the unit is dropped.
const legacyRole: Record<string, string> = {
  main_contact: "Main contact",
  department_contact: "Department contact",
  supervisor: "Supervisor",
};
const legacyPerson = (ref: { personType?: string; personId?: string }) => {
  if (ref.personType === "supervisor") {
    const p = allMockSupervisors.find((x) => x.id === ref.personId);
    return p && { name: p.name, role: (p.role && legacyRole[p.role]) || p.specialization || "Supervisor", email: p.email, phone: p.phone };
  }
  const p = allMockContacts.find((x) => x.id === ref.personId);
  return p && { name: p.name, role: p.type || "Contact", email: p.email, phone: p.phone };
};

export type LegacyProfile = Omit<PlacementProfile, "contacts"> & { contacts: LegacyEntityContact[] };

export const migrateProfilesV1 = (old: any[]): LegacyProfile[] => {
  const taken = new Map<string, Set<string>>(); // place → names in use (lower case)
  return old.map((p) => {
    const contacts: LegacyEntityContact[] = (Array.isArray(p.contacts) ? p.contacts : []).flatMap((c: any) => {
      if (typeof c?.name === "string") return [c as LegacyEntityContact]; // already an entity contact
      if (c?.associated === false) return [];
      const person = legacyPerson(c ?? {});
      if (!person) return [];
      return [
        {
          id: `ec-${c.personType}-${c.personId}`,
          ...person,
          notifyOnPlacement: !!c.notifyOnPlacement,
          availableToStudents: !!c.availableToStudents,
        },
      ];
    });
    const placeNames = taken.get(p.praksisPlaceId) ?? new Set<string>();
    taken.set(p.praksisPlaceId, placeNames);
    const base = (typeof p.name === "string" && p.name.trim()) || "Entity";
    let name = base;
    for (let n = 2; placeNames.has(name.toLowerCase()); n++) name = `${base} (${n})`;
    placeNames.add(name.toLowerCase());
    const { unitId: _unit, ...rest } = p;
    return { ...rest, name, contacts, version: p.version ?? 1 } as LegacyProfile;
  });
};

// Saved entities with a copy of each person on them become entities that link to the people of their place.
// The same person on several entities of one place (same email, or the same name without an email) becomes one
// contact of the place. A copy keeps its id for the first entity it appears on, so older references still match.
// Entities that left the emner empty meant "every emne of the program". Now an empty list means none picked, so
// those entities get all the emner of their program written out.
export const migrateProfilesV3 = (old: PlacementProfile[]): PlacementProfile[] =>
  old.map((p) => (p.programId && p.emneIds.length === 0 ? { ...p, emneIds: activeEmneIds(p.programId) } : p));

export const migrateProfilesV2 = (old: any[]): { profiles: PlacementProfile[]; contacts: PlaceContact[] } => {
  const byPerson = new Map<string, PlaceContact>();
  const contacts: PlaceContact[] = [];
  const profiles = old.map((p) => {
    const links: EntityContactLink[] = (Array.isArray(p.contacts) ? p.contacts : []).flatMap((c: any) => {
      if (typeof c?.contactId === "string") return [c as EntityContactLink]; // already a link
      if (typeof c?.name !== "string") return [];
      const key = `${p.praksisPlaceId}|${(c.email || c.name).trim().toLowerCase()}`;
      let person = byPerson.get(key);
      if (!person) {
        const type: ContactType = /supervisor|handledar|mentor/i.test(`${c.id} ${c.role}`) ? "supervisor" : "contact";
        person = {
          id: typeof c.id === "string" ? c.id : `pc-${contacts.length}`,
          praksisPlaceId: p.praksisPlaceId,
          name: c.name,
          role: c.role ?? "",
          email: c.email ?? "",
          phone: c.phone ?? "",
          type,
        };
        byPerson.set(key, person);
        contacts.push(person);
      }
      return [{ contactId: person.id, notifyOnPlacement: !!c.notifyOnPlacement, availableToStudents: !!c.availableToStudents }];
    });
    return { ...p, contacts: links } as PlacementProfile;
  });
  return { profiles, contacts };
};

const STORAGE_VERSION = 5;

// Version 5: emner that were merged when the starting data moved to 2026 (see migrateCatalogV3) are followed
export const migrateProfilesV5 = (old: PlacementProfile[]): PlacementProfile[] =>
  old.map((p) => ({ ...p, emneIds: [...new Set(p.emneIds.map(remapEmneId))] }));

const save = (list: PlacementProfile[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, profiles: list }));
  } catch {
    // Storage unavailable — keep the in-memory copy
  }
};

const load = (): PlacementProfile[] => {
  // Moves saved data up to the current version; the people found on the way go to the place contacts
  const upgrade = (list: any[], version: number): PlacementProfile[] => {
    if (version >= 3) return version >= 5 ? migrateProfilesV3(list) : migrateProfilesV5(migrateProfilesV3(list));
    const v2 = version >= 2 ? list : migrateProfilesV1(list);
    const { profiles: v3, contacts } = migrateProfilesV2(v2);
    mergePlaceContacts(contacts);
    return migrateProfilesV5(migrateProfilesV3(v3));
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.profiles)) return [];
      if (SEED_PRISTINE && parsed.profiles.length === 0) {
        // An untouched browser that saved an empty list before the starting data existed: the starting entities
        save(SEED_PROFILES);
        return SEED_PROFILES;
      }
      if (parsed.version === STORAGE_VERSION) return parsed.profiles.map((p: PlacementProfile) => ({ ...p, version: p.version ?? 1 }));
      const migrated = upgrade(parsed.profiles, Number(parsed.version) || 1);
      save(migrated);
      return migrated;
    }
  } catch {
    return [];
  }
  // First run: convert the old limits once, and save so it isn't repeated
  const converted = upgrade(profilesFromLimits(), 1);
  const created = converted.length > 0 ? converted : SEED_PROFILES; // nothing to convert: the starting entities
  save(created);
  return created;
};

let profiles: PlacementProfile[] = load();
const listeners = new Set<() => void>();

const setProfiles = (next: PlacementProfile[]) => {
  profiles = next;
  save(next);
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePlacementProfiles = (): PlacementProfile[] => useSyncExternalStore(subscribe, () => profiles);

// The current profiles, for code that is not a component (and for tests)
export const getProfiles = () => profiles;

// ── Changes ───────────────────────────────────────────────────────────────────
export type NewProfile = Pick<PlacementProfile, "praksisPlaceId" | "name"> & { entityType?: EntityType } &
  Partial<Pick<PlacementProfile, "studyId" | "programId" | "emneIds" | "places" | "contacts" | "info">>;

const buildProfile = (input: NewProfile): PlacementProfile => {
  const now = new Date().toISOString();
  return {
    studyId: "",
    programId: "",
    emneIds: [],
    places: 0,
    contacts: [],
    info: emptyPlacementInfo(),
    ...input,
    id: newId(),
    status: "active",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
};

export const addProfile = (input: NewProfile): PlacementProfile => {
  const profile = buildProfile(input);
  setProfiles([...profiles, profile]);
  return profile;
};

// A new entity starts with only a type and a name; the rest is filled in on its page. Callers check the name
// first (validateName).
export const createEntity = (praksisPlaceId: string, name: string, entityType: EntityType): PlacementProfile =>
  addProfile({ praksisPlaceId, name: name.trim(), entityType });

// Several entities at once, saved in one go
export const addProfiles = (inputs: NewProfile[]): PlacementProfile[] => {
  const created = inputs.map(buildProfile);
  setProfiles([...profiles, ...created]);
  return created;
};

// The fields a placement relies on: changing one of them raises the profile's version
const MATERIAL_FIELDS = ["places", "programId", "emneIds", "contacts"] as const;

export const updateProfile = (id: string, patch: Partial<Omit<PlacementProfile, "id" | "createdAt" | "version">>) =>
  setProfiles(
    profiles.map((p) => {
      if (p.id !== id) return p;
      const material = MATERIAL_FIELDS.some(
        (f) => f in patch && JSON.stringify((patch as any)[f]) !== JSON.stringify((p as any)[f]),
      );
      return { ...p, ...patch, version: material ? p.version + 1 : p.version, updatedAt: new Date().toISOString() };
    }),
  );

// Profiles are archived, never deleted: placements that used one keep its name and information
export const setProfileStatus = (id: string, status: ProfileStatus) => updateProfile(id, { status });

// A name that is free at the place: "Name", then "Name (2)", "Name (3)" …
export const uniqueEntityName = (all: PlacementProfile[], placeId: string, base: string) => {
  const used = new Set(all.filter((p) => p.praksisPlaceId === placeId).map((p) => p.name.trim().toLowerCase()));
  let name = base.trim();
  for (let n = 2; used.has(name.toLowerCase()); n++) name = `${base.trim()} (${n})`;
  return name;
};

// A copy to adjust — contacts and information come along. It is named "Copy of X" unless a name is given.
export const duplicateProfile = (id: string, name?: string): PlacementProfile | undefined => {
  const source = profiles.find((p) => p.id === id);
  if (!source) return undefined;
  const now = new Date().toISOString();
  const copy: PlacementProfile = {
    ...source,
    id: newId(),
    name: uniqueEntityName(profiles, source.praksisPlaceId, name?.trim() || `Copy of ${source.name}`),
    status: "active",
    version: 1,
    emneIds: [...source.emneIds],
    contacts: source.contacts.map((c) => ({ ...c })),
    info: JSON.parse(JSON.stringify(source.info)),
    createdAt: now,
    updatedAt: now,
    migratedFromLimitId: undefined,
  };
  setProfiles([...profiles, copy]);
  return copy;
};

// ── Reading ───────────────────────────────────────────────────────────────────
export const profilesOfPlace = (all: PlacementProfile[], placeId: string) =>
  all.filter((p) => p.praksisPlaceId === placeId);

// Places on offer at a praksis place (archived entities don't count)
export const placesOfPlace = (all: PlacementProfile[], placeId: string) =>
  profilesOfPlace(all, placeId)
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.places, 0);

// A mentor is one of an entity's contacts: it refers to the contact by id (personType is the contact's type)
export const contactKey = (c: { personType: string; personId: string }) => `${c.personType}:${c.personId}`;

// The people on an entity with their flags (a link to a person who has since been removed is left out)
export const resolveContacts = (profile: Pick<PlacementProfile, "contacts">, all: PlaceContact[]): ResolvedContact[] =>
  profile.contacts.flatMap((link) => {
    const person = all.find((c) => c.id === link.contactId);
    return person ? [{ ...person, notifyOnPlacement: link.notifyOnPlacement, availableToStudents: link.availableToStudents }] : [];
  });

// Adds a person to an entity (nothing happens when they are already on it)
export const linkContact = (profileId: string, contactId: string, flags: Partial<Omit<EntityContactLink, "contactId">> = {}) => {
  const p = profiles.find((x) => x.id === profileId);
  if (!p || p.contacts.some((c) => c.contactId === contactId)) return;
  updateProfile(profileId, { contacts: [...p.contacts, { contactId, notifyOnPlacement: true, availableToStudents: true, ...flags }] });
};

export const unlinkContact = (profileId: string, contactId: string) => {
  const p = profiles.find((x) => x.id === profileId);
  if (p?.contacts.some((c) => c.contactId === contactId)) updateProfile(profileId, { contacts: p.contacts.filter((c) => c.contactId !== contactId) });
};

// Which entities of the place the person is on: the picked ones are added, the others are taken off. Flags
// of entities they stay on are kept.
export const setContactEntities = (contactId: string, placeId: string, entityIds: string[]) =>
  profiles
    .filter((p) => p.praksisPlaceId === placeId)
    .forEach((p) => (entityIds.includes(p.id) ? linkContact(p.id, contactId) : unlinkContact(p.id, contactId)));

// Removes the person from the place and from every entity they were on
export const deleteContact = (contactId: string) => {
  profiles.filter((p) => p.contacts.some((c) => c.contactId === contactId)).forEach((p) => unlinkContact(p.id, contactId));
  removePlaceContact(contactId);
};

// The entities a person is on
export const entitiesOfContact = (all: PlacementProfile[], contactId: string) => all.filter((p) => p.contacts.some((c) => c.contactId === contactId));

// Does the profile take students of this program and emne?
// The emner of a program that can still be picked (archived ones can't)
export const activeEmneIds = (programId: string) =>
  (findProgram(programId)?.program.emner ?? []).filter((e) => !e.archived).map((e) => e.id);

// An entity with no program takes nobody. It takes the emner picked for it; a program with no emner is matched
// by program alone.
export const profileMatches = (profile: PlacementProfile, target: { programId: string; emneId?: string }) => {
  if (!profile.programId || profile.programId !== target.programId) return false;
  if (activeEmneIds(profile.programId).length === 0) return true;
  return !!target.emneId && profile.emneIds.includes(target.emneId);
};

// The entity an assignment belongs to: the one it stores (archived entities included, so a placed student
// keeps its entity). An assignment without a profile id is looked up by its entity id, which is the same id.
export const resolveAssignmentProfile = (
  all: PlacementProfile[],
  assignment: { placeId: string; unitId?: string; profileId?: string },
  _target?: { programId: string; emneId?: string },
): PlacementProfile | undefined => {
  const id = assignment.profileId ?? assignment.unitId;
  return id ? all.find((p) => p.id === id && p.praksisPlaceId === assignment.placeId) : undefined;
};

// A placement stores its emne by name (and, later, id). Names repeat across programs, so the program
// is needed to find the right one.
export const placementEmneId = (placement: { programId: string; subject: string; emneId?: string }) =>
  placement.emneId ?? findEmneByName(placement.programId, placement.subject)?.id;

// "Sykepleie · Kull 2026 Høst, Kull 2027 Vår" or "Sykepleie · all emner"; archived/removed items stay readable
export const profileAudienceLabel = (profile: PlacementProfile) => {
  if (!profile.programId) return "No program yet";
  const found = findProgram(profile.programId);
  const program = found ? found.program.name : "Unknown program";
  if (profile.emneIds.length === 0) return activeEmneIds(profile.programId).length === 0 ? program : `${program} · no emner picked`;
  const names = profile.emneIds.map((id) => findEmne(profile.programId, id)?.emne.name ?? "Unknown emne");
  return `${program} · ${names.join(", ")}`;
};

// How much of the profile is filled in — it doubles as the students' information, so it is worth showing
export const profileCompleteness = (profile: Pick<PlacementProfile, "places" | "contacts" | "info">) => {
  const { info } = profile;
  const checks = [
    profile.places > 0,
    profile.contacts.length > 0,
    !!info.contactBeforePlacement.trim(),
    !!info.contactPhone.trim(),
    info.housing.available || !!info.housing.text.trim(),
    info.publicTransport.available || !!info.publicTransport.text.trim(),
    !!info.activityDescription.trim(),
    !!info.workOrganisation.trim(),
    !!info.workClothes.trim(),
    info.changingRoom.available || !!info.changingRoom.text.trim(),
  ];
  return { filled: checks.filter(Boolean).length, total: checks.length };
};

// What an entity's name must satisfy: given, and not the name of another active entity of the place
export const validateName = (name: string, placeId: string, others: PlacementProfile[], selfId?: string): string[] => {
  if (!name.trim()) return ["Give the entity a name"];
  const taken = others.some(
    (o) => o.id !== selfId && o.status === "active" && o.praksisPlaceId === placeId && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  return taken ? ["An entity with this name already exists at this place"] : [];
};

// The information fields a student would find empty (an empty field is a warning, not an error)
export const missingInfo = (info: PlacementInfo): string[] => {
  const out: string[] = [];
  if (!info.contactBeforePlacement.trim()) out.push("who to contact before the placement");
  if (!info.contactPhone.trim()) out.push("contact phone number");
  if (!info.activityDescription.trim()) out.push("activity description");
  if (!info.workOrganisation.trim()) out.push("work organisation");
  if (!info.workClothes.trim()) out.push("work clothes");
  return out;
};

export type MissingKey = "program" | "emner" | "places" | "contacts" | "info";

// What is still missing on an entity. The page, the tree, the list and the placement screens all read this, so
// they can't disagree. Program and emner stop the entity from being used in placements; places, contacts and
// information are shown as things to complete.
const programMissing = (p: Pick<PlacementProfile, "programId" | "emneIds">): "program" | "emner" | undefined => {
  if (!p.programId || !findProgram(p.programId)) return "program";
  const accepted = activeEmneIds(p.programId);
  return accepted.length > 0 && !p.emneIds.some((id) => accepted.includes(id)) ? "emner" : undefined;
};

export const entityMissing = (p: PlacementProfile, people: PlaceContact[]): { key: MissingKey; label: string }[] => {
  const out: { key: MissingKey; label: string }[] = [];
  const pm = programMissing(p);
  if (pm) out.push({ key: pm, label: pm === "program" ? "Program" : "Emner" });
  if (p.places <= 0) out.push({ key: "places", label: "Places per period" });
  if (resolveContacts(p, people).length === 0) out.push({ key: "contacts", label: "Contacts" });
  const empty = missingInfo(p.info);
  if (empty.length > 0) out.push({ key: "info", label: `Placement information (${empty.length} of 5 empty)` });
  return out;
};

// Can the entity take students? It needs a program and the emner it accepts.
export const isPlaceable = (p: Pick<PlacementProfile, "programId" | "emneIds">) => !programMissing(p);

// Why a (possibly unsaved) entity can't be saved or looks wrong; empty when it's fine.
// `others` are the entities to compare names with (the ones of the same place count).
export const validateProfile = (
  profile: Pick<PlacementProfile, "id" | "name" | "programId" | "emneIds" | "places"> & { praksisPlaceId?: string },
  others: PlacementProfile[] = [],
): string[] => {
  const reasons: string[] = [];
  if (!profile.name.trim()) reasons.push("Give the entity a name");
  const found = profile.programId ? findProgram(profile.programId) : undefined;
  if (!found) reasons.push("Pick a program");
  else {
    const bad = profile.emneIds.filter((id) => !found.program.emner?.some((e) => e.id === id));
    if (bad.length > 0) reasons.push("Some emner don't belong to the program");
    // An entity must say which emner it accepts (a program without emner has nothing to pick)
    if (profile.emneIds.length === 0 && found.program.emner?.some((e) => !e.archived)) reasons.push("Select at least one emne");
  }
  if (!Number.isInteger(profile.places) || profile.places < 0) reasons.push("Places must be a whole number, 0 or more");
  // Names are unique within a place
  const sameName = others.filter(
    (o) =>
      o.id !== profile.id &&
      o.status === "active" &&
      (!profile.praksisPlaceId || o.praksisPlaceId === profile.praksisPlaceId) &&
      o.name.trim().toLowerCase() === profile.name.trim().toLowerCase() &&
      profile.name.trim() !== "",
  );
  if (sameName.length > 0) reasons.push("An entity with this name already exists at this place");
  return reasons;
};
