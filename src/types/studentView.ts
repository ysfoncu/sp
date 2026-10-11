// What a student is told about a placement: the entity's information, the contacts shown to students,
// the mentor and the dates. A snapshot of it is taken when the assignments are published, so later edits
// to the entity don't silently change what published students were told.
import { PlacementInfo, PlacementProfile, ResolvedContact, resolveContacts } from "./placementProfile";
import { PlaceContact } from "./placeContact";

export interface StudentViewPerson {
  name: string;
  detail: string;
  email: string;
  phone: string;
  photo?: string;
  about?: string;
}

export interface StudentView {
  profileName: string;
  placeName: string;
  unitName: string;
  startDate?: string;
  endDate?: string;
  info: PlacementInfo;
  contacts: StudentViewPerson[];
  mentor?: StudentViewPerson;
}

// Taken at publish: the view plus the profile version it came from
export interface PublishedSnapshot {
  version: number;
  takenAt: string;
  view: StudentView;
}

const personOf = (c: ResolvedContact): StudentViewPerson => ({
  name: c.name,
  detail: c.role,
  email: c.email,
  phone: c.phone,
  photo: c.photo || undefined,
  about: c.about || undefined,
});

export const buildStudentView = (
  profile: PlacementProfile,
  assignment: {
    placeName: string;
    departmentName?: string;
    startDate?: string;
    endDate?: string;
    mentor?: { personType: string; personId: string; name: string };
  },
  people: PlaceContact[],
): StudentView => {
  const contacts = resolveContacts(profile, people);
  const mentorContact = assignment.mentor ? contacts.find((c) => c.id === assignment.mentor?.personId) : undefined;
  return {
    profileName: profile.name,
    placeName: assignment.placeName,
    unitName: profile.name,
    startDate: assignment.startDate?.slice(0, 10),
    endDate: assignment.endDate?.slice(0, 10),
    // A copy, so a later edit of the entity can't reach into a stored snapshot
    info: JSON.parse(JSON.stringify(profile.info)),
    contacts: contacts.filter((c) => c.availableToStudents).map(personOf),
    mentor: assignment.mentor
      ? mentorContact
        ? personOf(mentorContact)
        : { name: assignment.mentor.name, detail: "", email: "", phone: "" }
      : undefined,
  };
};

export const takeSnapshot = (profile: PlacementProfile, view: StudentView, now = new Date()): PublishedSnapshot => ({
  version: profile.version,
  takenAt: now.toISOString(),
  view,
});

// Has what students would be told changed since the snapshot? Compares the content, not the version:
// the version doesn't move when only the information text is edited.
export const viewChangedSince = (snapshot: PublishedSnapshot | undefined, current: StudentView | undefined) =>
  !!snapshot && !!current && JSON.stringify(snapshot.view) !== JSON.stringify(current);

export { missingInfo } from "./placementProfile";
