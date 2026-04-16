import { Contact, Supervisor } from "../types/praksisPlace";

// Mock Contacts for Oslo University Hospital HF
export const mockContactsOslo: Contact[] = [
  // HF Level
  {
    id: "contact-hf-oslo-1",
    name: "Anne Kristensen",
    email: "anne.kristensen@ous.no",
    phone: "+47 23 07 10 00",
    organizationNodeId: "hf-oslo",
    type: "Helseforetak",
    unitName: "Oslo University Hospital HF",
  },
  {
    id: "contact-hf-oslo-2",
    name: "Per Johansen",
    email: "per.johansen@ous.no",
    phone: "+47 23 07 10 01",
    organizationNodeId: "hf-oslo",
    type: "Helseforetak",
    unitName: "Oslo University Hospital HF",
  },
  
  // Klinikk Level - Ortopedisk
  {
    id: "contact-klinikk-ortopedi-1",
    name: "Lise Andersen",
    email: "lise.andersen@ous.no",
    phone: "+47 23 07 20 00",
    organizationNodeId: "klinikk-ortopedi",
    type: "Klinikk",
    unitName: "Ortopedisk klinikk",
  },
  
  // Klinikk Level - Kirurgisk
  {
    id: "contact-klinikk-kirurgi-1",
    name: "Martin Berg",
    email: "martin.berg@ous.no",
    phone: "+47 23 07 21 00",
    organizationNodeId: "klinikk-kirurgi",
    type: "Klinikk",
    unitName: "Kirurgisk klinikk",
  },
  
  // Klinikk Level - Akutt
  {
    id: "contact-klinikk-akutt-1",
    name: "Kari Olsen",
    email: "kari.olsen@ous.no",
    phone: "+47 23 07 22 00",
    organizationNodeId: "klinikk-akutt",
    type: "Klinikk",
    unitName: "Akuttklinikk",
  },
  
  // Avdeling Level - Akuttavdeling
  {
    id: "contact-avd-akutt-1",
    name: "Stein Hansen",
    email: "stein.hansen@ous.no",
    phone: "+47 23 07 30 00",
    organizationNodeId: "avd-akutt-ortopedi",
    type: "Avdeling",
    unitName: "Akuttavdeling",
  },
  
  // Avdeling Level - Poliklinikk
  {
    id: "contact-avd-poliklinikk-1",
    name: "Eva Larsen",
    email: "eva.larsen@ous.no",
    phone: "+47 23 07 31 00",
    organizationNodeId: "avd-poliklinikk-ortopedi",
    type: "Avdeling",
    unitName: "Poliklinikk",
  },
  
  // Avdeling Level - Generell kirurgi
  {
    id: "contact-avd-generell-kirurgi-1",
    name: "Nina Dahl",
    email: "nina.dahl@ous.no",
    phone: "+47 23 07 32 00",
    organizationNodeId: "avd-generell-kirurgi",
    type: "Avdeling",
    unitName: "Generell kirurgi",
  },
  
  // Avdeling Level - Karkirurgi
  {
    id: "contact-avd-karkirurgi-1",
    name: "Ole Strand",
    email: "ole.strand@ous.no",
    phone: "+47 23 07 33 00",
    organizationNodeId: "avd-karkirurgi",
    type: "Avdeling",
    unitName: "Karkirurgi",
  },
  
  // Avdeling Level - Emergency
  {
    id: "contact-avd-emergency-1",
    name: "Emma Nilsen",
    email: "emma.nilsen@ous.no",
    phone: "+47 23 07 34 00",
    organizationNodeId: "avd-emergency",
    type: "Avdeling",
    unitName: "Emergency Department",
  },
  
  // Seksjon Level - Intensiv
  {
    id: "contact-seksjon-intensiv-1",
    name: "Tom Eriksen",
    email: "tom.eriksen@ous.no",
    phone: "+47 23 07 40 00",
    organizationNodeId: "seksjon-intensiv",
    type: "Seksjon",
    unitName: "Intensivseksjon",
  },
  
  // Seksjon Level - Overvåking
  {
    id: "contact-seksjon-overvaking-1",
    name: "Sara Vik",
    email: "sara.vik@ous.no",
    phone: "+47 23 07 41 00",
    organizationNodeId: "seksjon-overvaking",
    type: "Seksjon",
    unitName: "Overvåkingsseksjon",
  },
  
  // Seksjon Level - Konsultasjon
  {
    id: "contact-seksjon-konsultasjon-1",
    name: "Hans Moe",
    email: "hans.moe@ous.no",
    phone: "+47 23 07 42 00",
    organizationNodeId: "seksjon-konsultasjon",
    type: "Seksjon",
    unitName: "Konsultasjonsseksjon",
  },
  
  // Seksjon Level - Dagkirurgi
  {
    id: "contact-seksjon-dag-kirurgi-1",
    name: "Ida Lund",
    email: "ida.lund@ous.no",
    phone: "+47 23 07 43 00",
    organizationNodeId: "seksjon-dag-kirurgi",
    type: "Seksjon",
    unitName: "Dagkirurgi",
  },
];

// Mock Supervisors for Oslo University Hospital HF
export const mockSupervisorsOslo: Supervisor[] = [
  // Akuttavdeling supervisors
  {
    id: "supervisor-akutt-1",
    name: "Dr. Anna Hansen",
    email: "anna.hansen@ous.no",
    phone: "+47 23 07 50 00",
    specialization: "Emergency Medicine",
    organizationNodeId: "avd-akutt-ortopedi",
    type: "Avdeling",
    unitName: "Akuttavdeling",
    isActive: true,
    assignedStudents: 2,
  },
  {
    id: "supervisor-akutt-2",
    name: "Dr. Lars Olsen",
    email: "lars.olsen@ous.no",
    phone: "+47 23 07 50 01",
    specialization: "Orthopedic Surgery",
    organizationNodeId: "avd-akutt-ortopedi",
    type: "Avdeling",
    unitName: "Akuttavdeling",
    isActive: true,
    assignedStudents: 3,
  },
  {
    id: "supervisor-akutt-3",
    name: "Dr. Sofia Berg",
    email: "sofia.berg@ous.no",
    phone: "+47 23 07 50 02",
    specialization: "Trauma Care",
    organizationNodeId: "avd-akutt-ortopedi",
    type: "Avdeling",
    unitName: "Akuttavdeling",
    isActive: false,
    assignedStudents: 0,
  },
  
  // Intensivseksjon supervisors
  {
    id: "supervisor-intensiv-1",
    name: "Dr. Erik Svendsen",
    email: "erik.svendsen@ous.no",
    phone: "+47 23 07 51 00",
    specialization: "Intensive Care",
    organizationNodeId: "seksjon-intensiv",
    type: "Seksjon",
    unitName: "Intensivseksjon",
    isActive: true,
    assignedStudents: 4,
  },
  {
    id: "supervisor-intensiv-2",
    name: "Dr. Maria Halvorsen",
    email: "maria.halvorsen@ous.no",
    phone: "+47 23 07 51 01",
    specialization: "Critical Care Nursing",
    organizationNodeId: "seksjon-intensiv",
    type: "Seksjon",
    unitName: "Intensivseksjon",
    isActive: true,
    assignedStudents: 2,
  },
  
  // Overvåkingsseksjon supervisors
  {
    id: "supervisor-overvaking-1",
    name: "Dr. Knut Pedersen",
    email: "knut.pedersen@ous.no",
    phone: "+47 23 07 52 00",
    specialization: "Anesthesiology",
    organizationNodeId: "seksjon-overvaking",
    type: "Seksjon",
    unitName: "Overvåkingsseksjon",
    isActive: true,
    assignedStudents: 1,
  },
  
  // Poliklinikk supervisors
  {
    id: "supervisor-poliklinikk-1",
    name: "Dr. Hanna Johansen",
    email: "hanna.johansen@ous.no",
    phone: "+47 23 07 53 00",
    specialization: "Orthopedic Outpatient Care",
    organizationNodeId: "avd-poliklinikk-ortopedi",
    type: "Avdeling",
    unitName: "Poliklinikk",
    isActive: true,
    assignedStudents: 2,
  },
  {
    id: "supervisor-poliklinikk-2",
    name: "Dr. Anders Nilsen",
    email: "anders.nilsen@ous.no",
    phone: "+47 23 07 53 01",
    specialization: "Physical Therapy",
    organizationNodeId: "avd-poliklinikk-ortopedi",
    type: "Avdeling",
    unitName: "Poliklinikk",
    isActive: true,
    assignedStudents: 3,
  },
  
  // Konsultasjonsseksjon supervisors
  {
    id: "supervisor-konsultasjon-1",
    name: "Dr. Ingrid Lund",
    email: "ingrid.lund@ous.no",
    phone: "+47 23 07 54 00",
    specialization: "Consultation Services",
    organizationNodeId: "seksjon-konsultasjon",
    type: "Seksjon",
    unitName: "Konsultasjonsseksjon",
    isActive: true,
    assignedStudents: 1,
  },
  
  // Generell kirurgi supervisors
  {
    id: "supervisor-generell-kirurgi-1",
    name: "Dr. Thomas Holm",
    email: "thomas.holm@ous.no",
    phone: "+47 23 07 55 00",
    specialization: "General Surgery",
    organizationNodeId: "avd-generell-kirurgi",
    type: "Avdeling",
    unitName: "Generell kirurgi",
    isActive: true,
    assignedStudents: 3,
  },
  {
    id: "supervisor-generell-kirurgi-2",
    name: "Dr. Lisa Strand",
    email: "lisa.strand@ous.no",
    phone: "+47 23 07 55 01",
    specialization: "Surgical Nursing",
    organizationNodeId: "avd-generell-kirurgi",
    type: "Avdeling",
    unitName: "Generell kirurgi",
    isActive: false,
    assignedStudents: 0,
  },
  
  // Dagkirurgi supervisors
  {
    id: "supervisor-dagkirurgi-1",
    name: "Dr. Emma Vik",
    email: "emma.vik@ous.no",
    phone: "+47 23 07 56 00",
    specialization: "Day Surgery",
    organizationNodeId: "seksjon-dag-kirurgi",
    type: "Seksjon",
    unitName: "Dagkirurgi",
    isActive: true,
    assignedStudents: 2,
  },
  
  // Karkirurgi supervisors
  {
    id: "supervisor-karkirurgi-1",
    name: "Dr. Jonas Bakke",
    email: "jonas.bakke@ous.no",
    phone: "+47 23 07 57 00",
    specialization: "Vascular Surgery",
    organizationNodeId: "avd-karkirurgi",
    type: "Avdeling",
    unitName: "Karkirurgi",
    isActive: true,
    assignedStudents: 2,
  },
  {
    id: "supervisor-karkirurgi-2",
    name: "Dr. Kristine Dahl",
    email: "kristine.dahl@ous.no",
    phone: "+47 23 07 57 01",
    specialization: "Vascular Nursing",
    organizationNodeId: "avd-karkirurgi",
    type: "Avdeling",
    unitName: "Karkirurgi",
    isActive: true,
    assignedStudents: 1,
  },
  
  // Emergency Department supervisors
  {
    id: "supervisor-emergency-1",
    name: "Dr. Robert Moe",
    email: "robert.moe@ous.no",
    phone: "+47 23 07 58 00",
    specialization: "Emergency Medicine",
    organizationNodeId: "avd-emergency",
    type: "Avdeling",
    unitName: "Emergency Department",
    isActive: true,
    assignedStudents: 4,
  },
  {
    id: "supervisor-emergency-2",
    name: "Dr. Linda Hauge",
    email: "linda.hauge@ous.no",
    phone: "+47 23 07 58 01",
    specialization: "Emergency Nursing",
    organizationNodeId: "avd-emergency",
    type: "Avdeling",
    unitName: "Emergency Department",
    isActive: true,
    assignedStudents: 3,
  },
];

// Mock Contacts for Bergen Kommune
export const mockContactsBergen: Contact[] = [
  // Kommune Level
  {
    id: "contact-kommune-bergen-1",
    name: "Gunnar Solberg",
    email: "gunnar.solberg@bergen.kommune.no",
    phone: "+47 55 56 60 00",
    organizationNodeId: "kommune-bergen",
    type: "Kommune",
    unitName: "Bergen Kommune",
  },
  {
    id: "contact-kommune-bergen-2",
    name: "Berit Lunde",
    email: "berit.lunde@bergen.kommune.no",
    phone: "+47 55 56 60 01",
    organizationNodeId: "kommune-bergen",
    type: "Kommune",
    unitName: "Bergen Kommune",
  },
  
  // Sykehjem Level - Solhaugen
  {
    id: "contact-sykehjem-solhaugen-1",
    name: "Odd Knutsen",
    email: "odd.knutsen@bergen.kommune.no",
    phone: "+47 55 56 61 00",
    organizationNodeId: "sykehjem-solhaugen",
    type: "Sykehjem",
    unitName: "Solhaugen Sykehjem",
  },
  
  // Sykehjem Level - Fjellsiden
  {
    id: "contact-sykehjem-fjellsiden-1",
    name: "Randi Lie",
    email: "randi.lie@bergen.kommune.no",
    phone: "+47 55 56 62 00",
    organizationNodeId: "sykehjem-fjellsiden",
    type: "Sykehjem",
    unitName: "Fjellsiden Sykehjem",
  },
  
  // Sykehjem Level - Strandsiden
  {
    id: "contact-sykehjem-strandsiden-1",
    name: "Svein Amundsen",
    email: "svein.amundsen@bergen.kommune.no",
    phone: "+47 55 56 63 00",
    organizationNodeId: "sykehjem-strandsiden",
    type: "Sykehjem",
    unitName: "Strandsiden Omsorgssenter",
  },
  
  // Avdeling Level - Demens
  {
    id: "contact-avd-demens-1",
    name: "Grete Fjeld",
    email: "grete.fjeld@bergen.kommune.no",
    phone: "+47 55 56 64 00",
    organizationNodeId: "avd-demens",
    type: "Avdeling",
    unitName: "Demensavdeling",
  },
  
  // Avdeling Level - Langtid
  {
    id: "contact-avd-langtid-1",
    name: "Harald Viken",
    email: "harald.viken@bergen.kommune.no",
    phone: "+47 55 56 65 00",
    organizationNodeId: "avd-langtid",
    type: "Avdeling",
    unitName: "Langtidsavdeling",
  },
  
  // Avdeling Level - Korttid
  {
    id: "contact-avd-korttid-1",
    name: "Monica Henriksen",
    email: "monica.henriksen@bergen.kommune.no",
    phone: "+47 55 56 66 00",
    organizationNodeId: "avd-korttid",
    type: "Avdeling",
    unitName: "Korttidsavdeling",
  },
  
  // Avdeling Level - Dagaktivitet
  {
    id: "contact-avd-dagaktivitet-1",
    name: "Kjetil Aas",
    email: "kjetil.aas@bergen.kommune.no",
    phone: "+47 55 56 67 00",
    organizationNodeId: "avd-dagaktivitet",
    type: "Avdeling",
    unitName: "Dagaktivitetsavdeling",
  },
];

// Mock Supervisors for Bergen Kommune
export const mockSupervisorsBergen: Supervisor[] = [
  // Demensavdeling supervisors
  {
    id: "supervisor-demens-1",
    name: "Solveig Moen",
    email: "solveig.moen@bergen.kommune.no",
    phone: "+47 55 56 70 00",
    specialization: "Dementia Care",
    organizationNodeId: "avd-demens",
    type: "Avdeling",
    unitName: "Demensavdeling",
    isActive: true,
    assignedStudents: 3,
  },
  {
    id: "supervisor-demens-2",
    name: "Tore Haugen",
    email: "tore.haugen@bergen.kommune.no",
    phone: "+47 55 56 70 01",
    specialization: "Geriatric Nursing",
    organizationNodeId: "avd-demens",
    type: "Avdeling",
    unitName: "Demensavdeling",
    isActive: true,
    assignedStudents: 2,
  },
  
  // Gruppe A supervisors
  {
    id: "supervisor-gruppe-a-1",
    name: "Liv Christiansen",
    email: "liv.christiansen@bergen.kommune.no",
    phone: "+47 55 56 71 00",
    specialization: "Dementia Group Care",
    organizationNodeId: "gruppe-a-demens",
    type: "Gruppe",
    unitName: "Gruppe A",
    isActive: true,
    assignedStudents: 1,
  },
  
  // Gruppe B supervisors
  {
    id: "supervisor-gruppe-b-1",
    name: "Arne Sørensen",
    email: "arne.sorensen@bergen.kommune.no",
    phone: "+47 55 56 72 00",
    specialization: "Dementia Group Care",
    organizationNodeId: "gruppe-b-demens",
    type: "Gruppe",
    unitName: "Gruppe B",
    isActive: true,
    assignedStudents: 2,
  },
  
  // Langtidsavdeling supervisors
  {
    id: "supervisor-langtid-1",
    name: "Astrid Olsen",
    email: "astrid.olsen@bergen.kommune.no",
    phone: "+47 55 56 73 00",
    specialization: "Long-term Care",
    organizationNodeId: "avd-langtid",
    type: "Avdeling",
    unitName: "Langtidsavdeling",
    isActive: true,
    assignedStudents: 2,
  },
  {
    id: "supervisor-langtid-2",
    name: "Frode Berg",
    email: "frode.berg@bergen.kommune.no",
    phone: "+47 55 56 73 01",
    specialization: "Elderly Care",
    organizationNodeId: "avd-langtid",
    type: "Avdeling",
    unitName: "Langtidsavdeling",
    isActive: false,
    assignedStudents: 0,
  },
  
  // Korttidsavdeling supervisors
  {
    id: "supervisor-korttid-1",
    name: "Ingeborg Holm",
    email: "ingeborg.holm@bergen.kommune.no",
    phone: "+47 55 56 74 00",
    specialization: "Short-term Care",
    organizationNodeId: "avd-korttid",
    type: "Avdeling",
    unitName: "Korttidsavdeling",
    isActive: true,
    assignedStudents: 3,
  },
  {
    id: "supervisor-korttid-2",
    name: "Bjørn Larsen",
    email: "bjorn.larsen@bergen.kommune.no",
    phone: "+47 55 56 74 01",
    specialization: "Rehabilitation Nursing",
    organizationNodeId: "avd-korttid",
    type: "Avdeling",
    unitName: "Korttidsavdeling",
    isActive: true,
    assignedStudents: 2,
  },
  
  // Rehabiliteringsgruppe supervisors
  {
    id: "supervisor-rehab-1",
    name: "Marit Strand",
    email: "marit.strand@bergen.kommune.no",
    phone: "+47 55 56 75 00",
    specialization: "Rehabilitation",
    organizationNodeId: "gruppe-rehabilitering",
    type: "Gruppe",
    unitName: "Rehabiliteringsgruppe",
    isActive: true,
    assignedStudents: 2,
  },
  
  // Dagaktivitetsavdeling supervisors
  {
    id: "supervisor-dagaktivitet-1",
    name: "Silje Iversen",
    email: "silje.iversen@bergen.kommune.no",
    phone: "+47 55 56 76 00",
    specialization: "Day Activity Programs",
    organizationNodeId: "avd-dagaktivitet",
    type: "Avdeling",
    unitName: "Dagaktivitetsavdeling",
    isActive: true,
    assignedStudents: 1,
  },
  {
    id: "supervisor-dagaktivitet-2",
    name: "Henrik Bakken",
    email: "henrik.bakken@bergen.kommune.no",
    phone: "+47 55 56 76 01",
    specialization: "Recreational Therapy",
    organizationNodeId: "avd-dagaktivitet",
    type: "Avdeling",
    unitName: "Dagaktivitetsavdeling",
    isActive: true,
    assignedStudents: 2,
  },
];

// Combined exports
export const allMockContacts = [...mockContactsOslo, ...mockContactsBergen];
export const allMockSupervisors = [...mockSupervisorsOslo, ...mockSupervisorsBergen];
