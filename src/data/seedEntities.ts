// What a fresh browser starts with: the study catalog the Umeå import uses, and 40 entities over the three praksis
// places (ten per program, each with every emne of its program; Barne seksjon takes three programs) with 3 people each — 120 in all. Ids are fixed so
// the data is the same everywhere. It is only used when nothing is saved yet; saved data is never replaced.
// This file must not import the stores (they import it).
import type { Study } from "../types/studyCatalog";
import type { PlaceContact } from "../types/placeContact";
import type { PlacementProfile } from "../types/placementProfile";

const STUDY_ID = "study-seed-helse";
const PROGRAMS: { id: string; name: string; code: string; terms: string[] }[] = [
  { id: "program-seed-vysjs", name: "Sjuksköterskeprogrammet", code: "VYSJS", terms: ["HT 2026", "VT 2026"] },
  { id: "program-seed-vybar", name: "Barnmorskeprogrammet", code: "VYBAR", terms: ["HT 2026"] },
  { id: "program-seed-vyfys", name: "Fysioterapeutprogrammet", code: "VYFYS", terms: ["HT 2026"] },
  { id: "program-seed-mylog", name: "Logopedprogrammet", code: "MYLOG", terms: ["HT 2026"] },
];
const emneId = (programId: string, term: string) => `${programId.replace("program", "emne")}-${term.replace(" ", "").toLowerCase()}`;

export const SEED_CATALOG: Study[] = [
  {
    id: STUDY_ID,
    name: "Hälso- och sjukvård samt social omsorg",
    universityId: "U1",
    universityName: "University of Oslo",
    programs: PROGRAMS.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      emner: p.terms.map((t) => ({ id: emneId(p.id, t), name: `VFU ${t}`, startTerm: t })),
    })),
  },
];

const PLACES = ["place-oslo-university-hospital", "place-bergen-kommune", "place-trondheim-mental-health"];
const UNITS = [
  "Ortopedisk", "Kirurgisk", "Medisinsk", "Kardiologisk", "Nevrologisk", "Geriatrisk", "Onkologisk", "Akuttmottak", "Intensiv", "Barsel",
  "Føde", "Nyfødt", "Barne", "Psykiatrisk", "Rehabiliterings", "Dialyse", "Lunge", "Hud", "Øye", "Øre-nese-hals",
  "Urologisk", "Gastro", "Endokrinologisk", "Smerte", "Palliativ", "Hjemmesykepleie", "Sykehjem", "Habiliterings", "Logopedi", "Fysioterapi",
  "Ergoterapi", "Helsestasjon", "Legevakt", "Dagkirurgi", "Operasjon", "Oppvåknings", "Infeksjons", "Revmatologisk", "Blod", "Nyre",
];
const TYPES = ["klinikk", "avdeling", "seksjon", "sengepost", "gruppe"] as const;
const FIRST = ["Anne", "Per", "Kari", "Ole", "Ingrid", "Lars", "Marit", "Jon", "Sigrid", "Erik", "Hilde", "Knut", "Randi", "Tor", "Silje", "Håkon", "Nina", "Arne", "Camilla", "Geir", "Linn", "Svein", "Tone", "Bjørn", "Eva", "Rune", "Mona", "Trond", "Elin", "Stian"];
const LAST = ["Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen", "Jensen", "Karlsen", "Johnsen", "Pettersen", "Eriksen", "Berg", "Haugen", "Hagen"];
const ABOUT = [
  "Has worked with student placements for many years and likes to start with a short walk through the unit.",
  "Specialist nurse who values questions. Students are welcome to follow the morning meeting.",
  "Coordinates the weekly plan for students and is the first person to contact before the first day.",
];
// Is the browser untouched? A browser that opened the app before the starting data existed saved empty lists of
// entities, people and studies, and "saved data is never replaced" would keep it empty for good. If all three are
// missing or empty, nothing of the user's is there to protect, so the starting data is used (and saved).
export const isPristine = (lists: (unknown[] | null)[]) => lists.every((l) => l === null || l.length === 0);
const savedList = (key: string, field: string): unknown[] | null => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const list = JSON.parse(raw)?.[field];
    return Array.isArray(list) ? list : [1]; // unreadable or odd: treat as the user's
  } catch {
    return [1];
  }
};
export const SEED_PRISTINE: boolean = (() => {
  try {
    return isPristine([savedList("placementProfiles", "profiles"), savedList("placeContacts", "contacts"), savedList("studyCatalog", "studies")]);
  } catch {
    return false;
  }
})();

const SEED_TIME = "2026-01-01T00:00:00.000Z";

const build = () => {
  const contacts: PlaceContact[] = [];
  const profiles: PlacementProfile[] = [];
  UNITS.forEach((unit, i) => {
    const placeId = PLACES[i % PLACES.length];
    const program = PROGRAMS[Math.floor(i / 10)];
    const type = TYPES[i % TYPES.length];
    const links = [0, 1, 2].map((k) => {
      const n = i * 3 + k;
      const first = FIRST[n % FIRST.length];
      const last = LAST[(n * 7 + Math.floor(n / FIRST.length)) % LAST.length];
      const id = `pc-seed-${n + 1}`;
      contacts.push({
        id,
        praksisPlaceId: placeId,
        type: k < 2 ? "supervisor" : "contact",
        name: `${first} ${last}`,
        role: k < 2 ? "Practice supervisor" : "Unit contact",
        email: `${first}.${last}${n}@example.no`.toLowerCase().replace(/å/g, "a").replace(/ø/g, "o"),
        phone: `+47 ${String(40000000 + n * 7919).slice(0, 8)}`,
        about: ABOUT[n % ABOUT.length],
      });
      return { contactId: id, notifyOnPlacement: true, availableToStudents: true };
    });
    profiles.push({
      id: `profile-seed-${i + 1}`,
      praksisPlaceId: placeId,
      name: `${unit} ${type}`,
      entityType: type,
      status: "active",
      programs: [
        { programId: program.id, emneIds: program.terms.map((t) => emneId(program.id, t)), places: 2 + (i % 7) },
        // Barne seksjon also takes nursing and speech therapy students: one entity, three programs, separate places for each
        ...(unit === "Barne"
          ? [
              { programId: PROGRAMS[0].id, emneIds: PROGRAMS[0].terms.map((t) => emneId(PROGRAMS[0].id, t)), places: 4 },
              { programId: PROGRAMS[3].id, emneIds: PROGRAMS[3].terms.map((t) => emneId(PROGRAMS[3].id, t)), places: 3 },
            ]
          : []),
      ],
      contacts: links,
      info: {
        contactBeforePlacement: "The unit contact",
        contactPhone: "+47 22 00 00 00",
        housing: { available: false, text: "" },
        publicTransport: { available: false, text: "" },
        activityDescription: "Students follow the daily work of the unit with a supervisor.",
        workOrganisation: "Day and evening shifts in a small team.",
        workClothes: "Uniform is provided by the unit.",
        changingRoom: { available: false, text: "" },
      },
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
      version: 1,
    });
  });
  return { contacts, profiles };
};

const built = build();
export const SEED_CONTACTS = built.contacts;
export const SEED_PROFILES = built.profiles;
