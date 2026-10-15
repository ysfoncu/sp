// Publishing a placement happens in two steps, both mandatory:
//   1. Publish to entities  (task "7"): the placement is visible to the entities. Entity-side visibility is not
//      built in this prototype, so it only records the fact. The assignments are locked from here on.
//   2. Publish to students  (task "8"): the students can see their placement. Assignments are booked and what
//      each student is told is frozen (a snapshot).
// Students can only be published after the entities. "Edit" unlocks everything again ("Cancel edit" gives it back).
// `assignmentPublished` is the students' flag, as it was when there was a single publish step.
export type PublishState = "none" | "entities" | "students";

export interface PublishFlags {
  entitiesPublished?: boolean;
  assignmentPublished?: boolean;
}

// Published to students wins: a placement saved before the split (assignmentPublished only) is fully published
export const publishState = (s: PublishFlags): PublishState => (s.assignmentPublished ? "students" : s.entitiesPublished ? "entities" : "none");

export const canPublishToStudents = (state: PublishState) => state === "entities";

// Anything published locks the assignments, and Edit unlocks them
export const isLocked = (state: PublishState) => state !== "none";

// The task ids that are done in a state: "7" Publish to entities, "8" Publish to students
export const publishedTaskIds = (state: PublishState): string[] => (state === "students" ? ["7", "8"] : state === "entities" ? ["7"] : []);

export const ENTITIES_TASK_ID = "7";
export const STUDENTS_TASK_ID = "8";

// A saved task state made with the single publish step: published to students means published to entities too,
// and "7" done without "8" meant fully published
export const normalizePublish = <
  T extends PublishFlags & { completedTasks: string[]; assignmentPublishedDate?: string; entitiesPublishedDate?: string },
>(
  s: T,
): T & { entitiesPublished: boolean; assignmentPublished: boolean } => {
  const legacyDone = s.completedTasks.includes("7") && !s.completedTasks.includes("8") && s.entitiesPublished === undefined;
  const students = !!s.assignmentPublished || legacyDone;
  const entities = !!s.entitiesPublished || students;
  const completed = new Set(s.completedTasks);
  publishedTaskIds(publishState({ entitiesPublished: entities, assignmentPublished: students })).forEach((id) => completed.add(id));
  return {
    ...s,
    entitiesPublished: entities,
    assignmentPublished: students,
    entitiesPublishedDate: s.entitiesPublishedDate ?? (entities ? s.assignmentPublishedDate : undefined),
    completedTasks: [...completed],
  };
};
